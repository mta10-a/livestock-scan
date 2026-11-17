const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const DIR_DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DIR_DATA, { recursive: true });

const db = new DatabaseSync(path.join(DIR_DATA, 'livestock.db'));

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nama          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    peran         TEXT    NOT NULL DEFAULT 'peternak',
    sisa_scan     INTEGER NOT NULL DEFAULT 3 CHECK (sisa_scan >= 0),
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS riwayat (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spesies      TEXT    NOT NULL,
    penyakit     TEXT    NOT NULL,
    confidence   REAL    NOT NULL,
    peringatan   INTEGER NOT NULL DEFAULT 0,
    gejala       TEXT,
    fitur_visual TEXT,
    model        TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS laporan_wabah (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spesies      TEXT    NOT NULL,
    penyakit     TEXT    NOT NULL,
    jumlah_sakit INTEGER NOT NULL,
    kecamatan    TEXT    NOT NULL,
    catatan      TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS voucher (
    kode           TEXT    PRIMARY KEY,
    jumlah_scan    INTEGER NOT NULL,
    sisa_pemakaian INTEGER NOT NULL,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transaksi (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kode        TEXT    NOT NULL,
    jumlah_scan INTEGER NOT NULL,
    keterangan  TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dokter (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nomor_str  TEXT    NOT NULL,
    wilayah    TEXT,
    berkas     TEXT,
    status     TEXT    NOT NULL DEFAULT 'menunggu',
    catatan    TEXT,
    dibuat     TEXT    NOT NULL DEFAULT (datetime('now')),
    diputuskan TEXT
  );

  CREATE TABLE IF NOT EXISTS konsultasi (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dokter_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    riwayat_id INTEGER REFERENCES riwayat(id) ON DELETE SET NULL,
    topik      TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'menunggu',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pesan_konsultasi (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    konsultasi_id INTEGER NOT NULL REFERENCES konsultasi(id) ON DELETE CASCADE,
    pengirim_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    isi           TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_riwayat_user ON riwayat(user_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_laporan_waktu ON laporan_wabah(id DESC);
  CREATE INDEX IF NOT EXISTS idx_laporan_user ON laporan_wabah(user_id, id DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_transaksi_unik ON transaksi(user_id, kode);
  CREATE INDEX IF NOT EXISTS idx_konsultasi_user ON konsultasi(user_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_konsultasi_dokter ON konsultasi(dokter_id, status);
  CREATE INDEX IF NOT EXISTS idx_pesan_konsultasi ON pesan_konsultasi(konsultasi_id, id);
`);

function tambahKolom(tabel, kolom, definisi) {
  const ada = db.prepare(`PRAGMA table_info(${tabel})`).all().map((k) => k.name);
  if (!ada.includes(kolom)) db.exec(`ALTER TABLE ${tabel} ADD COLUMN ${kolom} ${definisi}`);
}

tambahKolom('riwayat', 'model', 'TEXT');
tambahKolom('riwayat', 'pendapat_kedua', 'TEXT');
tambahKolom('riwayat', 'kode_sertifikat', 'TEXT');
tambahKolom('laporan_wabah', 'lat', 'REAL');
tambahKolom('laporan_wabah', 'lng', 'REAL');
tambahKolom('users', 'token_version', 'INTEGER NOT NULL DEFAULT 0');
tambahKolom('users', 'nama_peternakan', 'TEXT');
tambahKolom('users', 'alamat', 'TEXT');
tambahKolom('users', 'jenis_ternak', 'TEXT');
tambahKolom('users', 'jumlah_ternak', 'INTEGER');

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sertifikat_kode
  ON riwayat(kode_sertifikat) WHERE kode_sertifikat IS NOT NULL;
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS cegah_kuota_negatif
  BEFORE UPDATE OF sisa_scan ON users
  WHEN NEW.sisa_scan < 0
  BEGIN
    SELECT RAISE(ABORT, 'sisa_scan tidak boleh negatif');
  END;
`);

db.exec('UPDATE users SET sisa_scan = 0 WHERE sisa_scan < 0');

const jumlahVoucher = Number(db.prepare('SELECT COUNT(*) AS n FROM voucher').get().n);
if (jumlahVoucher === 0) {
  const isi = db.prepare('INSERT INTO voucher (kode, jumlah_scan, sisa_pemakaian) VALUES (?, ?, ?)');
  isi.run('LHS-DEMO-3', 3, 500);
  isi.run('LHS-DEMO-10', 10, 500);
}

const AKUN_DEMO = [
  { email: 'admin@livestockhealth.id', nama: 'Admin Demo', sandi: 'admin123', peran: 'admin' },
  { email: 'dokter@livestockhealth.id', nama: 'drh. Demo Pratama', sandi: 'dokter123', peran: 'dokter' },
];

for (const akun of AKUN_DEMO) {
  const ada = db.prepare('SELECT id FROM users WHERE email = ?').get(akun.email);
  if (!ada) {
    db.prepare('INSERT INTO users (nama, email, password_hash, peran, sisa_scan) VALUES (?, ?, ?, ?, ?)')
      .run(akun.nama, akun.email, bcrypt.hashSync(akun.sandi, 10), akun.peran, 3);
  }
}

const akunDokter = db.prepare('SELECT id FROM users WHERE email = ?').get('dokter@livestockhealth.id');
if (akunDokter && !db.prepare('SELECT user_id FROM dokter WHERE user_id = ?').get(akunDokter.id)) {
  db.prepare(
    `INSERT INTO dokter (user_id, nomor_str, wilayah, status, catatan, diputuskan)
     VALUES (?, ?, ?, 'terverifikasi', ?, datetime('now'))`
  ).run(akunDokter.id, 'DEMO-STR-0001', 'Kota Bandung', 'Akun contoh untuk demo konsultasi');
}

for (const baris of db.prepare('SELECT id FROM riwayat WHERE kode_sertifikat IS NULL').all()) {
  db.prepare('UPDATE riwayat SET kode_sertifikat = ? WHERE id = ?')
    .run('LHS-' + crypto.randomBytes(5).toString('hex').toUpperCase(), baris.id);
}

module.exports = { db, DIR_DATA, kodeSertifikatBaru: () => 'LHS-' + crypto.randomBytes(5).toString('hex').toUpperCase() };