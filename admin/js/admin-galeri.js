/* Koki Batak — admin-galeri.js : kelola foto galeri */
(function () {
  "use strict";

  var all = [];
  var modal = null;
  var pendingImage = null;
  var MAX_BYTES = 3 * 1024 * 1024;

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("galeri");
    modal = new bootstrap.Modal(document.getElementById("galModal"));
    document.getElementById("addBtn").addEventListener("click", function () { openForm(null); });
    document.getElementById("galForm").addEventListener("submit", onSave);
    document.getElementById("gFile").addEventListener("change", onFile);
    load();
  });

  function load() {
    var grid = document.getElementById("galleryGrid");
    grid.innerHTML = '<div class="col-12 text-center text-muted py-5"><div class="spinner-border"></div></div>';
    KB_ADMIN.call("adminListGallery")
      .then(function (list) { all = list || []; render(); })
      .catch(function (err) {
        grid.innerHTML = '<div class="col-12"><div class="alert alert-danger">' + KB_ADMIN.escape(err.message) + "</div></div>";
      });
  }

  function render() {
    var grid = document.getElementById("galleryGrid");
    if (!all.length) {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-5">Belum ada foto. Klik "Tambah Foto".</div>';
      return;
    }
    grid.innerHTML = all
      .map(function (g, i) {
        return (
          '<div class="col-6 col-md-4 col-lg-3"><div class="card border-0 shadow-sm h-100 ' + (g.is_active ? "" : "opacity-50") + '">' +
          KB_ADMIN.img(g.image, g.title, 400).replace("<img ", '<img class="g-thumb" ') +
          '<div class="card-body p-2">' +
          '<div class="small fw-semibold text-truncate">' + KB_ADMIN.escape(g.title || "(tanpa judul)") + "</div>" +
          '<div class="small text-muted text-truncate">' + KB_ADMIN.escape(g.caption || "") + "</div>" +
          (g.is_active ? "" : '<span class="badge text-bg-secondary mt-1">Tersembunyi</span>') +
          '<div class="d-flex gap-1 mt-2">' +
          '<button class="btn btn-sm btn-outline-secondary flex-fill" data-edit="' + i + '">Edit</button>' +
          '<button class="btn btn-sm btn-outline-danger flex-fill" data-del="' + i + '">Hapus</button>' +
          "</div></div></div></div>"
        );
      })
      .join("");

    grid.querySelectorAll("button[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openForm(all[Number(b.getAttribute("data-edit"))]); });
    });
    grid.querySelectorAll("button[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { onDelete(all[Number(b.getAttribute("data-del"))]); });
    });
  }

  function openForm(g) {
    pendingImage = null;
    var f = document.getElementById("galForm");
    f.reset();
    document.getElementById("gFile").value = "";
    document.getElementById("galTitle").textContent = g ? "Edit Foto" : "Tambah Foto";
    f.id.value = g ? g.id : "";
    f.title.value = g ? g.title || "" : "";
    f.caption.value = g ? g.caption || "" : "";
    f.sort_order.value = g ? g.sort_order || 100 : 100;
    f.is_active.checked = g ? !!g.is_active : true;
    f.image_drive_id.value = g ? g.image_drive_id || "" : "";

    var prev = document.getElementById("gPreview");
    if (g && g.image) { prev.src = KB_ADMIN.driveImg(g.image, 280); prev.style.display = "block"; }
    else { prev.style.display = "none"; prev.src = ""; }
    modal.show();
  }

  function onFile() {
    var file = document.getElementById("gFile").files[0];
    if (!file) { pendingImage = null; return; }
    if (file.size > MAX_BYTES) {
      KB_ADMIN.toast("Ukuran gambar terlalu besar (maks 3 MB).", "error");
      document.getElementById("gFile").value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      pendingImage = { base64: reader.result, mime: file.type, filename: file.name };
      var prev = document.getElementById("gPreview");
      prev.src = reader.result; prev.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  function onSave(e) {
    e.preventDefault();
    var f = e.target;
    var isNew = !f.id.value;
    if (isNew && !pendingImage) { KB_ADMIN.toast("Pilih foto terlebih dahulu.", "error"); return; }

    var btn = document.getElementById("gSaveBtn");
    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan…';

    var step = pendingImage
      ? KB_ADMIN.call("adminUploadImage", pendingImage).then(function (r) { return r.id; })
      : Promise.resolve(f.image_drive_id.value || "");

    step
      .then(function (driveId) {
        return KB_ADMIN.call("adminSaveGallery", {
          id: f.id.value || "",
          title: f.title.value.trim(),
          caption: f.caption.value.trim(),
          sort_order: f.sort_order.value,
          is_active: f.is_active.checked,
          image_drive_id: driveId,
        });
      })
      .then(function () { KB_ADMIN.toast("Foto disimpan.", "success"); modal.hide(); load(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); })
      .then(function () { btn.disabled = false; btn.innerHTML = old; });
  }

  function onDelete(g) {
    if (!confirm("Hapus foto ini secara permanen?")) return;
    KB_ADMIN.call("adminDeleteGallery", { id: g.id })
      .then(function () { KB_ADMIN.toast("Foto dihapus.", "success"); load(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); });
  }
})();
