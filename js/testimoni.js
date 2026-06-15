/* ============================================================================
   Koki Batak — testimoni.js
   Menampilkan testimoni (approved) + form kirim testimoni (masuk moderasi).
   ============================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    loadList();
    document.getElementById("testiForm").addEventListener("submit", onSubmit);
  });

  function stars(n) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }

  function loadList() {
    var grid = document.getElementById("testiGrid");
    grid.innerHTML = KB_UI.loader();
    KB_API.get("getTestimonials")
      .then(function (list) {
        if (!list || !list.length) {
          grid.innerHTML = KB_UI.stateMsg("Belum ada testimoni.", "Jadilah yang pertama berbagi pengalaman!");
          return;
        }
        grid.className = "testi-grid";
        grid.innerHTML = list
          .map(function (t) {
            return (
              '<article class="testi-card reveal">' +
              '<div class="testi-stars">' + stars(t.rating) + "</div>" +
              '<p class="testi-msg">' + KB_UI.escape(t.message) + "</p>" +
              '<div class="testi-name">— ' + KB_UI.escape(t.name) + "</div>" +
              "</article>"
            );
          })
          .join("");
        KB_UI.initReveal();
      })
      .catch(function (err) {
        grid.innerHTML = KB_UI.stateMsg("Gagal memuat testimoni.", err.message);
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
    var btn = document.getElementById("testiBtn");

    var payload = {
      name: form.name.value.trim(),
      rating: form.rating.value,
      message: form.message.value.trim(),
      website: form.website.value, // honeypot
    };

    var hasError = false;
    setError(form, "name", "");
    setError(form, "message", "");
    if (!payload.name) { setError(form, "name", "Nama wajib diisi."); hasError = true; }
    if (!payload.message) { setError(form, "message", "Pesan wajib diisi."); hasError = true; }
    if (hasError) return;

    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Mengirim…';

    KB_API.post("submitTestimonial", payload)
      .then(function () {
        form.reset();
        KB_UI.toast("Terima kasih! Testimoni Anda akan tampil setelah ditinjau.", "success", 5000);
      })
      .catch(function (err) {
        KB_UI.toast(err.message || "Gagal mengirim testimoni.", "error", 5000);
      })
      .then(function () {
        btn.disabled = false;
        btn.innerHTML = old;
      });
  }
})();
