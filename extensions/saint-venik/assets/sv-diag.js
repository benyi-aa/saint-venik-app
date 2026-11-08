/* Saint Venik · diagnostico de la barra de carga.
 * Solo se carga con ?sv-diag=1 (se recuerda en la pestana). Pinta abajo una
 * caja con lo que pasa al cambiar de pagina, para leerla en un telefono sin
 * herramientas: si el toque llega, si el navegador sigue pintando despues del
 * toque, que avance se pasa a la pagina nueva y donde queda la barra.
 * Se apaga con ?sv-diag=0. Ver docs/tema.md, «La barra en el iPhone». */
(function () {
  'use strict';
  var K = 'sv-dlog';
  function leer(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* privado */ } }

  if (/[?&]sv-diag=0/.test(location.search)) {
    try { sessionStorage.removeItem('sv-diag'); sessionStorage.removeItem(K); } catch (e) { /* privado */ }
    return;
  }

  var pag = (location.pathname
    .replace(/^\/collections\/[^/]+\/products\//, 'p/')
    .replace(/^\/collections\//, 'c/')
    .replace(/^\/products\//, 'p/') || '/').slice(0, 14);
  var inicio = Date.now();

  var caja = null;
  function pintar() {
    if (!document.body) return;
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'sv-diag';
      caja.style.cssText = 'position:fixed;left:4px;right:4px;bottom:90px;z-index:2147483001;' +
        'max-height:46vh;overflow:hidden;padding:6px;background:rgba(255,255,255,.96);color:#000;' +
        'border:1px solid #000;font:10px/1.3 ui-monospace,Menlo,monospace;white-space:pre-wrap;' +
        'word-break:break-all;pointer-events:none';
      document.body.appendChild(caja);
    }
    var l;
    try { l = JSON.parse(leer(K) || '[]'); } catch (e) { l = []; }
    caja.textContent = '';
    var res = document.createElement('div');
    res.style.cssText = 'font:bold 15px/1.35 -apple-system,sans-serif;margin-bottom:4px';
    res.textContent = resumen(l);
    caja.appendChild(res);
    caja.appendChild(document.createTextNode('(?sv-diag=0 para quitar)\n' + l.slice(-14).join('\n')));
  }

  /* Tres respuestas en palabras, de la ultima vez que se toco un enlace:
   * si el toque llego, si Safari siguio pintando despues, y si la pagina
   * nueva recibio la barra. Se leen sin captura de pantalla. */
  function resumen(l) {
    var i = -1;
    for (var j = l.length - 1; j >= 0; j -= 1) {
      if (/ (CLICK|NAVIGATE) /.test(l[j])) { i = j; break; }
    }
    if (i < 0) return 'Toca un enlace y espera la pagina nueva';
    while (i > 0 && / (CLICK|NAVIGATE) /.test(l[i - 1])) i -= 1;
    var resto = l.slice(i).join('\n');
    var corte = resto.indexOf(' INI ');
    var antes = corte < 0 ? resto : resto.slice(0, corte);
    var despues = corte < 0 ? '' : resto.slice(corte);
    var c = /100ms cuadros=(\d+)/.exec(antes);
    var g = /guarda=\d+:([\d.]+)/.exec(antes);
    return 'TOQUE: ' + (/is-(viene|cargando)/.test(antes) ? 'SI' : 'NO') +
      ' · PINTA: ' + (c ? (Number(c[1]) > 2 ? 'SI' : 'NO') + ' (' + c[1] + ')' : '?') +
      ' · PASA: ' + (g ? g[1] : 'NADA') +
      ' · NUEVA: ' + (corte < 0 ? '...' : (/ms is-/.test(despues) ? 'SI' : 'NO'));
  }

  function log(t) {
    var l;
    try { l = JSON.parse(leer(K) || '[]'); } catch (e) { l = []; }
    l.push(pag + ' +' + (Date.now() - inicio) + ' ' + t);
    guardar(K, JSON.stringify(l.slice(-30)));
    pintar();
  }

  function estado() {
    var b = document.querySelector('.sv-barra');
    if (!b) return 'sin barra';
    var cs = getComputedStyle(b);
    var r = b.getBoundingClientRect();
    var m = /matrix\(([^,]+)/.exec(cs.transform || '');
    return (b.className.replace('sv-barra', '').trim() || 'base') +
      ' op=' + cs.opacity + ' x=' + (m ? Number(m[1]).toFixed(2) : cs.transform) +
      ' top=' + Math.round(r.top) + ' h=' + Math.round(r.height);
  }

  /* La barra, gruesa y roja mientras dura el diagnostico: que no haya duda
   * de si se ve o no. */
  var rojo = document.createElement('style');
  rojo.textContent = '.sv-barra{height:6px!important;background:#e00!important}';
  (document.head || document.documentElement).appendChild(rojo);

  /* Al cargar: que sabe hacer el navegador y que le dejo la pagina anterior
   * (el script de la barra lo borra justo despues, por eso se lee aqui). */
  var hs = window.HTMLScriptElement;
  var ver = (navigator.userAgent.match(/OS [\d_]+|Version\/[\d.]+|CriOS\/[\d.]+/g) || []).join(' ');
  log('INI ' + ver +
    ' spec=' + Boolean(hs && hs.supports && hs.supports('speculationrules')) +
    ' nav=' + Boolean(window.navigation) +
    ' vt=' + Boolean(window.CSS && CSS.supports && CSS.supports('view-transition-name: a')) +
    ' vista=' + leer('sv-vista') +
    ' trae=' + (leer('sv-barra') || '-'));

  /* Despues de un toque: si el navegador sigue pintando (cuadros por segundo)
   * y como va la barra a los 0,1 / 0,4 / 1 s. */
  var cuadros = 0;
  var midiendo = false;
  function medir(origen) {
    log(origen + ' -> ' + estado());
    if (midiendo) return;
    midiendo = true;
    (function cuadro() { cuadros += 1; requestAnimationFrame(cuadro); })();
    [100, 400, 1000].forEach(function (ms) {
      setTimeout(function () { log(ms + 'ms cuadros=' + cuadros + ' ' + estado()); }, ms);
    });
  }

  if (window.navigation && window.navigation.addEventListener) {
    window.navigation.addEventListener('navigate', function (e) {
      /* Recargar o volver atras no lleva barra: no cuenta como toque. */
      if (e.navigationType === 'reload' || e.navigationType === 'traverse') {
        log('(' + e.navigationType + ')');
        return;
      }
      medir('NAVIGATE ' + e.navigationType + (e.destination && e.destination.sameDocument ? ' misma' : ''));
    });
  }
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) medir('CLICK ' + (a.getAttribute('href') || '').slice(0, 22) + (e.defaultPrevented ? ' cancelado' : ''));
  });
  window.addEventListener('pageswap', function (e) {
    log('PAGESWAP vt=' + Boolean(e.viewTransition) + ' ' + estado());
  });
  window.addEventListener('pagehide', function (e) {
    log('PAGEHIDE cuadros=' + cuadros + ' guarda=' + (leer('sv-barra') || '-') + ' ' + estado());
  });
  window.addEventListener('pagereveal', function (e) {
    log('PAGEREVEAL vt=' + Boolean(e.viewTransition) + ' ' + estado());
    setTimeout(function () { log('+50ms ' + estado()); }, 50);
    setTimeout(function () { log('+400ms ' + estado()); }, 400);
  });
  document.addEventListener('DOMContentLoaded', function () {
    var v = window.visualViewport;
    log('DCL ' + estado() + ' alto=' + innerHeight + (v ? ' vvTop=' + Math.round(v.offsetTop) : ''));
    setTimeout(function () { log('DCL+100ms ' + estado()); }, 100);
  });
}());
