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
| Sapi | 69,2% | PMK 84,9% · Sehat 71,8% · LSD 58,5% |

Angka itu hasil pengujian pada foto yang tidak dipakai saat melatih. Yang sapi
paling rendah karena folder publik untuk LSD banyak berisi poster dan ilustrasi,
bukan foto ternak asli. Keterbatasan ini diakui apa adanya, bukan angka yang
dibuat-buat.

Kelas yang dikenali: sapi (Sehat, LSD, PMK), kambing (Sehat, Gangguan Kulit),
ayam (Sehat, Coccidiosis, Tetelo, Salmonellosis).

## Endpoint

| Endpoint | Fungsi |
|---|---|
| POST /api/register | Daftar akun |
| POST /api/login | Masuk, mengembalikan token |
| GET /api/me | Nama dan sisa kuota |
| POST /api/scan | Validasi, cek kuota, panggil layanan AI, simpan hasil |
| GET /api/riwayat | Daftar pemeriksaan milik pengguna |
| GET /api/riwayat/:id | Rincian satu pemeriksaan |
| GET /health (Flask) | Status layanan AI dan model yang aktif |
| POST /predict (Flask) | Analisis foto: penyakit dan tingkat keyakinan |

## Catatan

- Hasilnya **indikasi awal, bukan diagnosis**. Tetap perlu dikonfirmasi dokter hewan.
- Kata sandi disimpan dalam bentuk hash, bukan teks terbaca.
- Foto yang diunggah tidak ditulis ke disk, hanya diproses di memori.
- Pemindaian yang gagal tidak mengurangi kuota.
- Skala warna tingkat keyakinan sengaja dibalik dari kebiasaan: makin tinggi
  nilainya makin merah, karena artinya indikasi makin kuat dan perlu segera
  ditangani. Di bawah 70% berwarna hijau dengan catatan bahwa hasilnya belum
  bisa dipercaya. Hasil "Sehat" tetap hijau walau keyakinannya tinggi.
- Kartu "Wabah di sekitar" di Beranda masih data contoh, karena fitur peta
  wabah belum dikerjakan.

## Tautan

- Video presentasi YouTube: https://youtu.be/3ceq7c5ijuI
