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
    window.addEventListener('resize', pintar);
    pintar();
  });
}());
