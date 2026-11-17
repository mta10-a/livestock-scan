const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { db, DIR_DATA } = require('../db');

const DIR_STR = path.join(DIR_DATA, 'berkas-str');
const TIPE_STR = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

const unggahStr = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!TIPE_STR[file.mimetype]) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Berkas STR harus JPG, PNG, atau PDF.'));
    }
    cb(null, true);
  },
});

function barisDokter(userId) {
  const baris = db.prepare('SELECT * FROM dokter WHERE user_id = ?').get(userId);
  if (!baris) return null;
  return {
    nomor_str: baris.nomor_str,
    wilayah: baris.wilayah || '',
    status: baris.status,
    catatan: baris.catatan || '',
    ada_berkas: Boolean(baris.berkas),
    dibuat: baris.dibuat,
    diputuskan: baris.diputuskan,
  };
}

function simpanBerkas(userId, file) {
  fs.mkdirSync(DIR_STR, { recursive: true });
  const ext = TIPE_STR[file.mimetype];
  const nama = `${userId}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(DIR_STR, nama), file.buffer);
  return path.posix.join('berkas-str', nama);
}

module.exports = (app, { auth, bodyJson }) => {
  app.get('/api/dokter/status', auth, (req, res) => {
    const user = db.prepare('SELECT peran FROM users WHERE id = ?').get(req.userId);
    res.json({ peran: user ? user.peran : 'peternak', dokter: barisDokter(req.userId) });
  });

  app.post('/api/dokter/daftar', auth, unggahStr.single('berkas'), (req, res) => {
    const body = bodyJson(req);
    const nomorStr = String(body.nomor_str || '').trim().slice(0, 40);
    const wilayah = String(body.wilayah || '').trim().slice(0, 80);

    const user = db.prepare('SELECT peran FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.' });
    if (user.peran === 'admin') {
      return res.status(403).json({ error: 'Akun admin tidak perlu mendaftar sebagai dokter.' });
    }
    if (user.peran === 'dokter') {
      return res.status(409).json({ error: 'Akun Anda sudah terverifikasi sebagai dokter.' });
    }
    if (nomorStr.length < 3) {
      return res.status(400).json({ error: 'Nomor STR minimal 3 karakter.' });
    }
    if (!/^[A-Za-z0-9./ -]+$/.test(nomorStr)) {
      return res.status(400).json({ error: 'Nomor STR hanya boleh berisi huruf, angka, titik, garis miring, dan tanda hubung.' });
    }
    if (wilayah.length < 3) {
      return res.status(400).json({ error: 'Wilayah praktik minimal 3 karakter.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Berkas STR wajib diunggah (JPG, PNG, atau PDF, maksimal 2 MB).' });
    }

    const sebelumnya = db.prepare('SELECT * FROM dokter WHERE user_id = ?').get(req.userId);
    if (sebelumnya && sebelumnya.status === 'menunggu') {
      return res.status(409).json({ error: 'Pengajuan Anda masih menunggu verifikasi admin.' });
    }

    const berkas = simpanBerkas(req.userId, req.file);

    if (sebelumnya) {
      if (sebelumnya.berkas) {
        const lama = path.join(DIR_DATA, sebelumnya.berkas);
        if (lama.startsWith(DIR_STR)) fs.rmSync(lama, { force: true });
      }
      db.prepare(
        `UPDATE dokter SET nomor_str = ?, wilayah = ?, berkas = ?, status = 'menunggu',
         catatan = NULL, dibuat = datetime('now'), diputuskan = NULL WHERE user_id = ?`
      ).run(nomorStr, wilayah, berkas, req.userId);
    } else {
      db.prepare(
        `INSERT INTO dokter (user_id, nomor_str, wilayah, berkas, status)
         VALUES (?, ?, ?, ?, 'menunggu')`
      ).run(req.userId, nomorStr, wilayah, berkas);
    }

    res.status(201).json({
      dokter: barisDokter(req.userId),
      pesan: 'Pengajuan akun dokter terkirim. Menunggu verifikasi admin.',
    });
  });
};
