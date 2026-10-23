# Iteration 10: church static site, login error message, admin-cannot-block-admin
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


def login(email, pw):
    return requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pw})


@pytest.fixture(scope="module")
def admin_token():
    r = login("admin@fieledeus.com", "Admin@123")
    assert r.status_code == 200, r.text
    d = r.json()
    return d.get("token") or d.get("access_token")


# Static church site
class TestChurchStatic:
    def test_igreja_index(self):
        r = requests.get(f"{BASE_URL}/igreja/")
        assert r.status_code == 200
        assert "/igreja/assets/" in r.text

    def test_igreja_assets_load(self):
        import re
        html = requests.get(f"{BASE_URL}/igreja/").text
        assets = re.findall(r'(/igreja/assets/[^"]+)', html)
        assert assets
        for a in assets:
            assert requests.get(f"{BASE_URL}{a}").status_code == 200, a

    def test_igreja_hashrouter_bundle(self):
        # Iter11: church uses HashRouter -> /igreja/#/estudo served by /igreja/index.html
        import re
        html = requests.get(f"{BASE_URL}/igreja/").text
        js = re.findall(r'(/igreja/assets/[^"]+\.js)', html)
        assert js
        body = requests.get(f"{BASE_URL}{js[0]}").text
        assert "/igreja/#/" in body


# Login message
class TestLoginMsg:
    def test_wrong_password(self):
        r = login("migrant1@test.com", "WrongPass!1")
        assert r.status_code == 401
        assert r.json()["detail"] == "E-mail ou senha incorretos"

    def test_unknown_email(self):
        r = login(f"nouser_{uuid.uuid4().hex[:6]}@test.com", "WrongPass!1")
        assert r.status_code == 401
        assert r.json()["detail"] == "E-mail ou senha incorretos"


# Admin cannot block admin
class TestAdminBlockGuard:
    def test_block_other_admin_400(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        email = f"test_admin2_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Teste@123", "name": "TEST Admin2", "role": "migrant"})
        assert r.status_code in (200, 201), r.text
        d = r.json()
        uid = (d.get("user") or {}).get("id") or d.get("id")
        assert uid
        try:
            r = requests.put(f"{BASE_URL}/api/admin/users/{uid}/role", json={"role": "admin"}, headers=h)
            assert r.status_code == 200
            r = requests.put(f"{BASE_URL}/api/admin/users/{uid}/block", json={"blocked": True}, headers=h)
            assert r.status_code == 400
            assert "administrador" in r.json()["detail"]
            # still able to login (not blocked)
            assert login(email, "Teste@123").status_code == 200
            # demote and block works
            requests.put(f"{BASE_URL}/api/admin/users/{uid}/role", json={"role": "migrant"}, headers=h)
            r = requests.put(f"{BASE_URL}/api/admin/users/{uid}/block", json={"blocked": True}, headers=h)
            assert r.status_code == 200
        finally:
            requests.delete(f"{BASE_URL}/api/admin/users/{uid}", headers=h)

    def test_block_self_400(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        me = login("admin@fieledeus.com", "Admin@123").json()["user"]
        r = requests.put(f"{BASE_URL}/api/admin/users/{me['id']}/block", json={"blocked": True}, headers=h)
        assert r.status_code == 400

    def test_admin_users_list(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200 and isinstance(r.json(), list)


# Iter11: unblocking an admin allowed, blocking still 400
class TestAdminUnblock:
    def test_unblock_admin_ok(self, admin_token):
        h = {"Authorization": f"Bearer {admin_token}"}
        email = f"test_admin3_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Teste@123", "name": "TEST Admin3", "role": "migrant"})
        d = r.json()
        uid = (d.get("user") or {}).get("id") or d.get("id")
        try:
            assert requests.put(f"{BASE_URL}/api/admin/users/{uid}/block", json={"blocked": True}, headers=h).status_code == 200
            assert requests.put(f"{BASE_URL}/api/admin/users/{uid}/role", json={"role": "admin"}, headers=h).status_code == 200
            r = requests.put(f"{BASE_URL}/api/admin/users/{uid}/block", json={"blocked": False}, headers=h)
            assert r.status_code == 200 and r.json()["blocked"] is False
            assert login(email, "Teste@123").status_code == 200
            r = requests.put(f"{BASE_URL}/api/admin/users/{uid}/block", json={"blocked": True}, headers=h)
            assert r.status_code == 400
        finally:
            requests.delete(f"{BASE_URL}/api/admin/users/{uid}", headers=h)
