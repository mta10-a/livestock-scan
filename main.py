import os
import subprocess
import sys
import time
import webbrowser

import config

def periksa_persiapan():

    kurang = []

    if not config.PYTHON_AI.exists():
        kurang.append(
            "Python untuk layanan AI belum ada.\n"
            "     Buat sekali saja:\n"
            "       cd ai-service\n"
            "       py -3.11 -m venv .venv-mediapipe\n"
            "       .venv-mediapipe\\Scripts\\python.exe -m pip install -r ..\\requirements.txt"
        )

    if not (config.FOLDER_BACKEND / "node_modules").exists():
        kurang.append(
            "Dependensi Node belum dipasang.\n"
            "     Jalankan sekali saja:\n"
            "       cd backend\n"
            "       npm install"
        )

    if not (config.FOLDER_AI / "model" / "sapi.npz").exists():
        kurang.append(
            "Berkas model hasil latihan belum ada di ai-service/model/.\n"
            "     Layanan AI masih bisa jalan dengan mode cadangan, tetapi hasilnya\n"
            "     bukan hasil latihan. Jalankan latih.py untuk melatih ulang modelnya."
        )

    return kurang

def atur_layanan(nama, perintah, folder, tambahan):

    env = {**os.environ, **{k: str(v) for k, v in tambahan.items()}}
    print(f"  menyalakan {nama} ...")
    return subprocess.Popen(perintah, cwd=str(folder), env=env)

def main():
    print("\n=== LivestockHealth Scan ===\n")
    print(f"  backend   : {config.BACKEND_URL}")
    print(f"  layanan AI: {config.AI_URL}")
    print(f"  database  : {config.BERKAS_DATABASE}")
    print()

    kurang = periksa_persiapan()
    if kurang:
        print("Ada yang perlu disiapkan dulu:\n")
        for pesan in kurang:
            print(f"  - {pesan}\n")

        if not config.PYTHON_AI.exists() or not (config.FOLDER_BACKEND / "node_modules").exists():
            sys.exit(1)
        input("Tekan Enter untuk meneruskan, atau Ctrl+C untuk membatalkan...")
        print()

    ai = atur_layanan(
        "layanan AI",
        [str(config.PYTHON_AI), "app.py"],
        config.FOLDER_AI,
        {"PORT": config.PORT_AI, "MAKS_UKURAN_FOTO": config.MAKS_UKURAN_FOTO},
    )

    time.sleep(2)

    backend = atur_layanan(
        "backend",
        ["node", "server.js"],
        config.FOLDER_BACKEND,
        {
            "PORT": config.PORT_BACKEND,
            "FLASK_URL": config.AI_URL,
            "KUOTA_GRATIS": config.KUOTA_GRATIS,
            "AMBANG_PERINGATAN": config.AMBANG_KEYAKINAN_RENDAH,
            "UKURAN_MAKS": config.MAKS_UKURAN_FOTO,
            "JWT_SECRET": config.KUNCI_TOKEN,
        },
    )

    time.sleep(2)
    print(f"\n  Aplikasi dibuka di {config.BACKEND_URL}")
    print("  Tekan Ctrl+C kalau sudah selesai.\n")
    webbrowser.open(config.BACKEND_URL)

    try:
        while True:
            if ai.poll() is not None:
                print("\nLayanan AI berhenti sendiri. Semua dimatikan.")
                break
            if backend.poll() is not None:
                print("\nBackend berhenti sendiri. Semua dimatikan.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMenghentikan layanan ...")
    finally:
        for proses in (backend, ai):
            if proses.poll() is None:
                proses.terminate()
                try:
                    proses.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proses.kill()
        print("Selesai.")

if __name__ == "__main__":
    main()
