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
| `frontend/` | Halaman HTML/CSS/JS yang dibuka di browser (15 halaman) |
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

Terpakai **40 dari 40** kebutuhan fungsional (100%). Satu catatan jujur: RF-28
(payment gateway) berjalan dalam **mode simulasi** karena tidak ada kredensial
penyedia pembayaran. Alur tagihan, biaya layanan, status pesanan, dan penambahan
kuota otomatis tetap berfungsi, tetapi tidak ada uang yang benar-benar ditarik.
Dengan hitungan ketat, RF-28 belum tersambung ke gateway produksi, jadi hitungan
amannya 39 RF (**97,5%**).

| Kode | Fitur |
|---|---|
| RF-01 | Registrasi akun |
| RF-02 | Login |
| RF-03 | Profil peternakan |
| RF-04 | Pendaftaran dan verifikasi dokter hewan |
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
| RF-19 | Peta sebaran wabah |
| RF-20 | Cetak lembar hasil pemeriksaan |
| RF-21 | Sertifikat hasil pemeriksaan |
| RF-22 | Unduh/cetak sertifikat |
| RF-23 | Kode verifikasi keaslian sertifikat |
| RF-24 | Laporan wabah |
| RF-25 | Peringatan wabah di sekitar |
| RF-26 | Kuota gratis 3x scan |
| RF-27 | Pembelian/penukaran token |
| RF-28 | Payment gateway dan rincian biaya layanan (mode simulasi) |
| RF-29 | Riwayat transaksi token |
| RF-30 | Otomatisasi pembelian token dan pembaruan kuota |
| RF-31 | Pengajuan konsultasi dokter |
| RF-32 | Daftar dan pengambilan konsultasi |
| RF-33 | Percakapan konsultasi |
| RF-34 | Penutupan konsultasi |
| RF-35 | Jadwal praktik dokter |
| RF-36 | Riwayat jawaban dokter |
| RF-37 | Rekap aktivitas dokter |
| RF-38 | Dashboard ringkasan admin |
| RF-39 | Verifikasi dokter dan kelola pengguna |
| RF-40 | Monitoring laporan wabah di admin |

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
| POST /api/laporan | Kirim laporan wabah (boleh menyertakan titik lokasi) |
| GET /api/peta/sebaran | Titik dan rekap laporan per kecamatan |
| GET /api/wabah/sekitar | Jumlah laporan 30 hari terakhir di wilayah profil |
| GET /api/sertifikat/saya | Daftar kode sertifikat milik pengguna |
| GET /api/sertifikat/:kode | Verifikasi sertifikat (bisa diakses tanpa login) |
| POST /api/dokter/daftar | Ajukan akun dokter beserta berkas STR |
| GET /api/dokter/status | Status pengajuan akun dokter |
| GET /api/dokter/tersedia | Daftar dokter terverifikasi dan jadwal praktiknya |
| PUT /api/dokter/jadwal | Atur hari dan jam praktik dokter |
| GET /api/dokter/riwayat | Riwayat konsultasi yang sudah dijawab dokter |
| GET /api/dokter/aktivitas | Rekap aktivitas dan pesan dokter |
| GET /api/konsultasi | Daftar konsultasi sesuai peran |
| POST /api/konsultasi | Ajukan konsultasi baru |
| GET /api/konsultasi/:id | Rincian percakapan konsultasi |
| POST /api/konsultasi/:id/ambil | Dokter mengambil konsultasi dari antrean |
| POST /api/konsultasi/:id/pesan | Kirim pesan dalam percakapan |
| POST /api/konsultasi/:id/selesai | Tutup konsultasi |
| GET /api/admin/ringkasan | Statistik aplikasi untuk admin |
| GET /api/admin/pengguna | Daftar dan pencarian pengguna |
| GET /api/admin/dokter | Daftar pengajuan dan data dokter |
| GET /api/admin/dokter/:id/berkas | Buka berkas STR (khusus admin) |
| POST /api/admin/dokter/:id/verifikasi | Terima atau tolak pengajuan dokter |
| GET /api/admin/laporan | Laporan wabah terbaru untuk admin |
| GET /api/token/paket | Daftar paket token dan biaya layanan |
| POST /api/token/tukar | Tukar kode token menjadi kuota |
| GET /api/token/transaksi | Riwayat penukaran dan pembelian token |
| GET /api/pembayaran | Daftar pesanan token milik pengguna |
| POST /api/pembayaran | Buat pesanan paket token |
| GET /api/pembayaran/:kode | Rincian satu pesanan |
| POST /api/pembayaran/:kode/bayar | Konfirmasi pembayaran simulasi dan tambah kuota |
| GET /health (Flask) | Status layanan AI, model aktif, dan status Gemini |
| POST /predict (Flask) | Analisis foto: penyakit dan tingkat keyakinan |

## Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | admin@livestockhealth.id | admin123 |
| Dokter | dokter@livestockhealth.id | dokter123 |

Akun ini dibuat otomatis saat basis data masih kosong dan ditandai sebagai akun
demo di aplikasi. Ganti kata sandinya sebelum dipakai di luar pengujian lokal.

## Peran akun

| Peran | Menu yang tampil |
|---|---|
| Peternak | Scan, riwayat, sertifikat, peta wabah, lapor wabah, konsultasi, beli/tukar token |
| Dokter | Permintaan konsultasi, jadwal praktik, riwayat jawaban, rekap aktivitas, profil/status STR |
| Admin | Dashboard, peta sebaran, pemeriksaan terbaru, verifikasi dokter, rekap dokter, pengguna |

Menu mengikuti hak akses tiap peran. Endpoint backend tetap memeriksa peran, jadi
halaman yang tidak tampil juga tidak bisa dipakai untuk mengubah data peran lain.

## Catatan

- Hasilnya **indikasi awal, bukan diagnosis**. Tetap perlu dikonfirmasi dokter hewan.
- Rekomendasi medis/herbal **belum divalidasi dokter hewan**; status dan rujukan
  umumnya ada di `docs/validasi-rekomendasi.md`. Halaman hasil juga menampilkan
  daftar rujukan veteriner (WOAH/FAO/Merck Veterinary Manual).
- Kata sandi disimpan dalam bentuk hash, bukan teks terbaca.
- Sesi browser memakai cookie **httpOnly + SameSite=Lax**, bukan localStorage.
  Logout mencabut token di server, dan halaman yang butuh sesi (beranda, scan,
  hasil, riwayat, profil, lapor, token, pembayaran, peta, konsultasi, admin)
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
  pengguna, bukan data contoh. Peringatan dihitung dari kecamatan pada profil;
  bila alamat kosong, yang dipakai laporan nasional.
- Peta wabah hanya menampilkan laporan yang disertai titik lokasi. Lokasi diambil
  lewat izin peramban saat melapor dan dibulatkan sekitar 100 meter. Laporan tanpa
  titik tetap masuk rekap wilayah.
- Setiap hasil scan mendapat kode sertifikat acak berawalan `LHS-`. Halaman
  sertifikat bisa dicetak atau disimpan sebagai PDF, dan kodenya bisa dicek siapa
  saja tanpa login. Sertifikat tetap menyebut bahwa hasilnya indikasi AI, bukan
  diagnosis resmi.
- Akun dokter harus mengunggah berkas STR (JPG/PNG/PDF maks. 2 MB). Berkas
  disimpan di `backend/data/berkas-str/`, tidak disajikan ke publik, dan hanya
  bisa dibuka admin lewat endpoint khusus.
- Konsultasi memakai percakapan teks di dalam aplikasi. Akun dokter demo
  disediakan untuk mencoba alur ini; ini bukan layanan telemedicine sungguhan.
- Dashboard admin membaca data nyata dari basis data: jumlah pengguna, scan,
  laporan, konsultasi, token terjual, pengajuan dokter, dan laporan terbaru.
- Token scan bisa didapat dengan menukar kode dari agen atau membeli paket
  langsung di halaman token. Kode demo `LHS-DEMO-3` dan `LHS-DEMO-10` dicetak di
  konsol backend saat pertama kali dijalankan.
- Pembelian token memakai **gateway simulasi**. Halaman pembayaran menampilkan
  harga paket, biaya layanan, total, metode, dan status pesanan. Tombol konfirmasi
  meniru callback gateway; setelah itu kuota ditambahkan otomatis dan transaksi
  tercatat. Tidak ada uang yang ditarik dan tidak ada data kartu yang diminta.
- Dokter bisa mengatur hari dan jam praktik di halaman profil. Jadwal tampil di
  daftar dokter pada halaman konsultasi dan di percakapan yang sudah diambil.
- Konsultasi yang sudah ditutup masuk ke riwayat jawaban dokter. Rekap aktivitas
  (selesai, berjalan, pesan terkirim) tampil di profil dokter dan dashboard admin.

## Tautan

- Video presentasi YouTube: https://youtu.be/3ceq7c5ijuI
