# LivestockHealth Scan

Aplikasi berbasis AI untuk membantu peternak lokal di Indonesia mendeteksi dini **penyakit luar/fisik** pada sapi, kambing, dan ayam melalui foto.

- **Penyusun:** Mutia Rahmawati (11241065)
- **Mata kuliah:** IPPL (Tugas Besar)
- **Tahap saat ini:** Prototype UTS selesai — **17 dari 17 RF direncanakan berjalan (42,5%)**

> **Catatan jujur:** alur aplikasi (registrasi, login, scan, hasil, riwayat, kuota) sudah berjalan
> penuh. Namun **model klasifikasi penyakit masih dummy**; pra-pemrosesan gambar dan evaluasi
> kualitas foto sudah memakai gambar sungguhan. Model AI asli dikerjakan setelah UTS.

---

## 1. Latar Belakang dan Masalah

Peternak lokal sering terlambat mengetahui penyakit pada ternaknya karena akses ke dokter hewan terbatas. Penyakit seperti PMK, LSD, Scabies, Orf, dan Coccidiosis menyebar cepat dan menimbulkan kerugian besar, terutama menjelang Idul Adha.

LivestockHealth Scan memberi **pemeriksaan awal yang cepat lewat foto**, lengkap dengan tingkat keyakinan dan saran penanganan, sehingga peternak bisa bertindak lebih dini.

## 2. Tujuan Produk

1. Peternak dapat memperoleh indikasi awal penyakit fisik ternak dalam hitungan detik.
2. Hasil disertai **confidence (%)** dan peringatan bila keyakinan rendah.
3. Peternak mendapat rekomendasi penanganan medis dan tradisional (herbal).
4. Setiap hasil tersimpan sebagai riwayat medis ternak.
5. Produk berkelanjutan lewat model 3x scan gratis, lalu token berbayar.

## 3. Pengguna

| Peran | Kebutuhan utama |
|---|---|
| Peternak | Scan ternak, lihat hasil dan riwayat, konsultasi, e-sertifikat |
| Dokter Hewan | Melayani konsultasi dan memvalidasi e-sertifikat |
| Admin | Verifikasi dokter dan laporan wabah, kelola data master dan transaksi |

Prototype UTS hanya mengerjakan peran **Peternak**.

## 4. Cakupan Produk

**Mendeteksi:** penyakit luar/fisik (kulit dan tampak visual).
**Spesies dan penyakit:** Sapi (PMK, LSD), Kambing (Scabies, Orf), Ayam (Coccidiosis).

**Batasan:**
- Hasil AI adalah indikasi awal, bukan diagnosis pasti.
- Tidak mendeteksi penyakit dalam/organ.
- Bukan platform jual beli obat atau ternak.
- Pembayaran diproses pihak ketiga (Payment Gateway).
- E-sertifikat wajib divalidasi Dokter Hewan terverifikasi.

## 5. Fitur dan Status Implementasi (RF-01 s.d. RF-40)

Sumber: dokumen SRS. Status diperbarui seiring pengerjaan.

**Legenda:** Selesai | Selesai (model dummy) | Ditunda

| ID | Fitur | Prioritas | Status |
|---|---|---|---|
| RF-01 | Registrasi akun | UTS | Selesai |
| RF-02 | Login sesuai peran | UTS | Selesai |
| RF-03 | Lengkapi profil peternakan | Nanti | Ditunda |
| RF-04 | Registrasi dan verifikasi dokter hewan | Nanti | Ditunda |
| RF-05 | Pilih jenis ternak | UTS | Selesai |
| RF-06 | Ambil/unggah foto ternak | UTS | Selesai |
| RF-07 | Validasi data dan hak akses scan | UTS | Selesai |
| RF-08 | Pra-pemrosesan gambar | UTS | Selesai |
| RF-09 | Pemilihan model AI per spesies | UTS | Selesai (model dummy) |
| RF-10 | Ekstraksi dan evaluasi fitur visual | UTS | Selesai (model dummy) |
| RF-11 | Klasifikasi penyakit berdasarkan pola | UTS | Selesai (model dummy) |
| RF-12 | Tampilkan akurasi (confidence) | UTS | Selesai |
| RF-13 | Peringatan akurasi rendah | UTS | Selesai |
| RF-14 | Rekomendasi obat medis | UTS | Selesai |
| RF-15 | Rekomendasi jamu/herbal | UTS | Selesai |
| RF-16 | Penyimpanan hasil diagnosis | UTS | Selesai |
| RF-17 | Pengiriman hasil ke peternak | UTS | Selesai |
| RF-18 | Lihat riwayat medis | UTS | Selesai |
| RF-19 | Lihat peta wabah | Nanti | Ditunda |
| RF-20 | Lihat tarif dan syarat e-sertifikat | Nanti | Ditunda |
| RF-21 | Ajukan e-sertifikat | Nanti | Ditunda |
| RF-22 | Permintaan validasi ke dokter hewan | Nanti | Ditunda |
| RF-23 | Penerbitan e-sertifikat | Nanti | Ditunda |
| RF-24 | Kirim laporan wabah | Nanti | Ditunda |
| RF-25 | Verifikasi laporan wabah (Admin) | Nanti | Ditunda |
| RF-26 | Kuota gratis 3x scan | UTS | Selesai |
| RF-27 | Halaman pembelian token | Nanti | Ditunda |
| RF-28 | Lihat biaya layanan | Nanti | Ditunda |
| RF-29 | Teruskan ke Payment Gateway | Nanti | Ditunda |
| RF-30 | Catat transaksi dan perbarui saldo | Nanti | Ditunda |
| RF-31 | Lihat dokter dan biaya | Nanti | Ditunda |
| RF-32 | Kirim permintaan konsultasi | Nanti | Ditunda |
| RF-33 | Tinjau kasus dan balasan medis | Nanti | Ditunda |
| RF-34 | Simpan hasil konsultasi | Nanti | Ditunda |
| RF-35 | Kirim dokumen registrasi dokter | Nanti | Ditunda |
| RF-36 | Periksa dokumen dokter (Admin) | Nanti | Ditunda |
| RF-37 | Ubah status verifikasi dokter | Nanti | Ditunda |
| RF-38 | Kelola data akun (Admin) | Nanti | Ditunda |
| RF-39 | Kelola data master dan tarif | Nanti | Ditunda |
| RF-40 | Laporan transaksi dan statistik | Nanti | Ditunda |

### Ringkasan progres

| Keterangan | Jumlah | Persentase |
|---|---|---|
| Total kebutuhan fungsional | 40 | 100% |
| Minimal target UTS | 12 | 30% |
| **Target yang direncanakan** | **17** | **42,5%** |
| Sudah selesai dan teruji | 17 | 42,5% |

## 6. Alur Utama Pengguna

```
Daftar/Login -> Beranda -> Pilih spesies -> Unggah foto -> (Gejala)
   -> Hasil: penyakit + confidence + peringatan + rekomendasi -> Riwayat
```

Aturan kuota: setiap akun baru mendapat 3x scan gratis. Scan yang gagal diproses **tidak memotong kuota**. Jika kuota habis, tampil pesan "Kuota gratis habis".

## 7. Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript (tampilan mobile) |
| Backend | Node.js + Express, SQLite (`node:sqlite` bawaan Node), bcryptjs, JWT, multer |
| AI Service | Python (Flask) + Pillow untuk pra-pemrosesan gambar; model klasifikasi masih dummy; rencana MediaPipe Model Maker (image classification) |
| Pengujian | Skrip Node.js (`backend/uji-api.mjs`) untuk uji otomatis REST API |
| Desain | Figma |

Arsitektur: `Browser -> Node.js (login, kuota, riwayat) -> Flask (inferensi AI)`.

## 8. Struktur Repository

```
livestockhealth-scan/
├── README.md
├── frontend/      halaman HTML/CSS/JS + aset (img/logo.png, img/favicon.png)
├── backend/       server Express (server.js), database (db.js), rekomendasi (rekomendasi.js), uji API (uji-api.mjs)
├── ai-service/    layanan Flask + pra-pemrosesan gambar (app.py)
└── docs/          SRS, SDD, desain Figma, hasil testing, screenshot
```

## 9. Cara Menjalankan

Prasyarat: Node.js (minimal 22.5, karena memakai modul `node:sqlite`; diuji pada v26), Python 3.10+.

```bash
# 1. AI service (terminal 1)
cd ai-service
pip install -r requirements.txt
python app.py            # berjalan di http://localhost:5000

# 2. Backend (terminal 2)
cd backend
npm install
node server.js           # berjalan di http://localhost:3000

# 3. Frontend
# Cara termudah: buka http://localhost:3000 (frontend sudah disajikan oleh backend).
# Alternatif: buka folder frontend di VS Code, klik kanan login.html, Open with Live Server.
```

## 10. Endpoint API

| Endpoint | Fungsi | RF |
|---|---|---|
| POST /api/register | Daftar akun | RF-01 |
| POST /api/login | Login, mengembalikan token | RF-02 |
| GET /api/me | Nama dan sisa scan | RF-26 |
| POST /api/scan | Validasi, cek kuota, panggil AI, simpan riwayat | RF-05 s.d. RF-17 |
| GET /api/riwayat | Daftar scan milik pengguna | RF-18 |
| GET /api/riwayat/:id | Detail satu hasil scan | RF-18 |
| GET /health (Flask) | Status layanan AI | — |
| POST /predict (Flask) | Penyakit dan confidence | RF-08 s.d. RF-12 |

## 11. Kebutuhan Non-Fungsional (ringkas)

- Password disimpan dalam bentuk hash (NFR-10).
- Antarmuka sederhana untuk literasi digital rendah sampai menengah (NFR-08, NFR-09).
- Proses AI maksimal 10 detik pada jaringan 4G (NFR-06).
- Akses fitur dibatasi per peran (NFR-13).

## 12. Pengujian

Test case ada pada dokumen kuis (TC-F01 s.d. TC-F20).

**Hasil pengujian otomatis:** 36 pemeriksaan, 36 lulus, 0 gagal. Rincian lengkap ada di
`docs/hasil-testing.md`. Skrip pengujian: `backend/uji-api.mjs` (jalankan dengan `node uji-api.mjs`
selagi AI service dan backend berjalan).

Yang sudah terverifikasi antara lain:

- Registrasi, login, dan penolakan token palsu.
- Foto bukan JPG/PNG, foto > 5 MB, dan berkas yang bukan gambar ditolak.
- Spesies tidak dikenal ditolak.
- Scan berhasil menyimpan hasil dan memotong kuota 3 -> 2 -> 1 -> 0.
- Scan ke-4 ditolak dengan pesan "Kuota gratis habis".
- **Layanan AI mati: scan gagal (502) dan kuota tidak berkurang.**
- Riwayat hanya menampilkan data milik pengguna yang login.

## 13. Tautan

- Desain Figma: _isi link_
- Video presentasi YouTube: _isi link_
- Dokumen SRS dan SDD: folder `docs/`

## 14. Rencana Setelah UTS

1. Latih model AI asli per spesies (MediaPipe Model Maker, dataset Kaggle/Roboflow) untuk menggantikan model dummy.
2. Pembelian token dan integrasi Payment Gateway.
3. Konsultasi dokter hewan (Tele-Vet) dan e-sertifikat.
4. Peta wabah dan pelaporan wabah.
5. Dashboard Admin dan verifikasi dokter.
