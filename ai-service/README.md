# AI Service - LivestockHealth Scan

Layanan inferensi berbasis Python (Flask). Klasifikasinya **memakai model yang
benar-benar dilatih** dari dataset ternak (lihat `latih.py` dan
`../docs/dataset-dan-model.md`).

Cara kerjanya:

1. Gambar divalidasi dan dipra-proses dengan Pillow (RF-08).
2. Gambar diubah menjadi 1000 angka (embedding) oleh **EfficientNet-Lite0**
   yang sudah terlatih di ImageNet lewat MediaPipe. Bagian ini **dibekukan**.
3. Di atas 1000 angka itu, sebuah **classifier softmax** yang dilatih dari
   dataset ternak Anda menentukan penyakitnya (RF-09, RF-11).
4. Keyakinan dikalibrasi dengan *temperature scaling* agar tidak terlalu
   percaya diri.
5. Bila berkas `model/*.npz` belum ada, layanan otomatis kembali ke mode
   dummy supaya aplikasi tetap dapat dijalankan dan diuji.

## Menjalankan

Disarankan memakai virtual environment di folder ini agar tidak bentrok dengan
Python sistem:

```powershell
py -3.11 -m venv .venv-mediapipe
.venv-mediapipe\Scripts\python.exe -m pip install -r requirements.txt
.venv-mediapipe\Scripts\python.exe app.py      # http://localhost:5000
```

Cara cepat: jalankan `jalankan-ai.bat` (sudah disiapkan di folder ini).

## Melatih ulang model

```powershell
.venv-mediapipe\Scripts\python.exe latih.py --periksa     # cek kebersihan dataset saja
.venv-mediapipe\Scripts\python.exe latih.py               # latih semua spesies
.venv-mediapipe\Scripts\python.exe latih.py --spesies sapi
```

Dataset diambil dari `..\..\IPPL dataset` (bisa diubah dengan `--dataset`).
Hasil latih: `model/<spesies>.npz`, laporan lengkap: `model/metadata.json`.

## Endpoint

| Metode | Path | Fungsi |
|---|---|---|
| GET | `/health` | Cek status layanan + model yang aktif + akurasi uji |
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
  "kualitas_foto": { "lebar_asli": 800, "tinggi_asli": 600, "ukuran_model": [224, 224], "kecerahan": 128.4, "kontras": 54.2 },
  "peringkat": [{ "kelas": "Lumpy Skin Disease (LSD)", "peluang": 0.8831 }],
  "peringatan": false,
  "model": "efficientnet-lite0+softmax-sapi-v1",
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

- Hasil bersifat **indikasi awal**, bukan diagnosis pasti.
- Akurasi model **dilaporkan apa adanya** di `model/metadata.json` dan
  `../docs/dataset-dan-model.md`, termasuk keterbatasan datasetnya.
- Kualitas model dibatasi oleh kualitas dataset publik yang tersedia: dataset
  sapi dan kambing hasil unduhan mengandung banyak gambar grafik/ilustrasi dan
  foto tidak berlabel penyakit yang spesifik. Hal ini dijelaskan terbuka pada
  dokumen tersebut.
