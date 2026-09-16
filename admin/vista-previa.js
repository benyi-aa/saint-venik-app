/* Saint Venik · Vista previa.
 *
 * Dibuja el mismo marcado que el bloque de la tienda, con el MISMO archivo CSS
 * (se carga desde extensions/… por su ruta del repositorio, no una copia). La
 * vista previa puede diferir de la tienda real en la tipografia y los colores,
 * que los pone el tema; en estructura, orden y visibilidad por idioma, no.
 */

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
export function coloresHtml(colores) {
  const pintables = colores.filter((c) => c.etiqueta);

  if (!pintables.length) {
    return '<p class="sv-guia__vacio">Ningún color tiene etiqueta, así que el selector no aparecería en ninguna ficha.</p>';
  }

  return `<div class="sv-colors sv-colors--circulo sv-colors--al-izquierda"
      style="--sv-size:36px;--sv-gap:12px;--sv-ring:#111111;--sv-pt:0px;--sv-pb:0px;">
    <div class="sv-colors__heading">
      <span class="sv-colors__label">Color</span>
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
