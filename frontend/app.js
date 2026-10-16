/* ============================================================
   LivestockHealth Scan - app.js
   Pustaka bersama untuk semua halaman frontend.
   ============================================================ */

/* Alamat backend. Jika halaman dibuka lewat server Express
   (http://localhost:3000) pakai origin yang sama, jika dibuka
   lewat Live Server / file:// arahkan ke localhost:3000. */
const API_BASE = location.origin === 'http://localhost:3000' ? '' : 'http://localhost:3000';

/* Ambang keyakinan rendah (RF-13). */
const AMBANG_PERINGATAN = 0.70;
/* Ukuran maksimal foto 5 MB (validasi awal di sisi klien). */
const UKURAN_MAKS = 5 * 1024 * 1024;
const TIPE_DIIZINKAN = ['image/jpeg', 'image/jpg', 'image/png'];

const SPESIES = {
  sapi: { nama: 'Sapi', emoji: '🐄', penyakit: ['Penyakit Mulut dan Kuku (PMK)', 'Lumpy Skin Disease (LSD)'] },
  kambing: { nama: 'Kambing', emoji: '🐐', penyakit: ['Scabies', 'Orf'] },
  ayam: { nama: 'Ayam', emoji: '🐔', penyakit: ['Coccidiosis'] },
};

/* ---------------------- Ikon ---------------------- */
const IKON = {
  beranda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3.2"/></svg>',
  riwayat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>',
  peta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  kamera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.4"/></svg>',
  obat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/><path d="M12 12v5M9.5 14.5h5"/></svg>',
  herbal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21V11"/><path d="M12 11c0-4 3-7 8-7 0 5-3 8-8 7Z"/><path d="M12 15c-4 0-7-2.5-7-7 4 0 7 2.5 7 7Z"/></svg>',
  dokumen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 12h6M9 16h6"/></svg>',
  token: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 10.5h6M9 13.5h6"/></svg>',
  lapor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4a1 1 0 0 1 1-1h9l-1.5 3L15 9H6"/></svg>',
  peringatan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v4.5M12 17h.01"/></svg>',
};

/* Logo merek (SVG inline supaya tidak bergantung file gambar). */
const LOGO = '<svg viewBox="0 0 40 46" width="100%" height="100%" fill="none">' +
  '<path d="M20 2C11.7 7.4 6 15 6 23.2 6 32.6 12.2 40.2 20 44c7.8-3.8 14-11.4 14-20.8C34 15 28.3 7.4 20 2Z" fill="#00673D"/>' +
  '<path d="M20 12v22M20 20.5c0-4.4 3-7.5 8.5-7.5 0 5.4-3.4 8.5-8.5 7.5ZM20 27c-4.4 0-7.5-2.7-7.5-7.5 4.3 0 7.5 3 7.5 7.5Z" stroke="#FAFBF5" stroke-width="2" stroke-linecap="round"/></svg>';

/* ---------------------- Utilitas DOM ---------------------- */
const el = (id) => document.getElementById(id);

function pasangLogo() {
  document.querySelectorAll('[data-logo]').forEach((n) => { n.innerHTML = LOGO; });
}

/* Isi elemen bertanda data-ikon="nama" dengan ikon yang sesuai. */
function pasangIkon() {
  document.querySelectorAll('[data-ikon]').forEach((n) => {
    const k = n.getAttribute('data-ikon');
    if (IKON[k]) n.innerHTML = IKON[k];
  });
}

function setPesan(id, pesan, tipe = 'error') {
  const node = el(id);
  if (!node) return;
  node.textContent = pesan || '';
  node.className = 'pesan ' + (pesan ? tipe : '');
}

function navBawah(aktif) {
  const item = (key, label, href) =>
    `<a href="${href}" class="${aktif === key ? 'aktif' : ''}">${IKON[key]}<span>${label}</span></a>`;
  return `<nav class="nav-bawah">
    ${item('beranda', 'Beranda', 'beranda.html')}
    ${item('riwayat', 'Riwayat', 'riwayat.html')}
    ${item('scan', 'Scan', 'scan.html')}
    ${item('peta', 'Peta', 'beranda.html#wabah')}
  </nav>`;
}

/* ---------------------- Token & sesi ---------------------- */
const getToken = () => localStorage.getItem('token');
const setToken = (t) => localStorage.setItem('token', t);
const hapusToken = () => localStorage.removeItem('token');

function keluar() {
  hapusToken();
  sessionStorage.removeItem('hasil_scan');
  location.replace('login.html');
}

/* ---------------------- Klien API ---------------------- */
async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let payload;
  if (formData) payload = formData;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: payload });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend di http://localhost:3000 berjalan.');
  }

  let data = {};
  try { data = await res.json(); } catch { /* biarkan kosong */ }

  if (!res.ok) throw new Error(data.error || `Permintaan gagal (${res.status}).`);
  return data;
}

/* Wajib login. Mengembalikan data pengguna atau null (sudah dialihkan). */
async function butuhLogin() {
  if (!getToken()) { location.replace('login.html'); return null; }
  try {
    return await api('/api/me');
  } catch {
    hapusToken();
    location.replace('login.html');
    return null;
  }
}

/* ---------------------- Pemformatan ---------------------- */
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return iso;
  const jam = String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${jam}`;
}

const persen = (x) => `${Math.round((x || 0) * 100)}%`;

function tingkatKeyakinan(x) {
  if (x >= 0.85) return 'tinggi';
  if (x >= AMBANG_PERINGATAN) return 'sedang';
  return 'rendah';
}

function kelasBar(x) {
  if (x >= AMBANG_PERINGATAN) return x >= 0.85 ? '' : 'sedang';
  return 'rendah';
}

const spesiesInfo = (kode) => SPESIES[kode] || { nama: kode || '-', emoji: '🐾' };

/* ---------------------- Hasil scan sementara ---------------------- */
const simpanHasil = (hasil) => sessionStorage.setItem('hasil_scan', JSON.stringify(hasil));
const ambilHasil = () => {
  try { return JSON.parse(sessionStorage.getItem('hasil_scan')); }
  catch { return null; }
};
