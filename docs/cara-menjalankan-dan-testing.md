# Cara Menjalankan dan Menguji

Panduan singkat untuk menjalankan prototype dan mengulang pengujiannya.
Ditulis supaya tidak perlu mengingat-ingat lagi.

**Prasyarat:** Node.js minimal 22.5 (diuji pada v26) dan Python 3.11+.
Dependensi sudah terpasang di mesin ini; kalau pindah komputer, lihat langkah
`npm install` dan `pip install` di bawah.

---

## 1. Menjalankan aplikasi (butuh 2 terminal)

Cara paling cepat: klik dua kali **`ai-service\jalankan-ai.bat`** dan
**`backend\jalankan-backend.bat`**. Langkah manualnya di bawah ini.

### Terminal 1 — layanan AI (Flask, port 5000)

```bash
cd ai-service
.venv-mediapipe\Scripts\python.exe app.py
```

Kalau virtual environment belum ada (komputer baru):

```bash
py -3.11 -m venv .venv-mediapipe
.venv-mediapipe\Scripts\python.exe -m pip install -r requirements.txt
```

Tanda berhasil:

```
[ai-service] model NYATA aktif: ayam, kambing, sapi
[ai-service]   sapi     -> Lumpy Skin Disease (LSD), Penyakit Mulut dan Kuku (PMK), Sehat, akurasi uji 69.2%
[ai-service] berjalan di http://localhost:5000
```

Kalau berbunyi `mode DUMMY`, berarti `ai-service/model/*.npz` belum ada —
jalankan dulu `latih.py` (bagian 6).

### Terminal 2 — backend (Express, port 3000)

```bash
cd backend
npm install                       # hanya sekali di komputer baru
node server.js
```

### Terminal 3 — buka aplikasinya

Buka browser ke **http://localhost:3000** → otomatis ke halaman Masuk.

> Catatan: `npm` diblokir oleh kebijakan eksekusi PowerShell di mesin ini.
> Kalau `npm install` menolak jalan, pakai: `cmd /c "npm.cmd install"`

---

## 2. Uji otomatis (36 pemeriksaan)

Cukup **backend utama (port 3000)** dan **Flask (port 5000)** yang hidup.
Skrip mengangkat sendiri backend kedua di port 3101 untuk menguji kasus
"layanan AI mati", jadi tidak ada persiapan tambahan.

```bash
cd backend
node uji-api.mjs
```

Hasil yang diharapkan:

```
Ringkasan: 36 lulus, 0 gagal, dari 36 pemeriksaan.
```

Kalau ada yang gagal, cek dulu: apakah Flask benar-benar hidup di port 5000.

---

## 3. Uji manual di browser (untuk screenshot dan video)

Urutannya sengaja begini supaya video presentasi bisa direkam sekali jalan.

| # | Yang dilakukan | Yang harus terlihat |
|---|---|---|
| 1 | Daftar akun baru di halaman Daftar | Masuk ke Beranda, "Scan gratis tersisa: 3" |
| 2 | Buka Beranda | Sapaan pakai nama, 2 kartu wabah, 6 menu akses cepat |
| 3 | Klik **Mulai Scan** | Langkah 1 dari 3, pilih jenis ternak |
| 4 | Pilih **Sapi** → Lanjut | Langkah 2, unggah foto |
| 5 | Unggah foto **bukan JPG/PNG** (mis. `.txt`) | Ditolak, pesan "Format foto harus JPG atau PNG" |
| 6 | Unggah foto **lebih dari 5 MB** | Ditolak, pesan "Ukuran foto melebihi 5 MB" |
| 7 | Unggah foto JPG asli → Analisis | Proses berjalan, lalu pindah ke Hasil |
| 8 | Halaman Hasil | Donat keyakinan, penyakit, ciri khas kelas, obat medis, herbal |
| 9 | Klik **Riwayat** | 1 data tersimpan, pil persen berwarna |
| 10 | Scan lagi sampai kuota habis (total 3x) | Sisa scan 3 → 2 → 1 → 0 |
| 11 | Scan ke-4 | Ditolak: "Kuota gratis habis", kuota tidak berkurang |
| 12 | Cek konsol (F12) → Application → Local Storage | Ada `token`, tidak ada kata sandi |

### Bukti "kuota tidak berkurang saat gagal"

1. Catat sisa kuota di Beranda.
2. Matikan Flask (Ctrl+C di terminal 1).
3. Coba scan → muncul pesan gagal, kuota **tidak** berkurang.
4. Nyalakan Flask lagi, scan lagi → berhasil, kuota baru berkurang.

### Bukti "hasil tidak bisa dibuka orang lain"

Buka jendela **incognito** → daftar akun berbeda → buka Riwayat →
daftar hasil milik akun pertama tidak terlihat.

---

## 4. Mengosongkan data (akun dan riwayat)

Semua akun dan riwayat tersimpan di `backend/data/livestock.db`.

1. Hentikan backend (Ctrl+C di terminal 2).
2. Hapus folder `backend/data/`.
3. Jalankan `node server.js` lagi → database dibuat ulang, akun kosong.

Berguna sebelum rekaman video supaya mulai dari nol.

---

## 5. Kalau ada yang aneh

| Gejala | Sebab dan solusinya |
|---|---|
| Halaman tidak mau dibuka | Backend belum jalan (port 3000) |
| Scan gagal, pesan 502 | Flask belum jalan atau mati (port 5000) |
| Flask bilang `mode DUMMY` | Berkas `ai-service/model/*.npz` belum ada → lihat bagian 6 |
| "Kuota gratis habis" padahal baru daftar | Data lama masih ada → kosongkan `backend/data/` |
| Tampilan tidak berubah setelah diedit | Cache browser → `Ctrl + Shift + R` |
| Port sudah dipakai | Cari prosesnya: `Get-NetTCPConnection -LocalPort 3000` |
| `node:sqlite` tidak ditemukan | Node.js terlalu tua, minimal versi 22.5 |
| Flask tidak mau jalan: `No module named 'mediapipe'` | Dipanggil dengan Python yang salah. Pakai `.venv-mediapipe\Scripts\python.exe app.py` |

---

## 6. Melatih ulang model (kalau perlu)

Model yang dipakai aplikasi dilatih dari folder `..\..\IPPL dataset`.

```bash
cd ai-service
.venv-mediapipe\Scripts\python.exe latih.py --periksa   # cek kebersihan dataset
.venv-mediapipe\Scripts\python.exe latih.py             # latih semua spesies
```

Hasilnya:

- `ai-service/model/sapi.npz`, `kambing.npz`, `ayam.npz` → berkas model
- `ai-service/model/metadata.json` → akurasi uji, recall per kelas, laporan penyaringan
- `ai-service/model/.cache/` → simpanan embedding (supaya latih ulang cepat)

Setelah itu, **restart Flask** supaya model baru dimuat.

Penjelasan lengkap dataset, cara penyaringan, dan keterbatasannya ada di
`docs/dataset-dan-model.md`.
