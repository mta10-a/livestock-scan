@echo off
cd /d "%~dp0"

if not exist ".venv-mediapipe\Scripts\python.exe" (
  echo [!] Virtual environment belum ada di folder ini.
  echo.
  echo     Buat sekali saja dengan perintah berikut:
  echo       py -3.11 -m venv .venv-mediapipe
  echo       .venv-mediapipe\Scripts\python.exe -m pip install -r ..\requirements.txt
  echo.
  pause
  exit /b 1
)

echo [ai-service] menjalankan di http://localhost:5000
echo [ai-service] tekan Ctrl+C untuk berhenti
echo.
".venv-mediapipe\Scripts\python.exe" app.py

pause
