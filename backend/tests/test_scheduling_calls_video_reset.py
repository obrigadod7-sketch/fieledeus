"""Tests for features.py: appointments (scheduling), calls, video upload/stream, password reset."""
import os
import re
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
HELPER = ("helper1@test.com", "Teste@123")
MIGRANT = ("migrant1@test.com", "Teste@123")
HELPER_ID = "014da934-8186-48f3-9064-8a4fa793ab85"
MIGRANT_ID = "a32cbedc-c172-483e-8edd-4b2a9ca44cbc"


def login(email, pw):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw})
    if r.status_code != 200:
        pytest.skip(f"login failed for {email}: {r.status_code} {r.text}")
    d = r.json()
    return d.get("token") or d.get("access_token")


@pytest.fixture(scope="module")
def h():
    return {"Authorization": f"Bearer {login(*HELPER)}"}


@pytest.fixture(scope="module")
def m():
    return {"Authorization": f"Bearer {login(*MIGRANT)}"}


def new_appt(h, **kw):
    body = {"to_user_id": MIGRANT_ID, "date": "2026-03-10", "start_time": "10:00", "end_time": "11:00",
            "modality": "other_address", "address": "TEST_ Rua das Flores 10, Paris", "notes": "TEST_ interfone 12"}
    body.update(kw)
    return requests.post(f"{BASE_URL}/api/appointments", json=body, headers=h)


# --- Appointments ---
class TestAppointments:
    def test_migrant_cannot_propose(self, m):
        r = requests.post(f"{BASE_URL}/api/appointments", headers=m, json={"to_user_id": HELPER_ID, "date": "2026-03-10",
                          "start_time": "10:00", "end_time": "11:00", "modality": "video"})
        assert r.status_code == 403

    def test_invalid_slot_and_modality(self, h):
        assert new_appt(h, end_time="09:00").status_code == 400
        assert new_appt(h, modality="foo").status_code == 400
        assert new_appt(h, address="").status_code == 400
        assert new_appt(h, notes="x" * 501).status_code == 422
        assert new_appt(h, date="bad").status_code == 400

    def test_create_hidden_for_migrant_then_accept(self, h, m):
        r = new_appt(h)
        assert r.status_code == 200, r.text
        a = r.json()
        assert a["status"] == "pending" and a["awaiting_user_id"] == MIGRANT_ID
        assert a["address"].startswith("TEST_")
        # migrant view hides address
        lst = requests.get(f"{BASE_URL}/api/appointments?with_user={HELPER_ID}", headers=m).json()
        mine = next(x for x in lst if x["id"] == a["id"])
        assert mine["address"] is None and mine["notes"] is None and mine.get("details_hidden") is True
        # helper can't accept own proposal
        assert requests.post(f"{BASE_URL}/api/appointments/{a['id']}/accept", headers=h).status_code == 403
        r = requests.post(f"{BASE_URL}/api/appointments/{a['id']}/accept", headers=m)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "accepted" and d["address"].startswith("TEST_") and d["notes"] == "TEST_ interfone 12"
        # cancel
        r = requests.post(f"{BASE_URL}/api/appointments/{a['id']}/cancel", headers=h)
        assert r.status_code == 200 and r.json()["status"] == "cancelled"
        assert requests.post(f"{BASE_URL}/api/appointments/{a['id']}/accept", headers=m).status_code == 400

    def test_reschedule_flow(self, h, m):
        a = new_appt(h, modality="video", address=None).json()
        assert a["meeting_url"].startswith("https://meet.jit.si/")
        lst = requests.get(f"{BASE_URL}/api/appointments", headers=m).json()
        assert next(x for x in lst if x["id"] == a["id"])["meeting_url"] is None
        r = requests.post(f"{BASE_URL}/api/appointments/{a['id']}/reschedule", headers=m,
                          json={"date": "2026-03-11", "start_time": "14:00", "end_time": "15:00", "note": "TEST_ tarde"})
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "rescheduled" and d["awaiting_user_id"] == HELPER_ID and d["date"] == "2026-03-11"
        # migrant can't accept own counter
        assert requests.post(f"{BASE_URL}/api/appointments/{a['id']}/accept", headers=m).status_code == 403
        r = requests.post(f"{BASE_URL}/api/appointments/{a['id']}/accept", headers=h)
        assert r.status_code == 200 and r.json()["status"] == "accepted"
        lst = requests.get(f"{BASE_URL}/api/appointments", headers=m).json()
        assert next(x for x in lst if x["id"] == a["id"])["meeting_url"].startswith("https://meet.jit.si/")
        requests.post(f"{BASE_URL}/api/appointments/{a['id']}/cancel", headers=m)

    def test_decline(self, h, m):
        a = new_appt(h, modality="my_address", address=None).json()
        assert a["address"]
        r = requests.post(f"{BASE_URL}/api/appointments/{a['id']}/decline", headers=m)
        assert r.status_code == 200 and r.json()["status"] == "declined"

    def test_chat_event_created(self, h):
        a = new_appt(h, modality="video", address=None).json()
        r = requests.get(f"{BASE_URL}/api/messages/{MIGRANT_ID}", headers=h)
        if r.status_code == 200:
            assert any(x.get("appointment_id") == a["id"] for x in r.json())
        requests.post(f"{BASE_URL}/api/appointments/{a['id']}/cancel", headers=h)

    def test_unauth_and_not_found(self, h):
        assert requests.get(f"{BASE_URL}/api/appointments").status_code in (401, 403)
        assert requests.post(f"{BASE_URL}/api/appointments/nope/accept", headers=h).status_code == 404


# --- Calls ---
class TestCalls:
    @pytest.mark.parametrize("mode", ["video", "audio"])
    def test_call(self, h, mode):
        r = requests.post(f"{BASE_URL}/api/calls/{MIGRANT_ID}?mode={mode}", headers=h)
        assert r.status_code == 200
        assert r.json()["url"].startswith("https://meet.jit.si/fieledeus-")

    def test_call_unknown_user(self, h):
        assert requests.post(f"{BASE_URL}/api/calls/nope", headers=h).status_code == 404


# --- Video upload ---
class TestVideo:
    def test_reject_non_video(self, h):
        r = requests.post(f"{BASE_URL}/api/uploads/video", headers=h, files={"file": ("a.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_upload_and_range(self, h):
        data = bytes(range(256)) * 40
        r = requests.post(f"{BASE_URL}/api/uploads/video", headers=h, files={"file": ("TEST_clip.mp4", data, "video/mp4")}, timeout=180)
        assert r.status_code == 200, r.text
        vid = r.json()["id"]
        assert r.json()["url"] == f"/api/videos/{vid}"
        g = requests.get(f"{BASE_URL}/api/videos/{vid}", timeout=120)
        assert g.status_code == 200 and g.content == data and g.headers["content-type"].startswith("video/mp4")
        g = requests.get(f"{BASE_URL}/api/videos/{vid}", headers={"Range": "bytes=0-99"}, timeout=120)
        assert g.status_code == 206 and len(g.content) == 100
        assert g.headers["content-range"] == f"bytes 0-99/{len(data)}"
        assert requests.get(f"{BASE_URL}/api/videos/nope").status_code == 404


# --- Password reset ---
class TestPasswordReset:
    def _get_token(self, email):
        time.sleep(1.5)
        out = subprocess.run(f"grep 'MOCK EMAIL' /var/log/supervisor/backend.err.log | grep '{email}' | tail -1",
                             shell=True, capture_output=True, text=True).stdout
        mt = re.search(r"token=([\w\-]+)", out)
        assert mt, out
        return mt.group(1)

    def test_unknown_email_generic(self):
        r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "nobody_x@test.com"})
        assert r.status_code == 200 and "message" in r.json()

    def test_full_reset_and_reuse(self):
        email = MIGRANT[0]
        assert requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email}).status_code == 200
        tok = self._get_token(email)
        assert requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": tok, "password": "123"}).status_code == 422
        r = requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": tok, "password": "TmpPass@1"})
        assert r.status_code == 200
        assert requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "TmpPass@1"}).status_code == 200
        assert requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": tok, "password": "Other@1"}).status_code == 400
        # restore
        requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email})
        tok2 = self._get_token(email)
        assert tok2 != tok
        assert requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": tok2, "password": MIGRANT[1]}).status_code == 200
        assert requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": MIGRANT[1]}).status_code == 200

    def test_bad_token(self):
        assert requests.post(f"{BASE_URL}/api/auth/reset-password", json={"token": "bogus", "password": "Abcdef1"}).status_code == 400
