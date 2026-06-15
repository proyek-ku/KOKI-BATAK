/* ============================================================================
   Koki Batak — galeri.js
   Memuat galeri (getGallery) + lightbox sederhana.
   ============================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("galleryGrid");
    grid.innerHTML = KB_UI.loader();

    KB_API.get("getGallery")
      .then(function (list) {
        if (!list || !list.length) {
          grid.innerHTML = KB_UI.stateMsg("Galeri masih kosong.", "Foto akan segera ditambahkan.");
          return;
        }
        grid.className = "gallery-grid";
        grid.innerHTML = list
          .map(function (g) {
            return (
              '<figure class="gallery-item reveal" data-full="' +
              KB_UI.escape(KB_API.driveImg(g.image, 1400)) +
              '" data-cap="' + KB_UI.escape(g.caption || g.title || "") + '">' +
              KB_UI.img(g.image, g.title || "Foto galeri", 600) +
              (g.caption || g.title
                ? '<figcaption class="gallery-cap">' + KB_UI.escape(g.caption || g.title) + "</figcaption>"
                : "") +
              "</figure>"
            );
          })
          .join("");

        KB_UI.initReveal();
        wireLightbox(grid);
      })
      .catch(function (err) {
        grid.innerHTML = KB_UI.stateMsg("Gagal memuat galeri.", err.message);
      });
  });

  function wireLightbox(grid) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="icon-btn lightbox-close" aria-label="Tutup">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>' +
      '</button><img alt="Pratinjau galeri" referrerpolicy="no-referrer" />';
    document.body.appendChild(lb);
    var imgEl = lb.querySelector("img");

    function open(src) {
      imgEl.src = src;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      imgEl.src = "";
    }

    grid.querySelectorAll(".gallery-item").forEach(function (fig) {
      fig.addEventListener("click", function () { open(fig.getAttribute("data-full")); });
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest(".lightbox-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }
})();
