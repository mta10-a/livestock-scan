const API_BASE = location.protocol.startsWith('http') ? '' : 'http://localhost:3000';

const AMBANG_PERINGATAN = 0.70;
const AMBANG_TINGGI = 0.85;

const UKURAN_MAKS = 5 * 1024 * 1024;
const TIPE_DIIZINKAN = ['image/jpeg', 'image/jpg', 'image/png'];

const SPESIES = {
  sapi: { nama: 'Sapi', penyakit: ['Lumpy Skin Disease (LSD)', 'Penyakit Mulut dan Kuku (PMK)', 'Sehat'] },
  kambing: { nama: 'Kambing', penyakit: ['Gangguan Kulit (Scabies/Orf)', 'Sehat'] },
  ayam: { nama: 'Ayam', penyakit: ['Coccidiosis', 'Salmonellosis', 'Sehat', 'Tetelo (Newcastle Disease)'] },
};

const IKON = (() => {
  const gaya = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  const bungkus = (isi) => `<svg viewBox="0 0 24 24" ${gaya}>${isi}</svg>`;
  return {
    beranda: bungkus('<path d="M3.5 10.4 12 3.6l8.5 6.8"/><path d="M5.6 9.4V19a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4V9.4"/><path d="M10 20.4v-5.2h4v5.2"/>'),
    scan: bungkus('<path d="M4 8.6V6.2A2.2 2.2 0 0 1 6.2 4h2.4M15.4 4h2.4A2.2 2.2 0 0 1 20 6.2v2.4M20 15.4v2.4a2.2 2.2 0 0 1-2.2 2.2h-2.4M8.6 20H6.2A2.2 2.2 0 0 1 4 17.8v-2.4"/><circle cx="12" cy="12" r="3"/>'),
    riwayat: bungkus('<path d="M3.6 12a8.4 8.4 0 1 0 2.6-6.1"/><path d="M3.4 4.6v4.2h4.2"/><path d="M12 8.2V12l2.6 1.8"/>'),
    peta: bungkus('<path d="M12 20.6s6.4-5.6 6.4-10a6.4 6.4 0 1 0-12.8 0c0 4.4 6.4 10 6.4 10Z"/><circle cx="12" cy="10.4" r="2.3"/>'),
    kamera: bungkus('<path d="M4 8.6h2.4l1.5-2.2h8.2l1.5 2.2H20a1.4 1.4 0 0 1 1.4 1.4v8.6A1.4 1.4 0 0 1 20 20H4a1.4 1.4 0 0 1-1.4-1.4V10A1.4 1.4 0 0 1 4 8.6Z"/><circle cx="12" cy="14" r="3.2"/>'),
    obat: bungkus('<rect x="3" y="8.4" width="18" height="7.2" rx="3.6"/><path d="M12 8.4v7.2"/><path d="M6.6 12h1.8M15.6 12h1.8"/>'),
    herbal: bungkus('<path d="M12 20.4v-8.6"/><path d="M12 11.8c0-3.9 2.9-6.8 7.4-6.8 0 4.8-3 7.9-7.4 6.8Z"/><path d="M12 15.6c-3.9 0-6.6-2.4-6.6-6.9 3.8 0 6.6 2.4 6.6 6.9Z"/>'),
    dokumen: bungkus('<path d="M7.4 3.6h6l4.2 4.2v12a1.4 1.4 0 0 1-1.4 1.4H7.4A1.4 1.4 0 0 1 6 19.8V5a1.4 1.4 0 0 1 1.4-1.4Z"/><path d="M13.4 3.6V7.8h4.2"/><path d="M9 13h6M9 16.4h4"/>'),
    token: bungkus('<circle cx="12" cy="12" r="8"/><path d="M12 7.8v8.4M9.4 10.4h5.2M9.4 13.6h5.2"/>'),
    lapor: bungkus('<path d="M6 20.4V4.4"/><path d="M6 5.2h9.6l-1.4 3 1.4 3H6"/>'),
    peringatan: bungkus('<path d="M12 4.4 3.2 19.6h17.6L12 4.4Z"/><path d="M12 10v4.2M12 16.9h.01"/>'),
    cek: bungkus('<circle cx="12" cy="12" r="8.4"/><path d="m8.3 12.3 2.5 2.5 4.9-5.2"/>'),
    chevron: bungkus('<path d="m9.5 6.5 5.5 5.5-5.5 5.5"/>'),
    kosong: bungkus('<path d="M4 12.6 6.6 5.4A1.4 1.4 0 0 1 8 4.5h8a1.4 1.4 0 0 1 1.4.9L20 12.6v5.6a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 18.2Z"/><path d="M4 12.6h4.4l1 2.2h5.2l1-2.2H20"/>'),
  };
})();

const LOGO_SRC = 'img/logo.png';
const FAVICON_SRC = 'img/favicon.png';

const el = (id) => document.getElementById(id);

function pasangLogo() {
  document.querySelectorAll('[data-logo]').forEach((n) => {
    n.innerHTML = `<img src="${LOGO_SRC}" alt="Logo LivestockHealth Scan" />`;
  });

  let ikon = document.querySelector('link[rel="icon"]');
  if (!ikon) {
    ikon = document.createElement('link');
    ikon.rel = 'icon';
    document.head.appendChild(ikon);
  }
  ikon.href = FAVICON_SRC;
}

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
  node.className = 'pesan' + (pesan ? ' ' + tipe : '');
}

function toast(pesan) {
  let t = el('toast-app');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-app';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = pesan;
  t.classList.add('tampil');
  clearTimeout(t._jam);
  t._jam = setTimeout(() => t.classList.remove('tampil'), 2800);
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

async function keluar() {
  try { await api('/api/logout', { method: 'POST' }); } catch {}
  sessionStorage.removeItem('hasil_scan');
  sessionStorage.removeItem('hasil_id');
  location.replace('login.html');
}

const esc = (nilai) => String(nilai ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};

  let payload;
  if (formData) payload = formData;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: payload,
      credentials: 'include',
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend di http://localhost:3000 berjalan.');
  }

  let data = {};
  try { data = await res.json(); } catch {}

  if (!res.ok) throw new Error(data.error || `Permintaan gagal (${res.status}).`);
  return data;
}

async function butuhLogin() {
  try {
    return await api('/api/me');
  } catch {
    location.replace('login.html');
    return null;
  }
}

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
  if (x >= AMBANG_TINGGI) return 'tinggi';
  if (x >= AMBANG_PERINGATAN) return 'sedang';
  return 'rendah';
}

const WARNA_SKALA = { rendah: 'hijau', sedang: 'kuning', tinggi: 'merah' };

const KELAS_SEHAT = 'Sehat';
const hasilnyaSehat = (penyakit) => penyakit === KELAS_SEHAT;

function kelasBar(x, penyakit) {
  if (hasilnyaSehat(penyakit)) return '';
  const tingkat = tingkatKeyakinan(x);
  return tingkat === 'rendah' ? '' : tingkat;
}

function kelasPil(x, penyakit) {
  if (hasilnyaSehat(penyakit)) return 'hijau';
  return WARNA_SKALA[tingkatKeyakinan(x)];
}

const spesiesInfo = (kode) => SPESIES[kode] || { nama: kode || '-', penyakit: [] };

const simpanHasil = (hasil) => sessionStorage.setItem('hasil_scan', JSON.stringify(hasil));
const ambilHasil = () => {
  try { return JSON.parse(sessionStorage.getItem('hasil_scan')); }
  catch { return null; }
};
