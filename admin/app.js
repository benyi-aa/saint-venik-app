/* Saint Venik · Panel de la app. Sin framework ni paso de compilacion: son
 * archivos estaticos que el admin de Shopify carga embebidos. */
import { estaEmbebida } from './api.js?v=202609162214';
import {
  cargarColores, guardarColor, crearColor, borrarColor, problemasDe, ordenarComoLaTienda,
  guardarImagenColor, camposDeColor,
} from './colores.js?v=202609162214';
import { leerConfig, guardarOrdenColores, guardarTextosBoton, guardarApariencia } from './config.js?v=202609162214';
import {
  buscarProductos, todosLosProductos, vincular, desvincular, sinHermano, sinColor,
} from './productos.js?v=202609162214';
import { subirArchivo, elegirDeBiblioteca, hayBiblioteca } from './archivos.js?v=202609162214';
import {
  estadoEstructura, revisarEstructura, crearEstructura, cargarGuias, GUIAS_INICIALES,
  crearBloque, guardarBloque, borrarBloque, moverBloque, guardarGuia, guardarArchivoDeBloque, NOMBRE_TIPO,
  revisarReparto, crearGuia, TOPE_GUIAS,
} from './guias.js?v=202609162214';
import { guiaHtml, coloresHtml, visible } from './vista-previa.js?v=202609162214';

/* La sella scripts/version.mjs al publicar. No se deduce de la URL porque ahora
 * la URL lleva un sello por minuto para saltarse la cache, no la version. */
const VERSION = '202609162214';

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

  pantalla.innerHTML = `
    <h1>Guías de tallas</h1>
    <p class="subtitulo">Cada guía se compone de bloques. Un bloque puede existir solo en un idioma.</p>
    ${tarjetaPendientes(porHacer)}
    ${listado}
    ${nueva}`;

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
            ${opcion('compacto', config.escala, 'Compacto')}
            ${opcion('normal', config.escala, 'Normal')}
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

const PANTALLAS = {
  colores: pintarColores,
  productos: pintarProductos,
  guias: pintarGuias,
  apariencia: pintarApariencia,
};

async function ir(nombre) {
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
