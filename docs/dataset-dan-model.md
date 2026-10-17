# Dataset dan Model AI — Apa yang Nyata dan Apa Batasnya

Dokumen ini menjelaskan **dari mana model AI aplikasi ini berasal**, **bagaimana
dilatih**, **seberapa akurat**, dan **apa saja kelemahannya**. Ditulis terbuka
supaya angka pada video presentasi bisa dipertanggungjawabkan.

Ringkas: modelnya **nyata dan benar-benar dilatih dari foto ternak**, tetapi
kualitasnya dibatasi oleh kualitas dataset publik yang tersedia. Angka akurasi
di bawah adalah hasil pengukuran pada data uji yang **tidak dipakai saat
melatih**, bukan angka karangan.

---

## 1. Susunan model

```
Foto ternak
   │
   ├─ (1) Pra-pemrosesan Pillow: validasi, potong garis hitam, ubah ke RGB   [RF-08]
   │
   ├─ (2) EfficientNet-Lite0 (terlatih ImageNet, DIBEKUKAN)                  [RF-09]
   │       └─ menghasilkan 1000 angka (embedding) per gambar
   │
   └─ (3) Classifier softmax linear — DILATIH dari dataset ternak            [RF-11]
           └─ menghasilkan penyakit + keyakinan (dikalibrasi)                [RF-12]
```

Bagian (2) adalah "mata" yang sudah pintar mengenali bentuk dan tekstur dari
1,2 juta foto ImageNet, tetapi belum tahu apa itu LSD atau PMK. Bagian (3) yang
mempelajari hal itu dari dataset ternak. Ini teknik yang lazim disebut
**transfer learning** dan dipakai karena jumlah gambar ternak kita terbatas.

Penamaan model yang tampil pada halaman hasil:
`efficientnet-lite0+softmax-<spesies>-v1`.

## 2. Dataset yang dipakai

Semua berkas ada di folder `IPPL dataset` (di luar repository, 575 MB).

| Dataset | Isi | Jumlah awal | Dipakai untuk |
|---|---|---|---|
| Cow lumpy disease dataset | `healthycows`, `lumpycows` | 936 | Sapi: Sehat & LSD |
| FMD Cattle Dataset (Roboflow) | `train`/`valid`/`test` | 80 | Sapi: PMK |
| Anotasi-PMK-SAPI.v1i.voc (Roboflow) | foto teranotasi PMK | 283 | Sapi: PMK |
| Healthy and Unhealthy Goat Images | `healthy_goat`, `unhealthy_goat` | 928 | Kambing |
| chicken_disease_dataset | 4 kelas + `train`/`validation`/`test` resmi | 9.611 | Ayam |

## 3. Penyaringan gambar (dilakukan sebelum melatih)

Dataset publik hasil unduhan **tidak bersih**. Setelah memeriksa contoh gambar,
ditemukan hal-hal seperti:

- sampul buku *"Raising Goats"* dan infografis *"Safe Fruits for Goats"* di
  folder `healthy_goat`;
- foto **sepotong kue di atas piring** di folder `unhealthy_goat`;
- ilustrasi garis (line art) sapi di folder kambing sakit;
- poster dan infografis *"LUMPY SKIN DISEASE"* serta tangkapan layar berita
  *"LATEST NEWS"* di folder `lumpycows`;
- foto stok berlatar putih (berwatermark) di kelas sehat, sementara kelas sakit
  berupa foto kandang.

Karena itu gambar disaring otomatis dengan aturan yang ambangnya **diukur dari
data** (bukan ditebak), memakai sekitar 3.300 gambar:

| Aturan | Ambang | Alasan |
|---|---|---|
| Sisi terpendek | < 64 px | ikon/thumbnail |
| Rasio sisi | > 3:1 | spanduk panjang |
| Simpangan baku kecerahan | < 6 | gambar kosong/hampir rata |
| Jumlah warna unik (256×256) | < 8.000 | grafik, line art, tangkapan layar |
| Piksel berbidang rata | > 88% | poster/infografis |
| Tepi yang putih bersih | > 50% | foto studio berlatar putih |

Penyaringan dibuat **dua profil**: "ketat" untuk dataset sapi & kambing
(banyak grafik) dan "ringan" untuk dataset ayam. Alasannya: lantai beton polos
pada foto kotoran ayam awalnya ikut terbuang oleh aturan "jumlah warna unik"
(153 gambar kelas Sehat), padahal itu foto asli. Profil ringan mencegah
kesalahan itu.

### Hasil penyaringan (angka nyata)

| Spesies | Gambar terbaca | Lolos | Dibuang |
|---|---|---|---|
| Sapi | 1.299 | 1.246 | 53 |
| Kambing | 928 | 844 | 84 |
| Ayam | 8.067 | 8.066 | 1 |

## 4. Pembagian data latih / validasi / uji

- Dataset ayam dan FMD sudah punya pembagian resmi → dipakai apa adanya.
- Dataset lainnya dibagi otomatis dan **tetap sama setiap kali dijalankan**
  (berdasarkan hash nama berkas): 70% latih, 15% validasi, 15% uji.

| Spesies | Latih | Validasi | Uji |
|---|---|---|---|
| Sapi | 879 | 198 | 169 |
| Kambing | 590 | 111 | 143 |
| Ayam | 6.507 | 778 | 781 |

## 5. Hasil pengukuran (angka apa adanya)

Dihitung dari **data uji yang tidak ikut dilatih**.

| Spesies | Akurasi uji | Sehat | LSD | PMK | Kulit | Coccidiosis | Tetelo | Salmonella |
|---|---|---|---|---|---|---|---|---|
| Sapi | **69,2%** | 71,8% | 58,5% | 84,9% | — | — | — | — |
| Kambing | **91,6%** | 89,1% | — | — | 93,7% | — | — | — |
| Ayam | **78,0%** | 76,8% | — | — | — | 85,1% | 72,4% | 73,0% |

Angka pada kolom penyakit adalah **recall**: dari semua gambar yang sebenarnya
penyakit itu, berapa persen yang berhasil dikenali.

Keyakinan juga **dikalibrasi** (temperature scaling) dengan nilai suhu
0,95 (sapi), 0,70 (kambing), dan 0,90 (ayam), supaya nilai keyakinan yang
ditampilkan tidak berlebihan.

## 6. Kelemahan yang harus diakui

Ini bagian terpenting, dan sebaiknya disebutkan langsung saat presentasi.

1. **Kelas LSD paling lemah (58,5%).** Penyebabnya jelas: folder `lumpycows`
   banyak berisi poster, ilustrasi, dan tangkapan layar berita, bukan foto
   benjolan pada kulit sapi. Sebagian bisa disaring otomatis, sebagian tidak.
2. **Kambing tidak bisa membedakan Scabies dari Orf.** Datasetnya hanya
   memisahkan "sehat" dan "tidak sehat", tidak ada label penyakit yang
   spesifik. Karena itu kelasnya diberi nama jujur
   **"Gangguan Kulit (Scabies/Orf)"**, bukan dipaksa menebak salah satu.
3. **Dataset ayam bukan foto luka luar.** Gambarnya adalah kotoran dan alas
   kandang (pendekatan tidak langsung lewat kotoran), bukan benjolan atau luka
   pada tubuh ayam. Kelas Tetelo jumlahnya paling sedikit (562 gambar),
   sehingga recall-nya paling rendah.
4. **Dataset aslinya berisi gambar tidak berlabel yang sah.** Karena itu
   69,2% pada sapi adalah hasil yang wajar; bukan tanda modelnya rusak.
5. **Model ini bukan alat diagnosis.** Keluarannya indikasi awal untuk
   membantu peternak memutuskan kapan harus memanggil dokter hewan.

## 7. Yang nyata vs yang disederhanakan

| Bagian | Status |
|---|---|
| Validasi foto JPG/PNG, maksimal 5 MB | Nyata |
| Pra-pemrosesan Pillow ke 224×224 | Nyata |
| Kecerahan & kontras dihitung dari piksel foto | Nyata |
| Hukuman keyakinan saat foto gelap/tidak tajam | Nyata |
| Pengekstrak fitur EfficientNet-Lite0 (ImageNet) | Nyata, terlatih orang lain |
| Classifier penyakit (softmax) | **Nyata, dilatih dari dataset ternak** |
| Angka keyakinan | Nyata, hasil kalibrasi |
| Tabel rekomendasi medis & herbal | Disusun manual dari referensi, bukan hasil AI |
| Model cadangan bila berkas `model/*.npz` tidak ada | Dummy (hanya agar aplikasi tetap bisa diuji) |

## 8. Cara mengulang pelatihan

```powershell
cd ai-service
.venv-mediapipe\Scripts\python.exe latih.py --periksa   # laporan penyaringan saja
.venv-mediapipe\Scripts\python.exe latih.py             # latih semua spesies
```

Waktu pelatihan di CPU: **686 detik (±11,5 menit)** untuk 10.156 gambar.
Hasil: `model/sapi.npz`, `model/kambing.npz`, `model/ayam.npz` (total ~36 KB,
karena yang disimpan hanya bobot classifier-nya), dan `model/metadata.json`
berisi semua angka pada dokumen ini.
