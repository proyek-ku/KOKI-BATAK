/* ============================================================================
   Koki Batak — cart.js
   Keranjang multi-item berbasis localStorage + drawer samping + badge jumlah.
   Item: { id, name, price, image, qty }  (price = harga efektif/setelah diskon)
   Memancarkan event "kb-cart-change" agar halaman lain (mis. keranjang) ikut update.
   Bergantung pada: KB_UI (ui.js).
   ============================================================================ */

(function () {
  "use strict";

  const KEY = "kb_cart_v1";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      /* storage penuh / diblokir: abaikan */
    }
    emit();
  }

  let cart = load();

  function emit() {
    updateBadge();
    renderDrawer();
    document.dispatchEvent(new CustomEvent("kb-cart-change", { detail: { items: cart } }));
  }

  // ---- API publik ---------------------------------------------------------
  function items() {
    return cart.slice();
  }

  function count() {
    return cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  }

  function total() {
    return cart.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  }

  function add(item, qty) {
    const q = Math.max(1, Number(qty) || 1);
    const found = cart.find((c) => c.id === item.id);
    if (found) {
      found.qty += q;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        image: item.image || "",
        qty: q,
      });
    }
    save(cart);
    if (window.KB_UI) KB_UI.toast(item.name + " ditambahkan ke keranjang.", "success");
  }

  function setQty(id, qty) {
    const q = Number(qty) || 0;
    const it = cart.find((c) => c.id === id);
    if (!it) return;
    if (q <= 0) {
      remove(id);
      return;
    }
    it.qty = q;
    save(cart);
  }

  function remove(id) {
    cart = cart.filter((c) => c.id !== id);
    save(cart);
  }

  function clear() {
    cart = [];
    save(cart);
  }

  // ---- Badge --------------------------------------------------------------
  function updateBadge() {
    const el = document.getElementById("cartCount");
    if (!el) return;
    const n = count();
    el.textContent = n;
    el.classList.toggle("is-empty", n === 0);
  }

  // ---- Drawer -------------------------------------------------------------
  let overlay, drawer;

  function buildDrawer() {
    if (document.getElementById("cartDrawer")) {
      overlay = document.getElementById("cartOverlay");
      drawer = document.getElementById("cartDrawer");
      return;
    }
    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "cartOverlay";

    drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.id = "cartDrawer";
    drawer.setAttribute("aria-label", "Keranjang belanja");
    drawer.innerHTML =
      '<div class="drawer-head"><h3>Keranjang</h3>' +
      '<button class="icon-btn" id="cartClose" aria-label="Tutup keranjang">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      "</button></div>" +
      '<div class="drawer-body" id="cartBody"></div>' +
      '<div class="drawer-foot" id="cartFoot"></div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener("click", closeDrawer);
    drawer.querySelector("#cartClose").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    renderDrawer();
  }

  function renderDrawer() {
    const body = document.getElementById("cartBody");
    const foot = document.getElementById("cartFoot");
    if (!body || !foot) return;

    if (!cart.length) {
      body.innerHTML =
        '<div class="state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg><p>Keranjang masih kosong.</p></div>';
      foot.innerHTML = '<a href="menu.html" class="btn btn-outline btn-block">Lihat Menu</a>';
      return;
    }

    const esc = KB_UI.escape;
    body.innerHTML = cart
      .map(function (it) {
        return (
          '<div class="cart-item" data-id="' +
          esc(it.id) +
          '">' +
          KB_UI.img(it.image, it.name, 120) +
          '<div class="cart-item-info">' +
          '<div class="cart-item-name">' +
          esc(it.name) +
          "</div>" +
          '<div class="cart-item-price">' +
          KB_UI.money(it.price) +
          "</div>" +
          '<div class="qty" style="margin-top:6px">' +
          '<button data-act="dec" aria-label="Kurangi">−</button>' +
          "<span>" +
          it.qty +
          "</span>" +
          '<button data-act="inc" aria-label="Tambah">+</button>' +
          "</div>" +
          "</div>" +
          '<button class="icon-btn" data-act="del" aria-label="Hapus">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>' +
          "</button>" +
          "</div>"
        );
      })
      .join("");

    foot.innerHTML =
      '<div class="cart-total-row"><span class="label">Total</span><span class="amount">' +
      KB_UI.money(total()) +
      "</span></div>" +
      '<a href="keranjang.html" class="btn btn-primary btn-block">Lanjut ke Pemesanan</a>';

    // Wiring tombol qty/hapus
    body.querySelectorAll(".cart-item").forEach(function (row) {
      const id = row.getAttribute("data-id");
      row.querySelectorAll("button[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const act = btn.getAttribute("data-act");
          const it = cart.find((c) => c.id === id);
          if (!it) return;
          if (act === "inc") setQty(id, it.qty + 1);
          else if (act === "dec") setQty(id, it.qty - 1);
          else if (act === "del") remove(id);
        });
      });
    });
  }

  function openDrawer() {
    buildDrawer();
    renderDrawer();
    overlay.classList.add("is-open");
    drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (overlay) overlay.classList.remove("is-open");
    if (drawer) drawer.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // ---- Init ---------------------------------------------------------------
  function init() {
    buildDrawer();
    updateBadge();
    const btn = document.getElementById("cartBtn");
    if (btn) btn.addEventListener("click", openDrawer);
  }

  document.addEventListener("DOMContentLoaded", init);

  window.KB_CART = {
    items: items,
    count: count,
    total: total,
    add: add,
    setQty: setQty,
    remove: remove,
    clear: clear,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
  };
})();
