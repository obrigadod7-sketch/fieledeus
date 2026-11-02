import hashlib
import hmac
import logging
import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query

SUBSCRIPTION_PRICE = 19.90
SUBSCRIPTION_DAYS = 30
PLATFORM_FEE_RATE = 0.10
MP_API = 'https://api.mercadopago.com'


def _now():
    return datetime.now(timezone.utc)


def build_billing(db, get_current_user):
    router = APIRouter(prefix='/api')

    async def mp(method, path, json=None, idem=None):
        token = os.environ.get('MP_ACCESS_TOKEN')
        if not token:
            raise HTTPException(status_code=503, detail='Pagamento PIX ainda não configurado')
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        if idem:
            headers['X-Idempotency-Key'] = idem
        async with httpx.AsyncClient(base_url=MP_API, timeout=20) as c:
            r = await c.request(method, path, headers=headers, json=json)
        if r.is_error:
            logging.warning('Mercado Pago error %s: %s', r.status_code, r.text[:300])
            raise HTTPException(status_code=502, detail='Erro ao comunicar com o PIX. Tente novamente.')
        return r.json()

    async def subscription_info(user_id):
        doc = await db.subscriptions.find_one({'user_id': user_id}, {'_id': 0})
        expires = doc.get('expires_at') if doc else None
        active = bool(expires and datetime.fromisoformat(expires) > _now())
        return {'active': active, 'expires_at': expires, 'price': SUBSCRIPTION_PRICE}

    async def ensure_subscribed(user):
        if user.role == 'admin':
            return
        if not (await subscription_info(user.id))['active']:
            raise HTTPException(status_code=402, detail='Assine o plano de R$ 19,90/mês para conversar e agendar')

    async def create_pix(user, amount, description, kind, extra):
        internal_id = str(uuid.uuid4())
        expires = _now() + timedelta(hours=24)
        payload = {
            'transaction_amount': round(float(amount), 2),
            'description': description,
            'payment_method_id': 'pix',
            'payer': {'email': user.email, 'first_name': user.name},
            'external_reference': internal_id,
            'date_of_expiration': expires.strftime('%Y-%m-%dT%H:%M:%S.000-00:00'),
        }
        public_url = os.environ.get('BACKEND_PUBLIC_URL')
        if public_url:
            payload['notification_url'] = f"{public_url.rstrip('/')}/api/webhooks/mercadopago"
        p = await mp('POST', '/v1/payments', json=payload, idem=internal_id)
        td = (p.get('point_of_interaction') or {}).get('transaction_data') or {}
        doc = {
            'id': internal_id, 'provider_payment_id': str(p['id']), 'user_id': user.id,
            'kind': kind, 'amount': payload['transaction_amount'], 'status': p.get('status', 'pending'),
            'qr_code': td.get('qr_code'), 'qr_code_base64': td.get('qr_code_base64'),
            'ticket_url': td.get('ticket_url'), 'expires_at': expires.isoformat(),
            'applied': False, 'created_at': _now().isoformat(), **extra,
        }
        await db.payments.insert_one(doc)
        doc.pop('_id', None)
        await apply_payment(doc)
        return public_payment(doc)

    def public_payment(doc):
        keys = ('id', 'kind', 'amount', 'status', 'qr_code', 'qr_code_base64', 'ticket_url', 'expires_at')
        return {k: doc.get(k) for k in keys}

    async def apply_payment(pay):
        if pay.get('status') != 'approved' or pay.get('applied'):
            return
        res = await db.payments.update_one({'id': pay['id'], 'applied': {'$ne': True}}, {'$set': {'applied': True}})
        if res.modified_count == 0:
            return
        pay['applied'] = True
        if pay['kind'] == 'subscription':
            current = await subscription_info(pay['user_id'])
            base = datetime.fromisoformat(current['expires_at']) if current['active'] else _now()
            await db.subscriptions.update_one(
                {'user_id': pay['user_id']},
                {'$set': {'user_id': pay['user_id'], 'expires_at': (base + timedelta(days=SUBSCRIPTION_DAYS)).isoformat(),
                          'updated_at': _now().isoformat()}},
                upsert=True)
        elif pay['kind'] == 'booking':
            msg = await db.messages.find_one({'id': pay['message_id']}, {'_id': 0})
            if not msg:
                return
            await db.messages.update_one({'id': pay['message_id']}, {'$set': {'appointment.payment_status': 'paid'}})
            other = msg['to_user_id'] if msg['from_user_id'] == pay['user_id'] else msg['from_user_id']
            await db.messages.insert_one({
                'id': str(uuid.uuid4()), 'from_user_id': pay['user_id'], 'to_user_id': other,
                'message': f"Pagamento de R$ {pay['amount']:.2f} confirmado via PIX.".replace('.', ','),
                'created_at': _now().isoformat(), 'media': [],
                'appointment_update': {'ref_id': pay['message_id'], 'status': 'paid'},
            })

    async def refresh(pay):
        if pay.get('status') in ('approved', 'rejected', 'cancelled', 'refunded'):
            return pay
        p = await mp('GET', f"/v1/payments/{pay['provider_payment_id']}")
        pay['status'] = p.get('status', pay.get('status'))
        await db.payments.update_one({'id': pay['id']}, {'$set': {'status': pay['status'], 'updated_at': _now().isoformat()}})
        await apply_payment(pay)
        return pay

    @router.get('/subscription')
    async def get_subscription(current_user=Depends(get_current_user)):
        info = await subscription_info(current_user.id)
        info['exempt'] = current_user.role == 'admin'
        return info

    @router.post('/subscription/pix')
    async def subscription_pix(current_user=Depends(get_current_user)):
        return await create_pix(current_user, SUBSCRIPTION_PRICE, 'Assinatura mensal Watizat', 'subscription', {})

    @router.post('/appointments/{message_id}/pix')
    async def appointment_pix(message_id: str, current_user=Depends(get_current_user)):
        msg = await db.messages.find_one({'id': message_id, 'appointment': {'$exists': True}}, {'_id': 0})
        appt = (msg or {}).get('appointment') or {}
        if not msg or appt.get('payer_id') != current_user.id:
            raise HTTPException(status_code=404, detail='Agendamento não encontrado')
        if appt.get('status') != 'accepted':
            raise HTTPException(status_code=400, detail='O profissional precisa aceitar antes do pagamento')
        if not appt.get('price') or appt.get('payment_status') == 'paid':
            raise HTTPException(status_code=400, detail='Nada a pagar neste agendamento')
        price = float(appt['price'])
        fee = round(price * PLATFORM_FEE_RATE, 2)
        return await create_pix(current_user, price, 'Serviço agendado no Watizat', 'booking', {
            'message_id': message_id, 'professional_id': appt.get('professional_id'),
            'platform_fee': fee, 'professional_amount': round(price - fee, 2)})

    @router.get('/payments/{payment_id}')
    async def payment_status(payment_id: str, current_user=Depends(get_current_user)):
        pay = await db.payments.find_one({'id': payment_id, 'user_id': current_user.id}, {'_id': 0})
        if not pay:
            raise HTTPException(status_code=404, detail='Pagamento não encontrado')
        return public_payment(await refresh(pay))

    def valid_signature(x_signature, x_request_id, data_id):
        secret = os.environ.get('MP_WEBHOOK_SECRET')
        if not secret:
            return True
        parts = dict(p.strip().split('=', 1) for p in (x_signature or '').split(',') if '=' in p)
        ts, v1 = parts.get('ts'), parts.get('v1')
        if not ts or not v1 or not data_id:
            return False
        n = int(ts)
        n = n / 1000 if n > 10_000_000_000 else n
        if abs(time.time() - n) > 600:
            return False
        manifest = f"id:{data_id};request-id:{x_request_id or ''};ts:{ts};"
        expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, v1)

    @router.post('/webhooks/mercadopago')
    async def mercadopago_webhook(
        x_signature: str = Header(None), x_request_id: str = Header(None),
        data_id: str = Query(None, alias='data.id'), id: str = Query(None), type: str = Query(None),
    ):
        provider_id = data_id or id
        if not valid_signature(x_signature, x_request_id, provider_id):
            raise HTTPException(status_code=401, detail='invalid signature')
        if type not in (None, 'payment') or not provider_id:
            return {'accepted': True}
        pay = await db.payments.find_one({'provider_payment_id': str(provider_id)}, {'_id': 0})
        if pay:
            await refresh(pay)
        return {'accepted': True}

    @router.get('/admin/payments')
    async def admin_payments(current_user=Depends(get_current_user)):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail='Admin only')
        return await db.payments.find({}, {'_id': 0, 'qr_code_base64': 0, 'qr_code': 0}).sort('created_at', -1).to_list(500)

    return router, ensure_subscribed
