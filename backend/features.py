import os
import re
import uuid
import hashlib
import secrets
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from pydantic import BaseModel, Field, EmailStr

logger = logging.getLogger(__name__)

HELPER_ROLES = {'helper', 'volunteer', 'association', 'admin'}
MODALITIES = {'video', 'request_address', 'my_address', 'other_address'}
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "fieledeus"
VIDEO_MAX_BYTES = 50 * 1024 * 1024
_storage_key = None
_video_cache = {}
VIDEO_EXTS = {'mp4': 'video/mp4', 'mov': 'video/quicktime', 'webm': 'video/webm', 'm4v': 'video/x-m4v', '3gp': 'video/3gpp',
              'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska', 'ogv': 'video/ogg'}


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _storage_call(method: str, path: str, **kw):
    for attempt in range(2):
        resp = requests.request(method, f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(force=attempt > 0), **kw.pop('headers', {})}, timeout=180, **kw)
        if resp.status_code != 404 or attempt:
            resp.raise_for_status()
            return resp
    return resp


class AppointmentCreate(BaseModel):
    to_user_id: str
    date: str
    start_time: str
    end_time: str
    modality: str
    address: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class Reschedule(BaseModel):
    date: str
    start_time: str
    end_time: str
    note: Optional[str] = Field(default=None, max_length=300)


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    password: str = Field(min_length=6)


def _validate_slot(date: str, start: str, end: str):
    try:
        s = datetime.fromisoformat(f"{date}T{start}")
        e = datetime.fromisoformat(f"{date}T{end}")
    except ValueError:
        raise HTTPException(400, "Data ou horário inválido")
    if e <= s:
        raise HTTPException(400, "O horário de fim deve ser depois do início")
    if s.date() < datetime.now(timezone.utc).date() - timedelta(days=1):
        raise HTTPException(400, "Escolha uma data futura")


def _public(appt: dict, viewer_id: str) -> dict:
    appt = {k: v for k, v in appt.items() if k != '_id'}
    hidden = appt['status'] != 'accepted' and viewer_id != appt['proposer_id']
    if hidden and appt['modality'] != 'video':
        appt['address'] = None
        appt['notes'] = None
        appt['details_hidden'] = True
    if hidden and appt['modality'] == 'video':
        appt['meeting_url'] = None
        appt['notes'] = None
        appt['details_hidden'] = True
    return appt


def build_router(db, get_current_user) -> APIRouter:
    router = APIRouter()
    gridfs = AsyncIOMotorGridFSBucket(db, bucket_name='videos')

    async def chat_event(from_id: str, to_id: str, text: str, appt_id: str = None, extra: dict = None):
        await db.messages.insert_one({
            'id': str(uuid.uuid4()), 'from_user_id': from_id, 'to_user_id': to_id, 'message': text,
            'created_at': datetime.now(timezone.utc).isoformat(), 'appointment_id': appt_id,
            'location': None, 'media': [], 'media_type': None, **(extra or {}),
        })

    async def load(appt_id: str, user_id: str) -> dict:
        appt = await db.appointments.find_one({'id': appt_id}, {'_id': 0})
        if not appt or user_id not in (appt['proposer_id'], appt['invitee_id']):
            raise HTTPException(404, "Agendamento não encontrado")
        return appt

    async def resolve_address(modality: str, proposer, invitee_id: str, address: Optional[str]):
        if modality == 'video':
            return None
        if modality == 'other_address':
            if not (address or '').strip():
                raise HTTPException(400, "Informe o endereço")
            return address.strip()
        if modality == 'my_address':
            me = await db.users.find_one({'id': proposer.id}, {'_id': 0, 'location': 1})
            addr = ((me or {}).get('location') or {}).get('address')
            return address or addr or 'Endereço do voluntário (combinar no chat)'
        post = await db.posts.find_one({'user_id': invitee_id, 'type': 'need', 'location': {'$ne': None}}, {'_id': 0, 'location': 1}, sort=[('created_at', -1)])
        addr = ((post or {}).get('location') or {}).get('address')
        return address or addr or 'Endereço da solicitação (combinar no chat)'

    @router.post("/appointments")
    async def create_appointment(data: AppointmentCreate, current_user=Depends(get_current_user)):
        if current_user.role not in HELPER_ROLES:
            raise HTTPException(403, "Apenas quem oferece ajuda pode propor um agendamento")
        if data.modality not in MODALITIES:
            raise HTTPException(400, "Modalidade inválida")
        if data.to_user_id == current_user.id:
            raise HTTPException(400, "Destinatário inválido")
        other = await db.users.find_one({'id': data.to_user_id}, {'_id': 0, 'id': 1, 'name': 1})
        if not other:
            raise HTTPException(404, "Usuário não encontrado")
        _validate_slot(data.date, data.start_time, data.end_time)
        now = datetime.now(timezone.utc).isoformat()
        appt = {
            'id': str(uuid.uuid4()), 'proposer_id': current_user.id, 'proposer_name': current_user.name,
            'invitee_id': data.to_user_id, 'invitee_name': other['name'],
            'date': data.date, 'start_time': data.start_time, 'end_time': data.end_time,
            'modality': data.modality, 'address': await resolve_address(data.modality, current_user, data.to_user_id, data.address),
            'notes': data.notes, 'status': 'pending', 'awaiting_user_id': data.to_user_id,
            'meeting_url': f"https://meet.jit.si/fieledeus-{uuid.uuid4().hex[:12]}" if data.modality == 'video' else None,
            'history': [{'by': current_user.id, 'action': 'proposed', 'date': data.date, 'start_time': data.start_time, 'end_time': data.end_time, 'at': now}],
            'created_at': now, 'updated_at': now,
        }
        await db.appointments.insert_one(dict(appt))
        await chat_event(current_user.id, data.to_user_id, "Proposta de encontro", appt['id'])
        return _public(appt, current_user.id)

    @router.get("/appointments")
    async def list_appointments(with_user: Optional[str] = None, current_user=Depends(get_current_user)):
        q = {'$or': [{'proposer_id': current_user.id}, {'invitee_id': current_user.id}]}
        if with_user:
            q = {'$or': [{'proposer_id': current_user.id, 'invitee_id': with_user}, {'proposer_id': with_user, 'invitee_id': current_user.id}]}
        items = await db.appointments.find(q, {'_id': 0}).sort([('date', 1), ('start_time', 1)]).to_list(500)
        return [_public(a, current_user.id) for a in items]

    async def respond(appt_id: str, current_user, action: str, slot: Optional[Reschedule] = None):
        appt = await load(appt_id, current_user.id)
        if appt['status'] in ('declined', 'cancelled'):
            raise HTTPException(400, "Este agendamento já foi encerrado")
        if action != 'cancelled' and appt.get('awaiting_user_id') != current_user.id:
            raise HTTPException(403, "Aguardando resposta da outra pessoa")
        other_id = appt['invitee_id'] if current_user.id == appt['proposer_id'] else appt['proposer_id']
        now = datetime.now(timezone.utc).isoformat()
        update = {'status': action, 'updated_at': now, 'awaiting_user_id': None}
        entry = {'by': current_user.id, 'action': action, 'at': now}
        if slot:
            _validate_slot(slot.date, slot.start_time, slot.end_time)
            update.update({'date': slot.date, 'start_time': slot.start_time, 'end_time': slot.end_time, 'status': 'rescheduled', 'awaiting_user_id': other_id})
            entry.update({'date': slot.date, 'start_time': slot.start_time, 'end_time': slot.end_time, 'note': slot.note})
        await db.appointments.update_one({'id': appt_id}, {'$set': update, '$push': {'history': entry}})
        labels = {'accepted': 'Agendamento aceito', 'declined': 'Agendamento recusado', 'cancelled': 'Agendamento cancelado', 'rescheduled': 'Novo horário proposto'}
        text = labels[update['status']] + (f" — {slot.note}" if slot and slot.note else '')
        await chat_event(current_user.id, other_id, text, appt_id)
        return _public(await load(appt_id, current_user.id), current_user.id)

    @router.post("/appointments/{appt_id}/accept")
    async def accept(appt_id: str, current_user=Depends(get_current_user)):
        return await respond(appt_id, current_user, 'accepted')

    @router.post("/appointments/{appt_id}/decline")
    async def decline(appt_id: str, current_user=Depends(get_current_user)):
        return await respond(appt_id, current_user, 'declined')

    @router.post("/appointments/{appt_id}/cancel")
    async def cancel(appt_id: str, current_user=Depends(get_current_user)):
        return await respond(appt_id, current_user, 'cancelled')

    @router.post("/appointments/{appt_id}/reschedule")
    async def reschedule(appt_id: str, slot: Reschedule, current_user=Depends(get_current_user)):
        return await respond(appt_id, current_user, 'rescheduled', slot)

    @router.post("/calls/{other_user_id}")
    async def start_call(other_user_id: str, mode: str = 'video', current_user=Depends(get_current_user)):
        if other_user_id == current_user.id or not await db.users.find_one({'id': other_user_id}, {'_id': 1}):
            raise HTTPException(404, "Usuário não encontrado")
        url = f"https://meet.jit.si/fieledeus-{uuid.uuid4().hex[:12]}" + ("#config.startWithVideoMuted=true" if mode == 'audio' else '')
        label = 'Chamada de voz' if mode == 'audio' else 'Chamada de vídeo'
        await chat_event(current_user.id, other_user_id, f"{label} iniciada", extra={'call_url': url, 'call_mode': mode})
        return {'url': url}

    @router.post("/uploads/video")
    async def upload_video(file: UploadFile = File(...), current_user=Depends(get_current_user)):
        ext = (file.filename or 'video.mp4').rsplit('.', 1)[-1].lower()[:5] or 'mp4'
        ctype = file.content_type or ''
        if not ctype.startswith('video/'):
            if ext not in VIDEO_EXTS:
                raise HTTPException(400, "Envie um arquivo de vídeo")
            ctype = VIDEO_EXTS[ext]
        data = await file.read()
        if not data:
            raise HTTPException(400, "Arquivo de vídeo vazio")
        if len(data) > VIDEO_MAX_BYTES:
            raise HTTPException(413, "Vídeo muito grande (máx. 50MB)")
        vid = str(uuid.uuid4())
        path = f"{APP_NAME}/videos/{current_user.id}/{vid}.{ext}"
        rec = {'id': vid, 'user_id': current_user.id, 'content_type': ctype, 'size': len(data), 'is_deleted': False,
               'created_at': datetime.now(timezone.utc).isoformat()}
        try:
            resp = await asyncio.to_thread(_storage_call, 'PUT', path, data=data, headers={'Content-Type': ctype})
            rec['storage_path'] = resp.json()['path']
        except Exception as e:
            logger.warning(f"Object storage failed, using GridFS: {e}")
            rec['gridfs_id'] = await gridfs.upload_from_stream(f"{vid}.{ext}", data, metadata={'content_type': ctype})
        await db.files.insert_one(rec)
        return {'id': vid, 'url': f"/api/videos/{vid}"}

    @router.get("/videos/{vid}")
    async def get_video(vid: str, request: Request):
        rec = await db.files.find_one({'id': vid, 'is_deleted': False}, {'_id': 0})
        if not rec:
            raise HTTPException(404, "Vídeo não encontrado")
        data = _video_cache.get(vid)
        if data is None:
            if rec.get('gridfs_id'):
                data = await (await gridfs.open_download_stream(rec['gridfs_id'])).read()
            else:
                data = (await asyncio.to_thread(_storage_call, 'GET', rec['storage_path'])).content
            if len(_video_cache) >= 20:
                _video_cache.pop(next(iter(_video_cache)))
            _video_cache[vid] = data
        size = len(data)
        headers = {'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=604800'}
        rng = request.headers.get('range')
        if rng and rng.startswith('bytes='):
            start_s, _, end_s = rng[6:].partition('-')
            start = int(start_s or 0)
            end = min(int(end_s) if end_s else size - 1, size - 1)
            if start >= size:
                return Response(status_code=416, headers={'Content-Range': f"bytes */{size}"})
            headers['Content-Range'] = f"bytes {start}-{end}/{size}"
            return Response(content=data[start:end + 1], status_code=206, media_type=rec['content_type'], headers=headers)
        return Response(content=data, media_type=rec['content_type'], headers=headers)

    @router.post("/auth/forgot-password")
    async def forgot_password(data: ForgotPassword):
        email = data.email.strip().lower()
        user = await db.users.find_one({'email': {'$regex': f'^{re.escape(email)}$', '$options': 'i'}}, {'_id': 0, 'id': 1, 'name': 1})
        if user:
            token = secrets.token_urlsafe(32)
            await db.password_reset_tokens.insert_one({
                'token_hash': hashlib.sha256(token.encode()).hexdigest(), 'user_id': user['id'], 'used': False,
                'expires_at': datetime.now(timezone.utc) + timedelta(hours=1),
            })
            link = f"{os.environ.get('FRONTEND_URL', '').rstrip('/')}/reset-password?token={token}"
            await asyncio.to_thread(send_reset_email, email, user.get('name', ''), link)
        return {'message': 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.'}

    @router.post("/auth/reset-password")
    async def reset_password(data: ResetPassword):
        rec = await db.password_reset_tokens.find_one({'token_hash': hashlib.sha256(data.token.encode()).hexdigest()})
        exp = rec and rec['expires_at']
        if exp is not None and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if not rec or rec.get('used') or exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Link inválido ou expirado")
        hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        await db.users.update_one({'id': rec['user_id']}, {'$set': {'password': hashed}})
        await db.password_reset_tokens.update_one({'_id': rec['_id']}, {'$set': {'used': True}})
        return {'message': 'Senha alterada com sucesso'}

    async def require_admin(current_user=Depends(get_current_user)):
        if current_user.role != 'admin':
            raise HTTPException(403, "Admin only")
        return current_user

    @router.get("/associations")
    async def list_associations(current_user=Depends(get_current_user)):
        fields = {'_id': 0, 'id': 1, 'name': 1, 'organization': 1, 'bio': 1, 'phone': 1, 'website': 1, 'city': 1,
                  'location': 1, 'help_categories': 1, 'avatar_version': 1, 'created_at': 1}
        return await db.users.find({'role': 'association', 'blocked': {'$ne': True}}, fields).sort('created_at', -1).to_list(500)

    @router.put("/admin/users/{user_id}/block")
    async def block_user(user_id: str, body: dict, admin=Depends(require_admin)):
        if user_id == admin.id:
            raise HTTPException(400, "Você não pode bloquear a si mesmo")
        target = await db.users.find_one({'id': user_id}, {'_id': 0, 'role': 1})
        if body.get('blocked') and target and target.get('role') == 'admin':
            raise HTTPException(400, "Não é possível bloquear um administrador")
        res = await db.users.update_one({'id': user_id}, {'$set': {'blocked': bool(body.get('blocked'))}})
        if not res.matched_count:
            raise HTTPException(404, "Usuário não encontrado")
        return {'blocked': bool(body.get('blocked'))}

    @router.get("/admin/appointments")
    async def admin_appointments(admin=Depends(require_admin)):
        return await db.appointments.find({}, {'_id': 0, 'history': 0}).sort('created_at', -1).to_list(1000)

    return router


def send_reset_email(email: str, name: str, link: str):
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        logger.warning(f"[MOCK EMAIL] RESEND_API_KEY ausente. Link de redefinição para {email}: {link}")
        return
    try:
        import resend
        resend.api_key = api_key
        resend.Emails.send({
            'from': os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev'), 'to': [email],
            'subject': 'Redefinir sua senha',
            'html': f"<p>Olá {name},</p><p>Clique no link abaixo para criar uma nova senha (válido por 1 hora):</p><p><a href='{link}'>Redefinir senha</a></p><p>Se você não pediu, ignore este e-mail.</p>",
        })
    except Exception as e:
        logger.error(f"Reset email failed: {e}")
