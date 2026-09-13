// Aplica o tema salvo antes da primeira pintura para evitar flash.
// Arquivo externo (não inline) para que a CSP dispense 'unsafe-inline' em script-src.
(function () {
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.dataset.theme = saved;
    }
  } catch {
    /* sem armazenamento local: usa a preferência do sistema */
  }
})();
