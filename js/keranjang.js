/* ============================================================================
   Koki Batak — keranjang.js (Keranjang + Checkout)
   Alur inti: render keranjang -> isi form -> POST submitOrder -> buka WhatsApp.
   Harga dihitung ulang di server; di sini hanya untuk tampilan.
   ============================================================================ */

(function () {
  "use strict";

  var wrap;
  var mode = null; // 'empty' | 'checkout' | 'success'

  document.addEventListener("DOMContentLoaded", function () {
    wrap = document.getElementById("checkoutWrap");
    render();
    // Sinkron dengan perubahan dari drawer keranjang.
    document.addEventListener("kb-cart-change", function () {
      if (mode !== "success") render();
    });
  });

  function render() {
    var items = KB_CART.items();
    if (!items.length) {
      renderEmpty();
      return;
    }
    if (mode !== "checkout") renderShell();
    updateCartView();
  }

  function renderEmpty() {
    mode = "empty";
    wrap.innerHTML =
      '<div class="card success-box">' +
      KB_UI.stateMsg("Keranjang Anda kosong.", "Tambahkan paket dari menu untuk mulai memesan.") +
      '<a href="menu.html" class="btn btn-primary">Lihat Menu</a>' +
      "</div>";
  }

  function renderShell() {
    mode = "checkout";
    var todayStr = new Date().toISOString().slice(0, 10);
    wrap.innerHTML =
      '<div class="checkout-layout">' +
      // Kiri: daftar item
      '<div class="card">' +
      "<h3>Pesanan Anda</h3>" +
      '<div id="coItems"></div>' +
      '<div class="cart-total-row mt-4"><span class="label">Total Perkiraan</span><span class="amount" id="coTotal"></span></div>' +
      '<p class="text-muted" style="font-size:.85rem">*Total final (termasuk ongkir bila ada) dikonfirmasi admin via WhatsApp.</p>' +
      "</div>" +
      // Kanan: form
      '<form class="card checkout-form" id="orderForm" novalidate>' +
      "<h3>Data Pemesanan</h3>" +
      '<div class="form-grid">' +
      field("customer_name", "Nama Pemesan", "text", true, "Nama lengkap Anda") +
      field("phone", "No. WhatsApp / HP", "tel", true, "0812xxxxxxxx") +
      '<div class="form-grid cols-2">' +
      field("event_date", "Tanggal Acara", "date", false, "", todayStr) +
      field("servings", "Jumlah Porsi", "number", false, "Mis. 50") +
      "</div>" +
      fieldArea("address", "Alamat Pengantaran", false, "Alamat lengkap lokasi acara") +
      fieldArea("notes", "Catatan", false, "Permintaan khusus, mis. tanpa babi, level pedas, dll.") +
      // Honeypot anti-spam (tersembunyi)
      '<div class="hp-field" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>' +
      "</div>" +
      '<button type="submit" class="btn btn-primary btn-block btn-lg mt-4" id="submitBtn">Pesan &amp; Lanjut ke WhatsApp</button>' +
      '<p class="text-muted text-center mt-4" style="font-size:.82rem">Pesanan disimpan, lalu Anda diarahkan ke WhatsApp admin untuk konfirmasi.</p>' +
      "</form>" +
      "</div>";

    document.getElementById("orderForm").addEventListener("submit", onSubmit);
  }

  function field(name, label, type, required, placeholder, min) {
    return (
      '<div class="field" data-field="' + name + '">' +
      "<label>" + label + (required ? ' <span class="req">*</span>' : "") + "</label>" +
      '<input type="' + type + '" name="' + name + '"' +
      (placeholder ? ' placeholder="' + placeholder + '"' : "") +
      (min ? ' min="' + min + '"' : "") +
      (required ? " required" : "") +
      (type === "number" ? ' min="1"' : "") +
      " />" +
      '<span class="err-msg"></span>' +
      "</div>"
    );
  }

  function fieldArea(name, label, required, placeholder) {
    return (
      '<div class="field" data-field="' + name + '">' +
      "<label>" + label + (required ? ' <span class="req">*</span>' : "") + "</label>" +
      '<textarea name="' + name + '" rows="3" placeholder="' + placeholder + '"></textarea>' +
      '<span class="err-msg"></span>' +
      "</div>"
    );
  }

  function updateCartView() {
    var box = document.getElementById("coItems");
    var totalEl = document.getElementById("coTotal");
    if (!box) return;
    var items = KB_CART.items();

    box.innerHTML = items
      .map(function (it) {
        return (
          '<div class="order-item" data-id="' + KB_UI.escape(it.id) + '">' +
          KB_UI.img(it.image, it.name, 160) +
          '<div class="order-item-main">' +
          '<div class="order-item-name">' + KB_UI.escape(it.name) + "</div>" +
          '<div class="cart-item-price">' + KB_UI.money(it.price) + " / paket</div>" +
          '<div class="qty" style="margin-top:8px">' +
          '<button type="button" data-act="dec" aria-label="Kurangi">−</button>' +
          "<span>" + it.qty + "</span>" +
          '<button type="button" data-act="inc" aria-label="Tambah">+</button>' +
          "</div>" +
          "</div>" +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">' +
          '<span class="order-item-sub">' + KB_UI.money(it.price * it.qty) + "</span>" +
          '<button type="button" class="icon-btn" data-act="del" aria-label="Hapus">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>' +
          "</button>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    if (totalEl) totalEl.textContent = KB_UI.money(KB_CART.total());

    box.querySelectorAll(".order-item").forEach(function (row) {
      var id = row.getAttribute("data-id");
      row.querySelectorAll("button[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var act = btn.getAttribute("data-act");
          var current = KB_CART.items().find(function (c) { return c.id === id; });
          if (!current) return;
          if (act === "inc") KB_CART.setQty(id, current.qty + 1);
          else if (act === "dec") KB_CART.setQty(id, current.qty - 1);
          else if (act === "del") KB_CART.remove(id);
        });
      });
    });
  }

  function setError(form, name, msg) {
    var f = form.querySelector('[data-field="' + name + '"]');
    if (!f) return;
    f.classList.toggle("has-error", !!msg);
    var span = f.querySelector(".err-msg");
    if (span) span.textContent = msg || "";
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var btn = document.getElementById("submitBtn");

    var payload = {
      customer_name: form.customer_name.value.trim(),
      phone: form.phone.value.trim(),
      event_date: form.event_date.value,
      servings: form.servings.value,
      address: form.address.value.trim(),
      notes: form.notes.value.trim(),
      website: form.website.value, // honeypot
      items: KB_CART.items().map(function (it) { return { id: it.id, qty: it.qty }; }),
    };

    // Validasi sederhana di klien (server tetap validasi ulang).
    var hasError = false;
    setError(form, "customer_name", "");
    setError(form, "phone", "");
    if (!payload.customer_name) { setError(form, "customer_name", "Nama wajib diisi."); hasError = true; }
    if (!payload.phone) { setError(form, "phone", "Nomor WhatsApp/HP wajib diisi."); hasError = true; }
    else if (payload.phone.replace(/[^\d]/g, "").length < 8) { setError(form, "phone", "Nomor tidak valid."); hasError = true; }
    if (!payload.items.length) { KB_UI.toast("Keranjang kosong.", "error"); hasError = true; }
    if (hasError) return;

    btn.disabled = true;
    var oldHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Memproses…';

    KB_API.post("submitOrder", payload)
      .then(function (res) {
        KB_CART.clear();
        showSuccess(res);
      })
      .catch(function (err) {
        KB_UI.toast(err.message || "Gagal mengirim pesanan.", "error", 5000);
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      });
  }

  function showSuccess(res) {
    mode = "success";
    var tpl = document.getElementById("successTpl");
    var node = tpl.content.cloneNode(true);
    node.querySelector("[data-code]").textContent = res.order_code || "-";
    var wa = node.querySelector("[data-wa]");
    if (wa && res.wa_url) wa.setAttribute("href", res.wa_url);

    wrap.innerHTML = "";
    wrap.appendChild(node);
    KB_UI.initReveal();
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Coba buka WhatsApp otomatis (bisa diblokir popup -> tombol tetap tersedia).
    if (res.wa_url) {
      try { window.open(res.wa_url, "_blank"); } catch (e) { /* abaikan */ }
    }
  }
})();
