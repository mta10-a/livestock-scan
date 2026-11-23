import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const B1 = process.env.BASE1 || 'http://127.0.0.1:3000';

const PORT_UJI = Number(process.env.PORT_UJI || 3101);
const B2 = process.env.BASE2 || `http://127.0.0.1:${PORT_UJI}`;
const DIR_INI = fileURLToPath(new URL('.', import.meta.url));

const DIR_BACKEND = path.join(DIR_INI, '..', 'backend');

let lulus = 0, gagal = 0;
const catatan = [];

function cek(nama, kondisi, detail = '') {
  if (kondisi) { lulus++; catatan.push(`  OK   ${nama}`); }
  else { gagal++; catatan.push(`  GAGAL ${nama}${detail ? ' -> ' + detail : ''}`); }
}

async function bersihkanAkun(email) {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const dirData = process.env.DATA_DIR || path.join(DIR_BACKEND, 'data');
    const db = new DatabaseSync(path.join(dirData, 'livestock.db'));
    const daftar = email.map((e) => String(e).toLowerCase());
    const ph = daftar.map(() => '?').join(',');
    const id = db.prepare(`SELECT id FROM users WHERE email IN (${ph})`).all(...daftar).map((u) => Number(u.id));
    if (!id.length) { db.close(); return; }

    const p = id.map(() => '?').join(',');
    db.exec('BEGIN');
    try {
      db.prepare(`DELETE FROM pesan_konsultasi WHERE konsultasi_id IN (SELECT id FROM konsultasi WHERE user_id IN (${p}) OR dokter_id IN (${p}))`).run(...id, ...id);
      db.prepare(`DELETE FROM konsultasi WHERE user_id IN (${p}) OR dokter_id IN (${p})`).run(...id, ...id);
      db.prepare(`DELETE FROM riwayat WHERE user_id IN (${p})`).run(...id);
      db.prepare(`DELETE FROM laporan_wabah WHERE user_id IN (${p})`).run(...id);
      db.prepare(`DELETE FROM pesanan WHERE user_id IN (${p})`).run(...id);
      db.prepare(`DELETE FROM transaksi WHERE user_id IN (${p})`).run(...id);
      db.prepare(`DELETE FROM dokter WHERE user_id IN (${p})`).run(...id);
      db.prepare(`DELETE FROM users WHERE id IN (${p})`).run(...id);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    db.close();

    const dirStr = path.join(dirData, 'berkas-str');
    if (fs.existsSync(dirStr)) {
      for (const nama of fs.readdirSync(dirStr)) {
        if (id.includes(Number(String(nama).split('-')[0]))) fs.rmSync(path.join(dirStr, nama));
      }
    }
  } catch {}
}

async function tungguBackend(base, percobaan = 40) {
  for (let i = 0; i < percobaan; i++) {
    try {
      const r = await fetch(`${base}/api/me`);
      if (r.status === 401) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function angkatBackendUji() {
  const anak = spawn(process.execPath, ['server.js'], {
    cwd: DIR_BACKEND,
    env: {
      ...process.env,
      PORT: String(PORT_UJI),
      FLASK_URL: 'http://127.0.0.1:5999',
      DATA_DIR: path.join(os.tmpdir(), 'livestockhealth-uji'),
    },
    stdio: 'ignore',
  });
  return anak;
}

const JPG_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDT8P6cJW8ON/YWjzmXRXcGV8ed/wAe/wC8f92cPz0+b7zc+rfDmm7/APhGv+Kf0WXzNEd/nk/1v/Ht87/uj83Pv95ufV/h7T/N/wCEd/4kekTebozyfvXx53/Hv+8f92cP83+199ufVPD+nCVvDjf2Fo85l0V3BlfHnf8AHv8AvH/dnD89Pm+83Pr5J643w5pu/wD4Rr/in9Fl8zRHf55P9b/x7fO/7o/Nz7/ebn1PDmm7/wDhGv8Ain9Fl8zRHf55P9b/AMe3zv8Auj83Pv8Aebn1PDmm7/8AhGv+Kf0WXzNEd/nk/wBb/wAe3zv+6Pzc+/3m59Tw5pu//hGv+Kf0WXzNEd/nk/1v/Ht87/uj83Pv95ufUAf4e0/zf+Ed/wCJHpE3m6M8n718ed/x7/vH/dnD/N/tffbn1PD2n+b/AMI7/wASPSJvN0Z5P3r487/j3/eP+7OH+b/a++3PqeHtP83/AIR3/iR6RN5ujPJ+9fHnf8e/7x/3Zw/zf7X3259Tw9p/m/8ACO/8SPSJvN0Z5P3r487/AI9/3j/uzh/m/wBr77c+oAnh/ThK3hxv7C0ecy6K7gyvjzv+Pf8AeP8Auzh+enzfebn1b4c03f8A8I1/xT+iy+Zojv8APJ/rf+Pb53/dH5uff7zc+r/D2n+b/wAI7/xI9Im83Rnk/evjzv8Aj3/eP+7OH+b/AGvvtz6p4f04St4cb+wtHnMuiu4Mr487/j3/AHj/ALs4fnp833m59QD/2Q==';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAPklEQVR4nGNcsKWHgRqAiSqmMAxGg1iQORt27SJJc4CbG/VdxDRqEEEwahBhMGrQkC+PApDKl6HvNSZqGQQAQ58F8FBIsbUAAAAASUVORK5CYII=';

const dariBase64 = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));

const fotoJpeg = (nama = 'foto.jpg') => new File([dariBase64(JPG_B64)], nama, { type: 'image/jpeg' });
const fotoPng = (nama = 'foto.png') => new File([dariBase64(PNG_B64)], nama, { type: 'image/png' });
const fotoTxt = () => new File([new Uint8Array(16)], 'catatan.txt', { type: 'text/plain' });
const fotoPalsu = () => new File([new Uint8Array(2048).fill(7)], 'palsu.jpg', { type: 'image/jpeg' });
const fotoBesar = () => new File([new Uint8Array(6 * 1024 * 1024)], 'besar.jpg', { type: 'image/jpeg' });

async function kirim(base, path, { method = 'GET', token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(base + path, { method, headers, body: payload });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const emailUnik = () => `peternak${Date.now()}${Math.floor(Math.random() * 999)}@mail.com`;

async function main() {
  console.log('== Uji API LivestockHealth Scan ==\n');

  if (!await tungguBackend(B1)) { console.error('Backend tidak merespons di ' + B1); process.exit(1); }

  const emailA = emailUnik();
  let r = await kirim(B1, '/api/register', { method: 'POST', body: { nama: 'Budi Peternak', email: emailA, password: 'rahasia123' } });
  cek('RF-01 registrasi valid -> 201 + token', r.status === 201 && !!r.data.token, JSON.stringify(r.data));
  cek('RF-01 password tidak dikembalikan', !JSON.stringify(r.data).includes('rahasia123') && !('password_hash' in (r.data.user || {})));
  cek('RF-01 kuota awal 3', r.data.user?.sisa_scan === 3, String(r.data.user?.sisa_scan));
  const tokenA = r.data.token;

  r = await kirim(B1, '/api/register', { method: 'POST', body: { nama: 'Budi Peternak', email: emailA, password: 'rahasia123' } });
  cek('RF-01 email duplikat -> 409', r.status === 409, String(r.status));

  r = await kirim(B1, '/api/register', { method: 'POST', body: { nama: 'Bud', email: 'salah', password: '123' } });
  cek('RF-01 data tidak lengkap -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/login', { method: 'POST', body: { email: emailA, password: 'salahbanget' } });
  cek('RF-02 login password salah -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, '/api/login', { method: 'POST', body: { email: emailA, password: 'rahasia123' } });
  cek('RF-02 login benar -> 200 + token', r.status === 200 && !!r.data.token, String(r.status));

  r = await kirim(B1, '/api/me', {});
  cek('RF-07 akses tanpa token -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, '/api/me', { token: 'token.palsu.abc' });
  cek('RF-07 token palsu -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, '/api/me', { token: tokenA });
  cek('RF-26 /api/me -> nama + sisa scan', r.status === 200 && r.data.nama === 'Budi Peternak' && r.data.sisa_scan === 3, JSON.stringify(r.data));

  let form = new FormData();
  form.append('spesies', 'sapi');
  form.append('gambar', fotoTxt());
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-06 file .txt ditolak -> 400', r.status === 400, String(r.status));

  form = new FormData();
  form.append('spesies', 'sapi');
  form.append('gambar', fotoBesar());
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-07 file >5MB ditolak -> 400', r.status === 400, String(r.status));

  form = new FormData();
  form.append('spesies', 'sapi');
  form.append('gambar', fotoPalsu());
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-08 berkas .jpg yang bukan gambar ditolak -> 400', r.status === 400, String(r.status));

  form = new FormData();
  form.append('spesies', 'kucing');
  form.append('gambar', fotoJpeg());
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-07 spesies tidak dikenal -> 400', r.status === 400, String(r.status));

  form = new FormData();
  form.append('spesies', 'sapi');
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-06 scan tanpa foto -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/me', { token: tokenA });
  cek('Validasi gagal TIDAK memotong kuota (tetap 3)', r.data.sisa_scan === 3, String(r.data.sisa_scan));

  form = new FormData();
  form.append('spesies', 'sapi');
  form.append('gambar', fotoJpeg());
  form.append('gejala', 'luka di mulut');
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-05 s.d RF-16 scan valid -> 201', r.status === 201, JSON.stringify(r.data).slice(0, 200));
  cek('RF-09/11 hasil berisi penyakit', typeof r.data.hasil?.penyakit === 'string' && r.data.hasil.penyakit.length > 0);
  cek('RF-12 confidence 0..1', r.data.hasil?.confidence > 0 && r.data.hasil.confidence <= 1, String(r.data.hasil?.confidence));
  cek('RF-10 fitur visual terisi', Array.isArray(r.data.hasil?.fitur_visual) && r.data.hasil.fitur_visual.length > 0);
  cek('RF-14 rekomendasi medis terisi', (r.data.hasil?.rekomendasi?.medis || []).length > 0);
  cek('RF-15 rekomendasi herbal terisi', (r.data.hasil?.rekomendasi?.herbal || []).length > 0);
  cek('RF-16 penurunan kuota 3 -> 2', r.data.sisa_scan === 2, String(r.data.sisa_scan));

  const pendapat = r.data.hasil?.pendapat_kedua;
  cek('Pendapat kedua: bentuk data dikenali', pendapat === null || (typeof pendapat === 'object' && typeof pendapat.penjelasan === 'string'), JSON.stringify(pendapat).slice(0, 120));
  cek('RF-08 pra-pemrosesan -> ukuran model 224x224', r.data.hasil?.kualitas_foto?.ukuran_model?.[0] === 224, JSON.stringify(r.data.hasil?.kualitas_foto));
  cek('RF-10 kecerahan & kontras dihitung dari foto', typeof r.data.hasil?.kualitas_foto?.kecerahan === 'number' && typeof r.data.hasil?.kualitas_foto?.kontras === 'number');
  cek(
    'RF-09/RF-11 model NYATA dipakai (bukan dummy)',
    typeof r.data.hasil?.model === 'string' && r.data.hasil.model.includes('efficientnet'),
    String(r.data.hasil?.model)
  );
  cek(
    'RF-11 penyakit termasuk kelas yang dikenal model',
    ['Sehat', 'Lumpy Skin Disease (LSD)', 'Penyakit Mulut dan Kuku (PMK)'].includes(r.data.hasil?.penyakit),
    String(r.data.hasil?.penyakit)
  );
  const idHasil = r.data.hasil?.id;
  const kodeSertifikat = r.data.hasil?.kode_sertifikat;
  const penyakitHasil = r.data.hasil?.penyakit;

  r = await kirim(B1, '/api/riwayat', { token: tokenA });
  cek('RF-18 riwayat berisi 1 data', r.status === 200 && r.data.riwayat?.length === 1, JSON.stringify(r.data).slice(0, 120));

  r = await kirim(B1, `/api/riwayat/${idHasil}`, { token: tokenA });
  cek('RF-18 detail riwayat -> 200', r.status === 200 && r.data.hasil?.id === idHasil, String(r.status));

  for (const sp of ['kambing', 'ayam']) {
    form = new FormData();
    form.append('spesies', sp);
    form.append('gambar', fotoPng(`${sp}.png`));
    r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
    cek(`RF-05 scan ${sp} berhasil`, r.status === 201, String(r.status));
  }
  r = await kirim(B1, '/api/me', { token: tokenA });
  cek('Kuota habis setelah 3x scan', r.data.sisa_scan === 0, String(r.data.sisa_scan));

  form = new FormData();
  form.append('spesies', 'sapi');
  form.append('gambar', fotoJpeg());
  r = await kirim(B1, '/api/scan', { method: 'POST', token: tokenA, form });
  cek('RF-26 scan ke-4 ditolak -> 403', r.status === 403, String(r.status));

  r = await kirim(B1, '/api/riwayat', { token: tokenA });
  cek('RF-16 riwayat bertambah jadi 3', r.data.riwayat?.length === 3, String(r.data.riwayat?.length));

  r = await kirim(B1, '/api/profil', { token: tokenA });
  cek('RF-03 profil awal -> 200', r.status === 200 && r.data.email === emailA, String(r.status));

  r = await kirim(B1, '/api/profil', {
    method: 'PUT',
    token: tokenA,
    body: {
      nama_peternakan: 'Kandang Sumber Rejeki',
      alamat: 'Kec. Cibiru',
      jenis_ternak: 'sapi',
      jumlah_ternak: 12,
    },
  });
  cek(
    'RF-03 simpan profil -> 200',
    r.status === 200 && r.data.profil?.nama_peternakan === 'Kandang Sumber Rejeki',
    JSON.stringify(r.data).slice(0, 160)
  );
  cek('RF-03 jumlah ternak tersimpan', r.data.profil?.jumlah_ternak === 12, String(r.data.profil?.jumlah_ternak));

  r = await kirim(B1, '/api/profil', { method: 'PUT', token: tokenA, body: { jenis_ternak: 'kucing' } });
  cek('RF-03 jenis ternak tidak valid -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/profil', { method: 'PUT', token: tokenA, body: { jumlah_ternak: -2 } });
  cek('RF-03 jumlah ternak negatif -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/profil', { method: 'PUT', body: { nama_peternakan: 'Tanpa Token' } });
  cek('RF-03 simpan profil tanpa token -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, '/api/laporan', {
    method: 'POST',
    token: tokenA,
    body: {
      spesies: 'sapi',
      penyakit: 'Lumpy Skin Disease (LSD)',
      jumlah_sakit: 3,
      kecamatan: 'Kec. Cibiru',
      catatan: 'Belum divaksin',
    },
  });
  cek('RF-24 kirim laporan wabah -> 201', r.status === 201 && r.data.laporan?.jumlah_sakit === 3, JSON.stringify(r.data).slice(0, 160));
  cek('RF-24 laporan ditandai milik sendiri', r.data.laporan?.milik_sendiri === true);

  r = await kirim(B1, '/api/laporan', {
    method: 'POST',
    token: tokenA,
    body: { spesies: 'sapi', penyakit: 'LSD', jumlah_sakit: 0, kecamatan: 'Kec. Cibiru' },
  });
  cek('RF-24 jumlah ternak sakit 0 -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/laporan', {
    method: 'POST',
    token: tokenA,
    body: { spesies: 'kucing', penyakit: 'LSD', jumlah_sakit: 1, kecamatan: 'Kec. Cibiru' },
  });
  cek('RF-24 spesies tidak valid -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/laporan', { token: tokenA });
  cek('RF-24 laporan saya berisi 1', r.status === 200 && r.data.laporan?.length === 1, JSON.stringify(r.data).slice(0, 120));

  r = await kirim(B1, '/api/laporan/terbaru', { token: tokenA });
  cek(
    'RF-24 laporan terbaru memuat laporan baru',
    Array.isArray(r.data.laporan) && r.data.laporan.some((l) => l.kecamatan === 'Kec. Cibiru'),
    String(r.data.laporan?.length)
  );

  r = await kirim(B1, '/api/laporan', {});
  cek('RF-24 laporan tanpa token -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, '/api/token/paket', { token: tokenA });
  cek('RF-27 daftar paket token -> 200', r.status === 200 && r.data.paket?.length >= 3, String(r.status));
  cek('RF-28 daftar paket memuat biaya layanan', r.data.biaya_layanan === 2500, String(r.data.biaya_layanan));

  r = await kirim(B1, '/api/pembayaran/config', { token: tokenA });
  const modeGateway = r.status === 200 ? r.data.gateway : 'simulasi';
  cek(
    'RF-28 status gateway pembayaran terbaca',
    r.status === 200 && ['simulasi', 'midtrans'].includes(modeGateway),
    JSON.stringify(r.data)
  );

  r = await kirim(B1, '/api/token/tukar', { method: 'POST', token: tokenA, body: { kode: 'KODE-PALSU' } });
  cek('RF-27 kode token tidak dikenal -> 404', r.status === 404, String(r.status));

  r = await kirim(B1, '/api/token/tukar', { method: 'POST', token: tokenA, body: { kode: 'LHS-DEMO-3' } });
  cek('RF-27 tukar kode token -> 201 + kuota bertambah', r.status === 201 && r.data.tambah === 3 && r.data.sisa_scan === 3, JSON.stringify(r.data));

  r = await kirim(B1, '/api/token/tukar', { method: 'POST', token: tokenA, body: { kode: 'LHS-DEMO-3' } });
  cek('RF-27 kode yang sama tidak bisa dipakai dua kali -> 409', r.status === 409, String(r.status));

  r = await kirim(B1, '/api/token/transaksi', { token: tokenA });
  cek('RF-29 riwayat transaksi tercatat', r.status === 200 && r.data.transaksi?.length === 1, JSON.stringify(r.data).slice(0, 120));

  r = await kirim(B1, '/api/pembayaran', { method: 'POST', token: tokenA, body: { paket: 'tidak-ada', metode: 'qris' } });
  cek('RF-28 paket pembayaran tidak dikenal -> 400', r.status === 400, String(r.status));

  let pesanan = null;

  if (modeGateway === 'simulasi') {
    r = await kirim(B1, '/api/pembayaran', { method: 'POST', token: tokenA, body: { paket: 'hemat-3', metode: 'tunai' } });
    cek('RF-28 metode pembayaran tidak dikenal -> 400', r.status === 400, String(r.status));

    r = await kirim(B1, '/api/pembayaran', { method: 'POST', token: tokenA, body: { paket: 'hemat-3', metode: 'qris' } });
    pesanan = r.data.pesanan;
    cek(
      'RF-28 pesanan dibuat dengan biaya layanan',
      r.status === 201 && pesanan?.total === 17500 && pesanan?.biaya_layanan === 2500,
      JSON.stringify(r.data).slice(0, 160)
    );
    cek('RF-28 pesanan memakai gateway simulasi', pesanan?.gateway === 'simulasi', String(pesanan?.gateway));
    cek('RF-28 pesanan memuat metode pembayaran', pesanan?.metode_label === 'QRIS', String(pesanan?.metode_label));

    r = await kirim(B1, `/api/pembayaran/${pesanan?.kode}`, {});
    cek('RF-28 pesanan tanpa login -> 401', r.status === 401, String(r.status));

    r = await kirim(B1, '/api/me', { token: tokenA });
    const kuotaSebelumBayar = r.data.sisa_scan;

    r = await kirim(B1, `/api/pembayaran/${pesanan?.kode}/bayar`, { method: 'POST', token: tokenA });
    cek(
      'RF-30 pembayaran menambah kuota otomatis',
      r.status === 200 && r.data.pesanan?.status === 'dibayar' && r.data.sisa_scan === kuotaSebelumBayar + 3,
      JSON.stringify(r.data).slice(0, 160)
    );

    r = await kirim(B1, `/api/pembayaran/${pesanan?.kode}/bayar`, { method: 'POST', token: tokenA });
    cek('RF-30 pembayaran ganda ditolak -> 409', r.status === 409, String(r.status));

    r = await kirim(B1, '/api/token/transaksi', { token: tokenA });
    cek(
      'RF-30 transaksi pembelian tercatat',
      r.status === 200 && r.data.transaksi?.some((t) => t.kode === pesanan?.kode),
      JSON.stringify(r.data).slice(0, 160)
    );
  } else {
    catatan.push('  LEWAT uji pembayaran simulasi (gateway Midtrans aktif)');
  }

  r = await kirim(B1, '/api/token/tukar', { method: 'POST', body: { kode: 'LHS-DEMO-3' } });
  cek('RF-27 tukar token tanpa login -> 401', r.status === 401, String(r.status));

  const emailB = emailUnik();
  const rb = await kirim(B1, '/api/register', { method: 'POST', body: { nama: 'Siti Ternak', email: emailB, password: 'rahasia123' } });
  const tokenB = rb.data.token;
  r = await kirim(B1, `/api/pembayaran/${pesanan?.kode || 'INV-PALSU'}`, { token: tokenB });
  cek('RF-28 pesanan bukan milik pengguna -> 404', r.status === 404, String(r.status));
  r = await kirim(B1, '/api/riwayat', { token: tokenB });
  cek('RF-18 pengguna lain tidak melihat riwayat orang lain', r.data.riwayat?.length === 0, String(r.data.riwayat?.length));

  cek('RF-21 hasil scan punya kode sertifikat', typeof kodeSertifikat === 'string' && /^LHS-[A-Z0-9]+$/.test(kodeSertifikat), String(kodeSertifikat));

  r = await kirim(B1, `/api/sertifikat/${kodeSertifikat}`, {});
  cek(
    'RF-21 sertifikat bisa dibuka publik -> 200',
    r.status === 200 && r.data.sertifikat?.kode === kodeSertifikat && r.data.sertifikat?.penyakit === penyakitHasil,
    JSON.stringify(r.data).slice(0, 160)
  );
  cek('RF-23 sertifikat memuat catatan indikasi awal', typeof r.data.sertifikat?.catatan === 'string' && r.data.sertifikat.catatan.length > 10);

  r = await kirim(B1, '/api/sertifikat/LHS-PALSU123', {});
  cek('RF-23 kode sertifikat palsu -> 404', r.status === 404, String(r.status));

  r = await kirim(B1, '/api/sertifikat/LHS-XX', {});
  cek('RF-23 format kode tidak valid -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/sertifikat/saya', { token: tokenA });
  cek(
    'RF-21 daftar sertifikat saya berisi hasil scan',
    r.status === 200 && r.data.sertifikat?.some((s) => s.kode === kodeSertifikat),
    JSON.stringify(r.data).slice(0, 120)
  );

  r = await kirim(B1, '/api/laporan', {
    method: 'POST',
    token: tokenA,
    body: {
      spesies: 'sapi',
      penyakit: 'Penyakit Mulut dan Kuku (PMK)',
      jumlah_sakit: 2,
      kecamatan: 'Kec. Cibiru',
      lat: -6.9251,
      lng: 107.7188,
    },
  });
  cek('RF-19 laporan dengan titik lokasi -> 201', r.status === 201 && r.data.laporan?.lat === -6.9251, JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, '/api/peta/sebaran', { token: tokenA });
  cek('RF-19 peta memuat titik lokasi', r.status === 200 && r.data.titik?.some((t) => Math.abs(t.lat + 6.9251) < 0.001), JSON.stringify(r.data.titik || []).slice(0, 160));
  cek('RF-19 wilayah teragregasi per kecamatan', r.data.wilayah?.some((w) => w.kecamatan === 'Kec. Cibiru'), JSON.stringify(r.data.wilayah || []).slice(0, 160));

  r = await kirim(B1, '/api/peta/sebaran', {});
  cek('RF-19 peta tanpa login -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, '/api/laporan', {
    method: 'POST',
    token: tokenA,
    body: { spesies: 'sapi', penyakit: 'PMK', jumlah_sakit: 1, kecamatan: 'Kec. Cibiru', lat: 200, lng: 107 },
  });
  cek('RF-19 lintang tidak valid -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/wabah/sekitar', { token: tokenA });
  cek(
    'RF-25 peringatan wabah di sekitar alamat',
    r.status === 200 && r.data.dasar === 'alamat' && r.data.jumlah >= 1,
    JSON.stringify(r.data).slice(0, 160)
  );
  cek('RF-25 wilayah peringatan terbaca dari profil', /cibiru/i.test(r.data.kata_kunci || ''), String(r.data.kata_kunci));

  let fdDokter = new FormData();
  fdDokter.append('nomor_str', 'STR-UJI-2026');
  fdDokter.append('wilayah', 'Kota Bandung');
  fdDokter.append('berkas', fotoJpeg('str.jpg'));
  r = await kirim(B1, '/api/dokter/daftar', { method: 'POST', token: tokenB, form: fdDokter });
  cek('RF-04 pengajuan dokter -> 201 menunggu', r.status === 201 && r.data.dokter?.status === 'menunggu', JSON.stringify(r.data).slice(0, 160));

  fdDokter = new FormData();
  fdDokter.append('nomor_str', 'STR-UJI-2026');
  fdDokter.append('wilayah', 'Kota Bandung');
  fdDokter.append('berkas', fotoJpeg('str.jpg'));
  r = await kirim(B1, '/api/dokter/daftar', { method: 'POST', token: tokenB, form: fdDokter });
  cek('RF-04 pengajuan ganda ditolak -> 409', r.status === 409, String(r.status));

  fdDokter = new FormData();
  fdDokter.append('nomor_str', 'STR-UJI-2026');
  fdDokter.append('wilayah', 'Kota Bandung');
  fdDokter.append('berkas', fotoTxt());
  r = await kirim(B1, '/api/dokter/daftar', { method: 'POST', token: tokenA, form: fdDokter });
  cek('RF-04 berkas STR bukan gambar/PDF -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/login', { method: 'POST', body: { email: 'admin@livestockhealth.id', password: 'admin123' } });
  cek('RF-38 login akun admin demo -> 200', r.status === 200 && !!r.data.token, String(r.status));
  const tokenAdmin = r.data.token;

  r = await kirim(B1, '/api/admin/ringkasan', { token: tokenAdmin });
  cek('RF-38 ringkasan admin berisi data nyata', r.status === 200 && r.data.pengguna?.total >= 3 && r.data.scan?.total >= 3, JSON.stringify(r.data).slice(0, 160));
  cek(
    'RF-30 ringkasan admin memuat pendapatan',
    modeGateway === 'simulasi' ? Number(r.data.pendapatan) >= 17500 : Number(r.data.pendapatan) >= 0,
    String(r.data.pendapatan)
  );
  cek('RF-38 ringkasan memuat pemeriksaan terbaru', Array.isArray(r.data.terbaru) && r.data.terbaru.length >= 3, JSON.stringify(r.data.terbaru || []).slice(0, 160));

  r = await kirim(B1, '/api/admin/ringkasan', { token: tokenA });
  cek('RF-38 ringkasan bukan untuk peternak -> 403', r.status === 403, String(r.status));

  r = await kirim(B1, '/api/admin/dokter?status=menunggu', { token: tokenAdmin });
  const calonDokter = (r.data.dokter || []).find((d) => d.email === emailB);
  cek('RF-39 admin melihat pengajuan dokter', Boolean(calonDokter) && calonDokter.ada_berkas === true, JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, `/api/admin/dokter/${calonDokter?.user_id}/berkas`, { token: tokenAdmin });
  cek('RF-39 admin bisa membuka berkas STR', r.status === 200, String(r.status));

  r = await kirim(B1, `/api/admin/dokter/${calonDokter?.user_id}/verifikasi`, {
    method: 'POST',
    token: tokenAdmin,
    body: { keputusan: 'terima', catatan: 'Berkas lengkap' },
  });
  cek('RF-39 verifikasi dokter -> terverifikasi', r.status === 200 && r.data.dokter?.status === 'terverifikasi', JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, '/api/me', { token: tokenB });
  cek('RF-04 peran berubah menjadi dokter setelah verifikasi', r.data.peran === 'dokter', String(r.data.peran));
  const idB = r.data.id;

  r = await kirim(B1, '/api/dokter/jadwal', { method: 'PUT', token: tokenB, body: { hari: 'Senin-Jumat', jam: '08.00-16.00' } });
  cek(
    'RF-35 dokter mengatur jadwal praktik',
    r.status === 200 && r.data.dokter?.jadwal_hari === 'Senin-Jumat' && r.data.dokter?.jadwal_jam === '08.00-16.00',
    JSON.stringify(r.data).slice(0, 160)
  );

  r = await kirim(B1, '/api/me', { token: tokenB });
  cek('RF-35 jadwal tersimpan di profil dokter', r.data.dokter?.jadwal === 'Senin-Jumat, 08.00-16.00', JSON.stringify(r.data.dokter).slice(0, 160));

  r = await kirim(B1, '/api/dokter/jadwal', { method: 'PUT', token: tokenB, body: { hari: 'Senin', jam: '' } });
  cek('RF-35 jadwal tidak lengkap -> 400', r.status === 400, String(r.status));

  r = await kirim(B1, '/api/dokter/jadwal', { method: 'PUT', token: tokenA, body: { hari: 'Senin-Jumat', jam: '08.00-16.00' } });
  cek('RF-35 jadwal hanya untuk dokter -> 403', r.status === 403, String(r.status));

  r = await kirim(B1, '/api/dokter/tersedia', { token: tokenA });
  cek(
    'RF-35 dokter dan jadwal tampil untuk peternak',
    r.status === 200 && r.data.dokter?.some((d) => d.id === idB && d.jadwal.includes('08.00-16.00')),
    JSON.stringify(r.data).slice(0, 160)
  );

  r = await kirim(B1, '/api/admin/pengguna?q=Siti', { token: tokenAdmin });
  cek('RF-39 pencarian pengguna di admin', r.status === 200 && r.data.pengguna?.some((u) => u.email === emailB), JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, '/api/konsultasi', { method: 'POST', token: tokenA, body: { topik: 'Sapi demam sejak dua hari' } });
  cek('RF-31 ajukan konsultasi -> 201 menunggu', r.status === 201 && r.data.konsultasi?.status === 'menunggu', JSON.stringify(r.data).slice(0, 160));
  const idKonsul = r.data.konsultasi?.id;

  r = await kirim(B1, '/api/konsultasi', { token: tokenB });
  cek('RF-32 dokter melihat antrean konsultasi', r.status === 200 && r.data.konsultasi?.some((k) => k.id === idKonsul), JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}/ambil`, { method: 'POST', token: tokenB });
  cek('RF-32 dokter mengambil konsultasi -> aktif', r.status === 200 && r.data.konsultasi?.status === 'aktif', JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}/pesan`, { method: 'POST', token: tokenB, body: { isi: 'Pisahkan sapi dari kandang lain.' } });
  cek('RF-33 dokter mengirim balasan -> 201', r.status === 201, String(r.status));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}`, { token: tokenA });
  cek('RF-33 peternak membaca balasan dokter', r.status === 200 && r.data.konsultasi?.pesan?.length === 1, JSON.stringify(r.data).slice(0, 160));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}`, {});
  cek('RF-33 percakapan tanpa login -> 401', r.status === 401, String(r.status));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}/pesan`, { method: 'POST', token: tokenA, body: { isi: 'Baik, terima kasih dok.' } });
  cek('RF-33 peternak membalas -> 201', r.status === 201, String(r.status));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}/selesai`, { method: 'POST', token: tokenB });
  cek('RF-34 dokter menutup konsultasi -> 200', r.status === 200, String(r.status));

  r = await kirim(B1, `/api/konsultasi/${idKonsul}/pesan`, { method: 'POST', token: tokenA, body: { isi: 'Masih mau tanya' } });
  cek('RF-34 pesan setelah ditutup -> 409', r.status === 409, String(r.status));

  r = await kirim(B1, '/api/dokter/riwayat', { token: tokenB });
  cek(
    'RF-36 riwayat jawaban dokter memuat konsultasi selesai',
    r.status === 200 && r.data.riwayat?.some((k) => k.id === idKonsul),
    JSON.stringify(r.data).slice(0, 160)
  );

  r = await kirim(B1, '/api/dokter/aktivitas', { token: tokenB });
  cek(
    'RF-37 rekap aktivitas dokter terisi',
    r.status === 200 && r.data.aktivitas?.selesai >= 1 && r.data.aktivitas?.pesan >= 1,
    JSON.stringify(r.data).slice(0, 160)
  );

  r = await kirim(B1, '/api/dokter/aktivitas', { token: tokenA });
  cek('RF-37 aktivitas hanya untuk dokter -> 403', r.status === 403, String(r.status));

  r = await kirim(B1, '/api/admin/dokter?status=terverifikasi', { token: tokenAdmin });
  cek(
    'RF-37 admin melihat rekap dokter terverifikasi',
    r.status === 200 && r.data.dokter?.some((d) => d.user_id === idB && d.selesai >= 1),
    JSON.stringify(r.data).slice(0, 160)
  );

  for (const berkas of ['peta.html', 'konsultasi.html', 'sertifikat.html', 'admin.html', 'token.html', 'bayar.html']) {
    const h = await fetch(`${B1}/${berkas}`);
    cek(`Halaman ${berkas} tersaji`, h.status === 200, String(h.status));
  }

  const anakUji = angkatBackendUji();
  try {
    if (await tungguBackend(B2)) {
      const emailC = emailUnik();
      const rc = await kirim(B2, '/api/register', { method: 'POST', body: { nama: 'Andi Uji', email: emailC, password: 'rahasia123' } });
      form = new FormData();
      form.append('spesies', 'sapi');
      form.append('gambar', fotoJpeg());
      r = await kirim(B2, '/api/scan', { method: 'POST', token: rc.data.token, form });
      cek('Flask mati -> 502', r.status === 502, String(r.status));
      const me = await kirim(B2, '/api/me', { token: rc.data.token });
      cek('Flask mati -> kuota tetap 3', me.data.sisa_scan === 3, String(me.data.sisa_scan));
    } else {
      catatan.push(`  LEWAT uji Flask-mati (backend uji di ${B2} gagal diangkat)`);
    }
  } finally {
    anakUji.kill();
  }

  const html = await fetch(B1 + '/login.html');
  cek('Frontend login.html tersaji dari backend', html.status === 200, String(html.status));

  await bersihkanAkun([emailA, emailB]);

  console.log(catatan.join('\n'));
  console.log(`\nRingkasan: ${lulus} lulus, ${gagal} gagal, dari ${lulus + gagal} pemeriksaan.`);
  process.exit(gagal ? 1 : 0);
}

main().catch((e) => { console.error('Galat uji:', e); process.exit(1); });