/* Koki Batak — admin-paket.js : CRUD paket + upload gambar ke Drive */
(function () {
  "use strict";

  var all = [];
  var modal = null;
  var pendingImage = null; // { base64, mime, filename }
  var MAX_BYTES = 3 * 1024 * 1024;

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("paket");
    modal = new bootstrap.Modal(document.getElementById("pkgModal"));

    document.getElementById("addBtn").addEventListener("click", function () { openForm(null); });
    document.getElementById("pkgForm").addEventListener("submit", onSave);
    document.getElementById("imgFile").addEventListener("change", onFile);
    load();
  });

  function load() {
    var body = document.getElementById("pkgBody");
    body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm"></div> Memuat…</td></tr>';
    Promise.all([KB_ADMIN.call("adminListPackages"), KB_API.get("getSettings")])
      .then(function (res) {
        all = res[0] || [];
        var cats = (res[1] && res[1].categories) || [];
        document.getElementById("catList").innerHTML = cats.map(function (c) { return '<option value="' + KB_ADMIN.escape(c) + '">'; }).join("");
        render();
      })
      .catch(function (err) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">' + KB_ADMIN.escape(err.message) + "</td></tr>";
      });
  }

  function render() {
    var body = document.getElementById("pkgBody");
    if (!all.length) {
      body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada paket. Klik "Tambah Paket".</td></tr>';
      return;
    }
    body.innerHTML = all
      .map(function (p, i) {
        var disc = p.is_discounted ? KB_ADMIN.money(p.discount_price) + ' <span class="badge text-bg-danger">-' + p.discount_percent + "%</span>" : '<span class="text-muted">—</span>';
        var flags = "";
        if (p.is_bestseller) flags += '<span class="badge text-bg-warning me-1">Terlaris</span>';
        if (!p.is_active) flags += '<span class="badge text-bg-secondary">Nonaktif</span>';
        return (
          '<tr class="' + (p.is_active ? "" : "opacity-50") + '">' +
          '<td class="thumb-cell">' + KB_ADMIN.img(p.image, p.name, 120) + "</td>" +
          "<td>" + KB_ADMIN.escape(p.name) + "<br>" + flags + "</td>" +
          '<td class="small">' + KB_ADMIN.escape(p.category || "-") + "</td>" +
          "<td>" + KB_ADMIN.money(p.price) + "</td>" +
          "<td>" + disc + "</td>" +
          '<td class="small">' + KB_ADMIN.escape(p.discount_label || "-") + "</td>" +
          '<td class="text-nowrap">' +
          '<button class="btn btn-sm btn-outline-secondary" data-edit="' + i + '">Edit</button> ' +
          '<button class="btn btn-sm btn-outline-danger" data-del="' + i + '">Hapus</button>' +
          "</td></tr>"
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

  function openForm(p) {
    pendingImage = null;
    var f = document.getElementById("pkgForm");
    f.reset();
    document.getElementById("imgFile").value = "";
    document.getElementById("pkgModalTitle").textContent = p ? "Edit Paket" : "Tambah Paket";

    var prev = document.getElementById("imgPreview");
    f.id.value = p ? p.id : "";
    f.name.value = p ? p.name : "";
    f.sku.value = p ? p.sku || "" : "";
    f.category.value = p ? p.category || "" : "";
    f.sort_order.value = p ? p.sort_order || 100 : 100;
    f.description.value = p ? p.description || "" : "";
    f.price.value = p ? p.price : "";
    f.discount_price.value = p && p.discount_price ? p.discount_price : "";
    f.discount_label.value = p ? p.discount_label || "" : "";
    f.is_bestseller.checked = p ? !!p.is_bestseller : false;
    f.is_active.checked = p ? !!p.is_active : true;
    f.image_drive_id.value = p ? p.image_drive_id || "" : "";

    if (p && p.image) {
      prev.src = KB_ADMIN.driveImg(p.image, 240);
      prev.style.display = "block";
    } else {
      prev.style.display = "none";
      prev.src = "";
    }
    modal.show();
  }

  function onFile() {
    var file = document.getElementById("imgFile").files[0];
    if (!file) { pendingImage = null; return; }
    if (file.size > MAX_BYTES) {
      KB_ADMIN.toast("Ukuran gambar terlalu besar (maks 3 MB).", "error");
      document.getElementById("imgFile").value = "";
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      pendingImage = { base64: reader.result, mime: file.type, filename: file.name };
      var prev = document.getElementById("imgPreview");
      prev.src = reader.result;
      prev.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  function onSave(e) {
    e.preventDefault();
    var f = e.target;
    if (!f.name.value.trim()) { KB_ADMIN.toast("Nama paket wajib diisi.", "error"); return; }
    if (!f.price.value) { KB_ADMIN.toast("Harga wajib diisi.", "error"); return; }

    var btn = document.getElementById("pkgSaveBtn");
    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan…';

    // 1) Upload gambar dulu (bila ada), lalu 2) simpan paket.
    var step = pendingImage
      ? KB_ADMIN.call("adminUploadImage", pendingImage).then(function (r) { return r.id; })
      : Promise.resolve(f.image_drive_id.value || "");

    step
      .then(function (driveId) {
        return KB_ADMIN.call("adminSavePackage", {
          id: f.id.value || "",
          name: f.name.value.trim(),
          sku: f.sku.value.trim(),
          category: f.category.value.trim(),
          sort_order: f.sort_order.value,
          description: f.description.value.trim(),
          price: f.price.value,
          discount_price: f.discount_price.value === "" ? "" : f.discount_price.value,
          discount_label: f.discount_label.value.trim(),
          is_bestseller: f.is_bestseller.checked,
          is_active: f.is_active.checked,
          image_drive_id: driveId,
        });
      })
      .then(function () {
        KB_ADMIN.toast("Paket disimpan.", "success");
        modal.hide();
        load();
      })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); })
      .then(function () { btn.disabled = false; btn.innerHTML = old; });
  }

  function onDelete(p) {
    if (!confirm('Nonaktifkan paket "' + p.name + '"? Paket akan disembunyikan dari situs.')) return;
    KB_ADMIN.call("adminDeletePackage", { id: p.id })
      .then(function () { KB_ADMIN.toast("Paket dinonaktifkan.", "success"); load(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); });
  }
})();
