# Panduan Video Progres UTS — LivestockHealth Scan

Video dibuat dalam bentuk **presentasi slide** (PowerPoint), dengan **demo aplikasi
langsung** di tengahnya. Naskah yang diucapkan untuk setiap slide sudah tertanam
di **catatan pembicara** setiap slide, jadi bisa dibaca dari situ saat merekam.

- **Berkas slide:** `presentasi/UTS-LivestockHealth-Scan.pptx` (15 slide)
- **Durasi target:** 5 – 6 menit
- **Batas kumpul:** Senin, 19 Oktober 2026, 23.59
- **Wajib:** diunggah ke YouTube, lalu tautannya ditempel di `README.md` bagian 13

> Catatan: slide sengaja **tidak memuat penjelasan kode**. Isinya hanya seputar
> latar belakang, alur pemakaian, tampilan aplikasi, hasil, akurasi, dan progres fitur.

---

## 1. Yang harus ada di video (sesuai instruksi dosen)

| Tuntutan instruksi | Slide / bagian |
|---|---|
| Perkenalan (nama, NIM, judul) | Slide 1 |
| Progress dikumpulkan melalui GitHub | disebut di slide 1 / penutup |
| Prototype sudah dikerjakan | Slide 5 + demo langsung |
| Progress dihitung dari jumlah fitur | Slide 12 |
| Video diunggah ke YouTube | setelah selesai |

---

## 2. Susunan slide

| Slide | Isi | Bagian video |
|---|---|---|
| 1 | Judul — judul, nama, NIM | Pembuka |
| 2 | Latar belakang — 3 masalah | Pembuka |
| 3 | Solusi — apa itu LivestockHealth Scan | Pembuka |
| 4 | Isi aplikasi — yang bisa dilakukan pengguna | Sebelum demo |
| 5 | Alur pemakaian — 6 langkah | Sebelum demo |
| — | **DEMO APLIKASI LANGSUNG** | Demo |
| 6 | Tampilan — tangkapan layar 4 halaman | Sesudah demo |
| 7 | Cara kerja — apa yang terjadi setelah tekan Analisis | Sesudah demo |
| 8 | Halaman hasil — cara membaca donat & catatan | Sesudah demo |
| 9 | Model AI — dilatih sendiri, bukan data contoh | Sesudah demo |
| 10 | Akurasi — hasil pengujian apa adanya | Sesudah demo |
| 11 | Kasus gagal — format salah, terlalu besar, kuota habis | Sesudah demo |
| 12 | Progres — 17 dari 40 fitur (42,5%) | Penutup |
| 13 | Kejujuran data — mana yang nyata, mana yang contoh | Penutup |
| 14 | Rencana setelah UTS | Penutup |
| 15 | Terima kasih | Penutup |

---

## 3. Persiapan sebelum merekam

### 3.1 Bersihkan data supaya rekaman bersih

Tutup terminal backend dulu (`Ctrl+C`), baru hapus database:

```powershell
Remove-Item "C:\SEMESTER 5\ippl\livestockhealth-scan\backend\data\livestock.db"
```

Jalankan lagi backend — database baru dibuat otomatis, akun bersih, kuota mulai dari 3.

### 3.2 Nyalakan dua server (terminal terpisah)

Terminal 1 — layanan AI:
```powershell
cd "C:\SEMESTER 5\ippl\livestockhealth-scan\ai-service"
.\.venv-mediapipe\Scripts\python.exe app.py
```

Terminal 2 — backend + tampilan web:
```powershell
cd "C:\SEMESTER 5\ippl\livestockhealth-scan\backend"
node server.js
```

Cek di browser: `http://localhost:3000` harus terbuka. Tekan `Ctrl+F5` sekali
supaya tidak memuat tampilan lama dari cache.

### 3.3 Siapkan berkas di layar

- Buka `presentasi\UTS-LivestockHealth-Scan.pptx` di PowerPoint.
- Buka browser ke `http://localhost:3000`.
- Buka File Explorer ke `C:\SEMESTER 5\ippl\foto-demo`.

Isi folder foto demo (semua sudah diuji, hasilnya **pasti** seperti tabel ini):

| Berkas | Dipakai untuk | Hasil yang muncul |
|---|---|---|
| `1-ayam-coccidiosis.jpg` | scan ke-1 | Coccidiosis · **99%** · merah |
| `2-ayam-salmonellosis.jpg` | cadangan | Salmonellosis · 99% · merah |
| `3-ayam-tetelo.jpg` | cadangan | Tetelo · 94% · merah |
| `4-kambing-sehat.jpg` | scan ke-2 | Sehat · **99%** · hijau |
| `5-kambing-sakit-kulit.jpg` | cadangan | Gangguan Kulit (Scabies/Orf) · 99% · merah |
| `6-sapi-lsd.jpg` | cadangan | LSD · 87% · merah |
| `7-sapi-pmk.jpg` | cadangan | PMK · 54% · hijau (keyakinan rendah) |
| `8-sapi-keyakinan-rendah.jpg` | scan ke-3 | LSD · **66%** · hijau + catatan "keyakinan rendah" |
| `9-foto-terlalu-besar.jpg` | demo tolak ukuran | "Ukuran foto melebihi 5 MB." (8,6 MB) |
| `catatan-ternak.txt` | demo tolak format | "Format foto harus JPG atau PNG." |

### 3.4 Rekam dalam tiga bagian, lalu gabung

Cara paling aman dan paling mudah:

| Rekaman | Isi | Alat |
|---|---|---|
| **A** | Slide 1 – 5 | PowerPoint → *Slide Show* → *Record Slide Show* |
| **B** | Demo aplikasi langsung | Xbox Game Bar (`Win + G`) atau Clipchamp |
| **C** | Slide 6 – 15 | PowerPoint → *Slide Show* → *Record Slide Show* |

Lalu gabungkan A, B, C dengan **Clipchamp** (sudah ada di Windows 11, gratis),
dan ekspor jadi satu MP4.

**Kalau ingin sekali jadi (tanpa digabung):** rekam seluruh layar, jalankan
slideshow PowerPoint, lalu pindah ke browser dengan `Alt + Tab` saat waktunya demo.
Lebih cepat, tapi kalau ada salah harus mengulang dari awal.

**Tips merekam:**
- Uji dulu 30 detik untuk memastikan suara mikrofon terdengar jelas.
- PowerPoint punya *Record Slide Show*: pindah slide dengan tombol, narasi direkam
  per slide, dan hasilnya bisa langsung diekspor jadi MP4 1080p.
- Sambungkan mikrofon/headset kalau ada — suara dari mikrofon laptop biasanya bergema.
- Matikan notifikasi (Windows: *Focus assist*).

---

## 4. Saat merekam demo aplikasi (Rekaman B)

Urutannya sudah disusun supaya sekaligus membuktikan bahwa kuota tidak berkurang
kalau gagal, dan kuota gratis memang 3 kali.

**B1.** Daftar akun baru (nama, email, kata sandi). Langsung masuk ke Beranda.
Tunjukkan **sisa kuota: 3**.

**B2.** Scan ke-1 — pilih **Ayam**, foto `1-ayam-coccidiosis.jpg`, tekan Analisis.
Hasilnya **Coccidiosis 99%, donat merah**, ada catatan "perlu penanganan segera",
ciri khas kelas, rekomendasi medis, dan rekomendasi herbal.

**B3.** Kembali, scan ke-2 — pilih **Kambing**, foto `4-kambing-sehat.jpg`.
Hasilnya **Sehat 99%, donat hijau**, catatannya justru menyatakan ternak tampak sehat.

**B4.** Demo tolak berkas: pilih `catatan-ternak.txt` → muncul pesan format salah.
Lalu pilih `9-foto-terlalu-besar.jpg` → muncul pesan ukuran melebihi 5 MB.
Sebutkan bahwa **keduanya tidak mengurangi kuota**.

**B5.** Scan ke-3 — pilih **Sapi**, foto `8-sapi-keyakinan-rendah.jpg`.
Hasilnya **LSD 66%** dengan catatan "keyakinan rendah" dan saran memotret ulang.

**B6.** Buka **Riwayat** — tunjukkan tiga hasil tersimpan, dan warna pil persennya
berbeda-beda. Coba tombol saring per jenis ternak.

**B7.** Buka **Scan** sekali lagi, tekan Analisis memakai foto apa saja.
Muncul pesan **"Kuota gratis habis. Beli token untuk melanjutkan scan."**

Yang paling penting di bagian ini: **hasilnya berubah mengikuti foto** — ayam jadi
Coccidiosis, kambing jadi Sehat, sapi jadi LSD. Itu bukti modelnya nyata, bukan data contoh.

---

## 5. Delapan hal yang WAJIB disebut

1. Ini **indikasi awal**, bukan diagnosis pasti.
2. Modelnya dilatih dari dataset yang saya kumpulkan sendiri — bukan data contoh.
3. Akurasi disebut apa adanya: kambing 91,6%, ayam 78,0%, sapi 69,2%.
4. Penyebab akurasi sapi rendah: folder publik LSD banyak poster dan ilustrasi.
5. Batas model kambing: scabies dan orf belum bisa dipisahkan.
6. Batas model ayam: sebagian foto berupa kotoran dan alas kandang, bukan luka luar.
7. Pemindaian gagal **tidak** mengurangi kuota.
8. Kartu "Wabah di sekitar" di Beranda masih **data contoh**.

## 6. Jangan diucapkan

- "Akurasi aplikasi saya 99 persen." — angka 99% itu keyakinan satu foto, bukan akurasi model.
- "Aplikasi ini bisa mendiagnosis penyakit." — katakan "mengindikasikan".
- "Semua fitur sudah selesai." — baru 17 dari 40.
- "Data wabahnya dari Dinas Peternakan." — kartu itu masih contoh.

---

## 7. Setelah merekam

1. Gabungkan rekaman A, B, C di Clipchamp, ekspor MP4 1080p.
2. Unggah ke YouTube. Judul yang disarankan:
   `Progres UTS IPPL - LivestockHealth Scan - Mutia Rahmawati 11241065`
   Setelan **Unlisted** sudah cukup, yang penting tautannya bisa dibuka dosen.
3. Salin tautannya, tempel di `README.md` bagian 13.
4. Push ke GitHub: `git push origin main`
5. Kumpulkan sebelum Senin, 19 Oktober 2026, 23.59.

---

## 8. Kalau ada waktu kurang

Kalau rekamannya terasa terlalu panjang, yang boleh diringkas:

- **Slide 6 (Tampilan)** — boleh dilewati, karena halamannya sudah terlihat saat demo.
- **Slide 14 (Rencana)** — cukup sebutkan dua rencana utama, yaitu memperbaiki akurasi
  model sapi dan melengkapi alur sertifikasi.

Yang **jangan** dipotong: slide 9 (model AI nyata), slide 10 (akurasi apa adanya),
slide 12 (progres fitur), dan bagian demo B4–B7 (bukti kuota).

---

## 9. Kalau dosen bertanya "ini modelnya nyata atau cuma data contoh?"

Jawaban singkat:

> Nyata. Hasilnya berubah mengikuti foto — ayam menghasilkan Coccidiosis, kambing
> menghasilkan Sehat, sapi menghasilkan LSD. Kalau memakai data contoh, semua ternak
> akan dijawab sama.

Bukti pendukungnya ada di repositori:

- `docs/dataset-dan-model.md` — daftar dataset, jumlah foto, cara penyaringan,
  akurasi per kelas, dan keterbatasan yang saya akui.
- `docs/hasil-testing.md` — hasil 38 pemeriksaan otomatis yang semuanya lulus,
  termasuk pemeriksaan bahwa yang dipakai adalah model nyata, bukan mode cadangan.
- Halaman hasil di aplikasi mencantumkan nama model yang dipakai, misalnya
  `efficientnet-lite0+softmax-sapi-v1`.
