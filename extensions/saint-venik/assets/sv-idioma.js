/* Saint Venik · El popup de Klaviyo en inglés en saintvenik.com/en (13-nov).
 *
 * El popup «Email List - POPUP» (id VKMBpJ, cuenta Klaviyo de .com) existe en un solo idioma,
 * español, y Klaviyo no traduce formularios: lo oficial es tener un formulario por idioma con
 * reglas de URL, y eso se hace dentro de Klaviyo. Mientras tanto, este script traduce el popup
 * cuando la página está en inglés. Solo se carga en /en (insignias.liquid lo pide si
 * request.locale es 'en'), así que en español no hace nada.
 *
 * Klaviyo arma el formulario en la página misma (form.klaviyo-form, sin iframe) y va cambiando
 * de pantalla (botón → correo → listo), así que se vigila con un MutationObserver y se traduce
 * lo que aparezca. Se compara el texto normalizado (sin espacios de ancho cero ni duros) contra
 * el diccionario: si alguien cambia el texto en Klaviyo, esa línea queda en español hasta que se
 * agregue aquí (docs/tema.md, «Popup de Klaviyo en inglés»).
 */
(function () {
  'use strict';

  var TEXTOS = {
    'DESBLOQUEASTE UN': 'YOU UNLOCKED AN',
    'DESCUENTO': 'EXTRA',
    'EXTRA': 'DISCOUNT',
    'RECLAMAR DESCUENTO': 'CLAIM DISCOUNT',
    'Prefiero pagar el precio completo.': 'I\u2019d rather pay full price.',
    'Desbloqueaste un': 'You unlocked an',
    'DESCUENTO EXTRA': 'EXTRA DISCOUNT',
    'Ingresa el correo electrónico al que deseas recibirlo': 'Enter the email where you\u2019d like to receive it',
    /* En la pantalla del correo esa frase viene en dos líneas (un <br> entre medio). */
    'Ingresa el correo electrónico': 'Enter the email address',
    'al que deseas recibirlo': 'where you\u2019d like to receive it',
    '¡RECLAMAR DESCUENTO!': 'CLAIM DISCOUNT!',
    'Dirección inválida': 'Invalid email address',
    'LISTO, ¡YA LO TIENES!': 'DONE, IT\u2019S YOURS!',
    'Tu código de descuento ya fue enviado al correo electrónico que acabas de ingresar. Podría tardar uno o dos minutos en llegar.':
      'Your discount code has been sent to the email you just entered. It may take a minute or two to arrive.',
    'SEGUIR COMPRANDO': 'KEEP SHOPPING'
  };
  var MARCADORES = { 'Tu correo aquí.': 'Your email here.' };

  /* Lo que se edita en el panel (pestaña «Inglés», 13-nov) va encima de lo fijo. Llega en
   * window.svIngles.popup, que escribe insignias.liquid antes de cargar este archivo. Lo que
   * no está ahí se sigue traduciendo con el diccionario de arriba. */
  var delPanel = window.svIngles && window.svIngles.popup;
  if (delPanel && typeof delPanel === 'object') {
    Object.keys(delPanel).forEach(function (k) {
      var v = delPanel[k];
      var nk = normal(k);
      if (typeof v !== 'string' || !v || !nk) return;
      if (Object.prototype.hasOwnProperty.call(MARCADORES, nk)) MARCADORES[nk] = v;
      else TEXTOS[nk] = v;
    });
  }

  /* «EXTRA» en la primera pantalla va en letra enorme; «DISCOUNT» tiene 8 letras en vez de 5 y
   * se saldría del recuadro, así que se achica en la misma proporción. */
  var ACHICAR = { 'DISCOUNT': 0.62 };

  function normal(t) {
    return String(t || '').replace(/[\u200B\u00A0]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* Lo ya traducido no se vuelve a mirar: «DESCUENTO» pasa a «EXTRA», y «EXTRA» también es una
   * clave (la línea grande), así que sin esto la segunda vuelta lo convertiría en «DISCOUNT». */
  var hechos = new WeakSet();

  function traducirNodo(nodo) {
    if (hechos.has(nodo)) return false;
    var clave = normal(nodo.nodeValue);
    if (!clave || !Object.prototype.hasOwnProperty.call(TEXTOS, clave)) return false;
    var nuevo = TEXTOS[clave];
    hechos.add(nodo);
    nodo.nodeValue = nuevo;
    var factor = ACHICAR[nuevo];
    var el = nodo.parentElement;
    if (factor && el && !el.hasAttribute('data-sv-achicado')) {
      el.setAttribute('data-sv-achicado', '');
      el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * factor) + 'px';
    }
    return true;
  }

  /* textContent pega las palabras a los dos lados de un <br> («electrónicoal que»): aquí el
   * salto cuenta como espacio. */
  function textoDe(el) {
    var t = '';
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (w.nextNode()) {
      var n = w.currentNode;
      if (n.nodeType === 3) t += n.nodeValue;
      else if (n.tagName === 'BR') t += ' ';
    }
    return t;
  }

  function traducir(form) {
    /* Primero texto por texto: así se conserva el formato de cada línea. */
    var caminante = document.createTreeWalker(form, NodeFilter.SHOW_TEXT);
    var nodos = [];
    while (caminante.nextNode()) nodos.push(caminante.currentNode);
    nodos.forEach(traducirNodo);

    /* Un párrafo largo puede venir partido en varios trozos: si el párrafo entero coincide, se
     * reemplaza completo. */
    form.querySelectorAll('p, button, div.klaviyo-form-richtext').forEach(function (el) {
      var clave = normal(textoDe(el));
      if (el.children.length && Object.prototype.hasOwnProperty.call(TEXTOS, clave)) {
        var primero = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        var textos = [];
        while (primero.nextNode()) textos.push(primero.currentNode);
        if (!textos.length || hechos.has(textos[0])) return;
        textos.forEach(function (t) { hechos.add(t); });
        textos[0].nodeValue = TEXTOS[clave];
        for (var i = 1; i < textos.length; i++) textos[i].nodeValue = '';
      }
    });

    form.querySelectorAll('input[placeholder]').forEach(function (input) {
      var ph = normal(input.getAttribute('placeholder'));
      if (Object.prototype.hasOwnProperty.call(MARCADORES, ph)) input.setAttribute('placeholder', MARCADORES[ph]);
    });
    form.querySelectorAll('img[alt]').forEach(function (img) {
      if (/decants/i.test(img.getAttribute('alt'))) img.setAttribute('alt', 'Saint Venik');
    });
  }

  var pendiente = false;
  function revisar() {
    pendiente = false;
    document.querySelectorAll('form.klaviyo-form').forEach(traducir);
  }
  function programar() {
    if (pendiente) return;
    pendiente = true;
    /* setTimeout y no requestAnimationFrame: el segundo se pausa en pestañas de fondo, y el
     * popup puede abrirse justo cuando la pestaña vuelve al frente. */
    setTimeout(revisar, 30);
  }

  new MutationObserver(programar).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true
  });
  programar();
})();

/* Saint Venik · Revisor de /en (13-nov).
 *
 * Solo se enciende con ?sv-revisar=1 en la dirección (botón «Abrir el revisor» de la pestaña
 * «Inglés» del panel): ningún cliente lo ve. Marca los textos de la página que parecen estar
 * en español y, si se pide, recorre las páginas principales cargándolas en un marco oculto
 * (misma tienda, así que se puede leer lo que pintan los scripts, ya traducido).
 *
 * Cómo decide que algo está en español: tildes, ñ, ¿ o ¡, o palabras que solo existen en
 * español (dos o más, o una de las «fuertes» como «carrito»). Es una ayuda para mirar, no un
 * juez: puede marcar un nombre propio o dejar pasar una frase corta.
 */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  if (!q.has('sv-revisar') || window.top !== window.self) return;

  var FUERTES = ['agregar', 'añadir', 'carrito', 'envío', 'gratis', 'comprar', 'descuento', 'joyas', 'pulsera',
    'pulseras', 'colgante', 'colgantes', 'anillo', 'anillos', 'cadena', 'cadenas', 'talla', 'tallas', 'precio',
    'ahorra', 'novedad', 'vendido', 'hombre', 'regalo', 'clientes', 'garantía', 'seguir', 'comprando', 'pagar',
    'agotado', 'disponible', 'cantidad', 'buscar', 'búsqueda', 'resultados', 'tienda', 'inicio', 'cerrar',
    'correo', 'iniciar', 'sesión', 'pedido', 'opiniones', 'reseñas', 'también', 'nuestra', 'nuestro', 'elige',
    'plateado', 'dorado', 'todos', 'ahora', 'llévate', 'oferta'];
  var DEBILES = ['de', 'el', 'la', 'los', 'las', 'del', 'para', 'con', 'por', 'una', 'tu', 'tus', 'y', 'que',
    'en', 'es', 'se', 'al', 'lo', 'más', 'oro', 'plata', 'ver', 'todo', 'mi', 'su', 'sus'];
  var FUERTE = new Set(FUERTES);
  var DEBIL = new Set(DEBILES);

  function pareceEspanol(texto) {
    var t = texto.replace(/\s+/g, ' ').trim();
    if (t.length < 3 || !/[a-záéíóúñ]/i.test(t)) return false;
    if (/[¿¡ñÑ]|[áéíóú]/.test(t)) return true;
    var palabras = t.toLowerCase().match(/[a-záéíóúñü]+/g) || [];
    var fuertes = 0;
    var debiles = 0;
    palabras.forEach(function (p) {
      if (FUERTE.has(p)) fuertes += 1;
      else if (DEBIL.has(p)) debiles += 1;
    });
    return fuertes >= 1 || debiles >= 2;
  }

  function visible(el) {
    if (!el || !el.getClientRects || !el.getClientRects().length) return false;
    var cs = el.ownerDocument.defaultView.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  /* Devuelve [{ texto, el, oculto }] de un documento, sin repetir textos. */
  function escanear(doc) {
    var vistos = new Set();
    var res = [];
    var raiz = doc.body;
    if (!raiz) return res;
    var w = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) {
      var el = n.parentElement;
      if (!el || el.closest('script, style, noscript, template, #sv-revisor')) continue;
      var t = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (!t || vistos.has(t) || !pareceEspanol(t)) continue;
      vistos.add(t);
      res.push({ texto: t, el: el, oculto: !visible(el) });
    }
    doc.querySelectorAll('input[placeholder], textarea[placeholder], input[type="submit"][value], button[aria-label]').forEach(function (el) {
      if (el.closest('#sv-revisor')) return;
      var t = (el.getAttribute('placeholder') || el.getAttribute('value') || el.getAttribute('aria-label') || '').trim();
      if (!t || vistos.has(t) || !pareceEspanol(t)) return;
      vistos.add(t);
      res.push({ texto: t, el: el, oculto: !visible(el) });
    });
    return res.sort(function (a, b) { return (a.oculto ? 1 : 0) - (b.oculto ? 1 : 0); });
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  var caja = document.createElement('div');
  caja.id = 'sv-revisor';
  caja.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:2147483647;width:380px;max-width:calc(100vw - 24px);max-height:62vh;overflow:auto;background:#fff;color:#111;border:1px solid #ccc;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font:13px/1.4 -apple-system,Helvetica,Arial,sans-serif;padding:12px');
  document.body.appendChild(caja);

  var marcados = [];
  function limpiarMarcas() {
    marcados.forEach(function (el) { el.style.outline = el.dataset.svOutline || ''; });
    marcados = [];
  }

  function boton(txt, accion) {
    return '<button type="button" data-a="' + accion + '" style="font:inherit;font-size:12px;padding:4px 9px;margin:0 6px 6px 0;border:1px solid #bbb;border-radius:6px;background:#f6f6f6;cursor:pointer">' + txt + '</button>';
  }

  function pintarPagina() {
    limpiarMarcas();
    var r = escanear(document);
    var visibles = r.filter(function (x) { return !x.oculto; });
    r.forEach(function (x) {
      if (x.oculto) return;
      x.el.dataset.svOutline = x.el.style.outline || '';
      x.el.style.outline = '2px solid #e0007a';
      marcados.push(x.el);
    });
    caja.innerHTML = '<strong>Revisor de /en</strong> · esta página<br>' +
      '<span style="color:#555">' + (visibles.length ? visibles.length + ' texto' + (visibles.length === 1 ? '' : 's') + ' a la vista parecen español (marcados en rosa)' : 'Nada en español a la vista') +
      (r.length - visibles.length ? '; ' + (r.length - visibles.length) + ' más en menús o ventanas cerradas' : '') + '.</span><br><br>' +
      boton('Revisar de nuevo', 'otra') + boton('Revisar las páginas principales', 'todas') + boton('Cerrar', 'cerrar') +
      '<ol style="margin:6px 0 0;padding-left:20px">' + r.slice(0, 80).map(function (x, i) {
        return '<li data-i="' + i + '" style="margin:3px 0;cursor:pointer' + (x.oculto ? ';color:#777' : '') + '">' + esc(x.texto.slice(0, 140)) + (x.oculto ? ' <em>(oculto)</em>' : '') + '</li>';
      }).join('') + '</ol>';
    caja.querySelectorAll('li[data-i]').forEach(function (li) {
      li.addEventListener('click', function () {
        var x = r[Number(li.dataset.i)];
        if (x && x.el.scrollIntoView) x.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
  }

  function paginas() {
    var raiz = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/en/';
    var lista = ['', 'collections/cadenas', 'collections/pulseras', 'collections/colgantes', 'collections/anillos',
      'collections/best-sellers', 'pages/arma-tu-3x2', 'cart', 'search?q=cadena'].map(function (p) { return raiz + p; });
    return fetch(raiz + 'collections/cadenas/products.json?limit=1').then(function (r) { return r.json(); })
      .then(function (d) {
        var h = d && d.products && d.products[0] && d.products[0].handle;
        if (h) lista.splice(1, 0, raiz + 'products/' + h);
        return lista;
      }).catch(function () { return lista; });
  }

  function cargar(url) {
    return new Promise(function (listo) {
      var f = document.createElement('iframe');
      f.setAttribute('style', 'position:fixed;left:-3000px;top:0;width:1280px;height:900px;border:0');
      f.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'sv-revisar-marco=1';
      var fin = setTimeout(function () { terminar(); }, 25000);
      function terminar() {
        clearTimeout(fin);
        var r = [];
        try { r = escanear(f.contentDocument).map(function (x) { return { texto: x.texto, oculto: x.oculto }; }); } catch (e) { r = null; }
        f.remove();
        listo(r);
      }
      f.addEventListener('load', function () { setTimeout(terminar, 4500); });
      document.body.appendChild(f);
    });
  }

  function revisarTodas() {
    limpiarMarcas();
    caja.innerHTML = '<strong>Revisor de /en</strong> · preparando…';
    paginas().then(function (lista) {
      var resultados = [];
      var i = 0;
      function siguiente() {
        if (i >= lista.length) return pintarTodas(resultados);
        var url = lista[i];
        caja.innerHTML = '<strong>Revisor de /en</strong> · revisando ' + (i + 1) + ' de ' + lista.length + '…<br><span style="color:#555">' + esc(url) + '</span>';
        cargar(url).then(function (r) {
          resultados.push({ url: url, r: r });
          i += 1;
          siguiente();
        });
      }
      siguiente();
    });
  }

  function pintarTodas(resultados) {
    var total = 0;
    var html = resultados.map(function (p) {
      if (p.r === null) return '<p><strong>' + esc(p.url) + '</strong><br><span style="color:#a00">No se pudo leer.</span></p>';
      var vis = p.r.filter(function (x) { return !x.oculto; });
      total += vis.length;
      return '<p style="margin:8px 0 2px"><a href="' + esc(p.url) + (p.url.indexOf('?') < 0 ? '?' : '&') + 'sv-revisar=1" target="_blank"><strong>' + esc(p.url) + '</strong></a> — ' +
        (vis.length ? vis.length + ' a la vista' : '✓ nada a la vista') + (p.r.length - vis.length ? ', ' + (p.r.length - vis.length) + ' oculto' + (p.r.length - vis.length === 1 ? '' : 's') : '') + '</p>' +
        (p.r.length ? '<ul style="margin:0;padding-left:18px">' + p.r.slice(0, 25).map(function (x) {
          return '<li' + (x.oculto ? ' style="color:#777"' : '') + '>' + esc(x.texto.slice(0, 120)) + (x.oculto ? ' <em>(oculto)</em>' : '') + '</li>';
        }).join('') + '</ul>' : '');
    }).join('');
    caja.innerHTML = '<strong>Revisor de /en</strong> · ' + resultados.length + ' páginas, ' + total + ' textos a la vista en español<br>' +
      '<span style="color:#555">«Oculto» = en un menú, el carrito o una ventana cerrada. El enlace de cada página la abre con el revisor.</span><br><br>' +
      boton('Volver a esta página', 'otra') + boton('Cerrar', 'cerrar') + html;
  }

  caja.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-a]') : null;
    if (!b) return;
    if (b.dataset.a === 'otra') pintarPagina();
    if (b.dataset.a === 'todas') revisarTodas();
    if (b.dataset.a === 'cerrar') { limpiarMarcas(); caja.remove(); }
  });

  /* Se espera a que los scripts de la página (traducciones, popup) terminen. */
  caja.innerHTML = '<strong>Revisor de /en</strong> · esperando a que la página termine de cargar…';
  if (document.readyState === 'complete') setTimeout(pintarPagina, 3500);
  else window.addEventListener('load', function () { setTimeout(pintarPagina, 3500); });
})();
