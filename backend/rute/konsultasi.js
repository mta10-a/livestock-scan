const { db } = require('../db');

const PILIH_KONSULTASI = `
  SELECT k.*,
         u.nama AS nama_peternak,
         d.nama AS nama_dokter,
         (SELECT COUNT(*) FROM pesan_konsultasi p WHERE p.konsultasi_id = k.id) AS jumlah_pesan,
         (SELECT MAX(p.created_at) FROM pesan_konsultasi p WHERE p.konsultasi_id = k.id) AS pesan_terakhir
  FROM konsultasi k
  JOIN users u ON u.id = k.user_id
  LEFT JOIN users d ON d.id = k.dokter_id
`;

function ringkas(b, peran, userId) {
  return {
    id: Number(b.id),
    topik: b.topik,
    status: b.status,
    user_id: Number(b.user_id),
    dokter_id: b.dokter_id ? Number(b.dokter_id) : null,
    nama_peternak: b.nama_peternak,
    nama_dokter: b.nama_dokter || '',
    lawan: peran === 'dokter' ? b.nama_peternak : (b.nama_dokter || 'Belum diambil dokter'),
    jumlah_pesan: Number(b.jumlah_pesan),
    created_at: b.created_at,
    diperbarui: b.pesan_terakhir || b.updated_at,
    milik_saya: Number(b.user_id) === Number(userId),
  };
}

function bolehLihat(b, peran, userId) {
  if (peran === 'admin') return true;
  if (Number(b.user_id) === Number(userId)) return true;
  if (peran !== 'dokter') return false;
  if (Number(b.dokter_id) === Number(userId)) return true;
  return !b.dokter_id && b.status === 'menunggu';
}

module.exports = (app, { auth, bodyJson }) => {
  function peranPengguna(id) {
    const baris = db.prepare('SELECT peran FROM users WHERE id = ?').get(id);
    return baris ? baris.peran : 'peternak';
  }

  app.get('/api/konsultasi', auth, (req, res) => {
    const peran = peranPengguna(req.userId);
    let baris;

    if (peran === 'admin') {
      baris = db.prepare(`${PILIH_KONSULTASI} ORDER BY k.id DESC LIMIT 100`).all();
    } else if (peran === 'dokter') {
      baris = db
        .prepare(
          `${PILIH_KONSULTASI}
           WHERE k.dokter_id = ? OR (k.dokter_id IS NULL AND k.status = 'menunggu')
           ORDER BY k.id DESC LIMIT 100`
        )
        .all(req.userId);
    } else {
      baris = db
        .prepare(`${PILIH_KONSULTASI} WHERE k.user_id = ? ORDER BY k.id DESC LIMIT 100`)
        .all(req.userId);
    }

    const daftar = baris.map((b) => ringkas(b, peran, req.userId));
    res.json({
      peran,
      menunggu: daftar.filter((k) => k.status === 'menunggu').length,
      konsultasi: daftar,
    });
  });

  app.post('/api/konsultasi', auth, (req, res) => {
    const peran = peranPengguna(req.userId);
    if (peran !== 'peternak') {
      return res.status(403).json({ error: 'Konsultasi diajukan dari akun peternak.' });
    }

    const body = bodyJson(req);
    const topik = String(body.topik || '').trim().slice(0, 120);
    if (topik.length < 5) {
      return res.status(400).json({ error: 'Topik konsultasi minimal 5 karakter.' });
    }

    let riwayatId = null;
    if (body.riwayat_id !== undefined && body.riwayat_id !== null && body.riwayat_id !== '') {
      const hasil = db
        .prepare('SELECT id FROM riwayat WHERE id = ? AND user_id = ?')
        .get(Number(body.riwayat_id) || 0, req.userId);
      if (!hasil) return res.status(404).json({ error: 'Riwayat yang dipilih tidak ditemukan.' });
      riwayatId = Number(hasil.id);
    }

    const info = db
      .prepare('INSERT INTO konsultasi (user_id, riwayat_id, topik) VALUES (?, ?, ?)')
      .run(req.userId, riwayatId, topik);

    const baris = db
      .prepare(`${PILIH_KONSULTASI} WHERE k.id = ?`)
      .get(Number(info.lastInsertRowid));

    res.status(201).json({
      konsultasi: ringkas(baris, peran, req.userId),
      pesan: 'Konsultasi terkirim. Dokter akan menjawab pada menu konsultasi.',
    });
  });

  app.get('/api/konsultasi/:id', auth, (req, res) => {
    const id = Number(req.params.id) || 0;
    const baris = db.prepare(`${PILIH_KONSULTASI} WHERE k.id = ?`).get(id);
    if (!baris) return res.status(404).json({ error: 'Konsultasi tidak ditemukan.' });

    const peran = peranPengguna(req.userId);
    if (!bolehLihat(baris, peran, req.userId)) {
      return res.status(403).json({ error: 'Anda tidak punya akses ke konsultasi ini.' });
    }

    const pesan = db
      .prepare(
        `SELECT p.*, u.nama, u.peran
         FROM pesan_konsultasi p JOIN users u ON u.id = p.pengirim_id
         WHERE p.konsultasi_id = ? ORDER BY p.id ASC`
      )
      .all(id)
      .map((p) => ({
        id: Number(p.id),
        isi: p.isi,
        nama: p.nama,
        peran: p.peran,
        milik_saya: Number(p.pengirim_id) === Number(req.userId),
        created_at: p.created_at,
      }));

    const detail = ringkas(baris, peran, req.userId);
    detail.pesan = pesan;
    res.json({ konsultasi: detail, peran });
  });

  app.post('/api/konsultasi/:id/ambil', auth, (req, res) => {
    const peran = peranPengguna(req.userId);
    if (peran !== 'dokter') {
      return res.status(403).json({ error: 'Hanya akun dokter yang bisa mengambil konsultasi.' });
    }

    const id = Number(req.params.id) || 0;
    const baris = db.prepare('SELECT * FROM konsultasi WHERE id = ?').get(id);
    if (!baris) return res.status(404).json({ error: 'Konsultasi tidak ditemukan.' });
    if (baris.dokter_id && Number(baris.dokter_id) !== Number(req.userId)) {
      return res.status(409).json({ error: 'Konsultasi ini sudah ditangani dokter lain.' });
    }
    if (baris.status === 'selesai') {
      return res.status(409).json({ error: 'Konsultasi ini sudah selesai.' });
    }

    db.prepare(
      `UPDATE konsultasi SET dokter_id = ?, status = 'aktif', updated_at = datetime('now')
       WHERE id = ?`
    ).run(req.userId, id);

    const terbaru = db.prepare(`${PILIH_KONSULTASI} WHERE k.id = ?`).get(id);
    res.json({
      konsultasi: ringkas(terbaru, peran, req.userId),
      pesan: 'Konsultasi berhasil diambil. Silakan balas pesan peternak.',
    });
  });

  app.post('/api/konsultasi/:id/pesan', auth, (req, res) => {
    const id = Number(req.params.id) || 0;
    const baris = db.prepare('SELECT * FROM konsultasi WHERE id = ?').get(id);
    if (!baris) return res.status(404).json({ error: 'Konsultasi tidak ditemukan.' });

    const peran = peranPengguna(req.userId);
    const pemilik = Number(baris.user_id) === Number(req.userId);
    const dokter = peran === 'dokter' && Number(baris.dokter_id) === Number(req.userId);
    if (!pemilik && !dokter) {
      return res.status(403).json({ error: 'Anda tidak punya akses ke konsultasi ini.' });
    }
    if (baris.status === 'selesai') {
      return res.status(409).json({ error: 'Konsultasi sudah ditutup. Buat konsultasi baru bila perlu.' });
    }

    const isi = String(bodyJson(req).isi || '').trim().slice(0, 1000);
    if (!isi) return res.status(400).json({ error: 'Isi pesan tidak boleh kosong.' });

    const info = db
      .prepare('INSERT INTO pesan_konsultasi (konsultasi_id, pengirim_id, isi) VALUES (?, ?, ?)')
      .run(id, req.userId, isi);

    db.prepare(
      `UPDATE konsultasi SET updated_at = datetime('now'),
       status = CASE WHEN dokter_id IS NULL THEN 'menunggu' ELSE 'aktif' END
       WHERE id = ?`
    ).run(id);

    res.status(201).json({
      pesan: {
        id: Number(info.lastInsertRowid),
        isi,
        milik_saya: true,
        created_at: new Date().toISOString(),
      },
    });
  });

  app.post('/api/konsultasi/:id/selesai', auth, (req, res) => {
    const id = Number(req.params.id) || 0;
    const baris = db.prepare('SELECT * FROM konsultasi WHERE id = ?').get(id);
    if (!baris) return res.status(404).json({ error: 'Konsultasi tidak ditemukan.' });

    const peran = peranPengguna(req.userId);
    const pemilik = Number(baris.user_id) === Number(req.userId);
    const dokter = peran === 'dokter' && Number(baris.dokter_id) === Number(req.userId);
    if (!pemilik && !dokter) {
      return res.status(403).json({ error: 'Anda tidak punya akses ke konsultasi ini.' });
    }

    db.prepare(`UPDATE konsultasi SET status = 'selesai', updated_at = datetime('now') WHERE id = ?`)
      .run(id);

    res.json({ ok: true, pesan: 'Konsultasi ditandai selesai.' });
  });
};
