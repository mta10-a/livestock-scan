const crypto = require('node:crypto');
const { db } = require('../db');
const midtrans = require('../midtrans');

const METODE = {
  qris: 'QRIS',
  va: 'Transfer VA',
  ewallet: 'E-wallet',
  midtrans: 'Midtrans (QRIS/VA/e-wallet)',
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
    gateway: b.gateway || 'simulasi',
    gateway_token: b.gateway_token || null,
    redirect_url: b.redirect_url || null,
    status: b.status,
    created_at: b.created_at,
    dibayar_at: b.dibayar_at || null,
  };
}

function dasarAlamat(req) {
  const alamat = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return alamat.replace(/\/+$/, '');
}

module.exports = (app, { auth, bodyJson, paket, biayaLayanan }) => {
  const cariPaket = (kode) => paket.find((p) => p.kode === kode);

  function tandaiDibayar(kode) {
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris) return null;
    if (baris.status === 'dibayar') return { pesanan: baris, baru: false };

    db.exec('BEGIN');
    try {
      const ubah = db
        .prepare(`UPDATE pesanan SET status = 'dibayar', dibayar_at = datetime('now')
                  WHERE kode = ? AND status = 'menunggu'`)
        .run(kode);
      if (Number(ubah.changes) === 0) {
        db.exec('ROLLBACK');
        return { pesanan: db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode), baru: false };
      }

      db.prepare('UPDATE users SET sisa_scan = sisa_scan + ? WHERE id = ?')
        .run(Number(baris.jumlah_scan), baris.user_id);
      db.prepare('INSERT INTO transaksi (user_id, kode, jumlah_scan, keterangan) VALUES (?, ?, ?, ?)')
        .run(
          baris.user_id,
          kode,
          Number(baris.jumlah_scan),
          `Pembelian ${baris.nama_paket} (${METODE[baris.metode] || baris.metode})`
        );

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    return { pesanan: db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode), baru: true };
  }

  function batalkan(kode) {
    db.prepare(`UPDATE pesanan SET status = 'batal' WHERE kode = ? AND status = 'menunggu'`).run(kode);
  }

  function kirimPesanan(res, kode, tambahan = {}) {
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    const profil = db.prepare('SELECT sisa_scan FROM users WHERE id = ?').get(baris.user_id);
    res.json({
      pesanan: barisKePesanan(baris),
      sisa_scan: Number(profil.sisa_scan),
      ...tambahan,
    });
  }

  app.get('/api/pembayaran/config', auth, (_req, res) => {
    const konf = midtrans.konfigurasi();
    res.json({
      gateway: konf ? 'midtrans' : 'simulasi',
      mode: konf ? konf.mode : 'simulasi',
      client_key: konf ? konf.clientKey : '',
    });
  });

  app.get('/api/pembayaran', auth, (req, res) => {
    const baris = db
      .prepare('SELECT * FROM pesanan WHERE user_id = ? ORDER BY id DESC LIMIT 30')
      .all(req.userId);
    res.json({ pesanan: baris.map(barisKePesanan) });
  });

  app.post('/api/pembayaran', auth, async (req, res) => {
    const body = bodyJson(req);
    const pilihan = cariPaket(String(body.paket || '').trim());
    const konf = midtrans.konfigurasi();
    const metode = konf ? 'midtrans' : String(body.metode || '').trim().toLowerCase();

    if (!pilihan) return res.status(400).json({ error: 'Paket token tidak dikenal.' });
    if (!konf && !METODE[metode]) {
      return res.status(400).json({ error: 'Metode pembayaran tidak dikenal. Pilih QRIS, transfer VA, atau e-wallet.' });
    }

    let kode = kodePesanan();
    while (db.prepare('SELECT 1 FROM pesanan WHERE kode = ?').get(kode)) kode = kodePesanan();

    const biaya = Number(biayaLayanan);
    const total = Number(pilihan.harga) + biaya;

    db.prepare(
      `INSERT INTO pesanan (kode, user_id, paket_kode, nama_paket, jumlah_scan, harga, biaya, total, metode, gateway)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      kode,
      req.userId,
      pilihan.kode,
      pilihan.nama,
      pilihan.jumlah,
      pilihan.harga,
      biaya,
      total,
      metode,
      konf ? 'midtrans' : 'simulasi'
    );

    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);

    if (!konf) {
      return res.status(201).json({
        pesanan: barisKePesanan(baris),
        pesan: 'Pesanan dibuat. Lanjutkan ke halaman pembayaran.',
      });
    }

    try {
      const pengguna = db.prepare('SELECT nama, email FROM users WHERE id = ?').get(req.userId);
      const snap = await midtrans.buatTransaksi(konf, baris, pengguna, dasarAlamat(req));
      db.prepare('UPDATE pesanan SET gateway_token = ?, redirect_url = ? WHERE kode = ?')
        .run(snap.token, snap.redirect_url, kode);

      const terbaru = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
      res.status(201).json({
        pesanan: barisKePesanan(terbaru),
        pesan: 'Pesanan dibuat. Lanjutkan pembayaran di Midtrans.',
      });
    } catch (err) {
      db.prepare('DELETE FROM pesanan WHERE kode = ?').run(kode);
      console.error('[backend] gagal membuat transaksi Midtrans:', err.message);
      res.status(502).json({ error: 'Gagal membuat transaksi ke Midtrans. Periksa koneksi lalu coba lagi.' });
    }
  });

  app.get('/api/pembayaran/:kode', auth, (req, res) => {
    const kode = String(req.params.kode || '').trim().toUpperCase();
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris || Number(baris.user_id) !== Number(req.userId)) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
    res.json({ pesanan: barisKePesanan(baris) });
  });

  app.post('/api/pembayaran/:kode/cek', auth, async (req, res) => {
    const kode = String(req.params.kode || '').trim().toUpperCase();
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris || Number(baris.user_id) !== Number(req.userId)) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
    if (baris.gateway !== 'midtrans') {
      return res.status(400).json({ error: 'Pesanan ini tidak memakai Midtrans.' });
    }
    if (baris.status === 'dibayar') {
      return kirimPesanan(res, kode, { pesan: 'Pesanan sudah dibayar.' });
    }
    if (baris.status !== 'menunggu') {
      return res.status(409).json({ error: 'Pesanan ini sudah dibatalkan atau kedaluwarsa.' });
    }

    const konf = midtrans.konfigurasi();
    if (!konf) return res.status(503).json({ error: 'Midtrans belum dikonfigurasi.' });

    let hasil;
    try {
      hasil = await midtrans.statusTransaksi(konf, kode);
    } catch (err) {
      console.error('[backend] gagal cek status Midtrans:', err.message);
      return res.status(502).json({ error: 'Gagal mengecek status pembayaran ke Midtrans. Coba lagi.' });
    }

    if (hasil.status === 'tidak_ditemukan') {
      return res.status(404).json({ error: 'Transaksi belum ditemukan di Midtrans.' });
    }

    if (hasil.status === 'settlement' || (hasil.status === 'capture' && hasil.fraud === 'accept')) {
      const { baru } = tandaiDibayar(kode);
      return kirimPesanan(res, kode, {
        pesan: baru ? 'Pembayaran diterima. Kuota bertambah.' : 'Pesanan sudah dibayar.',
      });
    }

    if (['deny', 'cancel', 'expire', 'failure'].includes(hasil.status)) {
      batalkan(kode);
      return kirimPesanan(res, kode, { pesan: 'Pembayaran dibatalkan atau kedaluwarsa.' });
    }

    return kirimPesanan(res, kode, { pesan: 'Pembayaran belum diterima. Selesaikan di halaman Midtrans.' });
  });

  app.post('/api/pembayaran/:kode/bayar', auth, (req, res) => {
    const kode = String(req.params.kode || '').trim().toUpperCase();
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris || Number(baris.user_id) !== Number(req.userId)) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }
    if (baris.gateway === 'midtrans' || midtrans.konfigurasi()) {
      return res.status(409).json({ error: 'Pembayaran simulasi tidak tersedia saat Midtrans aktif.' });
    }
    if (baris.status !== 'menunggu') {
      return res.status(409).json({ error: 'Pesanan ini sudah diproses.' });
    }

    try {
      const { baru } = tandaiDibayar(kode);
      if (!baru) return res.status(409).json({ error: 'Pesanan ini sudah diproses.' });
    } catch (err) {
      console.error('[backend] gagal memproses pembayaran:', err);
      return res.status(500).json({ error: 'Gagal memproses pembayaran. Kuota Anda tidak berubah.' });
    }

    kirimPesanan(res, kode, { pesan: `${Number(baris.jumlah_scan)} scan ditambahkan ke kuota.` });
  });

  app.post('/api/pembayaran/midtrans/notifikasi', (req, res) => {
    const konf = midtrans.konfigurasi();
    if (!konf) return res.status(503).json({ error: 'Midtrans belum dikonfigurasi.' });

    const data = bodyJson(req);
    if (!midtrans.tandaTanganValid(konf, data)) {
      return res.status(401).json({ error: 'Signature notifikasi tidak valid.' });
    }

    const kode = String(data.order_id || '').trim().toUpperCase();
    const baris = db.prepare('SELECT * FROM pesanan WHERE kode = ?').get(kode);
    if (!baris) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    if (Math.round(Number(data.gross_amount)) !== Number(baris.total)) {
      return res.status(400).json({ error: 'Nominal notifikasi tidak cocok.' });
    }

    const status = String(data.transaction_status || '');
    try {
      if (status === 'settlement' || (status === 'capture' && data.fraud_status === 'accept')) {
        tandaiDibayar(kode);
      } else if (['deny', 'cancel', 'expire', 'failure'].includes(status)) {
        batalkan(kode);
      }
    } catch (err) {
      console.error('[backend] gagal memproses notifikasi Midtrans:', err);
      return res.status(500).json({ error: 'Gagal mencatat pembayaran.' });
    }

    res.json({ ok: true });
  });
};
