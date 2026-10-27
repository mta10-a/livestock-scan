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
| `frontend/` | Halaman HTML/CSS/JS yang dibuka di browser (7 halaman) |
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
| GET /health (Flask) | Status layanan AI dan model yang aktif |
| POST /predict (Flask) | Analisis foto: penyakit dan tingkat keyakinan |

## Catatan

- Hasilnya **indikasi awal, bukan diagnosis**. Tetap perlu dikonfirmasi dokter hewan.
- Rekomendasi medis/herbal **belum divalidasi dokter hewan**; status dan rujukan
  umumnya ada di `docs/validasi-rekomendasi.md`.
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
- Bagian "Wabah di sekitar" di Beranda tidak menampilkan data contoh sebagai
  wabah nyata; fitur peta wabah memang belum dikerjakan.

## Tautan

- Video presentasi YouTube: https://youtu.be/3ceq7c5ijuI
