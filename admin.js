(function () {
  'use strict';
  const { esc, api, badge, fmtTanggal, fmtWaktu } = SP;
  const $ = id => document.getElementById(id);
  const main = $('main'), dlg = $('dlg');
  const STATUS = ['Tepat Waktu', 'Tertunda', 'Dibatalkan'];
  const COLOR = { 'Tepat Waktu': '#1a73e8', 'Tertunda': '#f5a524', 'Dibatalkan': '#e5484d' };

  /* ---------- Dashboard ---------- */
  function chart(data) {
    const W = 460, H = 230, L = 34, B = 28, T = 10;
    const max = Math.max(5, ...data.map(d => Math.max(d.tepat, d.tertunda, d.dibatalkan)));
    const top = Math.ceil(max / 5) * 5;
    const ph = H - B - T, gw = (W - L) / data.length, bw = Math.min(22, gw / 4);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik statistik keberangkatan per bulan" style="width:100%;height:auto">`;
    for (let v = 0; v <= top; v += top / 5) {
      const y = T + ph - (v / top) * ph;
      s += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="#e3eaf4"/><text x="${L - 6}" y="${y + 4}" font-size="11" text-anchor="end" fill="#5b6b86">${Math.round(v)}</text>`;
    }
    data.forEach((d, i) => {
      const x0 = L + i * gw + (gw - bw * 3 - 4) / 2;
      [['tepat', 'Tepat Waktu'], ['tertunda', 'Tertunda'], ['dibatalkan', 'Dibatalkan']].forEach(([k, name], j) => {
        const h = (d[k] / top) * ph;
        s += `<rect x="${x0 + j * (bw + 2)}" y="${T + ph - h}" width="${bw}" height="${h}" rx="2" fill="${COLOR[name]}"><title>${esc(d.label)}: ${name} ${d[k]}</title></rect>`;
      });
      s += `<text x="${L + i * gw + gw / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#5b6b86">${esc(d.label)}</text>`;
    });
    return s + '</svg>';
  }

  async function dashboard() {
    const d = await api('/api/admin/dashboard');
    const dot = { 'Tepat Waktu': '#1f9d55', 'Tertunda': '#f5a524', 'Dibatalkan': '#e5484d' };
    main.innerHTML = `
      <h1>Dashboard</h1>
      <div class="stats">
        <div class="stat"><b>${d.total_jadwal}</b><span>Total Jadwal</span></div>
        <div class="stat"><b>${d.total_kapal}</b><span>Total Kapal</span></div>
        <div class="stat"><b>${d.total_pelabuhan}</b><span>Pelabuhan</span></div>
        <div class="stat"><b>${d.ketepatan}%</b><span>Ketepatan Jadwal</span></div>
      </div>
      <div class="grid2">
        <section class="panel"><h2>Statistik Keberangkatan</h2>
          <div class="legend">${STATUS.map(s => `<span><i style="background:${COLOR[s]}"></i>${s}</span>`).join('')}</div>
          ${chart(d.statistik)}</section>
        <section class="panel"><h2>Status Terbaru</h2><ul class="latest">
          ${d.terbaru.map(r => `<li><span class="dot" style="background:${dot[r.status]}"></span><span><b>${esc(r.nama_kapal)}</b><small class="muted">${esc(r.status)} &bull; ${esc(r.jam_berangkat)}</small></span></li>`).join('') || '<li class="muted">Belum ada data.</li>'}
        </ul><p style="text-align:right;margin:10px 0 0"><a href="#jadwal">Lihat Semua</a></p></section>
      </div>
      <section class="panel"><div class="panel-head"><h2>Jadwal Mendatang</h2><a href="#jadwal">Lihat Detail</a></div>
        <div class="table-wrap"><table><thead><tr><th>Nama Kapal</th><th>Pelabuhan</th><th>Tujuan</th><th>Tanggal</th><th>Jam</th><th>Status</th></tr></thead><tbody>
        ${d.mendatang.map(r => `<tr><td>${esc(r.nama_kapal)}</td><td>${esc(r.pelabuhan)}</td><td>${esc(r.tujuan)}</td><td>${esc(fmtTanggal(r.tanggal))}</td><td>${esc(r.jam_berangkat)}</td><td>${badge(r.status)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Belum ada jadwal.</td></tr>'}
        </tbody></table></div></section>`;
  }

  /* ---------- CRUD generik ---------- */
  async function crudView(cfg) {
    const refs = {};
    for (const f of cfg.fields) if (f.ref) refs[f.name] = await api('/api/admin/' + f.ref.route);
    let rows = await api('/api/admin/' + cfg.route);
    let q = '';

    function draw() {
      const list = rows.filter(r => !q || cfg.columns.some(c => String(r[c.key] == null ? '' : r[c.key]).toLowerCase().includes(q)));
      $('rows').innerHTML = list.length ? list.map(r => `<tr>
        ${cfg.columns.map(c => `<td>${c.badge ? badge(r[c.key]) : esc(c.fmt ? c.fmt(r[c.key]) : r[c.key])}</td>`).join('')}
        <td><div class="actions"><button class="btn outline sm" data-edit="${r.id}">Ubah</button><button class="btn danger sm" data-del="${r.id}">Hapus</button></div></td></tr>`).join('')
        : `<tr><td colspan="${cfg.columns.length + 1}" class="empty">Data tidak ditemukan.</td></tr>`;
    }

    main.innerHTML = `<h1>${cfg.title}</h1>
      <div id="notice" class="alert good" hidden role="status"></div>
      <div class="toolbar"><input id="search" type="search" placeholder="Cari data..." aria-label="Cari data"><button class="btn" id="add">+ Tambah ${cfg.single}</button></div>
      <div class="table-wrap"><table><thead><tr>${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}<th>Aksi</th></tr></thead><tbody id="rows"></tbody></table></div>`;
    draw();

    const notice = msg => { const n = $('notice'); n.textContent = msg; n.hidden = false; setTimeout(() => { n.hidden = true; }, 3500); };
    const reload = async () => { rows = await api('/api/admin/' + cfg.route); draw(); };

    $('search').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); });
    $('add').addEventListener('click', () => openForm(null));
    $('rows').addEventListener('click', async e => {
      const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (ed) openForm(rows.find(r => String(r.id) === ed.dataset.edit));
      if (del && confirm(`Hapus ${cfg.single.toLowerCase()} ini?`)) {
        try { await api(`/api/admin/${cfg.route}/${del.dataset.del}`, { method: 'DELETE' }); await reload(); notice('Data berhasil dihapus.'); }
        catch (err) { notice(''); $('notice').className = 'alert'; $('notice').textContent = err.message; $('notice').hidden = false; setTimeout(() => { $('notice').className = 'alert good'; }, 3500); }
      }
    });

    function openForm(row) {
      $('dtitle').textContent = (row ? 'Ubah ' : 'Tambah ') + cfg.single;
      $('derr').hidden = true;
      $('dfields').innerHTML = cfg.fields.map(f => {
        const v = row ? row[f.name] : (f.default !== undefined ? f.default : '');
        let input;
        if (f.ref) input = `<select id="f_${f.name}" required>${refs[f.name].map(o => `<option value="${o.id}" ${String(o.id) === String(v) ? 'selected' : ''}>${esc(o[f.ref.label])}</option>`).join('')}</select>`;
        else if (f.options) input = `<select id="f_${f.name}">${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
        else input = `<input id="f_${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${f.required ? 'required' : ''} ${f.type === 'number' ? 'min="0"' : ''}>`;
        return `<div class="field"><label for="f_${f.name}">${f.label}</label>${input}</div>`;
      }).join('');
      $('dform').onsubmit = async ev => {
        ev.preventDefault();
        const body = {};
        cfg.fields.forEach(f => { body[f.name] = $('f_' + f.name).value; });
        try {
          await api(row ? `/api/admin/${cfg.route}/${row.id}` : '/api/admin/' + cfg.route, { method: row ? 'PUT' : 'POST', body });
          dlg.close(); await reload(); notice('Data berhasil disimpan.');
        } catch (err) { $('derr').textContent = err.message; $('derr').hidden = false; }
      };
      dlg.showModal();
    }
  }

  const today = () => new Date().toISOString().slice(0, 10);
  const CFG = {
    jadwal: {
      route: 'jadwal', title: 'Kelola Jadwal', single: 'Jadwal',
      columns: [{ key: 'nama_kapal', label: 'Kapal' }, { key: 'pelabuhan', label: 'Pelabuhan' }, { key: 'tujuan', label: 'Tujuan' },
        { key: 'tanggal', label: 'Tanggal', fmt: fmtTanggal }, { key: 'jam_berangkat', label: 'Jam' }, { key: 'status', label: 'Status', badge: true }],
      fields: [
        { name: 'kapal_id', label: 'Kapal', ref: { route: 'kapal', label: 'nama_kapal' } },
        { name: 'pelabuhan_id', label: 'Pelabuhan', ref: { route: 'pelabuhan', label: 'nama' } },
        { name: 'tujuan', label: 'Tujuan', required: true },
        { name: 'tanggal', label: 'Tanggal', type: 'date', required: true, default: today() },
        { name: 'jam_berangkat', label: 'Jam berangkat', type: 'time', required: true, default: '08:00' },
        { name: 'status', label: 'Status', options: STATUS },
        { name: 'keterangan', label: 'Keterangan (opsional)' }]
    },
    kapal: {
      route: 'kapal', title: 'Data Kapal', single: 'Kapal',
      columns: [{ key: 'id', label: 'ID' }, { key: 'nama_kapal', label: 'Nama Kapal' }, { key: 'kapasitas', label: 'Kapasitas' }, { key: 'operator', label: 'Operator' }],
      fields: [{ name: 'nama_kapal', label: 'Nama kapal', required: true }, { name: 'kapasitas', label: 'Kapasitas (orang)', type: 'number', default: 0 }, { name: 'operator', label: 'Operator' }]
    },
    pelabuhan: {
      route: 'pelabuhan', title: 'Data Pelabuhan', single: 'Pelabuhan',
      columns: [{ key: 'id', label: 'ID' }, { key: 'nama', label: 'Nama' }, { key: 'lokasi', label: 'Lokasi' }, { key: 'deskripsi', label: 'Deskripsi' }],
      fields: [{ name: 'nama', label: 'Nama pelabuhan', required: true }, { name: 'lokasi', label: 'Lokasi' }, { name: 'deskripsi', label: 'Deskripsi' }]
    }
  };

  /* ---------- Laporan & Pengaturan ---------- */
  async function laporan() {
    const r = await api('/api/admin/laporan');
    main.innerHTML = `<h1>Laporan</h1>
      <section class="panel"><div class="panel-head"><h2>Rekap Status per Pelabuhan</h2><button class="btn sm" type="button" id="csv">Unduh Seluruh Jadwal (CSV)</button></div>
      <div class="table-wrap"><table><thead><tr><th>Pelabuhan</th><th>Total</th><th>Tepat Waktu</th><th>Tertunda</th><th>Dibatalkan</th></tr></thead><tbody>
      ${r.map(x => `<tr><td>${esc(x.pelabuhan)}</td><td>${x.total}</td><td>${x.tepat}</td><td>${x.tertunda}</td><td>${x.dibatalkan}</td></tr>`).join('')}
      </tbody></table></div></section>`;
    $('csv').addEventListener('click', SP.downloadCsv);
  }

  async function pengaturan() {
    main.innerHTML = `<h1>Pengaturan</h1>
      <section class="panel" style="max-width:420px"><h2>Ganti Password</h2>
      <div id="pmsg" class="alert" hidden role="alert"></div>
      <form id="pf" novalidate>
        <div class="field"><label for="lama">Password lama</label><input id="lama" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="baru">Password baru (min. 6 karakter)</label><input id="baru" type="password" autocomplete="new-password"></div>
        <button class="btn" type="submit">Simpan Password</button>
      </form></section>`;
    $('pf').addEventListener('submit', async e => {
      e.preventDefault();
      const m = $('pmsg');
      try {
        await api('/api/admin/password', { method: 'POST', body: { lama: $('lama').value, baru: $('baru').value } });
        m.className = 'alert good'; m.textContent = 'Password berhasil diubah.'; $('pf').reset();
      } catch (err) { m.className = 'alert'; m.textContent = err.message; }
      m.hidden = false;
    });
  }

  /* ---------- Router ---------- */
  const views = { dashboard, jadwal: () => crudView(CFG.jadwal), kapal: () => crudView(CFG.kapal), pelabuhan: () => crudView(CFG.pelabuhan), laporan, pengaturan };

  async function route() {
    let v = (location.hash || '#dashboard').slice(1);
    if (!views[v]) v = 'dashboard';
    document.querySelectorAll('.side a[data-v]').forEach(a => a.classList.toggle('active', a.dataset.v === v));
    $('side').classList.remove('open');
    main.innerHTML = '<p class="muted">Memuat...</p>';
    try { await views[v](); }
    catch (e) { main.innerHTML = `<div class="alert" role="alert">${esc(e.message)}</div>`; }
  }

  $('dcancel').addEventListener('click', () => dlg.close());
  $('burger').addEventListener('click', () => $('side').classList.toggle('open'));
  $('logout').addEventListener('click', async e => {
    e.preventDefault();
    try { await api('/api/logout', { method: 'POST' }); } catch (err) { /* abaikan */ }
    location.href = 'login.html';
  });
  window.addEventListener('hashchange', route);

  api('/api/me').then(me => {
    $('uname').textContent = me.username;
    $('av').textContent = me.username.charAt(0).toUpperCase();
    route();
  }).catch(() => { });
})();
