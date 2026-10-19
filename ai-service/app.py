from __future__ import annotations

import hashlib
import io
import json
import os
import time
from pathlib import Path

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image, ImageStat, UnidentifiedImageError
from werkzeug.exceptions import RequestEntityTooLarge

from latih import potong_bingkai_gelap

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = int(os.environ.get("MAKS_UKURAN_FOTO", 5 * 1024 * 1024))

BASE = Path(__file__).resolve().parent
MODEL_DIR = BASE / "model"
BERKAS_EMBEDDER = MODEL_DIR / "efficientnet_lite0.tflite"

EKSTENSI_DIIZINKAN = {"jpg", "jpeg", "png"}
UKURAN_MODEL = (224, 224)
AMBANG_PERINGATAN = 0.70

CIRI_KELAS = {
    "Sehat": [
        "Tidak terlihat luka, benjolan, atau keropeng pada bagian yang tampak",
        "Bulu tampak rata dan ternak berdiri normal",
        "Tidak ada pembengkakan pada kuku atau mulut",
    ],
    "Lumpy Skin Disease (LSD)": [
        "Benjolan keras (nodul) pada kulit",
        "Nodul dapat tersebar di leher, punggung, dan ambing",
        "Kulit tampak menebal di sekitar nodul",
    ],
    "Penyakit Mulut dan Kuku (PMK)": [
        "Luka atau lepuh pada mulut, gusi, dan lidah",
        "Luka pada kuku dan sekitar kuku",
        "Ternak tampak lemas serta tidak mau makan",
    ],
    "Gangguan Kulit (Scabies/Orf)": [
        "Keropeng atau luka pada kulit dan sekitar mulut",
        "Kerontokan bulu setempat",
        "Kulit menebal, bersisik, atau tampak berkerak",
    ],
    "Coccidiosis": [
        "Kotoran berdarah atau berlendir pada alas kandang",
        "Ayam lesu dan bulu tampak kusam",
        "Nafsu makan menurun",
    ],
    "Tetelo (Newcastle Disease)": [
        "Kotoran encer kehijauan",
        "Ayam tampak lesu dan sulit bernapas",
        "Kepala berputar atau sayap terkulai",
    ],
    "Salmonellosis": [
        "Kotoran encer berwarna keputihan atau kekuningan",
        "Ayam tampak lemas dan mengantuk",
        "Bulu di sekitar dubur tampak kotor",
    ],
}

PENYAKIT_DUMMY = {
    "sapi": ["Penyakit Mulut dan Kuku (PMK)", "Lumpy Skin Disease (LSD)"],
    "kambing": ["Gangguan Kulit (Scabies/Orf)"],
    "ayam": ["Coccidiosis", "Tetelo (Newcastle Disease)", "Salmonellosis"],
}

class ModelKlasifikasi:

    def __init__(self, spesies: str, berkas: Path):
        isi = np.load(berkas, allow_pickle=False)
        self.spesies = spesies
        self.W = isi["W"].astype(np.float32)
        self.b = isi["b"].astype(np.float32)
        self.suhu = float(isi["suhu"])
        self.kelas = [str(k) for k in isi["kelas"]]
        self.nama = f"efficientnet-lite0+softmax-{spesies}-v1"

    def prediksi(self, embedding: np.ndarray) -> tuple[str, float, list[dict]]:
        logits = (embedding @ self.W + self.b) / self.suhu
        logits = logits - logits.max()
        exp = np.exp(logits)
        peluang = exp / exp.sum()
        urut = np.argsort(-peluang)
        peringkat = [
            {"kelas": self.kelas[i], "peluang": round(float(peluang[i]), 4)} for i in urut
        ]
        teratas = urut[0]
        return self.kelas[teratas], float(peluang[teratas]), peringkat

MODEL: dict[str, ModelKlasifikasi] = {}
METADATA: dict = {}

def siapkan_model() -> None:

    global METADATA
    berkas_meta = MODEL_DIR / "metadata.json"
    if berkas_meta.exists():
        try:
            METADATA = json.loads(berkas_meta.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            METADATA = {}

    for spesies in ("sapi", "kambing", "ayam"):
        berkas = MODEL_DIR / f"{spesies}.npz"
        if berkas.exists():
            try:
                MODEL[spesies] = ModelKlasifikasi(spesies, berkas)
            except Exception as e:
                print(f"[ai-service] gagal memuat model {spesies}: {e}")

def ambil_embedder():

    global _EMBEDDER
    if _EMBEDDER is False:
        return None
    if _EMBEDDER is not None:
        return _EMBEDDER
    if not BERKAS_EMBEDDER.exists():
        print(f"[ai-service] {BERKAS_EMBEDDER.name} tidak ada -> mode dummy")
        _EMBEDDER = False
        return None
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision

    dasar = mp_python.BaseOptions(model_asset_path=str(BERKAS_EMBEDDER))
    opsi = vision.ImageEmbedderOptions(base_options=dasar, l2_normalize=True, quantize=False)
    _EMBEDDER = vision.ImageEmbedder.create_from_options(opsi)
    return _EMBEDDER

_EMBEDDER = None

def praproses(isi: bytes):

    try:
        gambar = Image.open(io.BytesIO(isi))
        gambar.load()
    except (UnidentifiedImageError, OSError):
        raise ValueError("Berkas bukan gambar yang valid.")

    lebar_asli, tinggi_asli = gambar.size
    if lebar_asli < 16 or tinggi_asli < 16:
        raise ValueError("Resolusi gambar terlalu kecil (minimal 16x16 piksel).")

    rgb = gambar.convert("RGB")
    kecil = rgb.resize(UKURAN_MODEL)

    stat = ImageStat.Stat(kecil)
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

def dummy_prediksi(spesies: str, rgb: Image.Image, info: dict):

    kecil = rgb.resize(UKURAN_MODEL)
    seed = kecil.tobytes()
    daftar = PENYAKIT_DUMMY[spesies]

    def acak(tanda: bytes, minimum: float, maksimum: float) -> float:
        angka = int.from_bytes(hashlib.sha256(seed + tanda).digest()[:6], "big")
        return minimum + (angka / 0xFFFFFFFFFFFF) * (maksimum - minimum)

    penyakit = daftar[int(acak(b"|idx", 0, 1000)) % len(daftar)]
    if acak(b"|yakin", 0, 1) < 0.20:
        confidence = acak(b"|rendah", 0.42, 0.68)
    else:
        confidence = acak(b"|tinggi", 0.74, 0.97)
    return penyakit, confidence, [], "dummy-v1"

@app.get("/health")
def health():
    model_aktif = {
        sp: {
            "model": m.nama,
            "kelas": m.kelas,
            "akurasi_uji": METADATA.get(sp, {}).get("akurasi_uji"),
        }
        for sp, m in MODEL.items()
    }
    return jsonify(
        status="ok",
        mode="nyata" if MODEL else "dummy",
        embedder=siapkan_embedder_aktif(),
        model=model_aktif,
        spesies=list(PENYAKIT_DUMMY.keys()),
    )

def siapkan_embedder_aktif() -> str:
    if not MODEL:
        return "tidak dipakai (mode dummy)"
    return "efficientnet_lite0.tflite" if BERKAS_EMBEDDER.exists() else "hilang"

@app.post("/predict")
def predict():
    mulai = time.perf_counter()

    spesies = (request.form.get("spesies") or "").strip().lower()
    if spesies not in PENYAKIT_DUMMY:
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

    model = MODEL.get(spesies)
    embedder = ambil_embedder() if model else None
    fitur_visual: list[str] = []

    if model and embedder is not None:
        import mediapipe as mp

        gambar = potong_bingkai_gelap(rgb)
        hasil = embedder.embed(
            mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(gambar))
        )
        embedding = np.asarray(hasil.embeddings[0].embedding, dtype=np.float32)
        penyakit, confidence, peringkat = model.prediksi(embedding)
        nama_model = model.nama
        fitur_visual = list(CIRI_KELAS.get(penyakit, []))
    else:
        penyakit, confidence, peringkat, nama_model = dummy_prediksi(spesies, rgb, info)
        fitur_visual = list(CIRI_KELAS.get(penyakit, []))

    if info["kecerahan"] < 60:
        fitur_visual.append("Catatan foto: pencahayaan terlalu gelap")
        confidence *= 0.72
    if info["kontras"] < 18:
        fitur_visual.append("Catatan foto: kurang tajam / kontras rendah")
        confidence *= 0.82

    confidence = round(min(max(confidence, 0.05), 0.99), 4)
    durasi = round((time.perf_counter() - mulai) * 1000, 1)

    return jsonify(
        spesies=spesies,
        penyakit=penyakit,
        confidence=confidence,
        fitur_visual=fitur_visual,
        kualitas_foto=info,
        peringkat=peringkat,
        peringatan=confidence < AMBANG_PERINGATAN,
        model=nama_model,
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

siapkan_model()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    if MODEL:
        print(f"[ai-service] model NYATA aktif: {', '.join(sorted(MODEL))}")
        for sp, m in sorted(MODEL.items()):
            akurasi = METADATA.get(sp, {}).get("akurasi_uji")
            tambahan = f", akurasi uji {akurasi * 100:.1f}%" if akurasi else ""
            print(f"[ai-service]   {sp:8} -> {', '.join(m.kelas)}{tambahan}")
    else:
        print("[ai-service] berkas model belum ada -> mode DUMMY")
    print(f"[ai-service] berjalan di http://localhost:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
