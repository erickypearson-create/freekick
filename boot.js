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

cleanupLegacyClientCache();

})();
