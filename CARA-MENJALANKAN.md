# SIMA-PORT (website murni HTML, CSS, JavaScript)

Tidak perlu Node.js, npm, atau instalasi apa pun.

## Cara membuka di Visual Studio Code
1. Buka folder `sima-port` di VS Code (File > Open Folder).
2. Klik kanan `index.html` di panel Explorer, pilih **Reveal in File Explorer**, lalu klik dua kali `index.html` agar terbuka di browser.
   (Opsional: pasang ekstensi **Live Server**, lalu klik **Go Live** di pojok kanan bawah VS Code.)

Login admin: **admin** / **admin123** (bisa diganti di menu Pengaturan).

Data disimpan di browser (localStorage) dan terisi data sampel otomatis.
Untuk mengembalikan data sampel: buka Console browser (F12) lalu ketik `SP.resetData()` dan muat ulang halaman.

## Susunan file
index.html, jadwal.html, tentang.html, login.html, admin.html
css/style.css
js/common.js (data & fungsi bantu), site.js, home.js, jadwal.js, login.js, admin.js
img/logo.svg, logo-white.svg
