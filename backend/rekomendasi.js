/**
 * Rekomendasi penanganan per penyakit.
 * RF-14 (obat medis) dan RF-15 (jamu/herbal).
 *
 * Catatan: seluruh rekomendasi bersifat informasi awal dan tetap
 * perlu dikonfirmasi dokter hewan.
 */

const REKOMENDASI = {
  'Penyakit Mulut dan Kuku (PMK)': {
    medis: [
      'Pisahkan ternak sakit dari kawanan (isolasi) agar tidak menular.',
      'Laporkan ke Dinas Peternakan setempat karena PMK wajib lapor.',
      'Bersihkan dan disinfeksi kandang serta peralatan dengan desinfektan.',
      'Beri antiseptik (iodium/povidone) pada luka mulut dan kuku.',
      'Antibiotik untuk mencegah infeksi sekunder sesuai resep dokter hewan.',
      'Berikan pakan lunak dan pastikan air minum cukup.',
    ],
    herbal: [
      'Air rebusan kunyit + temulawak untuk menjaga nafsu makan.',
      'Oleskan gel lidah buaya (aloe vera) pada luka mulut.',
      'Air kelapa muda untuk membantu menjaga cairan tubuh ternak.',
    ],
  },
  'Lumpy Skin Disease (LSD)': {
    medis: [
      'Isolasi ternak yang menunjukkan benjolan (nodul) pada kulit.',
      'Laporkan ke Dinas Peternakan karena LSD wajib lapor.',
      'Beri antiseptik pada nodul yang pecah agar tidak infeksi.',
      'Antibiotik dan antiinflamasi sesuai resep dokter hewan.',
      'Vaksinasi ternak sehat di sekitar lokasi kejadian.',
      'Kendalikan lalat dan nyamuk sebagai vektor penyebar.',
    ],
    herbal: [
      'Kunyit + daun sirih sebagai antiseptik alami pada luka.',
      'Daun pepaya tumbuk untuk mempercepat penyembuhan luka kulit.',
      'Madu dioleskan tipis pada nodul yang terbuka.',
    ],
  },
  Scabies: {
    medis: [
      'Mandikan ternak dengan larutan akarisida sesuai dosis dari dokter hewan.',
      'Potong bulu di area kulit yang terserang agar obat meresap.',
      'Beri antibiotik bila sudah terjadi infeksi sekunder.',
      'Pisahkan ternak sakit dan bersihkan kandang serta alas tidur.',
      'Ulangi pengobatan sesuai jadwal yang dianjurkan.',
    ],
    herbal: [
      'Oleskan campuran belerang halus + minyak kelapa pada kulit.',
      'Air rebusan daun sirsak atau tembakau untuk memandikan kambing.',
      'Minyak kelapa murni untuk melembapkan kulit yang bersisik.',
    ],
  },
  Orf: {
    medis: [
      'Bersihkan keropeng dengan larutan antiseptik.',
      'Beri salep antibiotik pada area luka.',
      'Antibiotik untuk mencegah infeksi sekunder sesuai resep dokter hewan.',
      'Pisahkan ternak sakit dari kawanan.',
      'Vaksinasi kawanan yang berisiko tertular.',
    ],
    herbal: [
      'Daun sirih tumbuk untuk dioleskan pada luka mulut.',
      'Air kunyit untuk mempercepat proses mengeringnya keropeng.',
      'Madu sebagai antiseptik alami pada luka.',
    ],
  },
  Coccidiosis: {
    medis: [
      'Beri koksidiostat sesuai dosis dan resep dokter hewan.',
      'Ganti alas kandang dan jaga kandang tetap kering.',
      'Pisahkan ayam sakit dari kawanan.',
      'Berikan vitamin dan elektrolit untuk mengembalikan kondisi.',
      'Desinfeksi tempat pakan dan tempat minum.',
    ],
    herbal: [
      'Air rebusan temulawak untuk meningkatkan daya tahan tubuh.',
      'Bawang putih halus dicampur air minum sebagai antibakteri alami.',
      'Air perasan daun mengkudu sebagai penambah imun.',
    ],
  },
};

const DEFAULT_REKOMENDASI = {
  medis: [
    'Pantau kondisi ternak dan pisahkan bila gejalanya bertambah berat.',
    'Konsultasikan hasil ini ke dokter hewan terdekat.',
  ],
  herbal: [
    'Berikan pakan bergizi dan air minum yang bersih.',
    'Cukupi vitamin untuk menjaga daya tahan tubuh ternak.',
  ],
};

function rekomendasiUntuk(penyakit) {
  return REKOMENDASI[penyakit] || DEFAULT_REKOMENDASI;
}

module.exports = { rekomendasiUntuk, REKOMENDASI };
