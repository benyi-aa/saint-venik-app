/* Saint Venik · Panel de la app. Sin framework ni paso de compilacion: son
 * archivos estaticos que el admin de Shopify carga embebidos. */
import { estaEmbebida } from './api.js?v=202609160410';
import { cargarColores, guardarColor, problemasDe } from './colores.js?v=202609160410';
import {
  estadoEstructura, crearEstructura, cargarGuias, GUIAS_INICIALES,
  crearBloque, guardarBloque, borrarBloque, moverBloque, NOMBRE_TIPO,
} from './guias.js?v=202609160410';
import { guiaHtml, coloresHtml, visible } from './vista-previa.js?v=202609160410';

/* La version sale de la URL con la que se cargo este archivo, no de una
 * constante escrita a mano: asi lo que se muestra es siempre lo que el navegador
 * tiene de verdad, aunque haya servido algo de cache. */
const VERSION = new URL(import.meta.url).searchParams.get('v') ?? 'local';

const pantalla = document.getElementById('pantalla');
const aviso = document.getElementById('aviso');
let temporizadorAviso = null;

function avisar(texto, esError = false) {
  aviso.textContent = texto;
  aviso.classList.toggle('is-error', esError);
  aviso.hidden = false;
  clearTimeout(temporizadorAviso);
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

function tarjetaColor(color) {
  const problemas = problemasDe(color);
  return `
    <section class="tarjeta" data-id="${escapar(color.id)}">
      <div class="color">
        <div class="color__muestra" style="${fondoDe(color)}"></div>
        <div class="color__campos">
          <div>
            <label for="nombre-${escapar(color.handle)}">Nombre visible</label>
            <input type="text" id="nombre-${escapar(color.handle)}" data-campo="nombre" value="${escapar(color.nombre)}" />
            <p class="ayuda">Lo que ve el cliente. Se traduce en Translate &amp; Adapt.</p>
          </div>
          <div>
            <label for="etiqueta-${escapar(color.handle)}">Etiqueta del producto</label>
            <input type="text" id="etiqueta-${escapar(color.handle)}" data-campo="etiqueta" value="${escapar(color.etiqueta)}" />
            <p class="ayuda">Los productos con esta etiqueta se muestran en este color.</p>
          </div>
        </div>
      </div>
      ${problemas.map((p) => `<p class="problema">${escapar(p)}</p>`).join('')}
      <div class="acciones">
        <button class="principal" data-guardar>Guardar</button>
      </div>
    </section>
  `;
}

async function pintarColores() {
  pantalla.innerHTML = '<p class="cargando">Cargando colores…</p>';

  const colores = await cargarColores();

  if (!colores.length) {
    pantalla.innerHTML = '<div class="vacio">Todavía no hay colores.</div>';
    return;
  }

  pantalla.innerHTML = `
    <h1>Colores</h1>
    <p class="subtitulo">Cada color es una muestra en la ficha de producto. Un producto se asocia a su color por la etiqueta.</p>
    <section class="tarjeta previa">
      <p class="previa__titulo">Así se ve en la ficha de producto</p>
      ${coloresHtml(colores)}
      <p class="ayuda previa__nota">La tipografía y los colores del texto los pone tu tema; aquí se ven los del panel.</p>
    </section>
    ${colores.map(tarjetaColor).join('')}
  `;

  pantalla.querySelectorAll('[data-guardar]').forEach((boton) => {
    boton.addEventListener('click', async () => {
      const tarjeta = boton.closest('.tarjeta');
      const valor = (campo) => tarjeta.querySelector(`[data-campo="${campo}"]`).value.trim();

      boton.disabled = true;
      boton.textContent = 'Guardando…';
      try {
        await guardarColor(tarjeta.dataset.id, { nombre: valor('nombre'), etiqueta: valor('etiqueta') });
        avisar('Color guardado');
      } catch (error) {
        avisar(error.message, true);
      } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar';
      }
    });
  });
}

async function pintarGuias() {
  pantalla.innerHTML = '<p class="cargando">Comprobando la estructura…</p>';

  const estado = await estadoEstructura();
  const hayDefiniciones = Boolean(estado.bloque && estado.guia);
  const guias = hayDefiniciones ? await cargarGuias() : [];
  const faltan = GUIAS_INICIALES.filter((g) => !guias.some((x) => x.handle === g.handle));

  /* La estructura son dos cosas: las definiciones y las guías. Mirar solo las
   * definiciones dejaba la pantalla vacía y sin salida cuando existían las
   * primeras pero no las segundas. */
  const completa = hayDefiniciones && faltan.length === 0;

  const listado = guias.length
    ? guias.map((g) => `
        <section class="tarjeta tarjeta--pulsable" data-guia="${escapar(g.handle)}" role="button" tabindex="0">
          <h2 style="margin:0 0 4px;font-size:16px;">${escapar(g.nombre)}</h2>
          <p class="ayuda">${g.bloques.length} ${g.bloques.length === 1 ? 'bloque' : 'bloques'} · editar</p>
        </section>`).join('')
    : '';

  const pendientes = [];
  if (!hayDefiniciones) pendientes.push('Los tipos de contenido donde se guardan las guías.');
  for (const g of faltan) pendientes.push(`La guía «${g.nombre}».`);

  const tarjetaSetup = completa ? '' : `
    <section class="tarjeta">
      <p><strong>Falta parte de la estructura.</strong> Se va a crear:</p>
      <ul>${pendientes.map((t) => `<li>${escapar(t)}</li>`).join('')}</ul>
      <p class="ayuda">Se puede pulsar las veces que haga falta: no duplica lo que ya existe.</p>
      <div class="acciones"><button class="principal" id="crear">Crear lo que falta</button></div>
    </section>`;

  pantalla.innerHTML = `
    <h1>Guías de tallas</h1>
    <p class="subtitulo">Cada guía se compone de bloques. Un bloque puede existir solo en un idioma.</p>
    ${tarjetaSetup}
    ${listado}`;

  pantalla.querySelectorAll('[data-guia]').forEach((t) => {
    const abrir = () => pintarEditor(t.dataset.guia);
    t.addEventListener('click', abrir);
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
    });
  });

  const boton = document.getElementById('crear');
  if (!boton) return;

  boton.addEventListener('click', async () => {
    boton.disabled = true;
    boton.textContent = 'Creando…';
    try {
      const pasos = await crearEstructura();
      avisar(pasos.length ? pasos.join(' · ') : 'Ya estaba todo creado');
      await pintarGuias();
    } catch (error) {
      avisar(error.message, true);
      boton.disabled = false;
      boton.textContent = 'Crear lo que falta';
    }
  });
}

function tarjetaBloque(b, i, total) {
  const esVideo = b.tipo === 'video';
  const esArchivo = b.tipo === 'imagen' || b.tipo === 'pdf';
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

      ${esArchivo ? `<p class="problema">Los bloques de ${escapar(NOMBRE_TIPO[b.tipo])} todavía no se pueden editar aquí. Siguiente paso.</p>` : ''}

      ${esVideo ? `
        <div style="margin-bottom:12px;">
          <label>URL del vídeo</label>
          <input type="text" data-campo="videoUrl" value="${escapar(b.videoUrl)}" placeholder="https://..." />
        </div>` : ''}

      <div class="bloque__idiomas">
        <div>
          <label>Texto en español</label>
          <textarea data-campo="textoEs" rows="4">${escapar(b.textoEs)}</textarea>
          <label class="casilla"><input type="checkbox" data-campo="mostrarEs" ${b.mostrarEs ? 'checked' : ''} /> Mostrar en español</label>
        </div>
        <div>
          <label>Texto en inglés</label>
          <textarea data-campo="textoEn" rows="4">${escapar(b.textoEn)}</textarea>
          <label class="casilla"><input type="checkbox" data-campo="mostrarEn" ${b.mostrarEn ? 'checked' : ''} /> Mostrar en inglés</label>
        </div>
      </div>

      <div class="acciones"><button class="principal" data-guardar-bloque>Guardar bloque</button></div>
    </section>`;
}

async function pintarEditor(handle) {
  pantalla.innerHTML = '<p class="cargando">Cargando la guía…</p>';

  const guias = await cargarGuias();
  const guia = guias.find((g) => g.handle === handle);
  if (!guia) { await pintarGuias(); return; }

  pantalla.innerHTML = `
    <button class="volver" id="volver">← Guías de tallas</button>
    <h1>${escapar(guia.nombre)}</h1>
    <p class="subtitulo">
      Los bloques se muestran en la tienda en este orden. Cada uno puede existir
      solo en un idioma: desmarca la casilla del idioma donde no quieras que aparezca.
    </p>

    <section class="tarjeta">
      <label for="nuevo-tipo">Añadir un bloque</label>
      <div class="acciones">
        <select id="nuevo-tipo">
          ${Object.entries(NOMBRE_TIPO).map(([v, n]) => `<option value="${v}">${escapar(n)}</option>`).join('')}
        </select>
        <button class="principal" id="anadir">Añadir</button>
      </div>
    </section>

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

  function pintarPrevia(idioma) {
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
        await guardarBloque(id, {
          tipo: original.tipo,
          textoEs: leer('textoEs'),
          textoEn: leer('textoEn'),
          videoUrl: leer('videoUrl'),
          mostrarEs: leer('mostrarEs'),
          mostrarEn: leer('mostrarEn'),
        });
        avisar('Bloque guardado');
      } catch (error) {
        avisar(error.message, true);
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Guardar bloque';
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

const PANTALLAS = {
  colores: pintarColores,
  guias: pintarGuias,
  apariencia: async () => {
    pantalla.innerHTML = '<h1>Apariencia</h1><div class="vacio">En construcción.</div>';
  },
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
