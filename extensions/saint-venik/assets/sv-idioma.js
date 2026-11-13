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
