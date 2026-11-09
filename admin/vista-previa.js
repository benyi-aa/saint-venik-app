/* Saint Venik · Vista previa.
 *
 * Dibuja el mismo marcado que el bloque de la tienda, con el MISMO archivo CSS
 * (se carga desde extensions/… por su ruta del repositorio, no una copia). La
 * vista previa puede diferir de la tienda real en la tipografia y los colores,
 * que los pone el tema; en estructura, orden y visibilidad por idioma, no.
 */

import { svgIcono } from './iconos.js?v=202611091949';

const ID_YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;

function escapar(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function incrustarVideo(url) {
  const m = ID_YOUTUBE.exec(url ?? '');
  if (m) {
    return `<div class="sv-guia__media">
      <iframe src="https://www.youtube-nocookie.com/embed/${escapar(m[1])}"
        title="Vídeo" loading="lazy" allowfullscreen></iframe>
    </div>`;
  }
  if (!url) return '<p class="sv-guia__vacio">Este bloque de vídeo todavía no tiene URL.</p>';
  return `<p class="sv-guia__bloque--video"><a class="sv-guia__enlace" href="${escapar(url)}" target="_blank" rel="noopener">Ver el vídeo</a></p>`;
}

function bloqueHtml(b, idioma) {
  const texto = idioma === 'en' ? b.textoEn : b.textoEs;

  switch (b.tipo) {
    case 'html':
      /* Único sitio donde el contenido NO se escapa, y es deliberado: el bloque
       * existe precisamente para publicar marcado. Lo escribe la persona dueña
       * de la tienda desde su propio admin, igual que un bloque de HTML del
       * editor de temas. */
      return texto
        ? `<div class="sv-guia__bloque sv-guia__bloque--html">${texto}</div>`
        : `<div class="sv-guia__bloque"><p class="sv-guia__vacio">Este bloque no tiene HTML en ${
            idioma === 'en' ? 'inglés' : 'español'
          }.</p></div>`;
    case 'video':
      return `<div class="sv-guia__bloque sv-guia__bloque--video">${incrustarVideo(b.videoUrl)}</div>`;
    case 'imagen':
      return `<div class="sv-guia__bloque">${
        b.imagenUrl
          ? `<img class="sv-guia__imagen" src="${escapar(b.imagenUrl)}" alt="${escapar(texto)}" loading="lazy" />`
          : '<p class="sv-guia__vacio">Este bloque de imagen todavía no tiene archivo.</p>'
      }</div>`;
    case 'pdf':
      /* El texto del bloque es la etiqueta del enlace, como en la guía actual
       * («Documento Guía de Tallas - Anillos»). Sin texto, un rótulo por defecto. */
      return `<div class="sv-guia__bloque sv-guia__bloque--pdf">${
        b.pdfUrl
          ? `<a class="sv-guia__enlace" href="${escapar(b.pdfUrl)}" target="_blank" rel="noopener">${
              escapar(texto || (idioma === 'en' ? 'Download the guide' : 'Descargar la guía'))
            }</a>`
          : '<p class="sv-guia__vacio">Este bloque de PDF todavía no tiene archivo.</p>'
      }</div>`;
    default:
      /* Si la casilla dice que se muestra, se muestra: devolver cadena vacía
       * haría que el recuento de bloques visibles no cuadrara con lo dibujado. */
      return texto
        ? `<div class="sv-guia__bloque"><p class="sv-guia__texto">${escapar(texto)}</p></div>`
        : `<div class="sv-guia__bloque"><p class="sv-guia__vacio">Este bloque no tiene texto en ${
            idioma === 'en' ? 'inglés' : 'español'
          }.</p></div>`;
  }
}

/* Lo que decide si un bloque sale NO es que tenga texto, es su casilla. Un
 * bloque de video sin texto se muestra igual; uno con texto y la casilla
 * desmarcada, no. */
export function visible(bloque, idioma) {
  return idioma === 'en' ? bloque.mostrarEn : bloque.mostrarEs;
}

export function guiaHtml(guia, idioma) {
  const bloques = guia.bloques.filter((b) => visible(b, idioma));

  if (!bloques.length) {
    return `<div class="sv-guia">
      <p class="sv-guia__vacio">${
        guia.bloques.length
          ? `Ningún bloque está marcado para mostrarse en ${idioma === 'en' ? 'inglés' : 'español'}. En este idioma la guía no aparecería.`
          : 'Esta guía todavía no tiene bloques.'
      }</p>
    </div>`;
  }

  const titulo = (idioma === 'en' && guia.nombreEn) ? guia.nombreEn : guia.nombre;

  return `<div class="sv-guia">
    <h2 class="sv-guia__titulo">${escapar(titulo)}</h2>
    ${bloques.map((b) => bloqueHtml(b, idioma)).join('')}
  </div>`;
}

/* `colores` tiene que llegar YA ordenado como lo pinta la tienda. La vista
 * previa no reordena por su cuenta: si lo hiciera podría enseñar un orden que la
 * ficha no tiene. */
export function coloresHtml(colores, apariencia = {}) {
  const alineacion = apariencia.alineacion ?? 'izquierda';
  const escala = apariencia.escala ?? 'normal';
  const tamano = apariencia.tamano ?? 34;
  const pintables = colores.filter((c) => c.etiqueta);

  if (!pintables.length) {
    return '<p class="sv-guia__vacio">Ningún color tiene etiqueta, así que el selector no aparecería en ninguna ficha.</p>';
  }

  return `<div class="sv-colors sv-colors--circulo sv-colors--al-${alineacion} sv-colors--${escala}"
      style="--sv-size:${tamano}px;--sv-gap:8px;--sv-ring:#111111;--sv-pt:0px;--sv-pb:0px;">
    <div class="sv-colors__heading">
      <span class="sv-colors__label">Color</span>
      <span class="sv-colors__sep" aria-hidden="true">-</span>
      <span class="sv-colors__current">${escapar(pintables[0].nombre)}</span>
    </div>
    <div class="sv-colors__list">
      ${pintables.map((c, i) => `
        <span class="sv-colors__item${i === 0 ? ' is-current' : ''}">
          <span class="sv-colors__swatch" style="${
            c.imagen ? `background-image:url('${escapar(c.imagen)}')` : (c.muestra ? `background-color:${escapar(c.muestra)}` : '')
          }"></span>
        </span>`).join('')}
    </div>
  </div>`;
}

/* El tipo de campo `color` de Shopify no admite alfa, así que la opacidad es un
 * número aparte y el rgba se compone al pintar: aquí igual que en el Liquid de
 * la tienda, para que la muestra y la ficha digan lo mismo. */
export function conAlfa(color, opacidad) {
  const o = Number.isFinite(opacidad) ? opacidad / 100 : 1;
  if (o >= 1) return color;
  const m = /^#?([0-9a-f]{6})$/i.exec(String(color).trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${o})`;
}

export function estiloEtiqueta(e) {
  const partes = [
    `background-color:${conAlfa(e.fondo, e.opacidad)}`,
    `color:${e.texto}`,
  ];
  if (e.grosor) partes.push(`border:${e.grosor}px solid ${e.borde}`);
  return partes.join(';');
}

/* La insignia de la tienda, con el mismo `.sv-tag` del storefront. Aquí no
 * lleva el contenedor `.sv-tags`, que es el que la posiciona sobre la foto:
 * en el panel se enseña suelta, en línea. */
export function etiquetaHtml(etiqueta) {
  return `<span class="sv-tag" style="${escapar(estiloEtiqueta(etiqueta))}">${
    escapar(etiqueta.nombre || 'Sin texto')
  }</span>`;
}

/* El icono de un beneficio, con la misma precedencia que el snippet de la
 * tienda: manda la imagen subida y, si no hay, el dibujado. Si el panel usara
 * solo svgIcono, una imagen subida no se vería aquí y la previa diría una cosa
 * y la ficha otra. */
export function iconoHtml(b, clase = 'sv-benef__icono') {
  if (b.iconoImagenUrl) {
    return `<img class="${escapar(clase)} sv-benef__icono--img" src="${escapar(b.iconoImagenUrl)}" alt="" width="24" height="24" />`;
  }
  return svgIcono(b.icono, clase);
}

/* La fila de beneficios tal como sale bajo el botón de compra. */
export function beneficiosHtml(beneficios) {
  if (!beneficios.length) {
    return '<p class="sv-guia__vacio">Ningún beneficio activo: el bloque no aparecería en ninguna ficha.</p>';
  }
  return `<div class="sv-benef sv-benef--pildora sv-benef--fila sv-benef--normal"
      style="--sv-pt:0px;--sv-pb:0px;">
    <ul class="sv-benef__lista" role="list">
      ${beneficios.map((b) => `
        <li class="sv-benef__item">
          ${iconoHtml(b)}
          <span class="sv-benef__texto">${escapar(b.nombre || 'Sin texto')}</span>
        </li>`).join('')}
    </ul>
  </div>`;
}
