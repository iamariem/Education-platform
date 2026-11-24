/* ========================================
   EduSaas - UI State
======================================== */

(function () {
  "use strict";

  window.EduSaas = window.EduSaas || {};

  window.EduSaas.state = {
    menuOpen: false
  };

  window.EduSaas.setMenuOpen = function (isOpen) {
    window.EduSaas.state.menuOpen = Boolean(isOpen);
  };
})();
