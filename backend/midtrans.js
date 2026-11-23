const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DIR_DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const BERKAS = path.join(DIR_DATA, '.midtrans');

function bacaBerkas() {
  try {
    const isi = fs.readFileSync(BERKAS, 'utf8');
    const hasil = {};
    for (const baris of isi.split(/\r?\n/)) {
      const potong = baris.trim();
      if (!potong || potong.startsWith('#')) continue;
      const samaDengan = potong.indexOf('=');
      if (samaDengan < 0) continue;
      hasil[potong.slice(0, samaDengan).trim()] = potong.slice(samaDengan + 1).trim();
    }
    return hasil;
  } catch {
    return {};
  }
}

function konfigurasi() {
  if (String(process.env.PAYMENT_MODE || '').toLowerCase() === 'simulasi') return null;

  const berkas = bacaBerkas();
  const serverKey = process.env.MIDTRANS_SERVER_KEY || berkas.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) return null;

  const clientKey = process.env.MIDTRANS_CLIENT_KEY || berkas.MIDTRANS_CLIENT_KEY || '';
  const modeMentah = process.env.MIDTRANS_MODE || berkas.MIDTRANS_MODE
    || (serverKey.startsWith('SB-') ? 'sandbox' : 'production');
  const mode = String(modeMentah).toLowerCase() === 'production' ? 'production' : 'sandbox';

  return { serverKey, clientKey, mode, sandbox: mode !== 'production' };
}

function aktif() {
  return Boolean(konfigurasi());
}

function dasarSnap(konf) {
  return konf.sandbox ? 'https://app.sandbox.midtrans.com' : 'https://app.midtrans.com';
}

function dasarApi(konf) {
  return konf.sandbox ? 'https://api.sandbox.midtrans.com' : 'https://api.midtrans.com';
}

function otorisasi(konf) {
  return 'Basic ' + Buffer.from(konf.serverKey + ':').toString('base64');
}

async function buatTransaksi(konf, pesanan, pengguna, baseUrl) {
  const body = {
    transaction_details: {
      order_id: pesanan.kode,
      gross_amount: Number(pesanan.total),
    },
    item_details: [
      {
        id: pesanan.paket_kode,
        price: Number(pesanan.harga),
        quantity: 1,
        name: pesanan.nama_paket,
      },
      {
        id: 'biaya-layanan',
        price: Number(pesanan.biaya),
        quantity: 1,
        name: 'Biaya layanan',
      },
    ],
    customer_details: {
      first_name: pengguna.nama,
      email: pengguna.email,
    },
    callbacks: {
      finish: `${baseUrl}/bayar.html`,
      unfinish: `${baseUrl}/bayar.html`,
      error: `${baseUrl}/bayar.html`,
    },
    expiry: { unit: 'minutes', duration: 60 },
  };

  const res = await fetch(`${dasarSnap(konf)}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: otorisasi(konf),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token || !data.redirect_url) {
    const pesan = Array.isArray(data.error_messages)
      ? data.error_messages.join(', ')
      : data.status_message || `HTTP ${res.status}`;
    throw new Error(`Midtrans: ${pesan}`);
  }

  return { token: data.token, redirect_url: data.redirect_url };
}

async function statusTransaksi(konf, kode) {
  const res = await fetch(`${dasarApi(konf)}/v2/${encodeURIComponent(kode)}/status`, {
    headers: {
      Accept: 'application/json',
      Authorization: otorisasi(konf),
    },
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 404) return { status: 'tidak_ditemukan', data };
  if (!res.ok) throw new Error(`Midtrans: ${data.status_message || `HTTP ${res.status}`}`);

  return {
    status: String(data.transaction_status || ''),
    fraud: String(data.fraud_status || ''),
    data,
  };
}

function tandaTanganValid(konf, data) {
  const bahan = `${data.order_id || ''}${data.status_code || ''}${data.gross_amount || ''}${konf.serverKey}`;
  const harap = crypto.createHash('sha512').update(bahan).digest('hex');
  const diterima = String(data.signature_key || '');
  if (!/^[a-f0-9]{128}$/i.test(diterima)) return false;
  return crypto.timingSafeEqual(Buffer.from(harap, 'hex'), Buffer.from(diterima, 'hex'));
}

module.exports = {
  konfigurasi,
  aktif,
  buatTransaksi,
  statusTransaksi,
  tandaTanganValid,
};
