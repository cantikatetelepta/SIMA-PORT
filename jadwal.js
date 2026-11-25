(function () {
  'use strict';
  const { esc, api, badge, fmtTanggal, fmtWaktu } = SP;
  const PER = 10;
  const $ = id => document.getElementById(id);
  let rows = [], page = 1;

  function render() {
    const pages = Math.max(1, Math.ceil(rows.length / PER));
    page = Math.min(page, pages);
    const slice = rows.slice((page - 1) * PER, page * PER);
    $('tbody').innerHTML = slice.length ? slice.map((r, i) => `
      <tr>
        <td class="c">${(page - 1) * PER + i + 1}</td>
        <td>${esc(r.nama_kapal)}</td>
        <td class="c">${esc(r.pelabuhan)}</td>
        <td class="c">${esc(r.tujuan)}</td>
        <td class="c">${esc(fmtTanggal(r.tanggal))}</td>
        <td class="c">${esc(r.jam_berangkat)}</td>
        <td class="c">${badge(r.status)}${r.keterangan ? `<div class="muted" style="font-size:12px">${esc(r.keterangan)}</div>` : ''}</td>
      </tr>`).join('') : '<tr><td colspan="7" class="empty">Tidak ada jadwal yang cocok dengan pencarian Anda.</td></tr>';

    let b = `<button type="button" id="prev" ${page === 1 ? 'disabled' : ''} aria-label="Sebelumnya">&lsaquo;</button>`;
    for (let n = 1; n <= pages; n++) b += `<button type="button" data-p="${n}" class="${n === page ? 'cur' : ''}">${n}</button>`;
    b += `<button type="button" id="next" ${page === pages ? 'disabled' : ''} aria-label="Berikutnya">&rsaquo;</button>`;
    $('pager').innerHTML = b;
  }

  async function load() {
    const qs = new URLSearchParams();
    if ($('q').value.trim()) qs.set('q', $('q').value.trim());
    if ($('pel').value) qs.set('pelabuhan', $('pel').value);
    try {
      const d = await api('/api/jadwal?' + qs);
      rows = d.data; page = 1;
      $('updated').textContent = d.updated_at ? fmtWaktu(d.updated_at) : '-';
      render();
    } catch (e) {
      $('tbody').innerHTML = `<tr><td colspan="7" class="empty">${esc(e.message)}</td></tr>`;
    }
  }

  $('pager').addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t || t.disabled) return;
    if (t.id === 'prev') page--; else if (t.id === 'next') page++; else page = Number(t.dataset.p);
    render();
  });
  $('filter').addEventListener('submit', e => { e.preventDefault(); load(); });
  $('reset').addEventListener('click', () => { $('q').value = ''; $('pel').value = ''; load(); });

  api('/api/pelabuhan').then(list => {
    $('pel').innerHTML = '<option value="">Semua Pelabuhan</option>' + list.map(p => `<option value="${p.id}">${esc(p.nama)}</option>`).join('');
    const want = new URLSearchParams(location.search).get('pelabuhan');
    if (want && list.some(p => String(p.id) === want)) $('pel').value = want;
    load();
  }).catch(load);
})();
