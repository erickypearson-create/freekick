(function () {
"use strict";

// Arquivo legado de compatibilidade.
// Mantido propositalmente sem declarações globais de runtime do jogo
// para evitar conflitos caso uma versão antiga do HTML ainda tente
// carregar game.js junto com app.js.
if (window.__freekickLegacyLoaded) return;
window.__freekickLegacyLoaded = true;

})();
