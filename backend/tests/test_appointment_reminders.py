# Appointment reminder (24h before accepted appointment) + chat regression
import os
import time
import uuid
import subprocess
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
TZ = ZoneInfo('America/Sao_Paulo')
STATE = {}


def register(role):
    email = f"test_rem_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": "Test1234", "name": f"TEST_{role}", "role": role, "languages": ["pt"]})
    assert r.status_code in (200, 201), r.text
    d = r.json()
    return d.get('token') or d.get('access_token'), d['user']['id']


def h(t):
    return {"Authorization": f"Bearer {t}"}


def create_appt(ta, b_id, when):
    r = requests.post(f"{BASE_URL}/api/appointments", headers=h(ta), json={
        "to_user_id": b_id, "date": when.strftime('%Y-%m-%d'), "time": when.strftime('%H:%M'),
        "mode": "video", "info": "TEST", "acknowledged": True})
    assert r.status_code == 200, r.text
    return r.json()['id']


def reminders(ta, b_id):
    r = requests.get(f"{BASE_URL}/api/messages/{b_id}", headers=h(ta))
    assert r.status_code == 200
    return [m for m in r.json() if (m.get('appointment_update') or {}).get('status') == 'reminder']


def restart_backend():
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=True)
    for _ in range(30):
        time.sleep(2)
        try:
            if requests.get(f"{BASE_URL}/api/", timeout=5).status_code < 500:
                break
        except Exception:
            pass
    time.sleep(4)


def test_setup_and_reminder_flow():
    ta, a_id = register('migrant')
    tb, b_id = register('volunteer')
    now = datetime.now(TZ)
    near = create_appt(ta, b_id, now + timedelta(hours=23))
    far = create_appt(ta, b_id, now + timedelta(hours=48))
    near_pending = create_appt(ta, b_id, now + timedelta(hours=22))
    for mid in (near, far):
        r = requests.put(f"{BASE_URL}/api/appointments/{mid}/respond", headers=h(tb), json={"action": "accept"})
        assert r.status_code == 200 and r.json()['status'] == 'accepted'
    STATE.update(ta=ta, tb=tb, a_id=a_id, b_id=b_id, near=near, far=far, pending=near_pending)
    restart_backend()
    rems = reminders(ta, b_id)
    assert len(rems) == 1, rems
    assert rems[0]['message'].startswith('Lembrete:')
    assert rems[0]['appointment_update']['ref_id'] == near
    # visible to B too
    assert len(reminders(tb, a_id)) == 1


def test_no_duplicate_after_restart():
    restart_backend()
    assert len(reminders(STATE['ta'], STATE['b_id'])) == 1


def test_normal_chat_message_regression():
    r = requests.post(f"{BASE_URL}/api/messages", headers=h(STATE['ta']),
                      json={"to_user_id": STATE['b_id'], "message": "TEST_hello"})
    assert r.status_code in (200, 201), r.text
    msgs = requests.get(f"{BASE_URL}/api/messages/{STATE['a_id']}", headers=h(STATE['tb'])).json()
    assert any(m.get('message') == 'TEST_hello' for m in msgs)
    print(f"\nA_TOKEN={STATE['ta']}\nB_ID={STATE['b_id']}\nA_ID={STATE['a_id']}")
