import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / 'backend'
BACKEND_SERVER = BACKEND_DIR / 'server.py'

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

if not BACKEND_SERVER.exists():
    raise FileNotFoundError(f'Backend app not found at {BACKEND_SERVER}')

spec = importlib.util.spec_from_file_location('watizat_backend_server', BACKEND_SERVER)
if spec is None or spec.loader is None:
    raise ImportError(f'Could not load backend app from {BACKEND_SERVER}')

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=10000, reload=False)
