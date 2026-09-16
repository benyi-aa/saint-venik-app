/* Saint Venik · Abre y cierra la ventana de la guia de tallas.
 *
 * Usa <dialog> nativo: el navegador se encarga del foco, de la tecla Escape y
 * del fondo. Menos codigo nuestro y mejor accesibilidad que una ventana hecha a
 * mano con divs.
 */
(function () {
  'use strict';

  function abrir(dialogo) {
    if (typeof dialogo.showModal === 'function') {
      dialogo.showModal();
    } else {
      /* Navegador antiguo sin <dialog>: al menos que se vea. */
      dialogo.setAttribute('open', '');
    }
    document.documentElement.style.overflow = 'hidden';
  }

  function cerrar(dialogo) {
    if (typeof dialogo.close === 'function') {
      dialogo.close();
    } else {
      dialogo.removeAttribute('open');
    }
    document.documentElement.style.overflow = '';
  }

  document.addEventListener('click', function (evento) {
    var abre = evento.target.closest('[data-sv-abre-guia]');
    if (abre) {
      var dialogo = document.getElementById(abre.dataset.svAbreGuia);
      if (dialogo) { evento.preventDefault(); abrir(dialogo); }
      return;
    }

    if (evento.target.closest('[data-sv-cierra-guia]')) {
      var suyo = evento.target.closest('dialog');
      if (suyo) cerrar(suyo);
      return;
    }

    /* Clic en el fondo: el <dialog> ocupa toda la pantalla y la caja va dentro,
     * asi que un clic cuyo objetivo es el propio dialogo cayo fuera de la caja. */
    if (evento.target.matches('dialog.sv-guia-dialogo')) {
      cerrar(evento.target);
    }
  });

  /* Escape lo cierra solo, pero hay que devolver el scroll a la pagina. */
  document.addEventListener('close', function (evento) {
    if (evento.target.matches && evento.target.matches('dialog.sv-guia-dialogo')) {
      document.documentElement.style.overflow = '';
    }
  }, true);
})();
