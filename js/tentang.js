/* ============================================================================
   Koki Batak — tentang.js
   Mengisi nama bisnis & deskripsi dari Settings (bila admin mengubahnya).
   ============================================================================ */

(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    KB_UI.getSettings().then(function (s) {
      if (!s) return;
      var title = document.getElementById("aboutTitle");
      var lead = document.getElementById("aboutLead");
      if (title && s.business_name) title.textContent = s.business_name;
      if (lead && s.business_info) lead.textContent = s.business_info;
    });
  });
})();
