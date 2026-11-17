const { db } = require('../db');

const POLA_KODE = /^LHS-[A-Z0-9]{6,16}$/;

module.exports = (app, { auth }) => {
  app.get('/api/sertifikat/saya', auth, (req, res) => {
    const baris = db
      .prepare('SELECT * FROM riwayat WHERE user_id = ? ORDER BY id DESC LIMIT 50')
      .all(req.userId);
    res.json({
      sertifikat: baris
        .filter((b) => b.kode_sertifikat)
        .map((b) => ({
          kode: b.kode_sertifikat,
          spesies: b.spesies,
          penyakit: b.penyakit,
          keyakinan: Number(b.confidence),
          created_at: b.created_at,
        })),
    });
  });

  app.get('/api/sertifikat/:kode', (req, res) => {
    const kode = String(req.params.kode || '').trim().toUpperCase();
    if (!POLA_KODE.test(kode)) {
      return res.status(400).json({ error: 'Format kode sertifikat tidak valid.' });
    }

    const baris = db
      .prepare(
        `SELECT r.*, u.nama, u.nama_peternakan, u.alamat
         FROM riwayat r JOIN users u ON u.id = r.user_id
         WHERE r.kode_sertifikat = ?`
      )
      .get(kode);

    if (!baris) {
      return res.status(404).json({ error: 'Sertifikat tidak ditemukan. Periksa kembali kodenya.' });
    }

    res.json({
      sertifikat: {
        kode: baris.kode_sertifikat,
        nama_pemilik: baris.nama,
        nama_peternakan: baris.nama_peternakan || '',
        alamat: baris.alamat || '',
        spesies: baris.spesies,
        penyakit: baris.penyakit,
        keyakinan: Number(baris.confidence),
        model: baris.model || '',
        tanggal: baris.created_at,
        catatan: 'Indikasi awal dari model AI, bukan diagnosis resmi dokter hewan.',
      },
    });
  });
};
