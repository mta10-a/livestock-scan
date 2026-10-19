const fs = require('node:fs');
const path = require('node:path');
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
    sisa_scan     INTEGER NOT NULL DEFAULT 3,
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

  CREATE INDEX IF NOT EXISTS idx_riwayat_user ON riwayat(user_id, id DESC);
`);

const kolomRiwayat = db.prepare('PRAGMA table_info(riwayat)').all().map((k) => k.name);
if (!kolomRiwayat.includes('model')) {
  db.exec('ALTER TABLE riwayat ADD COLUMN model TEXT');
}

module.exports = { db, DIR_DATA };
