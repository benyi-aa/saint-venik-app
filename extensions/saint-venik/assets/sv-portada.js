/* Saint Venik · Portada de las colecciones en el telefono (ver sv-portada.css).
 *
 * Tocar la foto la abre: sube el titulo, aparece la descripcion entera y la
 * foto se oscurece. Se cierra al volver a tocarla, al tocar fuera o al bajar
 * por la pagina. En el computador no hace nada: ahi el tema ya lo muestra todo. */
(function () {
  'use strict';
  var raiz = document.documentElement;
  if (!raiz.classList.contains('sv-portada')) return;
  var caja = document.querySelector('.collection-description-wrapper');
  if (!caja || !caja.querySelector('.collection-image-container img') || !caja.querySelector('.collection-description')) return;
  var telefono = window.matchMedia('(max-width: 767px)');
  var desde = 0;

  var ns = 'http://www.w3.org/2000/svg';
  var flecha = document.createElementNS(ns, 'svg');
  flecha.setAttribute('class', 'sv-portada-flecha');
  flecha.setAttribute('viewBox', '0 0 24 24');
  flecha.setAttribute('fill', 'none');
  flecha.setAttribute('stroke', 'currentColor');
  flecha.setAttribute('stroke-width', '1.3');
  flecha.setAttribute('stroke-linecap', 'round');
  flecha.setAttribute('stroke-linejoin', 'round');
  flecha.setAttribute('aria-hidden', 'true');
  var trazo = document.createElementNS(ns, 'path');
  trazo.setAttribute('d', 'm6 14.5 6-6 6 6');
  flecha.appendChild(trazo);
  var titulo = caja.querySelector('.collection-description h2');
  if (titulo) titulo.insertAdjacentElement('afterend', flecha);
  else caja.querySelector('.collection-description').appendChild(flecha);

  /* Un titulo muy largo («Milan Signature Collection») no cabe en una linea
   * en un telefono angosto: se achica justo lo necesario, una vez al cargar
   * (y al girar el telefono), nunca al abrir o cerrar. */
  function ajustarTitulo() {
    if (!titulo) return;
    titulo.style.removeProperty('font-size');
    if (!telefono.matches) return;
    var hueco = caja.querySelector('.collection-description').clientWidth - 44;
    if (titulo.scrollWidth > hueco && hueco > 0) {
      titulo.style.fontSize = (parseFloat(getComputedStyle(titulo).fontSize) * hueco / titulo.scrollWidth).toFixed(1) + 'px';
    }
  }
  ajustarTitulo();
  window.addEventListener('resize', ajustarTitulo);

  function abierta() { return caja.classList.contains('sv-abierto'); }

  /* El texto crece hasta su alto exacto: con un tope generico (30em) la
   * animacion corria al principio y se quedaba quieta el resto. */
  var texto = caja.querySelector('.collection-description p');
  function poner(abrir) {
    if (abrir && texto) caja.style.setProperty('--sv-texto', texto.scrollHeight + 'px');
    caja.classList.toggle('sv-abierto', abrir);
    if (telefono.matches) caja.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    if (abrir) desde = window.pageYOffset;
  }
  function accesible() {
    if (telefono.matches) {
      caja.setAttribute('role', 'button');
      caja.setAttribute('tabindex', '0');
      caja.setAttribute('aria-expanded', abierta() ? 'true' : 'false');
    } else {
      caja.removeAttribute('role');
      caja.removeAttribute('tabindex');
      caja.removeAttribute('aria-expanded');
      poner(false);
    }
  }
  accesible();
  if (telefono.addEventListener) telefono.addEventListener('change', accesible);

  caja.addEventListener('click', function (e) {
    if (!telefono.matches || (e.target.closest && e.target.closest('a'))) return;
    e.stopPropagation();
    poner(!abierta());
  });
  caja.addEventListener('keydown', function (e) {
    if (!telefono.matches || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    poner(!abierta());
  });
  document.addEventListener('click', function (e) {
    if (abierta() && !caja.contains(e.target)) poner(false);
  });
  window.addEventListener('scroll', function () {
    if (abierta() && Math.abs(window.pageYOffset - desde) > 60) poner(false);
  }, { passive: true });
}());
