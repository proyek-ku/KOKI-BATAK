/* Koki Batak — admin-profil.js : lihat profil + ganti password sendiri */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("profil");
    loadMe();
    document.getElementById("pwForm").addEventListener("submit", onChangePw);
  });

  function row(label, val) {
    return '<div class="col-sm-4 text-muted small">' + label + '</div><div class="col-sm-8 fw-semibold">' + val + "</div>";
  }

  function loadMe() {
    KB_ADMIN.call("adminMe")
      .then(function (me) {
        document.getElementById("meInfo").innerHTML =
          row("Nama", KB_ADMIN.escape(me.name)) +
          row("Username", KB_ADMIN.escape(me.username)) +
          row("Peran", me.role === "owner" ? '<span class="badge text-bg-danger">Owner</span>' : '<span class="badge text-bg-secondary">Staff</span>');
      })
      .catch(function (err) {
        document.getElementById("meInfo").innerHTML = '<div class="col-12 text-danger">' + KB_ADMIN.escape(err.message) + "</div>";
      });
  }

  function onChangePw(e) {
    e.preventDefault();
    var f = e.target;
    var cur = f.current_password.value;
    var nw = f.new_password.value;
    var cf = f.confirm_password.value;

    if (nw.length < 8) { KB_ADMIN.toast("Password baru minimal 8 karakter.", "error"); return; }
    if (nw !== cf) { KB_ADMIN.toast("Konfirmasi password tidak sama.", "error"); return; }

    var btn = document.getElementById("pwBtn");
    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan…';

    KB_ADMIN.call("adminChangePassword", { current_password: cur, new_password: nw })
      .then(function () {
        f.reset();
        // Demi keamanan, token lama otomatis tidak berlaku lagi -> login ulang.
        KB_ADMIN.toast("Password berhasil diganti. Silakan login ulang…", "success");
        setTimeout(function () { KB_ADMIN.logout(); }, 1600);
      })
      .catch(function (err) {
        KB_ADMIN.toast(err.message, "error");
        btn.disabled = false;
        btn.innerHTML = old;
      });
  }
})();
