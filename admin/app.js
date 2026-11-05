/* Saint Venik · Panel de la app. Sin framework ni paso de compilacion: son
 * archivos estaticos que el admin de Shopify carga embebidos. */
import { estaEmbebida } from './api.js?v=202611052006';
import {
  cargarColores, guardarColor, crearColor, borrarColor, problemasDe, ordenarComoLaTienda,
  guardarImagenColor, camposDeColor,
} from './colores.js?v=202611052006';
import {
  leerConfig, guardarOrdenColores, guardarTextosBoton, guardarApariencia,
  guardarPildora, camposDeConfig, PILDORA_POR_DEFECTO,
} from './config.js?v=202611052006';
import {
  buscarProductos, todosLosProductos, vincular, desvincular, sinHermano, sinColor,
} from './productos.js?v=202611052006';
import { subirArchivo, elegirDeBiblioteca, hayBiblioteca } from './archivos.js?v=202611052006';
import {
  estadoEstructura, revisarEstructura, crearEstructura, cargarGuias, GUIAS_INICIALES,
  crearBloque, guardarBloque, borrarBloque, moverBloque, guardarGuia, guardarArchivoDeBloque, NOMBRE_TIPO,
  revisarReparto, crearGuia, TOPE_GUIAS, importarGuias,
} from './guias.js?v=202611052006';
import {
  guiaHtml, coloresHtml, visible, etiquetaHtml, beneficiosHtml, estiloEtiqueta, conAlfa, iconoHtml,
} from './vista-previa.js?v=202611052006';
import { cargarColecciones, cargarEtiquetasDeTienda, esResta, sinSigno, TOPE_REFERENCIAS } from './asignacion.js?v=202611052006';
import {
  cargarEtiquetas, crearEtiqueta, guardarEtiqueta, borrarEtiqueta,
  sincronizar as sincronizarEtiqueta, cuantosAlcanza as alcanceEtiqueta, camposDeEtiqueta,
  FONDO_POR_DEFECTO, TEXTO_POR_DEFECTO,
} from './etiquetas.js?v=202611052006';
import {
  cargarBeneficios, crearBeneficio, guardarBeneficio, borrarBeneficio,
  sincronizar as sincronizarBeneficio, cuantosAlcanza as alcanceBeneficio,
  guardarIconoImagen, camposDeBeneficio,
} from './beneficios.js?v=202611052006';
import { ICONOS, svgIcono } from './iconos.js?v=202611052006';

/* La sella scripts/version.mjs al publicar. No se deduce de la URL porque ahora
 * la URL lleva un sello por minuto para saltarse la cache, no la version. */
const VERSION = '202611052006';

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
    <section class="tarjeta" data-id="${escapar(color.id)}">
      <div class="color">
        <div class="color__muestra" style="${fondoDe(color)}"></div>
        <div class="color__campos">
          <div>
            <label>Nombre en español</label>
            <input type="text" data-campo="nombre" value="${escapar(color.nombre)}" />
            <p class="ayuda">Lo que ve el cliente en la tienda en español.</p>
          </div>
          <div>
            <label>Nombre en inglés</label>
            ${hayNombreEn
              ? `<input type="text" data-campo="nombre_en" value="${escapar(color.nombreEn)}" placeholder="Vacío: traducción automática" />
                 <p class="ayuda">Lo que se ve en /en/. Vacío, se usa la traducción de Translate &amp; Adapt.</p>`
              : '<p class="ayuda">Todavía no existe en tu tienda: pulsa «Crear lo que falta» arriba.</p>'}
          </div>
          <div>
            <label>Etiqueta del producto</label>
            <input type="text" data-campo="etiqueta" value="${escapar(color.etiqueta)}" />
            <p class="ayuda">Los productos con esta etiqueta se muestran en este color.</p>
          </div>
          <div>
            <label>Color de la muestra</label>
            <input type="color" data-campo="muestra" value="${escapar(color.muestra || '#cccccc')}" />
            <p class="ayuda">${color.imagen ? 'Hay una imagen, y la imagen manda sobre el color.' : 'Se usa si no hay imagen.'}</p>
          </div>
          <div>
            <label>Imagen de la muestra</label>
            <div class="acciones acciones--envolver">
              <label class="secundario como-boton">
                Subir…<input type="file" accept="image/*" data-subir hidden />
              </label>
              ${hayBiblioteca() ? '<button class="secundario" data-biblioteca>Elegir de la biblioteca</button>' : ''}
              ${color.imagen ? '<button class="secundario secundario--peligro" data-quitar-imagen>Quitar</button>' : ''}
            </div>
            <p class="ayuda" data-estado-imagen>${color.imagen ? 'Manda sobre el color.' : 'Opcional.'}</p>
          </div>
        </div>
      </div>
      ${problemas.map((p) => `<p class="problema">${escapar(p)}</p>`).join('')}
      <div class="acciones">
        <button class="principal" data-guardar>Guardar</button>
        <button class="secundario" data-mover="arriba" ${i <= 0 ? 'disabled' : ''}
          title="${i < 0 ? 'Sin etiqueta no se puede ordenar' : 'Subir'}">↑</button>
        <button class="secundario" data-mover="abajo" ${i < 0 || i === total - 1 ? 'disabled' : ''}
          title="${i < 0 ? 'Sin etiqueta no se puede ordenar' : 'Bajar'}">↓</button>
        <button class="secundario secundario--peligro" data-borrar>Eliminar</button>
      </div>
    </section>
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
    <h1>Colores</h1>
    <p class="subtitulo">Cada color es una muestra en la ficha de producto. Un producto se asocia a su color por la etiqueta, y el orden de aquí es el orden en que salen.</p>

    ${tarjetaPendientes(revision.pendientes)}

    <section class="tarjeta previa">
      <p class="previa__titulo">Así se ve en la ficha de producto</p>
      ${coloresHtml(colores)}
      <p class="ayuda previa__nota">La tipografía y los colores del texto los pone tu tema; aquí se ven los del panel.</p>
    </section>

    ${colores.map((c) => tarjetaColor(c, ordenables.indexOf(c), ordenables.length, hayNombreEn)).join('')}

    <section class="tarjeta">
      <label>Añadir un color</label>
      <div class="color__campos" style="margin-bottom:12px;">
        <div><input type="text" id="nuevo-nombre" placeholder="En español, p. ej. ROSADO" /></div>
        ${hayNombreEn ? '<div><input type="text" id="nuevo-nombre-en" placeholder="En inglés, p. ej. ROSE" /></div>' : ''}
        <div><input type="text" id="nueva-etiqueta" placeholder="Etiqueta, p. ej. oro-rosa" /></div>
        <div><input type="color" id="nueva-muestra" value="#cccccc" /></div>
      </div>
      <div class="acciones"><button class="principal" id="anadir-color">Añadir color</button></div>
    </section>
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

  pantalla.querySelectorAll('.tarjeta[data-id]').forEach((tarjeta) => {
    const id = tarjeta.dataset.id;
    const valor = (campo) => tarjeta.querySelector(`[data-campo="${campo}"]`)?.value.trim() ?? '';

    tarjeta.querySelector('[data-guardar]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Guardando…';
      try {
        const original = colores.find((c) => c.id === id);
        await guardarColor(id, {
          nombre: valor('nombre'),
          /* Sin el campo en la tienda no se manda: guardarColor lo trata como
           * "no existe" y no lo escribe, en vez de fallar el guardado entero. */
          nombreEn: hayNombreEn ? valor('nombre_en') : undefined,
          etiqueta: valor('etiqueta'),
          muestra: valor('muestra'),
          muestraOriginal: original?.muestra ? original.muestra : '#cccccc',
        });
        avisar('Color guardado');
        await pintarColores();
      } catch (error) {
        avisar(error.message, true);
        e.target.disabled = false;
        e.target.textContent = 'Guardar';
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        boton.disabled = true;
        try {
          await reordenar(id, boton.dataset.mover);
          await pintarColores();
        } catch (error) {
          avisar(error.message, true);
          boton.disabled = false;
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
    const nombre = document.getElementById('nuevo-nombre').value.trim();
    if (!nombre) { avisar('Ponle un nombre al color', true); return; }
    e.target.disabled = true;
    try {
      await crearColor({
        nombre,
        nombreEn: document.getElementById('nuevo-nombre-en')?.value.trim() ?? '',
        etiqueta: document.getElementById('nueva-etiqueta').value.trim(),
        muestra: document.getElementById('nueva-muestra').value,
      });
      avisar('Color añadido');
      await pintarColores();
    } catch (error) {
      avisar(error.message, true);
      e.target.disabled = false;
    }
  });

  /* La tarjeta de pendientes se pintaba en esta pantalla sin que nadie
   * escuchara su boton: pulsarlo no hacia nada. Las demas pantallas si lo
   * conectaban. */
  conectarPendientes(pintarColores);
}

/* Se ofrece donde el usuario se topa con el problema, no solo en la pantalla de
 * inicio: si falta un campo, el error aparece al guardar, y mandar a la persona
 * a buscar otro botón en otra pantalla es una forma de perderla. */
function tarjetaPendientes(pendientes, alTerminar) {
  if (!pendientes.length) return '';
  return `
    <section class="tarjeta" id="tarjeta-pendientes">
      <p><strong>Falta parte de la estructura en tu tienda.</strong> Se va a crear:</p>
      <ul>${pendientes.map((t) => `<li>${escapar(t)}</li>`).join('')}</ul>
      <p class="ayuda">Se puede pulsar las veces que haga falta: no duplica lo que ya existe.</p>
      <div class="acciones"><button class="principal" id="crear">Crear lo que falta</button></div>
    </section>`;
}

/* Lo mismo, para las pantallas que ya usan los componentes del admin: ahí no
 * es una tarjeta más, es un aviso, y va arriba del todo. El botón se llama
 * igual, así que lo conecta la misma función de abajo. */
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
        <section class="tarjeta tarjeta--pulsable" data-guia="${escapar(g.handle)}" role="button" tabindex="0">
          <h2 style="margin:0 0 4px;font-size:16px;">${escapar(g.nombre)}</h2>
          <p class="ayuda">${g.bloques.length} ${g.bloques.length === 1 ? 'bloque' : 'bloques'} · editar</p>
        </section>`).join('')
    : '';

  /* Solo se ofrece crear cuando la estructura existe: sin la definicion de
   * guias, Shopify rechazaria la entrada nueva. */
  const puedeCrear = hayDefiniciones && guias.length < TOPE_GUIAS;
  const nueva = !hayDefiniciones ? '' : puedeCrear
    ? `
      <section class="tarjeta">
        <label>Nueva guía</label>
        <div class="color__campos" style="margin-bottom:12px;">
          <div><input type="text" id="guia-nombre" placeholder="Nombre en español, p. ej. Aros" /></div>
          <div><input type="text" id="guia-nombre-en" placeholder="Nombre en inglés, p. ej. Earrings" /></div>
          <div><input type="text" id="guia-palabras" placeholder="Palabras clave, p. ej. aro, earring" /></div>
        </div>
        <p class="ayuda">
          Las palabras clave deciden qué productos la usan: basta con que una aparezca en el
          título, el tipo o las etiquetas. Pon también la palabra en inglés, que en /en/ el
          título va traducido. Nace sin bloques, así que no se ve en la tienda hasta que le
          añadas contenido.
        </p>
        <div class="acciones"><button class="principal" id="crear-guia">Crear guía</button></div>
      </section>`
    : `<p class="ayuda">Hay ${TOPE_GUIAS} guías, que es lo máximo que lee el panel.</p>`;

  /* En una tienda recien instalada las guias nacen vacias. Si hay una semilla
   * con el contenido de otra tienda, se ofrece copiarla. Solo cuando TODAS estan
   * vacias: asi no puede duplicar nada ni aparecer en la tienda de origen. */
  const semilla = hayDefiniciones && guias.length && guias.every((g) => !g.bloques.length)
    ? await cargarSemilla()
    : null;
  const totalSemilla = semilla ? semilla.guias.reduce((n, g) => n + g.bloques.length, 0) : 0;
  const copiar = semilla ? `
      <section class="tarjeta" id="tarjeta-copiar">
        <p><strong>Tus guías están vacías.</strong> Se puede copiar el contenido de ${escapar(semilla.origen)}:
          ${totalSemilla} bloques en ${semilla.guias.length} guías, con su orden y sus idiomas.</p>
        <p class="ayuda">Las imágenes se copian a esta tienda. Los enlaces a los PDF y los vídeos quedan como
          están. Después puedes cambiar cualquier bloque en el editor.</p>
        <div class="acciones"><button class="principal" id="copiar-guias">Copiar las guías de ${escapar(semilla.origen)}</button></div>
        <p class="ayuda" id="copiar-estado"></p>
      </section>` : '';

  pantalla.innerHTML = `
    <h1>Guías de tallas</h1>
    <p class="subtitulo">Cada guía se compone de bloques. Un bloque puede existir solo en un idioma.</p>
    ${tarjetaPendientes(porHacer)}
    ${copiar}
    ${listado}
    ${nueva}`;

  document.getElementById('copiar-guias')?.addEventListener('click', async (e) => {
    const estado = document.getElementById('copiar-estado');
    e.target.disabled = true;
    e.target.textContent = 'Copiando…';
    try {
      const informe = await importarGuias(semilla, { onPaso: (t) => { estado.textContent = t; } });
      avisar(informe.join(' · '));
      await pintarGuias();
    } catch (error) {
      avisar(error.message, true);
      estado.textContent = 'Se detuvo. Lo que alcanzó a copiarse está en cada guía; revisa antes de repetir.';
      e.target.disabled = false;
      e.target.textContent = 'Reintentar';
    }
  });

  pantalla.querySelectorAll('[data-guia]').forEach((t) => {
    const abrir = () => pintarEditor(t.dataset.guia);
    t.addEventListener('click', abrir);
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
    });
  });

  document.getElementById('crear-guia')?.addEventListener('click', async (e) => {
    const nombre = document.getElementById('guia-nombre').value.trim();
    const palabras = document.getElementById('guia-palabras').value.trim();
    if (!nombre) { avisar('Ponle un nombre a la guía', true); return; }
    /* Sin palabras clave la guia existe pero ningun producto la encuentra. Se
     * permite, porque se pueden poner despues en el editor, pero se avisa. */
    if (!palabras && !window.confirm('Sin palabras clave ningún producto usará esta guía hasta que se las pongas. ¿Crearla igual?')) return;
    e.target.disabled = true;
    e.target.textContent = 'Creando…';
    try {
      const creada = await crearGuia({
        nombre,
        nombreEn: document.getElementById('guia-nombre-en').value.trim(),
        palabras,
      });
      avisar(`Guía «${nombre}» creada`);
      /* Directo a su editor: una guia nueva solo sirve cuando tiene bloques. */
      await pintarEditor(creada.handle);
    } catch (error) {
      avisar(error.message, true);
      e.target.disabled = false;
      e.target.textContent = 'Crear guía';
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
  return `
    <section class="tarjeta" data-bloque="${escapar(b.id)}">
      <div class="bloque__cabecera">
        <span class="etiqueta-tipo">${escapar(NOMBRE_TIPO[b.tipo] ?? b.tipo)}</span>
        <div class="bloque__acciones">
          <button class="secundario" data-mover="arriba" ${i === 0 ? 'disabled' : ''} title="Subir">↑</button>
          <button class="secundario" data-mover="abajo" ${i === total - 1 ? 'disabled' : ''} title="Bajar">↓</button>
          <button class="secundario secundario--peligro" data-borrar title="Eliminar">Eliminar</button>
        </div>
      </div>

      ${esArchivo ? controlesArchivo(b) : ''}

      ${esVideo ? `
        <div style="margin-bottom:12px;">
          <label>URL del vídeo</label>
          <input type="text" data-campo="videoUrl" value="${escapar(b.videoUrl)}" placeholder="https://..." />
        </div>` : ''}

      ${esHtml ? '<p class="ayuda">Se publica tal cual en la ficha. Útil para tablas de medidas. Si no estás seguro, usa un bloque de Texto.</p>' : ''}

      <div class="bloque__idiomas">
        <div>
          <label>${etiquetaEs}</label>
          <textarea data-campo="textoEs" rows="${esHtml ? 8 : 4}" ${esHtml ? 'class="codigo" spellcheck="false"' : ''}>${escapar(b.textoEs)}</textarea>
          <label class="casilla"><input type="checkbox" data-campo="mostrarEs" ${b.mostrarEs ? 'checked' : ''} /> Mostrar en español</label>
        </div>
        <div>
          <label>${etiquetaEn}</label>
          <textarea data-campo="textoEn" rows="${esHtml ? 8 : 4}" ${esHtml ? 'class="codigo" spellcheck="false"' : ''}>${escapar(b.textoEn)}</textarea>
          <label class="casilla"><input type="checkbox" data-campo="mostrarEn" ${b.mostrarEn ? 'checked' : ''} /> Mostrar en inglés</label>
        </div>
      </div>

      <div class="acciones"><button class="principal" data-guardar-bloque>Guardar bloque</button></div>
    </section>`;
}

async function pintarEditor(handle) {
  pantalla.innerHTML = '<p class="cargando">Cargando la guía…</p>';

  const [guias, revision] = await Promise.all([cargarGuias(), revisarEstructura()]);
  const guia = guias.find((g) => g.handle === handle);
  if (!guia) { await pintarGuias(); return; }

  pantalla.innerHTML = `
    <button class="volver" id="volver">← Guías de tallas</button>
    <h1>${escapar(guia.nombre)}</h1>
    ${tarjetaPendientes(revision.pendientes)}
    <p class="subtitulo">
      Los bloques se muestran en la tienda en este orden. Cada uno puede existir
      solo en un idioma: desmarca la casilla del idioma donde no quieras que aparezca.
    </p>

    <section class="tarjeta">
      <div class="bloque__idiomas">
        <div>
          <label>Título en español</label>
          <input type="text" id="nombre-es" value="${escapar(guia.nombre)}" />
        </div>
        <div>
          <label>Título en inglés</label>
          <input type="text" id="nombre-en" value="${escapar(guia.nombreEn)}" placeholder="${escapar(guia.nombre)}" />
        </div>
      </div>
      <p class="ayuda">Es el encabezado de la ventana. Si dejas el inglés vacío, se usa el español.</p>

      <div style="margin-top:16px;">
        <label for="palabras">Productos que usan esta guía</label>
        <input type="text" id="palabras" value="${escapar(guia.palabras)}" placeholder="anillo, ring" />
        <p class="ayuda">
          Palabras separadas por comas. Un producto usa esta guía si alguna aparece en su
          tipo, su título o sus etiquetas. Así un producto nuevo la encuentra solo, sin
          tener que asignársela a mano.
        </p>
      </div>

      <div class="acciones">
        <button class="principal" id="guardar-titulo">Guardar</button>
        <button class="secundario" id="comprobar">Comprobar qué productos coinciden</button>
      </div>
    </section>

    <section class="tarjeta">
      <label for="nuevo-tipo">Añadir un bloque</label>
      <div class="acciones">
        <select id="nuevo-tipo">
          ${Object.entries(NOMBRE_TIPO).map(([v, n]) => `<option value="${v}">${escapar(n)}</option>`).join('')}
        </select>
        <button class="principal" id="anadir">Añadir</button>
      </div>
    </section>

    ${guia.puedeFaltarBloque ? '<p class="problema">Esta guía tiene 50 bloques o más y el panel muestra como máximo 50: puede que falte alguno. Conviene dividirla.</p>' : ''}

    <section class="tarjeta" id="informe" hidden></section>

    <section class="tarjeta previa">
      <div class="previa__cabecera">
        <p class="previa__titulo">Así lo ve el cliente</p>
        <div class="previa__idiomas">
          <button class="secundario is-activo" data-idioma="es">Español</button>
          <button class="secundario" data-idioma="en">Inglés</button>
        </div>
      </div>
      <div class="previa__lienzo" id="lienzo">${guiaHtml(guia, 'es')}</div>
      <p class="ayuda previa__nota" id="previa-resumen"></p>
    </section>

    ${guia.bloques.length
      ? guia.bloques.map((b, i) => tarjetaBloque(b, i, guia.bloques.length)).join('')
      : '<div class="vacio">Esta guía todavía no tiene bloques.</div>'}`;

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
    e.target.disabled = true;
    e.target.textContent = 'Revisando el catálogo…';
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
      e.target.disabled = false;
      e.target.textContent = 'Comprobar qué productos coinciden';
    }
  });

  document.getElementById('guardar-titulo').addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Guardando…';
    try {
      await guardarGuia(guia.id, {
        nombre: document.getElementById('nombre-es').value.trim(),
        nombreEn: document.getElementById('nombre-en').value.trim(),
        palabras: document.getElementById('palabras').value.trim(),
      });
      avisar('Guía guardada');
      await pintarEditor(handle);
    } catch (error) {
      avisar(error.message, true);
      e.target.disabled = false;
      e.target.textContent = 'Guardar título';
    }
  });

  document.getElementById('anadir').addEventListener('click', async (e) => {
    const tipo = document.getElementById('nuevo-tipo').value;
    e.target.disabled = true;
    try {
      await crearBloque(guia, tipo);
      await pintarEditor(handle);
      avisar('Bloque añadido');
    } catch (error) {
      avisar(error.message, true);
      e.target.disabled = false;
    }
  });

  pantalla.querySelectorAll('[data-bloque]').forEach((tarjeta) => {
    const id = tarjeta.dataset.bloque;
    const leer = (campo) => {
      const el = tarjeta.querySelector(`[data-campo="${campo}"]`);
      if (!el) return undefined;
      return el.type === 'checkbox' ? el.checked : el.value;
    };

    tarjeta.querySelector('[data-guardar-bloque]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Guardando…';
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
        e.target.disabled = false;
        e.target.textContent = 'Guardar bloque';
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

  const [config, revision, colores] = await Promise.all([
    leerConfig(), revisarEstructura(), cargarColores(),
  ]);

  const opcion = (v, actual, texto) =>
    `<option value="${v}" ${v === actual ? 'selected' : ''}>${texto}</option>`;

  pantalla.innerHTML = `
    <h1>Apariencia</h1>
    <p class="subtitulo">Vale para los tres bloques a la vez, y manda sobre los ajustes del editor de temas.</p>

    ${tarjetaPendientes(revision.pendientes)}

    <section class="tarjeta">
      <div class="color__campos">
        <div>
          <label for="alineacion">Alineación</label>
          <select id="alineacion">
            ${opcion('izquierda', config.alineacion, 'Izquierda')}
            ${opcion('centro', config.alineacion, 'Centro')}
            ${opcion('derecha', config.alineacion, 'Derecha')}
          </select>
        </div>
        <div>
          <label for="escala">Tamaño</label>
          <select id="escala">
            ${opcion('normal', config.escala, 'Normal — como saintvenik.cl')}
            ${opcion('compacto', config.escala, 'Compacto — más pequeño')}
          </select>
        </div>
        <div>
          <label for="tamano">Muestras de color: <span id="tamano-valor">${config.tamanoMuestra}</span> px</label>
          <input type="range" id="tamano" min="20" max="64" step="2" value="${config.tamanoMuestra}" />
        </div>
      </div>
      <div class="acciones"><button class="principal" id="guardar-apariencia">Guardar</button></div>
    </section>

    <section class="tarjeta previa">
      <p class="previa__titulo">Así se ve en la ficha</p>
      <div id="previa-apariencia"></div>
    </section>

    <section class="tarjeta">
      <p class="previa__titulo">Botón de la guía de tallas</p>
      <div class="bloque__idiomas">
        <div>
          <label for="boton-es">Texto en español</label>
          <input type="text" id="boton-es" value="${escapar(config.botonGuiaEs)}" placeholder="Guía de tallas" />
        </div>
        <div>
          <label for="boton-en">Texto en inglés</label>
          <input type="text" id="boton-en" value="${escapar(config.botonGuiaEn)}" placeholder="Size guide" />
        </div>
      </div>
      <p class="ayuda">Si lo dejas vacío se usa el texto por defecto en cada idioma.</p>
      <div class="acciones"><button class="principal" id="guardar-boton">Guardar</button></div>
    </section>`;

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
    e.target.disabled = true;
    e.target.textContent = 'Guardando…';
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
      e.target.disabled = false;
      e.target.textContent = 'Guardar';
    }
  });

  document.getElementById('guardar-boton').addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Guardando…';
    try {
      await guardarTextosBoton({
        es: document.getElementById('boton-es').value.trim(),
        en: document.getElementById('boton-en').value.trim(),
      });
      avisar('Guardado');
    } catch (error) {
      avisar(error.message, true);
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Guardar';
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

function tarjetaProducto(p, etiquetasColor) {
  const falta = sinHermano(p, etiquetasColor);
  const incoloro = sinColor(p, etiquetasColor);
  const hermanos = p.hermanos.length
    ? p.hermanos.map((h) => `
        <li>${escapar(h.titulo)}
          <button class="secundario secundario--peligro" data-desvincular="${escapar(h.id)}">Desvincular</button>
        </li>`).join('')
    : '';

  return `
    <section class="tarjeta" data-producto="${escapar(p.id)}">
      <div class="color">
        ${p.imagen ? `<img class="producto__foto" src="${escapar(p.imagen)}" alt="" />` : '<div class="producto__foto"></div>'}
        <div style="flex:1 1 auto;">
          <p class="producto__titulo">${escapar(p.titulo)}${p.activo ? '' : ' <span class="ayuda">(borrador)</span>'}</p>
          <p class="ayuda">${p.etiquetas.length ? escapar(p.etiquetas.join(', ')) : 'sin etiquetas'}</p>

          ${hermanos
            ? `<p class="ayuda" style="margin-top:8px;">Hermano de color:</p><ul class="producto__hermanos">${hermanos}</ul>`
            : `<p class="${falta || incoloro ? 'problema' : 'ayuda'}" style="margin-top:8px;">${
                falta
                  ? 'Tiene etiqueta de color pero no tiene hermano: en su ficha no aparecerá el selector.'
                  : incoloro
                    ? `No lleva la etiqueta de ningún color (${escapar(etiquetasColor.join(', ') || 'no hay colores')}): su propia muestra no puede dibujarse.`
                    : 'Sin hermano de color.'
              }</p>`}

          <div class="acciones">
            <input type="text" data-vincular-texto placeholder="Buscar el otro color por nombre…" />
            <button class="secundario" data-vincular-buscar>Buscar</button>
          </div>
          <div data-vincular-resultados></div>
        </div>
      </div>
    </section>`;
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
    <h1>Productos</h1>
    <p class="subtitulo">
      Aquí se dice qué producto es el mismo modelo en otro color. Es lo que hace
      aparecer el selector de color en la ficha, y se escribe siempre en los dos.
    </p>

    <section class="tarjeta">
      <div class="acciones acciones--envolver">
        <input type="text" id="buscar" value="${escapar(estadoProductos.texto)}" placeholder="Buscar por nombre…" />
        <button class="principal" id="buscar-boton">Buscar</button>
        <select id="filtro" aria-label="Filtrar productos">
          ${Object.entries(FILTROS).map(([valor, texto]) =>
            `<option value="${valor}" ${estadoProductos.filtro === valor ? 'selected' : ''}>${texto}</option>`).join('')}
        </select>
      </div>
      <p class="ayuda">${resumen}</p>
    </section>

    ${visibles.length
      ? visibles.map((p) => tarjetaProducto(p, etiquetasColor)).join('')
      : '<div class="vacio">Ningún producto coincide.</div>'}`;

  const buscar = () => {
    estadoProductos.texto = document.getElementById('buscar').value.trim();
    estadoProductos.filtro = document.getElementById('filtro').value;
    ir('productos');
  };
  document.getElementById('buscar-boton').addEventListener('click', buscar);
  document.getElementById('buscar').addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); });
  document.getElementById('filtro').addEventListener('change', buscar);

  pantalla.querySelectorAll('[data-producto]').forEach((tarjeta) => {
    const id = tarjeta.dataset.producto;
    const producto = productos.find((p) => p.id === id);

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
      const texto = tarjeta.querySelector('[data-vincular-texto]').value.trim();
      if (!texto) { avisar('Escribe el nombre del otro color', true); return; }
      e.target.disabled = true;
      try {
        const candidatos = (await buscarProductos(texto)).filter((c) => c.id !== id);
        caja.innerHTML = candidatos.length
          ? `<ul class="producto__hermanos">${candidatos.slice(0, 10).map((c) => `
              <li>${escapar(c.titulo)}
                <button class="secundario" data-elegir="${escapar(c.id)}">Vincular</button>
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
        e.target.disabled = false;
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

  const [colecciones, etiquetasTienda, revision, campos] = await Promise.all([
    cargarColecciones(), cargarEtiquetasDeTienda(), revisarEstructura(), camposDeEtiqueta(),
  ]);
  const faltaLoNuestro = revision.pendientes.some((p) => p.includes('insignias'));
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

  const opcionesIcono = (elegido) => ICONOS.map((i) => `
    <option value="${escapar(i.clave)}" ${i.clave === elegido ? 'selected' : ''}>${escapar(i.rotulo)}</option>
  `).join('');

  const muestras = () => beneficiosHtml(beneficios.filter((b) => b.activo));

  if (miPintado !== pintado) return;

  pantalla.innerHTML = `
    <h1>Beneficios</h1>
    <p class="subtitulo">Las ventajas que salen en la ficha, bajo el botón de compra. No son las mismas para todo: los brillantes no resisten el agua, así que ese beneficio no les alcanza y en su lugar llevan «Joyería fina».</p>

    ${tarjetaPendientes(revision.pendientes)}
    ${error ? `<p class="problema">${escapar(error)}</p>` : ''}

    <section class="tarjeta previa">
      <p class="previa__titulo">Así se ven en la ficha</p>
      <div id="previa-beneficios">${muestras()}</div>
      <p class="ayuda previa__nota">Aquí salen todos los activos juntos. En una ficha real solo salen los que alcanzan a ese producto, y como mucho los que diga el bloque (3 de fábrica).</p>
    </section>

    <p class="ayuda" data-aviso-recalculo hidden></p>

    ${hayPildora ? `
    <section class="tarjeta" id="pildora">
      <p class="previa__titulo">Píldoras sobre las fotos</p>
      <p class="ayuda">Así se ven sobre la foto de la ficha, de la segunda en adelante. La primera se deja limpia.</p>
      <div class="sobre-foto">
        <span class="sv-benef-foto sv-benef-foto--arriba-derecha" id="pildora-previa" style="position:static">
          <svg class="sv-benef__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3.2c3.1 3.4 5.2 6.1 5.2 8.7a5.2 5.2 0 1 1-10.4 0c0-2.6 2.1-5.3 5.2-8.7Z"/>
          </svg>
          <span>Resistente al agua y el sudor</span>
        </span>
      </div>
      <div class="color__campos">
        <div>
          <label>Se muestran</label>
          <label class="casilla"><input type="checkbox" id="p-activo" ${pildora.activo ? 'checked' : ''} /> Sobre las fotos de la ficha</label>
        </div>
        <div>
          <label>Esquina</label>
          <select id="p-esquina">
            <option value="arriba-derecha" ${pildora.esquina === 'arriba-derecha' ? 'selected' : ''}>Arriba a la derecha</option>
            <option value="abajo-izquierda" ${pildora.esquina === 'abajo-izquierda' ? 'selected' : ''}>Abajo a la izquierda</option>
          </select>
        </div>
        <div>
          <label>Cuántas fotos</label>
          <input type="number" id="p-cuantas" value="${pildora.cuantas}" min="1" max="5" step="1" />
        </div>
        <div><label>Fondo</label><input type="color" id="p-fondo" value="${escapar(pildora.fondo)}" /></div>
        <div><label>Texto e icono</label><input type="color" id="p-texto" value="${escapar(pildora.texto)}" /></div>
        <div><label>Borde</label><input type="color" id="p-borde" value="${escapar(pildora.borde)}" /></div>
        <div>
          <label>Grosor del borde</label>
          <input type="number" id="p-grosor" value="${pildora.grosor}" min="0" max="6" step="1" />
          <p class="ayuda">0 = sin borde.</p>
        </div>
        <div>
          <label>Opacidad</label>
          <input type="number" id="p-opacidad" value="${pildora.opacidad}" min="10" max="100" step="5" />
        </div>
        <div><label>Redondeo</label><input type="number" id="p-radio" value="${pildora.radio}" min="0" max="20" step="1" /></div>
        <div><label>Tamaño del texto</label><input type="number" id="p-letra" value="${pildora.letra}" min="9" max="16" step="1" /></div>
        <div><label>Separación del borde</label><input type="number" id="p-margen" value="${pildora.margen}" min="0" max="24" step="2" /></div>
      </div>
      <div class="acciones"><button class="principal" id="guardar-pildora">Guardar</button></div>
    </section>` : ''}

    ${beneficios.length ? '' : `
      <section class="tarjeta">
        <p>Todavía no hay ningún beneficio. Si acabas de instalar la app, pulsa «Crear lo que falta» y aparecerán los cuatro de siempre listos para asignar.</p>
      </section>`}

    ${beneficios.map((b, i) => `
      <section class="tarjeta" data-id="${escapar(b.id)}">
        <div class="cabecera-fila">
          <div class="sv-benef sv-benef--pildora sv-benef--fila sv-benef--normal" style="--sv-pt:0px;--sv-pb:0px;">
            <ul class="sv-benef__lista" role="list">
              <li class="sv-benef__item" data-previa>
                <span data-previa-icono>${iconoHtml(b)}</span>
                <span class="sv-benef__texto" data-previa-texto>${escapar(b.nombre || 'Sin texto')}</span>
              </li>
            </ul>
          </div>
          <div class="bloque__acciones">
            <button class="secundario" data-mover="arriba" ${i === 0 ? 'disabled' : ''} title="Subir">↑</button>
            <button class="secundario" data-mover="abajo" ${i === beneficios.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
          </div>
        </div>
        <div class="color__campos">
          <div>
            <label>Texto en español</label>
            <input type="text" data-campo="nombre" value="${escapar(b.nombre)}" />
          </div>
          <div>
            <label>Texto en inglés</label>
            <input type="text" data-campo="nombre_en" value="${escapar(b.nombreEn)}" placeholder="Vacío: se usa el español" />
          </div>
          <div>
            <label>Icono</label>
            <select data-campo="icono">
              <option value="">Sin icono</option>
              ${opcionesIcono(b.icono)}
            </select>
            <p class="ayuda">${b.iconoImagenUrl
              ? 'Hay una imagen subida, y la imagen manda sobre este icono.'
              : 'Sigue al color del texto de la píldora.'}</p>
          </div>
          ${haySubida ? `
          <div>
            <label>Icono propio</label>
            <div class="acciones acciones--envolver">
              <label class="secundario como-boton">
                Subir…<input type="file" accept="image/png,image/webp,image/svg+xml" data-subir hidden />
              </label>
              ${hayBiblioteca() ? '<button class="secundario" data-biblioteca>Elegir de la biblioteca</button>' : ''}
              ${b.iconoImagenUrl ? '<button class="secundario secundario--peligro" data-quitar-imagen>Quitar</button>' : ''}
            </div>
            <p class="ayuda" data-estado-imagen>${b.iconoImagenUrl
              ? 'Las imágenes se muestran con sus propios colores.'
              : 'PNG, WebP o SVG, cuadrado y pequeño (96×96, fondo transparente).'}</p>
          </div>` : ''}
          <div>
            <label>Se muestra</label>
            <label class="casilla"><input type="checkbox" data-campo="activo" ${b.activo ? 'checked' : ''} /> Activo en la tienda</label>
          </div>
        </div>
        ${asignacionHtml(b)}
        <div class="acciones">
          <button class="principal" data-guardar>Guardar</button>
          <button class="secundario secundario--peligro" data-borrar>Eliminar</button>
        </div>
      </section>`).join('')}

    <section class="tarjeta">
      <label>Añadir un beneficio</label>
      <div class="color__campos" style="margin-bottom:12px;">
        <div><input type="text" id="nuevo-beneficio-nombre" placeholder="En español, p. ej. Envío gratis" /></div>
        <div><input type="text" id="nuevo-beneficio-nombre-en" placeholder="En inglés, p. ej. Free shipping" /></div>
        <div>
          <label>Icono</label>
          <select id="nuevo-beneficio-icono">
            <option value="">Sin icono</option>
            ${opcionesIcono('')}
          </select>
        </div>
      </div>
      <div class="acciones"><button class="principal" id="anadir-beneficio">Añadir beneficio</button></div>
      <p class="ayuda">Se crea vacío: no aparece en ninguna ficha hasta que le digas a qué productos alcanza.</p>
    </section>
  `;

  const refrescarMuestras = () => {
    document.getElementById('previa-beneficios').innerHTML = muestras();
  };

  /* Los ajustes de la píldora se ven en la muestra mientras se tocan, y sobre
   * un fondo con damero: una píldora blanca al 50 % sobre el gris del panel se
   * ve casi igual que al 100 %, y en la tienda va sobre una foto. */
  const comoQuedaLaPildora = () => ({
    activo: document.getElementById('p-activo').checked,
    esquina: document.getElementById('p-esquina').value,
    cuantas: Number(document.getElementById('p-cuantas').value || 3),
    fondo: document.getElementById('p-fondo').value,
    texto: document.getElementById('p-texto').value,
    borde: document.getElementById('p-borde').value,
    grosor: Number(document.getElementById('p-grosor').value || 0),
    opacidad: Number(document.getElementById('p-opacidad').value || 100),
    radio: Number(document.getElementById('p-radio').value || 7),
    letra: Number(document.getElementById('p-letra').value || 12),
    margen: Number(document.getElementById('p-margen').value || 10),
  });

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
    document.getElementById('pildora').querySelectorAll('input, select').forEach((c) => {
      c.addEventListener('input', refrescarPildora);
      c.addEventListener('change', refrescarPildora);
    });
    refrescarPildora();
  }

  document.getElementById('guardar-pildora')?.addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Guardando…';
    try {
      await guardarPildora(comoQuedaLaPildora());
      avisar('Aspecto de las píldoras guardado');
    } catch (error2) {
      avisar(error2.message, true);
    } finally {
      e.target.disabled = false;
      e.target.textContent = 'Guardar';
    }
  });

  const conexiones = new Map();

  pantalla.querySelectorAll('.tarjeta[data-id]').forEach((tarjeta) => {
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

    const valor = (campo) => tarjeta.querySelector(`[data-campo="${campo}"]`)?.value.trim() ?? '';

    const refrescar = () => {
      tarjeta.querySelector('[data-previa-texto]').textContent = valor('nombre') || 'Sin texto';
      /* Si hay imagen subida manda ella, igual que en la tienda: cambiar el
       * desplegable no debe dejar la muestra sin icono. */
      tarjeta.querySelector('[data-previa-icono]').innerHTML = original.iconoImagenUrl
        ? iconoHtml(original)
        : svgIcono(valor('icono'), 'sv-benef__icono');
    };
    tarjeta.querySelector('[data-campo="nombre"]').addEventListener('input', refrescar);
    tarjeta.querySelector('[data-campo="icono"]').addEventListener('change', refrescar);

    tarjeta.querySelector('[data-guardar]').addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Guardando…';
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
        e.target.disabled = false;
        e.target.textContent = 'Guardar';
      }
    });

    tarjeta.querySelectorAll('[data-mover]').forEach((boton) => {
      boton.addEventListener('click', async () => {
        pase.vivo = false;
        boton.disabled = true;
        try {
          await moverEntrada(beneficios, id, boton.dataset.mover, guardarBeneficio);
          await ir('beneficios');
        } catch (error2) {
          avisar(error2.message, true);
          boton.disabled = false;
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
      e.target.disabled = true;
      try {
        await borrarBeneficio(id);
        avisar('Beneficio eliminado');
        await ir('beneficios');
      } catch (error2) {
        avisar(error2.message, true);
        e.target.disabled = false;
      }
    });
  });

  document.getElementById('anadir-beneficio')?.addEventListener('click', async (e) => {
    const nombre = document.getElementById('nuevo-beneficio-nombre').value.trim();
    if (!nombre) { avisar('Escribe el texto del beneficio.', true); return; }
    e.target.disabled = true;
    try {
      await crearBeneficio({
        nombre,
        nombreEn: document.getElementById('nuevo-beneficio-nombre-en').value.trim(),
        icono: document.getElementById('nuevo-beneficio-icono').value,
        orden: beneficios.length + 1,
      }, beneficios.length);
      avisar('Beneficio creado');
      await ir('beneficios');
    } catch (error2) {
      avisar(error2.message, true);
      e.target.disabled = false;
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

const PANTALLAS = {
  colores: pintarColores,
  productos: pintarProductos,
  etiquetas: pintarEtiquetas,
  beneficios: pintarBeneficios,
  guias: pintarGuias,
  apariencia: pintarApariencia,
};

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
