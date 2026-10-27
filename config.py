from pathlib import Path

AKAR = Path(__file__).resolve().parent

HOST_BACKEND = "127.0.0.1"
PORT_BACKEND = 3000

HOST_AI = "127.0.0.1"
PORT_AI = 5000

BACKEND_URL = f"http://{HOST_BACKEND}:{PORT_BACKEND}"
AI_URL = f"http://{HOST_AI}:{PORT_AI}"

MAKS_UKURAN_FOTO = 5 * 1024 * 1024
KUOTA_GRATIS = 3
AMBANG_KEYAKINAN_RENDAH = 0.7


FOLDER_FRONTEND = AKAR / "frontend"
FOLDER_BACKEND = AKAR / "backend"
FOLDER_AI = AKAR / "ai-service"

FOLDER_DATA = FOLDER_BACKEND / "data"
BERKAS_DATABASE = FOLDER_DATA / "livestock.db"

PYTHON_AI = FOLDER_AI / ".venv-mediapipe" / "Scripts" / "python.exe"
