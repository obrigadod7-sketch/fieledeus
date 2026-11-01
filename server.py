import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / 'backend'

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from server import app  # noqa: F401

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=10000, reload=False)
