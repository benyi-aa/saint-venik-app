/* Saint Venik · Filtros rapidos, como en craftdlondon.com.
 *
 * Lo carga el embed «Filtros rapidos» en las colecciones. El embed ya dejo
 * la barra de pastillas (#sv-filtros) en su sitio; aqui va lo que hacen:
 *  - Una pastilla filtra en el sitio con la funcion del propio tema (Impulse),
 *    sin recargar ni saltar arriba. La que se quedaria sin productos se apaga.
 *  - Menu «Filtrar»: Color, Categoria y Tipo arriba, despues Precio y
 *    Disponibilidad, al final «Ordenar». Las opciones se marcan sin que se
 *    cierre y se aplican con «Ver resultados» (o al cerrarlo).
 *  - Precio: debajo del slider, «Desde» y «Hasta» para escribirlo.
 */
(function () {
  'use strict';
  var nav = document.getElementById('sv-filtros');
  if (!nav || !window.URL || !window.URLSearchParams) return;
  var EN = nav.dataset.en === '1';
  var ORDENAR = nav.dataset.ordenar === '1';
  var raiz = document.documentElement;
  var igual = function (a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); };
  var menuForm = function () { return document.querySelector('#FilterDrawer .filter-form'); };

  /* La seccion de productos del tema ya sabe filtrar sin recargar: pide la
   * seccion con los filtros nuevos, la cambia y apunta la direccion. */
  function laColeccion() {
    try {
      var l = (window.theme && window.theme.sections && window.theme.sections.instances) || [];
      for (var i = 0; i < l.length; i += 1) {
        if (l[i] && l[i].type === 'collection-grid' && typeof l[i].renderCollectionPage === 'function') return l[i];
      }
    } catch (e) { /* otro tema */ }
    return null;
  }

  function limpios(form) {
    var p = new URLSearchParams();
    new FormData(form).forEach(function (v, k) { if (v !== '') p.append(k, v); });
    return p;
  }

  /* Sin la seccion del tema, como siempre: cargando la pagina. */
  function navegar(p) {
    var q = p.toString();
    location.href = location.pathname + (q ? '?' + q : '');
  }

  /* ---- Pastillas ---- */
  var volverA = null;
  function marcar(a, on) {
    a.classList.toggle('is-activo', on);
    a.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  nav.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-param]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (a.classList.contains('is-vacio')) return;
    /* Desde la direccion de ahora: el href del servidor ya puede ser viejo. */
    var u = new URL(location.href);
    var p = a.dataset.param;
    var v = a.dataset.valor;
    var antes = u.searchParams.getAll(p);
    var estaba = false;
    u.searchParams.delete(p);
    antes.forEach(function (x) { if (igual(x, v)) estaba = true; else u.searchParams.append(p, x); });
    if (!estaba) u.searchParams.append(p, v);
    u.searchParams.delete('page');
    marcar(a, !estaba);
    var col = laColeccion();
    if (!col) { navegar(u.searchParams); return; }
    volverA = window.pageYOffset; /* el tema sube al terminar; aqui no */
    try { col.startLoading(); } catch (err) { /* sin rejilla */ }
    col.renderCollectionPage(u.searchParams);
  });

  /* Encendida si esta en la direccion; apagada si con lo elegido se quedaria
   * sin productos (lo dice el menu del tema: «(0)»). */
  function pintarPastillas() {
    var u = new URL(location.href);
    var form = menuForm() || document.querySelector('.filter-form');
    var ins = form ? form.querySelectorAll('input[name]') : [];
    var as = nav.querySelectorAll('a[data-param]');
    for (var i = 0; i < as.length; i += 1) {
      var a = as[i];
      var on = u.searchParams.getAll(a.dataset.param).some(function (x) { return igual(x, a.dataset.valor); });
      marcar(a, on);
      var vacio = false;
      for (var j = 0; !on && j < ins.length; j += 1) {
        if (ins[j].name !== a.dataset.param || !igual(ins[j].value, a.dataset.valor)) continue;
        var li = ins[j].closest('li');
        var t = (li || ins[j].parentNode).textContent.replace(/\s+/g, ' ').trim();
        vacio = ins[j].disabled || (li && li.classList.contains('hide')) || /\(0\)$/.test(t);
        break;
      }
      a.classList.toggle('is-vacio', vacio);
      if (vacio) a.setAttribute('aria-disabled', 'true'); else a.removeAttribute('aria-disabled');
    }
  }

  /* ---- Menu «Filtrar» ---- */
  var PRIMERO = ['filter.p.m.custom.sv_color', 'filter.p.m.custom.sv_categoria', 'filter.p.m.custom.sv_tipo'];
  function peso(g) {
    if (g.classList.contains('sv-orden')) return 90;
    var inp = g.querySelector('input[name^="filter."]');
    var n = inp ? inp.name : '';
    if (PRIMERO.indexOf(n) > -1) return PRIMERO.indexOf(n);
    if (/^filter\.v\.price/.test(n)) return 50;
    if (n === 'filter.v.availability') return 60;
    return 40;
  }

  function ordenarGrupos(form) {
    var hijos = [].slice.call(form.children).filter(function (c) { return /collection-sidebar__group/.test(c.className); });
    if (hijos.length < 2) return;
    var orden = hijos.map(function (c, i) { return { c: c, p: peso(c), i: i }; })
      .sort(function (x, y) { return x.p - y.p || x.i - y.i; });
    if (orden.some(function (o, i) { return o.c !== hijos[i]; })) orden.forEach(function (o) { form.appendChild(o.c); });
  }

  /* Search & Discovery deja en ingles los nombres sin traducir. */
  var NOMBRES = EN ? null : { availability: 'Disponibilidad', price: 'Precio' };
  function traducir(form) {
    if (!NOMBRES) return;
    var bs = form.querySelectorAll('.collapsible-trigger-btn');
    for (var i = 0; i < bs.length; i += 1) {
      for (var n = bs[i].firstChild; n; n = n.nextSibling) {
        var k = n.nodeType === 3 ? n.nodeValue.trim().toLowerCase() : '';
        if (NOMBRES[k]) n.nodeValue = ' ' + NOMBRES[k] + ' ';
      }
    }
  }

  function el(tag, cls, txt) {
    var x = document.createElement(tag);
    if (cls) x.className = cls;
    if (txt) x.textContent = txt;
    return x;
  }

  /* «Ordenar» dentro del menu, con las opciones del desplegable del tema. */
  function ordenarEnMenu() {
    var form = menuForm();
    var sel = document.querySelector('select[name="SortBy"]');
    if (!ORDENAR || !form || !sel || form.querySelector('.sv-orden')) return;
    var actual = new URL(location.href).searchParams.get('sort_by') || sel.getAttribute('data-default-sortby') || '';
    var vistos = {};
    var ul = el('ul', 'no-bullets tag-list');
    for (var i = 0; i < sel.options.length; i += 1) {
      var o = sel.options[i];
      var t = o.textContent.trim();
      if (!o.value || /^(ordenar|sort|sort by)$/i.test(t) || vistos[o.value]) continue;
      vistos[o.value] = true;
      if (o.value === 'manual') t = EN ? 'Featured' : 'Destacados';
      var u = new URL(location.href);
      u.searchParams.set('sort_by', o.value);
      u.searchParams.delete('page');
      var li = el('li', 'tag' + (o.value === actual ? ' tag--active' : ''));
      var a = el('a', 'tag__checkbox-wrapper text-label');
      a.href = u.toString();
      a.dataset.orden = o.value;
      a.appendChild(el('span', 'tag__checkbox'));
      a.appendChild(el('span', 'tag__text', t));
      li.appendChild(a);
      ul.appendChild(li);
    }
    if (!ul.firstChild) return;
    var grupo = el('div', 'collection-sidebar__group sv-orden');
    var boton = el('button', 'collapsible-trigger-btn tag-list__header sv-orden__boton', EN ? 'Sort' : 'Ordenar');
    boton.type = 'button';
    boton.setAttribute('aria-expanded', 'false');
    var flecha = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    flecha.setAttribute('viewBox', '0 0 28 16');
    flecha.setAttribute('aria-hidden', 'true');
    var trazo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    trazo.setAttribute('d', 'm1.57 1.59 12.76 12.77L27.1 1.59');
    trazo.setAttribute('stroke-width', '2');
    trazo.setAttribute('stroke', 'currentColor');
    trazo.setAttribute('fill', 'none');
    flecha.appendChild(trazo);
    boton.appendChild(flecha);
    var lista = el('div', 'sv-orden__lista');
    lista.hidden = true;
    lista.appendChild(ul);
    boton.addEventListener('click', function () {
      var abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      lista.hidden = abierto;
    });
    /* Con opciones marcadas sin aplicar, ordenar las incluye. */
    ul.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-orden]');
      if (!a || !pendiente) return;
      e.preventDefault();
      var p = limpios(menuForm());
      p.set('sort_by', a.dataset.orden);
      navegar(p);
    });
    grupo.appendChild(boton);
    grupo.appendChild(lista);
    form.appendChild(grupo);
  }

  var pendiente = false;

  /* Impulse pinta cada opcion dos veces (barra lateral y menu) con el mismo
   * id, y la etiqueta del menu marca la casilla de la barra lateral: el menu
   * se cierra y filtra al primer toque. Aqui cada una marca la suya. */
  document.addEventListener('click', function (e) {
    var lab = e.target.closest && e.target.closest('#FilterDrawer .filter-form label');
    var inp = lab && lab.querySelector('input[type="checkbox"]');
    if (!inp || e.target === inp) return;
    e.preventDefault();
    inp.checked = !inp.checked;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);

  /* El tema filtra con cada casilla; aqui se apunta y espera. */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || t.type !== 'checkbox' || !t.closest || !t.closest('#FilterDrawer .filter-form')) return;
    e.stopPropagation();
    var li = t.closest('li');
    if (li) li.classList.toggle('tag--active', t.checked);
    pendiente = true;
  }, true);

  function aplicar(form) {
    var col = laColeccion();
    if (!col || typeof col.renderFromFormData !== 'function') {
      var p = limpios(form);
      var orden = new URL(location.href).searchParams.get('sort_by');
      if (orden) p.set('sort_by', orden);
      navegar(p);
      return;
    }
    try { col.updateScroll(true); col.startLoading(); } catch (err) { /* sin rejilla */ }
    col.renderFromFormData(new FormData(form));
  }

  function verResultados(cerrar) {
    var form = menuForm();
    var habia = pendiente;
    var cajon = window.theme && window.theme.FilterDrawer;
    pendiente = false;
    if (cerrar && cajon && cajon.isOpen) cajon.close();
    if (habia && form) aplicar(form);
  }

  /* ---- Precio: ademas del slider, dos casillas para escribirlo ----
   * Pedido del 8-nov: «abajo del slider se debe poder escribir los valores».
   * Las dos cosas van juntas: mover el slider escribe las casillas, y escribir
   * mueve el slider. Lo escrito se respeta tal cual aunque el slider salte de
   * 10 en 10. En el menu se aplica como lo demas (Ver resultados, Enter o al
   * cerrarlo); en la columna de la izquierda, con Enter o al salir de ellas. */
  var conPrecio = nav.dataset.precio === 'si';
  if (nav.dataset.precio === 'prueba') {
    try {
      if (/[?&]sv-vista(=1)?(&|$)/.test(location.search)) sessionStorage.setItem('sv-vista', '1');
      conPrecio = sessionStorage.getItem('sv-vista') === '1';
    } catch (e) { /* privado */ }
  }
  var formato = (window.theme && theme.settings && theme.settings.moneyFormat) || '';
  var sinDecimales = /no_decimals/.test(formato);
  var fijando = false;

  /* El tema da formato a un texto con dos decimales («45.00»), no a un numero. */
  function dinero(n) {
    try { return theme.Currency.formatMoney(n.toFixed(2), formato); } catch (e) { return String(n); }
  }
  function enCasilla(n) {
    var t = dinero(n).replace(/[^\d.,]/g, '');
    return sinDecimales ? t : t.replace(/\.00$/, '');
  }
  function leerCifra(s) {
    var n = sinDecimales ? parseInt(String(s).replace(/\D/g, ''), 10) : parseFloat(String(s).replace(/[^\d.]/g, ''));
    return isNaN(n) ? null : n;
  }

  function casillasDe(caja) { return caja.querySelectorAll('.sv-precio input'); }

  function escribir(caja, vals) {
    if (fijando) return;
    var cs = casillasDe(caja);
    for (var i = 0; i < cs.length; i += 1) {
      if (document.activeElement !== cs[i]) cs[i].value = enCasilla(parseFloat(vals[i]) || 0);
    }
  }

  function fijar(caja) {
    var desliz = caja.querySelector('.price-range__slider');
    var cs = casillasDe(caja);
    var rmin = parseFloat(caja.dataset.min) || 0;
    var rmax = parseFloat(caja.dataset.max) || 100;
    var a = leerCifra(cs[0].value);
    var b = leerCifra(cs[1].value);
    a = Math.max(rmin, Math.min(rmax, a === null ? rmin : a));
    b = Math.max(rmin, Math.min(rmax, b === null ? rmax : b));
    if (a > b) { var t = a; a = b; b = t; }
    fijando = true;
    try { if (desliz && desliz.noUiSlider) desliz.noUiSlider.set([a, b]); } catch (e) { /* sin slider */ }
    fijando = false;
    caja.querySelector('.price-range__input-min').value = a > rmin ? a : '';
    caja.querySelector('.price-range__input-max').value = b < rmax ? b : '';
    cs[0].value = enCasilla(a);
    cs[1].value = enCasilla(b);
    var dmin = caja.querySelector('.price-range__display-min');
    var dmax = caja.querySelector('.price-range__display-max');
    if (dmin) dmin.textContent = dinero(a);
    if (dmax) dmax.textContent = dinero(b);
    caja.svSucio = true;
    if (caja.closest('#FilterDrawer')) pendiente = true;
  }

  function aplicarPrecio(caja) {
    if (!caja.svSucio) return;
    caja.svSucio = false;
    if (caja.closest('#FilterDrawer')) { verResultados(true); return; }
    var form = caja.closest('form');
    if (form) aplicar(form);
  }

  function casilla(rotulo, lado, moneda) {
    var lab = el('label', 'sv-precio__campo');
    lab.appendChild(el('span', 'sv-precio__rotulo', rotulo));
    var caja = el('span', 'sv-precio__caja');
    if (moneda) caja.appendChild(el('span', 'sv-precio__moneda', moneda));
    var inp = el('input');
    inp.type = 'text';
    inp.inputMode = sinDecimales ? 'numeric' : 'decimal';
    inp.autocomplete = 'off';
    inp.dataset.lado = lado;
    caja.appendChild(inp);
    lab.appendChild(caja);
    return lab;
  }

  function armarPrecio(caja) {
    var fila = caja.querySelector('.sv-precio');
    if (!fila) {
      var muestra = caja.querySelector('.price-range__display-min');
      var moneda = ((muestra && muestra.textContent.trim().match(/^[^\d\s.,]+/)) || [''])[0];
      fila = el('div', 'sv-precio');
      fila.appendChild(casilla(EN ? 'From' : 'Desde', 'min', moneda));
      fila.appendChild(casilla(EN ? 'To' : 'Hasta', 'max', moneda));
      var tras = caja.querySelector('.price-range__slider-wrapper');
      caja.insertBefore(fila, tras ? tras.nextSibling : null);
      /* Sin esto, el tema filtra (y cierra el menu) con cada tecla. */
      fila.addEventListener('input', function (e) { e.stopPropagation(); });
      fila.addEventListener('change', function (e) { e.stopPropagation(); fijar(caja); });
      fila.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        fijar(caja);
        aplicarPrecio(caja);
      });
      fila.addEventListener('focusout', function (e) {
        if (caja.closest('#FilterDrawer') || (e.relatedTarget && fila.contains(e.relatedTarget))) return;
        setTimeout(function () { aplicarPrecio(caja); }, 0);
      });
    }
    var desliz = caja.querySelector('.price-range__slider');
    var api = desliz && desliz.noUiSlider;
    if (!api || api.svPrecio) return;
    api.svPrecio = true;
    api.on('update.sv', function (vals) { escribir(caja, vals); });
    escribir(caja, api.get());
  }

  function casillasPrecio() {
    if (!conPrecio) return;
    var cajas = document.querySelectorAll('.price-range');
    for (var i = 0; i < cajas.length; i += 1) armarPrecio(cajas[i]);
  }

  function botonVer() {
    var cont = document.querySelector('#FilterDrawer .drawer__contents');
    if (!cont || cont.querySelector('.sv-ver')) return;
    var pie = el('div', 'sv-ver');
    var b = el('button', 'btn btn--full sv-ver__boton', EN ? 'View results' : 'Ver resultados');
    b.type = 'button';
    b.addEventListener('click', function () { verResultados(true); });
    pie.appendChild(b);
    cont.appendChild(pie);
  }

  /* Cerrarlo con la X o tocando fuera tambien aplica lo marcado: si no, el
   * menu diria una cosa y los productos otra. */
  var abiertoAntes = raiz.classList.contains('js-drawer-open');
  new MutationObserver(function () {
    var ahora = raiz.classList.contains('js-drawer-open');
    if (abiertoAntes && !ahora && pendiente) verResultados(false);
    abiertoAntes = ahora;
  }).observe(raiz, { attributes: true, attributeFilter: ['class'] });

  function alCambiar() {
    pintarPastillas();
    var forms = document.querySelectorAll('.filter-form');
    for (var i = 0; i < forms.length; i += 1) {
      ordenarGrupos(forms[i]);
      traducir(forms[i]);
    }
    ordenarEnMenu();
    botonVer();
    casillasPrecio();
  }

  /* El tema repinta productos y menu en cada filtro: se vuelve a ajustar. */
  var programado = false;
  function programar() {
    if (programado) return;
    programado = true;
    setTimeout(function () { programado = false; alCambiar(); }, 0);
  }

  document.addEventListener('collection:reloaded', function () {
    pendiente = false;
    if (volverA !== null) { window.scrollTo(0, volverA); volverA = null; }
    alCambiar();
  });
  window.addEventListener('popstate', programar);
  /* El slider del precio lo crea el tema al cargar, quiza despues de esto. */
  document.addEventListener('DOMContentLoaded', programar);
  window.addEventListener('load', programar);
  var obs = document.querySelector('.collection-content') || document.getElementById('CollectionAjaxContent');
  if (obs) new MutationObserver(programar).observe(obs, { childList: true, subtree: true });
  alCambiar();
}());
