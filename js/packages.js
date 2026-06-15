/* ============================================================================
   Koki Batak — packages.js
   Modul bersama untuk merender kartu paket (dipakai di beranda & menu).
   Bergantung pada: KB_UI (ui.js), KB_CART (cart.js).
   ============================================================================ */

(function () {
  "use strict";

  function cardHTML(p) {
    var esc = KB_UI.escape;
    var badges = "";
    if (p.is_bestseller) badges += '<span class="badge badge-bestseller">★ Terlaris</span>';
    if (p.is_discounted) badges += '<span class="badge badge-discount">-' + p.discount_percent + "%</span>";

    var price = p.is_discounted
      ? '<span class="now">' + KB_UI.money(p.effective_price) + '</span><span class="was">' + KB_UI.money(p.price) + "</span>"
      : '<span class="now">' + KB_UI.money(p.price) + "</span>";

    return (
      '<article class="pkg-card reveal" data-id="' + esc(p.id) + '">' +
      '<div class="pkg-thumb">' +
      KB_UI.img(p.image, p.name) +
      (badges ? '<div class="pkg-badges">' + badges + "</div>" : "") +
      "</div>" +
      '<div class="pkg-body">' +
      (p.category ? '<div class="pkg-cat">' + esc(p.category) + "</div>" : "") +
      '<h3 class="pkg-name">' + esc(p.name) + "</h3>" +
      '<p class="pkg-desc">' + esc(p.description || "") + "</p>" +
      '<div class="pkg-foot">' +
      '<div class="pkg-price">' + price + "</div>" +
      '<button class="btn btn-primary btn-sm" data-add="' + esc(p.id) + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Tambah</button>' +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function render(container, list) {
    if (!container) return;
    if (!list || !list.length) {
      container.className = "";
      container.innerHTML = KB_UI.stateMsg("Belum ada paket.", "Paket akan segera ditampilkan.");
      return;
    }
    container.className = "card-grid";
    container.innerHTML = list.map(cardHTML).join("");

    var byId = {};
    list.forEach(function (p) { byId[p.id] = p; });
    container.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = byId[btn.getAttribute("data-add")];
        if (p) KB_CART.add({ id: p.id, name: p.name, price: p.effective_price, image: p.image });
      });
    });

    KB_UI.initReveal();
  }

  window.KB_PKG = { render: render, cardHTML: cardHTML };
})();
