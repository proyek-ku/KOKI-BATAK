/* ============================================================================
   Koki Batak — config.js
   Satu-satunya tempat konfigurasi frontend publik.
   Isi API_BASE_URL dengan URL Web App GAS Anda setelah deploy (akhiran /exec).
   Nomor WhatsApp, sosial media, dll. TIDAK di sini — diambil dari API (Settings).
   ============================================================================ */

window.KB_CONFIG = {
  // Ganti dengan URL Web App GAS (Deploy > New deployment > Web app), contoh:
  // "https://script.google.com/macros/s/AKfycbx....../exec"
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbxse-sq_KBjcPyvLY5G_zHAhSJhcfx_q3QW4ZDyZRBeLyJ3y05LFG8IdU7gDdEXvEbfyw/exec",

  // Set true HANYA jika Fase 0 membuktikan GET cross-origin TIDAK bisa dibaca
  // (browser memblokir). Jika true, pembacaan data memakai fallback JSONP.
  USE_JSONP_FOR_GET: false,

  // Lebar default thumbnail gambar Drive (px). Lihat catatan di api.js.
  IMG_THUMB_WIDTH: 800,
};
