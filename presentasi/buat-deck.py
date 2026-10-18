# -*- coding: utf-8 -*-
"""
Membuat deck presentasi UTS "LivestockHealth Scan" (bentuk .pptx).

Isi deck sengaja HANYA seputar produk:
latar belakang, solusi, alur pemakaian, tampilan aplikasi, cara membaca hasil,
akurasi, kasus gagal, progres fitur, dan rencana lanjutan.
Tidak ada penjelasan kode / isi program.

Setiap slide punya catatan pembicara (speaker notes) berisi naskah yang
diucapkan saat merekam video.

Jalankan:
  ai-service\\.venv-mediapipe\\Scripts\\python.exe presentasi\\buat-deck.py
"""

import json
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

# ------------------------------- warna merek -------------------------------
HIJAU = RGBColor(0x00, 0x67, 0x3D)
HIJAU_GELAP = RGBColor(0x00, 0x40, 0x26)
HIJAU_TINT = RGBColor(0xE7, 0xF0, 0xEA)
HIJAU_MUDA = RGBColor(0xF6, 0xFA, 0xF7)
PUTIH = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x12, 0x24, 0x1C)
INK2 = RGBColor(0x3F, 0x4F, 0x47)
REDUP = RGBColor(0x6C, 0x7C, 0x73)
GARIS = RGBColor(0xE5, 0xE4, 0xDA)
ABU_TINT = RGBColor(0xF4, 0xF4, 0xEE)
MERAH = RGBColor(0xB3, 0x26, 0x1E)
MERAH_TINT = RGBColor(0xFB, 0xEC, 0xEB)
KUNING = RGBColor(0x8A, 0x5B, 0x00)
KUNING_TINT = RGBColor(0xFD, 0xF3, 0xE0)
KREM_TERANG = RGBColor(0xCF, 0xE3, 0xD7)

FONT = "Segoe UI"

# --------------------------------- akar berkas ---------------------------------
ROOT = Path(__file__).resolve().parents[1]
GAMBAR = ROOT / "presentasi" / "gambar"
LOGO = ROOT / "frontend" / "img" / "logo.png"
KELUARAN = ROOT / "presentasi" / "UTS-LivestockHealth-Scan.pptx"

SW, SH = 13.333, 7.5
KIRI = 0.95
LEBAR = SW - 2 * KIRI

prs = Presentation()
prs.slide_width = Inches(SW)
prs.slide_height = Inches(SH)


# ================================ perkakas ================================
def slide_baru(latar=HIJAU_MUDA):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    if latar is not None:
        kotak = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(SW), Inches(SH))
        kotak.fill.solid()
        kotak.fill.fore_color.rgb = latar
        kotak.line.fill.background()
        kotak.shadow.inherit = False
    return s


def teks(s, x, y, w, h, baris, rata=PP_ALIGN.LEFT, spasi=1.18, jangkar=MSO_ANCHOR.TOP):
    """baris: daftar dict {t, uk, warna, tebal, font, atas}."""
    if isinstance(baris, str):
        baris = [{"t": baris}]
    kotak = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = kotak.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = jangkar
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, b in enumerate(baris):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = rata
        p.line_spacing = spasi
        if b.get("atas"):
            p.space_before = Pt(b["atas"])
        r = p.add_run()
        r.text = b["t"]
        f = r.font
        f.size = Pt(b.get("uk", 14))
        f.bold = b.get("tebal", False)
        f.name = b.get("font", FONT)
        f.color.rgb = b.get("warna", INK)
    return kotak


def garis(s, x1, y1, x2, y2, warna=GARIS, tebal=0.9):
    l = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    l.line.color.rgb = warna
    l.line.width = Pt(tebal)
    return l


def batang(s, x, y, w, h, warna, radius=None, bentuk=MSO_SHAPE.ROUNDED_RECTANGLE, garis_warna=None, garis_tebal=0.75):
    b = s.shapes.add_shape(bentuk, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius is not None:
        try:
            b.adjustments[0] = radius
        except (IndexError, ValueError):
            pass
    b.fill.solid()
    b.fill.fore_color.rgb = warna
    if garis_warna is None:
        b.line.fill.background()
    else:
        b.line.color.rgb = garis_warna
        b.line.width = Pt(garis_tebal)
    b.shadow.inherit = False
    b.text_frame.text = ""
    return b


def kartu(s, x, y, w, h, judul, isi, aksen=HIJAU, latar=PUTIH, uk_judul=13.5, uk_isi=11.5):
    b = batang(s, x, y, w, h, latar, radius=0.10, garis_warna=GARIS)
    batang(s, x + 0.26, y + 0.30, 0.115, 0.115, aksen, bentuk=MSO_SHAPE.OVAL)
    teks(s, x + 0.55, y + 0.24, w - 0.85, 0.4, [{"t": judul, "uk": uk_judul, "tebal": True, "warna": INK}])
    teks(s, x + 0.26, y + 0.72, w - 0.52, h - 0.9, [{"t": isi, "uk": uk_isi, "warna": INK2}], spasi=1.25)
    return b


def langkah(s, x, y, w, nomor, judul, isi, warna_nomor=HIJAU):
    batang(s, x, y, w, 1.28, PUTIH, radius=0.10, garis_warna=GARIS)
    batang(s, x + 0.22, y + 0.24, 0.62, 0.62, HIJAU_TINT, radius=0.24)
    teks(s, x + 0.22, y + 0.35, 0.62, 0.42, [{"t": str(nomor), "uk": 16, "tebal": True, "warna": warna_nomor}],
         rata=PP_ALIGN.CENTER)
    teks(s, x + 1.0, y + 0.22, w - 1.25, 0.34, [{"t": judul, "uk": 12.5, "tebal": True, "warna": INK}])
    teks(s, x + 1.0, y + 0.58, w - 1.25, 0.62, [{"t": isi, "uk": 10.5, "warna": INK2}], spasi=1.2)


def gambar_rapi(s, berkas, x, y, h, garis_warna=GARIS, tebal=1.0):
    """Sisipkan tangkapan layar dengan perbandingan asli, diberi garis tipis."""
    with Image.open(berkas) as im:
        rasio = im.width / im.height
    w = h * rasio
    batang(s, x - 0.05, y - 0.05, w + 0.10, h + 0.10, PUTIH, radius=0.06, garis_warna=garis_warna, garis_tebal=tebal)
    s.shapes.add_picture(str(berkas), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    return w


def gaya_slide(s, kicker, judul, nomor, judul_w=11.3):
    """Kepala slide + kaki slide untuk slide isi."""
    batang(s, 0, 0, 0.2, SH, HIJAU)
    s.shapes.add_picture(str(LOGO), Inches(SW - 1.55), Inches(0.42), height=Inches(0.62))
    teks(s, KIRI, 0.52, judul_w, 0.3, [{"t": kicker.upper(), "uk": 10.5, "tebal": True, "warna": HIJAU}])
    teks(s, KIRI, 0.82, judul_w, 0.62, [{"t": judul, "uk": 26, "tebal": True, "warna": INK}])
    garis(s, KIRI, 1.62, SW - KIRI, 1.62)
    teks(s, KIRI, 7.03, 7.0, 0.3,
         [{"t": "LivestockHealth Scan  ·  Mutia Rahmawati  ·  11241065", "uk": 9, "warna": REDUP}])
    teks(s, SW - 1.6, 7.03, 0.65, 0.3, [{"t": str(nomor), "uk": 9, "warna": REDUP}], rata=PP_ALIGN.RIGHT)


def catatan(s, isi):
    s.notes_slide.notes_text_frame.text = isi.strip()


# ============================== 1. JUDUL ==============================
s = slide_baru(HIJAU_GELAP)
batang(s, 8.6, -1.2, 6.2, 6.2, RGBColor(0x00, 0x4F, 0x2F), bentuk=MSO_SHAPE.OVAL)
batang(s, 10.3, 3.6, 4.6, 4.6, RGBColor(0x00, 0x59, 0x35), bentuk=MSO_SHAPE.OVAL)
batang(s, 0, 0, 0.26, SH, HIJAU)
s.shapes.add_picture(str(LOGO), Inches(1.0), Inches(1.42), height=Inches(1.05))
teks(s, 1.0, 2.72, 9.0, 0.95, [{"t": "LivestockHealth Scan", "uk": 42, "tebal": True, "warna": PUTIH}])
teks(s, 1.0, 3.72, 8.4, 0.65,
     [{"t": "Deteksi dini penyakit luar pada hewan ternak\nmelalui foto", "uk": 16, "warna": KREM_TERANG}], spasi=1.3)
garis(s, 1.0, 4.62, 4.3, 4.62, HIJAU, 1.6)
teks(s, 1.0, 4.88, 8.0, 1.2, [
    {"t": "UTS Tugas Besar IPPL  ·  Semester 5", "uk": 13, "tebal": True, "warna": PUTIH},
    {"t": "Mutia Rahmawati  ·  11241065", "uk": 13, "warna": KREM_TERANG, "atas": 8},
    {"t": "18 Oktober 2026", "uk": 11.5, "warna": RGBColor(0x9E, 0xC2, 0xAC), "atas": 8},
])
catatan(s, """
Assalamualaikum, selamat pagi. Nama saya Mutia Rahmawati, NIM 11241065.
Pada video ini saya melaporkan progres UTS Tugas Besar IPPL, yaitu
LivestockHealth Scan — aplikasi web untuk deteksi dini penyakit luar pada ternak melalui foto.

Masalah yang saya angkat: peternak di daerah sering terlambat mengetahui ternak sakit,
karena akses ke dokter hewan terbatas dan mahal. Aplikasi ini menjawabnya dengan cara
paling sederhana: cukup foto ternaknya, lalu aplikasi menyebutkan kemungkinan penyakitnya.
""")

# ========================== 2. LATAR BELAKANG ==========================
s = slide_baru()
gaya_slide(s, "Latar belakang", "Kenapa aplikasi ini dibuat", 2)

kartu(s, KIRI, 1.95, 3.62, 1.72, "Akses dokter hewan terbatas",
      "Peternak di daerah sulit menjangkau dokter hewan. Waktu dan biaya perjalanan sering "
      "lebih besar daripada nilai satu ekor ternak.")
kartu(s, KIRI + 3.92, 1.95, 3.62, 1.72, "Penyakit dikenali terlambat",
      "Penyakit luar seperti LSD, PMK, dan Tetelo menular cepat. Keterlambatan sehari bisa "
      "berarti kerugian besar bagi peternak.")
kartu(s, KIRI + 7.84, 1.95, 3.62, 1.72, "Belum ada alat bantu praktis",
      "Pemeriksaan awal biasanya mengandalkan perkiraan sendiri, tanpa panduan yang bisa "
      "dibuka langsung dari ponsel.")

b = batang(s, KIRI, 3.98, LEBAR, 1.12, HIJAU_TINT, radius=0.14)
teks(s, KIRI + 0.36, 4.16, LEBAR - 0.72, 0.8, [
    {"t": "Inti masalahnya", "uk": 10.5, "tebal": True, "warna": HIJAU},
    {"t": "Peternak butuh cara memeriksa ternak yang cepat, murah, dan bisa dilakukan sendiri — "
          "tanpa alat khusus dan tanpa harus menunggu kunjungan dokter hewan.",
     "uk": 12.5, "warna": INK, "atas": 5},
], spasi=1.22)

teks(s, KIRI, 5.42, LEBAR, 0.4,
     [{"t": "Dari masalah itu, saya membuat aplikasi yang hanya memerlukan satu hal: foto ternak.", "uk": 12,
       "tebal": True, "warna": INK2}])

catatan(s, """
Sebelum masuk ke aplikasinya, saya jelaskan dulu latar belakangnya.

Masalah pertama, akses ke dokter hewan terbatas. Peternak di daerah sering harus menempuh
perjalanan jauh, dan biaya perjalanannya kadang lebih besar daripada nilai ternaknya sendiri.

Masalah kedua, penyakitnya dikenali terlambat. Penyakit luar seperti LSD, PMK, dan Tetelo
menular dengan cepat. Kalau terlambat satu-dua hari saja, bisa jadi kerugian besar —
apalagi kalau menular ke seluruh kandang.

Masalah ketiga, belum ada alat bantu yang praktis. Pemeriksaan awal biasanya hanya
mengandalkan perkiraan sendiri.

Jadi inti masalahnya: peternak butuh cara memeriksa ternak yang cepat, murah, dan bisa
dilakukan sendiri. Dari situ saya membuat aplikasi yang hanya memerlukan satu hal:
foto ternaknya.
""")

# ============================= 3. SOLUSI =============================
s = slide_baru()
gaya_slide(s, "Solusi", "LivestockHealth Scan", 3)

teks(s, KIRI, 1.9, 7.6, 0.8, [
    {"t": "Aplikasi web yang membantu peternak mengenali kemungkinan penyakit luar pada ternak "
          "hanya dari satu foto.", "uk": 14, "warna": INK2},
])

langkah(s, KIRI, 2.68, 5.55, 1, "Cukup dari ponsel", "Tidak perlu alat tambahan. Buka lewat peramban, "
       "foto ternak langsung dari kamera atau galeri.")
langkah(s, KIRI, 4.14, 5.55, 2, "Hasil dalam hitungan detik", "Analisis selesai di bawah 10 detik: "
       "jenis penyakit, tingkat keyakinan, dan ciri yang mendasarinya.")

kartu(s, KIRI + 5.85, 2.68, 5.55, 1.28, "Tiga jenis ternak",
      "Sapi, kambing, dan ayam — masing-masing punya model tersendiri.", aksen=HIJAU, latar=PUTIH)
kartu(s, KIRI + 5.85, 4.14, 5.55, 1.28, "Langsung dapat penanganan",
      "Setiap hasil disertai rekomendasi medis, rekomendasi herbal, dan catatan tindakan.",
      aksen=KUNING, latar=PUTIH)

b = batang(s, KIRI, 5.66, LEBAR, 0.78, HIJAU, radius=0.16)
teks(s, KIRI + 0.4, 5.87, LEBAR - 0.8, 0.4,
     [{"t": "Gratis 3 kali pemindaian untuk setiap akun baru.", "uk": 13, "tebal": True, "warna": PUTIH}])

catatan(s, """
Solusinya adalah LivestockHealth Scan: aplikasi web yang membantu peternak mengenali
kemungkinan penyakit luar pada ternak hanya dari satu foto.

Ada empat hal yang saya tonjolkan.
Pertama, cukup dari ponsel — tidak perlu alat tambahan, cukup buka lewat peramban.
Kedua, hasilnya keluar dalam hitungan detik, di bawah sepuluh detik, lengkap dengan
tingkat keyakinannya.
Ketiga, ada tiga jenis ternak yang didukung: sapi, kambing, dan ayam.
Keempat, setiap hasil langsung disertai rekomendasi penanganan, baik medis maupun herbal.

Setiap akun baru mendapat tiga kali pemindaian gratis.
""")

# ====================== 4. FITUR UTAMA (PRODUK) ======================
s = slide_baru()
gaya_slide(s, "Isi aplikasi", "Apa yang bisa dilakukan pengguna", 4)

kartu(s, KIRI, 1.95, 3.62, 1.55, "Membuat akun dan masuk",
      "Setiap pengguna punya akun sendiri. Riwayat dan kuota terpisah per akun.", aksen=HIJAU)
kartu(s, KIRI + 3.92, 1.95, 3.62, 1.55, "Memindai ternak",
      "Pilih jenis ternak, unggah foto, lalu tekan Analisis. Selesai dalam hitungan detik.", aksen=HIJAU)
kartu(s, KIRI + 7.84, 1.95, 3.62, 1.55, "Melihat hasil lengkap",
      "Penyakit yang terdeteksi, tingkat keyakinan, ciri khasnya, dan langkah penanganan.", aksen=MERAH)

kartu(s, KIRI, 3.68, 3.62, 1.55, "Mendapat peringatan dini",
      "Bila keyakinannya rendah, aplikasi mengingatkan dan menyarankan memotret ulang.", aksen=KUNING)
kartu(s, KIRI + 3.92, 3.68, 3.62, 1.55, "Rekomendasi penanganan",
      "Saran pengobatan medis dan bahan herbal, beserta catatan tindakan yang perlu dilakukan.",
      aksen=KUNING)
kartu(s, KIRI + 7.84, 3.68, 3.62, 1.55, "Riwayat pemeriksaan",
      "Semua hasil scan tersimpan rapi dan bisa dibuka kembali kapan saja.", aksen=HIJAU)

b = batang(s, KIRI, 5.5, LEBAR, 0.92, ABU_TINT, radius=0.14)
teks(s, KIRI + 0.36, 5.68, LEBAR - 0.72, 0.6, [
    {"t": "Yang belum ada pada tahap ini", "uk": 10.5, "tebal": True, "warna": REDUP},
    {"t": "Peta wabah interaktif, e-sertifikat, pembelian token, dan konsultasi langsung dengan "
          "dokter hewan — semuanya direncanakan untuk tahap berikutnya.",
     "uk": 11.5, "warna": INK2, "atas": 4},
])

catatan(s, """
Ini isi aplikasinya dari sisi pengguna.

Pengguna bisa membuat akun dan masuk, dan setiap akun punya riwayat serta kuota sendiri.
Lalu bisa memindai ternak: pilih jenis ternak, unggah foto, tekan Analisis.

Hasilnya lengkap: jenis penyakit yang terdeteksi, tingkat keyakinannya, ciri khas yang
membuat model memilih kelas itu, dan langkah penanganannya.

Ada juga peringatan dini. Kalau keyakinannya rendah, aplikasi tidak memaksakan jawaban,
tapi mengingatkan dan menyarankan memotret ulang.

Setiap hasil juga disertai rekomendasi medis dan herbal, dan seluruh pemeriksaan
tersimpan sebagai riwayat.

Yang belum ada pada tahap UTS ini: peta wabah, e-sertifikat, pembelian token, dan
konsultasi langsung dengan dokter hewan. Semuanya masuk rencana tahap berikutnya.
""")

# ==================== 5. ALUR PEMAKAIAN APLIKASI ====================
s = slide_baru()
gaya_slide(s, "Alur pemakaian", "Dari daftar sampai hasil tersimpan", 5)

langkah(s, KIRI, 1.92, 5.55, 1, "Daftar atau masuk",
       "Pengguna baru mendaftar dengan nama, email, dan kata sandi. "
       "Langsung mendapat 3 kuota scan gratis.")
langkah(s, KIRI, 3.34, 5.55, 2, "Pilih jenis ternak dan foto",
       "Tentukan sapi, kambing, atau ayam. Lalu ambil foto dari kamera atau unggah "
       "dari galeri (JPG/PNG, maksimal 5 MB).")
langkah(s, KIRI, 4.76, 5.55, 3, "Tekan Analisis",
       "Aplikasi memeriksa kelayakan foto, lalu menjalankan model AI sesuai jenis ternak "
       "yang dipilih.")

langkah(s, KIRI + 5.85, 1.92, 5.55, 4, "Baca hasil pemeriksaan",
       "Muncul jenis penyakit, tingkat keyakinan dalam bentuk donat warna, "
       "ciri khas kelas terpilih, dan catatan tindakan.")
langkah(s, KIRI + 5.85, 3.34, 5.55, 5, "Ikuti rekomendasi penanganan",
       "Rekomendasi medis dan rekomendasi bahan herbal, disesuaikan dengan "
       "penyakit yang terdeteksi.")
langkah(s, KIRI + 5.85, 4.76, 5.55, 6, "Buka riwayat kapan saja",
       "Hasil tersimpan otomatis, bisa dibuka kembali atau disaring "
       "menurut jenis ternak.")

b = batang(s, KIRI, 6.2, LEBAR, 0.68, KUNING_TINT, radius=0.18)
teks(s, KIRI + 0.36, 6.35, LEBAR - 0.72, 0.4,
     [{"t": "Kalau di tengah jalan gagal — foto tidak sesuai, kuota habis, atau layanan AI mati — "
            "aplikasi memberi pesan yang jelas dan kuota tidak berkurang.",
       "uk": 11.5, "tebal": True, "warna": KUNING}])

catatan(s, """
Ini alur pemakaiannya, dari awal sampai akhir.

Pertama, pengguna mendaftar atau masuk. Akun baru langsung mendapat tiga kuota scan gratis.

Kedua, pilih jenis ternak — sapi, kambing, atau ayam — lalu pilih fotonya. Bisa dari kamera
langsung, bisa juga unggah dari galeri. Formatnya JPG atau PNG, maksimal lima megabita.

Ketiga, tekan Analisis. Aplikasi memeriksa kelayakan fotonya, lalu menjalankan model AI
yang sesuai dengan jenis ternak yang dipilih.

Keempat, pengguna membaca hasilnya: jenis penyakitnya, tingkat keyakinan dalam bentuk
donat warna, ciri khas kelas terpilih, dan catatan tindakan.

Kelima, ikuti rekomendasi penanganan, baik medis maupun herbal.

Keenam, semua hasilnya tersimpan otomatis dan bisa dibuka kembali di riwayat, bahkan
bisa disaring menurut jenis ternak.

Satu hal penting: kalau di tengah jalan gagal — fotonya tidak sesuai, kuota habis,
atau layanan AI-nya mati — aplikasi memberi pesan yang jelas dan kuotanya tidak berkurang.
""")

# ===================== 6. TAMPILAN APLIKASI =====================
s = slide_baru()
gaya_slide(s, "Tampilan", "Halaman-halaman di dalam aplikasi", 6)

H = 4.44
lebar_gambar = H * (860 / 1760)
jarak = (LEBAR - 4 * lebar_gambar) / 3
posisi = [KIRI + i * (lebar_gambar + jarak) for i in range(4)]
nama = ["01-login.png", "02-beranda.png", "03-scan.png", "06-riwayat.png"]
keterangan = [
    ("Masuk dan daftar", "Gerbang awal aplikasi"),
    ("Beranda", "Sisa kuota, jumlah ternak dipindai, pemeriksaan terbaru"),
    ("Scan", "Pilih jenis ternak, unggah foto, jalankan analisis"),
    ("Riwayat medis", "Semua hasil tersimpan, bisa disaring per jenis ternak"),
]

for i, (x, brk, ket) in enumerate(zip(posisi, nama, keterangan)):
    gambar_rapi(s, GAMBAR / brk, x, 1.95, H)
    teks(s, x, 1.95 + H + 0.14, lebar_gambar + 0.2, 0.6, [
        {"t": ket[0], "uk": 11.5, "tebal": True, "warna": INK},
        {"t": ket[1], "uk": 9.5, "warna": REDUP, "atas": 3},
    ], spasi=1.15)

catatan(s, """
Ini tampilan aplikasinya.

Halaman pertama, masuk dan daftar — gerbang awal aplikasinya.

Kedua, beranda. Di sini terlihat sisa kuota scan, jumlah ternak yang sudah dipindai,
dan ringkasan pemeriksaan terbaru.

Ketiga, halaman scan. Di sini pengguna memilih jenis ternaknya, mengunggah foto,
lalu menjalankan analisis.

Keempat, riwayat medis. Semua hasil scan tersimpan di sini dan bisa disaring
menurut jenis ternak.

Tampilannya saya rancang dulu di Figma, lalu saya buat dengan warna hijau sebagai
warna utama, navigasi bawah yang menetap, dan setiap jenis informasi punya bentuk
tampilan yang berbeda supaya mudah dibaca.
""")

# ========================= 7. CARA KERJA =========================
s = slide_baru()
gaya_slide(s, "Cara kerja", "Apa yang terjadi setelah tombol Analisis ditekan", 7)

kartu(s, KIRI, 1.95, 3.62, 2.0, "1. Foto diperiksa",
      "Aplikasi memastikan fotonya benar-benar gambar ternak, ukurannya wajar, dan "
      "pencahayaannya cukup. Foto yang tidak layak ditolak sejak awal.", aksen=HIJAU)
kartu(s, KIRI + 3.92, 1.95, 3.62, 2.0, "2. Model AI menganalisis",
      "Model menilai ciri visual pada foto — warna, tekstur, dan pola permukaan kulit atau "
      "bulu — lalu membandingkannya dengan pola yang pernah dipelajari.", aksen=HIJAU)
kartu(s, KIRI + 7.84, 1.95, 3.62, 2.0, "3. Hasil muncul",
      "Muncul kemungkinan penyakit beserta tingkat keyakinan. Semua proses selesai "
      "kurang dari 10 detik.", aksen=HIJAU)

b = batang(s, KIRI, 4.18, LEBAR, 0.96, HIJAU_TINT, radius=0.14)
teks(s, KIRI + 0.36, 4.36, LEBAR - 0.72, 0.65, [
    {"t": "Tiga model terpisah, satu untuk setiap jenis ternak", "uk": 12, "tebal": True, "warna": HIJAU},
    {"t": "Model untuk sapi, kambing, dan ayam berdiri sendiri, karena penyakit dan ciri "
          "visualnya berbeda-beda.", "uk": 11.5, "warna": INK2, "atas": 4},
])

teks(s, KIRI, 5.4, LEBAR, 1.0, [
    {"t": "Yang perlu dipahami", "uk": 10.5, "tebal": True, "warna": REDUP},
    {"t": "Aplikasi ini memberi indikasi awal, bukan diagnosis pasti. Hasilnya tetap perlu "
          "dikonfirmasi oleh dokter hewan sebelum pengobatan dilakukan.", "uk": 12, "warna": INK, "atas": 5},
], spasi=1.25)

catatan(s, """
Saya jelaskan gambaran besar cara kerjanya, tanpa masuk ke teknis.

Begitu tombol Analisis ditekan, ada tiga tahap.
Pertama, fotonya diperiksa. Aplikasi memastikan fotonya benar-benar gambar ternak,
ukurannya wajar, dan pencahayaannya cukup.
Kedua, model AI menganalisis ciri visual pada foto: warna, tekstur, dan pola permukaan
kulit atau bulu. Ciri itu dibandingkan dengan pola yang pernah dipelajari modelnya.
Ketiga, hasilnya muncul: kemungkinan penyakit dan tingkat keyakinannya. Seluruh proses
selesai kurang dari sepuluh detik.

Perlu saya tambahkan, modelnya ada tiga dan berdiri sendiri — satu untuk sapi,
satu untuk kambing, satu untuk ayam. Tidak bisa digabung, karena penyakit dan ciri
visualnya berbeda.

Dan satu hal yang saya tekankan: aplikasi ini memberi indikasi awal, bukan diagnosis pasti.
""")

# ====================== 8. HALAMAN HASIL ======================
s = slide_baru()
gaya_slide(s, "Halaman hasil", "Cara membaca hasil pemeriksaan", 8)

H = 4.24
w1 = gambar_rapi(s, GAMBAR / "04-hasil-merah.png", KIRI, 1.95, H)
x2 = KIRI + w1 + 0.35
gambar_rapi(s, GAMBAR / "05-hasil-hijau.png", x2, 1.95, H)
x_ket = x2 + w1 + 0.55
lebar_ket = SW - KIRI - x_ket

teks(s, x_ket, 1.95, lebar_ket, 4.3, [
    {"t": "Donat keyakinan", "uk": 12.5, "tebal": True, "warna": INK},
    {"t": "Semakin tinggi nilainya, semakin merah warnanya — artinya indikasi semakin kuat "
          "dan sebaiknya segera ditangani.", "uk": 11, "warna": INK2, "atas": 3},

    {"t": "Hasil sehat punya warna sendiri", "uk": 12.5, "tebal": True, "warna": INK, "atas": 14},
    {"t": "Bila hasilnya \u201cSehat\u201d, donat dan catatannya tetap hijau walaupun keyakinannya "
          "tinggi — supaya tidak muncul peringatan menakutkan untuk ternak yang sehat.",
     "uk": 11, "warna": INK2, "atas": 3},

    {"t": "Peringatan keyakinan rendah", "uk": 12.5, "tebal": True, "warna": INK, "atas": 14},
    {"t": "Di bawah 70 persen, aplikasi menyatakan hasilnya belum bisa dipercaya dan "
          "menyarankan memotret ulang.", "uk": 11, "warna": INK2, "atas": 3},

    {"t": "Ciri khas dan penanganan", "uk": 12.5, "tebal": True, "warna": INK, "atas": 14},
    {"t": "Di bawah donat ada ciri khas kelas terpilih, rekomendasi medis, rekomendasi herbal, "
          "dan catatan tindakan.", "uk": 11, "warna": INK2, "atas": 3},
], spasi=1.2)

catatan(s, """
Ini halaman hasilnya, saya tunjukkan dua contoh supaya terlihat bedanya.

Contoh pertama, ayam yang terdeteksi Coccidiosis dengan keyakinan 99 persen. Donatnya merah.
Aturan warnanya sengaja saya balik dari kebiasaan umum: semakin tinggi nilainya, semakin
merah, karena artinya indikasi semakin kuat dan sebaiknya segera ditangani. Bukan semakin
hijau seperti biasanya.

Contoh kedua, kambing yang hasilnya Sehat dengan keyakinan 99 persen. Ini yang khusus:
walaupun angkanya tinggi, donat dan catatannya tetap hijau, karena temuannya bukan penyakit.
Kalau tidak begitu, aplikasi akan memberi peringatan "perlu penanganan segera" untuk ternak
yang sehat — itu jelas salah.

Selain itu, kalau keyakinannya di bawah 70 persen, aplikasi menyatakan hasilnya belum bisa
dipercaya dan menyarankan memotret ulang. Jadi aplikasi saya tidak memaksa memberi jawaban
yang belum pasti.

Di bawah donat ada ciri khas kelas terpilih, rekomendasi medis, rekomendasi herbal, dan
catatan tindakan.
""")

# ================== 9. MODEL AI NYATA (TANPA KODE) ==================
s = slide_baru()
gaya_slide(s, "Model AI", "Modelnya dilatih sendiri, bukan data contoh", 9)

b = batang(s, KIRI, 1.9, LEBAR, 0.92, HIJAU, radius=0.14)
teks(s, KIRI + 0.4, 2.06, LEBAR - 0.8, 0.62, [
    {"t": "Semua foto latih saya kumpulkan sendiri dari empat sumber dataset, lalu model saya latih "
          "ulang untuk mengenali penyakit ternak.", "uk": 13, "tebal": True, "warna": PUTIH},
])

angka = [
    ("10.156", "foto dipakai untuk melatih"),
    ("4", "sumber dataset digabungkan"),
    ("3", "model: sapi, kambing, ayam"),
    ("575 MB", "ukuran data latih"),
]
w = (LEBAR - 3 * 0.3) / 4
for i, (nilai, ket) in enumerate(angka):
    x = KIRI + i * (w + 0.3)
    batang(s, x, 3.0, w, 1.32, PUTIH, radius=0.10, garis_warna=GARIS)
    teks(s, x, 3.18, w, 0.5, [{"t": nilai, "uk": 22, "tebal": True, "warna": HIJAU}], rata=PP_ALIGN.CENTER)
    teks(s, x + 0.2, 3.76, w - 0.4, 0.45, [{"t": ket, "uk": 10.5, "warna": INK2}], rata=PP_ALIGN.CENTER, spasi=1.15)

kartu(s, KIRI, 4.48, LEBAR, 1.55, "Kenapa ini penting",
      "Kalau aplikasinya memakai data contoh atau jawaban yang ditulis manual, hasilnya tidak akan "
      "berubah mengikuti foto — semua ternak akan dijawab sama. Di aplikasi ini, hasilnya benar-benar "
      "berubah mengikuti foto yang diunggah, karena modelnya menilai isi fotonya.",
      aksen=HIJAU, latar=HIJAU_TINT, uk_isi=12)

teks(s, KIRI, 6.2, LEBAR, 0.5,
     [{"t": "Setiap halaman hasil juga mencantumkan nama model yang dipakai, jadi asal hasilnya "
            "bisa ditelusuri.", "uk": 11, "warna": REDUP}])

catatan(s, """
Bagian ini penting, karena biasanya dosen akan bertanya: ini modelnya nyata atau cuma data contoh?

Jawabannya nyata. Semua foto latihnya saya kumpulkan sendiri dari empat sumber dataset,
seluruhnya sekitar 575 megabita dan 10.156 foto yang lolos penyaringan. Dari situ saya
melatih tiga model: untuk sapi, kambing, dan ayam.

Kenapa ini penting? Kalau aplikasinya memakai data contoh, hasilnya tidak akan berubah
mengikuti foto — semua ternak akan dijawab sama, dan itu bisa langsung ketahuan.

Di aplikasi ini, hasilnya benar-benar berubah mengikuti foto yang diunggah. Bisa dilihat
di demo tadi: ayam menghasilkan Coccidiosis, kambing menghasilkan Sehat, sapi menghasilkan
LSD. Ketiganya dari foto yang berbeda dan hasilnya berbeda.

Setiap halaman hasil juga mencantumkan nama model yang dipakai, jadi asalnya bisa ditelusuri.
""")

# ===================== 10. AKURASI APA ADANYA =====================
s = slide_baru()
gaya_slide(s, "Akurasi", "Hasil pengujian, dilaporkan apa adanya", 10)

tabel = s.shapes.add_table(4, 3, Inches(KIRI), Inches(1.95), Inches(7.35), Inches(2.4)).table
tabel.columns[0].width = Inches(1.5)
tabel.columns[1].width = Inches(1.2)
tabel.columns[2].width = Inches(4.65)
judul_kolom = ["Jenis ternak", "Akurasi", "Rincian per penyakit (ketepatan mengenali)"]
isi_tabel = [
    ("Kambing", "91,6%", "Sehat 89,1%  ·  Gangguan Kulit 93,7%"),
    ("Ayam", "78,0%", "Coccidiosis 85,1%  ·  Sehat 76,8%  ·  Salmonellosis 73,0%  ·  Tetelo 72,4%"),
    ("Sapi", "69,2%", "PMK 84,9%  ·  Sehat 71,8%  ·  LSD 58,5%"),
]
for j, teks_judul in enumerate(judul_kolom):
    sel = tabel.cell(0, j)
    sel.text = teks_judul
    sel.fill.solid()
    sel.fill.fore_color.rgb = HIJAU
    p = sel.text_frame.paragraphs[0]
    p.runs[0].font.size = Pt(11.5)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = PUTIH
    p.runs[0].font.name = FONT
    sel.margin_left = sel.margin_right = Inches(0.1)

for i, baris in enumerate(isi_tabel, start=1):
    for j, nilai in enumerate(baris):
        sel = tabel.cell(i, j)
        sel.text = nilai
        sel.fill.solid()
        sel.fill.fore_color.rgb = PUTIH if i % 2 else RGBColor(0xF7, 0xFA, 0xF8)
        p = sel.text_frame.paragraphs[0]
        p.runs[0].font.size = Pt(11)
        p.runs[0].font.name = FONT
        p.runs[0].font.bold = j == 1
        p.runs[0].font.color.rgb = INK if j != 1 else HIJAU
        sel.margin_left = sel.margin_right = Inches(0.1)

kartu(s, KIRI + 7.75, 1.95, 3.65, 2.4, "Diuji pada foto yang belum pernah dilihat",
      "Angka ini berasal dari data uji yang sengaja tidak dipakai saat pelatihan, supaya "
      "hasilnya menggambarkan kondisi sebenarnya.", aksen=HIJAU, latar=HIJAU_TINT, uk_isi=11.5)

kartu(s, KIRI, 4.55, 5.55, 1.75, "Kenapa sapi paling rendah",
      "Folder publik untuk LSD banyak berisi poster dan ilustrasi, bukan foto ternak asli, "
      "sehingga model ikut mempelajari gambar yang salah. Saya sudah menyaringnya, tetapi "
      "sisanya masih memengaruhi hasil.", aksen=MERAH, latar=MERAH_TINT, uk_isi=11.5)

kartu(s, KIRI + 5.85, 4.55, 5.55, 1.75, "Keterbatasan lain yang saya akui",
      "Untuk kambing, datasetnya hanya membedakan sehat dan tidak sehat, jadi scabies dan orf "
      "belum bisa dipisahkan. Untuk ayam, sebagian fotonya memperlihatkan kotoran dan alas "
      "kandang, bukan luka luar.", aksen=KUNING, latar=KUNING_TINT, uk_isi=11.5)

catatan(s, """
Saya sampaikan akurasinya apa adanya, tidak saya lebih-lebihkan.

Model kambing mencapai 91,6 persen. Model ayam 78 persen. Model sapi 69,2 persen.

Angka ini diambil dari data uji yang sengaja tidak dipakai saat pelatihan, supaya
menggambarkan kondisi sebenarnya.

Yang sapi paling rendah, dan saya tahu penyebabnya. Folder publik untuk LSD banyak berisi
poster dan ilustrasi, bukan foto ternak asli, jadi modelnya ikut belajar dari gambar yang
salah. Saya sudah menyaringnya, tapi sisanya masih memengaruhi hasil. Ini juga sebabnya
ketepatan mengenali LSD hanya 58,5 persen.

Keterbatasan lain yang saya akui: untuk kambing, datasetnya hanya membedakan sehat dan tidak
sehat, jadi scabies dan orf belum bisa dipisahkan — kelasnya saya beri nama Gangguan Kulit.
Untuk ayam, sebagian fotonya memperlihatkan kotoran dan alas kandang, bukan luka luar.

Semua ini saya tulis lengkap di dokumentasi supaya bisa diperiksa.
""")

# =============== 11. KASUS GAGAL DAN KUOTA ===============
s = slide_baru()
gaya_slide(s, "Kasus gagal", "Yang terjadi kalau pemindaian tidak berhasil", 11)

kartu(s, KIRI, 1.95, 3.62, 1.72, "Berkas bukan foto",
      "\u201cFormat foto harus JPG atau PNG.\u201d Aplikasi menolaknya sejak awal, sebelum "
      "dikirim ke layanan AI.", aksen=MERAH, latar=MERAH_TINT)
kartu(s, KIRI + 3.92, 1.95, 3.62, 1.72, "Ukuran foto terlalu besar",
      "\u201cUkuran foto melebihi 5 MB.\u201d Foto perlu dikecilkan dulu, atau ambil ulang "
      "dengan ukuran lebih kecil.", aksen=MERAH, latar=MERAH_TINT)
kartu(s, KIRI + 7.84, 1.95, 3.62, 1.72, "Kuota gratis habis",
      "\u201cKuota gratis habis. Beli token untuk melanjutkan scan.\u201d Kuota gratis tiap "
      "akun tiga kali.", aksen=KUNING, latar=KUNING_TINT)

b = batang(s, KIRI, 3.98, LEBAR, 1.22, HIJAU, radius=0.14)
teks(s, KIRI + 0.4, 4.16, LEBAR - 0.8, 0.9, [
    {"t": "Pemindaian yang gagal tidak mengurangi kuota", "uk": 14, "tebal": True, "warna": PUTIH},
    {"t": "Kuota hanya berkurang kalau pemeriksaannya benar-benar berhasil. Jadi kalau layanan AI "
          "sedang bermasalah, pengguna tidak dirugikan.", "uk": 12, "warna": KREM_TERANG, "atas": 5},
])

kartu(s, KIRI, 5.42, LEBAR, 1.4, "Kenapa ini penting",
      "Aplikasi ini dipakai peternak di lapangan. Kalau setiap kegagalan ikut memotong kuota, "
      "pengguna akan malas mencoba lagi dan aplikasinya jadi tidak berguna.",
      aksen=HIJAU, latar=PUTIH, uk_isi=11.5)

catatan(s, """
Saya juga menyiapkan penanganan untuk kasus gagal.

Kalau berkas yang diunggah bukan foto, aplikasi langsung menolak dengan pesan bahwa
formatnya harus JPG atau PNG.

Kalau ukurannya lebih dari lima megabita, aplikasi menolak dan meminta fotonya dikecilkan.

Kalau kuota gratisnya sudah habis, aplikasi menolaknya dan menawarkan pembelian token.
Kuota gratisnya tiga kali per akun.

Yang paling saya perhatikan: pemindaian yang gagal tidak mengurangi kuota. Kuota hanya
berkurang kalau pemeriksaannya benar-benar berhasil. Ini penting karena pemakainya peternak
di lapangan — kalau setiap kegagalan ikut memotong kuota, mereka akan malas mencoba lagi.
""")

# ====================== 12. PROGRES FITUR ======================
s = slide_baru()
gaya_slide(s, "Progres", "Pencapaian fitur sampai tahap UTS", 12)

teks(s, KIRI, 1.9, 4.6, 1.3, [
    {"t": "17 dari 40", "uk": 40, "tebal": True, "warna": HIJAU},
    {"t": "kebutuhan fungsional (RF) selesai", "uk": 13, "warna": INK2, "atas": 4},
])

batang(s, KIRI, 3.35, 5.2, 0.42, RGBColor(0xDE, 0xE6, 0xDF), radius=0.5)
batang(s, KIRI, 3.35, 5.2 * 0.425, 0.42, HIJAU, radius=0.5)
teks(s, KIRI, 3.9, 5.2, 0.4, [{"t": "42,5%  ·  batas minimal dari dosen 30% (12 fitur)", "uk": 11, "tebal": True, "warna": INK2}])

kartu(s, KIRI, 4.32, 5.2, 2.5, "Yang sudah selesai (17)",
      "Registrasi dan login  ·  pemilihan jenis ternak  ·  unggah foto  ·  validasi data dan hak akses\n"
      "pra-pemrosesan gambar  ·  pemilihan model per spesies  ·  analisis ciri visual  ·  klasifikasi penyakit\n"
      "tampilan tingkat keyakinan  ·  peringatan keyakinan rendah  ·  rekomendasi medis  ·  rekomendasi herbal\n"
      "penyimpanan hasil  ·  pengiriman hasil ke peternak  ·  riwayat medis  ·  kuota gratis 3 kali",
      aksen=HIJAU, latar=HIJAU_TINT, uk_isi=10)

kartu(s, KIRI + 5.5, 1.9, 5.95, 2.35, "Yang ditunda ke tahap berikutnya (23)",
      "E-sertifikat dan verifikasinya  ·  peta wabah interaktif dan laporan wabah\n"
      "pembelian token dan pembayaran  ·  konsultasi dokter hewan  ·  pendaftaran dan verifikasi dokter\n"
      "pengelolaan akun serta data master oleh admin  ·  laporan transaksi dan statistik",
      aksen=REDUP, latar=ABU_TINT, uk_isi=11)

kartu(s, KIRI + 5.5, 4.32, 5.95, 2.5, "Kenapa urutannya begitu",
      "Saya mengutamakan fitur yang membuat aplikasinya bisa dipakai dari awal sampai akhir: "
      "dari daftar akun, memindai, sampai hasilnya tersimpan.\n\n"
      "Fitur yang ditunda semuanya membutuhkan layanan atau peran tambahan — pembayaran, "
      "dokter hewan, dan admin — sehingga lebih tepat dikerjakan setelah alur intinya mantap.",
      aksen=HIJAU, latar=PUTIH, uk_isi=11)

catatan(s, """
Untuk progres fiturnya: dari 40 kebutuhan fungsional, saya selesaikan 17 fitur,
yaitu sekitar 42,5 persen. Batas minimal dari dosen adalah 30 persen atau 12 fitur,
jadi sudah terlewati.

Yang sudah selesai adalah alur intinya: registrasi dan login, pemilihan jenis ternak,
unggah foto, validasi data, pra-pemrosesan gambar, pemilihan model sesuai spesies,
analisis ciri visual, klasifikasi penyakit, tampilan tingkat keyakinan, peringatan
keyakinan rendah, rekomendasi medis dan herbal, penyimpanan hasil, pengiriman hasil
ke peternak, riwayat medis, dan kuota gratis tiga kali.

Yang saya tunda ke tahap berikutnya ada 23 fitur: e-sertifikat, peta wabah, pembelian
token dan pembayaran, konsultasi dokter hewan, pendaftaran dokter, pengelolaan admin,
dan laporan transaksi.

Kenapa urutannya begitu? Saya mengutamakan fitur yang membuat aplikasinya bisa dipakai
dari awal sampai akhir. Fitur yang ditunda semuanya butuh layanan atau peran tambahan,
jadi lebih tepat dikerjakan setelah alur intinya mantap.
""")

# =============== 13. YANG NYATA VS MASIH CONTOH ===============
s = slide_baru()
gaya_slide(s, "Kejujuran data", "Bagian mana yang nyata, mana yang masih contoh", 13)

tabel = s.shapes.add_table(6, 2, Inches(KIRI), Inches(1.95), Inches(LEBAR), Inches(3.5)).table
tabel.columns[0].width = Inches(5.0)
tabel.columns[1].width = Inches(6.8)
kepala = ["Bagian", "Status sebenarnya"]
isi = [
    ("Deteksi penyakit (sapi, kambing, ayam)", "Nyata — model dilatih dari dataset ternak yang saya kumpulkan sendiri"),
    ("Tingkat keyakinan dan peringatan dini", "Nyata — hasil pengukuran model pada foto yang diunggah"),
    ("Pemeriksaan kelayakan foto", "Nyata — ukuran, format, dan pencahayaan diperiksa sungguhan"),
    ("Tabel rekomendasi medis dan herbal", "Disusun manual dari referensi, bukan keluaran AI"),
    ("Kartu \u201cWabah di sekitar\u201d di Beranda", "Masih contoh — belum tersambung ke data wabah mana pun"),
]
for j, t in enumerate(kepala):
    sel = tabel.cell(0, j)
    sel.text = t
    sel.fill.solid()
    sel.fill.fore_color.rgb = HIJAU
    p = sel.text_frame.paragraphs[0]
    p.runs[0].font.size = Pt(11.5)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = PUTIH
    p.runs[0].font.name = FONT
    sel.margin_left = sel.margin_right = Inches(0.12)

for i, (bagian, status) in enumerate(isi, start=1):
    nyata = status.startswith("Nyata")
    for j, nilai in enumerate((bagian, status)):
        sel = tabel.cell(i, j)
        sel.text = nilai
        sel.fill.solid()
        sel.fill.fore_color.rgb = HIJAU_TINT if nyata else KUNING_TINT
        p = sel.text_frame.paragraphs[0]
        p.runs[0].font.size = Pt(11)
        p.runs[0].font.name = FONT
        p.runs[0].font.bold = j == 0
        p.runs[0].font.color.rgb = INK if j == 0 else (HIJAU if nyata else KUNING)
        sel.margin_left = sel.margin_right = Inches(0.12)

teks(s, KIRI, 5.68, LEBAR, 0.9, [
    {"t": "Saya cantumkan tabel ini supaya tidak ada bagian yang terkesan lebih hebat dari "
          "kenyataannya.", "uk": 12, "tebal": True, "warna": INK},
    {"t": "Fitur peta wabah sendiri statusnya masih ditunda, jadi kartu di Beranda hanya berfungsi "
          "sebagai gambaran tampilan.", "uk": 11, "warna": REDUP, "atas": 6},
], spasi=1.25)

catatan(s, """
Saya ingin jujur soal bagian mana yang nyata dan mana yang belum.

Yang nyata: deteksi penyakitnya, karena modelnya benar-benar dilatih dari dataset ternak
yang saya kumpulkan. Tingkat keyakinan juga nyata, hasil pengukuran model. Pemeriksaan
kelayakan foto juga nyata.

Yang belum: tabel rekomendasi medis dan herbal itu saya susun manual dari referensi,
bukan keluaran AI. Dan kartu "Wabah di sekitar" di Beranda masih data contoh — fitur peta
wabahnya sendiri statusnya masih ditunda.

Saya cantumkan tabel ini supaya tidak ada bagian yang terkesan lebih hebat dari
kenyataannya.
""")

# ==================== 14. RENCANA SETELAH UTS ====================
s = slide_baru()
gaya_slide(s, "Rencana lanjutan", "Yang akan dikerjakan setelah UTS", 14)

rencana = [
    ("Memperbaiki akurasi model sapi", "Menyusun ulang dataset LSD dengan menyaring poster dan ilustrasi, "
     "lalu menambah foto ternak asli."),
    ("Melengkapi alur sertifikasi", "Pengajuan e-sertifikat, tarif, dan verifikasi oleh dokter hewan."),
    ("Membuat peta wabah", "Menampilkan sebaran wabah di sekitar pengguna, beserta laporan dari peternak."),
    ("Menambah konsultasi dokter hewan", "Pengguna bisa berkonsultasi langsung dan menyimpan hasilnya."),
]
for i, (judul, isi) in enumerate(rencana):
    y = 1.95 + i * 1.26
    kartu(s, KIRI, y, LEBAR, 1.1, judul, isi, aksen=[MERAH, HIJAU, HIJAU, HIJAU][i], uk_judul=13, uk_isi=11.5)

catatan(s, """
Rencana saya setelah UTS.

Pertama dan yang paling utama: memperbaiki akurasi model sapi. Caranya dengan menyusun
ulang dataset LSD — menyaring poster dan ilustrasi, lalu menambah foto ternak asli.

Kedua, melengkapi alur sertifikasi: pengajuan e-sertifikat, tarifnya, dan verifikasi oleh
dokter hewan.

Ketiga, membuat peta wabah supaya pengguna bisa melihat sebaran wabah di sekitarnya
dan ikut melaporkan.

Keempat, menambah fitur konsultasi langsung dengan dokter hewan.
""")

# ========================== 15. PENUTUP ==========================
s = slide_baru(HIJAU_GELAP)
batang(s, 9.0, -1.4, 6.4, 6.4, RGBColor(0x00, 0x4F, 0x2F), bentuk=MSO_SHAPE.OVAL)
batang(s, 0, 0, 0.26, SH, HIJAU)
s.shapes.add_picture(str(LOGO), Inches(1.0), Inches(1.75), height=Inches(0.95))
teks(s, 1.0, 2.95, 9.4, 1.0, [{"t": "Terima kasih", "uk": 40, "tebal": True, "warna": PUTIH}])
teks(s, 1.0, 4.0, 8.8, 1.5, [
    {"t": "Pada tahap UTS ini aplikasi sudah bisa dipakai dari membuat akun sampai menyimpan "
          "hasil pemeriksaan, dan model AI-nya sudah dilatih dari dataset ternak yang saya "
          "kumpulkan sendiri.", "uk": 13.5, "warna": KREM_TERANG},
    {"t": "Saran dan masukan sangat saya harapkan untuk tahap berikutnya.", "uk": 13,
     "warna": RGBColor(0x9E, 0xC2, 0xAC), "atas": 12},
])
garis(s, 1.0, 5.75, 4.3, 5.75, HIJAU, 1.6)
teks(s, 1.0, 6.0, 9.0, 0.5, [
    {"t": "Mutia Rahmawati  ·  11241065  ·  UTS Tugas Besar IPPL", "uk": 12, "tebal": True, "warna": PUTIH},
])

catatan(s, """
Jadi kesimpulannya, pada tahap UTS ini aplikasi sudah bisa dipakai dari membuat akun sampai
menyimpan hasil pemeriksaan, dan model AI-nya sudah dilatih dari dataset ternak yang saya
kumpulkan sendiri — bukan data contoh.

Yang sudah saya sampaikan tadi: latar belakang masalahnya, solusi yang saya buat, alur
pemakaian aplikasinya, tampilan tiap halaman, cara membaca hasilnya, akurasi apa adanya
beserta keterbatasannya, progres 17 dari 40 fitur, dan rencana lanjutannya.

Saran dan masukan sangat saya harapkan untuk tahap berikutnya. Terima kasih.
""")

# ============================== simpan ==============================
prs.save(str(KELUARAN))
print("tersimpan:", KELUARAN)
print("jumlah slide:", len(prs.slides.__iter__.__self__._sldIdLst))
