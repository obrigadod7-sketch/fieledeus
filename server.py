import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / 'backend'
BACKEND_SERVER = BACKEND_DIR / 'server.py'

for candidate in (str(ROOT), str(BACKEND_DIR)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

if not BACKEND_SERVER.exists():
    raise FileNotFoundError(f'Backend app not found at {BACKEND_SERVER}')

spec = importlib.util.spec_from_file_location('server', BACKEND_SERVER)
if spec is None or spec.loader is None:
    raise ImportError(f'Could not load backend app from {BACKEND_SERVER}')

module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

app = getattr(module, 'app', None)
if app is None:
    raise AttributeError(f'Backend app module {BACKEND_SERVER} does not define an `app` object')

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=10000, reload=False)
