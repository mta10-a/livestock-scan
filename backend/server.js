const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const { db, DIR_DATA } = require('./db');
const { rekomendasiUntuk } = require('./rekomendasi');

const PORT = Number(process.env.PORT || 3000);
const FLASK_URL = process.env.FLASK_URL || 'http://127.0.0.1:5000';
const KUOTA_GRATIS = Number(process.env.KUOTA_GRATIS || 3);
const AMBANG_PERINGATAN = Number(process.env.AMBANG_PERINGATAN || 0.7);
const UKURAN_MAKS = Number(process.env.UKURAN_MAKS || 5 * 1024 * 1024);
const SPESIES_VALID = ['sapi', 'kambing', 'ayam'];
const TIPE_DIIZINKAN = ['image/jpeg', 'image/jpg', 'image/png'];
const NAMA_COOKIE = 'lhs_token';
const UMUR_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;
const BATAS_PERCOBAAN = Number(process.env.RATE_LIMIT_MAX || 10);
const JENDELA_PERCOBAAN_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const SECRET_LEMAH = new Set(['rahasia-prototype-uts-livestockhealth']);
const HALAMAN_TERLINDUNGI = new Set([
  '/beranda.html',
  '/scan.html',
  '/hasil.html',
  '/riwayat.html',
  '/profil.html',
  '/lapor.html',
  '/token.html',
]);
const PAKET_TOKEN = [
  { kode: 'hemat-3', nama: 'Paket Hemat', jumlah: 3, harga: 15000 },
  { kode: 'ternak-10', nama: 'Paket Ternak', jumlah: 10, harga: 45000 },
  { kode: 'kandang-30', nama: 'Paket Kandang', jumlah: 30, harga: 120000 },
];

function muatJwtSecret() {
  if (process.env.JWT_SECRET) {
    if (SECRET_LEMAH.has(process.env.JWT_SECRET)) {
      console.error('[backend] JWT_SECRET masih memakai nilai bawaan repo. Ganti dengan nilai acak.');
      process.exit(1);
    }
    return process.env.JWT_SECRET;
  }

  const berkas = path.join(DIR_DATA, '.jwt-secret');
  try {
    const isi = fs.readFileSync(berkas, 'utf8').trim();
    if (isi) return isi;
  } catch {}

  const baru = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(DIR_DATA, { recursive: true });
  fs.writeFileSync(berkas, baru, { mode: 0o600 });
  console.warn('[backend] JWT_SECRET tidak diset; memakai secret acak di data/.jwt-secret');
  return baru;
}

const JWT_SECRET = muatJwtSecret();

const app = express();

const ASAL_DIIZINKAN = new Set(
  (process.env.CORS_ORIGIN || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ].join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

app.use((req, res, next) => {
  const asal = req.headers.origin;
  if (asal && ASAL_DIIZINKAN.has(asal)) {
    res.setHeader('Access-Control-Allow-Origin', asal);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.use((err, _req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'Body JSON tidak valid.' });
  }
  next(err);
});

function bacaCookie(req, nama) {
  const header = req.headers.cookie || '';
  for (const bagian of header.split(';')) {
    const potong = bagian.trim();
    const samaDengan = potong.indexOf('=');
    if (samaDengan < 0) continue;
    if (potong.slice(0, samaDengan) === nama) {
      try { return decodeURIComponent(potong.slice(samaDengan + 1)); } catch { return null; }
    }
  }
  return null;
}

function tokenDari(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return bacaCookie(req, NAMA_COOKIE);
}

function penggunaDariToken(token) {
  if (!token) return null;
  try {
    const muatan = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare('SELECT id, token_version FROM users WHERE id = ?')
      .get(Number(muatan.id) || 0);
    if (!user) return null;
    if (Number(muatan.v || 0) !== Number(user.token_version)) return null;
    return user;
  } catch {
    return null;
  }
}

function pasangCookieToken(res, token) {
  res.cookie(NAMA_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: UMUR_TOKEN_MS,
    path: '/',
  });
}

function bodyJson(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

const percobaan = new Map();
function batasiPercobaan(req, res, next) {
  const sekarang = Date.now();
  const kunci = `${req.ip || req.socket.remoteAddress || '-'}|${req.path}`;
  let entri = percobaan.get(kunci);
  if (!entri || sekarang - entri.mulai >= JENDELA_PERCOBAAN_MS) {
    entri = { mulai: sekarang, jumlah: 0 };
    percobaan.set(kunci, entri);
  }
  entri.jumlah += 1;

  const sisa = Math.max(0, BATAS_PERCOBAAN - entri.jumlah);
  res.setHeader('RateLimit-Limit', String(BATAS_PERCOBAAN));
  res.setHeader('RateLimit-Remaining', String(sisa));

  if (entri.jumlah > BATAS_PERCOBAAN) {
    res.setHeader('Retry-After', String(Math.ceil((JENDELA_PERCOBAAN_MS - (sekarang - entri.mulai)) / 1000)));
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.' });
  }
  next();
}

setInterval(() => {
  const sekarang = Date.now();
  for (const [kunci, entri] of percobaan) {
    if (sekarang - entri.mulai >= JENDELA_PERCOBAAN_MS) percobaan.delete(kunci);
  }
}, JENDELA_PERCOBAAN_MS).unref();

app.use((req, res, next) => {
  if (req.method === 'GET' && HALAMAN_TERLINDUNGI.has(req.path)) {
    if (!penggunaDariToken(tokenDari(req))) return res.redirect(302, '/login.html');
  }
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
  return jwt.sign(
    { id: Number(user.id), v: Number(user.token_version || 0) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
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
    profil: {
      nama_peternakan: user.nama_peternakan || '',
      alamat: user.alamat || '',
      jenis_ternak: user.jenis_ternak || '',
      jumlah_ternak: user.jumlah_ternak === null || user.jumlah_ternak === undefined
        ? null
        : Number(user.jumlah_ternak),
    },
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

function barisKeLaporan(baris, userId) {
  return {
    id: Number(baris.id),
    spesies: baris.spesies,
    penyakit: baris.penyakit,
    jumlah_sakit: Number(baris.jumlah_sakit),
    kecamatan: baris.kecamatan,
    catatan: baris.catatan || '',
    milik_sendiri: Number(baris.user_id) === Number(userId),
    created_at: baris.created_at,
  };
}

function auth(req, res, next) {
  const token = tokenDari(req);
  if (!token) return res.status(401).json({ error: 'Anda belum masuk. Silakan login kembali.' });

  const user = penggunaDariToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa.' });
  }
  req.userId = Number(user.id);
  next();
}

app.post('/api/register', batasiPercobaan, (req, res) => {
  const body = bodyJson(req);
  const nama = String(body.nama || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

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
  const token = buatToken({ id, token_version: 0 });
  pasangCookieToken(res, token);
  res.status(201).json({ token, user: dataPengguna(id) });
});

app.post('/api/login', batasiPercobaan, (req, res) => {
  const body = bodyJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email atau kata sandi salah.' });
  }

  const id = Number(user.id);
  const token = buatToken(user);
  pasangCookieToken(res, token);
  res.json({ token, user: dataPengguna(id) });
});

app.post('/api/logout', auth, (req, res) => {
  db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.userId);
  res.clearCookie(NAMA_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.json({ ok: true, pesan: 'Anda sudah keluar.' });
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

const JENIS_TERNAK_PROFIL = ['', 'sapi', 'kambing', 'ayam', 'campuran'];

app.get('/api/profil', auth, (req, res) => {
  res.json(dataPengguna(req.userId));
});

app.put('/api/profil', auth, (req, res) => {
  const body = bodyJson(req);
  const namaPeternakan = String(body.nama_peternakan || '').trim().slice(0, 80);
  const alamat = String(body.alamat || '').trim().slice(0, 160);
  const jenisTernak = String(body.jenis_ternak || '').trim().toLowerCase();

  if (!JENIS_TERNAK_PROFIL.includes(jenisTernak)) {
    return res.status(400).json({ error: 'Jenis ternak utama tidak valid.' });
  }

  let jumlahTernak = null;
  const mentah = body.jumlah_ternak;
  if (mentah !== undefined && mentah !== null && String(mentah).trim() !== '') {
    jumlahTernak = Number(mentah);
    if (!Number.isInteger(jumlahTernak) || jumlahTernak < 0 || jumlahTernak > 1000000) {
      return res.status(400).json({ error: 'Jumlah ternak harus bilangan bulat 0 sampai 1.000.000.' });
    }
  }

  db.prepare(
    'UPDATE users SET nama_peternakan = ?, alamat = ?, jenis_ternak = ?, jumlah_ternak = ? WHERE id = ?'
  ).run(namaPeternakan || null, alamat || null, jenisTernak || null, jumlahTernak, req.userId);

  res.json(dataPengguna(req.userId));
});

app.get('/api/laporan', auth, (req, res) => {
  const baris = db
    .prepare('SELECT * FROM laporan_wabah WHERE user_id = ? ORDER BY id DESC')
    .all(req.userId);
  res.json({ laporan: baris.map((b) => barisKeLaporan(b, req.userId)) });
});

app.get('/api/laporan/terbaru', auth, (req, res) => {
  const baris = db.prepare('SELECT * FROM laporan_wabah ORDER BY id DESC LIMIT 8').all();
  res.json({ laporan: baris.map((b) => barisKeLaporan(b, req.userId)) });
});

app.post('/api/laporan', auth, (req, res) => {
  const body = bodyJson(req);
  const spesies = String(body.spesies || '').trim().toLowerCase();
  const penyakit = String(body.penyakit || '').trim().slice(0, 80);
  const kecamatan = String(body.kecamatan || '').trim().slice(0, 80);
  const catatan = String(body.catatan || '').trim().slice(0, 300);
  const jumlahSakit = Number(body.jumlah_sakit);

  if (!SPESIES_VALID.includes(spesies)) {
    return res.status(400).json({ error: 'Jenis ternak tidak valid.' });
  }
  if (penyakit.length < 3) {
    return res.status(400).json({ error: 'Nama penyakit atau gejala minimal 3 karakter.' });
  }
  if (!Number.isInteger(jumlahSakit) || jumlahSakit < 1 || jumlahSakit > 100000) {
    return res.status(400).json({ error: 'Jumlah ternak sakit harus 1 sampai 100.000.' });
  }
  if (kecamatan.length < 3) {
    return res.status(400).json({ error: 'Kecamatan atau wilayah minimal 3 karakter.' });
  }

  const info = db
    .prepare(
      `INSERT INTO laporan_wabah (user_id, spesies, penyakit, jumlah_sakit, kecamatan, catatan)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, spesies, penyakit, jumlahSakit, kecamatan, catatan || null);

  const baris = db.prepare('SELECT * FROM laporan_wabah WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ laporan: barisKeLaporan(baris, req.userId) });
});

app.get('/api/token/paket', auth, (_req, res) => {
  res.json({ paket: PAKET_TOKEN });
});

app.get('/api/token/transaksi', auth, (req, res) => {
  const baris = db
    .prepare('SELECT * FROM transaksi WHERE user_id = ? ORDER BY id DESC')
    .all(req.userId);
  res.json({
    transaksi: baris.map((b) => ({
      id: Number(b.id),
      kode: b.kode,
      jumlah_scan: Number(b.jumlah_scan),
      keterangan: b.keterangan || '',
      created_at: b.created_at,
    })),
  });
});

app.post('/api/token/tukar', auth, batasiPercobaan, (req, res) => {
  const kode = String(bodyJson(req).kode || '').trim().toUpperCase();

  if (!/^[A-Z0-9-]{4,40}$/.test(kode)) {
    return res.status(400).json({ error: 'Format kode token tidak valid.' });
  }

  const voucher = db.prepare('SELECT * FROM voucher WHERE kode = ?').get(kode);
  if (!voucher) return res.status(404).json({ error: 'Kode token tidak dikenali.' });
  if (Number(voucher.sisa_pemakaian) <= 0) {
    return res.status(409).json({ error: 'Stok kode token ini sudah habis.' });
  }

  const sudahDipakai = db
    .prepare('SELECT id FROM transaksi WHERE user_id = ? AND kode = ?')
    .get(req.userId, kode);
  if (sudahDipakai) {
    return res.status(409).json({ error: 'Kode ini sudah pernah Anda tukarkan.' });
  }

  const tambah = Number(voucher.jumlah_scan);

  db.exec('BEGIN');
  try {
    const pakai = db
      .prepare('UPDATE voucher SET sisa_pemakaian = sisa_pemakaian - 1 WHERE kode = ? AND sisa_pemakaian > 0')
      .run(kode);
    if (Number(pakai.changes) === 0) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: 'Stok kode token ini sudah habis.' });
    }

    db.prepare('UPDATE users SET sisa_scan = sisa_scan + ? WHERE id = ?').run(tambah, req.userId);
    db.prepare('INSERT INTO transaksi (user_id, kode, jumlah_scan, keterangan) VALUES (?, ?, ?, ?)')
      .run(req.userId, kode, tambah, 'Penukaran kode token');

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[backend] gagal menukar kode token:', err);
    return res.status(500).json({ error: 'Gagal menukar kode token. Kuota Anda tidak berubah.' });
  }

  const profil = dataPengguna(req.userId);
  res.status(201).json({ sisa_scan: profil.sisa_scan, tambah, pesan: `Token bertambah ${tambah} scan.` });
});

app.post('/api/scan', auth, unggah.single('gambar'), async (req, res) => {
  const body = bodyJson(req);
  const spesies = String(body.spesies || '').trim().toLowerCase();
  const gejala = String(body.gejala || '').trim().slice(0, 300);

  if (!SPESIES_VALID.includes(spesies)) {
    return res.status(400).json({ error: 'Jenis ternak tidak valid. Pilih sapi, kambing, atau ayam.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Foto ternak wajib diunggah (JPG/PNG, maksimal 5 MB).' });
  }

  const isJpeg = req.file.buffer.length >= 3
    && req.file.buffer[0] === 0xff && req.file.buffer[1] === 0xd8 && req.file.buffer[2] === 0xff;
  const isPng = req.file.buffer.length >= 8
    && req.file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isJpeg && !isPng) {
    return res.status(400).json({ error: 'Berkas bukan gambar JPG atau PNG yang valid.' });
  }

  const user = db.prepare('SELECT sisa_scan FROM users WHERE id = ?').get(req.userId);
  if (!user || Number(user.sisa_scan) <= 0) {
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
    const ubah = db
      .prepare('UPDATE users SET sisa_scan = sisa_scan - 1 WHERE id = ? AND sisa_scan > 0')
      .run(req.userId);
    if (Number(ubah.changes) === 0) {
      db.exec('ROLLBACK');
      return res.status(403).json({ error: 'Kuota gratis habis. Beli token untuk melanjutkan scan.' });
    }

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

  const voucher = db.prepare('SELECT kode, jumlah_scan FROM voucher ORDER BY kode').all();
  if (voucher.length) {
    const daftar = voucher.map((v) => `${v.kode} (${v.jumlah_scan} scan)`).join(', ');
    console.log(`[backend] kode token demo: ${daftar}`);
  }
});
