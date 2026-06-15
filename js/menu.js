/* ============================================================================
   Koki Batak — menu.js (Katalog)
   Memuat seluruh paket aktif + filter kategori + pencarian (client-side).
   ============================================================================ */

(function () {
  "use strict";

  var all = [];
  var activeCat = "";
  var keyword = "";

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("menuGrid");
    grid.innerHTML = KB_UI.skeletonCards(6);

    Promise.all([KB_API.get("getPackages"), KB_UI.getSettings()])
      .then(function (res) {
        all = res[0] || [];
        var settings = res[1] || {};
        // Catatan: getSettings selalu mengembalikan array; [] itu truthy, jadi
        // cek .length agar fallback derive-dari-paket tetap jalan saat kosong.
        var cats = (settings.categories && settings.categories.length) ? settings.categories : deriveCategories(all);
        buildChips(cats);
        wireSearch();
        applyFilter();
      })
      .catch(function (err) {
        grid.innerHTML = KB_UI.stateMsg("Gagal memuat menu.", err.message);
      });
  });

  function deriveCategories(list) {
    var seen = {};
    list.forEach(function (p) { if (p.category) seen[p.category] = true; });
    return Object.keys(seen);
  }

  function buildChips(categories) {
    var wrap = document.getElementById("categoryChips");
    var chips = ['<button class="chip is-active" data-cat="">Semua</button>'];
    categories.forEach(function (c) {
      chips.push('<button class="chip" data-cat="' + KB_UI.escape(c) + '">' + KB_UI.escape(c) + "</button>");
    });
    wrap.innerHTML = chips.join("");
    wrap.querySelectorAll(".chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        wrap.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        activeCat = btn.getAttribute("data-cat");
        applyFilter();
      });
    });
  }

  function wireSearch() {
    var input = document.getElementById("searchInput");
    input.addEventListener("input", function () {
      keyword = input.value.trim().toLowerCase();
      applyFilter();
    });
  }

  function applyFilter() {
    var grid = document.getElementById("menuGrid");
    var list = all.filter(function (p) {
      var okCat = !activeCat || String(p.category) === activeCat;
      var okKey = !keyword ||
        String(p.name).toLowerCase().indexOf(keyword) > -1 ||
        String(p.description || "").toLowerCase().indexOf(keyword) > -1;
      return okCat && okKey;
    });
    if (!list.length) {
      grid.className = "";
      grid.innerHTML = KB_UI.stateMsg("Tidak ada paket yang cocok.", "Coba kata kunci atau kategori lain.");
      return;
    }
    KB_PKG.render(grid, list);
  }
})();
