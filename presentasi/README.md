# Slide Presentasi UTS

Slide presentasi video progres UTS untuk **LivestockHealth Scan**.

| Berkas | Isi |
|---|---|
| `UTS-LivestockHealth-Scan.pptx` | 15 slide siap dipakai. Naskah yang diucapkan sudah tertanam di **catatan pembicara** setiap slide. |
| `buat-deck.py` | Skrip pembuat slide. Dipakai kalau ada teks yang ingin diubah lalu dibuat ulang. |
| `gambar/` | Tangkapan layar asli dari aplikasi yang dipakai di slide 6 dan 8. |

## Isi slide

1. Judul
2. Latar belakang — kenapa aplikasi ini dibuat
3. Solusi — apa itu LivestockHealth Scan
4. Isi aplikasi — yang bisa dilakukan pengguna
5. Alur pemakaian — 6 langkah
6. Tampilan — 4 halaman aplikasi
7. Cara kerja — apa yang terjadi setelah Analisis ditekan
8. Halaman hasil — cara membaca donat dan catatan
9. Model AI — dilatih sendiri, bukan data contoh
10. Akurasi — hasil pengujian apa adanya
11. Kasus gagal — format salah, terlalu besar, kuota habis
12. Progres — 17 dari 40 fitur (42,5%)
13. Kejujuran data — mana yang nyata, mana yang masih contoh
14. Rencana setelah UTS
15. Terima kasih

Deck ini sengaja **tidak memuat penjelasan kode**. Isinya hanya seputar produk:
latar belakang, alur pemakaian, tampilan, hasil, akurasi, dan progres fitur.

## Cara melihat catatan pembicara

Di PowerPoint: **View → Notes Page**, atau jalankan *Slide Show → Presenter View*
sehingga catatan muncul di layar Anda (bukan di layar penonton).

## Cara mengubah slide

Cara paling mudah: buka `.pptx`-nya langsung di PowerPoint, ubah teksnya, simpan.
Skrip `buat-deck.py` hanya perlu dipakai kalau Anda ingin mengubah banyak slide
sekaligus dan membuatnya ulang dari nol.

Kalau ingin membuat ulang dari skrip (mengganti seluruh perubahan manual):

```powershell
cd "C:\SEMESTER 5\ippl\livestockhealth-scan"
ai-service\.venv-mediapipe\Scripts\python.exe presentasi\buat-deck.py
```

Skrip ini memerlukan `python-pptx` dan `Pillow`:

```powershell
ai-service\.venv-mediapipe\Scripts\python.exe -m pip install python-pptx
```

Tangkapan layar di `gambar/` bisa diperbarui lewat Chrome tanpa kepala
(headless) — lihat `docs/script-video.md` untuk alur pengujian aplikasinya.

## Rekomendasi alur merekam

1. **Rekaman A:** slide 1–5 (PowerPoint → *Slide Show* → *Record Slide Show*)
2. **Rekaman B:** demo aplikasi langsung (Xbox Game Bar `Win+G` atau Clipchamp)
3. **Rekaman C:** slide 6–15
4. Gabungkan A, B, C di Clipchamp, ekspor MP4, unggah ke YouTube.

Detail lengkapnya ada di `docs/script-video.md`.
