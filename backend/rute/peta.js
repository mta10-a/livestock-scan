const { db } = require('../db');

function pokokWilayah(alamat) {
  const bersih = String(alamat || '')
    .replace(/\bkecamatan\b/gi, '')
    .replace(/\bkec\.?/gi, '')
    .replace(/^[\s,.;:/-]+/, '')
    .trim();
  const pertama = bersih.split(/[,;/]/)[0].trim();
  return pertama.slice(0, 40);
}

module.exports = (app, { auth }) => {
  app.get('/api/peta/sebaran', auth, (_req, res) => {
    const titik = db
      .prepare(
        `SELECT id, spesies, penyakit, jumlah_sakit, kecamatan, lat, lng, created_at
         FROM laporan_wabah
         WHERE lat IS NOT NULL AND lng IS NOT NULL
         ORDER BY id DESC LIMIT 200`
      )
      .all()
      .map((b) => ({
        id: Number(b.id),
        spesies: b.spesies,
        penyakit: b.penyakit,
        jumlah_sakit: Number(b.jumlah_sakit),
        kecamatan: b.kecamatan,
        lat: Number(b.lat),
        lng: Number(b.lng),
        created_at: b.created_at,
      }));

    const wilayah = db
      .prepare(
        `SELECT kecamatan,
                COUNT(*) AS jumlah_laporan,
                SUM(jumlah_sakit) AS jumlah_sakit,
                MAX(created_at) AS terakhir
         FROM laporan_wabah
         GROUP BY kecamatan
         ORDER BY jumlah_laporan DESC, jumlah_sakit DESC
         LIMIT 50`
      )
      .all()
      .map((b) => ({
        kecamatan: b.kecamatan,
        jumlah_laporan: Number(b.jumlah_laporan),
        jumlah_sakit: Number(b.jumlah_sakit),
        terakhir: b.terakhir,
      }));

    const total = db.prepare('SELECT COUNT(*) AS n FROM laporan_wabah').get().n;

    res.json({ total: Number(total), titik, wilayah });
  });

  app.get('/api/wabah/sekitar', auth, (req, res) => {
    const user = db.prepare('SELECT alamat FROM users WHERE id = ?').get(req.userId);
    const kata = pokokWilayah(user && user.alamat);
    const batas = `datetime('now', '-30 days')`;

    let jumlah;
    let baris;
    let dasar;

    if (kata.length >= 3) {
      dasar = 'alamat';
      const pola = '%' + kata.toLowerCase() + '%';
      jumlah = db
        .prepare(
          `SELECT COUNT(*) AS n FROM laporan_wabah
           WHERE created_at >= ${batas} AND lower(kecamatan) LIKE ?`
        )
        .get(pola).n;
      baris = db
        .prepare(
          `SELECT * FROM laporan_wabah
           WHERE created_at >= ${batas} AND lower(kecamatan) LIKE ?
           ORDER BY id DESC LIMIT 5`
        )
        .all(pola);
    } else {
      dasar = 'nasional';
      jumlah = db
        .prepare(`SELECT COUNT(*) AS n FROM laporan_wabah WHERE created_at >= ${batas}`)
        .get().n;
      baris = db
        .prepare(
          `SELECT * FROM laporan_wabah WHERE created_at >= ${batas} ORDER BY id DESC LIMIT 5`
        )
        .all();
    }

    res.json({
      dasar,
      kata_kunci: kata,
      jumlah: Number(jumlah),
      laporan: baris.map((b) => ({
        id: Number(b.id),
        spesies: b.spesies,
        penyakit: b.penyakit,
        jumlah_sakit: Number(b.jumlah_sakit),
        kecamatan: b.kecamatan,
        created_at: b.created_at,
      })),
      catatan: 'Berdasarkan laporan sesama peternak, bukan data resmi Dinas Peternakan.',
    });
  });
};
