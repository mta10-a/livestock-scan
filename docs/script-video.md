# Script Video Progres UTS — LivestockHealth Scan

Dokumen ini panduan merekam video progres UTS (Tugas Besar IPPL).
Tujuannya: menunjukkan bahwa 17 fitur (RF) sudah benar-benar berjalan,
dan menunjukkan bagian mana yang nyata, mana yang masih contoh.

- **Durasi target:** 4 menit 30 detik – 5 menit 30 detik
- **Batas kumpul:** Senin, 19 Oktober 2026, 23.59
- **Wajib:** diunggah ke YouTube, lalu tautannya ditempel di `README.md` bagian 13

---

## 1. Yang harus ada di video (sesuai instruksi tugas)

| Tuntutan instruksi | Dibahas di bagian |
|---|---|
| Perkenalan (nama, NIM, judul) | A |
| Progress dikumpulkan melalui GitHub | B |
| Prototype sudah dikerjakan | D, E |
| Progress dihitung dari jumlah fitur | G |
| Video diunggah ke YouTube | setelah selesai |

---

## 2. Persiapan sebelum merekam (lakukan berurutan)

### 2.1 Bersihkan data supaya rekaman bersih

Akun lama di database akan mengganggu tampilan (kuota sudah terpakai).
Tutup backend dulu, baru hapus database:

```powershell
# Pastikan terminal backend sudah ditutup (Ctrl+C), lalu:
Remove-Item "C:\SEMESTER 5\ippl\livestockhealth-scan\backend\data\livestock.db"
```

Setelah itu jalankan lagi backend di terminal 2 — database baru akan dibuat
otomatis, akun bersih, kuota mulai dari 3.

### 2.2 Nyalakan dua server (masing-masing di terminal sendiri)

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

Cek AI hidup di browser: buka `http://127.0.0.1:5000/health`
Harus berbunyi `"mode": "nyata"`.

### 2.3 Siapkan berkas di layar

Buka dua jendela:

1. **Browser** ke `http://localhost:3000` (tekan `Ctrl+F5` supaya tidak kena cache).
2. **File Explorer** ke `C:\SEMESTER 5\ippl\foto-demo`

Isi folder foto demo (semua sudah diuji, hasilnya pasti seperti tabel ini):

| Nama berkas | Dipakai untuk | Hasil yang muncul |
|---|---|---|
| `1-ayam-coccidiosis.jpg` | scan ke-1 | Coccidiosis · **99%** · merah |
| `2-ayam-salmonellosis.jpg` | cadangan | Salmonellosis · 99% · merah |
| `3-ayam-tetelo.jpg` | cadangan | Tetelo · 94% · merah |
| `4-kambing-sehat.jpg` | scan ke-2 | Sehat · **99%** · hijau |
| `5-kambing-sakit-kulit.jpg` | cadangan | Gangguan Kulit (Scabies/Orf) · 99% · merah |
| `6-sapi-lsd.jpg` | cadangan | Lumpy Skin Disease (LSD) · 87% · merah |
| `7-sapi-pmk.jpg` | cadangan | PMK · 54% · hijau (keyakinan rendah) |
| `8-sapi-keyakinan-rendah.jpg` | scan ke-3 | LSD · **66%** · hijau + catatan "keyakinan rendah" |
| `9-foto-terlalu-besar.jpg` | demo tolak ukuran | "Ukuran foto melebihi 5 MB." (8,6 MB) |
| `catatan-ternak.txt` | demo tolak format | "Format foto harus JPG atau PNG." |

### 2.4 Siapkan tab browser tambahan (biar tidak perlu mengetik saat merekam)

- Tab 1: `http://localhost:3000`
- Tab 2: `http://127.0.0.1:5000/health` (bukti model nyata)
- Tab 3: halaman repositori GitHub Anda

### 2.5 Kalau mau menunjukkan tes otomatis (opsional tapi meyakinkan)

Jalankan sekali sebelum merekam, lalu tampilkan terminalnya di video:

```powershell
cd "C:\SEMESTER 5\ippl\livestockhealth-scan\backend"
node uji-api.mjs
```

Baris terakhir akan berbunyi:
`Ringkasan: 38 lulus, 0 gagal, dari 38 pemeriksaan.`

---

## 3. Naskah video

Bacaan bertanda **"Ucapkan:"** boleh dibaca apa adanya. Sesuaikan dengan gaya
bicara Anda sendiri supaya tidak terdengar seperti membaca.

---

### BAGIAN A — Pembuka (0:00 – 0:30)

**Layar:** halaman login `http://localhost:3000`.

**Ucapkan:**

> Assalamualaikum, selamat pagi. Nama saya **[NAMA]**, NIM **[NIM]**.
> Pada video ini saya melaporkan progres UTS Tugas Besar IPPL, yaitu
> **LivestockHealth Scan** — aplikasi web untuk deteksi dini penyakit luar
> pada ternak melalui foto.
>
> Masalah yang saya angkat: peternak di daerah sering terlambat mengetahui
> ternak sakit, karena akses ke dokter hewan terbatas dan mahal.
> Aplikasi ini mencoba menjawab itu dengan cara paling sederhana:
> cukup foto ternaknya, lalu aplikasi menyebutkan kemungkinan penyakitnya.

---

### BAGIAN B — Repositori GitHub (0:30 – 0:55)

**Layar:** tab GitHub, tampilkan halaman repositori (daftar commit terlihat).

**Ucapkan:**

> Seluruh progres saya kumpulkan di repositori GitHub ini. Bisa dilihat
> riwayat commit-nya bertahap, dari desain tampilan, backend, sampai
> pelatihan model AI.
>
> Repositori ini berisi empat bagian: `frontend` untuk tampilan,
> `backend` untuk API dan basis data, `ai-service` untuk model AI-nya,
> dan `docs` untuk dokumentasi.

**Catatan:** kalau repositori sudah di-push, semua commit akan terlihat.
Kalau belum, tampilkan sekadar struktur folder dulu — jangan berbohong
soal commit yang belum ada.

---

### BAGIAN C — Desain Figma (0:55 – 1:20)

**Layar:** Figma, tampilkan rancangan layar (login, beranda, scan, hasil, riwayat).

**Ucapkan:**

> Sebelum membuat kode, saya rancang dulu tampilannya di Figma. Ini rancangan
> layar login, beranda, proses scan, halaman hasil, dan riwayat.
>
> Saya sengaja membuat tampilannya konsisten tapi tidak seragam — warna hijau
> sebagai warna utama karena berhubungan dengan peternakan, navigasi bawah
> yang menetap, dan setiap jenis informasi punya bentuk tampilan yang berbeda
> supaya tidak terlihat seperti template.

**Catatan:** kalau prototype Figma belum bisa diklik antar-frame, katakan apa
adanya saja — "rancangan masih berupa tampilan, belum saya hubungkan
antar-framenya" — lalu lanjut. Itu masih jujur dan tetap menunjukkan desain.

---

### BAGIAN D — Demo alur utama (1:20 – 3:10)

**Layar:** browser tab 1.

**Ucapkan sambil mengerjakan:**

> Sekarang saya coba langsung aplikasinya. Pertama, daftar akun dulu.

**Aksi:**
1. Klik **Daftar**, isi nama, email, dan kata sandi, lalu daftar.
2. Akan langsung masuk ke Beranda. Tunjukkan bagian sisa kuota.

> Password-nya disimpan dalam bentuk hash, jadi tidak tersimpan sebagai
> teks terbaca. Setiap akun baru mendapat kuota gratis tiga kali scan.

**Aksi:** klik **Scan**, pilih jenis ternak **Ayam**.
Lalu klik pilih foto, ambil `1-ayam-coccidiosis.jpg`, klik **Analisis**.

> Saya pilih ayam dulu. Foto ini ayam yang terkena Coccidiosis.

**Layar:** halaman hasil.

> Hasilnya Coccidiosis dengan keyakinan 99 persen. Warna donatnya merah,
> artinya indikasi kuat dan sebaiknya segera ditangani. Di bawahnya ada
> penjelasan ciri khas kelas yang terpilih, lalu rekomendasi penanganan
> medis dan rekomendasi bahan herbal, serta catatan tindakan.
>
> Perlu saya tegaskan: ini alat bantu deteksi awal, bukan pengganti
> diagnosis dokter hewan.

**Aksi:** kembali, scan lagi. Pilih jenis ternak **Kambing**,
ambil `4-kambing-sehat.jpg`, klik **Analisis**.

> Sekarang saya coba kambing yang sehat. Perhatikan hasilnya: keyakinannya
> 99 persen, tapi karena hasilnya "Sehat", warna dan catatannya hijau —
> bukan peringatan bahaya. Ini saya buat sengaja, supaya aplikasi tidak
> memberi peringatan menakutkan untuk ternak yang sehat.

**Aksi:** kembali, scan lagi. Pilih jenis ternak **Sapi**,
ambil `8-sapi-keyakinan-rendah.jpg`, klik **Analisis**.

> Scan ketiga, sapi. Hasilnya LSD dengan keyakinan 66 persen. Karena di
> bawah 70 persen, aplikasi otomatis memberi peringatan bahwa keyakinannya
> rendah dan menyarankan memotret ulang serta berkonsultasi ke dokter hewan.
> Jadi aplikasi saya tidak memaksa memberi jawaban yang belum pasti.

**Aksi:** buka **Riwayat**.

> Ketiga hasil scan tadi tersimpan dan bisa dibuka kembali kapan saja.
> Perhatikan warna pil persennya berbeda-beda mengikuti tingkat keyakinan
> dan jenis hasilnya.

**Catatan waktu:** kalau nanti rekamannya terlalu panjang, scan sapi
(scan ke-3) boleh dilewati, tapi jangan lewatkan bagian E karena di situ
ada bukti kuota.

---

### BAGIAN E — Kasus gagal dan kuota (3:10 – 3:50)

**Layar:** halaman scan.

**Aksi:** klik pilih foto, ambil `catatan-ternak.txt`.

> Saya coba dulu unggah berkas yang bukan gambar. Aplikasi menolaknya
> langsung dengan pesan bahwa format harus JPG atau PNG.

**Aksi:** klik pilih foto, ambil `9-foto-terlalu-besar.jpg`.

> Lalu saya coba gambar berukuran 8,6 megabita. Aplikasi menolaknya karena
> batas maksimalnya 5 megabita.

**Ucapkan:**

> Dua percobaan gagal tadi tidak mengurangi kuota scan saya, karena
> dihitung sebagai pemakaian hanya kalau pemindaiannya benar-benar berhasil.

**Aksi:** lakukan satu scan yang benar sekali lagi sampai selesai,
supaya kuota habis. Lalu coba scan lagi satu kali.

> Nah, sekarang kuota gratis saya sudah habis. Coba saya scan sekali lagi —
> aplikasi menolak dan menyarankan membeli token. Ini sesuai aturan bahwa
> kuota gratisnya tiga kali.

**Opsional (kuat, tapi berisiko — hanya kalau waktu cukup):**
Matikan terminal 1 (layanan AI) dengan `Ctrl+C`, lalu coba scan.
Akan muncul pesan *"Layanan AI (Flask) tidak dapat dihubungi… Kuota scan Anda
tidak berkurang."* Nyalakan lagi AI dengan klik dua kali
`ai-service\jalankan-ai.bat`.

> Bahkan saat layanan AI-nya mati, kuota saya tetap tidak berkurang.
> Jadi kegagalan sistem tidak pernah merugikan pengguna.

---

### BAGIAN F — Bukti model AI-nya nyata (3:50 – 4:25)

Ini bagian paling penting. Jangan dilewati.

**Layar:** pindah ke tab `http://127.0.0.1:5000/health`.

**Ucapkan:**

> Bagian ini saya khususkan untuk membuktikan bahwa deteksinya benar-benar
> memakai model AI hasil latihan, bukan data contoh.
>
> Halaman ini adalah laporan dari layanan AI-nya. Tertulis `"mode": "nyata"`,
> dan ada tiga model: sapi, kambing, dan ayam, masing-masing dengan nama
> modelnya dan akurasi hasil pengujian.

**Layar:** kembali ke browser hasil scan (halaman hasil) — tunjukkan nama model.

> Nama model ini juga muncul di halaman hasil, jadi bisa dibuktikan
> asalnya dari mana.

**Ucapkan apa adanya (bagian kejujuran):**

> Saya sampaikan apa adanya soal akurasinya. Model ini saya latih sendiri
> dari 10.156 foto yang saya kumpulkan dari empat sumber dataset, memakai
> EfficientNet-Lite0 yang sudah terlatih pada jutaan gambar, lalu saya
> latih ulang bagian pengklasifikasiannya.
>
> Akurasi hasil pengujiannya: kambing 91,6 persen, ayam 78 persen, dan sapi
> 69,2 persen. Yang sapi paling rendah, dan saya tahu penyebabnya: folder
> publik untuk Lumpy Skin Disease banyak berisi poster dan ilustrasi, bukan
> foto ternak asli, sehingga modelnya belajar dari gambar yang salah.
> Saya sudah menyaringnya, tapi sisanya masih ada.
>
> Keterbatasan lain: untuk kambing, datasetnya hanya membedakan sehat dan
> tidak sehat, jadi saya tidak bisa memisahkan scabies dari orf — kelasnya
> saya beri nama "Gangguan Kulit (Scabies/Orf)". Untuk ayam, sebagian
> fotonya adalah kotoran dan alas kandang, bukan luka luar.
>
> Semua ini saya tulis lengkap di `docs/dataset-dan-model.md` supaya bisa
> diperiksa.

---

### BAGIAN G — Tabel progres fitur (4:25 – 4:50)

**Layar:** `README.md` bagian 5 di GitHub (atau di editor).

**Ucapkan:**

> Dari 40 kebutuhan fungsional, saya selesaikan 17 fitur untuk tahap UTS ini,
> yaitu sekitar 42,5 persen. Ini sudah melewati batas minimal 30 persen.
>
> Yang sudah jalan adalah alur intinya: registrasi, login, pemilihan jenis
> ternak, unggah foto, validasi, pra-pemrosesan gambar, pemilihan model AI
> per spesies, ekstraksi fitur visual, klasifikasi penyakit, tampilan
> keyakinan, peringatan keyakinan rendah, rekomendasi medis dan herbal,
> penyimpanan hasil, pengiriman hasil, riwayat, dan kuota gratis.
>
> Yang saya tunda ke tahap berikutnya adalah fitur yang butuh layanan
> tambahan dan peran lain, seperti e-sertifikat, peta wabah, pembayaran
> token, dan konsultasi dengan dokter hewan.
>
> Saya juga membuat 38 pemeriksaan otomatis untuk API-nya, dan semuanya
> lulus. Hasilnya saya catat di `docs/hasil-testing.md`.

---

### BAGIAN H — Penutup (4:50 – 5:10)

**Ucapkan:**

> Jadi kesimpulannya, pada tahap UTS ini aplikasi sudah bisa dipakai dari
> daftar akun sampai menyimpan hasil scan, dan model AI-nya sudah dilatih
> dari dataset ternak yang saya kumpulkan sendiri — bukan data contoh.
>
> Rencana saya setelah UTS adalah memperbaiki akurasi model sapi dengan
> dataset yang lebih bersih, menambahkan fitur e-sertifikat, peta wabah,
> dan konsultasi dokter hewan, serta menyambungkan pembayaran token.
>
> Terima kasih.

---

## 4. Sepuluh hal yang WAJIB disebut (jangan lupa)

1. Ini **indikasi awal**, bukan diagnosis pasti.
2. Model dilatih dari dataset sendiri, bukan data contoh.
3. Angka akurasi disebut **apa adanya**: sapi 69,2%, kambing 91,6%, ayam 78,0%.
4. Penyebab akurasi sapi rendah disebut: dataset publik banyak poster/ilustrasi.
5. Batas kemampuan model kambing: tidak bisa memisahkan scabies dan orf.
6. Batas kemampuan model ayam: sebagian foto berupa kotoran, bukan luka luar.
7. Hasil "Sehat" sengaja berwarna hijau, bukan merah.
8. Pemindaian gagal tidak mengurangi kuota.
9. 17 dari 40 fitur (42,5%).
10. Kartu "Wabah di sekitar" di Beranda adalah **data contoh**, bukan data nyata.

## 5. Jangan diucapkan

- "Akurasi aplikasi saya 99 persen." — angka 99% itu keyakinan satu foto,
  bukan akurasi model.
- "Aplikasi ini bisa mendiagnosis penyakit." — katakan "mengindikasikan".
- "Semua fitur sudah selesai." — baru 17 dari 40.
- "Data wabah ini dari Dinas Peternakan." — kartu itu masih contoh.

---

## 6. Setelah merekam

1. Sunting seperlunya (buang jeda panjang, jangan buang bagian F).
2. Unggah ke YouTube. Judul yang disarankan:
   `Progres UTS IPPL - LivestockHealth Scan - [Nama] [NIM]`
   Setelan **Unlisted** sudah cukup, yang penting tautannya bisa dibuka dosen.
3. Salin tautannya, tempel di `README.md` bagian 13 (sudah ada templatnya).
4. Push ke GitHub: `git push origin main`
5. Kumpulkan sebelum Senin, 19 Oktober 2026, 23.59.

---

## 7. Kartu ingatan (buka di layar kedua saat merekam)

```
A  Pembuka        siapa saya, judul, masalah          30 detik
B  GitHub         tempat kumpul progres                25 detik
C  Figma          rancangan tampilan                   25 detik
D  Demo           daftar -> scan ayam/kambing/sapi  ~110 detik
E  Gagal + kuota  .txt, 8,6MB, kuota habis             40 detik
F  AI nyata       /health "mode: nyata" + akurasi      35 detik
G  Progres RF     17/40 = 42,5%                        25 detik
H  Penutup        rencana lanjut + terima kasih        20 detik

Foto:  1-ayam-coccidiosis  4-kambing-sehat  8-sapi-keyakinan-rendah
Tolak: catatan-ternak.txt  9-foto-terlalu-besar.jpg
Angka: sapi 69,2% | kambing 91,6% | ayam 78,0% | tes 38/38
```
