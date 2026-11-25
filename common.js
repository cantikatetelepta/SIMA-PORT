/* SIMA-PORT - lapisan data & fungsi bantu.
   Seluruh data disimpan di localStorage browser (tanpa server). */
(function () {
  'use strict';
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var BULAN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var STATUS = ['Tepat Waktu', 'Tertunda', 'Dibatalkan'];
  var KEY = 'simaport_db_v1', SESS = 'simaport_admin';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function nowStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  /* Hash sederhana (cukup untuk simulasi tugas; bukan keamanan produksi) */
  function hash(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    str = 'sima-port|' + str;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  /* ---------- Penyimpanan ---------- */
  var mem = null;
  function seed() {
    var pelabuhan = ['Tulehu', 'Waai', 'Liang'].map(function (n, i) {
      return { id: i + 1, nama: n, lokasi: 'Kecamatan Salahutu, Maluku Tengah', deskripsi: 'Informasi jadwal keberangkatan kapal.' };
    });
    var nk = [['KM Cantika Lestari', 250, 'A'], ['KM Express Bahari', 300, 'A'], ['KM Fajar Baru', 180, 'B'], ['KM Nusantara', 400, 'B'],
      ['KM Bahari Indah', 220, 'C'], ['KM Pela Gandong', 260, 'C'], ['KM Laut Maluku', 350, 'A'], ['KM Teluk Ambon', 200, 'B'],
      ['KM Seram Jaya', 320, 'C'], ['KM Lease Permai', 240, 'A'], ['KM Pattimura Express', 280, 'B'], ['KM Salawaku', 210, 'C']];
    var kapal = nk.map(function (k, i) { return { id: i + 1, nama_kapal: k[0], kapasitas: k[1], operator: 'Operator Sampel ' + k[2] }; });
    var rute = { 1: ['Saparua', 'Masohi', 'Banda'], 2: ['Haruku', 'Pelauw'], 3: ['Banda', 'Haruku', 'Amahai'] };
    var jam = ['08:00', '09:30', '10:00', '11:30', '13:00', '15:30'];
    var now = new Date(), jadwal = [], i = 0, ts = nowStr();
    for (var m = 3; m >= 0; m--) {
      var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      for (var k = 0; k < 6; k++, i++) {
        var pel = (i % 3) + 1, st = 'Tepat Waktu', ket = '';
        if (i === 7 || i === 19) { st = 'Dibatalkan'; ket = 'Cuaca buruk di perairan.'; }
        else if (i % 8 === 3) { st = 'Tertunda'; ket = 'Menunggu kondisi cuaca membaik.'; }
        jadwal.push({
          id: i + 1, kapal_id: (i % 12) + 1, pelabuhan_id: pel,
          tujuan: rute[pel][Math.floor(i / 3) % rute[pel].length],
          tanggal: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(3 + k * 4),
          jam_berangkat: jam[i % 6], status: st, keterangan: ket, updated_at: ts
        });
      }
    }
    return { admin: { username: 'admin', pw: hash('admin123') }, pelabuhan: pelabuhan, kapal: kapal, jadwal: jadwal,
      seq: { pelabuhan: 4, kapal: 13, jadwal: 25 } };
  }
  function load() {
    if (mem) return mem;
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.jadwal && d.kapal && d.pelabuhan && d.admin) { mem = d; return d; }
    } catch (e) { /* data rusak: buat ulang */ }
    mem = seed(); save();
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* tetap di memori */ } }
  function resetData() { mem = null; try { localStorage.removeItem(KEY); } catch (e) { } load(); }

  /* ---------- Validasi ---------- */
  function bad(msg) { return new Error(msg); }
  var FIELDS = {
    jadwal: [
      { n: 'kapal_id', l: 'Kapal', t: 'ref', ref: 'kapal', req: 1 },
      { n: 'pelabuhan_id', l: 'Pelabuhan', t: 'ref', ref: 'pelabuhan', req: 1 },
      { n: 'tujuan', l: 'Tujuan', t: 'text', max: 80, req: 1 },
      { n: 'tanggal', l: 'Tanggal', t: 'date', req: 1 },
      { n: 'jam_berangkat', l: 'Jam berangkat', t: 'time', req: 1 },
      { n: 'status', l: 'Status', t: 'enum', req: 1 },
      { n: 'keterangan', l: 'Keterangan', t: 'text', max: 200 }],
    kapal: [
      { n: 'nama_kapal', l: 'Nama kapal', t: 'text', max: 80, req: 1, uniq: 1 },
      { n: 'kapasitas', l: 'Kapasitas', t: 'int' },
      { n: 'operator', l: 'Operator', t: 'text', max: 80 }],
    pelabuhan: [
      { n: 'nama', l: 'Nama pelabuhan', t: 'text', max: 60, req: 1, uniq: 1 },
      { n: 'lokasi', l: 'Lokasi', t: 'text', max: 120 },
      { n: 'deskripsi', l: 'Deskripsi', t: 'text', max: 200 }]
  };
  function clean(entity, body, selfId) {
    var db = load(), out = {};
    FIELDS[entity].forEach(function (f) {
      var v = body ? body[f.n] : undefined;
      if (typeof v === 'string') v = v.trim();
      if (v === undefined || v === null || v === '') {
        if (f.req) throw bad(f.l + ' wajib diisi.');
        out[f.n] = f.t === 'int' ? 0 : ''; return;
      }
      if (f.t === 'text') { v = String(v); if (v.length > f.max) throw bad(f.l + ' terlalu panjang.'); }
      else if (f.t === 'int') { v = Number(v); if (!Number.isInteger(v) || v < 0 || v > 100000) throw bad(f.l + ' harus berupa angka bulat positif.'); }
      else if (f.t === 'time') { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw bad(f.l + ' harus berformat JJ:MM.'); }
      else if (f.t === 'date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v))) throw bad(f.l + ' tidak valid.'); }
      else if (f.t === 'enum') { if (STATUS.indexOf(v) < 0) throw bad(f.l + ' tidak valid.'); }
      else if (f.t === 'ref') { v = Number(v); if (!db[f.ref].some(function (r) { return r.id === v; })) throw bad(f.l + ' tidak ditemukan.'); }
      if (f.uniq && db[entity].some(function (r) { return r.id !== selfId && String(r[f.n]).toLowerCase() === String(v).toLowerCase(); })) {
        throw bad(f.l + ' sudah ada.');
      }
      out[f.n] = v;
    });
    return out;
  }

  /* ---------- Query ---------- */
  function jadwalRows() {
    var db = load();
    return db.jadwal.map(function (j) {
      var k = db.kapal.find(function (x) { return x.id === j.kapal_id; }) || {};
      var p = db.pelabuhan.find(function (x) { return x.id === j.pelabuhan_id; }) || {};
      return Object.assign({}, j, { nama_kapal: k.nama_kapal || '-', pelabuhan: p.nama || '-' });
    }).sort(function (a, b) {
      return b.tanggal.localeCompare(a.tanggal) || a.jam_berangkat.localeCompare(b.jam_berangkat) || b.id - a.id;
    });
  }
  function maxUpdated() {
    return load().jadwal.reduce(function (m, j) { return j.updated_at > m ? j.updated_at : m; }, '');
  }
  function laporanRows() {
    var db = load();
    return db.pelabuhan.map(function (p) {
      var r = { pelabuhan: p.nama, total: 0, tepat: 0, tertunda: 0, dibatalkan: 0 };
      db.jadwal.forEach(function (j) {
        if (j.pelabuhan_id !== p.id) return;
        r.total++;
        if (j.status === 'Tepat Waktu') r.tepat++; else if (j.status === 'Tertunda') r.tertunda++; else r.dibatalkan++;
      });
      return r;
    });
  }
  function dashboard() {
    var db = load(), rows = jadwalRows(), total = db.jadwal.length;
    var tepat = db.jadwal.filter(function (j) { return j.status === 'Tepat Waktu'; }).length;
    var now = new Date(), statistik = [];
    for (var m = 3; m >= 0; m--) {
      var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      var key = d.getFullYear() + '-' + pad(d.getMonth() + 1);
      var row = { bulan: key, label: BULAN_S[d.getMonth()], tepat: 0, tertunda: 0, dibatalkan: 0 };
      db.jadwal.forEach(function (j) {
        if (j.tanggal.slice(0, 7) !== key) return;
        if (j.status === 'Tepat Waktu') row.tepat++; else if (j.status === 'Tertunda') row.tertunda++; else row.dibatalkan++;
      });
      statistik.push(row);
    }
    var terbaru = rows.slice().sort(function (a, b) { return b.updated_at.localeCompare(a.updated_at) || b.id - a.id; }).slice(0, 3);
    var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var mendatang = rows.filter(function (r) { return r.tanggal >= today; })
      .sort(function (a, b) { return a.tanggal.localeCompare(b.tanggal) || a.jam_berangkat.localeCompare(b.jam_berangkat); }).slice(0, 5);
    if (!mendatang.length) mendatang = rows.slice(0, 5);
    return { total_jadwal: total, total_kapal: db.kapal.length, total_pelabuhan: db.pelabuhan.length,
      ketepatan: total ? Math.round(tepat / total * 100) : 0, statistik: statistik, terbaru: terbaru, mendatang: mendatang };
  }

  /* ---------- Router "API" lokal ---------- */
  function needAdmin() {
    if (sessionStorage.getItem(SESS)) return;
    location.href = 'login.html';
    throw bad('Sesi berakhir.');
  }
  function route(method, path, params, body) {
    var db = load(), m;
    if (path === '/api/pelabuhan' && method === 'GET') return db.pelabuhan.slice().sort(function (a, b) { return a.id - b.id; });
    if (path === '/api/jadwal' && method === 'GET') {
      var q = (params.get('q') || '').trim().toLowerCase().slice(0, 60), pel = Number(params.get('pelabuhan'));
      var rows = jadwalRows().filter(function (r) {
        if (q && r.nama_kapal.toLowerCase().indexOf(q) < 0 && r.tujuan.toLowerCase().indexOf(q) < 0) return false;
        if (pel > 0 && r.pelabuhan_id !== pel) return false;
        return true;
      });
      return { data: rows, updated_at: maxUpdated() };
    }
    if (path === '/api/login' && method === 'POST') {
      var u = body && body.username, p = body && body.password;
      if (!u || !p) throw bad('Username dan password wajib diisi.');
      if (String(u).trim() !== db.admin.username || hash(String(p)) !== db.admin.pw) throw bad('Username atau password salah.');
      sessionStorage.setItem(SESS, db.admin.username);
      return { ok: true, username: db.admin.username };
    }
    if (path === '/api/logout') { sessionStorage.removeItem(SESS); return { ok: true }; }
    if (path === '/api/me') { needAdmin(); return { username: sessionStorage.getItem(SESS) }; }

    needAdmin();
    if (path === '/api/admin/dashboard') return dashboard();
    if (path === '/api/admin/laporan') return laporanRows();
    if (path === '/api/admin/password' && method === 'POST') {
      if (!body || typeof body.lama !== 'string' || typeof body.baru !== 'string') throw bad('Data tidak lengkap.');
      if (body.baru.length < 6) throw bad('Password baru minimal 6 karakter.');
      if (hash(body.lama) !== db.admin.pw) throw bad('Password lama salah.');
      db.admin.pw = hash(body.baru); save(); return { ok: true };
    }
    m = path.match(/^\/api\/admin\/(jadwal|kapal|pelabuhan)(?:\/(\d+))?$/);
    if (m) {
      var ent = m[1], id = m[2] ? Number(m[2]) : null;
      if (method === 'GET' && !id) return ent === 'jadwal' ? jadwalRows() : db[ent].slice().sort(function (a, b) { return a.id - b.id; });
      if (method === 'POST' && !id) {
        var rec = clean(ent, body); rec.id = db.seq[ent]++;
        if (ent === 'jadwal') rec.updated_at = nowStr();
        db[ent].push(rec); save(); return { id: rec.id };
      }
      var idx = db[ent].findIndex(function (r) { return r.id === id; });
      if (idx < 0) throw bad('Data tidak ditemukan.');
      if (method === 'PUT') {
        var nw = clean(ent, body, id); nw.id = id;
        if (ent === 'jadwal') nw.updated_at = nowStr();
        db[ent][idx] = nw; save(); return { ok: true };
      }
      if (method === 'DELETE') {
        var key = ent === 'kapal' ? 'kapal_id' : 'pelabuhan_id';
        if (ent !== 'jadwal' && db.jadwal.some(function (j) { return j[key] === id; })) {
          throw bad('Data tidak dapat dihapus karena masih dipakai oleh jadwal.');
        }
        db[ent].splice(idx, 1); save(); return { ok: true };
      }
    }
    throw bad('Permintaan tidak dikenali.');
  }

  function api(url, opt) {
    opt = opt || {};
    return new Promise(function (resolve, reject) {
      try {
        var parts = url.split('?');
        resolve(route((opt.method || 'GET').toUpperCase(), parts[0], new URLSearchParams(parts[1] || ''), opt.body));
      } catch (e) { reject(e); }
    });
  }

  var cls = { 'Tepat Waktu': 'ok', 'Tertunda': 'warn', 'Dibatalkan': 'bad' };
  function badge(s) { return '<span class="badge ' + (cls[s] || '') + '">' + esc(s) + '</span>'; }
  function fmtTanggal(d) {
    if (!d) return '-';
    var p = String(d).split('-');
    return (+p[2]) + ' ' + BULAN[p[1] - 1] + ' ' + p[0];
  }
  function fmtWaktu(s) {
    if (!s) return '-';
    var a = String(s).split(' ');
    return fmtTanggal(a[0]) + ', ' + (a[1] || '00:00').slice(0, 5) + ' WIT';
  }
  function downloadCsv() {
    var q = function (v) { var s = String(v == null ? '' : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    var lines = [['Tanggal', 'Kapal', 'Pelabuhan', 'Tujuan', 'Jam Berangkat', 'Status', 'Keterangan'].map(q).join(',')];
    jadwalRows().forEach(function (r) {
      lines.push([r.tanggal, r.nama_kapal, r.pelabuhan, r.tujuan, r.jam_berangkat, r.status, r.keterangan].map(q).join(','));
    });
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'laporan-jadwal-sima-port.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  window.SP = { esc: esc, api: api, badge: badge, fmtTanggal: fmtTanggal, fmtWaktu: fmtWaktu, downloadCsv: downloadCsv, resetData: resetData };
})();
