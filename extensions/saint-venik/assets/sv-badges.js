/* Saint Venik · Insignias y beneficios sobre las fotos
 *
 * Los datos vienen resueltos en el JSON que emite el bloque: aqui no se pide
 * nada a la red, solo se colocan nodos. El porque de cada decision esta en
 * docs/tema.md, seccion "Insignias y beneficios"; en resumen:
 *   - el tema ya ocupa la esquina superior izquierda, asi que la nuestra se
 *     coloca debajo de la suya en vez de taparla;
 *   - el grid se repinta sin recargar (filtros, paginacion) y no hay evento
 *     de storefront que avise: de ahi el MutationObserver y que decorar tenga
 *     que poder repetirse sin duplicar nada;
 *   - en el editor de temas si hay evento y hay que escucharlo.
 */
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
  if (!hayEtiquetas && !hayBeneficios) return;

  var MARCA = 'svInsignias';
  var MARCA_FOTO = 'svBeneficio';
  var MAXIMO = datos.maximo || 2;

  /* El handle de la ficha deberia venir del Liquid, pero un app embed no tiene
   * garantizado el objeto `product` en todos los temas. La URL si lo tiene, y
   * cuesta una linea: asi la insignia de la ficha no depende de eso. */
  var FICHA = datos.ficha || (location.pathname.match(/\/products\/([^/?#]+)/) || [])[1] || null;
  var FICHA_ID = datos.fichaId || null;

  var etiquetas = (datos.etiquetas || []).slice().sort(function (a, b) {
    return (a.orden || 0) - (b.orden || 0);
  });

  /* El panel guarda los handles entre barras (|anillo|collar|) justamente para
   * poder preguntar asi, sin partir la cadena y sin que "oro" case con
   * "collar-oro". */
  function alcanza(etiqueta, handle, enLaColeccion, id) {
    var lista = etiqueta.handles || '';
    /* Primero por id, que es el mismo en los dos idiomas. El handle se
     * traduce: en ingles "anillo-signet" es "signet-ring", asi que solo con
     * el handle la tienda en ingles se quedaba sin insignias. */
    if (id && lista.indexOf('|' + id + '|') !== -1) return true;
    if (handle && lista.indexOf('|' + handle + '|') !== -1) return true;

    /* Dentro del grid de una coleccion vale la coleccion aunque el handle no
     * este en la lista (puede haberse quedado vieja). Fuera del grid NO: las
     * tarjetas de recomendados no son de esa coleccion. */
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

  /* El grid principal de la coleccion, que es el unico sitio donde el atajo de
   * arriba es cierto. En Impulse la seccion se llama ...__main-collection. */
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

  /* La insignia se posiciona respecto de su contenedor, asi que el contenedor
   * tiene que estar posicionado. Casi siempre ya lo esta; se comprueba en vez
   * de darlo por hecho porque un tema que lo deje en static manda la insignia
   * a la esquina de la pagina, y eso se ve rarisimo y no da ningun error. */
  function anclar(nodo) {
    if (getComputedStyle(nodo).position === 'static') nodo.style.position = 'relative';
    return nodo;
  }

  /* Mide lo mismo en todas las tarjetas: se mide una vez por pasada. Medirla
   * por tarjeta eran ochenta reflujos seguidos dentro del mismo frame. */
  var altoDelTema = null;

  function altoInsigniaTema(tarjeta) {
    if (altoDelTema !== null) return altoDelTema;
    var suya = tarjeta.querySelector('.grid-product__tag');
    altoDelTema = suya && suya.offsetHeight ? suya.offsetHeight : 0;
    return altoDelTema;
  }

  function decorarTarjeta(tarjeta) {
    if (tarjeta.dataset[MARCA]) return;

    var destino = tarjeta.querySelector('.grid-product__image-mask')
      || tarjeta.querySelector('.grid__item-image-wrapper');
    /* Sin caja de imagen no hay donde ponerla, y tampoco se marca: si el tema
     * termina de pintar la tarjeta despues, la siguiente pasada la coge. */
    if (!destino) return;

    tarjeta.dataset[MARCA] = '1';

    var lista = paraHandle(
      tarjeta.dataset.productHandle, enGridDeColeccion(tarjeta), tarjeta.dataset.productId
    );
    if (!lista.length) return;

    var cont = caja(lista, datos.esquinaTarjeta, 'tarjeta');

    /* Debajo de la del tema, no encima. Se mide en vez de poner un numero fijo
     * porque la del tema crece con el tamano de letra del tema. */
    if (datos.esquinaTarjeta === 'izquierda') {
      var alto = altoInsigniaTema(tarjeta);
      if (alto) cont.style.top = 'calc(var(--sv-tags-top, 8px) + ' + (alto + 6) + 'px)';
    }

    anclar(destino).appendChild(cont);
  }

  function decorarFicha() {
    if (!FICHA && !FICHA_ID) return;

    /* Solo sobre la primera foto. En escritorio el tema las enseña todas a la
     * vez: una insignia por foto serian seis insignias iguales. */
    var destino = document.querySelector('.product-main-slide[data-index="0"] .product-image-main')
      || document.querySelector('.product-image-main');
    if (!destino || destino.dataset[MARCA]) return;
    destino.dataset[MARCA] = '1';

    /* En la ficha no se usa el atajo de coleccion: lo que vale es la lista de
     * handles, que el panel mantiene al dia. */
    var lista = paraHandle(FICHA, false, FICHA_ID);
    if (!lista.length) return;

    anclar(destino).appendChild(caja(lista, datos.esquinaFicha, 'ficha'));
  }

  /* Se exige la clase del tema ademas del atributo. Solo con el atributo se
   * cuelan contenedores que tambien lo llevan (la seccion de la ficha, por
   * ejemplo) y la insignia aterriza en cualquier sitio. */
  var TARJETAS = '.grid-product[data-product-handle], .grid__item[data-product-handle]';

  /* Un beneficio por foto, DESDE LA SEGUNDA: la primera se deja limpia, que es
   * la que manda y la que ya lleva la insignia.
   *
   * Quien decide es la app, no la foto: no hay nada guardado por imagen, solo
   * el orden de los beneficios. Asi, el dia que se cambien o se reordenen las
   * fotos, los beneficios siguen saliendo sobre las que haya.
   *
   * Va por javascript porque la galeria no admite bloques de app, igual que la
   * tarjeta de la coleccion. */
  function decorarFotos() {
    var lista = datos.beneficios;
    if (!lista || !lista.length) return;

    var slides = document.querySelectorAll('.product-main-slide[data-index] .product-image-main');
    if (!slides.length) slides = document.querySelectorAll('.product-image-main');

    var tope = Math.min(lista.length, datos.maxFotos || 3);
    for (var i = 0; i < tope; i += 1) {
      var destino = slides[i + 1];
      if (!destino) break;
      if (destino.dataset[MARCA_FOTO]) continue;
      destino.dataset[MARCA_FOTO] = '1';

      var pildora = document.createElement('span');
      pildora.className = 'sv-benef-foto sv-benef-foto--' + (datos.esquinaFoto || 'arriba-derecha');
      /* El svg lo genero el snippet de la extension, no el comerciante: por eso
       * va por innerHTML. El texto, que si es suyo, va por textContent. */
      pildora.innerHTML = lista[i].icono || '';
      var texto = document.createElement('span');
      texto.textContent = lista[i].texto;
      pildora.appendChild(texto);

      anclar(destino).appendChild(pildora);
    }
  }

  function decorar(raiz) {
    altoDelTema = null;
    if (datos.tarjetas) {
      var tarjetas = raiz.querySelectorAll(TARJETAS);
      for (var i = 0; i < tarjetas.length; i += 1) decorarTarjeta(tarjetas[i]);
    }
    if (datos.fichas) decorarFicha();
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

    /* Los nodos que anade este script se ignoran: si no, cada insignia pintada
     * provoca otra pasada entera. */
    new MutationObserver(function (cambios) {
      for (var i = 0; i < cambios.length; i += 1) {
        var nuevos = cambios[i].addedNodes;
        for (var j = 0; j < nuevos.length; j += 1) {
          var n = nuevos[j];
          if (n.nodeType !== 1 || n.classList.contains('sv-tags')) continue;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
}());
