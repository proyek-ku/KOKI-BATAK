/* Koki Batak — admin-admin.js : kelola akun admin (khusus owner) */
(function () {
  "use strict";

  var all = [];
  var modal = null;

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("admin");

    // Gerbang sisi-klien (backend tetap menegakkan lewat requireOwner).
    if (!KB_ADMIN.isOwner()) {
      document.getElementById("notOwner").classList.remove("d-none");
      document.getElementById("tableCard").classList.add("d-none");
      document.getElementById("addBtn").classList.add("d-none");
      return;
    }

    modal = new bootstrap.Modal(document.getElementById("adminModal"));
    document.getElementById("addBtn").addEventListener("click", function () { openForm(null); });
    document.getElementById("adminForm").addEventListener("submit", onSave);
    load();
  });

  function load() {
    var body = document.getElementById("adminBody");
    body.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm"></div> Memuat…</td></tr>';
    KB_ADMIN.call("adminListAdmins")
      .then(function (list) { all = list || []; render(); })
      .catch(function (err) {
        body.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">' + KB_ADMIN.escape(err.message) + "</td></tr>";
      });
  }

  function render() {
    var body = document.getElementById("adminBody");
    var meId = KB_ADMIN.getProfile().id;
    if (!all.length) {
      body.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada admin.</td></tr>';
      return;
    }
    body.innerHTML = all
      .map(function (a, i) {
        var roleBadge = a.role === "owner" ? '<span class="badge text-bg-danger">Owner</span>' : '<span class="badge text-bg-secondary">Staff</span>';
        var statusBadge = a.is_active ? '<span class="badge text-bg-success">Aktif</span>' : '<span class="badge text-bg-light text-dark">Nonaktif</span>';
        var you = String(a.id) === String(meId) ? ' <span class="badge text-bg-info">Anda</span>' : "";
        var delBtn = String(a.id) === String(meId)
          ? ""
          : ' <button class="btn btn-sm btn-outline-danger" data-del="' + i + '">Hapus</button>';
        return (
          "<tr>" +
          "<td>" + KB_ADMIN.escape(a.name) + you + "</td>" +
          "<td><code>" + KB_ADMIN.escape(a.username) + "</code></td>" +
          "<td>" + roleBadge + "</td>" +
          "<td>" + statusBadge + "</td>" +
          '<td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary" data-edit="' + i + '">Edit</button>' + delBtn + "</td>" +
          "</tr>"
        );
      })
      .join("");

    body.querySelectorAll("button[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openForm(all[Number(b.getAttribute("data-edit"))]); });
    });
    body.querySelectorAll("button[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { onDelete(all[Number(b.getAttribute("data-del"))]); });
    });
  }

  function openForm(a) {
    var f = document.getElementById("adminForm");
    f.reset();
    var editing = !!a;
    document.getElementById("adminModalTitle").textContent = editing ? "Edit Admin" : "Tambah Admin";
    f.id.value = editing ? a.id : "";
    f.name.value = editing ? a.name || "" : "";
    f.username.value = editing ? a.username || "" : "";
    f.role.value = editing ? a.role || "staff" : "staff";
    f.is_active.checked = editing ? !!a.is_active : true;
    // Saat edit, password opsional (kosong = tidak diubah).
    document.getElementById("pwReq").style.display = editing ? "none" : "inline";
    document.getElementById("pwHint").textContent = editing
      ? "Kosongkan jika tidak ingin mengganti password."
      : "Minimal 8 karakter.";
    modal.show();
  }

  function onSave(e) {
    e.preventDefault();
    var f = e.target;
    var editing = !!f.id.value;
    var username = f.username.value.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) { KB_ADMIN.toast("Username 3-20 karakter (huruf kecil, angka, . _).", "error"); return; }
    if (!editing && (!f.password.value || f.password.value.length < 8)) { KB_ADMIN.toast("Password minimal 8 karakter.", "error"); return; }
    if (editing && f.password.value && f.password.value.length < 8) { KB_ADMIN.toast("Password baru minimal 8 karakter.", "error"); return; }

    var payload = {
      id: f.id.value || "",
      name: f.name.value.trim(),
      username: username,
      role: f.role.value,
      is_active: f.is_active.checked,
    };
    if (f.password.value) payload.password = f.password.value;

    var btn = document.getElementById("adminSaveBtn");
    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan…';

    KB_ADMIN.call("adminSaveAdmin", payload)
      .then(function () { KB_ADMIN.toast("Admin disimpan.", "success"); modal.hide(); load(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); })
      .then(function () { btn.disabled = false; btn.innerHTML = old; });
  }

  function onDelete(a) {
    if (!confirm('Hapus admin "' + a.username + '" secara permanen?')) return;
    KB_ADMIN.call("adminDeleteAdmin", { id: a.id })
      .then(function () { KB_ADMIN.toast("Admin dihapus.", "success"); load(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); });
  }
})();
