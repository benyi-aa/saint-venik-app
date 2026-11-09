/* Saint Venik · Descuento: el porcentaje a secas, como en Lost Gen Club.
 *
 * Lo carga el embed de insignias solo cuando el descuento esta encendido en la
 * app. Llega despues que sv-badges.js y le avisa con el evento sv:descuento,
 * que es lo que este espera para arrancar. No pinta nada por su cuenta: le da a sv-badges.js las piezas (el numero y la
 * etiqueta) y se ocupa de lo que es solo suyo, la pastilla junto al precio.
 *
 * El porcentaje no se calcula aqui: lo pone el tema («AHORRA 14%») en la
 * tarjeta y junto al precio, y lo reescribe al cambiar de variante. Leerlo
 * de ahi hace que los dos numeros no puedan discrepar nunca.
 */
(function () {
  'use strict';

  /* ?sv-vista=1 ensena lo que esta en «vista previa» en la app. Se recuerda
   * en la sesion para que no se pierda al pasar de una pagina a otra. */
  function enVistaPrevia() {
    if (/[?&]sv-vista(=1)?(&|$)/.test(location.search)) {
      try { sessionStorage.setItem('sv-vista', '1'); } catch (e) { /* modo privado */ }
      return true;
    }
    try { return sessionStorage.getItem('sv-vista') === '1'; } catch (e) { return false; }
  }

  function leerPct(texto) {
    var m = /(\d{1,2})\s*%/.exec(texto || '');
    var n = m ? Number(m[1]) : 0;
    return n > 0 && n < 100 ? n : 0;
  }

  function pct(antes, ahora) {
    if (!antes || !ahora || ahora >= antes) return 0;
    var n = Math.round(((antes - ahora) / antes) * 100);
    return n > 0 && n < 100 ? n : 0;
  }

  function dinero(nodo) {
    return nodo ? Number(nodo.textContent.replace(/\D/g, '')) : 0;
  }

  /* Por si el tema no pusiera su etiqueta: con exactamente dos precios en la
   * tarjeta (el tachado y el actual) el porcentaje sale igual. */
  function pctDePrecios(nodo) {
    if (!nodo) return 0;
    var nums = (nodo.textContent.match(/\d[\d.,]*/g) || []).map(function (t) {
      return Number(t.replace(/\D/g, ''));
    }).filter(function (n, i, a) { return n > 0 && a.indexOf(n) === i; });
    if (nums.length !== 2) return 0;
    return pct(Math.max(nums[0], nums[1]), Math.min(nums[0], nums[1]));
  }

  window.svDescuento = function (DESC) {
    if (!DESC || !(DESC.modo === 'si' || (DESC.modo === 'prueba' && enVistaPrevia()))) return null;

    /* En 'si' el Liquid ya escondio lo del tema antes de pintar; en vista
     * previa lo esconden estas clases (sv-badges.css). */
    var raiz = document.documentElement.classList;
    if (DESC.tarjetas) raiz.add('sv-desc-t');
    if (DESC.precio) raiz.add('sv-desc-p');

    function texto(n) {
      if (DESC.formato === 'menos') return '-' + n + ' %';
      if (DESC.formato === 'off') return n + ' % OFF';
      return n + ' %';
    }

    function pintar(nodo, n) {
      nodo.textContent = n ? texto(n) : '';
      nodo.hidden = !n;
    }

    /* El «AHORRA 14%» de la ficha. El tema le pone .hide cuando la variante
     * elegida no tiene descuento. */
    function ahorro() {
      return document.querySelector('.product-single__meta [data-save-price]')
        || document.querySelector('[data-save-price]');
    }

    function pctFicha() {
      var nodo = ahorro();
      if (!nodo || nodo.classList.contains('hide')) return 0;
      var n = leerPct(nodo.textContent);
      if (n) return n;
      var bloque = nodo.parentElement;
      if (!bloque) return 0;
      return pct(dinero(bloque.querySelector('[data-compare-price]')),
        dinero(bloque.querySelector('[data-product-price]')));
    }

    /* Todo lo pintado en la ficha, para ponerlo al dia de una vez cuando
     * cambia la variante. */
    var enLaFicha = [];
    function refrescar() {
      var n = pctFicha();
      for (var i = 0; i < enLaFicha.length; i += 1) pintar(enLaFicha[i], n);
    }

    var vigilado = null;

    return {
      tarjetas: Boolean(DESC.tarjetas),
      foto: Boolean(DESC.foto),
      fotoCompu: DESC.fotoCompu === 'todas' ? 'todas' : 'segunda',
      precio: Boolean(DESC.precio),

      pctTarjeta: function (tarjeta) {
        var suya = tarjeta.querySelector('.grid-product__tag--sale');
        var n = suya ? leerPct(suya.textContent) : 0;
        if (n || !tarjeta.querySelector('.grid-product__price--original')) return n;
        return pctDePrecios(tarjeta.querySelector('.grid-product__price'));
      },

      pctFicha: pctFicha,

      span: function (n) {
        var span = document.createElement('span');
        span.className = 'sv-tag sv-tag--desc';
        span.style.backgroundColor = DESC.fondo;
        span.style.color = DESC.texto;
        span.style.borderRadius = (DESC.radio || 0) + 'px';
        pintar(span, n);
        return span;
      },

      registrar: function (nodo) {
        enLaFicha.push(nodo);
        return nodo;
      },

      decorarPrecio: function () {
        var nodo = ahorro();
        if (!nodo || nodo.dataset.svDesc) return;
        nodo.dataset.svDesc = '1';
        var span = document.createElement('span');
        span.className = 'sv-desc-precio';
        span.style.backgroundColor = DESC.fondo;
        span.style.color = DESC.texto;
        nodo.parentNode.insertBefore(span, nodo.nextSibling);
        enLaFicha.push(span);
        pintar(span, pctFicha());
      },

      /* Al cambiar de variante el tema reescribe su «AHORRA»: se escucha ahi. */
      vigilar: function () {
        var nodo = ahorro();
        if (!nodo || nodo === vigilado) return;
        vigilado = nodo;
        new MutationObserver(refrescar).observe(nodo, {
          childList: true, characterData: true, subtree: true,
          attributes: true, attributeFilter: ['class'],
        });
      },
    };
  };

  document.dispatchEvent(new Event('sv:descuento'));
}());
