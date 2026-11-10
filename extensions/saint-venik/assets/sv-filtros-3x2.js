/* Saint Venik · Filtros rápidos en «Arma tu 3x2» (Benjamín, 10-nov).
 *
 * Las mismas pastillas de la primera fila de la app (Filtros: Dorado,
 * Plateado, Brillantes...) debajo de las pestañas de la página del 3x2. La
 * grilla del 3x2 la dibuja el tema (sv-3x2.js) a partir de products.json, así
 * que aquí se filtra en el sitio, tarjeta por tarjeta:
 *  - Color (Dorado / Plateado): por las muestras de metal de cada tarjeta. Al
 *    elegir uno, las tarjetas que vienen en los dos metales se pasan a ese.
 *  - Tipo o categoría (Brillantes...): por las etiquetas del producto.
 * Entre botones del mismo grupo vale cualquiera; entre grupos, todos. La lista
 * de botones la deja el embed «Filtros rápidos» en #sv-filtros-3x2. */
(function () {
  'use strict';
  var datos = document.getElementById('sv-filtros-3x2');
  if (!datos || !window.MutationObserver) return;
  if (datos.dataset.modo === 'prueba') {
    var vista = false;
    try {
      if (/[?&]sv-vista(=1)?(&|$)/.test(location.search)) sessionStorage.setItem('sv-vista', '1');
      vista = sessionStorage.getItem('sv-vista') === '1';
    } catch (e) { /* privado */ }
    if (!vista) return;
  }
  var botones;
  try { botones = JSON.parse(datos.textContent).filter(Boolean); } catch (e) { return; }
  botones.sort(function (a, b) { return a.o - b.o; });
  if (!botones.length) return;
  var yo = document.currentScript && document.currentScript.src;

  var llano = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  /* El nombre sin el metal: así se juntan la versión de oro y la de plata,
   * como hace la grilla con data-sv3-key. */
  var clave = function (s) {
    return llano(s).replace(/\b(oro|plata|plateado|plateada|dorado|dorada)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  };
  var singular = function (s) { return s.replace(/(es|s)$/, ''); };
  function metal(b) {
    if (b.f === 'tipo' || b.f === 'categoria') return null;
    var v = llano(b.v);
    if (/^(dorad|oro)/.test(v)) return 'oro';
    if (/^(platead|plata)/.test(v)) return 'plata';
    return null;
  }
  var grupo = function (b) { return metal(b) ? 'color' : (b.f || 'color'); };

  var activos = [];
  var pastillas = [];
  var etiquetas = {};
  var esperando = {};
  var tocado = false;

  function pestana() {
    var t = document.querySelector('[data-sv3-tab][aria-selected="true"], [data-sv3-tab].is-active');
    return t ? t.getAttribute('data-sv3-tab') : '';
  }
  var hayEtiquetas = function () { return botones.some(function (b) { return !metal(b); }); };

  /* Las etiquetas de cada colección, con las mismas direcciones que usa la
   * grilla para que el navegador ya las tenga guardadas. */
  function cargar(h, listo) {
    if (!h || etiquetas[h]) { if (listo) listo(); return; }
    if (esperando[h]) { esperando[h].push(listo); return; }
    esperando[h] = [listo];
    var mapa = {};
    var pagina = 1;
    function fin() {
      etiquetas[h] = mapa;
      var l = esperando[h];
      delete esperando[h];
      l.forEach(function (f) { if (f) f(); });
    }
    (function siguiente() {
      var url = '/collections/' + h + '/products.json?limit=250' + (pagina > 1 ? '&page=' + pagina : '');
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var ps = (d && d.products) || [];
          ps.forEach(function (p) {
            var k = clave(p.title);
            mapa[k] = (mapa[k] || []).concat((p.tags || []).map(llano));
          });
          if (ps.length === 250 && pagina < 8) { pagina += 1; siguiente(); } else { fin(); }
        })
        .catch(fin);
    }());
  }

  function cumple(card, b, tags) {
    var m = metal(b);
    if (m) return !!card.querySelector('[data-sv3-color="' + m + '"]');
    if (!tags) return true;
    var lista = tags[clave(card.getAttribute('data-sv3-key') || '')] || [];
    var v = singular(llano(b.v));
    return lista.some(function (t) { return singular(t) === v; });
  }

  var pendiente = false;
  function aplicar() {
    pendiente = false;
    var grid = document.querySelector('[data-sv3-grid]');
    if (!grid) return;
    var h = pestana();
    var tags = etiquetas[h];
    if (!tags && hayEtiquetas()) cargar(h, programar);
    var cards = [].slice.call(grid.querySelectorAll('.sv3-card'));
    var grupos = {};
    activos.forEach(function (i) {
      var g = grupo(botones[i]);
      (grupos[g] = grupos[g] || []).push(botones[i]);
    });
    var nombres = Object.keys(grupos);
    var soloMetal = (grupos.color || []).map(metal).filter(Boolean);
    var visibles = 0;
    cards.forEach(function (c) {
      var ok = nombres.every(function (g) {
        return grupos[g].some(function (b) { return cumple(c, b, tags); });
      });
      c.style.display = ok ? '' : 'none';
      if (!ok) return;
      visibles += 1;
      /* Un solo metal elegido: la tarjeta que viene en los dos se pasa a ese. */
      if (soloMetal.length === 1) {
        var boton = c.querySelector('[data-sv3-color="' + soloMetal[0] + '"]');
        if (boton && !boton.classList.contains('is-on')) boton.click();
      }
    });
    /* Se apaga el botón que, junto con lo elegido en los otros grupos, no
     * dejaría ninguna joya (Brillantes con Dorado, por ejemplo). */
    botones.forEach(function (b, i) {
      var otros = nombres.filter(function (g) { return g !== grupo(b); });
      var vacio = cards.length > 0 && !cards.some(function (c) {
        return cumple(c, b, tags) && otros.every(function (g) {
          return grupos[g].some(function (x) { return cumple(c, x, tags); });
        });
      });
      pastillas[i].classList.toggle('is-vacio', vacio && activos.indexOf(i) < 0);
      pastillas[i].setAttribute('aria-disabled', vacio ? 'true' : 'false');
    });
    var n = document.querySelector('[data-sv3-count]');
    if (n && tocado && cards.length) n.textContent = (n.getAttribute('data-format') || '{n}').replace('{n}', visibles);
  }
  function programar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(aplicar);
  }

  function iniciar() {
    var barra = document.querySelector('.sv3-bar');
    var grid = document.querySelector('[data-sv3-grid]');
    if (!barra || !grid) return;
    if (yo) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = yo.replace('sv-filtros-3x2.js', 'sv-filtros.css');
      document.head.appendChild(css);
    }
    var nav = document.createElement('nav');
    nav.className = 'sv-filtros sv-filtros--3x2';
    nav.setAttribute('aria-label', 'Filtros rápidos');
    nav.innerHTML = '<div class="sv-filtros__dentro sv3-wrap"><div class="sv-filtros__fila" style="--cols:' + Math.min(botones.length, 4) + '"></div></div>';
    var fila = nav.querySelector('.sv-filtros__fila');
    botones.forEach(function (b, i) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'sv-filtro';
      el.setAttribute('aria-pressed', 'false');
      if (b.m) {
        var mu = document.createElement('span');
        mu.className = 'sv-filtro__muestra';
        if (b.m.indexOf('url(') === 0) mu.style.backgroundImage = b.m; else mu.style.backgroundColor = b.m;
        el.appendChild(mu);
      } else if (b.i) {
        el.insertAdjacentHTML('beforeend', b.i);
      }
      var t = document.createElement('span');
      t.textContent = b.n || b.v;
      el.appendChild(t);
      el.addEventListener('click', function () {
        if (el.classList.contains('is-vacio')) return;
        var k = activos.indexOf(i);
        if (k < 0) activos.push(i); else activos.splice(k, 1);
        el.classList.toggle('is-activo', k < 0);
        el.setAttribute('aria-pressed', k < 0 ? 'true' : 'false');
        tocado = true;
        aplicar();
      });
      fila.appendChild(el);
      pastillas.push(el);
    });
    var estilo = document.createElement('style');
    estilo.textContent = '.sv-filtros--3x2{margin:14px 0 0}.sv-filtros--3x2 .sv-filtro{font:inherit;font-size:12px;cursor:pointer;width:100%}' +
      '@media (min-width:769px){.sv-filtros--3x2 .sv-filtro{width:auto;font-size:12.5px}}';
    document.head.appendChild(estilo);
    barra.parentNode.insertBefore(nav, barra.nextSibling);
    new MutationObserver(programar).observe(grid, { childList: true });
    programar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
}());
