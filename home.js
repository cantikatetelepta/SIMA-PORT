(function () {
  'use strict';
  const { esc, api } = SP;
  const ship = '<svg viewBox="0 0 48 48" fill="none" stroke="#0a2a66" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 30h36l-5 9H11zM14 30V20h20v10M20 20v-6h8v6"/></svg>';
  api('/api/pelabuhan').then(list => {
    document.getElementById('port-cards').innerHTML = list.map(p => `
      <a class="card" href="jadwal.html?pelabuhan=${p.id}">
        <span class="ic">${ship}</span>
        <span><h3>Pelabuhan ${esc(p.nama)}</h3><p>${esc(p.deskripsi)}</p></span>
      </a>`).join('');
    document.getElementById('port-names').textContent = list.map(p => p.nama).join(' - ');
    document.getElementById('port-count').textContent = list.length + ' Pelabuhan';
  }).catch(e => {
    document.getElementById('port-cards').innerHTML = `<p class="alert">${esc(e.message)}</p>`;
  });
})();
