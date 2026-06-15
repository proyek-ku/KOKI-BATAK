/* ============================================================================
   Koki Batak — kontak.js
   Mengisi info kontak, WhatsApp, media sosial, dan peta dari Settings.
   ============================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    KB_UI.getSettings()
      .then(render)
      .catch(function () { render({}); });
  });

  function iconLi(svg, label, valueHtml) {
    return (
      "<li><span class=\"ico\">" + svg + "</span><div><strong>" + label + "</strong><br>" + valueHtml + "</div></li>"
    );
  }

  function render(s) {
    s = s || {};
    var esc = KB_UI.escape;
    var info = document.getElementById("contactInfo");
    var items = [];

    if (s.wa_admin_number) {
      var wa = KB_UI.normalizeWa(s.wa_admin_number);
      items.push(
        iconLi(
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2z"/></svg>',
          "WhatsApp",
          '<a href="https://wa.me/' + esc(wa) + '" target="_blank" rel="noopener">' + esc(s.wa_admin_number) + "</a>"
        )
      );
    }
    if (s.address) {
      items.push(
        iconLi(
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
          "Alamat",
          esc(s.address)
        )
      );
    }
    items.push(
      iconLi(
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        "Jam Operasional",
        "Setiap hari, 08.00 – 20.00 WIB"
      )
    );
    info.innerHTML = items.join("") || '<li class="text-muted">Informasi kontak belum tersedia.</li>';

    // Tombol WhatsApp utama
    var cta = document.getElementById("waCta");
    if (s.wa_admin_number) {
      cta.setAttribute(
        "href",
        "https://wa.me/" + KB_UI.normalizeWa(s.wa_admin_number) +
          "?text=" + encodeURIComponent("Halo Koki Batak, saya ingin bertanya tentang catering.")
      );
    } else {
      cta.classList.add("is-hidden");
    }

    // Media sosial
    var social = document.getElementById("contactSocial");
    var sHtml = "";
    if (s.instagram_url) {
      sHtml +=
        '<a href="' + esc(s.instagram_url) + '" target="_blank" rel="noopener" aria-label="Instagram">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>';
    }
    if (s.tiktok_url) {
      sHtml +=
        '<a href="' + esc(s.tiktok_url) + '" target="_blank" rel="noopener" aria-label="TikTok">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.2 1.6 3.8 3.8 4v2.7c-1.4 0-2.7-.4-3.8-1.1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3H16z"/></svg></a>';
    }
    social.innerHTML = sHtml || '<span class="text-muted" style="font-size:.9rem">Belum ada media sosial.</span>';

    // Peta
    var mapWrap = document.getElementById("mapWrap");
    if (s.maps_url) {
      mapWrap.innerHTML =
        '<iframe src="' + esc(s.maps_url) + '" style="border:0;width:100%;height:100%;min-height:320px" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Peta lokasi Koki Batak"></iframe>';
    } else {
      mapWrap.innerHTML = KB_UI.stateMsg("Peta lokasi belum tersedia.", "Lokasi akan ditampilkan di sini.");
    }
  }
})();
