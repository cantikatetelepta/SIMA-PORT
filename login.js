(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  $('eye').addEventListener('click', () => {
    const show = $('p').type === 'password';
    $('p').type = show ? 'text' : 'password';
    $('eye').textContent = show ? 'Sembunyi' : 'Lihat';
  });
  $('f').addEventListener('submit', async e => {
    e.preventDefault();
    $('err').hidden = true;
    const username = $('u').value.trim(), password = $('p').value;
    if (!username || !password) { $('err').textContent = 'Username dan password wajib diisi.'; $('err').hidden = false; return; }
    $('go').disabled = true;
    try {
      await SP.api('/api/login', { method: 'POST', body: { username, password } });
      location.href = 'admin.html';
    } catch (err) {
      $('err').textContent = err.message; $('err').hidden = false;
      $('go').disabled = false;
    }
  });
})();
