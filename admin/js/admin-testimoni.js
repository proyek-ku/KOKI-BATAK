/* Koki Batak — admin-testimoni.js : moderasi testimoni */
(function () {
  "use strict";

  var all = [];
  var filter = "";

  var STA = {
    pending: { label: "Menunggu", cls: "text-bg-warning" },
    approved: { label: "Disetujui", cls: "text-bg-success" },
    rejected: { label: "Ditolak", cls: "text-bg-danger" },
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("testimoni");

    var fw = document.getElementById("testiFilter");
    fw.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        fw.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        filter = b.getAttribute("data-st");
        render();
      });
    });
    load();
  });

  function stars(n) { n = Math.max(0, Math.min(5, Number(n) || 0)); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

  function load() {
    var body = document.getElementById("testiBody");
    body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm"></div> Memuat…</td></tr>';
    KB_ADMIN.call("adminListTestimonials")
      .then(function (list) { all = list || []; render(); })
      .catch(function (err) {
        body.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">' + KB_ADMIN.escape(err.message) + "</td></tr>";
      });
  }

  function badge(st) { var m = STA[st] || { label: st, cls: "text-bg-light" }; return '<span class="badge ' + m.cls + '">' + m.label + "</span>"; }

  function render() {
    var body = document.getElementById("testiBody");
    var list = all.filter(function (t) { return !filter || t.status === filter; });
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Tidak ada testimoni.</td></tr>';
      return;
    }
    body.innerHTML = list
      .map(function (t) {
        var i = all.indexOf(t);
        var actions = "";
        if (t.status !== "approved") actions += '<button class="btn btn-sm btn-outline-success" data-app="' + i + '">Setujui</button> ';
        if (t.status !== "rejected") actions += '<button class="btn btn-sm btn-outline-warning" data-rej="' + i + '">Tolak</button> ';
        actions += '<button class="btn btn-sm btn-outline-danger" data-del="' + i + '">Hapus</button>';
        return (
          "<tr>" +
          "<td>" + KB_ADMIN.escape(t.name) + "</td>" +
          '<td class="text-warning text-nowrap">' + stars(t.rating) + "</td>" +
          '<td style="max-width:320px">' + KB_ADMIN.escape(t.message) + "</td>" +
          "<td>" + badge(t.status) + "</td>" +
          '<td class="small text-muted text-nowrap">' + KB_ADMIN.escape(t.created_at) + "</td>" +
          '<td class="text-nowrap">' + actions + "</td>" +
          "</tr>"
        );
      })
      .join("");

    body.querySelectorAll("button[data-app]").forEach(function (b) { b.addEventListener("click", function () { moderate(all[+b.getAttribute("data-app")], "approved"); }); });
    body.querySelectorAll("button[data-rej]").forEach(function (b) { b.addEventListener("click", function () { moderate(all[+b.getAttribute("data-rej")], "rejected"); }); });
    body.querySelectorAll("button[data-del]").forEach(function (b) { b.addEventListener("click", function () { del(all[+b.getAttribute("data-del")]); }); });
  }

  function moderate(t, status) {
    KB_ADMIN.call("adminModerateTestimonial", { id: t.id, status: status })
      .then(function () { t.status = status; KB_ADMIN.toast("Testimoni diperbarui.", "success"); render(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); });
  }

  function del(t) {
    if (!confirm("Hapus testimoni dari " + t.name + " secara permanen?")) return;
    KB_ADMIN.call("adminDeleteTestimonial", { id: t.id })
      .then(function () { KB_ADMIN.toast("Testimoni dihapus.", "success"); load(); })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); });
  }
})();
