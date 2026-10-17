@echo off
REM ============================================================
REM  LivestockHealth Scan - menjalankan Backend (Express)
REM  Klik dua kali berkas ini, atau jalankan dari terminal.
REM ============================================================
cd /d "%~dp0"

if not exist "node_modules" (
  echo [!] Dependensi belum dipasang.
  echo     Jalankan dulu:  npm install
  echo.
  pause
  exit /b 1
)

echo [backend] berjalan di http://localhost:3000
echo [backend] tekan Ctrl+C untuk berhenti
echo.
node server.js

pause
