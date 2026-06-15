/* ============================================================================
   Koki Batak — admin-core.js
   Util bersama panel admin: token, pemanggilan API admin, navbar, format, toast.
   Bergantung pada: KB_API (../js/api.js).
   Catatan keamanan: UI admin BUKAN batas keamanan. Gerbang sebenarnya ada di
   backend GAS yang memverifikasi token HMAC pada SETIAP aksi admin.
   ============================================================================ */

(function () {
  "use strict";

  var TOKEN_KEY = "kb_admin_token";
  var EXP_KEY = "kb_admin_exp";
  var PROFILE_KEY = "kb_admin_profile";

  function getToken() {
    var exp = Number(sessionStorage.getItem(EXP_KEY) || 0);
    if (exp && Date.now() > exp) { clearToken(); return null; }
    return sessionStorage.getItem(TOKEN_KEY);
  }
  function setToken(t, ttlMs, profile) {
    sessionStorage.setItem(TOKEN_KEY, t);
    sessionStorage.setItem(EXP_KEY, String(Date.now() + (ttlMs || 8 * 3600 * 1000)));
    if (profile) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXP_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  }
  function getProfile() {
    try { return JSON.parse(sessionStorage.getItem(PROFILE_KEY) || "{}"); } catch (e) { return {}; }
  }
  function getName() { return getProfile().name || "Admin"; }
  function getRole() { return getProfile().role || "staff"; }
  function isOwner() { return getRole() === "owner"; }

  // Panggil endpoint admin (token disisipkan otomatis).
  function call(action, payload) {
    return KB_API.post(action, Object.assign({ token: getToken() }, payload || {})).catch(function (err) {
      if (/sesi admin/i.test(err.message || "")) {
        clearToken();
        location.href = "index.html?expired=1";
      }
      throw err;
    });
  }

  function requireAuth() {
    if (!getToken()) {
      location.href = "index.html";
      return false;
    }
    return true;
  }

  function logout() {
    clearToken();
    location.href = "index.html";
  }

  // ---- Util format --------------------------------------------------------
  var rupiahFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  function money(n) { return rupiahFmt.format(Number(n) || 0); }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function img(fileIdOrUrl, alt, w) {
    var src = fileIdOrUrl ? KB_API.driveImg(fileIdOrUrl, w || 200) : "";
    var ph = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23eee'/%3E%3C/svg%3E";
    if (!src) src = ph;
    return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt || "") + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + ph + '\'">';
  }

  // ---- Toast (Bootstrap-less, ringan) ------------------------------------
  function toast(msg, type) {
    var wrap = document.getElementById("kbToastWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "kbToastWrap";
      wrap.className = "position-fixed bottom-0 start-50 translate-middle-x p-3";
      wrap.style.zIndex = "1090";
      document.body.appendChild(wrap);
    }
    var bg = type === "error" ? "text-bg-danger" : type === "success" ? "text-bg-success" : "text-bg-dark";
    var el = document.createElement("div");
    el.className = "toast align-items-center border-0 show " + bg;
    el.role = "alert";
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + escapeHtml(msg) + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Tutup"></button></div>';
    wrap.appendChild(el);
    el.querySelector(".btn-close").addEventListener("click", function () { el.remove(); });
    setTimeout(function () { el.remove(); }, 4200);
  }

  // ---- Navbar admin -------------------------------------------------------
  var NAV = [
    { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { key: "pesanan", label: "Pesanan", href: "pesanan.html" },
    { key: "paket", label: "Paket", href: "paket.html" },
    { key: "galeri", label: "Galeri", href: "galeri.html" },
    { key: "testimoni", label: "Testimoni", href: "testimoni.html" },
    { key: "pengaturan", label: "Pengaturan", href: "pengaturan.html" },
  ];

  function renderNav(active) {
    var mount = document.getElementById("adminNav");
    if (!mount) return;
    var links = NAV.map(function (n) {
      return '<li class="nav-item"><a class="nav-link' + (n.key === active ? " active fw-semibold" : "") + '" href="' + n.href + '">' + n.label + "</a></li>";
    }).join("");
    mount.innerHTML =
      '<nav class="navbar navbar-expand-lg navbar-dark sticky-top" style="background:#9e1b1b">' +
      '<div class="container-fluid">' +
      '<a class="navbar-brand d-flex align-items-center gap-2" href="dashboard.html">' +
      '<img src="../assets/logo.png" alt="" height="34" onerror="this.style.display=\'none\'"><span>Koki Batak <small class="opacity-75">Admin</small></span></a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavItems"><span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="adminNavItems">' +
      '<ul class="navbar-nav me-auto mb-2 mb-lg-0">' + links + "</ul>" +
      '<div class="dropdown">' +
      '<button class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>' +
      "<span>" + escapeHtml(getName()) + "</span></button>" +
      '<ul class="dropdown-menu dropdown-menu-end">' +
      '<li><span class="dropdown-item-text small text-muted">' + escapeHtml(getName()) + " · " + (isOwner() ? "Owner" : "Staff") + "</span></li>" +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><a class="dropdown-item" href="profil.html">Profil &amp; Ganti Password</a></li>' +
      (isOwner() ? '<li><a class="dropdown-item" href="admin.html">Kelola Admin</a></li>' : "") +
      '<li><a class="dropdown-item" href="../index.html" target="_blank">Lihat Situs</a></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button class="dropdown-item text-danger" id="btnLogout">Keluar</button></li>' +
      "</ul></div>" +
      "</div></div></nav>";
    var lo = document.getElementById("btnLogout");
    if (lo) lo.addEventListener("click", logout);
  }

  // ---- Status pesanan (label + warna badge Bootstrap) --------------------
  var STATUSES = ["baru", "dikonfirmasi", "diproses", "selesai", "dibatalkan"];
  var STATUS_META = {
    baru: { label: "Baru", cls: "text-bg-secondary" },
    dikonfirmasi: { label: "Dikonfirmasi", cls: "text-bg-info" },
    diproses: { label: "Diproses", cls: "text-bg-warning" },
    selesai: { label: "Selesai", cls: "text-bg-success" },
    dibatalkan: { label: "Dibatalkan", cls: "text-bg-danger" },
  };
  function statusBadge(status) {
    var m = STATUS_META[status] || { label: status || "-", cls: "text-bg-light" };
    return '<span class="badge ' + m.cls + '">' + escapeHtml(m.label) + "</span>";
  }

  window.KB_ADMIN = {
    STATUSES: STATUSES,
    STATUS_META: STATUS_META,
    statusBadge: statusBadge,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    getProfile: getProfile,
    getName: getName,
    getRole: getRole,
    isOwner: isOwner,
    call: call,
    requireAuth: requireAuth,
    logout: logout,
    money: money,
    escape: escapeHtml,
    img: img,
    toast: toast,
    renderNav: renderNav,
    driveImg: KB_API ? KB_API.driveImg : null,
  };
})();
