/* Saint Venik · Selector de talla
 *
 * Los botones ya son enlaces a ?variant=..., asi que sin este archivo el bloque
 * sigue funcionando: elegir talla recarga la pagina. Lo que hace este script es
 * evitar esa recarga cuando puede hacerlo sin mentir.
 *
 * Se deja navegar, a proposito, en tres casos:
 *   - el ajuste "Recargar la pagina al elegir talla" esta activado
 *   - no encontramos el campo de variante, asi que no hay nada que cambiar
 *   - la talla elegida cuesta distinto que la actual, porque el precio que
 *     pinta el tema podria quedarse desactualizado
 */
(function () {
  'use strict';

  /* En la ficha hay varios formularios /cart/add: el del producto y uno por
   * cada producto complementario o recomendado. Elegimos por contenido, no por
   * posicion: el campo de variante correcto es el que conoce nuestras variantes. */
  function campoDeVariante(raiz) {
    var mias = [].map.call(raiz.querySelectorAll('[data-sv-variant]'), function (item) {
      return item.dataset.svVariant;
    });
    if (!mias.length) return null;

    var campos = document.querySelectorAll(
      'form[action*="/cart/add"] select[name="id"], form[action*="/cart/add"] input[name="id"]'
    );

    for (var i = 0; i < campos.length; i++) {
      var campo = campos[i];

      if (campo.tagName === 'SELECT') {
        for (var j = 0; j < campo.options.length; j++) {
          if (mias.indexOf(campo.options[j].value) !== -1) return campo;
        }
      } else if (mias.indexOf(campo.value) !== -1) {
        return campo;
      }
    }
    return null;
  }

  function seleccionar(raiz, elegido) {
    [].forEach.call(raiz.querySelectorAll('.sv-sizes__item'), function (item) {
      var activo = item === elegido;
      item.classList.toggle('is-selected', activo);
      if (activo) {
        item.setAttribute('aria-current', 'true');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    var actual = raiz.querySelector('[data-sv-current]');
    if (actual) actual.textContent = elegido.dataset.svValor;
  }

  function conectar(raiz) {
    if (raiz.dataset.svConectado === 'true') return;
    raiz.dataset.svConectado = 'true';

    raiz.addEventListener('click', function (evento) {
      var elegido = evento.target.closest('.sv-sizes__item');
      if (!elegido || !raiz.contains(elegido)) return;

      if (raiz.dataset.svRecargar === 'true') return;

      var campo = campoDeVariante(raiz);
      if (!campo) return;

      var actual = raiz.querySelector('.sv-sizes__item.is-selected');
      if (actual && actual.dataset.svPrecio !== elegido.dataset.svPrecio) return;

      evento.preventDefault();

      campo.value = elegido.dataset.svVariant;
      /* El tema escucha este evento para refrescar precio, stock y boton. */
      campo.dispatchEvent(new Event('change', { bubbles: true }));

      seleccionar(raiz, elegido);

      try {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', elegido.dataset.svVariant);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        /* Si el navegador no deja tocar el historial, el resto ya funciono. */
      }
    });
  }

  function iniciar() {
    [].forEach.call(document.querySelectorAll('[data-sv-sizes]'), conectar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* El editor de temas vuelve a pintar la seccion al cambiar un ajuste. */
  document.addEventListener('shopify:section:load', iniciar);
  document.addEventListener('shopify:block:select', iniciar);
})();
