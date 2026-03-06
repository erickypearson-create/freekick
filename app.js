(function () {
"use strict";

// Bootstrap mínimo, seguro para múltiplos carregamentos.
if (window.__freekickBootstrapLoaded) return;
window.__freekickBootstrapLoaded = true;

function loadCoreOnce() {
  if (window.__freekickCoreLoading || window.__freekickCoreLoaded) return;
  window.__freekickCoreLoading = true;

  const script = document.createElement("script");
  script.src = "core.js?v=20260306b";
  script.async = false;
  script.onload = () => {
    window.__freekickCoreLoaded = true;
    window.__freekickCoreLoading = false;
  };
  script.onerror = () => {
    window.__freekickCoreLoading = false;
    console.error("Falha ao carregar core.js");
  };

  document.head.appendChild(script);
}

loadCoreOnce();

})();
