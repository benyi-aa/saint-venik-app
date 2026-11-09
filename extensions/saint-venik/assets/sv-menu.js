/* Saint Venik · Menú del teléfono como gasper.co (reunión 9-nov).
 * Arma el cajón #NavDrawer de Impulse: logo a la izquierda, cada colección
 * en una tarjeta con su foto, lo demás como enlace simple. Ver docs/tema.md. */
(function () {
  'use strict';
  var C = window.svMenu;
  if (!C) return;
  var vista = false;
  try {
    if (/[?&]sv-vista(=1)?(&|$)/.test(location.search)) sessionStorage.setItem('sv-vista', '1');
    vista = sessionStorage.getItem('sv-vista') === '1';
  } catch (e) { /* modo privado */ }
  if (!(C.m === 'si' || (C.m === 'prueba' && vista))) return;

  var fotos = [];
  var cargadas = false;
  /* Las fotos se piden al ir a abrir el menú, no con cada página. Si el menú
   * no sale de la lista de Shopify (en .com lo arman bloques de la cabecera),
   * la foto de cada colección se busca en /collections.json, una vez. */
  function cargar() {
    if (cargadas) return;
    cargadas = true;
    var faltan = [];
    for (var i = 0; i < fotos.length; i += 1) {
      var s = fotos[i].getAttribute('data-src');
      if (s) fotos[i].src = s;
      else faltan.push(fotos[i]);
    }
    if (!faltan.length || !window.fetch) return;
    var raiz = ((window.Shopify && Shopify.routes && Shopify.routes.root) || '/').replace(/\/?$/, '/');
    fetch(raiz + 'collections.json?limit=250').then(function (r) { return r.json(); }).then(function (j) {
      var por = {};
      (j.collections || []).forEach(function (c) { if (c.image && c.image.src) por[c.handle] = c.image.src; });
      faltan.forEach(function (f) {
        var src = por[f.getAttribute('data-h')];
        if (src) f.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'width=240';
        else f.parentNode.removeChild(f);
      });
    }).catch(function () {
      faltan.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    });
  }

  function ruta(a) {
    try { return new URL(a.href, location.href).pathname.replace(/\/$/, ''); } catch (e) { return ''; }
  }

  function armar() {
    var d = document.getElementById('NavDrawer');
    if (!d || d.getAttribute('data-sv-menu')) return;
    d.setAttribute('data-sv-menu', '1');
    document.documentElement.classList.add('sv-menu');

    var titulo = d.querySelector('.drawer__title');
    var logo = document.querySelector('.site-header__logo img');
    if (titulo && logo) {
      var a = document.createElement('a');
      a.className = 'sv-menu-logo';
      a.href = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
      var img = document.createElement('img');
      img.src = logo.currentSrc || logo.src;
      img.alt = logo.alt || '';
      a.appendChild(img);
      titulo.appendChild(a);
    }

    var mapa = {};
    /* Las claves pueden venir relativas o con dominio (enlaces de tipo URL). */
    for (var k in C.f) {
      if (!k) continue;
      try { mapa[new URL(k, location.href).pathname.replace(/\/$/, '')] = C.f[k]; } catch (e) { /* nada */ }
    }

    var items = d.querySelectorAll('.mobile-nav > .mobile-nav__item');
    for (var i = 0; i < items.length; i += 1) {
      var li = items[i];
      var link = li.querySelector('a');
      var r = link && !li.querySelector('.mobile-nav__sublist') ? ruta(link) : '';
      var h = (/\/collections\/([^\/?#]+)$/.exec(r) || [])[1];
      var foto = mapa[r];
      if (!foto && (!h || h === 'all')) {
        li.classList.add('sv-menu-simple');
        continue;
      }
      li.classList.add('sv-menu-tarjeta');
      var f = document.createElement('img');
      f.className = 'sv-menu-foto';
      f.setAttribute('data-src', foto || '');
      f.setAttribute('data-h', h || '');
      f.alt = '';
      f.width = 80;
      f.height = 80;
      link.appendChild(f);
      fotos.push(f);
    }

    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.js-drawer-open-nav, [aria-controls="NavDrawer"]')) cargar();
    }, true);
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.js-drawer-open-nav, [aria-controls="NavDrawer"]')) cargar();
    }, true);
    window.addEventListener('load', function () { setTimeout(cargar, 4000); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar);
  else armar();
}());
