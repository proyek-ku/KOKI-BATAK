/* ============================================================================
   Koki Batak — api.js
   Wrapper komunikasi ke backend Google Apps Script (Web App JSON).

   Strategi CORS (sudah diverifikasi pada perencanaan):
   - READ  (GET) : "simple request" biasa. Jika browser memblokir pembacaan
                    respons cross-origin, set KB_CONFIG.USE_JSONP_FOR_GET = true
                    untuk fallback JSONP (?callback=).
   - WRITE (POST): Content-Type "text/plain" => "simple request" => TIDAK memicu
                    preflight CORS. Body = JSON string. Backend membaca
                    e.postData.contents lalu JSON.parse.
   Envelope respons: { ok:true, data:... } atau { ok:false, error:"pesan" }.
   ============================================================================ */

(function () {
  "use strict";

  const CFG = window.KB_CONFIG || {};
  const BASE = CFG.API_BASE_URL;

  function assertConfigured() {
    if (!BASE || BASE === "GANTI_DENGAN_URL_WEB_APP_GAS") {
      throw new Error(
        "API belum dikonfigurasi. Isi API_BASE_URL di js/config.js dengan URL Web App GAS Anda."
      );
    }
  }

  function buildUrl(action, params) {
    const u = new URL(BASE);
    u.searchParams.set("action", action);
    if (params) {
      Object.keys(params).forEach((k) => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
          u.searchParams.set(k, params[k]);
        }
      });
    }
    return u;
  }

  function unwrap(json) {
    if (json && json.ok) return json.data;
    const msg = (json && json.error) || "Terjadi kesalahan pada server.";
    throw new Error(msg);
  }

  // ---- JSONP fallback (hanya untuk GET) -----------------------------------
  let jsonpSeq = 0;
  function jsonpGet(action, params) {
    return new Promise((resolve, reject) => {
      assertConfigured();
      jsonpSeq += 1;
      const cbName = "KB_jsonp_cb_" + jsonpSeq;
      const u = buildUrl(action, params);
      u.searchParams.set("callback", cbName);

      const script = document.createElement("script");
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Permintaan ke server melebihi batas waktu (timeout)."));
      }, 20000);

      function cleanup() {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (json) {
        cleanup();
        try {
          resolve(unwrap(json));
        } catch (e) {
          reject(e);
        }
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("Gagal menghubungi server (periksa koneksi/URL API)."));
      };

      script.src = u.toString();
      document.head.appendChild(script);
    });
  }

  // ---- GET ----------------------------------------------------------------
  async function apiGet(action, params) {
    assertConfigured();
    if (CFG.USE_JSONP_FOR_GET) return jsonpGet(action, params);

    let res;
    try {
      res = await fetch(buildUrl(action, params).toString(), {
        method: "GET",
        redirect: "follow",
      });
    } catch (e) {
      throw new Error("Gagal menghubungi server. Periksa koneksi internet Anda.");
    }
    if (!res.ok) throw new Error("Server merespons dengan status " + res.status + ".");
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error("Respons server tidak valid.");
    }
    return unwrap(json);
  }

  // ---- POST (text/plain => tanpa preflight) -------------------------------
  async function apiPost(action, payload) {
    assertConfigured();
    const body = JSON.stringify(Object.assign({ action: action }, payload || {}));
    let res;
    try {
      res = await fetch(BASE, {
        method: "POST",
        // PENTING: text/plain agar menjadi "simple request" (tanpa preflight CORS).
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body,
        redirect: "follow",
      });
    } catch (e) {
      throw new Error("Gagal mengirim data ke server. Periksa koneksi internet Anda.");
    }
    if (!res.ok) throw new Error("Server merespons dengan status " + res.status + ".");
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error("Respons server tidak valid.");
    }
    return unwrap(json);
  }

  // ---- Helper URL gambar Google Drive -------------------------------------
  // Mengubah fileId (atau URL Drive) menjadi URL thumbnail yang bisa dipakai
  // di <img>. WAJIB dipasang bersama atribut referrerpolicy="no-referrer"
  // (lihat kbImg() di ui.js) agar tidak kena HTTP 403.
  function driveImg(fileIdOrUrl, width) {
    if (!fileIdOrUrl) return "";
    const w = width || CFG.IMG_THUMB_WIDTH || 800;
    let id = fileIdOrUrl;
    // Jika yang dikirim URL lengkap, ekstrak fileId-nya.
    const m = String(fileIdOrUrl).match(/[-\w]{25,}/);
    if (String(fileIdOrUrl).indexOf("http") === 0 && m) id = m[0];
    if (String(fileIdOrUrl).indexOf("http") === 0 && !m) return fileIdOrUrl; // URL non-Drive
    return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w" + w;
  }

  window.KB_API = {
    get: apiGet,
    post: apiPost,
    driveImg: driveImg,
  };
})();
