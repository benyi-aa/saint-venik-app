/* Saint Venik · Categorías del inicio: la barrita de abajo sigue al deslizar. */
(function () {
  'use strict';
  var pistas = document.querySelectorAll('[data-sv-cat]');
  Array.prototype.forEach.call(pistas, function (p) {
    var barra = p.parentNode.querySelector('.sv-cat__barra');
    var marca = barra && barra.firstElementChild;
    if (!marca) return;
    function pintar() {
      var total = p.scrollWidth, ve = p.clientWidth;
      if (total <= ve + 2) { barra.style.visibility = 'hidden'; return; }
      barra.style.visibility = '';
      var ancho = ve / total, libre = 1 - ancho;
      var avance = p.scrollLeft / (total - ve);
      marca.style.width = (ancho * 100) + '%';
      marca.style.left = (Math.max(0, Math.min(1, avance)) * libre * 100) + '%';
    }
    p.addEventListener('scroll', pintar, { passive: true });

    /* Con mouse también se arrastra; un arrastre no cuenta como clic. */
    var x0 = null, s0 = 0, movido = false;
    p.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      x0 = e.clientX; s0 = p.scrollLeft; movido = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 5) { movido = true; p.style.scrollSnapType = 'none'; }
      if (movido) p.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
      if (x0 === null) return;
      x0 = null;
      p.style.scrollSnapType = '';
    });
    p.addEventListener('click', function (e) {
      if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; }
    }, true);
    p.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('resize', pintar);
    pintar();
  });
}());
