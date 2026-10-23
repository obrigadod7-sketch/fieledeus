# Iteration 9: association self-register, admin block/unblock, admin stats weekly, admin appointments, registration errors
import os
import uuid
from datetime import date, timedelta
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"
HELPER_ID = "014da934-8186-48f3-9064-8a4fa793ab85"
MIGRANT_ID = "a32cbedc-c172-483e-8edd-4b2a9ca44cbc"


def login(email, pw):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return r


def tok(email, pw):
    r = login(email, pw)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def H(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="module")
def admin():
    return tok("admin@fieledeus.com", "Admin@123")


@pytest.fixture(scope="module")
def helper():
    return tok("helper1@test.com", "Teste@123")


@pytest.fixture(scope="module")
def migrant():
    return tok("migrant1@test.com", "Teste@123")


# Registration validation
class TestRegister:
    def test_admin_role_rejected(self):
        r = requests.post(f"{API}/auth/register", json={"email": f"test_adm_{uuid.uuid4().hex[:6]}@test.com", "password": "Teste@123", "name": "X", "role": "admin"})
        assert r.status_code == 400

    def test_duplicate_email(self):
        r = requests.post(f"{API}/auth/register", json={"email": "HELPER1@test.com", "password": "Teste@123", "name": "X", "role": "volunteer"})
        assert r.status_code == 400
        assert "cadastrado" in r.json()["detail"]

    def test_short_password(self):
        r = requests.post(f"{API}/auth/register", json={"email": f"test_s_{uuid.uuid4().hex[:6]}@test.com", "password": "123", "name": "X", "role": "volunteer"})
        assert r.status_code == 400

    def test_invalid_email_422_detail_array(self):
        r = requests.post(f"{API}/auth/register", json={"email": "not-an-email", "password": "Teste@123", "name": "X", "role": "volunteer"})
        assert r.status_code == 422
        assert isinstance(r.json()["detail"], list)

    def test_volunteer_register_ok(self):
        email = f"test_vol_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Teste@123", "name": "TEST Vol", "role": "volunteer",
                                                         "professional_area": "legal", "help_types": ["online"]})
        assert r.status_code == 200, r.text
        assert r.json()["user"]["role"] == "volunteer"


# Association self registration + listing
class TestAssociation:
    def test_assoc_register_and_list(self, migrant, admin):
        email = f"test_assoc_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Teste@123", "name": "TEST Assoc", "organization": "TEST Assoc",
                                                         "responsible_name": "Resp", "city": "Paris", "role": "association", "help_categories": ["legal"]})
        assert r.status_code == 200, r.text
        uid = r.json()["user"]["id"]
        assert r.json()["user"]["role"] == "association"
        lst = requests.get(f"{API}/associations", headers=H(migrant)).json()
        found = [a for a in lst if a["id"] == uid]
        assert found and found[0]["city"] == "Paris" and "password" not in found[0]
        # block -> hidden from list, unblock -> back
        assert requests.put(f"{API}/admin/users/{uid}/block", json={"blocked": True}, headers=H(admin)).status_code == 200
        assert uid not in [a["id"] for a in requests.get(f"{API}/associations", headers=H(migrant)).json()]
        assert requests.put(f"{API}/admin/users/{uid}/block", json={"blocked": False}, headers=H(admin)).status_code == 200
        assert uid in [a["id"] for a in requests.get(f"{API}/associations", headers=H(migrant)).json()]

    def test_associations_requires_auth(self):
        assert requests.get(f"{API}/associations").status_code in (401, 403)

    def test_assoc_can_propose_appointment(self):
        t = tok("assoc1@test.com", "Teste@123")
        d = (date.today() + timedelta(days=12)).isoformat()
        r = requests.post(f"{API}/appointments", json={"to_user_id": MIGRANT_ID, "date": d, "start_time": "10:00", "end_time": "11:00", "modality": "video"}, headers=H(t))
        assert r.status_code == 200, r.text
        requests.post(f"{API}/appointments/{r.json()['id']}/cancel", headers=H(t))


# Admin block/unblock + stats + appointments
class TestAdmin:
    def test_block_flow(self, admin):
        email = f"test_blk_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Teste@123", "name": "TEST Blk", "role": "migrant"})
        uid, t = r.json()["user"]["id"], r.json()["token"]
        assert requests.get(f"{API}/profile", headers=H(t)).status_code == 200
        assert requests.put(f"{API}/admin/users/{uid}/block", json={"blocked": True}, headers=H(admin)).json() == {"blocked": True}
        lr = login(email, "Teste@123")
        assert lr.status_code == 403 and "bloqueada" in lr.json()["detail"].lower()
        assert requests.get(f"{API}/profile", headers=H(t)).status_code == 401
        users = requests.get(f"{API}/admin/users", headers=H(admin)).json()
        u = [x for x in users if x["id"] == uid]
        assert u and u[0].get("blocked") is True
        requests.put(f"{API}/admin/users/{uid}/block", json={"blocked": False}, headers=H(admin))
        assert login(email, "Teste@123").status_code == 200
        assert requests.get(f"{API}/profile", headers=H(t)).status_code == 200

    def test_block_wrong_password_still_401(self, admin):
        email = f"test_blk2_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Teste@123", "name": "TEST Blk", "role": "migrant"})
        uid = r.json()["user"]["id"]
        requests.put(f"{API}/admin/users/{uid}/block", json={"blocked": True}, headers=H(admin))
        assert login(email, "wrongpw").status_code == 401
        requests.put(f"{API}/admin/users/{uid}/block", json={"blocked": False}, headers=H(admin))

    def test_block_self_rejected(self, admin):
        me = requests.get(f"{API}/profile", headers=H(admin)).json()
        assert requests.put(f"{API}/admin/users/{me['id']}/block", json={"blocked": True}, headers=H(admin)).status_code == 400

    def test_block_unknown_404(self, admin):
        assert requests.put(f"{API}/admin/users/nope-{uuid.uuid4()}/block", json={"blocked": True}, headers=H(admin)).status_code == 404

    def test_block_non_admin_403(self, helper):
        assert requests.put(f"{API}/admin/users/{MIGRANT_ID}/block", json={"blocked": True}, headers=H(helper)).status_code == 403

    def test_stats_weekly(self, admin):
        s = requests.get(f"{API}/admin/stats", headers=H(admin)).json()
        assert len(s["weekly"]) == 8
        for k in ("total_associations", "blocked_users", "total_appointments", "accepted_appointments", "pending_appointments", "total_helpers"):
            assert isinstance(s[k], int)
        assert sum(w["users"] for w in s["weekly"]) >= 1  # just-registered test users

    def test_admin_appointments(self, admin, helper):
        r = requests.get(f"{API}/admin/appointments", headers=H(admin))
        assert r.status_code == 200 and isinstance(r.json(), list)
        if r.json():
            assert "history" not in r.json()[0] and "_id" not in r.json()[0]
        assert requests.get(f"{API}/admin/appointments", headers=H(helper)).status_code == 403


# Upcoming appointment helper1 -> migrant1 (for UI tests) and regression of scheduling
class TestScheduling:
    def test_propose_accept_reschedule(self, helper, migrant):
        d = (date.today() + timedelta(days=5)).isoformat()
        r = requests.post(f"{API}/appointments", json={"to_user_id": MIGRANT_ID, "date": d, "start_time": "14:00", "end_time": "15:00", "modality": "video", "notes": "TEST"}, headers=H(helper))
        assert r.status_code == 200
        aid = r.json()["id"]
        d2 = (date.today() + timedelta(days=6)).isoformat()
        rs = requests.post(f"{API}/appointments/{aid}/reschedule", json={"date": d2, "start_time": "15:00", "end_time": "16:00"}, headers=H(migrant))
        assert rs.json()["status"] == "rescheduled" and rs.json()["date"] == d2
        a2 = requests.post(f"{API}/appointments/{aid}/accept", headers=H(helper))
        assert a2.json()["status"] == "accepted"
        lst = requests.get(f"{API}/appointments?with_user={HELPER_ID}", headers=H(migrant)).json()
        assert any(x["id"] == aid and x["date"] == d2 for x in lst)
