/* ============================================================================
   Koki Batak — home.js (Beranda)
   Memuat teks hero dari Settings + paket terlaris & diskon.
   ============================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initHeroText();
    loadSection("bestsellerGrid", "bestsellerSection", function () { return KB_API.get("getBestsellers"); });
    loadSection("discountGrid", "discountSection", function () { return KB_API.get("getDiscounted"); });
  });

  function initHeroText() {
    KB_UI.getSettings().then(function (s) {
      if (!s) return;
      if (s.hero_title) {
        var t = document.getElementById("heroTitle");
        if (t) t.textContent = s.hero_title;
      }
      if (s.hero_subtitle) {
        var sub = document.getElementById("heroSubtitle");
        if (sub) sub.textContent = s.hero_subtitle;
      }
    });
  }

  function loadSection(gridId, sectionId, fetcher) {
    var grid = document.getElementById(gridId);
    var section = document.getElementById(sectionId);
    if (!grid) return;
    grid.innerHTML = KB_UI.skeletonCards(3);

    fetcher()
      .then(function (list) {
        if (!list || !list.length) {
          // Sembunyikan section bila kosong agar beranda tetap rapi.
          if (section) section.classList.add("is-hidden");
          return;
        }
        KB_PKG.render(grid, list);
      })
      .catch(function (err) {
        grid.innerHTML = KB_UI.stateMsg("Gagal memuat paket.", err.message);
      });
  }
})();
