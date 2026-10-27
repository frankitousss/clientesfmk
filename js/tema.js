// ============================================================
// FMK BARBERSHOP — Modo oscuro / modo claro
// Se carga en el <head> para aplicar el tema guardado antes de que
// se dibuje la página (así no hay un "parpadeo" al abrirla).
// ============================================================

(function () {
  const CLAVE = 'fmk-tema';

  function temaGuardado() {
    try {
      const t = localStorage.getItem(CLAVE);
      return t === 'light' || t === 'dark' ? t : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function aplicar(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    const boton = document.getElementById('btn-tema');
    if (boton) {
      boton.textContent = tema === 'light' ? '\u263E' : '\u2600'; // luna / sol
      boton.setAttribute('aria-label', tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro');
      boton.title = tema === 'light' ? 'Modo oscuro' : 'Modo claro';
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'light' ? '#f5f2ea' : '#0a0a0b');
  }

  aplicar(temaGuardado());

  document.addEventListener('DOMContentLoaded', function () {
    aplicar(temaGuardado()); // ahora sí existe el botón
    const boton = document.getElementById('btn-tema');
    if (!boton) return;
    boton.addEventListener('click', function () {
      const nuevo = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(CLAVE, nuevo); } catch (e) {}
      aplicar(nuevo);
    });
  });
})();
