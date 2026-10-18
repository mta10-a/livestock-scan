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
  'Sehat': {
    medis: [
      'Tidak ada tanda penyakit luar yang menonjol pada foto. Lanjutkan pemeriksaan rutin.',
      'Jaga jadwal vaksinasi dan pemberian obat cacing sesuai anjuran dokter hewan.',
      'Bersihkan kandang, alas tidur, dan tempat pakan secara berkala.',
      'Pastikan pakan bergizi dan air minum selalu bersih.',
      'Pisahkan ternak baru selama beberapa hari sebelum digabung ke kawanan.',
    ],
    herbal: [
      'Air rebusan kunyit + temulawak untuk menjaga daya tahan tubuh.',
      'Bawang putih halus dicampur air minum sebagai antibakteri alami.',
      'Cukupi hijauan segar dan mineral agar ternak tetap sehat.',
    ],
  },
  'Tetelo (Newcastle Disease)': {
    medis: [
      'Pisahkan ayam sakit segera; tetelo sangat menular dan berakibat fatal.',
      'Laporkan ke Dinas Peternakan setempat karena tetelo wajib lapor.',
      'Vaksinasi ND pada kawanan yang masih sehat sesuai anjuran petugas.',
      'Desinfeksi kandang, tempat pakan, dan tempat minum.',
      'Berikan vitamin dan elektrolit untuk menopang kondisi ayam.',
      'Buang dan musnahkan bangkai dengan cara yang benar, jangan dijual.',
    ],
    herbal: [
      'Air rebusan temulawak untuk membantu daya tahan tubuh.',
      'Bawang putih halus dicampur air minum sebagai antibakteri alami.',
      'Jaga kandang tetap hangat dan tidak lembap.',
    ],
  },
  'Salmonellosis': {
    medis: [
      'Pisahkan ayam sakit dari kawanan.',
      'Berikan antibiotik sesuai resep dokter hewan, jangan asal dosis.',
      'Bersihkan dan desinfeksi tempat pakan serta tempat minum setiap hari.',
      'Ganti alas kandang dan jaga kandang tetap kering.',
      'Salmonellosis dapat menular ke manusia: cuci tangan setelah menangani ternak.',
    ],
    herbal: [
      'Bawang putih halus dicampur air minum sebagai antibakteri alami.',
      'Air rebusan kunyit untuk membantu menjaga nafsu makan.',
      'Air perasan daun mengkudu sebagai penambah imun.',
    ],
  },
  'Gangguan Kulit (Scabies/Orf)': {
    medis: [
      'Isolasi ternak yang kulitnya terserang agar tidak menular ke kawanan.',
      'Bersihkan keropeng dan luka dengan larutan antiseptik.',
      'Mandikan dengan larutan akarisida sesuai dosis dokter hewan bila diduga scabies.',
      'Beri salep atau antibiotik pada luka bila sudah ada infeksi sekunder.',
      'Bersihkan kandang serta alas tidur dan ganti secara berkala.',
      'Ulangi pengobatan sesuai jadwal yang dianjurkan dokter hewan.',
    ],
    herbal: [
      'Oleskan campuran belerang halus + minyak kelapa pada kulit yang terserang.',
      'Air rebusan daun sirih atau tembakau untuk memandikan ternak.',
      'Minyak kelapa murni untuk melembapkan kulit yang bersisik.',
      'Madu dioleskan tipis pada luka sebagai antiseptik alami.',
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
