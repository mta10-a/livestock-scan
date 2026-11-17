const path = require('node:path');
const fs = require('node:fs');
const { db, DIR_DATA } = require('../db');

const DIR_STR = path.join(DIR_DATA, 'berkas-str');

module.exports = (app, { auth, authPeran, bodyJson }) => {
  app.get('/api/admin/ringkasan', auth, authPeran('admin'), (_req, res) => {
    const hitung = (sql) => Number(db.prepare(sql).get().n);

    const penyakit = db
      .prepare(
        `SELECT penyakit, COUNT(*) AS jumlah FROM riwayat
         GROUP BY penyakit ORDER BY jumlah DESC LIMIT 5`
      )
      .all()
      .map((b) => ({ penyakit: b.penyakit, jumlah: Number(b.jumlah) }));

    const terbaru = db
      .prepare(
        `SELECT r.id, r.spesies, r.penyakit, r.confidence, r.created_at, u.nama
         FROM riwayat r JOIN users u ON u.id = r.user_id
         ORDER BY r.id DESC LIMIT 5`
      )
      .all()
      .map((b) => ({
        id: Number(b.id),
        spesies: b.spesies,
        penyakit: b.penyakit,
        keyakinan: Number(b.confidence),
        created_at: b.created_at,
        nama: b.nama,
      }));

    res.json({
      pengguna: {
        total: hitung('SELECT COUNT(*) AS n FROM users'),
        peternak: hitung(`SELECT COUNT(*) AS n FROM users WHERE peran = 'peternak'`),
        dokter: hitung(`SELECT COUNT(*) AS n FROM users WHERE peran = 'dokter'`),
        admin: hitung(`SELECT COUNT(*) AS n FROM users WHERE peran = 'admin'`),
      },
      scan: {
        total: hitung('SELECT COUNT(*) AS n FROM riwayat'),
        tujuh_hari: hitung(`SELECT COUNT(*) AS n FROM riwayat WHERE created_at >= datetime('now', '-7 days')`),
      },
      laporan: {
        total: hitung('SELECT COUNT(*) AS n FROM laporan_wabah'),
        tiga_puluh_hari: hitung(`SELECT COUNT(*) AS n FROM laporan_wabah WHERE created_at >= datetime('now', '-30 days')`),
      },
      token_terjual: hitung('SELECT COALESCE(SUM(jumlah_scan), 0) AS n FROM transaksi'),
      konsultasi: {
        menunggu: hitung(`SELECT COUNT(*) AS n FROM konsultasi WHERE status = 'menunggu'`),
        aktif: hitung(`SELECT COUNT(*) AS n FROM konsultasi WHERE status = 'aktif'`),
        selesai: hitung(`SELECT COUNT(*) AS n FROM konsultasi WHERE status = 'selesai'`),
      },
      dokter_menunggu: hitung(`SELECT COUNT(*) AS n FROM dokter WHERE status = 'menunggu'`),
      penyakit_teratas: penyakit,
      terbaru,
    });
  });

  app.get('/api/admin/pengguna', auth, authPeran('admin'), (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 60);
    const pola = '%' + q.toLowerCase() + '%';

    const baris = db
      .prepare(
        `SELECT u.id, u.nama, u.email, u.peran, u.created_at,
                u.sisa_scan,
                (SELECT COUNT(*) FROM riwayat r WHERE r.user_id = u.id) AS total_scan,
                (SELECT status FROM dokter d WHERE d.user_id = u.id) AS status_dokter
         FROM users u
         WHERE (? = '' OR lower(u.nama) LIKE ? OR lower(u.email) LIKE ?)
         ORDER BY u.id DESC LIMIT 60`
      )
      .all(q, pola, pola);

    res.json({
      pengguna: baris.map((b) => ({
        id: Number(b.id),
        nama: b.nama,
        email: b.email,
        peran: b.peran,
        sisa_scan: Number(b.sisa_scan),
        total_scan: Number(b.total_scan),
        status_dokter: b.status_dokter || '',
        created_at: b.created_at,
      })),
    });
  });

  app.get('/api/admin/dokter', auth, authPeran('admin'), (req, res) => {
    const status = String(req.query.status || '').trim();
    const izin = ['menunggu', 'terverifikasi', 'ditolak'];
    const pakai = izin.includes(status) ? status : null;

    const baris = db
      .prepare(
        `SELECT d.*, u.nama, u.email
         FROM dokter d JOIN users u ON u.id = d.user_id
         WHERE (? IS NULL OR d.status = ?)
         ORDER BY CASE d.status WHEN 'menunggu' THEN 0 ELSE 1 END, d.user_id DESC`
      )
      .all(pakai, pakai);

    res.json({
      dokter: baris.map((b) => ({
        user_id: Number(b.user_id),
        nama: b.nama,
        email: b.email,
        nomor_str: b.nomor_str,
        wilayah: b.wilayah || '',
        status: b.status,
        catatan: b.catatan || '',
        ada_berkas: Boolean(b.berkas),
        dibuat: b.dibuat,
        diputuskan: b.diputuskan,
      })),
    });
  });

  app.get('/api/admin/dokter/:id/berkas', auth, authPeran('admin'), (req, res) => {
    const baris = db
      .prepare('SELECT berkas FROM dokter WHERE user_id = ?')
      .get(Number(req.params.id) || 0);

    if (!baris || !baris.berkas) {
      return res.status(404).json({ error: 'Berkas STR tidak ditemukan.' });
    }

    const lokasi = path.join(DIR_DATA, baris.berkas);
    if (!lokasi.startsWith(DIR_STR) || !fs.existsSync(lokasi)) {
      return res.status(404).json({ error: 'Berkas STR tidak ditemukan.' });
    }

    res.sendFile(lokasi);
  });

  app.post('/api/admin/dokter/:id/verifikasi', auth, authPeran('admin'), (req, res) => {
    const userId = Number(req.params.id) || 0;
    const body = bodyJson(req);
    const keputusan = String(body.keputusan || '').trim().toLowerCase();
    const catatan = String(body.catatan || '').trim().slice(0, 200);

    if (!['terima', 'tolak'].includes(keputusan)) {
      return res.status(400).json({ error: 'Keputusan harus "terima" atau "tolak".' });
    }

    const baris = db.prepare('SELECT * FROM dokter WHERE user_id = ?').get(userId);
    if (!baris) return res.status(404).json({ error: 'Pengajuan dokter tidak ditemukan.' });

    const status = keputusan === 'terima' ? 'terverifikasi' : 'ditolak';
    if (baris.status === status) {
      return res.status(409).json({ error: 'Pengajuan ini sudah diproses.' });
    }

    db.exec('BEGIN');
    try {
      db.prepare(
        `UPDATE dokter SET status = ?, catatan = ?, diputuskan = datetime('now') WHERE user_id = ?`
      ).run(status, catatan || null, userId);
      db.prepare('UPDATE users SET peran = ? WHERE id = ?')
        .run(status === 'terverifikasi' ? 'dokter' : 'peternak', userId);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('[backend] gagal memverifikasi dokter:', err);
      return res.status(500).json({ error: 'Gagal menyimpan keputusan verifikasi.' });
    }

    const user = db.prepare('SELECT nama, email FROM users WHERE id = ?').get(userId);
    res.json({
      dokter: {
        user_id: userId,
        nama: user.nama,
        email: user.email,
        nomor_str: baris.nomor_str,
        wilayah: baris.wilayah || '',
        status,
        catatan,
        ada_berkas: Boolean(baris.berkas),
        dibuat: baris.dibuat,
        diputuskan: new Date().toISOString(),
      },
      pesan: status === 'terverifikasi'
        ? 'Dokter berhasil diverifikasi.'
        : 'Pengajuan dokter ditolak.',
    });
  });

  app.get('/api/admin/laporan', auth, authPeran('admin'), (_req, res) => {
    const baris = db
      .prepare(
        `SELECT l.*, u.nama
         FROM laporan_wabah l JOIN users u ON u.id = l.user_id
         ORDER BY l.id DESC LIMIT 50`
      )
      .all();

    res.json({
      laporan: baris.map((b) => ({
        id: Number(b.id),
        nama: b.nama,
        spesies: b.spesies,
        penyakit: b.penyakit,
        jumlah_sakit: Number(b.jumlah_sakit),
        kecamatan: b.kecamatan,
        catatan: b.catatan || '',
        created_at: b.created_at,
      })),
    });
  });
};
