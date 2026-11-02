# Regression tests: direct chat messages, chat-media upload (photo/video), appointments
import os
import uuid
import datetime
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# minimal valid PNG (1x1)
PNG = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')
MP4 = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom' + b'\x00' * 2048


def _register(role):
    email = f"test_chat_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "Test1234", "name": f"TEST {role}", "role": role})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "id": d["user"]["id"], "email": email, "h": {"Authorization": f"Bearer {d['token']}"}}


@pytest.fixture(scope="module")
def users():
    return _register("migrant"), _register("volunteer")


# Messages
class TestMessages:
    def test_send_and_receive(self, users):
        a, b = users
        r = requests.post(f"{BASE_URL}/api/messages", headers=a["h"], json={"to_user_id": b["id"], "message": "Ola B"})
        assert r.status_code == 200, r.text
        assert r.json()["message"] == "Ola B"
        rb = requests.get(f"{BASE_URL}/api/messages/{a['id']}", headers=b["h"])
        assert rb.status_code == 200
        assert any(m["message"] == "Ola B" and m["from_user_id"] == a["id"] for m in rb.json())
        assert all("_id" not in m for m in rb.json())

    def test_reply_visible_to_a(self, users):
        a, b = users
        requests.post(f"{BASE_URL}/api/messages", headers=b["h"], json={"to_user_id": a["id"], "message": "Oi A"})
        ra = requests.get(f"{BASE_URL}/api/messages/{b['id']}", headers=a["h"])
        assert [m["message"] for m in ra.json()][-1] == "Oi A"

    def test_conversations(self, users):
        a, b = users
        r = requests.get(f"{BASE_URL}/api/conversations", headers=a["h"])
        assert r.status_code == 200
        assert b["id"] in str(r.json())

    def test_can_chat(self, users):
        a, b = users
        r = requests.get(f"{BASE_URL}/api/can-chat/{a['id']}", headers=b["h"])
        assert r.status_code == 200 and r.json()["can_chat"] is True

    def test_unauth(self, users):
        r = requests.post(f"{BASE_URL}/api/messages", json={"to_user_id": users[1]["id"], "message": "x"})
        assert r.status_code in (401, 403)


# Chat media
class TestChatMedia:
    def test_video_upload_and_fetch(self, users):
        a, b = users
        r = requests.post(f"{BASE_URL}/api/chat-media", headers=a["h"], files={"file": ("v.mp4", MP4, "video/mp4")})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["media_type"] == "video" and d["url"].startswith("/api/chat-media/")
        g = requests.get(f"{BASE_URL}{d['url']}")
        assert g.status_code == 200 and g.headers["content-type"].startswith("video/mp4") and len(g.content) == len(MP4)
        rg = requests.get(f"{BASE_URL}{d['url']}", headers={"Range": "bytes=0-99"})
        assert rg.status_code == 206 and len(rg.content) == 100
        m = requests.post(f"{BASE_URL}/api/messages", headers=a["h"], json={"to_user_id": b["id"], "message": "Mídia compartilhada", "media": [d["url"]], "media_type": "video"})
        assert m.status_code == 200
        msgs = requests.get(f"{BASE_URL}/api/messages/{a['id']}", headers=b["h"]).json()
        assert any(x.get("media") == [d["url"]] and x.get("media_type") == "video" for x in msgs)

    def test_image_upload(self, users):
        r = requests.post(f"{BASE_URL}/api/chat-media", headers=users[0]["h"], files={"file": ("p.png", PNG, "image/png")})
        assert r.status_code == 200 and r.json()["media_type"] == "image"
        assert requests.get(f"{BASE_URL}{r.json()['url']}").status_code == 200

    def test_reject_non_media(self, users):
        r = requests.post(f"{BASE_URL}/api/chat-media", headers=users[0]["h"], files={"file": ("a.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_bad_id_404(self):
        assert requests.get(f"{BASE_URL}/api/chat-media/notanid").status_code == 404


# Appointments
class TestAppointments:
    def test_create_accept(self, users):
        a, b = users
        date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
        r = requests.post(f"{BASE_URL}/api/appointments", headers=a["h"], json={"to_user_id": b["id"], "date": date, "time": "14:30", "mode": "in_person", "info": "Rua X 10", "acknowledged": True})
        assert r.status_code == 200, r.text
        mid = r.json()["id"]
        msgs = requests.get(f"{BASE_URL}/api/messages/{a['id']}", headers=b["h"]).json()
        appt = next(m for m in msgs if m["id"] == mid)["appointment"]
        assert appt["status"] == "pending" and appt["info"] is None and appt["has_info"] is True
        # sender cannot accept
        assert requests.put(f"{BASE_URL}/api/appointments/{mid}/respond", headers=a["h"], json={"action": "accept"}).status_code == 403
        rr = requests.put(f"{BASE_URL}/api/appointments/{mid}/respond", headers=b["h"], json={"action": "accept"})
        assert rr.status_code == 200 and rr.json()["status"] == "accepted"
        msgs = requests.get(f"{BASE_URL}/api/messages/{a['id']}", headers=b["h"]).json()
        appt = next(m for m in msgs if m["id"] == mid)["appointment"]
        assert appt["status"] == "accepted" and appt["info"] == "Rua X 10"
        assert any(m.get("appointment_update", {}).get("ref_id") == mid for m in msgs)
        assert requests.put(f"{BASE_URL}/api/appointments/{mid}/respond", headers=b["h"], json={"action": "decline"}).status_code == 400

    def test_validation(self, users):
        a, b = users
        past = (datetime.date.today() - datetime.timedelta(days=3)).isoformat()
        base = {"to_user_id": b["id"], "date": past, "time": "10:00", "mode": "video", "acknowledged": True}
        assert requests.post(f"{BASE_URL}/api/appointments", headers=a["h"], json=base).status_code == 400
        fut = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
        assert requests.post(f"{BASE_URL}/api/appointments", headers=a["h"], json={**base, "date": fut, "acknowledged": False}).status_code == 400
        assert requests.post(f"{BASE_URL}/api/appointments", headers=a["h"], json={**base, "date": fut, "mode": "zzz"}).status_code == 400
        assert requests.post(f"{BASE_URL}/api/appointments", headers=a["h"], json={**base, "date": fut, "to_user_id": "nope"}).status_code == 404
