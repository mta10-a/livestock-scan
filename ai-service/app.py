import hashlib
import io
import os
import time

from flask import Flask, jsonify, request
from PIL import Image, ImageStat, UnidentifiedImageError
from werkzeug.exceptions import RequestEntityTooLarge

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

EKSTENSI_DIIZINKAN = {"jpg", "jpeg", "png"}
UKURAN_MODEL = (224, 224) 
AMBANG_PERINGATAN = 0.70


PENYAKIT = {
    "sapi": [
        {
            "nama": "Penyakit Mulut dan Kuku (PMK)",
            "fitur": [
                "Luka/lepuh pada mulut dan gusi",
                "Air liur berlebihan (hipersalivasi)",
                "Luka pada kuku dan kuku terlepas",
                "Ternak lemas dan tidak mau makan",
            ],
        },
        {
            "nama": "Lumpy Skin Disease (LSD)",
            "fitur": [
                "Benjolan keras (nodul) pada kulit",
                "Nodul tersebar di leher, punggung, dan ambing",
                "Demam dan pembengkakan kelenjar limfa",
                "Penurunan produksi susu",
            ],
        },
    ],
    "kambing": [
        {
            "nama": "Scabies",
            "fitur": [
                "Keropeng dan luka pada kulit",
                "Kerontokan bulu setempat",
                "Gatal hebat, ternak sering menggaruk",
                "Kulit menebal dan bersisik",
            ],
        },
        {
            "nama": "Orf",
            "fitur": [
                "Luka lepuh pada bibir dan moncong",
                "Keropeng tebal berwarna gelap",
                "Luka pada ambing pada kambing betina",
                "Sulit makan karena nyeri di mulut",
            ],
        },
    ],
    "ayam": [
        {
            "nama": "Coccidiosis",
            "fitur": [
                "Bulu kusam dan berdiri (menggembung)",
                "Kotoran berdarah atau berlendir",
                "Ayam lesu dan mengantuk",
                "Penurunan nafsu makan",
            ],
        },
    ],
}


def acak_deterministik(seed: bytes, minimum: float, maksimum: float) -> float:
    angka = int.from_bytes(hashlib.sha256(seed).digest()[:6], "big")
    return minimum + (angka / 0xFFFFFFFFFFFF) * (maksimum - minimum)


def praproses(isi: bytes):
    try:
        gambar = Image.open(io.BytesIO(isi))
        gambar.load()
    except (UnidentifiedImageError, OSError):
        raise ValueError("Berkas bukan gambar yang valid.")

    lebar_asli, tinggi_asli = gambar.size
    if lebar_asli < 16 or tinggi_asli < 16:
        raise ValueError("Resolusi gambar terlalu kecil (minimal 16x16 piksel).")

    rgb = gambar.convert("RGB").resize(UKURAN_MODEL)

    stat = ImageStat.Stat(rgb)
    kecerahan = sum(stat.mean) / 3.0
    kontras = sum(stat.stddev) / 3.0

    info = {
        "lebar_asli": lebar_asli,
        "tinggi_asli": tinggi_asli,
        "ukuran_model": list(UKURAN_MODEL),
        "kecerahan": round(kecerahan, 1),
        "kontras": round(kontras, 1),
    }
    return rgb, info


@app.get("/health")
def health():
    return jsonify(status="ok", model="dummy-v1", spesies=list(PENYAKIT.keys()))


@app.post("/predict")
def predict():
    mulai = time.perf_counter()

    spesies = (request.form.get("spesies") or "").strip().lower()
    if spesies not in PENYAKIT:
        return jsonify(error="Spesies tidak dikenal. Pilih sapi, kambing, atau ayam."), 400

    berkas = request.files.get("gambar")
    if berkas is None or berkas.filename == "":
        return jsonify(error="Berkas gambar wajib dikirim dengan nama field 'gambar'."), 400

    ekstensi = berkas.filename.rsplit(".", 1)[-1].lower() if "." in berkas.filename else ""
    if ekstensi not in EKSTENSI_DIIZINKAN:
        return jsonify(error="Format berkas harus JPG atau PNG."), 400

    isi = berkas.read()
    if not isi:
        return jsonify(error="Berkas gambar kosong."), 400

    try:
        rgb, info = praproses(isi)
    except ValueError as e:
        return jsonify(error=str(e)), 400

    seed = rgb.tobytes()

    daftar = PENYAKIT[spesies]
    indeks = int(acak_deterministik(seed + b"|idx", 0, 1000)) % len(daftar)
    kandidat = daftar[indeks]

    peluang = acak_deterministik(seed + b"|yakin", 0, 1)
    if peluang < 0.20:
        confidence = acak_deterministik(seed + b"|rendah", 0.42, 0.68)
    else:
        confidence = acak_deterministik(seed + b"|tinggi", 0.74, 0.97)

    fitur = list(kandidat["fitur"])
    if info["kecerahan"] < 60:
        fitur.append("Catatan foto: pencahayaan terlalu gelap")
        confidence *= 0.72
    if info["kontras"] < 18:
        fitur.append("Catatan foto: kurang tajam / kontras rendah")
        confidence *= 0.82

    confidence = round(min(max(confidence, 0.05), 0.99), 4)
    durasi = round((time.perf_counter() - mulai) * 1000, 1)

    return jsonify(
        spesies=spesies,
        penyakit=kandidat["nama"],
        confidence=confidence,
        fitur_visual=fitur,
        kualitas_foto=info,
        peringatan=confidence < AMBANG_PERINGATAN,
        model="dummy-v1",
        durasi_ms=durasi,
    )


@app.errorhandler(RequestEntityTooLarge)
def terlalu_besar(_):
    return jsonify(error="Ukuran gambar melebihi 5 MB."), 413


@app.errorhandler(404)
def tidak_ditemukan(_):
    return jsonify(error="Endpoint tidak ditemukan."), 404


@app.errorhandler(405)
def metode_salah(_):
    return jsonify(error="Metode HTTP tidak diizinkan."), 405


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[ai-service] pra-pemrosesan gambar: PIL aktif, masukan {UKURAN_MODEL}")
    print(f"[ai-service] model klasifikasi DUMMY berjalan di http://localhost:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
