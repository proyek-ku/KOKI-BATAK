/* Koki Batak — admin-pengaturan.js : kelola pengaturan bisnis (termasuk no WA admin) */
(function () {
  "use strict";

  var FIELDS = [
    "wa_admin_number", "business_name", "business_info", "address",
    "hero_title", "hero_subtitle", "instagram_url", "tiktok_url",
    "maps_url", "package_categories"
  ];

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("pengaturan");
    load();
    document.getElementById("setForm").addEventListener("submit", onSave);
  });

  function load() {
    var form = document.getElementById("setForm");
    // getSettings bersifat publik -> aman dipakai untuk memuat nilai awal.
    KB_API.get("getSettings")
      .then(function (s) {
        s = s || {};
        FIELDS.forEach(function (k) {
          if (form[k] !== undefined && s[k] !== undefined && s[k] !== null) form[k].value = s[k];
        });
      })
      .catch(function (err) { KB_ADMIN.toast("Gagal memuat pengaturan: " + err.message, "error"); });
  }

  function onSave(e) {
    e.preventDefault();
    var form = e.target;
    var settings = {};
    FIELDS.forEach(function (k) { if (form[k] !== undefined) settings[k] = form[k].value.trim(); });

    if (!settings.wa_admin_number) {
      KB_ADMIN.toast("Nomor WhatsApp Admin wajib diisi.", "error");
      form.wa_admin_number.focus();
      return;
    }

    var btn = document.getElementById("setBtn");
    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan…';

    KB_ADMIN.call("adminSaveSettings", { settings: settings })
      .then(function () { KB_ADMIN.toast("Pengaturan disimpan.", "success"); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); })
      .then(function () { btn.disabled = false; btn.innerHTML = old; });
  }
})();
