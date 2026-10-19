const path = require('node:path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const { db } = require('./db');
const { rekomendasiUntuk } = require('./rekomendasi');

const PORT = Number(process.env.PORT || 3000);
const FLASK_URL = process.env.FLASK_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia-prototype-uts-livestockhealth';
const KUOTA_GRATIS = Number(process.env.KUOTA_GRATIS || 3);
const AMBANG_PERINGATAN = Number(process.env.AMBANG_PERINGATAN || 0.7);
const UKURAN_MAKS = Number(process.env.UKURAN_MAKS || 5 * 1024 * 1024);
const SPESIES_VALID = ['sapi', 'kambing', 'ayam'];
const TIPE_DIIZINKAN = ['image/jpeg', 'image/jpg', 'image/png'];

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

const unggah = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UKURAN_MAKS },
  fileFilter: (_req, file, cb) => {
    if (!TIPE_DIIZINKAN.includes(file.mimetype)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Format foto harus JPG atau PNG.'));
    }
    cb(null, true);
  },
});

const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function buatToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

function dataPengguna(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;
  const total = db.prepare('SELECT COUNT(*) AS n FROM riwayat WHERE user_id = ?').get(id).n;
  return {
    id: Number(user.id),
    nama: user.nama,
    email: user.email,
    peran: user.peran,
    sisa_scan: Number(user.sisa_scan),
    total_scan: Number(total),
  };
}

function barisKeHasil(baris) {
  let fitur = [];
  try { fitur = JSON.parse(baris.fitur_visual || '[]'); } catch { fitur = []; }
  return {
    id: Number(baris.id),
    spesies: baris.spesies,
    penyakit: baris.penyakit,
    confidence: Number(baris.confidence),
    peringatan: Boolean(baris.peringatan),
    gejala: baris.gejala || '',
    fitur_visual: fitur,
    rekomendasi: rekomendasiUntuk(baris.penyakit),
    model: baris.model || '',
    created_at: baris.created_at,
  };
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Anda belum masuk. Silakan login kembali.' });

  try {
    const muatan = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(muatan.id);
    if (!user) return res.status(401).json({ error: 'Akun tidak ditemukan.' });
    req.userId = Number(user.id);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa.' });
  }
}

app.post('/api/register', (req, res) => {
  const nama = String(req.body.nama || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (nama.length < 3) return res.status(400).json({ error: 'Nama lengkap minimal 3 karakter.' });
  if (!emailValid(email)) return res.status(400).json({ error: 'Format email tidak valid.' });
  if (password.length < 6) return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });

  const sudahAda = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (sudahAda) return res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk.' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (nama, email, password_hash, peran, sisa_scan) VALUES (?, ?, ?, ?, ?)')
    .run(nama, email, hash, 'peternak', KUOTA_GRATIS);

  const id = Number(info.lastInsertRowid);
  res.status(201).json({ token: buatToken({ id }), user: dataPengguna(id) });
});

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email atau kata sandi salah.' });
  }

  const id = Number(user.id);
  res.json({ token: buatToken({ id }), user: dataPengguna(id) });
});

app.get('/api/me', auth, (req, res) => {
  res.json(dataPengguna(req.userId));
});

app.get('/api/riwayat', auth, (req, res) => {
  const baris = db
    .prepare('SELECT * FROM riwayat WHERE user_id = ? ORDER BY id DESC')
    .all(req.userId);
  res.json({ riwayat: baris.map(barisKeHasil) });
});

app.get('/api/riwayat/:id', auth, (req, res) => {
  const baris = db
    .prepare('SELECT * FROM riwayat WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id) || 0, req.userId);
  if (!baris) return res.status(404).json({ error: 'Data riwayat tidak ditemukan.' });
  res.json({ hasil: barisKeHasil(baris) });
});

app.post('/api/scan', auth, unggah.single('gambar'), async (req, res) => {
  const spesies = String(req.body.spesies || '').trim().toLowerCase();
  const gejala = String(req.body.gejala || '').trim().slice(0, 300);

  if (!SPESIES_VALID.includes(spesies)) {
    return res.status(400).json({ error: 'Jenis ternak tidak valid. Pilih sapi, kambing, atau ayam.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Foto ternak wajib diunggah (JPG/PNG, maksimal 5 MB).' });
  }

  const user = db.prepare('SELECT sisa_scan FROM users WHERE id = ?').get(req.userId);
  if (Number(user.sisa_scan) <= 0) {
    return res.status(403).json({ error: 'Kuota gratis habis. Beli token untuk melanjutkan scan.' });
  }

  let prediksi;
  try {
    const form = new FormData();
    form.append('spesies', spesies);
    form.append('gambar', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || 'foto.jpg');

    const jawaban = await fetch(`${FLASK_URL}/predict`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10000),
    });

    let isi = {};
    try { isi = await jawaban.json(); } catch {}

    if (!jawaban.ok) {
      const pesan = isi.error || 'Layanan AI menolak permintaan.';
      return res.status(jawaban.status >= 500 ? 502 : jawaban.status).json({ error: pesan });
    }
    prediksi = isi;
  } catch (err) {
    const pesan = err.name === 'TimeoutError'
      ? 'Analisis melebihi batas 10 detik.'
      : `Layanan AI (Flask) tidak dapat dihubungi di ${FLASK_URL}.`;
    return res.status(502).json({ error: `${pesan} Kuota scan Anda tidak berkurang.` });
  }

  const confidence = Number(prediksi.confidence) || 0;
  const peringatan = confidence < AMBANG_PERINGATAN ? 1 : 0;

  let idRiwayat;
  db.exec('BEGIN');
  try {
    const info = db
      .prepare(
        `INSERT INTO riwayat (user_id, spesies, penyakit, confidence, peringatan, gejala, fitur_visual, model)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.userId,
        spesies,
        prediksi.penyakit,
        confidence,
        peringatan,
        gejala || null,
        JSON.stringify(prediksi.fitur_visual || []),
        prediksi.model || null
      );

    db.prepare('UPDATE users SET sisa_scan = sisa_scan - 1 WHERE id = ?').run(req.userId);
    db.exec('COMMIT');
    idRiwayat = Number(info.lastInsertRowid);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[backend] gagal menyimpan hasil scan:', err);
    return res.status(500).json({ error: 'Gagal menyimpan hasil scan. Kuota Anda tidak berkurang.' });
  }

  const baris = db.prepare('SELECT * FROM riwayat WHERE id = ?').get(idRiwayat);
  const profil = dataPengguna(req.userId);

  const hasil = barisKeHasil(baris);
  if (prediksi.kualitas_foto) hasil.kualitas_foto = prediksi.kualitas_foto;

  res.status(201).json({ hasil, sisa_scan: profil.sisa_scan, total_scan: profil.total_scan });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const pesan = err.code === 'LIMIT_FILE_SIZE'
      ? 'Ukuran foto melebihi 5 MB.'
      : err.field || 'Berkas tidak dapat diproses.';
    return res.status(400).json({ error: pesan });
  }
  console.error('[backend] error tak terduga:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.use((_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

app.listen(PORT, () => {
  console.log(`[backend] LivestockHealth Scan berjalan di http://localhost:${PORT}`);
  console.log(`[backend] Frontend disajikan dari folder /frontend`);
  console.log(`[backend] AI service diharapkan di ${FLASK_URL}`);
});
