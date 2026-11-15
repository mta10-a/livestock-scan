# LivestockHealth Scan

Aplikasi web untuk deteksi dini **penyakit luar (fisik)** pada ternak — sapi,
kambing, dan ayam — hanya dari satu foto.

Peternak di daerah sering terlambat tahu ternaknya sakit, karena akses ke dokter
hewan terbatas dan mahal. Aplikasi ini dibuat untuk menjawab itu dengan cara
paling sederhana: foto ternaknya, lalu muncul kemungkinan penyakitnya beserta
tingkat keyakinan dan saran penanganan.

## Isi folder

| Folder | Isi |
|---|---|
| `frontend/` | Halaman HTML/CSS/JS yang dibuka di browser (10 halaman) |
| `backend/` | Server Node.js (Express + SQLite): akun, kuota, riwayat, dan pemanggil layanan AI |
| `ai-service/` | Layanan Python (Flask) yang menganalisis foto ternak |
| `tests/` | Skrip uji otomatis API |

Alurnya: browser → backend (login, kuota, riwayat) → ai-service (analisis foto).

## Cara menjalankan

```powershell
python main.py
```

Satu perintah itu menyalakan layanan AI dan backend sekaligus, lalu membuka
aplikasinya di browser. Nomor port dan batas pemakaian diatur di `config.py`.

## Progres fitur

Terpakai **22 dari 40** kebutuhan fungsional (55%). Kalau dihitung ketat,
RF-27 baru sebatas penukaran kode token (belum ada pembayaran daring), jadi
hitungan amannya 21 RF (52,5%).

| Kode | Fitur |
|---|---|
| RF-01 | Registrasi akun |
| RF-02 | Login |
| RF-03 | Profil peternakan |
| RF-05 | Pilih jenis ternak |
| RF-06 | Ambil/unggah foto |
| RF-07 | Validasi data dan hak akses scan |
| RF-08 | Pra-pemrosesan gambar |
| RF-09 | Pemilihan model AI per spesies |
| RF-10 | Ekstraksi dan evaluasi fitur visual |
| RF-11 | Klasifikasi penyakit |
| RF-12 | Tampilkan tingkat keyakinan |
| RF-13 | Peringatan keyakinan rendah |
| RF-14 | Rekomendasi obat medis |
| RF-15 | Rekomendasi jamu/herbal |
| RF-16 | Penyimpanan hasil diagnosis |
| RF-17 | Pengiriman hasil ke peternak |
| RF-18 | Riwayat medis |
| RF-20 | Cetak lembar hasil pemeriksaan |
| RF-24 | Laporan wabah |
| RF-26 | Kuota gratis 3x scan |
| RF-27 | Pembelian/penukaran token |
| RF-29 | Riwayat transaksi token |

Sisanya masih ditunda: konsultasi dokter hewan, verifikasi e-sertifikat dan
tanda tangan dokter, peta wabah, verifikasi laporan, verifikasi dokter,
payment gateway, dan dashboard admin.

## Model AI

Modelnya bukan model siap pakai dan bukan data contoh. Model dilatih dari
10.156 foto ternak yang dikumpulkan dari empat sumber dataset, memakai
EfficientNet-Lite0 (sudah terlatih pada ImageNet) sebagai pengekstrak ciri
gambar, ditambah classifier softmax yang dilatih sendiri dari dataset ternak.

| Spesies | Akurasi uji | Rincian per kelas |
|---|---|---|
| Kambing | 91,6% | Sehat 89,1% · Gangguan Kulit (Scabies/Orf) 93,7% |
| Ayam | 78,0% | Coccidiosis 85,1% · Sehat 76,8% · Salmonellosis 73,0% · Tetelo 72,4% |
| Sapi | 69,8% | PMK 81,8% · Sehat 54,9% · LSD 80,0% |

Angka itu hasil pengujian pada foto yang tidak dipakai saat melatih. Recall LSD
dinaikkan ke 80% dengan penyesuaian logit khusus LSD; konsekuensinya sebagian
foto sapi sehat ikut tertandai LSD (Sehat turun ke 54,9%). Untuk skrining,
false negative LSD dianggap lebih berisiko daripada false positive. Keterbatasan
ini diakui apa adanya, bukan angka yang dibuat-buat.

Kelas yang dikenali: sapi (Sehat, LSD, PMK), kambing (Sehat, Gangguan Kulit),
ayam (Sehat, Coccidiosis, Tetelo, Salmonellosis).

### Pendapat kedua dengan Gemini (opsional)

Klasifikasi utama tetap dari model latihan di atas. Gemini Flash dipakai sebagai
pendapat kedua: menilai apakah foto mendukung hasil model, lalu menjelaskannya
dengan bahasa sehari-hari. Kuotanya gratis dari Google AI Studio.

Cara mengaktifkan:

1. Buka `https://aistudio.google.com/apikey`, masuk dengan akun Google, lalu
   klik **Create API key** (tidak perlu kartu kredit).
2. Simpan kuncinya di `ai-service/.gemini-key` — satu baris berisi kunci saja.
   Berkas ini tidak ikut di-commit.
3. Jalankan ulang aplikasi. Statusnya bisa dilihat di `/health` (Flask).

Kalau kunci belum diisi, kuota Gemini habis, atau internet mati, aplikasi tetap
berjalan normal dengan model latihan saja tanpa pesan error. Hasil Gemini ikut
disimpan di riwayat supaya masih terlihat saat membuka hasil lama.

## Endpoint

| Endpoint | Fungsi |
|---|---|
| POST /api/register | Daftar akun, memasang cookie sesi httpOnly |
| POST /api/login | Masuk, mengembalikan token dan cookie sesi httpOnly |
| POST /api/logout | Keluar dan mencabut token aktif |
| GET /api/me | Nama dan sisa kuota |
| POST /api/scan | Validasi, cek kuota, panggil layanan AI, simpan hasil |
| GET /api/riwayat | Daftar pemeriksaan milik pengguna |
| GET /api/riwayat/:id | Rincian satu pemeriksaan |
| GET /api/profil | Profil peternakan pengguna |
| PUT /api/profil | Simpan profil peternakan |
| GET /api/laporan | Laporan wabah milik pengguna |
| GET /api/laporan/terbaru | Laporan wabah terbaru dari semua pengguna |
| POST /api/laporan | Kirim laporan wabah |
| GET /api/token/paket | Daftar paket token |
| POST /api/token/tukar | Tukar kode token menjadi kuota |
| GET /api/token/transaksi | Riwayat penukaran token |
| GET /health (Flask) | Status layanan AI, model aktif, dan status Gemini |
| POST /predict (Flask) | Analisis foto: penyakit dan tingkat keyakinan |

## Catatan

- Hasilnya **indikasi awal, bukan diagnosis**. Tetap perlu dikonfirmasi dokter hewan.
- Rekomendasi medis/herbal **belum divalidasi dokter hewan**; status dan rujukan
  umumnya ada di `docs/validasi-rekomendasi.md`. Halaman hasil juga menampilkan
  daftar rujukan veteriner (WOAH/FAO/Merck Veterinary Manual).
- Kata sandi disimpan dalam bentuk hash, bukan teks terbaca.
- Sesi browser memakai cookie **httpOnly + SameSite=Lax**, bukan localStorage.
  Logout mencabut token di server, dan halaman beranda/scan/hasil/riwayat
  diarahkan ke login bila belum punya sesi.
- Rahasia JWT dibuat otomatis di `backend/data/.jwt-secret` (tidak ikut repo).
- Registrasi dan login dibatasi 10 percobaan per 10 menit per IP.
- Foto yang diunggah tidak ditulis ke disk, hanya diproses di memori.
- Format berkas diperiksa dari isi (magic bytes), bukan hanya nama/MIME.
- Gambar di atas 40 MP atau 10.000 px per sisi ditolak sebelum diproses.
- Pemindaian yang gagal tidak mengurangi kuota; kuota tidak bisa negatif.
- Skala warna tingkat keyakinan sengaja dibalik dari kebiasaan: makin tinggi
  nilainya makin merah, karena artinya indikasi makin kuat dan perlu segera
  ditangani. Di bawah 70% berwarna hijau dengan catatan bahwa hasilnya belum
  bisa dipercaya. Hasil "Sehat" tetap hijau walau keyakinannya tinggi.
- "Kirim lewat WhatsApp" membuka `wa.me` dengan ringkasan hasil yang sudah
  terisi, lalu pengguna memilih kontak tujuan. Bisa juga dibagikan lewat
  aplikasi lain (Web Share API) atau disalin ke papan klip.
- "Cetak lembar hasil" memakai gaya `@media print`, jadi hasilnya bisa
  disimpan sebagai PDF atau dicetak untuk dibawa ke dokter hewan.
- "Wabah di sekitar" di Beranda menampilkan laporan yang benar-benar dikirim
  pengguna, bukan data contoh. Peta wabah (RF-19) masih ditunda.
- Token scan ditukar memakai kode dari agen. Kode demo `LHS-DEMO-3` dan
  `LHS-DEMO-10` dicetak di konsol backend saat pertama kali dijalankan.
  Payment gateway (RF-28) belum dikerjakan, jadi belum ada pembayaran daring.

## Tautan

- Video presentasi YouTube: https://youtu.be/3ceq7c5ijuI
