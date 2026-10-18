from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageStat

BASE = Path(__file__).resolve().parent
MODEL_DIR = BASE / "model"
CACHE_DIR = MODEL_DIR / ".cache"
EKSTENSI = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

SPESIES_SPEC = {
    "sapi": {
        "judul": "Sapi",
        "kelas": {
            "Sehat": [
                ("Cow lumpy disease dataset/healthycows", None, "ketat"),
            ],
            "Lumpy Skin Disease (LSD)": [
                ("Cow lumpy disease dataset/lumpycows", None, "ketat"),
            ],
            "Penyakit Mulut dan Kuku (PMK)": [
                ("FMD Cattle Dataset/train", "train", "ketat"),
                ("FMD Cattle Dataset/valid", "valid", "ketat"),
                ("FMD Cattle Dataset/test", "test", "ketat"),
                ("Anotasi-PMK-SAPI.v1i.voc/train", None, "ketat"),
            ],
        },
    },
    "kambing": {
        "judul": "Kambing",
        "kelas": {
            "Sehat": [
                ("Healthy and Unhealthy Goat Images/healthy_goat", None, "ketat"),
            ],
            "Gangguan Kulit (Scabies/Orf)": [
                ("Healthy and Unhealthy Goat Images/unhealthy_goat", None, "ketat"),
            ],
        },
    },
    "ayam": {
        "judul": "Ayam",
        "kelas": {
            "Coccidiosis": [
                ("chicken_disease_dataset/chicken_disease/train/Coccidiosis", "train", "ringan"),
                ("chicken_disease_dataset/chicken_disease/validation/Coccidiosis", "valid", "ringan"),
                ("chicken_disease_dataset/chicken_disease/test/Coccidiosis", "test", "ringan"),
            ],
            "Sehat": [
                ("chicken_disease_dataset/chicken_disease/train/Healthy", "train", "ringan"),
                ("chicken_disease_dataset/chicken_disease/validation/Healthy", "valid", "ringan"),
                ("chicken_disease_dataset/chicken_disease/test/Healthy", "test", "ringan"),
            ],
            "Tetelo (Newcastle Disease)": [
                ("chicken_disease_dataset/chicken_disease/train/New Castle Disease", "train", "ringan"),
                ("chicken_disease_dataset/chicken_disease/validation/New Castle Disease", "valid", "ringan"),
                ("chicken_disease_dataset/chicken_disease/test/New Castle Disease", "test", "ringan"),
            ],
            "Salmonellosis": [
                ("chicken_disease_dataset/chicken_disease/train/Salmonella", "train", "ringan"),
                ("chicken_disease_dataset/chicken_disease/validation/Salmonella", "valid", "ringan"),
                ("chicken_disease_dataset/chicken_disease/test/Salmonella", "test", "ringan"),
            ],
        },
    },
}

MIN_SISI = 64
MAKS_RASIO = 3.0
MIN_SIMPANG = 6.0
MIN_WARNA = 8000
MAKS_DATAR = 88.0
MAKS_BG_PUTIH = 0.50

MONTASE_DIR = Path(os.environ.get("LAPORAN_BERSIH", Path(os.environ.get("TEMP", ".")) / "opencode" / "laporan-bersih"))

def potong_bingkai_gelap(gambar: Image.Image) -> Image.Image:

    abu = np.asarray(gambar.convert("L")).astype(np.int16)
    batas = 12
    h, w = abu.shape

    def gelap(iris) -> bool:
        return iris.size > 0 and (iris < batas).mean() > 0.93

    atas, bawah, kiri, kanan = 0, h, 0, w
    while atas < h - 20 and gelap(abu[atas]):
        atas += 1
    while bawah > atas + 20 and gelap(abu[bawah - 1]):
        bawah -= 1
    while kiri < w - 20 and gelap(abu[:, kiri]):
        kiri += 1
    while kanan > kiri + 20 and gelap(abu[:, kanan - 1]):
        kanan -= 1
    if (atas, kiri, bawah, kanan) != (0, 0, h, w):
        gambar = gambar.crop((kiri, atas, kanan, bawah))
    return gambar

def nilai_kebersihan(gambar: Image.Image) -> dict:
    rgb = gambar.convert("RGB")
    w, h = rgb.size
    kecil = min(w, h)
    rasio = max(w, h) / max(1, kecil)
    simp = ImageStat.Stat(rgb.convert("L")).stddev[0]

    warna = rgb.resize((256, 256)).getcolors(maxcolors=256 * 256)
    warna = 256 * 256 if warna is None else len(warna)

    arr = np.asarray(rgb.resize((128, 128)), dtype=np.uint8)
    b = int(128 * 0.12)
    tepi = np.concatenate([
        arr[:b].reshape(-1, 3), arr[-b:].reshape(-1, 3),
        arr[:, :b].reshape(-1, 3), arr[:, -b:].reshape(-1, 3),
    ])
    bg_putih = float((tepi.min(axis=1) > 240).mean())

    abu = np.asarray(rgb.resize((128, 128)).convert("L")).astype(np.float32)
    pad = np.pad(abu, 1, mode="edge")
    tetangga = np.stack([pad[:-2, 1:-1], pad[2:, 1:-1], pad[1:-1, :-2], pad[1:-1, 2:], abu])
    datar = float((tetangga.std(axis=0) < 2.0).mean() * 100)

    return {
        "sisi": kecil,
        "rasio": round(rasio, 2),
        "simpang": round(float(simp), 1),
        "warna": warna,
        "datar": round(datar, 1),
        "bg_putih": round(bg_putih, 3),
    }

def layak(n: dict, profil: str = "ketat") -> tuple[bool, str]:

    if n["sisi"] < MIN_SISI:
        return False, "terlalu kecil"
    if n["rasio"] > MAKS_RASIO:
        return False, "rasio ekstrem"
    if n["simpang"] < MIN_SIMPANG:
        return False, "gambar rata/kosong"
    if profil == "ringan":
        return True, ""
    if n["warna"] < MIN_WARNA:
        return False, "bukan foto (grafik/garis)"
    if n["datar"] > MAKS_DATAR:
        return False, "mirip poster/infografis"
    if n["bg_putih"] > MAKS_BG_PUTIH:
        return False, "foto latar putih (studio)"
    return True, ""

def buat_pengekstrak():
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision

    model = MODEL_DIR / "efficientnet_lite0.tflite"
    if not model.exists():
        raise SystemExit(
            f"Model dasar tidak ada: {model}\n"
            "Unduh dulu efficientnet_lite0.tflite (lihat README ai-service)."
        )
    dasar = mp_python.BaseOptions(model_asset_path=str(model))
    opsi = vision.ImageEmbedderOptions(base_options=dasar, l2_normalize=True, quantize=False)
    embedder = vision.ImageEmbedder.create_from_options(opsi)

    def ekstrak(gambar: Image.Image) -> np.ndarray:
        arr = np.asarray(gambar.convert("RGB"))
        hasil = embedder.embed(mp.Image(image_format=mp.ImageFormat.SRGB, data=arr))
        return np.asarray(hasil.embeddings[0].embedding, dtype=np.float32)

    return ekstrak

def bagi_otomatis(relatif: str) -> str:

    angka = int(hashlib.sha1(relatif.encode("utf-8")).hexdigest()[:8], 16) % 100
    if angka < 70:
        return "train"
    if angka < 85:
        return "valid"
    return "test"

def kumpulkan(dataset_root: Path, spesies: str, tulis_montase: bool) -> tuple[list, dict]:

    butir, laporan = [], {}
    dibuang = []

    for kelas, sumber in SPESIES_SPEC[spesies]["kelas"].items():
        stat = {"terbaca": 0, "lolos": 0, "dibuang": {}}
        for rel, split_paksa, profil in sumber:
            folder = dataset_root / rel
            if not folder.exists():
                print(f"  ! folder tidak ada: {folder}")
                continue
            for berkas in sorted(folder.iterdir()):
                if not berkas.is_file() or berkas.suffix.lower() not in EKSTENSI:
                    continue
                stat["terbaca"] += 1
                try:
                    with Image.open(berkas) as im:
                        im.load()
                        gambar = potong_bingkai_gelap(im)
                except Exception:
                    stat["dibuang"]["gagal dibaca"] = stat["dibuang"].get("gagal dibaca", 0) + 1
                    dibuang.append((kelas, berkas, "gagal dibaca"))
                    continue

                nilai = nilai_kebersihan(gambar)
                ok, alasan = layak(nilai, profil)
                if not ok:
                    stat["dibuang"][alasan] = stat["dibuang"].get(alasan, 0) + 1
                    dibuang.append((kelas, berkas, alasan))
                    continue

                relatif = f"{kelas}/{berkas.name}"
                split = split_paksa or bagi_otomatis(relatif)
                butir.append((str(berkas), kelas, split))
                stat["lolos"] += 1
        laporan[kelas] = stat

    if tulis_montase and dibuang:
        tulis_montase_dibuang(dibuang)
    return butir, laporan

def tulis_montase_dibuang(dibuang: list) -> None:
    MONTASE_DIR.mkdir(parents=True, exist_ok=True)
    per_alasan: dict[str, list] = {}
    for kelas, berkas, alasan in dibuang:
        per_alasan.setdefault(f"{alasan}", []).append(berkas)

    for alasan, daftar in per_alasan.items():
        sel, kolom = 150, 6
        contoh = daftar[:24]
        baris = (len(contoh) + kolom - 1) // kolom
        lembar = Image.new("RGB", (kolom * sel, max(1, baris) * sel), (240, 240, 240))
        for i, berkas in enumerate(contoh):
            try:
                im = Image.open(berkas).convert("RGB")
                im.thumbnail((sel - 6, sel - 6))
                lembar.paste(im, ((i % kolom) * sel + 3, (i // kolom) * sel + 3))
            except Exception:
                pass
        nama = alasan.replace("/", "-").replace(" ", "_")
        tujuan = MONTASE_DIR / f"dibuang-{nama}.png"
        lembar.save(tujuan)
        print(f"    montase {len(daftar):5} gambar -> {tujuan}")

def embedding_semua(butir: list, ekstrak, spesies: str) -> np.ndarray:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    berkas_cache = CACHE_DIR / f"{spesies}-embedding.npz"

    simpan = {}
    if berkas_cache.exists():
        lama = np.load(berkas_cache, allow_pickle=False)
        for k in lama.files:
            simpan[k] = lama[k]

    X = np.zeros((len(butir), 1000), dtype=np.float32)
    baru = 0
    mulai = time.perf_counter()
    for i, (path, _kelas, _split) in enumerate(butir):
        kunci = hashlib.sha1((path + str(os.path.getmtime(path))).encode()).hexdigest()[:20]
        if kunci in simpan:
            X[i] = simpan[kunci]
        else:
            with Image.open(path) as im:
                im.load()
                gambar = potong_bingkai_gelap(im)
            X[i] = ekstrak(gambar)
            simpan[kunci] = X[i]
            baru += 1
        if (i + 1) % 500 == 0:
            print(f"    {i + 1}/{len(butir)} gambar ... ({(time.perf_counter() - mulai):.0f} s)")

    np.savez_compressed(berkas_cache, **simpan)
    print(f"    embedding selesai: {len(butir)} butir ({baru} baru dihitung)")
    return X

def softmax(z: np.ndarray) -> np.ndarray:
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def latih_linear(X: np.ndarray, y: np.ndarray, jumlah_kelas: int, epochs: int = 600):
    n, d = X.shape
    W = np.zeros((d, jumlah_kelas), dtype=np.float32)
    b = np.zeros(jumlah_kelas, dtype=np.float32)

    mW = np.zeros_like(W); vW = np.zeros_like(W)
    mb = np.zeros_like(b); vb = np.zeros_like(b)
    lr, beta1, beta2, eps = 0.05, 0.9, 0.999, 1e-8
    Y = np.zeros((n, jumlah_kelas), dtype=np.float32)
    Y[np.arange(n), y] = 1
    klas_berat = n / (jumlah_kelas * np.bincount(y, minlength=jumlah_kelas))
    bobot = klas_berat[y][:, None].astype(np.float32)
    reg = 1e-4

    for ep in range(1, epochs + 1):
        P = softmax(X @ W + b)
        G = (P - Y) * bobot / n
        gW = X.T @ G + reg * W
        gb = G.sum(axis=0)
        for par, g, m, v in ((W, gW, mW, vW), (b, gb, mb, vb)):
            m *= beta1; m += (1 - beta1) * g
            v *= beta2; v += (1 - beta2) * g * g
            mhat = m / (1 - beta1 ** ep)
            vhat = v / (1 - beta2 ** ep)
            par -= lr * mhat / (np.sqrt(vhat) + eps)
    return W, b

def kalibrasi_suhu(logits: np.ndarray, y: np.ndarray) -> float:

    terbaik, T_terbaik = None, 1.0
    for T in np.arange(0.4, 4.01, 0.05):
        P = softmax(logits / T)
        nll = -np.log(np.clip(P[np.arange(len(y)), y], 1e-9, 1.0)).mean()
        if terbaik is None or nll < terbaik:
            terbaik, T_terbaik = nll, float(T)
    return T_terbaik

def laporan_uji(P: np.ndarray, y: np.ndarray, kelas: list[str]) -> dict:
    pred = P.argmax(axis=1)
    akurasi = float((pred == y).mean()) if len(y) else 0.0
    matriks = np.zeros((len(kelas), len(kelas)), dtype=int)
    for t, p in zip(y, pred):
        matriks[t, p] += 1
    per_kelas = {}
    for i, nama in enumerate(kelas):
        total = int(matriks[i].sum())
        per_kelas[nama] = {
            "jumlah": total,
            "benar": int(matriks[i, i]),
            "recall": round(float(matriks[i, i] / total), 4) if total else None,
        }
    return {
        "akurasi_uji": round(akurasi, 4),
        "jumlah_uji": int(len(y)),
        "per_kelas": per_kelas,
        "matriks_kesalahan": matriks.tolist(),
    }

def latih_spesies(spesies: str, dataset_root: Path, ekstrak, periksa_saja: bool, maks: int | None):
    print(f"\n=== {spesies.upper()} ===")
    butir, laporan = kumpulkan(dataset_root, spesies, tulis_montase=periksa_saja)
    total_lolos = sum(s["lolos"] for s in laporan.values())
    print(f"  gambar terbaca: {sum(s['terbaca'] for s in laporan.values())}, lolos: {total_lolos}")
    for kelas, stat in laporan.items():
        buang = ", ".join(f"{k}={v}" for k, v in stat["dibuang"].items()) or "-"
        print(f"    {kelas:32} lolos={stat['lolos']:5}  dibuang: {buang}")

    if periksa_saja:
        return None

    kelas_daftar = sorted(SPESIES_SPEC[spesies]["kelas"].keys())
    if maks:
        tersaring = []
        for k in kelas_daftar:
            milik = [x for x in butir if x[1] == k][:maks]
            tersaring += milik
        butir = tersaring

    if not butir:
        print("  ! tidak ada gambar yang lolos, dilewati")
        return None

    X = embedding_semua(butir, ekstrak, spesies)
    y = np.array([kelas_daftar.index(k) for _p, k, _s in butir], dtype=np.int64)
    split = np.array([s for _p, _k, s in butir])

    latih_idx = np.where(split == "train")[0]
    valid_idx = np.where(split == "valid")[0]
    uji_idx = np.where(split == "test")[0]
    if len(valid_idx) == 0:
        valid_idx = uji_idx
    print(f"  latih={len(latih_idx)} validasi={len(valid_idx)} uji={len(uji_idx)}")

    W, b = latih_linear(X[latih_idx], y[latih_idx], len(kelas_daftar))
    suhu = kalibrasi_suhu(X[valid_idx] @ W + b, y[valid_idx]) if len(valid_idx) else 1.0

    hasil = {"suhu": suhu, "kelas": kelas_daftar}
    if len(uji_idx):
        P = softmax((X[uji_idx] @ W + b) / suhu)
        hasil.update(laporan_uji(P, y[uji_idx], kelas_daftar))
        print(f"  akurasi uji: {hasil['akurasi_uji'] * 100:.1f}%  ({hasil['jumlah_uji']} gambar)")
        for nama, info in hasil["per_kelas"].items():
            r = f"{info['recall'] * 100:.1f}%" if info["recall"] is not None else "-"
            print(f"    {nama:32} benar {info['benar']:5}/{info['jumlah']:<5} recall {r}")

    np.savez_compressed(
        MODEL_DIR / f"{spesies}.npz",
        W=W, b=b, suhu=np.float32(suhu),
        kelas=np.array(kelas_daftar),
    )
    hasil["penyaringan"] = laporan
    return hasil

def main() -> int:
    p = argparse.ArgumentParser(description="Latih model nyata LivestockHealth Scan")
    p.add_argument("--dataset", default=str(Path(__file__).resolve().parents[2] / "IPPL dataset"))
    p.add_argument("--spesies", choices=list(SPESIES_SPEC), help="latih satu spesies saja")
    p.add_argument("--periksa", action="store_true", help="hanya cek kebersihan dataset")
    p.add_argument("--maks", type=int, help="batasi gambar per kelas (untuk uji cepat)")
    a = p.parse_args()

    dataset_root = Path(a.dataset)
    if not dataset_root.exists():
        raise SystemExit(f"Folder dataset tidak ditemukan: {dataset_root}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    ekstrak = None if a.periksa else buat_pengekstrak()

    spesies_daftar = [a.spesies] if a.spesies else list(SPESIES_SPEC)
    metadata = {}
    berkas_meta = MODEL_DIR / "metadata.json"
    if berkas_meta.exists():
        metadata = json.loads(berkas_meta.read_text(encoding="utf-8"))

    mulai = time.perf_counter()
    for sp in spesies_daftar:
        hasil = latih_spesies(sp, dataset_root, ekstrak, a.periksa, a.maks)
        if hasil:
            metadata[sp] = hasil

    if not a.periksa:
        berkas_meta.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nSelesai dalam {time.perf_counter() - mulai:.0f} s. Metadata: {berkas_meta}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
