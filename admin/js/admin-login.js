/* Koki Batak — admin-login.js : autentikasi admin */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Sudah login? langsung ke dashboard.
    if (KB_ADMIN.getToken()) { location.href = "dashboard.html"; return; }

    if (/[?&]expired=1/.test(location.search)) {
      document.getElementById("expiredAlert").classList.remove("d-none");
    }

    var form = document.getElementById("loginForm");
    var btn = document.getElementById("loginBtn");
    var pw = document.getElementById("password");
    var un = document.getElementById("username");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      pw.classList.remove("is-invalid");
      un.classList.remove("is-invalid");
      var ok = true;
      if (!un.value.trim()) { un.classList.add("is-invalid"); ok = false; }
      if (!pw.value) { pw.classList.add("is-invalid"); ok = false; }
      if (!ok) return;

      btn.disabled = true;
      var old = btn.textContent;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses…';

      KB_API.post("adminLogin", { username: un.value.trim(), password: pw.value })
        .then(function (res) {
          KB_ADMIN.setToken(res.token, res.expires_in_ms, res.profile);
          location.href = "dashboard.html";
        })
        .catch(function (err) {
          KB_ADMIN.toast(err.message || "Gagal masuk.", "error");
          btn.disabled = false;
          btn.textContent = old;
          pw.select();
        });
    });
  });
})();
