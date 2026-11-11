/* Saint Venik · Insignias y beneficios sobre las fotos. Tope de Shopify: 10000 B.
 * El porque de cada decision: docs/tema.md, «Notas de sv-badges.js». */
(function () {
  'use strict';

  var fuente = document.getElementById('sv-insignias-datos');
  if (!fuente) return;

  var datos;
  try {
    datos = JSON.parse(fuente.textContent);
  } catch (e) {
    return;
  }
  var hayEtiquetas = datos && datos.etiquetas && datos.etiquetas.length;
  var hayBeneficios = datos && datos.beneficios && datos.beneficios.length;

  /* Lo pone sv-descuento.js, que llega despues. */
  var DESC = null;

  var MARCA = 'svInsignias';
  var MARCA_FOTO = 'svBeneficio';
  var MAXIMO = datos.maximo || 2;

  /* La URL, por si el tema no da product. */
  var FICHA = datos.ficha || (location.pathname.match(/\/products\/([^/?#]+)/) || [])[1] || null;
  var FICHA_ID = datos.fichaId || null;

  var etiquetas = (datos.etiquetas || []).slice().sort(function (a, b) {
    return (a.orden || 0) - (b.orden || 0);
  });

  /* |handles|: «oro» no casa con «collar-oro». */
  function alcanza(etiqueta, handle, enLaColeccion, id) {
    var lista = etiqueta.handles || '';
    /* Por id primero: el handle se traduce. */
    if (id && lista.indexOf('|' + id + '|') !== -1) return true;
    if (handle && lista.indexOf('|' + handle + '|') !== -1) return true;

    /* En el grid vale la coleccion; fuera, no. */
    if (!enLaColeccion || !etiqueta.colecciones) return false;
    return etiqueta.colecciones.indexOf(datos.coleccion) !== -1;
  }

  function paraHandle(handle, enLaColeccion, id) {
    var salen = [];
    for (var i = 0; i < etiquetas.length && salen.length < MAXIMO; i += 1) {
      if (alcanza(etiquetas[i], handle, enLaColeccion, id)) salen.push(etiquetas[i]);
    }
    return salen;
  }

  function enGridDeColeccion(tarjeta) {
    if (!datos.coleccion) return false;
    return Boolean(tarjeta.closest('[id*="main-collection"]'));
  }

  function caja(lista, esquina, tipo) {
    var cont = document.createElement('div');
    cont.className = 'sv-tags sv-tags--' + esquina + ' sv-tags--' + tipo;
    for (var i = 0; i < lista.length; i += 1) {
      var span = document.createElement('span');
      span.className = 'sv-tag';
      span.textContent = lista[i].texto;
      span.style.backgroundColor = lista[i].fondo;
      span.style.color = lista[i].color;
      if (lista[i].grosor) {
        span.style.borderWidth = lista[i].grosor + 'px';
        span.style.borderColor = lista[i].borde;
      }
      cont.appendChild(span);
    }
    return cont;
  }

  function anclar(nodo) {
    if (getComputedStyle(nodo).position === 'static') nodo.style.position = 'relative';
    return nodo;
  }

  /* Una medida por pasada. */
  var altoDelTema = null;

  /* La del tema visible (con descuento, «AHORRA» no cuenta). */
  function etiquetaDelTema(tarjeta) {
    var suyas = tarjeta.querySelectorAll('.grid-product__tag');
    for (var i = 0; i < suyas.length; i += 1) {
      if (DESC && DESC.tarjetas && suyas[i].classList.contains('grid-product__tag--sale')) continue;
      return suyas[i];
    }
    return null;
  }

  function altoInsigniaTema(tarjeta) {
    var suya = etiquetaDelTema(tarjeta);
    if (!suya) return 0;
    if (altoDelTema === null || altoDelTema === 0) altoDelTema = suya.offsetHeight || 0;
    return altoDelTema;
  }

  function decorarTarjeta(tarjeta) {
    if (tarjeta.dataset[MARCA]) return;

    var destino = tarjeta.querySelector('.grid-product__image-mask')
      || tarjeta.querySelector('.grid__item-image-wrapper');
    /* Sin caja de imagen: la proxima pasada. */
    if (!destino) return;

    tarjeta.dataset[MARCA] = '1';

    var lista = datos.tarjetas ? paraHandle(
      tarjeta.dataset.productHandle, enGridDeColeccion(tarjeta), tarjeta.dataset.productId
    ) : [];
    var pct = DESC && DESC.tarjetas ? DESC.pctTarjeta(tarjeta) : 0;
    if (!lista.length && !pct) return;

    var izquierda = datos.esquinaTarjeta === 'izquierda';

    /* Descuento primero, arriba a la izquierda; las de la izquierda, debajo. */
    var cont = caja(izquierda || pct ? (izquierda ? lista : []) : lista,
      pct ? 'izquierda' : datos.esquinaTarjeta, 'tarjeta');
    if (pct) cont.insertBefore(DESC.span(pct), cont.firstChild);

    /* Bajo la del tema, medida. */
    if (izquierda || pct) {
      var alto = altoInsigniaTema(tarjeta);
      if (alto) cont.style.top = 'calc(var(--sv-tags-top, 8px) + ' + (alto + 6) + 'px)';
    }

    anclar(destino).appendChild(cont);

    if (pct && !izquierda && lista.length) {
      anclar(destino).appendChild(caja(lista, datos.esquinaTarjeta, 'tarjeta'));
    }
  }

  /* Fotos de la galeria, en orden. */
  function fotosDeLaFicha() {
    var fotos = document.querySelectorAll('.product-main-slide[data-index] .product-image-main');
    return fotos.length ? fotos : document.querySelectorAll('.product-image-main');
  }

  function decorarFicha() {
    if (!FICHA && !FICHA_ID) return;

    /* En la ficha vale solo la lista de handles. */
    var lista = datos.fichas ? paraHandle(FICHA, false, FICHA_ID) : [];
    var conDesc = Boolean(DESC && DESC.foto);
    if (!lista.length && !conDesc) return;
    var pct = conDesc ? DESC.pctFicha() : 0;

    /* En todas las fotos; con 'segunda', en el computador solo en la 2.ª. */
    var fotos = fotosDeLaFicha();
    for (var i = 0; i < fotos.length; i += 1) {
      if (fotos[i].dataset[MARCA]) continue;
      fotos[i].dataset[MARCA] = '1';
      var cont = caja(lista, datos.esquinaFicha, 'ficha');
      if (conDesc) {
        var d = DESC.registrar(DESC.span(pct));
        if (DESC.fotoCompu === 'segunda' && i !== 1) d.classList.add('sv-tag--movil');
        cont.insertBefore(d, cont.firstChild);
      }
      anclar(fotos[i]).appendChild(cont);
    }
  }

  /* Clase del tema + atributo. */
  var TARJETAS = '.grid-product[data-product-handle], .grid__item[data-product-handle]';

  /* Un beneficio por foto, desde la segunda. */
  function decorarFotos() {
    var lista = datos.beneficios;
    if (!lista || !lista.length) return;

    var slides = fotosDeLaFicha();

    var tope = Math.min(lista.length, datos.maxFotos || 3);
    for (var i = 0; i < tope; i += 1) {
      var destino = slides[i + 1];
      if (!destino) break;
      if (destino.dataset[MARCA_FOTO]) continue;
      destino.dataset[MARCA_FOTO] = '1';

      var pildora = document.createElement('span');
      pildora.className = 'sv-benef-foto sv-benef-foto--' + (datos.esquinaFoto || 'arriba-derecha');
      /* svg de la extension; texto del comerciante. */
      pildora.innerHTML = lista[i].icono || '';
      var texto = document.createElement('span');
      texto.textContent = lista[i].texto;
      pildora.appendChild(texto);

      anclar(destino).appendChild(pildora);
    }
  }

  function decorar(raiz) {
    altoDelTema = null;
    if (datos.tarjetas || (DESC && DESC.tarjetas)) {
      var tarjetas = raiz.querySelectorAll(TARJETAS);
      for (var i = 0; i < tarjetas.length; i += 1) decorarTarjeta(tarjetas[i]);
    }
    if (datos.fichas || (DESC && DESC.foto)) decorarFicha();
    if (DESC && DESC.precio) DESC.decorarPrecio();
    if (DESC && (DESC.foto || DESC.precio)) DESC.vigilar();
    if (datos.fotos) decorarFotos();
  }

  var pendiente = false;
  function pintarPronto(raiz) {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      decorar(raiz || document);
    });
  }

  function arrancar() {
    decorar(document);

    /* Ignora sus propios nodos (si no, bucle de pasadas). */
    new MutationObserver(function (cambios) {
      for (var i = 0; i < cambios.length; i += 1) {
        var nuevos = cambios[i].addedNodes;
        for (var j = 0; j < nuevos.length; j += 1) {
          var n = nuevos[j];
          if (n.nodeType !== 1) continue;
          if (n.classList.contains('sv-tags') || n.classList.contains('sv-desc-precio')
            || n.classList.contains('sv-benef-foto')) continue;
          pintarPronto(document);
          return;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });

    if (datos.editor) {
      document.addEventListener('shopify:section:load', function (e) {
        decorar(e.target || document);
      });
    }
  }

  var empezado = false;
  function empezar() {
    if (empezado) return;
    empezado = true;
    DESC = window.svDescuento ? window.svDescuento(datos.descuento) : null;
    if (!hayEtiquetas && !hayBeneficios && !DESC) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', arrancar);
    } else {
      arrancar();
    }
  }

  if (datos.descuento && !window.svDescuento) {
    document.addEventListener('sv:descuento', empezar);
    /* Si no llega, salen igual. */
    window.addEventListener('load', empezar);
  } else {
    empezar();
  }
}());
