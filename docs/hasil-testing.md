# Hasil Pengujian Prototype UTS

**Proyek:** LivestockHealth Scan
**Penyusun:** Mutia Rahmawati (11241065)
**Tanggal pengujian:** 16 Oktober 2026
**Metode:** pengujian otomatis melalui skrip `backend/uji-api.mjs` (memanggil REST API secara langsung)

## Lingkungan pengujian

| Komponen | Versi / keterangan |
|---|---|
| Sistem operasi | Windows |
| Node.js | v26.12.0 |
| Python | 3.13.7 |
| Flask | 3.1.3 |
| Basis data | SQLite (modul bawaan `node:sqlite`) |
| Tanggal | 16 Oktober 2026 |

## Cara menjalankan ulang

```bash
# Terminal 1 - layanan AI (dummy)
cd ai-service
pip install -r requirements.txt
python app.py                 # http://localhost:5000

# Terminal 2 - backend
cd backend
npm install
node server.js                # http://localhost:3000

# Terminal 3 - uji API
cd backend
node uji-api.mjs
```

Skrip akan mencetak daftar pemeriksaan beserta ringkasan `lulus/gagal`.
Cukup **backend utama** (port 3000) yang perlu hidup; untuk kasus "layanan AI mati"
skrip mengangkat sendiri backend kedua di port 3101 (basis data sementara di folder
temp) lalu mematikannya lagi, sehingga pengujian tidak bergantung proses lain.

## Ringkasan

| Keterangan | Jumlah |
|---|---|
| Total pemeriksaan | 36 |
| Lulus | 36 |
| Gagal | 0 |

## Rincian pemeriksaan

### Registrasi akun (RF-01)

| Pemeriksaan | Hasil |
|---|---|
| Registrasi valid mengembalikan 201 + token | Lulus |
| Kata sandi asli tidak dikembalikan di respons | Lulus |
| Kuota awal akun baru = 3 | Lulus |
| Email duplikat ditolak (409) | Lulus |
| Data tidak lengkap ditolak (400) | Lulus |

### Login (RF-02)

| Pemeriksaan | Hasil |
|---|---|
| Kata sandi salah ditolak (401) | Lulus |
| Login benar mengembalikan 200 + token | Lulus |

### Hak akses & kuota (RF-07, RF-26)

| Pemeriksaan | Hasil |
|---|---|
| Akses tanpa token ditolak (401) | Lulus |
| Token palsu ditolak (401) | Lulus |
| `/api/me` mengembalikan nama + sisa scan | Lulus |
| Scan ke-4 saat kuota habis ditolak (403) | Lulus |

### Validasi unggahan (RF-06, RF-07)

| Pemeriksaan | Hasil |
|---|---|
| Berkas `.txt` ditolak (400) | Lulus |
| Berkas lebih dari 5 MB ditolak (400) | Lulus |
| Berkas `.jpg` yang isinya bukan gambar ditolak (400) | Lulus |
| Spesies tidak dikenal ditolak (400) | Lulus |
| Scan tanpa foto ditolak (400) | Lulus |
| Validasi gagal **tidak** memotong kuota | Lulus |

### Alur scan (RF-05 s.d. RF-17)

| Pemeriksaan | Hasil |
|---|---|
| Scan valid mengembalikan 201 | Lulus |
| Hasil memuat nama penyakit | Lulus |
| Confidence bernilai 0..1 | Lulus |
| Fitur visual terisi | Lulus |
| Rekomendasi obat medis terisi | Lulus |
| Rekomendasi jamu/herbal terisi | Lulus |
| Kuota berkurang 3 -> 2 setelah scan | Lulus |
| Kuota habis tepat setelah 3x scan | Lulus |
| Pra-pemrosesan (RF-08) menghasilkan ukuran model 224x224 | Lulus |
| Kecerahan & kontras dihitung dari piksel foto (RF-10) | Lulus |
| Scan sapi, kambing, dan ayam berhasil | Lulus |

### Riwayat medis (RF-18)

| Pemeriksaan | Hasil |
|---|---|
| Riwayat terisi setelah scan | Lulus |
| Detail riwayat dapat dibuka | Lulus |
| Riwayat bertambah sesuai jumlah scan | Lulus |
| Pengguna lain tidak melihat riwayat pengguna lain | Lulus |

### Ketahanan layanan AI

| Pemeriksaan | Hasil |
|---|---|
| Flask mati -> backend mengembalikan 502 | Lulus |
| Flask mati -> kuota scan **tidak** berkurang | Lulus |

### Berkas statis

| Pemeriksaan | Hasil |
|---|---|
| Halaman frontend tersaji melalui backend | Lulus |

## Catatan

- Model AI masih **dummy** (lihat `ai-service/app.py`). Kontrak API sudah final sehingga
  penggantian model asli tidak mengubah backend maupun frontend.
- Pengujian antarmuka (klik alur daftar -> login -> scan -> hasil -> riwayat) dilakukan
  secara manual dan didokumentasikan melalui screenshot pada video presentasi.
