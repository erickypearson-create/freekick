(function () {
"use strict";

if (window.__freekickBootstrapLoaded) return;
window.__freekickBootstrapLoaded = true;

async function cleanupLegacyClientCache() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      const targetKeys = keys.filter((k) => k.toLowerCase().includes("freekick") || k.toLowerCase().includes("github"));
      await Promise.all(targetKeys.map((k) => caches.delete(k)));
    }
  } catch (_) {
    // best effort cleanup
  }
}

function loadCoreOnce() {
  if (window.__freekickCoreLoading || window.__freekickCoreLoaded) return;
  window.__freekickCoreLoading = true;

  const script = document.createElement("script");
  const runtimeBuster = Math.floor(Date.now() / 3600000);
  script.src = `core.js?v=20260319i&h=${runtimeBuster}`;
  script.src = `core.js?v=20260319e&h=${runtimeBuster}`;
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
cleanupLegacyClientCache();

})();
