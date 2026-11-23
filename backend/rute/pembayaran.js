const crypto = require('node:crypto');
const { db } = require('../db');

const METODE = {
  qris: 'QRIS',
  va: 'Transfer VA',
  ewallet: 'E-wallet',
};

function kodePesanan() {
  return 'INV-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function barisKePesanan(b) {
  return {
    kode: b.kode,
    paket: b.paket_kode,
    nama_paket: b.nama_paket,
    jumlah_scan: Number(b.jumlah_scan),
    harga: Number(b.harga),
    biaya_layanan: Number(b.biaya),
    total: Number(b.total),
    metode: b.metode,
    metode_label: METODE[b.metode] || b.metode,
    status: b.status,
    simulasi: true,
    created_at: b.created_at,
    dibayar_at: b.dibayar_at || null,
  };
}

module.exports = (app, { auth, bodyJson, paket, biayaLayanan }) => {
  const cariPaket = (kode) => paket.find((p) => p.kode === kode);

  app.get('/api/pembayaran', auth, (req, res) => {
    const baris = db
      .prepare('SELECT * FROM pesanan WHERE user_id = ? ORDER BY id DESC LIMIT 30')
      .all(req.userId);
    res.json({ pesanan: baris.map(barisKePesanan) });
  });

  app.post('/api/pembayaran', auth, (req, res) => {
    const body = bodyJson(req);
    const pilihan = cariPaket(String(body.paket || '').trim());
    const metode = String(body.metode || '').trim().toLowerCase();

    if (!pilihan) return res.status(400).json({ error: 'Paket token tidak dikenal.' });
    if (!METODE[metode]) {
      return res.status(400).json({ error: 'Metode pembayaran tidak dikenal. Pilih QRIS, transfer VA, atau e-wallet.' });
    }

    let kode = kodePesanan();
    while (db.prepare('SELECT 1 FROM pesanan WHERE kode = ?').get(kode)) kode = kodePesanan();

    const biaya = Number(biayaLayanan);
    const total = Number(pilihan.harga) + biaya;

    db.prepare(
      `INSERT INTO pesanan (kode, user_id, paket_kode, nama_paket, jumlah_scan, harga, biaya, total, metode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(kode, req.userId, pilihan.kode, pilihan.nama, pilihan.jumlah, pilihan.harga, biaya, total, metode);

    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    res.status(201).json({
      pesanan: barisKePesanan(baris),
      pesan: 'Pesanan dibuat. Lanjutkan ke halaman pembayaran.',
    });
  });

  app.get('/api/pembayaran/:kode', auth, (req, res) => {
    const kode = String(req.params.kode || '').trim().toUpperCase();
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris || Number(baris.user_id) !== Number(req.userId)) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
    res.json({ pesanan: barisKePesanan(baris) });
  });

  app.post('/api/pembayaran/:kode/bayar', auth, (req, res) => {
    const kode = String(req.params.kode || '').trim().toUpperCase();
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris || Number(baris.user_id) !== Number(req.userId)) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
    if (baris.status === 'dibayar') {
      return res.status(409).json({ error: 'Pesanan ini sudah dibayar.' });
    }

    db.exec('BEGIN');
    try {
      const ubah = db
        .prepare(`UPDATE pesanan SET status = 'dibayar', dibayar_at = datetime('now')
                  WHERE kode = ? AND status = 'menunggu'`)
        .run(kode);
      if (Number(ubah.changes) === 0) {
        db.exec('ROLLBACK');
        return res.status(409).json({ error: 'Pesanan ini sudah diproses.' });
      }

      db.prepare('UPDATE users SET sisa_scan = sisa_scan + ? WHERE id = ?')
        .run(Number(baris.jumlah_scan), req.userId);
      db.prepare('INSERT INTO transaksi (user_id, kode, jumlah_scan, keterangan) VALUES (?, ?, ?, ?)')
        .run(req.userId, kode, Number(baris.jumlah_scan), `Pembelian ${baris.nama_paket} (${METODE[baris.metode] || baris.metode})`);

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('[backend] gagal memproses pembayaran:', err);
      return res.status(500).json({ error: 'Gagal memproses pembayaran. Kuota Anda tidak berubah.' });
    }

    const profil = db.prepare('SELECT sisa_scan FROM users WHERE id = ?').get(req.userId);
    const terbaru = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    res.json({
      pesanan: barisKePesanan(terbaru),
      sisa_scan: Number(profil.sisa_scan),
      pesan: `${Number(baris.jumlah_scan)} scan ditambahkan ke kuota.`,
    });
  });
};
