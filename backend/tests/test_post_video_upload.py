# Post video upload: multipart upload, Range, mime guessing, rejects (400/413)
import os, uuid, pytest, requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
MP4 = '/tmp/test.mp4'


@pytest.fixture(scope='module')
def auth():
    email = f"test_vid_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={'email': email, 'password': 'Test1234!', 'name': 'TEST Video', 'role': 'migrant'})
    assert r.status_code in (200, 201), r.text
    return {'Authorization': f"Bearer {r.json()['token']}"}


def new_post(auth):
    r = requests.post(f"{BASE_URL}/api/posts", headers=auth, json={'type': 'need', 'category': 'food', 'title': 'TEST_video', 'description': 'desc', 'images': [], 'location': None})
    assert r.status_code in (200, 201), r.text
    return r.json()['id']


def test_upload_and_range(auth):
    pid = new_post(auth)
    with open(MP4, 'rb') as f:
        r = requests.post(f"{BASE_URL}/api/posts/{pid}/video", headers=auth, files={'file': ('a.mp4', f, 'video/mp4')})
    assert r.status_code == 200, r.text
    assert r.json()['video_url'] == f"/api/posts/{pid}/video"
    posts = requests.get(f"{BASE_URL}/api/posts", headers=auth).json()
    items = posts if isinstance(posts, list) else posts.get('posts', posts.get('items', []))
    p = next(x for x in items if x['id'] == pid)
    assert p['video_url'] == f"/api/posts/{pid}/video"
    full = requests.get(f"{BASE_URL}/api/posts/{pid}/video")
    assert full.status_code == 200 and full.content == open(MP4, 'rb').read()
    assert full.headers['content-type'].startswith('video/mp4')
    rr = requests.get(f"{BASE_URL}/api/posts/{pid}/video", headers={'Range': 'bytes=0-99'})
    assert rr.status_code == 206 and len(rr.content) == 100
    assert rr.headers['content-range'].startswith('bytes 0-99/')
    suf = requests.get(f"{BASE_URL}/api/posts/{pid}/video", headers={'Range': 'bytes=-50'})
    assert suf.status_code == 206 and len(suf.content) == 50


def test_generic_mime_guessed(auth):
    pid = new_post(auth)
    with open(MP4, 'rb') as f:
        r = requests.post(f"{BASE_URL}/api/posts/{pid}/video", headers=auth, files={'file': ('clip.mp4', f, 'application/octet-stream')})
    assert r.status_code == 200, r.text
    g = requests.get(f"{BASE_URL}/api/posts/{pid}/video", headers={'Range': 'bytes=0-9'})
    assert g.status_code == 206 and g.headers['content-type'].startswith('video/mp4')


def test_non_video_rejected(auth):
    pid = new_post(auth)
    r = requests.post(f"{BASE_URL}/api/posts/{pid}/video", headers=auth, files={'file': ('a.txt', b'hello', 'text/plain')})
    assert r.status_code == 400


def test_too_large_rejected(auth):
    pid = new_post(auth)
    data = b'\0' * (50 * 1024 * 1024 + 10)
    r = requests.post(f"{BASE_URL}/api/posts/{pid}/video", headers=auth, files={'file': ('big.mp4', data, 'video/mp4')}, timeout=180)
    assert r.status_code == 413, r.status_code


def test_other_user_cannot_upload(auth):
    pid = new_post(auth)
    r = requests.post(f"{BASE_URL}/api/auth/register", json={'email': f"test_vid2_{uuid.uuid4().hex[:6]}@example.com", 'password': 'Test1234!', 'name': 'T2', 'role': 'migrant'})
    h2 = {'Authorization': f"Bearer {r.json()['token']}"}
    r = requests.post(f"{BASE_URL}/api/posts/{pid}/video", headers=h2, files={'file': ('a.mp4', b'x', 'video/mp4')})
    assert r.status_code == 404
