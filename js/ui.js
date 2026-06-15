/* ============================================================================
   Koki Batak — ui.js
   Chrome bersama (navbar + footer) + util UI (toast, format Rupiah, gambar,
   reveal-on-scroll). Dirender via JS agar konsisten di semua halaman (tidak
   ada server-side include di GitHub Pages).
   Bergantung pada: KB_API (api.js).
   ============================================================================ */

(function () {
  "use strict";

  const PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f6efe6'/%3E%3Ctext x='50%25' y='50%25' fill='%239a8d83' font-family='sans-serif' font-size='18' text-anchor='middle' dominant-baseline='middle'%3EKoki Batak%3C/text%3E%3C/svg%3E";

  const NAV_ITEMS = [
    { key: "beranda", label: "Beranda", href: "index.html" },
    { key: "menu", label: "Menu", href: "menu.html" },
    { key: "galeri", label: "Galeri", href: "galeri.html" },
    { key: "testimoni", label: "Testimoni", href: "testimoni.html" },
    { key: "tentang", label: "Tentang", href: "tentang.html" },
    { key: "kontak", label: "Kontak", href: "kontak.html" },
  ];

  // ---- Util format & escape ----------------------------------------------
  const rupiahFmt = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  function money(n) {
    const num = Number(n) || 0;
    return rupiahFmt.format(num);
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // <img> aman untuk gambar Google Drive: WAJIB referrerpolicy="no-referrer".
  function img(fileIdOrUrl, alt, width) {
    const src = fileIdOrUrl ? KB_API.driveImg(fileIdOrUrl, width) : PLACEHOLDER;
    return (
      '<img src="' +
      escapeHtml(src) +
      '" alt="' +
      escapeHtml(alt || "") +
      '" loading="lazy" referrerpolicy="no-referrer" ' +
      "onerror=\"this.onerror=null;this.src='" +
      PLACEHOLDER +
      "'\">"
    );
  }

  // ---- Toast --------------------------------------------------------------
  function ensureToastWrap() {
    let w = document.querySelector(".toast-wrap");
    if (!w) {
      w = document.createElement("div");
      w.className = "toast-wrap";
      w.setAttribute("role", "status");
      w.setAttribute("aria-live", "polite");
      document.body.appendChild(w);
    }
    return w;
  }

  function toast(msg, type, ms) {
    const wrap = ensureToastWrap();
    const el = document.createElement("div");
    el.className = "toast" + (type ? " toast-" + type : "");
    el.textContent = msg;
    wrap.appendChild(el);
    const life = ms || 3600;
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 250);
    }, life);
  }

  // ---- Loading & state markup --------------------------------------------
  function skeletonCards(n) {
    let html = '<div class="card-grid">';
    for (let i = 0; i < (n || 6); i++) html += '<div class="skeleton skel-card"></div>';
    return html + "</div>";
  }

  function loader() {
    return '<div class="loader-center"><div class="spinner spinner-dark"></div></div>';
  }

  function stateMsg(title, sub) {
    return (
      '<div class="state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
      "<p><strong>" +
      escapeHtml(title) +
      "</strong></p>" +
      (sub ? "<p>" + escapeHtml(sub) + "</p>" : "") +
      "</div>"
    );
  }

  // ---- Settings (cache 1x per halaman) -----------------------------------
  let settingsPromise = null;
  function getSettings() {
    if (!settingsPromise) {
      settingsPromise = KB_API.get("getSettings").catch(function () {
        return {}; // jangan gagalkan halaman hanya karena footer
      });
    }
    return settingsPromise;
  }

  // ---- Render Navbar ------------------------------------------------------
  function renderNav(activeKey) {
    const mount = document.getElementById("site-nav");
    if (!mount) return;
    const links = NAV_ITEMS.map(function (it) {
      const active = it.key === activeKey ? " is-active" : "";
      return '<li><a class="' + active.trim() + '" href="' + it.href + '">' + it.label + "</a></li>";
    }).join("");

    mount.className = "site-nav";
    mount.innerHTML =
      '<div class="container nav-inner">' +
      '<a class="nav-brand" href="index.html">' +
      '<img src="assets/logo.png" alt="Logo Koki Batak" onerror="this.style.display=\'none\'">' +
      "<span>Koki Batak</span>" +
      "</a>" +
      '<ul class="nav-links" id="navLinks">' + links + "</ul>" +
      '<div class="nav-actions">' +
      '<a class="btn btn-outline btn-sm nav-admin-link" href="admin/">Admin</a>' +
      '<a class="btn btn-primary btn-sm nav-pesan" href="menu.html">Pesan Sekarang</a>' +
      '<button class="cart-btn" id="cartBtn" aria-label="Buka keranjang">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>' +
      '<span class="cart-count is-empty" id="cartCount">0</span>' +
      "</button>" +
      // Hamburger: terakhir di DOM -> paling kanan saat mobile.
      '<button class="nav-toggle" id="navToggle" aria-label="Buka menu" aria-expanded="false">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>";

    // Toggle menu mobile
    const toggle = document.getElementById("navToggle");
    const linksEl = document.getElementById("navLinks");
    if (toggle && linksEl) {
      toggle.addEventListener("click", function () {
        const open = linksEl.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      linksEl.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          linksEl.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Bayangan saat scroll
    const navEl = mount;
    const onScroll = function () {
      navEl.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Render Footer ------------------------------------------------------
  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;

    mount.className = "site-footer";
    mount.innerHTML =
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-col">' +
      '<div class="footer-brand"><img src="assets/logo.png" alt="Koki Batak" onerror="this.style.display=\'none\'"><strong>Koki Batak</strong></div>' +
      '<p id="footBio">Catering khas Batak untuk pesta adat, syukuran, dan acara spesial Anda.</p>' +
      '<div class="social-row" id="footSocial"></div>' +
      "</div>" +
      '<div class="footer-col"><h4>Navigasi</h4><ul>' +
      NAV_ITEMS.map(function (it) {
        return '<li><a href="' + it.href + '">' + it.label + "</a></li>";
      }).join("") +
      "</ul></div>" +
      '<div class="footer-col"><h4>Kontak</h4><ul id="footContact"><li class="text-muted">Memuat…</li></ul></div>' +
      "</div>" +
      '<div class="footer-bottom">© <span id="footYear"></span> Koki Batak. Seluruh hak cipta dilindungi.</div>' +
      "</div>";

    const y = document.getElementById("footYear");
    if (y) y.textContent = new Date().getFullYear();

    // Lengkapi data dinamis dari Settings
    getSettings().then(function (s) {
      s = s || {};
      const bio = document.getElementById("footBio");
      if (bio && s.business_info) bio.textContent = s.business_info;

      const contact = document.getElementById("footContact");
      if (contact) {
        const items = [];
        if (s.wa_admin_number) {
          items.push(
            '<li><a href="https://wa.me/' +
              escapeHtml(normalizeWa(s.wa_admin_number)) +
              '" target="_blank" rel="noopener">WhatsApp: ' +
              escapeHtml(s.wa_admin_number) +
              "</a></li>"
          );
        }
        if (s.address) items.push("<li>" + escapeHtml(s.address) + "</li>");
        contact.innerHTML = items.length ? items.join("") : '<li class="text-muted">—</li>';
      }

      const social = document.getElementById("footSocial");
      if (social) {
        let html = "";
        if (s.instagram_url) {
          html +=
            '<a href="' +
            escapeHtml(s.instagram_url) +
            '" target="_blank" rel="noopener" aria-label="Instagram">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>';
        }
        if (s.tiktok_url) {
          html +=
            '<a href="' +
            escapeHtml(s.tiktok_url) +
            '" target="_blank" rel="noopener" aria-label="TikTok">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.2 1.6 3.8 3.8 4v2.7c-1.4 0-2.7-.4-3.8-1.1v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3H16z"/></svg></a>';
        }
        social.innerHTML = html;
      }
    });
  }

  function normalizeWa(num) {
    // 08xx -> 628xx ; buang spasi/tanda
    let d = String(num).replace(/[^\d]/g, "");
    if (d.indexOf("0") === 0) d = "62" + d.slice(1);
    return d;
  }

  // ---- Reveal on scroll ---------------------------------------------------
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
  }

  // ---- Init ---------------------------------------------------------------
  function init() {
    const page = document.body.getAttribute("data-page") || "";
    renderNav(page);
    renderFooter();
    initReveal();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.KB_UI = {
    money: money,
    escape: escapeHtml,
    img: img,
    toast: toast,
    skeletonCards: skeletonCards,
    loader: loader,
    stateMsg: stateMsg,
    getSettings: getSettings,
    normalizeWa: normalizeWa,
    initReveal: initReveal,
    PLACEHOLDER: PLACEHOLDER,
  };
})();
