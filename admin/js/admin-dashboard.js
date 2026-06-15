/* Koki Batak — admin-dashboard.js */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("dashboard");
    load();
  });

  function statCard(value, label, color) {
    return (
      '<div class="col-6 col-lg-3"><div class="card shadow-sm border-0 h-100">' +
      '<div class="card-body"><div class="fs-3 fw-bold ' + (color || "") + '">' + value + "</div>" +
      '<div class="text-muted small">' + label + "</div></div></div></div>"
    );
  }

  function load() {
    KB_ADMIN.call("adminStats")
      .then(function (s) {
        var c = s.counts || {};
        document.getElementById("statsRow").innerHTML =
          statCard(s.total_orders || 0, "Total Pesanan", "text-dark") +
          statCard(c.baru || 0, "Pesanan Baru", "text-secondary") +
          statCard(KB_ADMIN.money(s.revenue_selesai || 0), "Pendapatan (Selesai)", "text-success") +
          statCard(s.pending_testimonials || 0, "Testimoni Menunggu", "text-warning");

        // Daftar status
        var statusHtml = KB_ADMIN.STATUSES.map(function (st) {
          var m = KB_ADMIN.STATUS_META[st];
          return (
            '<li class="list-group-item d-flex justify-content-between align-items-center">' +
            KB_ADMIN.statusBadge(st) +
            '<span class="badge text-bg-light rounded-pill">' + (c[st] || 0) + "</span></li>"
          );
        }).join("");
        document.getElementById("statusList").innerHTML = statusHtml;

        // Pesanan terbaru
        var rows = (s.recent_orders || [])
          .map(function (o) {
            return (
              "<tr><td><code>" + KB_ADMIN.escape(o.order_code) + "</code></td>" +
              "<td>" + KB_ADMIN.escape(o.customer_name) + "</td>" +
              "<td>" + KB_ADMIN.money(o.total) + "</td>" +
              "<td>" + KB_ADMIN.statusBadge(o.status) + "</td>" +
              '<td class="small text-muted">' + KB_ADMIN.escape(o.created_at) + "</td></tr>"
            );
          })
          .join("");
        document.getElementById("recentBody").innerHTML =
          rows || '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada pesanan.</td></tr>';
      })
      .catch(function (err) {
        KB_ADMIN.toast(err.message, "error");
        document.getElementById("statsRow").innerHTML =
          '<div class="col-12"><div class="alert alert-danger">' + KB_ADMIN.escape(err.message) + "</div></div>";
      });
  }
})();
