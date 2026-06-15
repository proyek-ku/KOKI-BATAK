/* Koki Batak — admin-pesanan.js : daftar, detail, ubah status */
(function () {
  "use strict";

  var all = [];
  var current = null;
  var modal = null;
  var filter = "";

  document.addEventListener("DOMContentLoaded", function () {
    if (!KB_ADMIN.requireAuth()) return;
    KB_ADMIN.renderNav("pesanan");
    modal = new bootstrap.Modal(document.getElementById("orderModal"));
    buildFilter();
    document.getElementById("saveStatusBtn").addEventListener("click", saveStatus);
    load();
  });

  function buildFilter() {
    var wrap = document.getElementById("statusFilter");
    var btns = ['<button class="btn btn-dark active" data-st="">Semua</button>'];
    KB_ADMIN.STATUSES.forEach(function (st) {
      btns.push('<button class="btn btn-outline-dark" data-st="' + st + '">' + KB_ADMIN.STATUS_META[st].label + "</button>");
    });
    wrap.innerHTML = btns.join("");
    wrap.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        wrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        filter = b.getAttribute("data-st");
        render();
      });
    });
  }

  function load() {
    var body = document.getElementById("ordersBody");
    body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm"></div> Memuat…</td></tr>';
    KB_ADMIN.call("adminListOrders")
      .then(function (list) { all = list || []; render(); })
      .catch(function (err) {
        body.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">' + KB_ADMIN.escape(err.message) + "</td></tr>";
      });
  }

  function render() {
    var body = document.getElementById("ordersBody");
    var list = all.filter(function (o) { return !filter || o.status === filter; });
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Tidak ada pesanan.</td></tr>';
      return;
    }
    body.innerHTML = list
      .map(function (o, idx) {
        var realIdx = all.indexOf(o);
        return (
          "<tr>" +
          "<td><code>" + KB_ADMIN.escape(o.order_code) + "</code></td>" +
          "<td>" + KB_ADMIN.escape(o.customer_name) + "</td>" +
          '<td class="small">' + KB_ADMIN.escape(o.phone) + "</td>" +
          "<td>" + KB_ADMIN.money(o.total) + "</td>" +
          "<td>" + KB_ADMIN.statusBadge(o.status) + "</td>" +
          '<td class="small text-muted">' + KB_ADMIN.escape(o.created_at) + "</td>" +
          '<td><button class="btn btn-sm btn-outline-secondary" data-idx="' + realIdx + '">Detail</button></td>' +
          "</tr>"
        );
      })
      .join("");
    body.querySelectorAll("button[data-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () { openDetail(all[Number(btn.getAttribute("data-idx"))]); });
    });
  }

  function openDetail(o) {
    current = o;
    document.getElementById("mCode").textContent = o.order_code;

    var itemsRows = (o.items || [])
      .map(function (it) {
        return (
          "<tr><td>" + KB_ADMIN.escape(it.package_name) + "</td>" +
          '<td class="text-center">' + it.qty + "</td>" +
          '<td class="text-end">' + KB_ADMIN.money(it.unit_price) + "</td>" +
          '<td class="text-end">' + KB_ADMIN.money(it.subtotal) + "</td></tr>"
        );
      })
      .join("");

    var statusOptions = KB_ADMIN.STATUSES.map(function (st) {
      return '<option value="' + st + '"' + (st === o.status ? " selected" : "") + ">" + KB_ADMIN.STATUS_META[st].label + "</option>";
    }).join("");

    document.getElementById("orderModalBody").innerHTML =
      '<div class="row g-3 mb-3">' +
      detailCol("Pelanggan", o.customer_name) +
      detailCol("No. HP/WA", '<a href="https://wa.me/' + KB_ADMIN.escape(waNorm(o.phone)) + '" target="_blank">' + KB_ADMIN.escape(o.phone) + "</a>") +
      detailCol("Tanggal Acara", o.event_date || "-") +
      detailCol("Jumlah Porsi", o.servings || "-") +
      '<div class="col-12">' + detailLabel("Alamat") + "<div>" + KB_ADMIN.escape(o.address || "-") + "</div></div>" +
      '<div class="col-12">' + detailLabel("Catatan") + "<div>" + KB_ADMIN.escape(o.notes || "-") + "</div></div>" +
      "</div>" +
      '<table class="table table-sm"><thead class="table-light"><tr><th>Paket</th><th class="text-center">Qty</th><th class="text-end">Harga</th><th class="text-end">Subtotal</th></tr></thead>' +
      "<tbody>" + (itemsRows || '<tr><td colspan="4" class="text-muted">—</td></tr>') +
      '</tbody><tfoot><tr><th colspan="3" class="text-end">Total</th><th class="text-end">' + KB_ADMIN.money(o.total) + "</th></tr></tfoot></table>" +
      '<hr><div class="row g-3">' +
      '<div class="col-md-5"><label class="form-label fw-semibold">Ubah Status</label><select class="form-select" id="statusSelect">' + statusOptions + "</select></div>" +
      '<div class="col-md-7"><label class="form-label fw-semibold">Catatan Admin</label><input class="form-control" id="adminNote" value="' + KB_ADMIN.escape(o.admin_note || "") + '"></div>' +
      "</div>";

    modal.show();
  }

  function detailLabel(t) { return '<div class="text-muted small">' + t + "</div>"; }
  function detailCol(label, val) { return '<div class="col-md-6">' + detailLabel(label) + "<div>" + (val || "-") + "</div></div>"; }
  function waNorm(num) { var d = String(num || "").replace(/[^\d]/g, ""); return d.indexOf("0") === 0 ? "62" + d.slice(1) : d; }

  function saveStatus() {
    if (!current) return;
    var btn = document.getElementById("saveStatusBtn");
    var status = document.getElementById("statusSelect").value;
    var note = document.getElementById("adminNote").value;
    btn.disabled = true;
    var old = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    KB_ADMIN.call("adminUpdateOrderStatus", { id: current.id, status: status, admin_note: note })
      .then(function () {
        current.status = status;
        current.admin_note = note;
        KB_ADMIN.toast("Status diperbarui.", "success");
        modal.hide();
        render();
      })
      .catch(function (err) { KB_ADMIN.toast(err.message, "error"); })
      .then(function () { btn.disabled = false; btn.innerHTML = old; });
  }
})();
