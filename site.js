(function () {
  'use strict';
  const { api } = SP;
  const page = document.body.dataset.page;
  const link = (href, key, text) =>
    `<a href="${href}" class="${page === key ? 'active' : ''}">${text}</a>`;

  const headerEl = document.getElementById('site-header');
  if (headerEl) {
    headerEl.innerHTML = `
  <header class="site-header"><div class="container">
    <a class="brand" href="index.html"><img src="img/logo.svg" alt=""><span><b>SIMA-PORT</b><small>Sistem Informasi Maritim Pelabuhan Ambon</small></span></a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Navigasi utama">
      ${link('index.html', 'home', 'Beranda')}
      ${link('tentang.html', 'tentang', 'Tentang')}
      <a class="btn" href="login.html">Login Admin</a>
    </nav>
  </div></header>`;
  }

  const footerEl = document.getElementById('site-footer');
  if (footerEl) {
    footerEl.innerHTML =
      '<footer class="site-footer">&copy; 2026 SIMA-PORT | Universitas Kristen Indonesia Maluku</footer>';
  }

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
})();