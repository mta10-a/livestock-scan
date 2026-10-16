# AI Service - LivestockHealth Scan

Layanan inferensi berbasis Python (Flask). Pada prototype UTS ini masih memakai
**model dummy** (bukan model AI asli) agar alur backend s.d. Flask dapat diuji.

## Menjalankan

```bash
pip install -r requirements.txt
python app.py
# berjalan di http://localhost:5000
```

## Endpoint

| Metode | Path | Fungsi |
|---|---|---|
| GET | `/health` | Cek status layanan |
| POST | `/predict` | Prediksi penyakit (multipart) |

### POST /predict

Form-data:

| Field | Tipe | Keterangan |
|---|---|---|
| `gambar` | file | Wajib. JPG/PNG, maksimal 5 MB |
| `spesies` | text | Wajib. `sapi`, `kambing`, atau `ayam` |

Contoh balasan (200):

```json
{
  "spesies": "sapi",
  "penyakit": "Lumpy Skin Disease (LSD)",
  "confidence": 0.8831,
  "fitur_visual": ["Benjolan keras (nodul) pada kulit", "..."],
  "peringatan": false,
  "model": "dummy-v1",
  "durasi_ms": 431.2
}
```

Kode error:

| Kode | Sebab |
|---|---|
| 400 | Spesies tidak dikenal, berkas tidak ada/kosong, format bukan JPG/PNG |
| 413 | Ukuran gambar melebihi 5 MB |
| 404 | Endpoint tidak ditemukan |
| 405 | Metode HTTP salah |

## Catatan

Hasil bersifat **indikasi awal**, bukan diagnosis pasti. Model asli per spesies
(MediaPipe Model Maker) direncanakan setelah UTS.
