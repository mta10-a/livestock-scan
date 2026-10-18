import { spawn } from 'node:child_process';
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
  cek('RF-05 s.d RF-17 scan valid -> 201', r.status === 201, JSON.stringify(r.data).slice(0, 200));
  cek('RF-09/11 hasil berisi penyakit', typeof r.data.hasil?.penyakit === 'string' && r.data.hasil.penyakit.length > 0);
  cek('RF-12 confidence 0..1', r.data.hasil?.confidence > 0 && r.data.hasil.confidence <= 1, String(r.data.hasil?.confidence));
  cek('RF-10 fitur visual terisi', Array.isArray(r.data.hasil?.fitur_visual) && r.data.hasil.fitur_visual.length > 0);
  cek('RF-14 rekomendasi medis terisi', (r.data.hasil?.rekomendasi?.medis || []).length > 0);
  cek('RF-15 rekomendasi herbal terisi', (r.data.hasil?.rekomendasi?.herbal || []).length > 0);
  cek('RF-16 penurunan kuota 3 -> 2', r.data.sisa_scan === 2, String(r.data.sisa_scan));
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

  const emailB = emailUnik();
  const rb = await kirim(B1, '/api/register', { method: 'POST', body: { nama: 'Siti Ternak', email: emailB, password: 'rahasia123' } });
  r = await kirim(B1, '/api/riwayat', { token: rb.data.token });
  cek('RF-18 pengguna lain tidak melihat riwayat orang lain', r.data.riwayat?.length === 0, String(r.data.riwayat?.length));

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

  console.log(catatan.join('\n'));
  console.log(`\nRingkasan: ${lulus} lulus, ${gagal} gagal, dari ${lulus + gagal} pemeriksaan.`);
  process.exit(gagal ? 1 : 0);
}

main().catch((e) => { console.error('Galat uji:', e); process.exit(1); });
