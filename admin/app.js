/* Saint Venik · Panel de la app. Sin framework ni paso de compilacion: son
 * archivos estaticos que el admin de Shopify carga embebidos. */
import { estaEmbebida } from './api.js?v=202611101650';
import {
  cargarColores, guardarColor, crearColor, borrarColor, problemasDe, ordenarComoLaTienda,
  guardarImagenColor, camposDeColor,
} from './colores.js?v=202611101650';
import {
  leerConfig, guardarOrdenColores, guardarTextosBoton, guardarApariencia,
  guardarPildora, camposDeConfig, PILDORA_POR_DEFECTO,
  guardarDescuento, guardarMenu, guardarInicio, DESCUENTO_POR_DEFECTO, FORMATOS_DESCUENTO, textoDescuento, contarConDescuento,
  guardarTransicion, TRANSICION_POR_DEFECTO, guardarFiltrosConfig, FILTROS_POR_DEFECTO, asegurarConfig,
} from './config.js?v=202611101650';
import {
  FILTROS as FILTROS_PRODUCTO, cargarBotones, crearBoton, guardarBoton, borrarBoton,
  cargarProductosFiltro, guardarClasificacion, sugerir,
} from './filtros.js?v=202611101650';
import {
  buscarProductos, todosLosProductos, vincular, desvincular, sinHermano, sinColor, ponerEtiquetaColor,
} from './productos.js?v=202611101650';
import { prepararNavidad } from './inicio.js?v=202611101650';
import { quitarAguaDeColecciones } from './textos.js?v=202611101650';
import { gruposDe, cargarFotos, cambiarFoto } from './fotos.js?v=202611101650';
import {
  leerTemporadas, guardarTemporadas, guardarTemporadaActiva, listaDe, claveDe, validarClave, PARTES as PARTES_TEMPORADA,
  efectivo, textosDeHoy, conIngles, aLocal, aUtc, colorValido, vistaPrevia,
} from './temporadas.js?v=202611101650';
import { subirArchivo, elegirDeBiblioteca, hayBiblioteca, copiarArchivo, reemplazarArchivo, traerArchivo } from './archivos.js?v=202611101650';
import {
  estadoEstructura, revisarEstructura, crearEstructura, cargarGuias, GUIAS_INICIALES,
  crearBloque, guardarBloque, borrarBloque, moverBloque, guardarGuia, guardarArchivoDeBloque, NOMBRE_TIPO,
  revisarReparto, crearGuia, TOPE_GUIAS, importarGuias,
} from './guias.js?v=202611101650';
import {
  guiaHtml, coloresHtml, visible, etiquetaHtml, beneficiosHtml, estiloEtiqueta, conAlfa, iconoHtml,
} from './vista-previa.js?v=202611101650';
import { cargarColecciones, cargarEtiquetasDeTienda, esResta, sinSigno, TOPE_REFERENCIAS } from './asignacion.js?v=202611101650';
import {
  cargarEtiquetas, crearEtiqueta, guardarEtiqueta, borrarEtiqueta,
  sincronizar as sincronizarEtiqueta, cuantosAlcanza as alcanceEtiqueta, camposDeEtiqueta,
  FONDO_POR_DEFECTO, TEXTO_POR_DEFECTO,
} from './etiquetas.js?v=202611101650';
import {
  cargarBeneficios, crearBeneficio, guardarBeneficio, borrarBeneficio,
  sincronizar as sincronizarBeneficio, cuantosAlcanza as alcanceBeneficio,
  guardarIconoImagen, camposDeBeneficio,
} from './beneficios.js?v=202611101650';
import { ICONOS, svgIcono } from './iconos.js?v=202611101650';

/* La sella scripts/version.mjs al publicar. No se deduce de la URL porque ahora
 * la URL lleva un sello por minuto para saltarse la cache, no la version. */
const VERSION = '202611101650';

const pantalla = document.getElementById('pantalla');
const aviso = document.getElementById('aviso');
let temporizadorAviso = null;

/* Los avisos de éxito se van solos; los errores NO. Un error que desaparece a
 * los cuatro segundos deja a la persona sin saber qué pasó ni qué copiar. */
function avisar(texto, esError = false) {
  aviso.textContent = texto;
  aviso.classList.toggle('is-error', esError);
  aviso.hidden = false;
  clearTimeout(temporizadorAviso);

  if (esError) {
    aviso.setAttribute('role', 'alert');
    aviso.title = 'Pulsa para cerrar';
    aviso.onclick = () => { aviso.hidden = true; };
    return;
  }

  aviso.removeAttribute('role');
  aviso.onclick = null;
  temporizadorAviso = setTimeout(() => { aviso.hidden = true; }, 4000);
}

function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function fondoDe(color) {
  if (color.imagen) return `background-image: url('${color.imagen}')`;
  if (color.muestra) return `background-color: ${color.muestra}`;
  return '';
}

function tarjetaColor(color, i, total, hayNombreEn) {
  const problemas = problemasDe(color);
  return `
    <s-section data-id="${escapar(color.id)}" heading="${escapar(color.nombre || 'Sin nombre')}">
      <div class="cabecera-fila">
        <div class="color__muestra" style="${fondoDe(color)}"></div>
        <s-stack direction="inline" gap="small-300">
          <s-button variant="tertiary" accessibilityLabel="${i < 0 ? 'Sin etiqueta no se puede ordenar' : 'Subir'}"
            data-mover="arriba" ${i <= 0 ? 'disabled' : ''}>↑</s-button>
          <s-button variant="tertiary" accessibilityLabel="${i < 0 ? 'Sin etiqueta no se puede ordenar' : 'Bajar'}"
            data-mover="abajo" ${i < 0 || i === total - 1 ? 'disabled' : ''}>↓</s-button>
        </s-stack>
      </div>

      <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
        <s-text-field label="Nombre en español" data-campo="nombre" value="${escapar(color.nombre)}"
          details="Lo que ve el cliente en la tienda en español."></s-text-field>
        ${hayNombreEn
    ? `<s-text-field label="Nombre en inglés" data-campo="nombre_en" value="${escapar(color.nombreEn)}"
            placeholder="Vacío: traducción automática"
            details="Lo que se ve en /en/. Vacío, se usa la traducción de Translate &amp; Adapt."></s-text-field>`
    : `<div>
            <p class="asigna__titulo">Nombre en inglés</p>
            <p class="ayuda">Todavía no existe en tu tienda: pulsa «Crear lo que falta» arriba.</p>
          </div>`}
        <s-text-field label="Etiqueta del producto" data-campo="etiqueta" value="${escapar(color.etiqueta)}"
          details="Los productos con esta etiqueta se muestran en este color."></s-text-field>
        <s-color-field label="Color de la muestra" data-campo="muestra" value="${escapar(color.muestra || '#cccccc')}"
          details="${color.imagen ? 'Hay una imagen, y la imagen manda sobre el color.' : 'Se usa si no hay imagen.'}"></s-color-field>
        <div class="icono-propio">
          <p class="asigna__titulo">Imagen de la muestra</p>
          <div class="acciones acciones--envolver">
            <label class="secundario como-boton">
              Subir…<input type="file" accept="image/*" data-subir hidden />
            </label>
            ${hayBiblioteca() ? '<button type="button" class="secundario" data-biblioteca>Elegir de la biblioteca</button>' : ''}
            ${color.imagen ? '<button type="button" class="secundario secundario--peligro" data-quitar-imagen>Quitar</button>' : ''}
          </div>
          <p class="ayuda" data-estado-imagen>${color.imagen ? 'Manda sobre el color.' : 'Opcional.'}</p>
        </div>
      </s-grid>

      ${problemas.length ? `<s-banner tone="warning">${problemas.map((p) => `<p>${escapar(p)}</p>`).join('')}</s-banner>` : ''}

      <s-button slot="primary-action" variant="primary" data-guardar>Guardar</s-button>
      <s-button slot="secondary-actions" tone="critical" data-borrar>Eliminar</s-button>
    </s-section>
  `;
}

async function pintarColores() {
  pantalla.innerHTML = '<p class="cargando">Cargando colores…</p>';

  const [crudos, config, revision, campos] = await Promise.all([
    cargarColores(), leerConfig(), revisarEstructura(), camposDeColor(),
  ]);
  const colores = ordenarComoLaTienda(crudos, config.ordenColores);
  const hayNombreEn = campos.has('nombre_en');

  /* Colores es la pantalla que se abre por defecto, y reordenar escribe en la
   * configuración. Si esa estructura no existe, aquí tiene que poder crearse:
   * mandar a la persona a otra pestaña a buscar el botón es perderla. */
  const ordenables = colores.filter((c) => c.etiqueta);

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(revision.pendientes)}

      <div class="titular">
        <h1>Colores</h1>
        <p class="subtitulo">Cada color es una muestra en la ficha de producto. Un producto se asocia a su color por la etiqueta, y el orden de aquí es el orden en que salen. Si un producto lleva dos etiquetas de color (la Vienna verde lleva <b>oro</b> y <b>verde</b>), cuenta como el que esté más arriba: por eso los colores de piedra van antes que los metales.</p>
      </div>

      <s-section heading="Así se ve en la ficha de producto" subheading="La tipografía y los colores del texto los pone tu tema; aquí se ven los del panel.">
        ${coloresHtml(colores)}
      </s-section>

      ${colores.map((c) => tarjetaColor(c, ordenables.indexOf(c), ordenables.length, hayNombreEn)).join('')}

      <s-section heading="Añadir un color">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-text-field label="Nombre en español" id="nuevo-nombre" placeholder="p. ej. ROSADO"></s-text-field>
          ${hayNombreEn ? '<s-text-field label="Nombre en inglés" id="nuevo-nombre-en" placeholder="p. ej. ROSE"></s-text-field>' : ''}
          <s-text-field label="Etiqueta" id="nueva-etiqueta" placeholder="p. ej. oro-rosa"></s-text-field>
          <s-color-field label="Color de la muestra" id="nueva-muestra" value="#cccccc"></s-color-field>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="anadir-color">Añadir color</s-button>
      </s-section>
    </s-page>

  `;

  /* Reordenar escribe la lista de etiquetas en la configuración, que es lo que
   * lee el bloque de la tienda. Un color sin etiqueta no puede ordenarse porque
   * tampoco puede mostrarse. */
  async function reordenar(id, direccion) {
    const orden = ordenables.map((c) => c.etiqueta);
    const actual = ordenables.find((c) => c.id === id);
    const i = orden.indexOf(actual?.etiqueta);
    const j = direccion === 'arriba' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= orden.length) {
      avisar('Ese color no se puede mover: sin etiqueta no tiene sitio en la ficha.', true);
      return;
    }
    [orden[i], orden[j]] = [orden[j], orden[i]];
    await guardarOrdenColores(orden);
  }

  pantalla.querySelectorAll('s-section[data-id]').forEach((tarjeta) => {
    const id = tarjeta.dataset.id;
    const valor = (campo) => String(tarjeta.querySelector(`[data-campo="${campo}"]`)?.value ?? '').trim();

    tarjeta.querySelector('[data-guardar]')?.addEventListener('click', async (e) => {
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        const original = colores.find((c) => c.id === id);
        await guardarColor(id, {
          nombre: valor('nombre'),
          /* Sin el campo en la tienda no se manda: guardarColor lo trata como
           * "no existe" y no lo escribe, en vez de fallar el guardado entero. */
          nombreEn: hayNombreEn ? valor('nombre_en') : undefined,
          etiqueta: valor('etiqueta'),
          /* En minúsculas siempre. El campo de color del admin devuelve lo que
           * se escribió, con sus mayúsculas, y guardarColor solo escribe el
           * color «si cambió»: un #C9A227 frente a un #c9a227 guardado parecía
           * un cambio en cada guardado y tiraba por tierra esa comprobación,
           * que es la que impide escribir un gris que nadie eligió. */
          muestra: colorPlano(valor('muestra'), original?.muestra || '#cccccc'),
          muestraOriginal: original?.muestra ? original.muestra : '#cccccc',
        });
        avisar('Color guardado');
        await pintarColores();
      } catch (error) {
        avisar(error.message, true);
        boton.loading = false;
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        boton.loading = true;
        try {
          await reordenar(id, boton.dataset.mover);
          await pintarColores();
        } catch (error) {
          avisar(error.message, true);
          boton.loading = false;
        }
      });
    });

    const estado = tarjeta.querySelector('[data-estado-imagen]');
    const decir = (t) => { if (estado) estado.textContent = t; };

    async function aplicarImagen(promesa) {
      try {
        const archivo = await promesa;
        if (!archivo) { decir('Cancelado.'); return; }
        await guardarImagenColor(id, archivo.id);
        avisar('Imagen guardada');
        await pintarColores();
      } catch (error) {
        decir('');
        avisar(error.message, true);
      }
    }

    tarjeta.querySelector('[data-subir]')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      /* Se limpia enseguida: si no, reintentar con el MISMO archivo no dispara
       * el evento y el botón parece muerto, justo después de un error. */
      e.target.value = '';
      if (!file) return;
      aplicarImagen(subirArchivo(file, { onPaso: decir }));
    });

    tarjeta.querySelector('[data-biblioteca]')?.addEventListener('click', () => {
      decir('Abriendo la biblioteca…');
      aplicarImagen(elegirDeBiblioteca({ tipo: 'MediaImage' }));
    });

    tarjeta.querySelector('[data-quitar-imagen]')?.addEventListener('click', async () => {
      try {
        await guardarImagenColor(id, '');
        avisar('Imagen quitada');
        await pintarColores();
      } catch (error) {
        avisar(error.message, true);
      }
    });

    tarjeta.querySelector('[data-borrar]')?.addEventListener('click', async () => {
      const nombre = valor('nombre') || 'este color';
      if (!window.confirm(`¿Eliminar ${nombre}? Los productos con su etiqueta dejarán de mostrar esa muestra.`)) return;
      try {
        await borrarColor(id);
        avisar('Color eliminado');
        await pintarColores();
      } catch (error) {
        avisar(error.message, true);
      }
    });
  });

  document.getElementById('anadir-color').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const texto = (id) => String(document.getElementById(id)?.value ?? '').trim();
    const nombre = texto('nuevo-nombre');
    if (!nombre) { avisar('Ponle un nombre al color', true); return; }
    boton.loading = true;
    try {
      await crearColor({
        nombre,
        nombreEn: texto('nuevo-nombre-en'),
        etiqueta: texto('nueva-etiqueta'),
        muestra: colorPlano(document.getElementById('nueva-muestra').value, '#cccccc'),
      });
      avisar('Color añadido');
      await pintarColores();
    } catch (error) {
      avisar(error.message, true);
      boton.loading = false;
    }
  });

  /* La tarjeta de pendientes se pintaba en esta pantalla sin que nadie
   * escuchara su boton: pulsarlo no hacia nada. Las demas pantallas si lo
   * conectaban. */
  conectarPendientes(pintarColores);
}

/* Se ofrece donde el usuario se topa con el problema, no solo en la pantalla
 * de inicio: si falta un campo, el error aparece al guardar, y mandar a la
 * persona a buscar otro botón en otra pantalla es una forma de perderla.
 *
 * Va como aviso del admin y arriba del todo, en el hueco que `s-page` reserva
 * justo para esto. */
function bannerPendientes(pendientes) {
  if (!pendientes.length) return '';
  return `
    <s-banner slot="supplemental-start" tone="warning" heading="Falta parte de la estructura en tu tienda">
      <p>Se va a crear:</p>
      <ul>${pendientes.map((t) => `<li>${escapar(t)}</li>`).join('')}</ul>
      <p class="ayuda">Se puede pulsar las veces que haga falta: no duplica lo que ya existe.</p>
      <s-button slot="secondary-actions" id="crear">Crear lo que falta</s-button>
    </s-banner>`;
}

function conectarPendientes(alTerminar) {
  const boton = document.getElementById('crear');
  if (!boton) return;
  boton.addEventListener('click', async () => {
    boton.disabled = true;
    boton.textContent = 'Creando…';
    try {
      const pasos = await crearEstructura();
      avisar(pasos.length ? pasos.join(' · ') : 'Ya estaba todo creado');
      await alTerminar();
    } catch (error) {
      avisar(error.message, true);
      boton.disabled = false;
      boton.textContent = 'Crear lo que falta';
    }
  });
}

async function pintarGuias() {
  pantalla.innerHTML = '<p class="cargando">Comprobando la estructura…</p>';

  const { estado, pendientes } = await revisarEstructura();
  const hayDefiniciones = Boolean(estado.bloque && estado.guia);
  const guias = hayDefiniciones ? await cargarGuias() : [];
  const faltan = GUIAS_INICIALES.filter((g) => !guias.some((x) => x.handle === g.handle));

  /* La estructura son dos cosas: las definiciones y las guías. Mirar solo las
   * definiciones dejaba la pantalla vacía y sin salida cuando existían las
   * primeras pero no las segundas. */
  const porHacer = [...pendientes, ...faltan.map((g) => `La guía «${g.nombre}».`)];

  const listado = guias.length
    ? guias.map((g) => `
        <s-section data-guia="${escapar(g.handle)}">
          <div class="guia-fila" role="button" tabindex="0" data-abrir>
            <div>
              <p class="guia-fila__nombre">${escapar(g.nombre)}</p>
              <p class="ayuda">${g.bloques.length} ${g.bloques.length === 1 ? 'bloque' : 'bloques'}</p>
            </div>
            <s-button variant="tertiary">Editar</s-button>
          </div>
        </s-section>`).join('')
    : '';

  /* Solo se ofrece crear cuando la estructura existe: sin la definicion de
   * guias, Shopify rechazaria la entrada nueva. */
  const puedeCrear = hayDefiniciones && guias.length < TOPE_GUIAS;
  const nueva = !hayDefiniciones ? '' : puedeCrear
    ? `
      <s-section heading="Nueva guía">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-text-field id="guia-nombre" label="Nombre en español" placeholder="p. ej. Aros"></s-text-field>
          <s-text-field id="guia-nombre-en" label="Nombre en inglés" placeholder="p. ej. Earrings"></s-text-field>
          <s-text-field id="guia-palabras" label="Palabras clave" placeholder="p. ej. aro, earring"></s-text-field>
        </s-grid>
        <p class="ayuda">
          Las palabras clave deciden qué productos la usan: basta con que una aparezca en el
          título, el tipo o las etiquetas. Pon también la palabra en inglés, que en /en/ el
          título va traducido. Nace sin bloques, así que no se ve en la tienda hasta que le
          añadas contenido.
        </p>
        <s-button slot="primary-action" variant="primary" id="crear-guia">Crear guía</s-button>
      </s-section>`
    : `<s-section><p class="ayuda">Hay ${TOPE_GUIAS} guías, que es lo máximo que lee el panel.</p></s-section>`;

  /* En una tienda recien instalada las guias nacen vacias. Si hay una semilla
   * con el contenido de otra tienda, se ofrece copiarla. Solo cuando TODAS estan
   * vacias: asi no puede duplicar nada ni aparecer en la tienda de origen. */
  const semilla = hayDefiniciones && guias.length && guias.every((g) => !g.bloques.length)
    ? await cargarSemilla()
    : null;
  const totalSemilla = semilla ? semilla.guias.reduce((n, g) => n + g.bloques.length, 0) : 0;
  const copiar = semilla ? `
      <s-section id="tarjeta-copiar" heading="Tus guías están vacías">
        <s-paragraph>Se puede copiar el contenido de ${escapar(semilla.origen)}:
          ${totalSemilla} bloques en ${semilla.guias.length} guías, con su orden y sus idiomas.</s-paragraph>
        <p class="ayuda">Las imágenes se copian a esta tienda. Los enlaces a los PDF y los vídeos quedan como
          están. Después puedes cambiar cualquier bloque en el editor.</p>
        <p class="ayuda" id="copiar-estado"></p>
        <s-button slot="primary-action" variant="primary" id="copiar-guias">Copiar las guías de ${escapar(semilla.origen)}</s-button>
      </s-section>` : '';

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(porHacer)}
      <div class="titular">
        <h1>Guías de tallas</h1>
        <p class="subtitulo">Cada guía se compone de bloques. Un bloque puede existir solo en un idioma.</p>
      </div>
      ${copiar}
      ${listado}
      ${nueva}
    </s-page>`;

  document.getElementById('copiar-guias')?.addEventListener('click', async (e) => {
    const estado = document.getElementById('copiar-estado');
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const informe = await importarGuias(semilla, { onPaso: (t) => { estado.textContent = t; } });
      avisar(informe.join(' · '));
      await pintarGuias();
    } catch (error) {
      avisar(error.message, true);
      estado.textContent = 'Se detuvo. Lo que alcanzó a copiarse está en cada guía; revisa antes de repetir.';
      boton.loading = false;
    }
  });

  pantalla.querySelectorAll('[data-guia]').forEach((seccion) => {
    const abrir = () => pintarEditor(seccion.dataset.guia);
    const fila = seccion.querySelector('[data-abrir]') || seccion;
    fila.addEventListener('click', abrir);
    fila.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
    });
  });

  document.getElementById('crear-guia')?.addEventListener('click', async (e) => {
    const nombre = String(document.getElementById('guia-nombre').value ?? '').trim();
    const palabras = String(document.getElementById('guia-palabras').value ?? '').trim();
    if (!nombre) { avisar('Ponle un nombre a la guía', true); return; }
    /* Sin palabras clave la guia existe pero ningun producto la encuentra. Se
     * permite, porque se pueden poner despues en el editor, pero se avisa. */
    if (!palabras && !window.confirm('Sin palabras clave ningún producto usará esta guía hasta que se las pongas. ¿Crearla igual?')) return;
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const creada = await crearGuia({
        nombre,
        nombreEn: String(document.getElementById('guia-nombre-en').value ?? '').trim(),
        palabras,
      });
      avisar(`Guía «${nombre}» creada`);
      /* Directo a su editor: una guia nueva solo sirve cuando tiene bloques. */
      await pintarEditor(creada.handle);
    } catch (error) {
      avisar(error.message, true);
      boton.loading = false;
    }
  });

  conectarPendientes(pintarGuias);
}

async function cargarSemilla() {
  try {
    const r = await fetch(`./semillas/guias-saintvenik-com.json?v=${VERSION}`);
    if (!r.ok) return null;
    const s = await r.json();
    return Array.isArray(s?.guias) && s.guias.length ? s : null;
  } catch {
    return null;
  }
}

/* Un bloque de imagen o de PDF necesita su archivo. Misma mecánica que en
 * Colores: subir desde aquí, o elegir de la biblioteca del admin. */
function controlesArchivo(b) {
  const esPdf = b.tipo === 'pdf';
  const url = esPdf ? b.pdfUrl : b.imagenUrl;
  const acepta = esPdf ? 'application/pdf' : 'image/*';

  return `
    <div class="bloque__archivo">
      ${url && !esPdf ? `<img class="bloque__vista" src="${escapar(url)}" alt="" />` : ''}
      ${url && esPdf ? `<a class="sv-guia__enlace" href="${escapar(url)}" target="_blank" rel="noopener">Ver el PDF actual</a>` : ''}
      <div class="acciones acciones--envolver">
        <label class="secundario como-boton">
          ${url ? 'Reemplazar…' : 'Subir…'}<input type="file" accept="${acepta}" data-subir-archivo hidden />
        </label>
        ${hayBiblioteca() ? '<button class="secundario" data-biblioteca-archivo>Elegir de la biblioteca</button>' : ''}
        ${url ? '<button class="secundario secundario--peligro" data-quitar-archivo>Quitar</button>' : ''}
      </div>
      <p class="ayuda" data-estado-archivo>${
        url ? '' : (esPdf ? 'Sin PDF, este bloque no se mostrará.' : 'Sin imagen, este bloque no se mostrará.')
      }</p>
      ${esPdf ? '<p class="ayuda">El texto de abajo es la etiqueta del enlace.</p>' : ''}
    </div>`;
}

function tarjetaBloque(b, i, total) {
  const esVideo = b.tipo === 'video';
  const esArchivo = b.tipo === 'imagen' || b.tipo === 'pdf';
  const esHtml = b.tipo === 'html';
  const etiquetaEs = esHtml ? 'HTML en español' : 'Texto en español';
  const etiquetaEn = esHtml ? 'HTML en inglés' : 'Texto en inglés';

  /* El HTML se edita en un área propia y no en la del admin: necesita letra de
   * ancho fijo y alto generoso, y eso vive en nuestro CSS, que no entra en el
   * componente. Para el texto normal sí se usa el del admin. */
  const area = (campo, etiqueta, valor2) => (esHtml
    ? `<div>
          <p class="asigna__titulo">${etiqueta}</p>
          <textarea data-campo="${campo}" rows="8" class="codigo" spellcheck="false">${escapar(valor2)}</textarea>
        </div>`
    : `<s-text-area label="${etiqueta}" data-campo="${campo}" rows="4" value="${escapar(valor2)}"></s-text-area>`);

  return `
    <s-section data-bloque="${escapar(b.id)}" heading="${escapar(NOMBRE_TIPO[b.tipo] ?? b.tipo)}">
      <div class="cabecera-fila">
        <span class="etiqueta-tipo">${escapar(NOMBRE_TIPO[b.tipo] ?? b.tipo)}</span>
        <s-stack direction="inline" gap="small-300">
          <s-button variant="tertiary" accessibilityLabel="Subir" data-mover="arriba" ${i === 0 ? 'disabled' : ''}>↑</s-button>
          <s-button variant="tertiary" accessibilityLabel="Bajar" data-mover="abajo" ${i === total - 1 ? 'disabled' : ''}>↓</s-button>
        </s-stack>
      </div>

      ${esArchivo ? controlesArchivo(b) : ''}

      ${esVideo ? `
        <s-text-field label="URL del vídeo" data-campo="videoUrl" value="${escapar(b.videoUrl)}" placeholder="https://..."></s-text-field>` : ''}

      ${esHtml ? '<p class="ayuda">Se publica tal cual en la ficha. Útil para tablas de medidas. Si no estás seguro, usa un bloque de Texto.</p>' : ''}

      <s-grid gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="base">
        <div>
          ${area('textoEs', etiquetaEs, b.textoEs)}
          <div class="casilla-polaris">
            <s-checkbox label="Mostrar en español" data-campo="mostrarEs" ${b.mostrarEs ? 'checked' : ''}></s-checkbox>
          </div>
        </div>
        <div>
          ${area('textoEn', etiquetaEn, b.textoEn)}
          <div class="casilla-polaris">
            <s-checkbox label="Mostrar en inglés" data-campo="mostrarEn" ${b.mostrarEn ? 'checked' : ''}></s-checkbox>
          </div>
        </div>
      </s-grid>

      <s-button slot="primary-action" variant="primary" data-guardar-bloque>Guardar bloque</s-button>
      <s-button slot="secondary-actions" tone="critical" data-borrar>Eliminar</s-button>
    </s-section>`;
}

async function pintarEditor(handle) {
  pantalla.innerHTML = '<p class="cargando">Cargando la guía…</p>';

  const [guias, revision] = await Promise.all([cargarGuias(), revisarEstructura()]);
  const guia = guias.find((g) => g.handle === handle);
  if (!guia) { await pintarGuias(); return; }

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(revision.pendientes)}

      <div class="titular">
        <button type="button" class="volver" id="volver">← Guías de tallas</button>
        <h1>${escapar(guia.nombre)}</h1>
        <p class="subtitulo">
          Los bloques se muestran en la tienda en este orden. Cada uno puede existir
          solo en un idioma: desmarca la casilla del idioma donde no quieras que aparezca.
        </p>
      </div>

      <s-section accessibilityLabel="Datos de la guía" subheading="El título es el encabezado de la ventana. Si dejas el inglés vacío, se usa el español.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          <s-text-field id="nombre-es" label="Título en español" value="${escapar(guia.nombre)}"></s-text-field>
          <s-text-field id="nombre-en" label="Título en inglés" value="${escapar(guia.nombreEn)}" placeholder="${escapar(guia.nombre)}"></s-text-field>
        </s-grid>
        <s-text-field id="palabras" label="Productos que usan esta guía" value="${escapar(guia.palabras)}"
          placeholder="anillo, ring"
          details="Palabras separadas por comas. Un producto usa esta guía si alguna aparece en su tipo, su título o sus etiquetas."></s-text-field>
        <s-button slot="primary-action" variant="primary" id="guardar-titulo">Guardar</s-button>
        <s-button slot="secondary-actions" id="comprobar">Comprobar qué productos coinciden</s-button>
      </s-section>

      <s-section heading="Añadir un bloque">
        <s-select id="nuevo-tipo" label="Tipo de bloque">
          ${Object.entries(NOMBRE_TIPO).map(([v, n]) => `<s-option value="${v}">${escapar(n)}</s-option>`).join('')}
        </s-select>
        <s-button slot="primary-action" variant="primary" id="anadir">Añadir</s-button>
      </s-section>

      ${guia.puedeFaltarBloque ? '<s-banner tone="warning">Esta guía tiene 50 bloques o más y el panel muestra como máximo 50: puede que falte alguno. Conviene dividirla.</s-banner>' : ''}

      <s-section id="informe" hidden></s-section>

      <s-section heading="Así lo ve el cliente">
        <div class="previa__cabecera">
          <div class="previa__idiomas">
            <button type="button" class="secundario is-activo" data-idioma="es">Español</button>
            <button type="button" class="secundario" data-idioma="en">Inglés</button>
          </div>
        </div>
        <div class="previa__lienzo" id="lienzo">${guiaHtml(guia, 'es')}</div>
        <p class="ayuda previa__nota" id="previa-resumen"></p>
      </s-section>

      ${guia.bloques.length
    ? guia.bloques.map((b, i) => tarjetaBloque(b, i, guia.bloques.length)).join('')
    : '<s-section><div class="vacio">Esta guía todavía no tiene bloques.</div></s-section>'}
    </s-page>`;


  const lienzo = document.getElementById('lienzo');
  const resumen = document.getElementById('previa-resumen');

  let idiomaActivo = 'es';

  function pintarPrevia(idioma) {
    idiomaActivo = idioma;
    lienzo.innerHTML = guiaHtml(guia, idioma);
    const salen = guia.bloques.filter((b) => visible(b, idioma)).length;
    const ocultos = guia.bloques.length - salen;
    resumen.textContent = ocultos
      ? `${salen} de ${guia.bloques.length} bloques se muestran en este idioma; ${ocultos} está${ocultos === 1 ? '' : 'n'} oculto${ocultos === 1 ? '' : 's'}.`
      : `Se muestran los ${salen} bloques.`;
  }
  pintarPrevia('es');

  pantalla.querySelectorAll('[data-idioma]').forEach((boton) => {
    boton.addEventListener('click', () => {
      pantalla.querySelectorAll('[data-idioma]').forEach((b) => b.classList.toggle('is-activo', b === boton));
      pintarPrevia(boton.dataset.idioma);
    });
  });

  document.getElementById('volver').addEventListener('click', pintarGuias);
  conectarPendientes(() => pintarEditor(handle));

  /* A demanda: recorrer el catálogo entero son varias llamadas, y no hace falta
   * salvo que se quiera comprobar el reparto. */
  document.getElementById('comprobar').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    const informe = document.getElementById('informe');
    try {
      const guias = await cargarGuias();
      const r = await revisarReparto(guias);

      const lista = (productos) => `
        <ul class="informe__lista">
          ${productos.slice(0, 40).map((p) => `<li>${escapar(p.title)}</li>`).join('')}
        </ul>
        ${productos.length > 40 ? `<p class="ayuda">…y ${productos.length - 40} más.</p>` : ''}`;

      informe.innerHTML = `
        <h2 style="margin:0 0 4px;font-size:16px;">Reparto del catálogo</h2>
        <p class="ayuda">${r.total} productos a la venta${r.borradores ? ` · ${r.borradores} en borrador, no se cuentan` : ''}</p>

        <ul class="informe__lista">
          ${guias.map((g) => `<li><strong>${escapar(g.nombre)}</strong>: ${r.conteo.get(g.handle) ?? 0}</li>`).join('')}
        </ul>

        ${r.sinGuia.length ? `
          <p class="problema" style="margin-top:14px;">
            ${r.sinGuia.length} productos no encajan en ninguna guía, así que no verán el botón.
            Si alguno debería tenerla, añade una palabra suya arriba.
          </p>
          ${lista(r.sinGuia)}` : '<p class="ayuda" style="margin-top:14px;">Todos los productos a la venta tienen guía.</p>'}

        ${r.ambiguos.length ? `
          <p class="problema">
            ${r.ambiguos.length} encajan en más de una guía y se quedan con la primera:
          </p>
          <ul class="informe__lista">
            ${r.ambiguos.slice(0, 20).map((a) => `<li>${escapar(a.producto.title)} — ${escapar(a.guias.join(', '))}</li>`).join('')}
          </ul>` : ''}`;
      informe.hidden = false;
      informe.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      avisar(error.message, true);
    } finally {
      boton.loading = false;
    }
  });

  document.getElementById('guardar-titulo').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const texto = (id) => String(document.getElementById(id).value ?? '').trim();
    boton.loading = true;
    try {
      await guardarGuia(guia.id, {
        nombre: texto('nombre-es'),
        nombreEn: texto('nombre-en'),
        palabras: texto('palabras'),
      });
      avisar('Guía guardada');
      await pintarEditor(handle);
    } catch (error) {
      avisar(error.message, true);
      boton.loading = false;
    }
  });

  document.getElementById('anadir').addEventListener('click', async (e) => {
    const tipo = document.getElementById('nuevo-tipo').value;
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      await crearBloque(guia, tipo);
      await pintarEditor(handle);
      avisar('Bloque añadido');
    } catch (error) {
      avisar(error.message, true);
      boton.loading = false;
    }
  });

  pantalla.querySelectorAll('[data-bloque]').forEach((tarjeta) => {
    const id = tarjeta.dataset.bloque;
    const leer = (campo) => {
      const el = tarjeta.querySelector(`[data-campo="${campo}"]`);
      if (!el) return undefined;
      /* Una casilla del admin no tiene `type`: se reconoce por la etiqueta. */
      return el.type === 'checkbox' || el.tagName === 'S-CHECKBOX' ? el.checked : el.value;
    };

    tarjeta.querySelector('[data-guardar-bloque]')?.addEventListener('click', async (e) => {
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        const original = guia.bloques.find((b) => b.id === id);
        const nuevos = {
          tipo: original.tipo,
          textoEs: leer('textoEs'),
          textoEn: leer('textoEn'),
          videoUrl: leer('videoUrl'),
          mostrarEs: leer('mostrarEs'),
          mostrarEn: leer('mostrarEn'),
        };
        await guardarBloque(id, nuevos);
        /* Sin esto la vista previa sigue mostrando lo anterior después de decir
         * "guardado", que es la peor combinación posible en una vista previa. */
        Object.assign(original, nuevos);
        pintarPrevia(idiomaActivo);
        avisar('Bloque guardado');
      } catch (error) {
        avisar(error.message, true);
      } finally {
        boton.loading = false;
      }
    });

    const bloque = guia.bloques.find((b) => b.id === id);
    const campoArchivo = bloque?.tipo === 'pdf' ? 'pdf' : 'imagen';
    const estadoArchivo = tarjeta.querySelector('[data-estado-archivo]');
    const decirArchivo = (t) => { if (estadoArchivo) estadoArchivo.textContent = t; };

    async function aplicarArchivo(promesa) {
      try {
        const archivo = await promesa;
        if (!archivo) { decirArchivo('Cancelado.'); return; }
        await guardarArchivoDeBloque(id, campoArchivo, archivo.id);
        avisar('Archivo guardado');
        await pintarEditor(handle);
      } catch (error) {
        decirArchivo('');
        avisar(error.message, true);
      }
    }

    tarjeta.querySelector('[data-subir-archivo]')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      aplicarArchivo(subirArchivo(file, { onPaso: decirArchivo }));
    });

    tarjeta.querySelector('[data-biblioteca-archivo]')?.addEventListener('click', () => {
      decirArchivo('Abriendo la biblioteca…');
      aplicarArchivo(elegirDeBiblioteca({ tipo: campoArchivo === 'pdf' ? 'GenericFile' : 'MediaImage' }));
    });

    tarjeta.querySelector('[data-quitar-archivo]')?.addEventListener('click', async () => {
      try {
        await guardarArchivoDeBloque(id, campoArchivo, '');
        avisar('Archivo quitado');
        await pintarEditor(handle);
      } catch (error) {
        avisar(error.message, true);
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        boton.disabled = true;
        try {
          await moverBloque(guia, id, boton.dataset.mover);
          await pintarEditor(handle);
        } catch (error) {
          avisar(error.message, true);
          boton.disabled = false;
        }
      });
    });

    tarjeta.querySelector('[data-borrar]')?.addEventListener('click', async () => {
      if (!window.confirm('¿Eliminar este bloque? No se puede deshacer.')) return;
      try {
        await borrarBloque(guia, id);
        await pintarEditor(handle);
        avisar('Bloque eliminado');
      } catch (error) {
        avisar(error.message, true);
      }
    });
  });
}

async function pintarApariencia() {
  pantalla.innerHTML = '<p class="cargando">Cargando…</p>';

  const [config, revision, colores, camposConfig] = await Promise.all([
    leerConfig(), revisarEstructura(), cargarColores(), camposDeConfig(),
  ]);
  const hayTransicion = camposConfig.has('trans_activo');
  const hayMenu = camposConfig.has('menu_tarjetas');
  const hayInicio = camposConfig.has('categorias_inicio') && camposConfig.has('temporada');
  const trans = config.transicion ?? TRANSICION_POR_DEFECTO;
  const tienda = new URLSearchParams(location.search).get('shop') || '';

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(revision.pendientes)}

      <div class="titular">
        <h1>Apariencia</h1>
        <p class="subtitulo">Vale para los tres bloques a la vez, y manda sobre los ajustes del editor de temas.</p>
      </div>

      <s-section accessibilityLabel="Aspecto de los bloques">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-select id="alineacion" label="Alineación">
            <s-option value="izquierda">Izquierda</s-option>
            <s-option value="centro">Centro</s-option>
            <s-option value="derecha">Derecha</s-option>
          </s-select>
          <s-select id="escala" label="Tamaño">
            <s-option value="normal">Normal — como saintvenik.cl</s-option>
            <s-option value="compacto">Compacto — más pequeño</s-option>
          </s-select>
          <div>
            <label for="tamano">Muestras de color: <span id="tamano-valor">${config.tamanoMuestra}</span> px</label>
            <input type="range" id="tamano" min="20" max="64" step="2" value="${config.tamanoMuestra}" />
          </div>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="guardar-apariencia">Guardar</s-button>
      </s-section>

      <s-section heading="Así se ve en la ficha">
        <div id="previa-apariencia"></div>
      </s-section>

      ${hayTransicion ? `
      <s-section id="transicion" heading="Cambio de página" subheading="Como en louisvuitton.com: al tocar un enlace aparece arriba una barra gris muy fina que se llena lento y parejo, la cuenta regresiva y el encabezado se quedan quietos, y lo de abajo entra con un fundido en vez de aparecer de golpe. Además, la tienda empieza a cargar la página siguiente en cuanto el cliente apoya el dedo sobre un enlace.">
        <div class="trans-previa" id="trans-previa" aria-hidden="true">
          <div class="trans-previa__barra" id="trans-barra"></div>
          <div class="trans-previa__pagina">saintvenik.cl</div>
        </div>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-select label="Estado" id="t-modo">
            <s-option value="no">Apagado</s-option>
            <s-option value="prueba">Vista previa: solo con el enlace</s-option>
            <s-option value="si">Activo en la tienda</s-option>
          </s-select>
          <s-color-field label="Color de la barra" id="t-color" value="${escapar(trans.color)}"></s-color-field>
          <s-number-field label="Grosor de la barra" id="t-grosor" value="${trans.grosor}" min="1" max="6" step="1" details="En píxeles. La de Louis Vuitton es de 2, gris (#999999)."></s-number-field>
          <s-number-field label="Duración del fundido" id="t-fundido" value="${trans.fundido}" min="0" max="800" step="50" details="En milisegundos. 0 = sin fundido, solo la barra."></s-number-field>
        </s-grid>
        <div class="casilla-polaris">
          <s-checkbox label="Precargar la página siguiente al apoyar el dedo sobre un enlace" id="t-precarga" ${trans.precarga ? 'checked' : ''}></s-checkbox>
        </div>
        <p class="ayuda">El fundido lo hace el propio navegador: Chrome, Edge y Safari lo tienen; donde no existe, la página cambia como siempre y la barra sale igual. El carrito, la cuenta y el pago nunca se precargan.</p>
        <p class="ayuda" id="t-enlace" hidden>Para verlo antes de encenderlo: <a target="_blank" rel="noopener" href="https://${escapar(tienda)}/?sv-vista=1">abre la tienda con este enlace</a> y navega. Solo lo ve quien entra por ahí.</p>
        <s-button slot="primary-action" variant="primary" id="guardar-transicion">Guardar</s-button>
      </s-section>` : ''}

      ${hayMenu ? `
      <s-section id="menu" heading="Menú del teléfono" subheading="Como gasper.co: cada colección del menú en una tarjeta gris con su foto a la derecha, el logo arriba a la izquierda y la X sin recuadro. La foto es la de cada colección (Productos → Colecciones); lo que no es colección (Contacto, Ingresar) queda como enlace simple debajo.">
        <s-select label="Estado" id="m-modo">
          <s-option value="no">Apagado: el menú del tema</s-option>
          <s-option value="prueba">Vista previa: solo con el enlace</s-option>
          <s-option value="si">Activo en la tienda</s-option>
        </s-select>
        <p class="ayuda" id="m-enlace" hidden>Para verlo antes de encenderlo: <a target="_blank" rel="noopener" href="https://${escapar(tienda)}/?sv-vista=1">abre la tienda con este enlace</a> en el teléfono y toca el menú. Solo lo ve quien entra por ahí.</p>
        <s-button slot="primary-action" variant="primary" id="guardar-menu">Guardar</s-button>
      </s-section>` : ''}

      ${hayInicio ? `
      <s-section id="inicio" heading="Inicio: colecciones" subheading="La cuadrícula de colecciones del inicio (Cadenas, Pulseras, Colgantes, Anillos) se queda igual, una debajo de otra, pero sobre fondo negro y sin el borde blanco alrededor de cada foto. Las fotos normales se cambian en el editor del tema, en cada tarjeta de la cuadrícula. En Navidad cada tarjeta usa la «Foto de Navidad» de su colección (Productos → Colecciones → la colección, abajo en Metacampos); si una no la tiene, sale la normal.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-select label="Estado" id="i-modo">
            <s-option value="no">Apagado: fondo blanco, como siempre</s-option>
            <s-option value="prueba">Vista previa: solo con el enlace</s-option>
            <s-option value="si">Activo en la tienda</s-option>
          </s-select>
        </s-grid>
        <p class="ayuda">La temporada (Normal, Navidad u otra) se elige en la pestaña «Temporadas»; sus fotos, en «Fotos».</p>
        <p class="ayuda" id="i-enlace" hidden>Para verlo antes de encenderlo: <a target="_blank" rel="noopener" href="https://${escapar(tienda)}/?sv-vista=1">abre la tienda con este enlace</a>. Solo lo ve quien entra por ahí.</p>
        <p class="ayuda">Fotos de colección estilo Jaxxon (9-nov, Nano Banana): este botón las deja en Contenido → Archivos de la tienda como sv-inicio-cadenas.jpg, -pulseras, -colgantes y -anillos. Después se eligen en cada tarjeta de la cuadrícula. Si ya estaban, las cambia por la versión más nueva en el mismo archivo, y la tienda la muestra sola. También trae las fotos en uso de las tarjetas del menú del teléfono (sv-menu-cadenas.jpg, etc.), la foto de «Tu cadena de cada día» (sv-inicio-cadena-dia.jpg) y el banner de Best Sellers fuera de Navidad (sv-portada-bestsellers.jpg).</p>
        <p class="ayuda">«Preparar las fotos de Navidad» deja la foto de terciopelo rojo en cada colección y los banners de Navidad de las páginas de colección (Cadenas, Pulseras, Anillos, Colgantes, Conjuntos, Essentials y Best Sellers, con otras joyas). Si ya estaban, los cambia por la versión más nueva en el mismo archivo, sin crear copias. También la foto de la sección «El regalo Nº1 para él», que aparece en el inicio, donde estaba el 3x2, con un botón a Best Sellers. Todo se ve al poner la temporada en Navidad; para mirarlo antes, abre la tienda con ?sv-navidad=1 al final de la dirección (sirve en el inicio y en las colecciones).</p>
        <p class="ayuda"><b>Ojo:</b> estos dos botones vuelven a poner las fotos que trae la app; si cambiaste alguna a mano en la pestaña «Fotos», la pisan.</p>
        <s-stack direction="inline" gap="base">
          <s-button id="i-fotos">Traer las fotos nuevas a Archivos</s-button>
          <s-button id="i-navidad">Preparar las fotos de Navidad</s-button>
        </s-stack>
        <s-button slot="primary-action" variant="primary" id="guardar-inicio">Guardar</s-button>
      </s-section>` : ''}

      <s-section heading="Textos de las colecciones" subheading="«Resistente al agua» no va en lugares generales: hace creer que toda la tienda lo es, y las joyas con brillantes no lo son. Las fichas de productos sin brillantes sí pueden decirlo.">
        <p class="ayuda">Este botón lo saca de la descripción de todas las colecciones (la frase que muestra Google y que una app de anuncios copia en cada ficha): «Resistentes al Agua, Sudor y Calor» queda «Resistentes al Sudor y Calor». Lo demás del texto no se toca, y apretarlo de nuevo no cambia nada.</p>
        <s-button id="t-agua">Quitar «agua» de las colecciones</s-button>
      </s-section>

      <s-section heading="Botón de la guía de tallas" subheading="Si lo dejas vacío se usa el texto por defecto en cada idioma.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          <s-text-field id="boton-es" label="Texto en español" value="${escapar(config.botonGuiaEs)}" placeholder="Guía de tallas"></s-text-field>
          <s-text-field id="boton-en" label="Texto en inglés" value="${escapar(config.botonGuiaEn)}" placeholder="Size guide"></s-text-field>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="guardar-boton">Guardar</s-button>
      </s-section>
    </s-page>`;

  /* Lo elegido va por propiedad: en el marcado inyectado no se respeta y los
   * dos desplegables volvían a su primera opción, que no es la guardada. */
  document.getElementById('alineacion').value = config.alineacion;
  document.getElementById('escala').value = config.escala;

  conectarPendientes(pintarApariencia);

  const lienzo = document.getElementById('previa-apariencia');
  const ordenados = ordenarComoLaTienda(colores, config.ordenColores);

  /* La previa se repinta al mover los controles, sin guardar: así se prueba
   * antes de decidir, que es lo que uno quiere de una previa. */
  function repintar() {
    lienzo.innerHTML = coloresHtml(ordenados, {
      alineacion: document.getElementById('alineacion').value,
      escala: document.getElementById('escala').value,
      tamano: Number(document.getElementById('tamano').value),
    });
  }

  document.getElementById('tamano').addEventListener('input', (e) => {
    document.getElementById('tamano-valor').textContent = e.target.value;
    repintar();
  });
  document.getElementById('alineacion').addEventListener('change', repintar);
  document.getElementById('escala').addEventListener('change', repintar);
  repintar();

  document.getElementById('guardar-apariencia').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      await guardarApariencia({
        alineacion: document.getElementById('alineacion').value,
        escala: document.getElementById('escala').value,
        tamanoMuestra: Number(document.getElementById('tamano').value),
      });
      avisar('Apariencia guardada');
    } catch (error) {
      avisar(error.message, true);
    } finally {
      boton.loading = false;
    }
  });

  if (hayTransicion) conectarTransicion(trans);
  if (hayMenu) conectarMenu(config.menu);
  if (hayInicio) conectarInicio(config.inicio);
  document.getElementById('t-agua').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const { cambiadas, quedan } = await quitarAguaDeColecciones();
      avisar(`${cambiadas.length ? `Sin «agua»: ${cambiadas.join(', ')}.` : 'Ninguna colección lo decía.'}${quedan.length ? ` Revisar a mano: ${quedan.join(', ')}.` : ''}`, quedan.length > 0);
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });

  document.getElementById('guardar-boton').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      await guardarTextosBoton({
        es: String(document.getElementById('boton-es').value ?? '').trim(),
        en: String(document.getElementById('boton-en').value ?? '').trim(),
      });
      avisar('Guardado');
    } catch (error) {
      avisar(error.message, true);
    } finally {
      boton.loading = false;
    }
  });
}

/* filtro: 'todos' | 'sin-hermano' | 'sin-color' */
let estadoProductos = { texto: '', filtro: 'todos' };

const FILTROS = {
  'todos': 'Todos',
  'sin-hermano': 'Tienen color pero no hermano',
  'sin-color': 'No tienen ningún color',
};

/* Una ficha por color: encendida si el producto lleva su etiqueta. */
function fichasDeColor(p, colores) {
  const suyas = new Set(p.etiquetas.map((e) => e.trim().toLowerCase()));
  const conEtiqueta = colores.filter((c) => c.etiqueta.trim());
  if (!conEtiqueta.length) return '';
  return `
    <p class="ayuda" style="margin-top:8px;">Color de este producto (su etiqueta):</p>
    <div class="fichas-color">${conEtiqueta.map((c) => {
    const etq = c.etiqueta.trim();
    const on = suyas.has(etq.toLowerCase());
    return `<button type="button" class="ficha-color${on ? ' is-on' : ''}" data-color-etiqueta="${escapar(etq)}" aria-pressed="${on}">
        ${escapar(c.nombre || etq)} <span class="ayuda">${escapar(etq)}</span></button>`;
  }).join('')}</div>`;
}

function tarjetaProducto(p, etiquetasColor, colores = []) {
  const falta = sinHermano(p, etiquetasColor);
  const incoloro = sinColor(p, etiquetasColor);
  const hermanos = p.hermanos.length
    ? p.hermanos.map((h) => `
        <li>${escapar(h.titulo)}
          <button type="button" class="secundario secundario--peligro" data-desvincular="${escapar(h.id)}">Desvincular</button>
        </li>`).join('')
    : '';

  return `
    <s-section data-producto="${escapar(p.id)}">
      <div class="color">
        ${p.imagen ? `<img class="producto__foto" src="${escapar(p.imagen)}" alt="" />` : '<div class="producto__foto"></div>'}
        <div style="flex:1 1 auto;">
          <p class="producto__titulo">${escapar(p.titulo)}${p.activo ? '' : ' <span class="ayuda">(borrador)</span>'}</p>
          <p class="ayuda">${p.etiquetas.length ? escapar(p.etiquetas.join(', ')) : 'sin etiquetas'}</p>
          ${fichasDeColor(p, colores)}

          ${hermanos
    ? `<p class="ayuda" style="margin-top:8px;">Hermano de color:</p><ul class="producto__hermanos">${hermanos}</ul>`
    : `<p class="${falta || incoloro ? 'problema' : 'ayuda'}" style="margin-top:8px;">${
      falta
        ? 'Tiene etiqueta de color pero no tiene hermano: en su ficha no aparecerá el selector.'
        : incoloro
          ? `No lleva la etiqueta de ningún color (${escapar(etiquetasColor.join(', ') || 'no hay colores')}): su propia muestra no puede dibujarse.`
          : 'Sin hermano de color.'
    }</p>`}

          <div class="buscador" style="margin-top:10px;">
            <s-search-field data-vincular-texto label="Buscar el otro color"
              labelAccessibilityVisibility="exclusive" placeholder="Buscar el otro color por nombre…"></s-search-field>
          </div>
          <div class="acciones">
            <s-button data-vincular-buscar>Buscar</s-button>
          </div>
          <div data-vincular-resultados></div>
        </div>
      </div>
    </s-section>`;
}

async function pintarProductos() {
  pantalla.innerHTML = estadoProductos.filtro === 'todos'
    ? '<p class="cargando">Buscando productos…</p>'
    : '<p class="cargando">Recorriendo todo el catálogo…</p>';

  const filtrando = estadoProductos.filtro !== 'todos';

  /* Las etiquetas de color salen de las entradas de color, no de la lista de
   * orden: un color que no este en el orden sigue siendo un color, y la tienda
   * lo pinta al final. Antes se usaba el orden, y un color nuevo sin ordenar
   * habria contado como "sin color". */
  const [lote, colores] = await Promise.all([
    filtrando
      ? todosLosProductos(estadoProductos.texto)
      : buscarProductos(estadoProductos.texto).then((productos) => ({ productos, incompleto: false })),
    cargarColores(),
  ]);
  const { productos, incompleto } = lote;
  const etiquetasColor = [...new Set(colores.map((c) => c.etiqueta.trim()).filter(Boolean))];

  const criterio = {
    'sin-hermano': (p) => sinHermano(p, etiquetasColor),
    'sin-color': (p) => sinColor(p, etiquetasColor),
  }[estadoProductos.filtro];
  const visibles = criterio ? productos.filter(criterio) : productos;

  const resumen = filtrando
    ? `${visibles.length} de ${productos.length} productos${incompleto ? ' revisados — el catálogo es más grande y no se recorrió entero' : ''}.`
    : 'Se muestran hasta 50 resultados. Elige un filtro para recorrer el catálogo entero.';

  pantalla.innerHTML = `
    <s-page>
      <div class="titular">
        <h1>Productos</h1>
        <p class="subtitulo">
          Aquí se dice qué producto es el mismo modelo en otro color. Es lo que hace
          aparecer el selector de color en la ficha, y se escribe siempre en los dos.
        </p>
      </div>

      <s-section accessibilityLabel="Buscar productos">
        <s-grid gridTemplateColumns="2fr 1fr" gap="base">
          <s-search-field id="buscar" label="Buscar por nombre"
            value="${escapar(estadoProductos.texto)}" placeholder="Buscar por nombre…"></s-search-field>
          <s-select id="filtro" label="Filtrar">
            ${Object.entries(FILTROS).map(([valor, texto]) =>
    `<s-option value="${valor}">${texto}</s-option>`).join('')}
          </s-select>
        </s-grid>
        <p class="ayuda">${resumen}</p>
        <s-button slot="primary-action" variant="primary" id="buscar-boton">Buscar</s-button>
      </s-section>

      ${visibles.length
    ? visibles.map((p) => tarjetaProducto(p, etiquetasColor, colores)).join('')
    : '<s-section><div class="vacio">Ningún producto coincide.</div></s-section>'}
    </s-page>`;

  /* Lo elegido en el desplegable se pone por propiedad: el marcado inyectado
   * no lo respeta y el filtro volvía siempre a «Todos». */
  document.getElementById('filtro').value = estadoProductos.filtro;


  const buscar = () => {
    estadoProductos.texto = String(document.getElementById('buscar').value ?? '').trim();
    estadoProductos.filtro = document.getElementById('filtro').value;
    ir('productos');
  };
  document.getElementById('buscar-boton').addEventListener('click', buscar);
  document.getElementById('buscar').addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); });
  document.getElementById('filtro').addEventListener('change', buscar);

  pantalla.querySelectorAll('[data-producto]').forEach((tarjeta) => {
    const id = tarjeta.dataset.producto;
    const producto = productos.find((p) => p.id === id);

    tarjeta.querySelectorAll('[data-color-etiqueta]').forEach((ficha) => {
      ficha.addEventListener('click', async () => {
        const poner = !ficha.classList.contains('is-on');
        ficha.disabled = true;
        try {
          await ponerEtiquetaColor(producto, ficha.dataset.colorEtiqueta, poner);
          ficha.classList.toggle('is-on', poner);
          ficha.setAttribute('aria-pressed', String(poner));
          avisar(poner ? `Etiqueta «${ficha.dataset.colorEtiqueta}» puesta` : `Etiqueta «${ficha.dataset.colorEtiqueta}» quitada`);
        } catch (error) {
          avisar(error.message, true);
        } finally {
          ficha.disabled = false;
        }
      });
    });

    tarjeta.querySelectorAll('[data-desvincular]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        boton.disabled = true;
        try {
          await desvincular(producto, boton.dataset.desvincular);
          avisar('Desvinculados los dos productos');
          await ir('productos');
        } catch (error) {
          avisar(error.message, true);
          boton.disabled = false;
        }
      });
    });

    const caja = tarjeta.querySelector('[data-vincular-resultados]');
    tarjeta.querySelector('[data-vincular-buscar]').addEventListener('click', async (e) => {
      const texto = String(tarjeta.querySelector('[data-vincular-texto]').value ?? '').trim();
      if (!texto) { avisar('Escribe el nombre del otro color', true); return; }
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        const candidatos = (await buscarProductos(texto)).filter((c) => c.id !== id);
        caja.innerHTML = candidatos.length
          ? `<ul class="producto__hermanos">${candidatos.slice(0, 10).map((c) => `
              <li>${escapar(c.titulo)}
                <button type="button" class="secundario" data-elegir="${escapar(c.id)}">Vincular</button>
              </li>`).join('')}</ul>`
          : '<p class="ayuda">Ningún producto coincide.</p>';

        caja.querySelectorAll('[data-elegir]').forEach((boton) => {
          boton.addEventListener('click', async () => {
            boton.disabled = true;
            try {
              const otro = candidatos.find((c) => c.id === boton.dataset.elegir);
              await vincular(producto, otro);
              avisar('Vinculados en los dos sentidos');
              await ir('productos');
            } catch (error) {
              avisar(error.message, true);
              boton.disabled = false;
            }
          });
        });
      } catch (error) {
        avisar(error.message, true);
      } finally {
        boton.loading = false;
      }
    });
  });
}


/* ---------------------------------------------------------------------------
 * Insignias y beneficios
 *
 * Dos pantallas que por dentro son lo mismo: una lista de entradas y, en cada
 * una, a qué productos alcanza. Lo que cambia es el adorno — la insignia tiene
 * dos colores, el beneficio tiene icono — así que el editor de asignación está
 * escrito una sola vez aquí y las dos lo usan.
 *
 * Todo lo que se toca se ve al momento: el texto y los colores repintan la
 * muestra mientras se escribe, buscar un producto no necesita pulsar ningún
 * botón, y guardar no recarga la pantalla. Es una pantalla para trastear, no
 * un formulario para rellenar.
 * ------------------------------------------------------------------------- */

const ESPERA_BUSQUEDA = 280;

/* Cada tarjeta tiene tres buscadores y puede haber 25 tarjetas: setenta y cinco
 * cajas de resultados. Si cada una pusiera su propio oyente en document, cada
 * repintado dejaria setenta y cinco mas clavados. Asi que el oyente es UNO, se
 * pone una sola vez, y lo que cambia es la lista de cerradores, que se vacia al
 * cambiar de pantalla porque esos nodos ya no existen. */
const cerradores = new Set();
let oyentesDeCierre = false;

/* Sube con cada pintada. Lo que termina tarde (el recálculo) compara antes de
 * tocar nada: si ya no es su pantalla, se calla. */
let pintado = 0;
const pasesVivos = new Set();

function cerrarBuscadores(menos) {
  cerradores.forEach((cerrar) => { if (cerrar !== menos) cerrar(); });
}

function ponerOyentesDeCierre() {
  if (oyentesDeCierre) return;
  oyentesDeCierre = true;

  /* En captura y con pointerdown: asi se cierra antes de que el clic llegue a
   * su destino, y sigue funcionando el clic en un resultado porque ese esta
   * dentro de su propia columna. */
  document.addEventListener('pointerdown', (e) => {
    const columna = e.target.closest ? e.target.closest('.asigna__col') : null;
    cerradores.forEach((cerrar) => { if (cerrar.columna !== columna) cerrar(); });
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarBuscadores();
  });

  /* Con el tabulador no hay pointerdown: sin esto la lista se quedaba flotando
   * sobre Guardar y el siguiente toque añadía algo que nadie pidió. */
  document.addEventListener('focusin', (e) => {
    const columna = e.target.closest ? e.target.closest('.asigna__col') : null;
    cerradores.forEach((cerrar) => { if (cerrar.columna !== columna) cerrar(); });
  });
}

/* Las fichas de lo ya elegido. `s-clickable-chip` trae su propia equis y avisa
 * con un evento `remove` que sube hasta la tarjeta, así que no hace falta un
 * botón por ficha. Lo que el evento NO trae es a quién se quitó: por eso el
 * identificador va en un data- del propio elemento.
 *
 * Una etiqueta que resta lo dice con palabras, «quita: brillantes». El color
 * del componente no se puede cambiar desde fuera (vive en su shadow), y el
 * guión de «-brillantes» es un píxel: confundirlo invierte a qué productos
 * alcanza. Lo único nuestro que entra ahí es el texto, así que va en el texto.
 *
 * El `title` va en la propia ficha porque el componente recorta lo largo con
 * puntos suspensivos y no pone ningún aviso: sin esto, dos productos de
 * nombre parecido se ven idénticos y se quita el que no era.
 *
 * Sin accessibilityLabel a propósito: el componente ya tiene su botón de
 * quitar, y poner aquí «Quitar oro» añadía una segunda parada de tabulador
 * que prometía quitar y no quitaba nada. */
function chipsHtml(lista, vacio) {
  if (!lista.length) return `<p class="ayuda">${escapar(vacio)}</p>`;
  return lista.map((x) => {
    const resta = esResta(x.titulo);
    const texto = (resta ? `quita: ${sinSigno(x.titulo)}` : x.titulo)
      + (x.cuantos === undefined ? '' : ` (${x.cuantos})`);
    return `<s-clickable-chip removable${resta ? ' color="strong"' : ''} data-quitar="${
      escapar(x.id)
    }" title="${escapar(texto)}">${escapar(texto)}</s-clickable-chip>`;
  }).join('');
}

/* Las tres columnas se usan igual: escribes y aparece lo que coincide. Un
 * desplegable de colecciones y un buscador de productos serían dos cosas
 * distintas que hacen lo mismo, y habría que aprender las dos.
 *
 * La lista de resultados sigue siendo nuestra y no de Polaris: tiene que
 * flotar sobre la tarjeta sin empujar nada, cerrarse al tocar fuera y
 * descartar respuestas que llegan tarde. Eso ya está resuelto aquí.
 *
 * Las fichas van ARRIBA y el buscador debajo. Al revés parecía más natural,
 * pero la lista se despliega hacia abajo y tapaba las fichas: el clic que iba
 * a una equis caía sobre un resultado y añadía lo que nadie pidió. */
function asignacionHtml(estado) {
  const columna = (clave, titulo, marcador, vacio, ayuda) => `
      <div class="asigna__col">
        <p class="asigna__titulo">${titulo}</p>
        <div class="chips" data-chips="${clave}">${chipsHtml(estado[clave], vacio)}</div>
        <div class="buscador">
          <s-search-field data-buscar="${clave}" label="${titulo}"
            labelAccessibilityVisibility="exclusive" placeholder="${marcador}"></s-search-field>
          <div class="resultados" data-resultados="${clave}" hidden></div>
        </div>
        ${ayuda ? `<p class="ayuda">${ayuda}</p>` : ''}
      </div>`;

  return `
    <div class="asigna">
      ${columna('etiquetas', 'Etiquetas de producto', 'p. ej. oro', 'Ninguna.',
    'Con un guión delante, resta: <code>-brillantes</code> quita esos productos de los que ya había.')}
      ${columna('colecciones', 'Colecciones enteras', 'Busca una colección…', 'Ninguna.', '')}
      ${columna('productos', 'Productos sueltos', 'Busca un producto…', 'Ninguno.', '')}
    </div>
    <p class="ayuda" data-alcance></p>
  `;
}

/* Una colección puede traer 80 productos y otra 3: sumar las cuentas da una
 * idea del tamaño sin tener que preguntarle a Shopify en cada tecla. Es una
 * estimación y se dice que lo es, porque un producto en dos colecciones se
 * cuenta dos veces. */
function alcanceEstimado(estado) {
  const deColecciones = estado.colecciones.reduce((n, c) => n + (c.cuantos ?? 0), 0);
  return estado.productos.length + deColecciones;
}

function textoAlcance(estado, guardado) {
  if (!estado.sucio) {
    if (!guardado) return 'Todavía no alcanza a ningún producto: elige una etiqueta, una colección o productos sueltos.';
    return `Alcanza a ${guardado} producto${guardado === 1 ? '' : 's'}.`;
  }
  /* De una etiqueta no se sabe cuántos productos lleva sin preguntárselo a
   * Shopify, así que con etiquetas de por medio no se estima: se dice. */
  if (estado.etiquetas.length) return 'Pulsa Guardar para calcular a cuántos alcanza y aplicarlo.';
  const n = alcanceEstimado(estado);
  if (!n) return 'Sin nada elegido no se muestra en ninguna ficha. Pulsa Guardar para aplicarlo.';
  return `Alcanzará a unos ${n} productos. Pulsa Guardar para calcularlo exacto y aplicarlo.`;
}

/* El estado vive en memoria mientras se edita la tarjeta y solo baja a Shopify
 * al pulsar Guardar. Guardar en cada clic sería más simple de escribir, pero
 * añadir cinco productos serían cinco escrituras y cinco esperas. */
function conectarAsignacion(tarjeta, estado, colecciones, etiquetasTienda, guardado) {
  let alcance = guardado;
  const repintar = () => {
    tarjeta.querySelector('[data-chips="etiquetas"]').innerHTML = chipsHtml(estado.etiquetas, 'Ninguna.');
    tarjeta.querySelector('[data-chips="productos"]').innerHTML = chipsHtml(estado.productos, 'Ninguno.');
    tarjeta.querySelector('[data-chips="colecciones"]').innerHTML = chipsHtml(estado.colecciones, 'Ninguna.');
    tarjeta.querySelector('[data-alcance]').textContent = textoAlcance(estado, alcance);
  };

  const anadir = (donde, item) => {
    if (estado[donde].some((x) => x.id === item.id)) return;
    if (estado[donde].length >= TOPE_REFERENCIAS) {
      avisar(`Shopify no deja guardar más de ${TOPE_REFERENCIAS} en esa lista. Usa una colección en vez de productos sueltos.`, true);
      return;
    }
    estado[donde].push(item);
    estado.sucio = true;
    repintar();
  };

  /* `remove` es lo que dispara la equis de la ficha; el componente no se quita
   * solo, lo quitamos nosotros al repintar. El evento sube hasta aquí, así que
   * basta un oyente por tarjeta aunque las fichas se rehagan cada vez. */
  tarjeta.addEventListener('remove', (e) => {
    const x = e.target.closest ? e.target.closest('[data-quitar]') : null;
    if (!x || !tarjeta.contains(x)) return;
    const id = x.dataset.quitar;
    estado.etiquetas = estado.etiquetas.filter((e) => e.id !== id);
    estado.productos = estado.productos.filter((p) => p.id !== id);
    estado.colecciones = estado.colecciones.filter((c) => c.id !== id);
    estado.sucio = true;
    repintar();
  });

  /* Las dos búsquedas comparten todo menos de dónde sacan los candidatos: las
   * colecciones ya están en memoria y los productos hay que pedirlos. */
  function conectarBuscador(donde, buscador, ofreceVacio) {
    const campo = tarjeta.querySelector(`[data-buscar="${donde}"]`);
    const caja = tarjeta.querySelector(`[data-resultados="${donde}"]`);
    let temporizador = null;
    let vuelta = 0;

    /* Cerrar es tambien vaciar: dejar los botones dentro de una caja oculta
     * guarda hasta ocho nodos por caja sin que nadie los vea, y si el CSS
     * vuelve a fallar reaparecen. Y sube la vuelta, que es lo que invalida la
     * respuesta que venga de camino. */
    const cerrar = () => {
      clearTimeout(temporizador);
      vuelta += 1;
      caja.hidden = true;
      caja.innerHTML = '';
    };
    cerrar.columna = campo.closest('.asigna__col');
    cerradores.add(cerrar);
    ponerOyentesDeCierre();

    const pintar = (encontrados) => {
      caja.hidden = false;
      caja.innerHTML = encontrados.length
        ? encontrados.map((x) => `
            <button type="button" class="resultado" data-anadir="${escapar(x.id)}">
              ${escapar(x.titulo)}${x.cuantos === undefined ? '' : ` <span class="resultado__n">${x.cuantos}</span>`}
            </button>`).join('')
        : '<p class="ayuda">Nada con ese nombre.</p>';

      caja.querySelectorAll('[data-anadir]').forEach((boton) => {
        boton.addEventListener('click', () => {
          const x = encontrados.find((y) => y.id === boton.dataset.anadir);
          if (!x) return;
          anadir(donde, x);
          campo.value = '';
          cerrar();
        });
      });
    };

    const lanzar = async () => {
      const texto = campo.value.trim();

      /* Cada búsqueda lleva su número, y se sube ANTES de cualquier salida. Si
       * vuelve una vieja después de una nueva, se tira: si no, escribir deprisa
       * deja en pantalla el resultado de hace tres letras, y vaciar el campo no
       * impedía que una respuesta lenta volviera a abrir la caja. */
      vuelta += 1;
      const mia = vuelta;

      if (!texto && !ofreceVacio) { cerrar(); return; }

      try {
        const encontrados = await buscador(texto);
        if (mia !== vuelta) return;
        cerrarBuscadores(cerrar);
        pintar(encontrados.slice(0, 8));
      } catch (error) {
        if (mia !== vuelta) return;
        caja.hidden = false;
        caja.innerHTML = `<p class="problema">${escapar(error.message)}</p>`;
      }
    };

    campo.addEventListener('input', () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(lanzar, ESPERA_BUSQUEDA);
    });
    campo.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(temporizador);
      lanzar();
    });
    /* Al enfocar se ofrece lo que hay, sin tener que adivinar qué escribir: las
     * colecciones y las etiquetas ya están en memoria. Los productos no, que
     * serían una consulta por cada clic en el campo. */
    /* `focusin` y no `focus`: el campo es un componente y quien recibe el foco
     * de verdad es el input de dentro. `focus` no sube; `focusin` sí. */
    campo.addEventListener('focusin', () => {
      if (campo.value.trim() || ofreceVacio) lanzar();
    });
  }

  conectarBuscador('productos', async (texto) => (await buscarProductos(texto))
    .map((p) => ({ id: p.id, titulo: p.titulo, handle: p.handle })));

  conectarBuscador('colecciones', async (texto) => {
    const busca = texto.toLowerCase();
    return colecciones.filter((c) => c.titulo.toLowerCase().includes(busca));
  }, true);

  /* Si lo escrito no está entre las etiquetas de la tienda se ofrece igual:
   * puede ser una etiqueta que todavía no tiene ningún producto, o una que la
   * consulta no devolvió. Es texto, no una referencia. */
  conectarBuscador('etiquetas', async (texto) => {
    const resta = esResta(texto);
    const limpio = sinSigno(texto);
    const busca = limpio.toLowerCase();
    const suyas = etiquetasTienda.filter((t) => t.toLowerCase().includes(busca));
    const exacta = etiquetasTienda.some((t) => t.toLowerCase() === busca);
    const lista = exacta ? suyas : [limpio, ...suyas];
    /* Si lo escrito llevaba guión, todo lo que se ofrece resta. */
    return lista
      .filter(Boolean)
      .map((t) => (resta ? `-${t}` : t))
      .map((t) => ({ id: `tag:${t}`, titulo: t }));
  }, true);

  repintar();

  return {
    repintar,
    /* El recálculo termina después de pintar: cuando llega, cada ficha pone al
     * día su «alcanza a N», salvo que la persona ya esté editándola. */
    alcanceAhora(n) {
      alcance = n;
      if (!estado.sucio) repintar();
    },
  };
}

/* Las colecciones cambian sin avisar a la app: entra un producto nuevo a «Oro»
 * y la cadena de handles se queda vieja. Recalcular al abrir la pantalla es el
 * momento natural, porque es justo cuando alguien va a mirar si está bien. */
/* `pase` es el testigo de la pantalla que lo lanzó: si deja de valer —porque
 * se guardó a mano, se borró algo o se cambió de pantalla— el recálculo para.
 * Antes seguía y pisaba los handles que el guardado acababa de escribir.
 *
 * El cache es de esta pasada y se pasa a mano: una memoria global tenía
 * abierta la puerta durante segundos y hacía que lo que se leyera en ese rato
 * (por ejemplo al pulsar «Crear lo que falta») viera datos de antes. */
async function recalcular(lista, sincronizar, pase) {
  const cache = new Map();
  let cambiadas = 0;
  const cortadas = new Set();
  for (const item of lista) {
    if (pase && !pase.vivo) break;
    /* Se recalculan todas, no solo las que tienen colecciones. Una entrada de
     * productos sueltos no cuesta ni una consulta (los handles ya están en
     * memoria), y así se arregla sola si quedó a medias: un producto renombrado,
     * o un guardado que escribió las referencias y se cayó antes de los
     * handles. */
    try {
      const r = await sincronizar(item, undefined, cache);
      if (r.cambio) cambiadas += 1;
      r.cortadas.forEach((c) => cortadas.add(c));
    } catch (error) {
      if (!pase || pase.vivo) avisar(`No se pudo recalcular «${item.nombre}»: ${error.message}`, true);
    }
  }
  if (cortadas.size && (!pase || pase.vivo)) {
    avisar(`Estas colecciones tienen más productos de los que la app puede leer de una vez, así que faltan algunos: ${[...cortadas].join(', ')}.`, true);
  }
  return cambiadas;
}

/* Subir y bajar en vez de escribir un número: el orden se ve en la pantalla,
 * así que moverlo tiene que hacerse donde se ve. */
async function moverEntrada(lista, id, direccion, guardar) {
  const i = lista.findIndex((x) => x.id === id);
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;
  await guardar(lista[i].id, { orden: j + 1 });
  await guardar(lista[j].id, { orden: i + 1 });
}

/* Cargar las entradas falla mientras la estructura no existe, y eso es el
 * estado normal de una tienda recién instalada, no un error que enseñar. Pero
 * si la estructura SÍ existe y aun así falla (un THROTTLED, por ejemplo),
 * callarse dejaría la pantalla diciendo que no hay nada, que es mentira. */
async function cargarOVacio(cargar, hayEstructura) {
  try {
    return { lista: await cargar(), error: '' };
  } catch (error) {
    return { lista: [], error: hayEstructura ? error.message : '' };
  }
}

/* ---------------------------------------------------------------------------
 * Color con transparencia
 *
 * La tienda guarda el color por un lado (seis dígitos hex, que es lo único que
 * admite un campo `color` de Shopify) y la opacidad por otro, en un número de
 * 0 a 100. El campo de Polaris, en cambio, lleva la transparencia dentro del
 * propio color: ocho dígitos, #rrggbbaa. Estas dos funciones traducen entre lo
 * uno y lo otro para que en pantalla haya un control en vez de dos.
 * ------------------------------------------------------------------------- */
function conAlfaHex(color, opacidad) {
  const o = Number.isFinite(opacidad) ? Math.max(0, Math.min(100, opacidad)) : 100;
  const n = Math.round(o * 2.55);
  return `${color}${n.toString(16).padStart(2, '0')}`;
}

/* Si lo escrito no es un color de seis u ocho dígitos se devuelve lo que
 * había: así una pulsación a medias («#11») no borra el color guardado.
 *
 * Y si trae seis dígitos, la opacidad NO SE TOCA. El campo es una caja de
 * texto: escribir o pegar ahí el color de marca («#ff0000») es lo normal, y
 * leer eso como «opacidad 100» borraba en silencio la transparencia que la
 * insignia tenía configurada. Solo el selector, que siempre devuelve ocho
 * dígitos, cambia la opacidad. */
function partirAlfa(valor, porDefecto) {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(String(valor ?? '').trim());
  if (!m) return { color: porDefecto.color, opacidad: porDefecto.opacidad };
  const alfa = m[2] === undefined ? null : parseInt(m[2], 16);
  return {
    color: `#${m[1].toLowerCase()}`,
    opacidad: alfa === null ? porDefecto.opacidad : Math.round((alfa / 255) * 100),
  };
}

/* «Sin icono» necesita un valor propio: una opción con value="" en un
 * desplegable del admin devuelve su texto, y eso acabaría guardado como si
 * fuera el nombre de un icono. Se traduce al leer y al escribir. */
const SIN_ICONO = '__sin';

function sinCentinela(valor) {
  return valor === SIN_ICONO ? '' : valor;
}

function colorPlano(valor, porDefecto) {
  return partirAlfa(valor, { color: porDefecto, opacidad: 100 }).color;
}

async function pintarEtiquetas() {
  /* Se captura ANTES de cargar nada: si se cambia de pantalla mientras esto
   * espera a Shopify, lo que llegue tarde no debe pintar ni avisar. */
  const miPintado = pintado;
  const pase = { vivo: true };
  pasesVivos.add(pase);
  pantalla.innerHTML = '<p class="cargando">Cargando insignias…</p>';

  const [colecciones, etiquetasTienda, revision, campos, config, camposConfig] = await Promise.all([
    cargarColecciones(), cargarEtiquetasDeTienda(), revisarEstructura(), camposDeEtiqueta(),
    leerConfig(), camposDeConfig(),
  ]);
  const faltaLoNuestro = revision.pendientes.some((p) => p.includes('insignias'));
  /* La sección del descuento solo se ofrece cuando la tienda ya tiene sus
   * campos: antes, guardar fallaría. Si faltan, lo dice el aviso de arriba. */
  const hayDescuento = camposConfig.has('desc_activo');
  const hayTamanos = camposConfig.has('desc_precio_letra') && camposConfig.has('desc_letra');
  const hayPrecios = ['precio_colores', 'precio_oferta', 'precio_tachado'].every((k) => camposConfig.has(k));
  const hayCompu = camposConfig.has('desc_foto_compu');
  const descuento = config.descuento ?? DESCUENTO_POR_DEFECTO;
  const tienda = new URLSearchParams(location.search).get('shop') || '';
  /* Los campos de borde y opacidad son nuevos: hasta que la tienda los tenga,
   * ofrecerlos solo serviría para que guardar fallara. */
  const hayEstilo = campos.has('opacidad');
  const { lista: etiquetas, error } = await cargarOVacio(cargarEtiquetas, !faltaLoNuestro);

  const muestras = () => etiquetas.filter((e) => e.activo).map(etiquetaHtml).join('')
    || '<p class="sv-guia__vacio">Ninguna insignia activa.</p>';

  if (miPintado !== pintado) return;

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(revision.pendientes)}
      ${error ? `<s-banner slot="supplemental-start" tone="critical" heading="No se pudieron cargar las insignias">${escapar(error)}</s-banner>` : ''}
      <s-banner slot="supplemental-start" tone="info" data-aviso-recalculo hidden></s-banner>

      <div class="titular">
        <h1>Insignias</h1>
        <p class="subtitulo">Los rótulos que van sobre la foto: «Más vendido», «Novedad». Cada uno elige a qué productos alcanza, sueltos o por colección entera.</p>
      </div>

      <s-section heading="Así se ven" subheading="En la colección van arriba a la izquierda, debajo de la etiqueta del tema; en la ficha, arriba a la derecha.">
        <div class="previa__tags" id="previa-etiquetas">${muestras()}</div>
      </s-section>

      ${hayDescuento ? `
      <s-section id="descuento" heading="Descuento" subheading="El porcentaje de rebaja de cada producto, a secas, en lugar del «AHORRA 14%» del tema. No se escribe a mano: sale del precio tachado de cada producto, y cambia solo al elegir otra talla.">
        <div class="desc-previa">
          <div class="desc-previa__foto">
            <span class="sv-tag sv-tag--desc" id="d-previa-tag"></span>
          </div>
          <div class="desc-previa__precio">
            <s>$40.990</s> <strong>$33.990</strong>
            <span class="sv-desc-precio" id="d-previa-precio"></span>
          </div>
        </div>

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-select label="Estado" id="d-modo">
            <s-option value="no">Apagado: se ve el del tema</s-option>
            <s-option value="prueba">Vista previa: solo con el enlace</s-option>
            <s-option value="si">Activo en la tienda</s-option>
          </s-select>
          <s-select label="Cómo se escribe" id="d-formato">
            ${FORMATOS_DESCUENTO.map((f) => `<s-option value="${f.valor}">${escapar(f.rotulo)}</s-option>`).join('')}
          </s-select>
          <s-color-field label="Fondo" id="d-fondo" value="${escapar(descuento.fondo)}"></s-color-field>
          <s-color-field label="Texto" id="d-texto" value="${escapar(descuento.texto)}"></s-color-field>
          <s-number-field label="Redondeo" id="d-radio" value="${descuento.radio}" min="0" max="12" step="1" details="En la foto y la tarjeta. Junto al precio lleva el de las píldoras de las fotos (Beneficios)."></s-number-field>
          ${hayTamanos ? `
          <s-number-field label="Precio en la ficha" id="d-precio-letra" value="${descuento.precioLetra}" min="0" max="28" step="1" details="En píxeles. El del tema es 20; más chico, el porcentaje se lee mejor. 0 = el del tema."></s-number-field>
          <s-number-field label="Porcentaje junto al precio" id="d-letra" value="${descuento.letra}" min="10" max="20" step="1" details="En píxeles."></s-number-field>` : ''}
          ${hayPrecios ? `
          <s-color-field label="Precio de oferta" id="d-oferta" value="${escapar(descuento.oferta)}"></s-color-field>
          <s-color-field label="Precio tachado (antes)" id="d-tachado" value="${escapar(descuento.tachado)}"></s-color-field>` : ''}
        </s-grid>

        <div class="casilla-polaris">
          <s-checkbox label="En las tarjetas de las colecciones" id="d-tarjetas" ${descuento.tarjetas ? 'checked' : ''}></s-checkbox>
          <s-checkbox label="Sobre las fotos de la ficha" id="d-foto" ${descuento.foto ? 'checked' : ''}></s-checkbox>
          ${hayCompu ? `<s-checkbox label="En el computador, solo en la segunda foto (en el teléfono, en todas)" id="d-foto-segunda" ${descuento.fotoCompu === 'segunda' ? 'checked' : ''}></s-checkbox>` : ''}
          <s-checkbox label="Junto al precio en la ficha" id="d-precio" ${descuento.precio ? 'checked' : ''}></s-checkbox>
          ${hayPrecios ? `<s-checkbox label="Precios con estos colores (tarjetas y ficha); sin marcar, los del tema" id="d-precio-colores" ${descuento.precioColores ? 'checked' : ''}></s-checkbox>` : ''}
        </div>

        <p class="ayuda" id="d-cuantos">Contando los productos con precio tachado…</p>
        <p class="ayuda" id="d-enlace" hidden>Para verlo antes de encenderlo: <a target="_blank" rel="noopener" href="https://${escapar(tienda)}/collections/all?sv-vista=1">abre la tienda con este enlace</a>. Solo lo ve quien entra por ahí.</p>

        <s-button slot="primary-action" variant="primary" id="guardar-descuento">Guardar</s-button>
      </s-section>` : ''}

      ${etiquetas.length ? '' : `
        <s-section>
          <s-paragraph>Todavía no hay ninguna insignia. Crea la primera aquí abajo: ponle el texto, elige los colores y dile a qué productos alcanza.</s-paragraph>
        </s-section>`}

      ${etiquetas.map((e, i) => `
        <s-section data-id="${escapar(e.id)}" heading="${escapar(e.nombre || 'Sin texto')}">
          <div class="cabecera-fila">
            <span class="sv-tag" data-previa style="${escapar(estiloEtiqueta(e))}">${escapar(e.nombre || 'Sin texto')}</span>
            <s-stack direction="inline" gap="small-300">
              <s-button variant="tertiary" accessibilityLabel="Subir" data-mover="arriba" ${i === 0 ? 'disabled' : ''}>↑</s-button>
              <s-button variant="tertiary" accessibilityLabel="Bajar" data-mover="abajo" ${i === etiquetas.length - 1 ? 'disabled' : ''}>↓</s-button>
            </s-stack>
          </div>

          <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
            <s-text-field label="Texto en español" data-campo="nombre" value="${escapar(e.nombre)}"></s-text-field>
            <s-text-field label="Texto en inglés" data-campo="nombre_en" value="${escapar(e.nombreEn)}" placeholder="Vacío: se usa el español"></s-text-field>
            <s-color-field label="Fondo" data-campo="fondo" ${hayEstilo ? 'alpha' : ''} value="${escapar(hayEstilo ? conAlfaHex(e.fondo, e.opacidad) : e.fondo)}"${hayEstilo ? ' details="La transparencia va dentro del propio color."' : ''}></s-color-field>
            <s-color-field label="Texto" data-campo="texto" value="${escapar(e.texto)}"></s-color-field>
            ${hayEstilo ? `
            <s-color-field label="Borde" data-campo="borde" value="${escapar(e.borde)}"></s-color-field>
            <s-number-field label="Grosor del borde" data-campo="grosor" value="${e.grosor}" min="0" max="6" step="1" details="0 = sin borde. Con poca opacidad, conviene subirlo."></s-number-field>` : ''}
          </s-grid>

          <div class="casilla-polaris">
            <s-checkbox label="Activa en la tienda" data-campo="activo" ${e.activo ? 'checked' : ''}></s-checkbox>
          </div>

          ${asignacionHtml(e)}

          <s-button slot="primary-action" variant="primary" data-guardar>Guardar</s-button>
          <s-button slot="secondary-actions" tone="critical" data-borrar>Eliminar</s-button>
        </s-section>`).join('')}

      <s-section heading="Añadir una insignia" subheading="Se crea vacía: no aparece en ningún producto hasta que le digas a cuáles alcanza.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-text-field label="Texto en español" id="nueva-etiqueta-nombre" placeholder="p. ej. Más vendido"></s-text-field>
          <s-text-field label="Texto en inglés" id="nueva-etiqueta-nombre-en" placeholder="p. ej. Best seller"></s-text-field>
          <s-color-field label="Fondo" id="nueva-etiqueta-fondo" value="${FONDO_POR_DEFECTO}"></s-color-field>
          <s-color-field label="Texto" id="nueva-etiqueta-texto" value="${TEXTO_POR_DEFECTO}"></s-color-field>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="anadir-etiqueta">Añadir insignia</s-button>
      </s-section>
    </s-page>
  `;

  const refrescarMuestras = () => {
    document.getElementById('previa-etiquetas').innerHTML = muestras();
  };

  if (hayDescuento) conectarDescuento(descuento, miPintado, camposConfig);

  const conexiones = new Map();

  pantalla.querySelectorAll('s-section[data-id]').forEach((tarjeta) => {
    const id = tarjeta.dataset.id;
    const original = etiquetas.find((e) => e.id === id);
    const estado = {
      etiquetas: [...original.etiquetas],
      productos: [...original.productos],
      colecciones: [...original.colecciones],
      sucio: false,
    };
    const conex = conectarAsignacion(
      tarjeta, estado, colecciones, etiquetasTienda, alcanceEtiqueta(original),
    );
    conexiones.set(id, conex);

    const campo = (nombre) => tarjeta.querySelector(`[data-campo="${nombre}"]`);
    const valor = (nombre) => String(campo(nombre)?.value ?? '').trim();
    const muestra = tarjeta.querySelector('[data-previa]');

    /* La muestra se repinta mientras se escribe. Elegir un fondo y no ver cómo
     * queda hasta guardar es elegir a ciegas. */
    const comoEsta = () => {
      const fondo = hayEstilo
        ? partirAlfa(valor('fondo'), { color: original.fondo, opacidad: original.opacidad })
        : { color: colorPlano(valor('fondo'), original.fondo), opacidad: original.opacidad };
      return {
        nombre: valor('nombre'),
        fondo: fondo.color,
        opacidad: fondo.opacidad,
        texto: colorPlano(valor('texto'), original.texto),
        borde: hayEstilo ? colorPlano(valor('borde'), original.borde) : original.borde,
        /* Un campo numérico devuelve texto, y vacío devuelve cadena vacía. */
        grosor: hayEstilo ? Number(valor('grosor') || 0) : original.grosor,
      };
    };

    const refrescar = () => {
      const v = comoEsta();
      muestra.textContent = v.nombre || 'Sin texto';
      muestra.style.cssText = estiloEtiqueta(v);
      /* El titulo de la tarjeta es el texto de la insignia: si no se mueve con
       * lo que se escribe, la tarjeta dice una cosa y la muestra otra. */
      tarjeta.heading = v.nombre || 'Sin texto';
    };
    /* Un solo oyente por tarjeta: los eventos de los componentes suben hasta
     * aquí, así que no hace falta engancharse campo por campo. */
    tarjeta.addEventListener('input', (e) => {
      if (e.target.closest('[data-campo]')) refrescar();
    });

    /* Al confirmar el fondo, el campo se reescribe con la opacidad dentro: si
     * alguien pega «#ff0000», lo que ve pasa a ser «#ff0000…» con su alfa, que
     * es exactamente lo que se va a guardar. Sin esto, lo que se lee en el
     * campo y lo que se guarda dicen cosas distintas. */
    tarjeta.addEventListener('change', (e) => {
      if (!hayEstilo || !e.target.closest) return;
      const suyo = e.target.closest('[data-campo="fondo"]');
      if (!suyo) return;
      const v = comoEsta();
      suyo.value = conAlfaHex(v.fondo, v.opacidad);
    });

    tarjeta.querySelector('[data-guardar]').addEventListener('click', async (e) => {
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        const v = comoEsta();
        const datos = {
          nombre: v.nombre,
          nombreEn: valor('nombre_en'),
          fondo: v.fondo,
          texto: v.texto,
          ...(hayEstilo ? { borde: v.borde, grosor: v.grosor, opacidad: v.opacidad } : {}),
          activo: campo('activo').checked,
          etiquetas: estado.etiquetas,
          productos: estado.productos,
          colecciones: estado.colecciones,
        };
        /* El recálculo en segundo plano escribiría los handles de antes
         * encima de estos. */
        pase.vivo = false;
        await guardarEtiqueta(id, datos);
        await sincronizarEtiqueta(Object.assign(original, datos));
        estado.sucio = false;
        /* sincronizar acaba de recalcular los handles de esta entrada, así que
         * el «alcanza a N» ya se puede poner al día de verdad. */
        conex.alcanceAhora(alcanceEtiqueta(original));
        refrescarMuestras();
        avisar('Insignia guardada');
      } catch (error2) {
        avisar(error2.message, true);
      } finally {
        boton.loading = false;
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        pase.vivo = false;
        boton.loading = true;
        try {
          await moverEntrada(etiquetas, id, boton.dataset.mover, guardarEtiqueta);
          await ir('etiquetas');
        } catch (error2) {
          avisar(error2.message, true);
          boton.loading = false;
        }
      });
    });

    tarjeta.querySelector('[data-borrar]').addEventListener('click', async (e) => {
      if (!confirm(`¿Eliminar la insignia «${original.nombre}»?`)) return;
      pase.vivo = false;
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        await borrarEtiqueta(id);
        avisar('Insignia eliminada');
        await ir('etiquetas');
      } catch (error2) {
        avisar(error2.message, true);
        boton.loading = false;
      }
    });
  });

  document.getElementById('anadir-etiqueta')?.addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const nombre = String(document.getElementById('nueva-etiqueta-nombre').value ?? '').trim();
    if (!nombre) { avisar('Escribe el texto de la insignia.', true); return; }
    boton.loading = true;
    try {
      await crearEtiqueta({
        nombre,
        nombreEn: String(document.getElementById('nueva-etiqueta-nombre-en').value ?? '').trim(),
        fondo: colorPlano(document.getElementById('nueva-etiqueta-fondo').value, FONDO_POR_DEFECTO),
        texto: colorPlano(document.getElementById('nueva-etiqueta-texto').value, TEXTO_POR_DEFECTO),
        orden: etiquetas.length + 1,
      }, etiquetas.length);
      avisar('Insignia creada');
      await ir('etiquetas');
    } catch (error2) {
      avisar(error2.message, true);
      boton.loading = false;
    }
  });

  /* El recálculo va DESPUÉS de pintar. Antes iba antes, y la persona miraba
   * «Cargando…» durante todas las consultas aunque lo que se dibuja ya
   * estuviera en memoria. Ahora la pantalla aparece y los números se ponen al
   * día solos cuando llegan. */
  recalcular(etiquetas, sincronizarEtiqueta, pase).then((cambiadas) => {
    if (miPintado !== pintado || !pase.vivo) return;
    etiquetas.forEach((item) => conexiones.get(item.id)?.alcanceAhora(alcanceEtiqueta(item)));
    const aviso = pantalla.querySelector('[data-aviso-recalculo]');
    if (aviso && cambiadas) {
      aviso.textContent = `Se actualizaron ${cambiadas} al abrir, porque sus etiquetas o colecciones habían cambiado.`;
      aviso.hidden = false;
    }
  }).catch((error2) => {
    if (miPintado === pintado) avisar(`No se pudo recalcular: ${error2.message}`, true);
  });

  conectarPendientes(() => ir('etiquetas'));
}

/* La sección «Cambio de página» de Apariencia. La previa repite la barra en
 * bucle con el color y el grosor elegidos. */
function conectarTransicion(trans) {
  const el = (id) => document.getElementById(id);
  el('t-modo').value = trans.modo;

  const comoQueda = () => {
    const n = (id, defecto) => {
      const v = String(el(id).value ?? '').trim();
      return v === '' ? defecto : Number(v);
    };
    return {
      modo: el('t-modo').value || 'no',
      color: colorPlano(el('t-color').value, trans.color),
      grosor: Math.max(1, Math.min(6, n('t-grosor', trans.grosor))),
      fundido: Math.max(0, Math.min(800, n('t-fundido', trans.fundido))),
      precarga: el('t-precarga').checked,
    };
  };

  const refrescar = () => {
    const v = comoQueda();
    const barra = el('trans-barra');
    barra.style.background = v.color;
    barra.style.height = `${v.grosor}px`;
    el('trans-previa').style.setProperty('--fundido', `${v.fundido}ms`);
    el('t-enlace').hidden = v.modo !== 'prueba';
  };
  const caja = el('transicion');
  caja.addEventListener('input', refrescar);
  caja.addEventListener('change', refrescar);
  refrescar();

  el('guardar-transicion').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const v = comoQueda();
      await guardarTransicion(v);
      Object.assign(trans, v);
      avisar(v.modo === 'si' ? 'Cambio de página guardado y activo en la tienda'
        : v.modo === 'prueba' ? 'Cambio de página guardado en vista previa' : 'Cambio de página guardado (apagado)');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });
}

/* La sección «Inicio: colecciones» de Apariencia. */
function conectarInicio(inicio) {
  const el = (id) => document.getElementById(id);
  el('i-modo').value = inicio.modo;
  const refrescar = () => { el('i-enlace').hidden = el('i-modo').value !== 'prueba'; };
  el('i-modo').addEventListener('change', refrescar);
  refrescar();
  el('i-fotos').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    const base = new URL('fotos-inicio/', location.href.split('?')[0]).href;
    const hechas = [];
    try {
      /* ?v= para que Shopify no se lleve una copia vieja guardada en GitHub Pages. */
      const v = Date.now();
      for (const n of ['cadenas', 'pulseras', 'colgantes', 'anillos']) {
        const r = await traerArchivo(`${base}sv-inicio-${n}.jpg?v=${v}`);
        hechas.push(decodeURIComponent((r.url || '').split('/').pop().split('?')[0]));
      }
      /* Las fotos en uso de las tarjetas del menú del teléfono (sv-menu-<colección>.jpg). */
      for (const n of ['cadenas', 'pulseras', 'anillos', 'colgantes', 'conjuntos', 'best-sellers', 'essentials']) {
        await traerArchivo(`${base}sv-menu-${n}.jpg?v=${v}`);
      }
      hechas.push('fotos del menú');
      /* Versiones para el teléfono de los banners de colección donde la joya
       * quedaba bajo el título (alargadas hacia abajo, 9-nov). */
      for (const n of ['pulsera', 'colgantes', 'conjuntos']) {
        await traerArchivo(`${base}sv-portada-movil-${n}.jpg?v=${v}`);
      }
      hechas.push('banners del teléfono');
      /* Fotos que eligió el usuario (9-nov): «Tu cadena de cada día» del inicio y
       * el banner de Best Sellers fuera de Navidad, cada una con su versión para
       * el teléfono (ampliada hacia abajo para que el texto no tape la cadena). */
      for (const n of ['sv-inicio-cadena-dia', 'sv-inicio-cadena-dia-movil', 'sv-portada-bestsellers', 'sv-portada-bestsellers-movil']) {
        await traerArchivo(`${base}${n}.jpg?v=${v}`);
      }
      hechas.push('«Tu cadena de cada día» y banner de Best Sellers');
      avisar(`Fotos en Archivos: ${hechas.join(', ')}`);
    } catch (error2) {
      avisar(`${hechas.length ? `Se copiaron ${hechas.join(', ')}. ` : ''}${error2.message}`, true);
    } finally {
      boton.loading = false;
    }
  });
  el('i-navidad').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const base = new URL('fotos-inicio/', location.href.split('?')[0]).href;
      const hechas = await prepararNavidad(copiarArchivo, reemplazarArchivo, traerArchivo, base);
      avisar(`Fotos de Navidad listas en: ${hechas.join(', ')}. Se ven al poner la temporada en Navidad.`);
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });
  el('guardar-inicio').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const v = { modo: el('i-modo').value || 'prueba' };
      await guardarInicio(v);
      Object.assign(inicio, v);
      avisar(v.modo === 'si' ? 'Fondo negro activo en la tienda'
        : v.modo === 'prueba' ? 'Fondo negro en vista previa' : 'Fondo negro apagado');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });
}

/* La sección «Menú del teléfono» de Apariencia. */
function conectarMenu(modo) {
  const el = (id) => document.getElementById(id);
  el('m-modo').value = modo;
  const refrescar = () => { el('m-enlace').hidden = el('m-modo').value !== 'prueba'; };
  el('m-modo').addEventListener('change', refrescar);
  refrescar();
  el('guardar-menu').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const v = el('m-modo').value || 'prueba';
      await guardarMenu(v);
      avisar(v === 'si' ? 'Menú guardado y activo en la tienda'
        : v === 'prueba' ? 'Menú guardado en vista previa' : 'Menú guardado (apagado)');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });
}

/* La sección «Descuento» de la pantalla de insignias. */
function conectarDescuento(descuento, miPintado, camposConfig) {
  const caja = document.getElementById('descuento');
  const el = (id) => document.getElementById(id);

  /* Los desplegables no hacen caso al `selected` del marcado: por propiedad. */
  el('d-modo').value = descuento.modo;
  el('d-formato').value = descuento.formato;

  const comoQueda = () => {
    const radio = String(el('d-radio').value ?? '').trim();
    const px = (id, defecto) => {
      const v = el(id) ? String(el(id).value ?? '').trim() : '';
      return v === '' ? defecto : Number(v);
    };
    return {
      modo: el('d-modo').value || 'no',
      formato: el('d-formato').value || 'pct',
      fondo: colorPlano(el('d-fondo').value, descuento.fondo),
      texto: colorPlano(el('d-texto').value, descuento.texto),
      radio: radio === '' ? descuento.radio : Number(radio),
      tarjetas: el('d-tarjetas').checked,
      foto: el('d-foto').checked,
      precio: el('d-precio').checked,
      precioLetra: Math.max(0, Math.min(28, px('d-precio-letra', descuento.precioLetra))),
      letra: Math.max(10, Math.min(20, px('d-letra', descuento.letra))),
      precioColores: el('d-precio-colores') ? el('d-precio-colores').checked : descuento.precioColores,
      oferta: el('d-oferta') ? colorPlano(el('d-oferta').value, descuento.oferta) : descuento.oferta,
      tachado: el('d-tachado') ? colorPlano(el('d-tachado').value, descuento.tachado) : descuento.tachado,
      fotoCompu: el('d-foto-segunda') ? (el('d-foto-segunda').checked ? 'segunda' : 'todas') : descuento.fotoCompu,
    };
  };

  const refrescar = () => {
    const v = comoQueda();
    const tag = el('d-previa-tag');
    tag.textContent = textoDescuento(20, v.formato);
    tag.style.cssText = `background:${v.fondo};color:${v.texto};border-radius:${v.radio}px`;
    const pill = el('d-previa-precio');
    pill.textContent = textoDescuento(17, v.formato);
    pill.style.cssText = `background:${v.fondo};color:${v.texto};font-size:${v.letra}px`;
    el('d-previa-precio').parentElement.style.fontSize = v.precioLetra ? `${v.precioLetra}px` : '20px';
    const caja2 = el('d-previa-precio').parentElement;
    caja2.querySelector('s').style.color = v.precioColores ? v.tachado : '';
    caja2.querySelector('strong').style.color = v.precioColores ? v.oferta : '';
    el('d-enlace').hidden = v.modo !== 'prueba';
  };
  caja.addEventListener('input', refrescar);
  caja.addEventListener('change', refrescar);
  refrescar();

  contarConDescuento().then(({ total, con }) => {
    if (miPintado !== pintado) return;
    el('d-cuantos').textContent = `Hoy ${con} de ${total} productos activos tienen precio tachado: esos son los que llevan descuento. Si un producto no tiene precio tachado, no sale nada.`;
  }).catch(() => {
    if (miPintado === pintado) el('d-cuantos').textContent = '';
  });

  el('guardar-descuento').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const v = comoQueda();
      await guardarDescuento(v, camposConfig);
      Object.assign(descuento, v);
      avisar(v.modo === 'si' ? 'Descuento guardado y activo en la tienda'
        : v.modo === 'prueba' ? 'Descuento guardado en vista previa' : 'Descuento guardado (apagado)');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });
}

async function pintarBeneficios() {
  /* Se captura ANTES de cargar nada: si se cambia de pantalla mientras esto
   * espera a Shopify, lo que llegue tarde no debe pintar ni avisar. */
  const miPintado = pintado;
  const pase = { vivo: true };
  pasesVivos.add(pase);
  pantalla.innerHTML = '<p class="cargando">Cargando beneficios…</p>';

  const [colecciones, etiquetasTienda, revision, config, camposConfig, camposBenef] = await Promise.all([
    cargarColecciones(), cargarEtiquetasDeTienda(), revisarEstructura(), leerConfig(),
    camposDeConfig(), camposDeBeneficio(),
  ]);
  const hayPildora = camposConfig.has('foto_activo');
  const haySubida = camposBenef.has('icono_imagen');
  const faltaLoNuestro = revision.pendientes.some((p) => p.includes('beneficios'));
  const pildora = config.pildora ?? PILDORA_POR_DEFECTO;
  const { lista: beneficios, error } = await cargarOVacio(cargarBeneficios, !faltaLoNuestro);

  /* El valor elegido NO va aquí: un desplegable del admin no hace caso al
   * `selected` del marcado inyectado. Se pone por propiedad después de pintar,
   * en `ponerElegidos`.
   *
   * Y «sin icono» no puede valer la cadena vacía: una opción con value=""
   * devuelve su propio texto, así que guardar habría escrito «Sin icono» como
   * nombre de icono. Por eso viaja con un valor centinela que se traduce al
   * leer y al escribir. */
  const opcionesIcono = () => ICONOS.map((i) => `
    <s-option value="${escapar(i.clave)}">${escapar(i.rotulo)}</s-option>
  `).join('');

  const muestras = () => beneficiosHtml(beneficios.filter((b) => b.activo));

  if (miPintado !== pintado) return;

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(revision.pendientes)}
      ${error ? `<s-banner slot="supplemental-start" tone="critical" heading="No se pudieron cargar los beneficios">${escapar(error)}</s-banner>` : ''}
      <s-banner slot="supplemental-start" tone="info" data-aviso-recalculo hidden></s-banner>

      <div class="titular">
        <h1>Beneficios</h1>
        <p class="subtitulo">Las ventajas que salen en la ficha, bajo el botón de compra. No son las mismas para todo: los brillantes no resisten el agua, así que ese beneficio no les alcanza y en su lugar llevan «Joyería fina».</p>
      </div>

      <s-section heading="Así se ven en la ficha" subheading="Aquí salen todos los activos juntos. En una ficha real solo salen los que alcanzan a ese producto, y como mucho los que diga el bloque (3 de fábrica).">
        <div id="previa-beneficios">${muestras()}</div>
      </s-section>

      ${hayPildora ? `
      <s-section id="pildora" heading="Píldoras sobre las fotos" subheading="Así se ven sobre la foto de la ficha, de la segunda en adelante. La primera se deja limpia.">
        <div class="sobre-foto">
          <span class="sv-benef-foto sv-benef-foto--arriba-derecha" id="pildora-previa" style="position:static">
            <svg class="sv-benef__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3.2c3.1 3.4 5.2 6.1 5.2 8.7a5.2 5.2 0 1 1-10.4 0c0-2.6 2.1-5.3 5.2-8.7Z"/>
            </svg>
            <span>Resistente al agua y el sudor</span>
          </span>
        </div>
        <div class="casilla-polaris">
          <s-checkbox label="Sobre las fotos de la ficha" id="p-activo" ${pildora.activo ? 'checked' : ''}></s-checkbox>
        </div>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-select label="Esquina" id="p-esquina">
            <s-option value="arriba-derecha">Arriba a la derecha</s-option>
            <s-option value="abajo-izquierda">Abajo a la izquierda</s-option>
          </s-select>
          <s-number-field label="Cuántas fotos" id="p-cuantas" value="${pildora.cuantas}" min="1" max="5" step="1"></s-number-field>
          <s-color-field label="Fondo" id="p-fondo" alpha value="${escapar(conAlfaHex(pildora.fondo, pildora.opacidad))}" details="La transparencia va dentro del propio color."></s-color-field>
          <s-color-field label="Texto e icono" id="p-texto" value="${escapar(pildora.texto)}"></s-color-field>
          <s-color-field label="Borde" id="p-borde" value="${escapar(pildora.borde)}"></s-color-field>
          <s-number-field label="Grosor del borde" id="p-grosor" value="${pildora.grosor}" min="0" max="6" step="1" details="0 = sin borde."></s-number-field>
          <s-number-field label="Redondeo" id="p-radio" value="${pildora.radio}" min="0" max="20" step="1"></s-number-field>
          <s-number-field label="Tamaño del texto" id="p-letra" value="${pildora.letra}" min="9" max="16" step="1"></s-number-field>
          <s-number-field label="Separación del borde" id="p-margen" value="${pildora.margen}" min="0" max="24" step="2"></s-number-field>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="guardar-pildora">Guardar</s-button>
      </s-section>` : ''}

      ${beneficios.length ? '' : `
        <s-section>
          <s-paragraph>Todavía no hay ningún beneficio. Si acabas de instalar la app, pulsa «Crear lo que falta» y aparecerán los cuatro de siempre listos para asignar.</s-paragraph>
        </s-section>`}

      ${beneficios.map((b, i) => `
        <s-section data-id="${escapar(b.id)}" heading="${escapar(b.nombre || 'Sin texto')}">
          <div class="cabecera-fila">
            <div class="sv-benef sv-benef--pildora sv-benef--fila sv-benef--normal" style="--sv-pt:0px;--sv-pb:0px;">
              <ul class="sv-benef__lista" role="list">
                <li class="sv-benef__item" data-previa>
                  <span data-previa-icono>${iconoHtml(b)}</span>
                  <span class="sv-benef__texto" data-previa-texto>${escapar(b.nombre || 'Sin texto')}</span>
                </li>
              </ul>
            </div>
            <s-stack direction="inline" gap="small-300">
              <s-button variant="tertiary" accessibilityLabel="Subir" data-mover="arriba" ${i === 0 ? 'disabled' : ''}>↑</s-button>
              <s-button variant="tertiary" accessibilityLabel="Bajar" data-mover="abajo" ${i === beneficios.length - 1 ? 'disabled' : ''}>↓</s-button>
            </s-stack>
          </div>

          <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
            <s-text-field label="Texto en español" data-campo="nombre" value="${escapar(b.nombre)}"></s-text-field>
            <s-text-field label="Texto en inglés" data-campo="nombre_en" value="${escapar(b.nombreEn)}" placeholder="Vacío: se usa el español"></s-text-field>
            <s-select label="Icono" data-campo="icono" details="${b.iconoImagenUrl
    ? 'Hay una imagen subida, y la imagen manda sobre este icono.'
    : 'Sigue al color del texto de la píldora.'}">
              <s-option value="${SIN_ICONO}">Sin icono</s-option>
              ${opcionesIcono()}
            </s-select>
            ${haySubida ? `
            <div class="icono-propio">
              <p class="asigna__titulo">Icono propio</p>
              <div class="acciones acciones--envolver">
                <label class="secundario como-boton">
                  Subir…<input type="file" accept="image/png,image/webp,image/svg+xml" data-subir hidden />
                </label>
                ${hayBiblioteca() ? '<button type="button" class="secundario" data-biblioteca>Elegir de la biblioteca</button>' : ''}
                ${b.iconoImagenUrl ? '<button type="button" class="secundario secundario--peligro" data-quitar-imagen>Quitar</button>' : ''}
              </div>
              <p class="ayuda" data-estado-imagen>${b.iconoImagenUrl
    ? 'Las imágenes se muestran con sus propios colores.'
    : 'PNG, WebP o SVG, cuadrado y pequeño (96×96, fondo transparente).'}</p>
            </div>` : ''}
          </s-grid>

          <div class="casilla-polaris">
            <s-checkbox label="Activo en la tienda" data-campo="activo" ${b.activo ? 'checked' : ''}></s-checkbox>
          </div>

          ${asignacionHtml(b)}

          <s-button slot="primary-action" variant="primary" data-guardar>Guardar</s-button>
          <s-button slot="secondary-actions" tone="critical" data-borrar>Eliminar</s-button>
        </s-section>`).join('')}

      <s-section heading="Añadir un beneficio" subheading="Se crea vacío: no aparece en ninguna ficha hasta que le digas a qué productos alcanza.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-text-field label="Texto en español" id="nuevo-beneficio-nombre" placeholder="p. ej. Envío gratis"></s-text-field>
          <s-text-field label="Texto en inglés" id="nuevo-beneficio-nombre-en" placeholder="p. ej. Free shipping"></s-text-field>
          <s-select label="Icono" id="nuevo-beneficio-icono">
            <s-option value="${SIN_ICONO}">Sin icono</s-option>
            ${opcionesIcono()}
          </s-select>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="anadir-beneficio">Añadir beneficio</s-button>
      </s-section>
    </s-page>
  `;

  /* Lo elegido en cada desplegable se pone por propiedad, no en el marcado: un
   * `selected` dentro de un innerHTML no lo respeta el componente, y el campo
   * se quedaba siempre en la primera opción. Pasó con el icono y con la
   * esquina, y es silencioso: guardar escribía lo que no era. */
  function ponerElegidos() {
    if (hayPildora) {
      const esq = document.getElementById('p-esquina');
      if (esq) esq.value = pildora.esquina;
    }
    pantalla.querySelectorAll('s-section[data-id]').forEach((tarjeta) => {
      const b = beneficios.find((x) => x.id === tarjeta.dataset.id);
      const sel = tarjeta.querySelector('[data-campo="icono"]');
      if (b && sel) sel.value = b.icono || SIN_ICONO;
    });
    const nuevo2 = document.getElementById('nuevo-beneficio-icono');
    if (nuevo2) nuevo2.value = SIN_ICONO;
  }
  ponerElegidos();

  const refrescarMuestras = () => {
    document.getElementById('previa-beneficios').innerHTML = muestras();
  };

  /* Los ajustes de la píldora se ven en la muestra mientras se tocan, y sobre
   * un fondo con damero: una píldora blanca al 50 % sobre el gris del panel se
   * ve casi igual que al 100 %, y en la tienda va sobre una foto. */
  const comoQuedaLaPildora = () => {
    const n = (id, defecto) => {
      const v = String(document.getElementById(id)?.value ?? '').trim();
      return v === '' ? defecto : Number(v);
    };
    /* Igual que en las insignias: el campo de color lleva la transparencia
     * dentro, y la tienda la guarda aparte. Sin pareja de alfa no se toca. */
    const fondo = partirAlfa(document.getElementById('p-fondo').value,
      { color: pildora.fondo, opacidad: pildora.opacidad });
    return {
      activo: document.getElementById('p-activo').checked,
      esquina: document.getElementById('p-esquina').value,
      cuantas: n('p-cuantas', 3),
      fondo: fondo.color,
      texto: colorPlano(document.getElementById('p-texto').value, pildora.texto),
      borde: colorPlano(document.getElementById('p-borde').value, pildora.borde),
      grosor: n('p-grosor', 0),
      opacidad: fondo.opacidad,
      radio: n('p-radio', 7),
      letra: n('p-letra', 12),
      margen: n('p-margen', 10),
    };
  };

  const refrescarPildora = () => {
    const v = comoQuedaLaPildora();
    const m = document.getElementById('pildora-previa');
    m.style.cssText = [
      'position:static',
      `--sv-foto-fondo:${conAlfa(v.fondo, v.opacidad)}`,
      `--sv-foto-texto:${v.texto}`,
      `--sv-foto-borde:${v.borde}`,
      `--sv-foto-grosor:${v.grosor}px`,
      `--sv-foto-radio:${v.radio}px`,
      `--sv-foto-letra:${v.letra}px`,
    ].join(';');
  };

  if (hayPildora) {
    /* Un solo oyente: los eventos de los componentes suben hasta la sección, y
     * en el DOM ya no hay `input` ni `select` a los que engancharse. */
    const caja = document.getElementById('pildora');
    caja.addEventListener('input', refrescarPildora);
    caja.addEventListener('change', (e) => {
      refrescarPildora();
      /* Lo que se lee en el campo tiene que ser lo que se guarda. */
      if (e.target.id === 'p-fondo') {
        const v = comoQuedaLaPildora();
        e.target.value = conAlfaHex(v.fondo, v.opacidad);
      }
    });
    refrescarPildora();
  }

  document.getElementById('guardar-pildora')?.addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      await guardarPildora(comoQuedaLaPildora());
      avisar('Aspecto de las píldoras guardado');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });

  const conexiones = new Map();

  pantalla.querySelectorAll('s-section[data-id]').forEach((tarjeta) => {
    const id = tarjeta.dataset.id;
    const original = beneficios.find((b) => b.id === id);
    const estado = {
      etiquetas: [...original.etiquetas],
      productos: [...original.productos],
      colecciones: [...original.colecciones],
      sucio: false,
    };
    const conex = conectarAsignacion(
      tarjeta, estado, colecciones, etiquetasTienda, alcanceBeneficio(original),
    );
    conexiones.set(id, conex);

    const valor = (campo) => sinCentinela(
      String(tarjeta.querySelector(`[data-campo="${campo}"]`)?.value ?? '').trim(),
    );

    const refrescar = () => {
      tarjeta.querySelector('[data-previa-texto]').textContent = valor('nombre') || 'Sin texto';
      tarjeta.heading = valor('nombre') || 'Sin texto';
      /* Si hay imagen subida manda ella, igual que en la tienda: cambiar el
       * desplegable no debe dejar la muestra sin icono. */
      tarjeta.querySelector('[data-previa-icono]').innerHTML = original.iconoImagenUrl
        ? iconoHtml(original)
        : svgIcono(valor('icono'), 'sv-benef__icono');
    };
    tarjeta.querySelector('[data-campo="nombre"]').addEventListener('input', refrescar);
    tarjeta.querySelector('[data-campo="icono"]').addEventListener('change', refrescar);

    tarjeta.querySelector('[data-guardar]').addEventListener('click', async (e) => {
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        const datos = {
          nombre: valor('nombre'),
          nombreEn: valor('nombre_en'),
          icono: valor('icono'),
          activo: tarjeta.querySelector('[data-campo="activo"]').checked,
          etiquetas: estado.etiquetas,
          productos: estado.productos,
          colecciones: estado.colecciones,
        };
        pase.vivo = false;
        await guardarBeneficio(id, datos);
        await sincronizarBeneficio(Object.assign(original, datos));
        estado.sucio = false;
        conex.alcanceAhora(alcanceBeneficio(original));
        refrescarMuestras();
        avisar('Beneficio guardado');
      } catch (error2) {
        avisar(error2.message, true);
      } finally {
        boton.loading = false;
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        pase.vivo = false;
        boton.loading = true;
        try {
          await moverEntrada(beneficios, id, boton.dataset.mover, guardarBeneficio);
          await ir('beneficios');
        } catch (error2) {
          avisar(error2.message, true);
          boton.loading = false;
        }
      });
    });

    const estadoImagen = tarjeta.querySelector('[data-estado-imagen]');
    const decir = (t) => { if (estadoImagen) estadoImagen.textContent = t; };

    async function aplicarIcono(promesa) {
      try {
        const archivo = await promesa;
        if (!archivo) { decir('Cancelado.'); return; }
        await guardarIconoImagen(id, archivo.id);
        avisar('Icono guardado');
        await ir('beneficios');
      } catch (error2) {
        decir('');
        avisar(error2.message, true);
      }
    }

    tarjeta.querySelector('[data-subir]')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      /* Se limpia enseguida: si no, reintentar con el MISMO archivo no dispara
       * el evento y el botón parece muerto, justo después de un error. */
      e.target.value = '';
      if (!file) return;
      aplicarIcono(subirArchivo(file, { onPaso: decir }));
    });

    tarjeta.querySelector('[data-biblioteca]')?.addEventListener('click', () => {
      decir('Abriendo la biblioteca…');
      aplicarIcono(elegirDeBiblioteca({ tipo: ['MediaImage', 'GenericFile'] }));
    });

    tarjeta.querySelector('[data-quitar-imagen]')?.addEventListener('click', async () => {
      try {
        await guardarIconoImagen(id, '');
        avisar('Icono quitado');
        await ir('beneficios');
      } catch (error2) {
        avisar(error2.message, true);
      }
    });

    tarjeta.querySelector('[data-borrar]').addEventListener('click', async (e) => {
      if (!confirm(`¿Eliminar el beneficio «${original.nombre}»?`)) return;
      pase.vivo = false;
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        await borrarBeneficio(id);
        avisar('Beneficio eliminado');
        await ir('beneficios');
      } catch (error2) {
        avisar(error2.message, true);
        boton.loading = false;
      }
    });
  });

  document.getElementById('anadir-beneficio')?.addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const texto = (id) => String(document.getElementById(id).value ?? '').trim();
    const nombre = texto('nuevo-beneficio-nombre');
    if (!nombre) { avisar('Escribe el texto del beneficio.', true); return; }
    boton.loading = true;
    try {
      await crearBeneficio({
        nombre,
        nombreEn: texto('nuevo-beneficio-nombre-en'),
        icono: sinCentinela(document.getElementById('nuevo-beneficio-icono').value),
        orden: beneficios.length + 1,
      }, beneficios.length);
      avisar('Beneficio creado');
      await ir('beneficios');
    } catch (error2) {
      avisar(error2.message, true);
      boton.loading = false;
    }
  });

  /* El recálculo va DESPUÉS de pintar. Antes iba antes, y la persona miraba
   * «Cargando…» durante todas las consultas aunque lo que se dibuja ya
   * estuviera en memoria. Ahora la pantalla aparece y los números se ponen al
   * día solos cuando llegan. */
  recalcular(beneficios, sincronizarBeneficio, pase).then((cambiadas) => {
    if (miPintado !== pintado || !pase.vivo) return;
    beneficios.forEach((item) => conexiones.get(item.id)?.alcanceAhora(alcanceBeneficio(item)));
    const aviso = pantalla.querySelector('[data-aviso-recalculo]');
    if (aviso && cambiadas) {
      aviso.textContent = `Se actualizaron ${cambiadas} al abrir, porque sus etiquetas o colecciones habían cambiado.`;
      aviso.hidden = false;
    }
  }).catch((error2) => {
    if (miPintado === pintado) avisar(`No se pudo recalcular: ${error2.message}`, true);
  });

  conectarPendientes(() => ir('beneficios'));
}

/* ---------------------------------------------------------------------------
 * Filtros: los botones de la página y qué es cada producto
 * ------------------------------------------------------------------------- */

const NOMBRE_FILTRO = { color: 'Color', categoria: 'Categoría', tipo: 'Tipo' };
let estadoFiltros = { texto: '', ver: 'todos', simular: '' };

/* Lo que dibuja un botón en la tienda, para la previa: la muestra del color o
 * el icono, y el texto. */
function iconoBotonHtml(icono, colores) {
  const ic = String(icono ?? '').trim();
  if (ic.startsWith('color:')) {
    const etq = ic.slice(6).trim().toLowerCase();
    const c = colores.find((x) => x.etiqueta.trim().toLowerCase() === etq);
    if (!c) return '';
    const fondo = c.imagen ? `background-image:url('${escapar(c.imagen)}')` : (c.muestra ? `background-color:${escapar(c.muestra)}` : '');
    return `<span class="sv-filtro__muestra" style="${fondo}"></span>`;
  }
  return svgIcono(ic, 'sv-filtro__icono');
}

function previaFiltrosHtml(botones, colores, columnas, coleccionId) {
  const salen = botones.filter((b) => b.activo && (b.donde === 'todas'
    || b.colecciones.some((c) => c.id === coleccionId)));
  if (!salen.length) return '<p class="sv-guia__vacio">En esta colección no sale ningún botón.</p>';
  const filas = [1, 2, 3].map((n) => salen.filter((b) => b.fila === n)).filter((f) => f.length);
  return `<div class="sv-filtros"><div class="sv-filtros__dentro">${filas.map((fila) => {
    const cols = Math.min(fila.length, columnas);
    return `<div class="sv-filtros__fila${cols >= 4 ? ' sv-filtros__fila--apilada' : ''}" style="--cols:${cols}">${
      fila.map((b, i) => `<span class="sv-filtro${i === 0 && fila === filas[0] ? ' is-activo' : ''}">${iconoBotonHtml(b.icono, colores)}<span>${escapar(b.nombre || 'Sin texto')}</span></span>`).join('')
    }</div>`;
  }).join('')}</div></div>`;
}

function opcionesIcono(colores) {
  return [
    '<s-option value="__sin">Sin icono</s-option>',
    ...colores.filter((c) => c.etiqueta.trim()).map((c) => (
      `<s-option value="color:${escapar(c.etiqueta.trim())}">Muestra de color · ${escapar(c.nombre || c.etiqueta)}</s-option>`)),
    ...ICONOS.map((i) => `<s-option value="${escapar(i.clave)}">${escapar(i.rotulo)}</s-option>`),
  ].join('');
}

function valoresDe(f, clave) {
  return { color: f.colores, categoria: f.categorias, tipo: f.tipos }[clave] ?? [];
}

function opcionesValor(f, clave, actual) {
  const lista = [...valoresDe(f, clave)];
  if (actual && !lista.some((v) => v.toLowerCase() === actual.toLowerCase())) lista.push(actual);
  return lista.map((v) => `<s-option value="${escapar(v)}">${escapar(v)}</s-option>`).join('');
}

function coleccionesHtml(colecciones, elegidas) {
  const ids = new Set(elegidas.map((c) => c.id));
  return `<div class="lista-colecciones">${colecciones.map((c) => `
    <label class="lista-colecciones__item"><input type="checkbox" data-coleccion="${escapar(c.id)}" ${ids.has(c.id) ? 'checked' : ''} />
      ${escapar(c.titulo)} <span class="ayuda">${c.cuantos}</span></label>`).join('')}</div>`;
}

/* Una fila de la tabla de productos. Controles nativos y no de Polaris: son
 * cientos, y con componentes la pantalla tardaba en aparecer. */
function filaProductoHtml(p, f) {
  const n = p.nuevo;
  const sel = (clave, valor) => {
    const lista = [...valoresDe(f, clave)];
    if (valor && !lista.includes(valor)) lista.push(valor);
    return `<select data-campo-filtro="${clave}" aria-label="${NOMBRE_FILTRO[clave]} de ${escapar(p.titulo)}">
      <option value="">—</option>
      ${lista.map((v) => `<option value="${escapar(v)}" ${v === valor ? 'selected' : ''}>${escapar(v)}</option>`).join('')}
    </select>`;
  };
  const tipos = [...new Set([...f.tipos, ...n.tipo])];
  return `<tr data-fila="${escapar(p.id)}" class="${filaCambiada(p) ? 'is-cambiada' : ''}">
    <td class="tabla-filtros__foto">${p.imagen ? `<img src="${escapar(p.imagen)}" alt="" loading="lazy" />` : ''}</td>
    <td class="tabla-filtros__titulo">${escapar(p.titulo)}${p.activo ? '' : ' <span class="ayuda">(borrador)</span>'}</td>
    <td>${sel('color', n.color)}</td>
    <td>${sel('categoria', n.categoria)}</td>
    <td><div class="fichas-tipo">${tipos.map((t) => `<button type="button" class="ficha-tipo${n.tipo.includes(t) ? ' is-on' : ''}" data-tipo="${escapar(t)}" aria-pressed="${n.tipo.includes(t)}">${escapar(t)}</button>`).join('')}</div></td>
  </tr>`;
}

function filaCambiada(p) {
  const a = p.nuevo;
  return a.color !== p.color || a.categoria !== p.categoria
    || a.tipo.length !== p.tipo.length || a.tipo.some((t, i) => t !== p.tipo[i]);
}

function sinClasificar(p) {
  return !p.nuevo.color || !p.nuevo.categoria;
}

async function pintarFiltros() {
  const miPintado = pintado;
  const pase = { vivo: true };
  pasesVivos.add(pase);
  pantalla.innerHTML = '<p class="cargando">Cargando filtros…</p>';

  const [revision, config, camposConfig, colores, colecciones] = await Promise.all([
    revisarEstructura(), leerConfig(), camposDeConfig(), cargarColores(), cargarColecciones(),
  ]);
  const hayConfig = camposConfig.has('filtros_activo');
  const hayCajon = camposConfig.has('filtros_cajon');
  const hayPrecio = camposConfig.has('filtros_precio');
  const hayPortada = camposConfig.has('colecciones_portada');
  /* Un campo de configuración que falta (filtros_cajon…) no tapa la pantalla:
   * sale en el aviso de arriba y su control aparece al crearlo. */
  const faltaLoNuestro = revision.pendientes.some((p) => /filtro|metacampo/i.test(p) && !/^Campos de configuración/.test(p));
  const f = config.filtros ?? FILTROS_POR_DEFECTO;
  const [{ lista: botones, error }, { lista: productos, error: errorProductos }] = await Promise.all([
    cargarOVacio(cargarBotones, !faltaLoNuestro),
    cargarOVacio(cargarProductosFiltro, true),
  ]);
  for (const p of productos) p.nuevo = { color: p.color, categoria: p.categoria, tipo: [...p.tipo] };
  if (miPintado !== pintado) return;

  const tienda = new URLSearchParams(location.search).get('shop') || '';
  const handleTienda = tienda.replace('.myshopify.com', '');
  const best = colecciones.find((c) => c.handle === 'best-sellers');
  if (!estadoFiltros.simular) estadoFiltros.simular = best?.id ?? colecciones[0]?.id ?? '';

  pantalla.innerHTML = `
    <s-page>
      ${bannerPendientes(revision.pendientes)}
      ${error ? `<s-banner slot="supplemental-start" tone="critical" heading="No se pudieron cargar los botones">${escapar(error)}</s-banner>` : ''}
      ${errorProductos ? `<s-banner slot="supplemental-start" tone="critical" heading="No se pudieron cargar los productos">${escapar(errorProductos)}</s-banner>` : ''}

      <div class="titular">
        <h1>Filtros</h1>
        <p class="subtitulo">Los botones que salen encima de los productos en las colecciones («Dorado», «Plateado», «Brillantes», «Cadenas»…) y qué es cada producto, que es lo que esos botones y el menú «Filtrar» usan para filtrar.</p>
      </div>

      ${hayConfig ? `
      <s-section id="f-config" heading="Botones en la página" subheading="Cada botón lleva a la misma colección con ese filtro puesto. En el teléfono van en filas fijas, sin deslizar.">
        <div class="previa-filtros">
          <s-select label="Ver cómo queda en" id="f-simular">
            ${colecciones.map((c) => `<s-option value="${escapar(c.id)}">${escapar(c.titulo)}</s-option>`).join('')}
          </s-select>
          <div class="previa-filtros__telefono" id="f-previa">${previaFiltrosHtml(botones, colores, f.columnas, estadoFiltros.simular)}</div>
          <p class="ayuda">En la tienda un botón solo sale si esa colección tiene productos con ese valor. El primero sale marcado para enseñar cómo se ve elegido.</p>
        </div>
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(190px, 1fr))" gap="base">
          <s-select label="Estado" id="f-modo">
            <s-option value="no">Apagado</s-option>
            <s-option value="prueba">Vista previa: solo con el enlace</s-option>
            <s-option value="si">Activo en la tienda</s-option>
          </s-select>
          <s-number-field label="Botones por fila en el teléfono, como mucho" id="f-columnas" value="${f.columnas}" min="2" max="5" step="1" details="Con 4 o más, el icono va encima del texto para que quepan."></s-number-field>
          ${hayCajon ? `
          <s-select label="Menú «Filtrar» en el computador" id="f-cajon" details="En el teléfono siempre es un cajón lateral.">
            <s-option value="no">Columna a la izquierda, dentro de la página</s-option>
            <s-option value="prueba">Cajón lateral: vista previa, solo con el enlace</s-option>
            <s-option value="si">Cajón lateral en la tienda</s-option>
          </s-select>` : ''}
          ${hayPrecio ? `
          <s-select label="Precio: casillas para escribirlo" id="f-precio" details="«Desde» y «Hasta» debajo del slider, en el menú Filtrar. El slider sigue estando.">
            <s-option value="no">Solo el slider</s-option>
            <s-option value="prueba">Slider y casillas: vista previa, solo con el enlace</s-option>
            <s-option value="si">Slider y casillas en la tienda</s-option>
          </s-select>` : ''}
          ${hayPortada ? `
          <s-select label="Portada de la colección en el teléfono" id="f-portada" details="La foto baja con el título encima; al tocarla sale la descripción. También quita los espacios hasta el 3x2.">
            <s-option value="no">Como el tema: solo el texto</s-option>
            <s-option value="prueba">Foto con título: vista previa, solo con el enlace</s-option>
            <s-option value="si">Foto con título en la tienda</s-option>
          </s-select>` : ''}
        </s-grid>
        <div class="casilla-polaris">
          <s-checkbox label="Poner «Ordenar» dentro del menú Filtrar, como en craftdlondon.com" id="f-ordenar" ${f.ordenar ? 'checked' : ''}></s-checkbox>
        </div>
        <p class="ayuda" id="f-enlace" hidden>Para verlo antes de encenderlo: <a target="_blank" rel="noopener" href="https://${escapar(tienda)}/collections/best-sellers?sv-vista=1">abre Best Sellers con este enlace</a>. Solo lo ve quien entra por ahí.</p>
        <s-button slot="primary-action" variant="primary" id="f-guardar-config">Guardar</s-button>
      </s-section>` : ''}

      ${botones.map((b, i) => `
        <s-section data-boton="${escapar(b.id)}" heading="${escapar(b.nombre || 'Sin texto')}">
          <div class="cabecera-fila">
            <span class="previa-boton" data-previa-boton>${iconoBotonHtml(b.icono, colores)}<span>${escapar(b.nombre || 'Sin texto')}</span></span>
            <s-stack direction="inline" gap="small-300">
              <s-button variant="tertiary" accessibilityLabel="Subir" data-mover="arriba" ${i === 0 ? 'disabled' : ''}>↑</s-button>
              <s-button variant="tertiary" accessibilityLabel="Bajar" data-mover="abajo" ${i === botones.length - 1 ? 'disabled' : ''}>↓</s-button>
            </s-stack>
          </div>
          <s-grid gridTemplateColumns="repeat(auto-fit, minmax(170px, 1fr))" gap="base">
            <s-text-field label="Texto en español" data-campo="nombre" value="${escapar(b.nombre)}"></s-text-field>
            <s-text-field label="Texto en inglés" data-campo="nombre_en" value="${escapar(b.nombreEn)}" placeholder="Vacío: se usa el español"></s-text-field>
            <s-select label="Qué filtra" data-campo="filtro">
              ${FILTROS_PRODUCTO.map((x) => `<s-option value="${x.clave}">${NOMBRE_FILTRO[x.clave]}</s-option>`).join('')}
            </s-select>
            <s-select label="Valor" data-campo="valor">${opcionesValor(f, b.filtro, b.valor)}</s-select>
            <s-select label="Icono" data-campo="icono">${opcionesIcono(colores)}</s-select>
            <s-select label="Fila" data-campo="fila">
              <s-option value="1">Primera</s-option><s-option value="2">Segunda</s-option><s-option value="3">Tercera</s-option>
            </s-select>
            <s-select label="Dónde sale" data-campo="donde">
              <s-option value="todas">En todas las colecciones</s-option>
              <s-option value="elegidas">Solo en las colecciones elegidas</s-option>
            </s-select>
          </s-grid>
          <div data-elegir-colecciones ${b.donde === 'elegidas' ? '' : 'hidden'}>
            <p class="ayuda" style="margin-top:12px;">Colecciones donde sale:</p>
            ${coleccionesHtml(colecciones, b.colecciones)}
          </div>
          <div class="casilla-polaris">
            <s-checkbox label="Activo en la tienda" data-campo="activo" ${b.activo ? 'checked' : ''}></s-checkbox>
          </div>
          <s-button slot="primary-action" variant="primary" data-guardar>Guardar</s-button>
          <s-button slot="secondary-actions" tone="critical" data-borrar>Eliminar</s-button>
        </s-section>`).join('')}

      ${hayConfig && !faltaLoNuestro ? `
      <s-section heading="Añadir un botón" subheading="Sale en todas las colecciones, en la primera fila. Después se puede cambiar.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(170px, 1fr))" gap="base">
          <s-text-field label="Texto en español" id="nuevo-boton-nombre" placeholder="p. ej. Perlas"></s-text-field>
          <s-select label="Qué filtra" id="nuevo-boton-filtro">
            ${FILTROS_PRODUCTO.map((x) => `<s-option value="${x.clave}">${NOMBRE_FILTRO[x.clave]}</s-option>`).join('')}
          </s-select>
          <s-select label="Valor" id="nuevo-boton-valor">${opcionesValor(f, 'color', '')}</s-select>
          <s-select label="Icono" id="nuevo-boton-icono">${opcionesIcono(colores)}</s-select>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="anadir-boton">Añadir botón</s-button>
      </s-section>

      <s-section id="f-valores" heading="Valores de cada filtro" subheading="Lo que se puede elegir para cada producto, separado por comas. Añadir uno aquí lo ofrece en la tabla de abajo y en los botones; renombrarlo no cambia los productos que ya lo tienen.">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          <s-text-field label="Color" id="f-colores" value="${escapar(f.colores.join(', '))}"></s-text-field>
          <s-text-field label="Categoría" id="f-categorias" value="${escapar(f.categorias.join(', '))}"></s-text-field>
          <s-text-field label="Tipo (un producto puede tener varios)" id="f-tipos" value="${escapar(f.tipos.join(', '))}"></s-text-field>
        </s-grid>
        <s-button slot="primary-action" variant="primary" id="f-guardar-valores">Guardar</s-button>
      </s-section>

      <s-section id="f-productos" heading="Qué es cada producto" subheading="La app propone el color por la etiqueta (oro, acero-inox), la categoría por el título y las colecciones, y el tipo por el título (Tennis, Pearls, Vienna, Cuban…) y la etiqueta «brillantes». Revisa y guarda.">
        <p class="ayuda" id="f-resumen"></p>
        <s-grid gridTemplateColumns="2fr 1fr" gap="base">
          <s-search-field id="f-buscar" label="Buscar por nombre" labelAccessibilityVisibility="exclusive" placeholder="Buscar por nombre…" value="${escapar(estadoFiltros.texto)}"></s-search-field>
          <s-select id="f-ver" label="Ver" labelAccessibilityVisibility="exclusive">
            <s-option value="todos">Todos</s-option>
            <s-option value="sin">Sin color o sin categoría</s-option>
            <s-option value="cambios">Con cambios sin guardar</s-option>
          </s-select>
        </s-grid>
        <div class="acciones" style="margin:12px 0;">
          <s-button id="f-proponer">Rellenar lo vacío con la propuesta</s-button>
          <s-button id="f-deshacer" variant="tertiary">Deshacer lo no guardado</s-button>
        </div>
        <div class="tabla-filtros__caja">
          <table class="tabla-filtros">
            <thead><tr><th></th><th>Producto</th><th>Color</th><th>Categoría</th><th>Tipo</th></tr></thead>
            <tbody id="f-filas"></tbody>
          </table>
        </div>
        <s-button slot="primary-action" variant="primary" id="f-guardar-productos">Guardar cambios</s-button>
      </s-section>

      <s-section heading="Menú «Filtrar»" subheading="Lo que sale dentro del botón Filtrar lo decide Shopify Search & Discovery. Hay que añadir ahí, una vez por tienda, los tres filtros que escribe esta pantalla.">
        <ol class="pasos">
          <li>Abre <a href="https://admin.shopify.com/store/${escapar(handleTienda)}/apps/search-and-discovery/filters" target="_top">Search & Discovery → Filtros</a>.</li>
          <li>«Añadir filtro» → <b>Color (filtro)</b>. Repite con <b>Categoría (filtro)</b> y <b>Tipo (filtro)</b>.</li>
          <li>Ponlos en este orden: Color, Categoría, Tipo, Precio, Disponibilidad, y guarda.</li>
        </ol>
        <p class="ayuda">Hasta que estén ahí, los botones de la página no salen: son ese mismo filtro.</p>
      </s-section>` : ''}
    </s-page>`;

  conectarPendientes(() => ir('filtros'));
  if (faltaLoNuestro || !hayConfig) return;

  const el = (id) => document.getElementById(id);

  /* ---- Configuración y previa ---- */
  el('f-modo').value = f.modo;
  if (hayCajon) el('f-cajon').value = f.cajon;
  if (hayPrecio) el('f-precio').value = f.precio;
  if (hayPortada) el('f-portada').value = f.portada;
  el('f-simular').value = estadoFiltros.simular;
  const repintarPrevia = () => {
    const cols = Number(el('f-columnas').value) || f.columnas;
    el('f-previa').innerHTML = previaFiltrosHtml(botones, colores, cols, estadoFiltros.simular);
    el('f-enlace').hidden = el('f-modo').value !== 'prueba' && !(hayCajon && el('f-cajon').value === 'prueba')
      && !(hayPrecio && el('f-precio').value === 'prueba') && !(hayPortada && el('f-portada').value === 'prueba');
  };
  el('f-simular').addEventListener('change', (e) => { estadoFiltros.simular = e.target.value; repintarPrevia(); });
  el('f-config').addEventListener('input', repintarPrevia);
  el('f-config').addEventListener('change', repintarPrevia);
  repintarPrevia();

  const configActual = () => ({
    ...f,
    modo: el('f-modo').value || 'no',
    columnas: Math.max(2, Math.min(5, Number(el('f-columnas').value) || f.columnas)),
    ordenar: el('f-ordenar').checked,
    cajon: hayCajon ? (el('f-cajon').value || 'prueba') : f.cajon,
    precio: hayPrecio ? (el('f-precio').value || 'prueba') : f.precio,
    portada: hayPortada ? (el('f-portada').value || 'si') : f.portada,
  });
  el('f-guardar-config').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const v = configActual();
      await guardarFiltrosConfig(v, camposConfig);
      Object.assign(f, v);
      avisar(v.modo === 'si' ? 'Botones activos en la tienda' : v.modo === 'prueba' ? 'Botones en vista previa' : 'Botones apagados');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
    }
  });

  el('f-guardar-valores').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    const lista = (id) => String(el(id).value ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    try {
      await guardarFiltrosConfig({ ...configActual(), colores: lista('f-colores'), categorias: lista('f-categorias'), tipos: lista('f-tipos') }, camposConfig);
      avisar('Valores guardados');
      await ir('filtros');
    } catch (error2) {
      avisar(error2.message, true);
      boton.loading = false;
    }
  });

  /* ---- Cada botón ---- */
  pantalla.querySelectorAll('s-section[data-boton]').forEach((tarjeta) => {
    const id = tarjeta.dataset.boton;
    const original = botones.find((b) => b.id === id);
    const campo = (n) => tarjeta.querySelector(`[data-campo="${n}"]`);
    const valor = (n) => String(campo(n)?.value ?? '').trim();

    campo('filtro').value = original.filtro;
    campo('valor').value = original.valor;
    campo('icono').value = original.icono || '__sin';
    campo('fila').value = String(original.fila);
    campo('donde').value = original.donde;

    const comoQueda = () => ({
      nombre: valor('nombre'),
      nombreEn: valor('nombre_en'),
      filtro: valor('filtro') || 'color',
      valor: valor('valor'),
      icono: valor('icono') === '__sin' ? '' : valor('icono'),
      fila: Number(valor('fila')) || 1,
      donde: valor('donde') === 'elegidas' ? 'elegidas' : 'todas',
      activo: campo('activo').checked,
      colecciones: [...tarjeta.querySelectorAll('[data-coleccion]:checked')]
        .map((x) => colecciones.find((c) => c.id === x.dataset.coleccion)).filter(Boolean),
    });

    const refrescar = () => {
      const v = comoQueda();
      tarjeta.querySelector('[data-previa-boton]').innerHTML = `${iconoBotonHtml(v.icono, colores)}<span>${escapar(v.nombre || 'Sin texto')}</span>`;
      tarjeta.heading = v.nombre || 'Sin texto';
      tarjeta.querySelector('[data-elegir-colecciones]').hidden = v.donde !== 'elegidas';
    };
    tarjeta.addEventListener('input', refrescar);
    tarjeta.addEventListener('change', (e) => {
      /* Al cambiar qué filtra, los valores posibles son otros. */
      if (e.target === campo('filtro')) {
        const sel = campo('valor');
        sel.innerHTML = opcionesValor(f, campo('filtro').value, '');
        requestAnimationFrame(() => { sel.value = valoresDe(f, campo('filtro').value)[0] ?? ''; });
      }
      refrescar();
    });

    tarjeta.querySelector('[data-guardar]').addEventListener('click', async (e) => {
      const boton = e.currentTarget;
      const v = comoQueda();
      if (!v.nombre) { avisar('Escribe el texto del botón.', true); return; }
      if (!v.valor) { avisar('Elige el valor que filtra.', true); return; }
      if (v.donde === 'elegidas' && !v.colecciones.length) { avisar('Elige al menos una colección, o «En todas».', true); return; }
      boton.loading = true;
      try {
        await guardarBoton(id, v);
        Object.assign(original, v);
        repintarPrevia();
        avisar('Botón guardado');
      } catch (error2) {
        avisar(error2.message, true);
      } finally {
        boton.loading = false;
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        boton.loading = true;
        try {
          await moverEntrada(botones, id, boton.dataset.mover, guardarBoton);
          await ir('filtros');
        } catch (error2) {
          avisar(error2.message, true);
          boton.loading = false;
        }
      });
    });

    tarjeta.querySelector('[data-borrar]').addEventListener('click', async (e) => {
      if (!confirm(`¿Eliminar el botón «${original.nombre}»?`)) return;
      const boton = e.currentTarget;
      boton.loading = true;
      try {
        await borrarBoton(id);
        avisar('Botón eliminado');
        await ir('filtros');
      } catch (error2) {
        avisar(error2.message, true);
        boton.loading = false;
      }
    });
  });

  /* ---- Añadir ---- */
  el('nuevo-boton-icono').value = '__sin';
  el('nuevo-boton-filtro').addEventListener('change', () => {
    const sel = el('nuevo-boton-valor');
    sel.innerHTML = opcionesValor(f, el('nuevo-boton-filtro').value, '');
    requestAnimationFrame(() => { sel.value = valoresDe(f, el('nuevo-boton-filtro').value)[0] ?? ''; });
  });
  el('anadir-boton').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const nombre = String(el('nuevo-boton-nombre').value ?? '').trim();
    const valorNuevo = String(el('nuevo-boton-valor').value ?? '').trim();
    if (!nombre) { avisar('Escribe el texto del botón.', true); return; }
    if (!valorNuevo) { avisar('Elige el valor que filtra.', true); return; }
    boton.loading = true;
    try {
      const icono = String(el('nuevo-boton-icono').value ?? '');
      await crearBoton({
        nombre, filtro: el('nuevo-boton-filtro').value || 'color', valor: valorNuevo,
        icono: icono === '__sin' ? '' : icono, orden: botones.length + 1,
      }, botones.length);
      avisar('Botón creado');
      await ir('filtros');
    } catch (error2) {
      avisar(error2.message, true);
      boton.loading = false;
    }
  });

  /* ---- Qué es cada producto ---- */
  const cuerpo = el('f-filas');
  el('f-ver').value = estadoFiltros.ver;

  const resumen = () => {
    const sinColor2 = productos.filter((p) => !p.nuevo.color).length;
    const sinCat = productos.filter((p) => !p.nuevo.categoria).length;
    const cambiados = productos.filter(filaCambiada).length;
    el('f-resumen').textContent = `${productos.length} productos · ${sinColor2} sin color · ${sinCat} sin categoría${cambiados ? ` · ${cambiados} con cambios sin guardar` : ''}.`;
    el('f-guardar-productos').textContent = cambiados ? `Guardar cambios (${cambiados})` : 'Guardar cambios';
  };

  const visibles = () => {
    const t = estadoFiltros.texto.toLowerCase();
    return productos.filter((p) => (!t || p.titulo.toLowerCase().includes(t))
      && (estadoFiltros.ver !== 'sin' || sinClasificar(p))
      && (estadoFiltros.ver !== 'cambios' || filaCambiada(p)));
  };

  const pintarTabla = () => {
    const lista = visibles();
    cuerpo.innerHTML = lista.length
      ? lista.map((p) => filaProductoHtml(p, f)).join('')
      : '<tr><td colspan="5" class="vacio">Ningún producto coincide.</td></tr>';
    resumen();
  };
  pintarTabla();

  let espera = null;
  el('f-buscar').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => { estadoFiltros.texto = String(e.target.value ?? '').trim(); pintarTabla(); }, ESPERA_BUSQUEDA);
  });
  el('f-ver').addEventListener('change', (e) => { estadoFiltros.ver = e.target.value; pintarTabla(); });

  const marcar = (fila, p) => {
    fila.classList.toggle('is-cambiada', filaCambiada(p));
    resumen();
  };
  cuerpo.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-campo-filtro]');
    if (!sel) return;
    const fila = sel.closest('tr');
    const p = productos.find((x) => x.id === fila.dataset.fila);
    p.nuevo[sel.dataset.campoFiltro] = sel.value;
    marcar(fila, p);
  });
  cuerpo.addEventListener('click', (e) => {
    const ficha = e.target.closest('button[data-tipo]');
    if (!ficha) return;
    const fila = ficha.closest('tr');
    const p = productos.find((x) => x.id === fila.dataset.fila);
    const t = ficha.dataset.tipo;
    const on = !p.nuevo.tipo.includes(t);
    /* En el orden de la lista de valores, para que guardar dos veces lo mismo
     * no parezca un cambio. */
    const orden = [...new Set([...f.tipos, ...p.nuevo.tipo, t])];
    p.nuevo.tipo = orden.filter((x) => (x === t ? on : p.nuevo.tipo.includes(x)));
    ficha.classList.toggle('is-on', on);
    ficha.setAttribute('aria-pressed', String(on));
    marcar(fila, p);
  });

  el('f-proponer').addEventListener('click', () => {
    let tocados = 0;
    for (const p of productos) {
      const s2 = sugerir(p, f);
      let toco = false;
      if (!p.nuevo.color && s2.color) { p.nuevo.color = s2.color; toco = true; }
      if (!p.nuevo.categoria && s2.categoria) { p.nuevo.categoria = s2.categoria; toco = true; }
      if (!p.nuevo.tipo.length && s2.tipo.length) { p.nuevo.tipo = s2.tipo; toco = true; }
      if (toco) tocados += 1;
    }
    estadoFiltros.ver = 'cambios';
    el('f-ver').value = 'cambios';
    pintarTabla();
    avisar(tocados ? `Propuesta aplicada a ${tocados} productos. Revisa y guarda.` : 'No había nada vacío que proponer.');
  });

  el('f-deshacer').addEventListener('click', () => {
    for (const p of productos) p.nuevo = { color: p.color, categoria: p.categoria, tipo: [...p.tipo] };
    pintarTabla();
  });

  el('f-guardar-productos').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const cambiados = productos.filter(filaCambiada);
    if (!cambiados.length) { avisar('No hay cambios que guardar.'); return; }
    boton.loading = true;
    try {
      const cambios = cambiados.map((p) => {
        const c = { id: p.id };
        if (p.nuevo.color !== p.color) c.color = p.nuevo.color;
        if (p.nuevo.categoria !== p.categoria) c.categoria = p.nuevo.categoria;
        if (p.nuevo.tipo.join('|') !== p.tipo.join('|')) c.tipo = p.nuevo.tipo;
        return c;
      });
      await guardarClasificacion(cambios, (hechos, total) => {
        if (pase.vivo) boton.textContent = `Guardando ${hechos} de ${total}…`;
      });
      for (const p of cambiados) {
        p.color = p.nuevo.color;
        p.categoria = p.nuevo.categoria;
        p.tipo = [...p.nuevo.tipo];
      }
      if (estadoFiltros.ver === 'cambios') { estadoFiltros.ver = 'todos'; el('f-ver').value = 'todos'; }
      pintarTabla();
      avisar(`Guardados ${cambiados.length} productos`);
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      boton.loading = false;
      resumen();
    }
  });
}

const PANTALLAS = {
  colores: pintarColores,
  productos: pintarProductos,
  etiquetas: pintarEtiquetas,
  beneficios: pintarBeneficios,
  guias: pintarGuias,
  apariencia: pintarApariencia,
  fotos: pintarFotos,
  temporadas: pintarTemporadas,
  filtros: pintarFiltros,
};

/* Pestaña «Fotos»: cada foto de temporada con su miniatura y botones para
 * cambiarla (subir del computador o elegir de Archivos). Ver fotos.js. */
function tarjetaFoto(nombre, titulo, forma, actual) {
  const [a, b] = forma;
  const medida = actual?.ancho ? ` · ${actual.ancho} × ${actual.alto}` : '';
  return `
    <div class="foto" data-foto="${escapar(nombre)}" data-titulo="${escapar(titulo)}" data-forma="${a}/${b}" style="--ar:${a} / ${b}">
      <div class="foto__marco" data-marco>${actual?.url ? `<img src="${escapar(actual.url)}&width=480" alt="" loading="lazy" />` : '<span class="ayuda">Todavía no existe</span>'}</div>
      <p class="foto__titulo">${escapar(titulo)}</p>
      <p class="ayuda foto__nombre" data-medida>${escapar(nombre)}${medida}</p>
      <p class="ayuda">Formato ${a === b ? 'cuadrado' : `${a}:${b}`}</p>
      <div class="acciones acciones--envolver">
        <label class="secundario como-boton">Subir…<input type="file" accept="image/*" data-subir hidden /></label>
        ${hayBiblioteca() ? '<button type="button" class="secundario" data-biblioteca>Elegir de la biblioteca</button>' : ''}
      </div>
      <p class="ayuda" data-estado></p>
    </div>`;
}

/* Qué temporada muestra «Fotos». La pestaña Temporadas la fija antes de abrirla. */
let temporadaFotos = null;

async function pintarFotos() {
  const miPintado = pintado;
  pantalla.innerHTML = '<p class="cargando">Cargando…</p>';
  const { activa, datos } = await leerTemporadas();
  const lista = listaDe(datos);
  const clave = lista.some((t) => t.clave === temporadaFotos) ? temporadaFotos : (lista.some((t) => t.clave === activa) ? activa : 'normal');
  const nombre = lista.find((t) => t.clave === clave)?.nombre || clave;
  const grupos = gruposDe(clave, nombre);
  const fotos = await cargarFotos(grupos);
  if (miPintado !== pintado) return;
  pantalla.innerHTML = `
    <s-page>
      <div class="titular">
        <h1>Fotos</h1>
        <p class="subtitulo">Las fotos de cada temporada. Cambias una aquí y se actualiza en todos los lugares donde sale, en unos segundos; no hay que tocar el tema. Si la foto nueva no tiene el formato indicado, la tienda la recorta.</p>
      </div>
      <s-section>
        <s-select label="Temporada" id="f-temporada" data-valor="${escapar(clave)}">
          ${lista.map((t) => `<s-option value="${escapar(t.clave)}" ${t.clave === clave ? 'selected' : ''}>${escapar(t.nombre)}${t.clave === activa ? ' (activa)' : ''}</s-option>`).join('')}
        </s-select>
        <p class="ayuda">${clave === 'normal' ? 'Normal: las fotos de siempre. «Tu cadena de cada día» y el menú del teléfono salen en todas las temporadas.' : `Las fotos de ${escapar(nombre)} se ven cuando esa temporada está activa (pestaña Temporadas). Las que falten se ven como en Normal.`}</p>
      </s-section>
      <s-banner tone="warning"><p>Ojo: los botones de Apariencia «Traer las fotos nuevas a Archivos» y «Preparar las fotos de Navidad» vuelven a poner las fotos que trae la app y pisan las que cambies aquí.</p></s-banner>
      ${grupos.map((g) => `
        <s-section heading="${escapar(g.titulo)}">
          <p class="ayuda fotos__texto">${escapar(g.texto)}</p>
          <div class="fotos">${g.fotos.map(([n, t, forma]) => tarjetaFoto(n, t, forma || g.forma, fotos[n])).join('')}</div>
        </s-section>`).join('')}
    </s-page>`;

  pantalla.querySelectorAll('s-select[data-valor]').forEach((e) => { e.value = e.dataset.valor; });
  document.getElementById('f-temporada').addEventListener('change', (e) => {
    temporadaFotos = e.currentTarget.value;
    ir('fotos');
  });

  pantalla.querySelectorAll('[data-foto]').forEach((tarjeta) => {
    const nombre = tarjeta.dataset.foto;
    const titulo = tarjeta.dataset.titulo;
    const [a, b] = tarjeta.dataset.forma.split('/').map(Number);
    const estado = tarjeta.querySelector('[data-estado]');
    const decir = (texto) => { estado.textContent = texto; };

    async function aplicar(obtener) {
      try {
        const origen = await obtener();
        if (!origen) { decir(''); return; }
        const r = await cambiarFoto(nombre, origen, fotos[nombre], decir);
        fotos[nombre] = { id: r.id, url: r.url, ancho: r.ancho, alto: r.alto };
        tarjeta.querySelector('[data-marco]').innerHTML = `<img src="${escapar(r.url)}&width=480" alt="" />`;
        tarjeta.querySelector('[data-medida]').textContent = `${nombre} · ${r.ancho} × ${r.alto}`;
        const desvio = Math.abs((r.ancho / r.alto) / (a / b) - 1);
        decir(desvio > 0.12
          ? `Lista. Ojo: mide ${r.ancho} × ${r.alto} y aquí conviene ${a === b ? 'cuadrada' : `${a}:${b}`}; la tienda la va a recortar.`
          : 'Lista. En la tienda se ve en unos segundos.');
        avisar(`Foto cambiada: ${titulo}`);
      } catch (error) {
        decir('');
        avisar(error.message, true);
      }
    }

    tarjeta.querySelector('[data-subir]').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) aplicar(async () => file);
    });
    tarjeta.querySelector('[data-biblioteca]')?.addEventListener('click', () => {
      decir('Abriendo la biblioteca…');
      aplicar(async () => (await elegirDeBiblioteca({ tipo: 'MediaImage' }))?.url);
    });
  });
}

/* Pestaña «Temporadas»: la activa, crear y borrar, y los textos de cada una
 * (barra de arriba, bloque 3X2, caja de oferta). Ver temporadas.js. */
let temporadaEditor = null;

function campoTemporada(c, clave, propios, datos, tienda, ingles) {
  const normal = clave === 'normal';
  const hoy = textosDeHoy(tienda);
  const deNormal = (k) => datos.normal?.[k] || hoy[k] || '';
  const valor = (k) => (normal ? (propios[k] ?? hoy[k] ?? '') : (propios[k] ?? ''));
  const ayuda = c.ayuda ? ` details="${escapar(c.ayuda)}"` : '';
  if (c.tipo === 'mostrar') {
    const v = propios[c.k] || (normal ? 'si' : '__igual');
    const n = deNormal(c.k) === 'no' ? 'No' : 'Sí';
    return `<s-select label="Se muestra" data-c="${c.k}" data-valor="${v}">
      ${normal ? '' : `<s-option value="__igual" ${v === '__igual' ? 'selected' : ''}>Igual que Normal (${n})</s-option>`}
      <s-option value="si" ${v === 'si' ? 'selected' : ''}>Sí</s-option>
      <s-option value="no" ${v === 'no' ? 'selected' : ''}>No</s-option>
    </s-select>`;
  }
  if (c.tipo === 'fecha') {
    return `<div class="campo-fecha">
      <label><span>${escapar(c.etiqueta)}</span><input type="datetime-local" data-c="${c.k}" value="${escapar(aLocal(propios[c.k]))}" /></label>
      <button type="button" class="secundario" data-quitar-fecha>Sin fecha</button>
      <p class="ayuda">${escapar(c.ayuda)}</p>
    </div>`;
  }
  if (c.tipo === 'color') {
    const ph = normal ? '' : ` placeholder="${escapar(deNormal(c.k) || 'Como siempre')}"`;
    const det = normal ? (c.ayuda || '') : `Vacío: igual que Normal${deNormal(c.k) ? ` (${deNormal(c.k)})` : ''}.`;
    return `<s-color-field label="${escapar(c.etiqueta)}" data-c="${c.k}" value="${escapar(valor(c.k))}"${ph} details="${escapar(det)}"></s-color-field>`;
  }
  const uno = (k, etiqueta) => {
    const ph = normal ? '' : ` placeholder="${escapar(deNormal(k) ? `Igual que Normal: ${deNormal(k)}` : 'Igual que Normal')}"`;
    return `<s-text-field label="${escapar(etiqueta)}" data-c="${k}" value="${escapar(valor(k))}"${ph}${k === c.k ? ayuda : ''}></s-text-field>`;
  };
  return uno(c.k, c.etiqueta) + (c.en && ingles ? uno(`${c.k}_en`, `${c.etiqueta} (inglés)`) : '');
}

async function pintarTemporadas() {
  const miPintado = pintado;
  pantalla.innerHTML = '<p class="cargando">Cargando temporadas…</p>';
  const tienda = new URLSearchParams(location.search).get('shop') || '';
  const ingles = conIngles(tienda);

  /* El campo «temporadas» es nuevo: si la tienda aún no lo tiene, se crea (lo
   * mismo que «Crear lo que falta»). */
  if (!(await camposDeConfig()).has('temporadas')) {
    pantalla.innerHTML = '<p class="cargando">Preparando el lugar donde se guardan las temporadas…</p>';
    await asegurarConfig();
  }
  const { activa, datos } = await leerTemporadas();
  if (miPintado !== pintado) return;
  const lista = listaDe(datos);
  if (!lista.some((t) => t.clave === temporadaEditor)) temporadaEditor = lista.some((t) => t.clave === activa) ? activa : 'normal';
  const clave = temporadaEditor;
  const nombre = lista.find((t) => t.clave === clave)?.nombre || clave;
  const propios = { ...(datos[clave] || {}) };

  pantalla.innerHTML = `
    <s-page>
      <div class="titular">
        <h1>Temporadas</h1>
        <p class="subtitulo">Cada temporada es una apariencia de la tienda: sus fotos (pestaña «Fotos») y los textos de la barra de arriba con la cuenta regresiva, del bloque «3X2» de las colecciones y de la caja de oferta de los productos. Normal y Navidad existen siempre; puedes crear otras (Cyber, San Valentín, Día del Padre…).</p>
      </div>

      <s-section heading="Temporada activa">
        <s-select label="La tienda muestra" id="t-activa" data-valor="${escapar(activa)}">
          ${lista.map((t) => `<s-option value="${escapar(t.clave)}" ${t.clave === activa ? 'selected' : ''}>${escapar(t.nombre)}</s-option>`).join('')}
        </s-select>
        <p class="ayuda">Al guardar, la tienda cambia en unos segundos: fotos, barra, bloque 3X2 y caja de oferta. Lo que una temporada no tenga (una foto, un texto) se ve como en Normal.</p>
        <s-button slot="primary-action" variant="primary" id="t-guardar-activa">Guardar</s-button>
      </s-section>

      <s-section heading="Temporadas">
        <div class="temporadas">
          ${lista.map((t) => `
            <div class="temporada${t.clave === clave ? ' is-elegida' : ''}">
              <div>
                <p class="temporada__nombre">${escapar(t.nombre)}${t.clave === activa ? ' <span class="chip">Activa</span>' : ''}</p>
                <p class="ayuda">Clave: ${escapar(t.clave)}${t.clave === 'normal' ? '' : ` · fotos sv-${escapar(t.clave)}-…`}</p>
              </div>
              <div class="acciones acciones--envolver">
                <button type="button" class="secundario" data-editar="${escapar(t.clave)}">Textos</button>
                <button type="button" class="secundario" data-fotos="${escapar(t.clave)}">Fotos</button>
                ${t.fija ? '' : `<button type="button" class="secundario secundario--peligro" data-borrar="${escapar(t.clave)}">Borrar</button>`}
              </div>
            </div>`).join('')}
        </div>
        <div class="temporada-nueva">
          <s-text-field label="Nueva temporada" id="t-nueva" placeholder="Por ejemplo: Cyber, San Valentín" details="Se crea con todo igual que Normal; después cambias sus textos aquí y sus fotos en «Fotos»."></s-text-field>
          <s-button id="t-crear">Crear</s-button>
        </div>
      </s-section>

      <div id="t-editor">
        <div class="titular"><h2>Textos de «${escapar(nombre)}»</h2>
          <p class="subtitulo">${clave === 'normal'
    ? 'Normal es la base: lo que otra temporada deje vacío se ve como aquí. Escribe «-» para dejar un texto sin nada.'
    : 'Lo que dejes vacío se ve igual que en Normal (lo gris de cada casilla). Escribe «-» para dejar un texto sin nada.'}</p>
        </div>
        ${clave === 'normal' ? '' : `<s-section><s-text-field label="Nombre de la temporada" data-c="nombre" value="${escapar(propios.nombre || nombre)}"></s-text-field></s-section>`}
        ${PARTES_TEMPORADA.map((p) => `
          <s-section heading="${escapar(p.titulo)}">
            <p class="ayuda">${escapar(p.texto)}</p>
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
              ${p.campos.map((c) => campoTemporada(c, clave, propios, datos, tienda, ingles)).join('')}
            </s-grid>
            <p class="ayuda tv-rotulo">Así se ve${ingles ? ' (español)' : ''}:</p>
            <div class="tv" data-vista="${p.clave}"></div>
            ${ingles ? `<p class="ayuda tv-rotulo">En inglés:</p><div class="tv" data-vista="${p.clave}" data-ingles></div>` : ''}
            <s-button slot="primary-action" variant="primary" data-guardar-textos>Guardar los textos</s-button>
          </s-section>`).join('')}
      </div>
    </s-page>`;

  pantalla.querySelectorAll('s-select[data-valor]').forEach((e) => { e.value = e.dataset.valor; });
  const editor = document.getElementById('t-editor');
  const leer = () => {
    const v = {};
    editor.querySelectorAll('[data-c]').forEach((e) => {
      const k = e.dataset.c;
      let x = String(e.value ?? '').trim();
      if (e.tagName === 'S-SELECT' && x === '__igual') x = '';
      else if (e.tagName === 'S-COLOR-FIELD') x = colorValido(x);
      else if (e.type === 'datetime-local') x = aUtc(x);
      if (x) v[k] = x;
    });
    return v;
  };
  const repintar = () => {
    const v = leer();
    const d = { ...datos, [clave]: v };
    editor.querySelectorAll('[data-vista]').forEach((caja) => {
      caja.innerHTML = vistaPrevia(caja.dataset.vista, (k) => efectivo(d, clave, k, tienda), caja.hasAttribute('data-ingles'));
    });
  };
  editor.addEventListener('input', repintar);
  editor.addEventListener('change', repintar);
  editor.querySelector('[data-quitar-fecha]')?.addEventListener('click', () => {
    editor.querySelector('[data-c="barra_fin"]').value = '';
    repintar();
  });
  repintar();

  editor.querySelectorAll('[data-guardar-textos]').forEach((b) => b.addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.loading = true;
    try {
      const v = leer();
      if (clave !== 'normal' && !v.nombre) v.nombre = nombre;
      /* Se vuelve a leer justo antes: así no se pisa lo que otra persona haya
       * guardado de otra temporada mientras esta pantalla estaba abierta. */
      const { datos: ahora } = await leerTemporadas();
      ahora[clave] = v;
      await guardarTemporadas(ahora);
      Object.assign(datos, ahora);
      avisar(`Textos de «${v.nombre || nombre}» guardados.${clave === activa ? ' La tienda los muestra en unos segundos.' : ' Se ven cuando esa temporada esté activa.'}`);
    } catch (error) {
      avisar(error.message, true);
    } finally {
      boton.loading = false;
    }
  }));

  document.getElementById('t-guardar-activa').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const nueva = document.getElementById('t-activa').value || 'normal';
    boton.loading = true;
    try {
      await guardarTemporadaActiva(nueva);
      avisar(`La tienda ahora muestra «${lista.find((t) => t.clave === nueva)?.nombre || nueva}».`);
      temporadaEditor = nueva;
      ir('temporadas');
    } catch (error) {
      avisar(error.message, true);
    } finally {
      boton.loading = false;
    }
  });

  document.getElementById('t-crear').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const nombreNuevo = String(document.getElementById('t-nueva').value || '').trim();
    const claveNueva = claveDe(nombreNuevo);
    boton.loading = true;
    try {
      const { datos: ahora } = await leerTemporadas();
      const problema = validarClave(claveNueva, ahora);
      if (problema) throw new Error(problema);
      ahora[claveNueva] = { nombre: nombreNuevo };
      await guardarTemporadas(ahora);
      avisar(`Temporada «${nombreNuevo}» creada. Cambia sus textos abajo y sus fotos en «Fotos».`);
      temporadaEditor = claveNueva;
      ir('temporadas');
    } catch (error) {
      avisar(error.message, true);
    } finally {
      boton.loading = false;
    }
  });

  pantalla.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => {
    temporadaEditor = b.dataset.editar;
    ir('temporadas');
  }));
  pantalla.querySelectorAll('[data-fotos]').forEach((b) => b.addEventListener('click', () => {
    temporadaFotos = b.dataset.fotos;
    ir('fotos');
  }));
  pantalla.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
    const k = b.dataset.borrar;
    const n = lista.find((t) => t.clave === k)?.nombre || k;
    if (k === activa) { avisar(`«${n}» es la temporada activa: elige otra antes de borrarla.`, true); return; }
    /* Dos pasos en el mismo botón: el confirm() del navegador no siempre se
     * muestra dentro del admin. */
    if (!b.dataset.seguro) {
      b.dataset.seguro = '1';
      b.textContent = '¿Seguro? Borrar';
      avisar(`Vuelve a pulsar para borrar «${n}». Se pierden sus textos; sus fotos quedan en Contenido → Archivos.`);
      setTimeout(() => { delete b.dataset.seguro; b.textContent = 'Borrar'; }, 6000);
      return;
    }
    try {
      const { datos: ahora } = await leerTemporadas();
      delete ahora[k];
      await guardarTemporadas(ahora);
      avisar(`Temporada «${n}» borrada.`);
      if (temporadaEditor === k) temporadaEditor = null;
      ir('temporadas');
    } catch (error) {
      avisar(error.message, true);
    }
  }));
}

async function ir(nombre) {
  pintado += 1;
  pasesVivos.forEach((p) => { p.vivo = false; });
  pasesVivos.clear();

  /* La pantalla anterior se tira entera: sus cajas de resultados ya no existen
   * y sus cerradores tampoco deben seguir en la lista. */
  cerradores.clear();

  document.querySelectorAll('.nav__item').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.pantalla === nombre);
  });
  try {
    await PANTALLAS[nombre]();
  } catch (error) {
    pantalla.innerHTML = `<div class="vacio">${escapar(error.message)}</div>`;
  }
}

document.querySelectorAll('.nav__item').forEach((boton) => {
  boton.addEventListener('click', () => ir(boton.dataset.pantalla));
});

const sello = document.getElementById('version');
if (sello) sello.textContent = `v${VERSION}`;

if (!estaEmbebida()) {
  pantalla.innerHTML = `
    <h1>Abre esta página desde el admin</h1>
    <p class="subtitulo">
      El panel usa la sesión del admin de Shopify para hablar con la API, así que
      fuera del admin no tiene con qué autenticarse. Ábrelo desde
      Apps → Color &amp; Size Picker.
    </p>`;
} else {
  ir('colores');
}
