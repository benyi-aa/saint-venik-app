/* Saint Venik · Panel de la app. Sin framework ni paso de compilacion: son
 * archivos estaticos que el admin de Shopify carga embebidos. */
import { estaEmbebida } from './api.js';
import { cargarColores, guardarColor, problemasDe } from './colores.js';
import { estadoEstructura, crearEstructura, cargarGuias } from './guias.js';

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

  if (!estado.bloque || !estado.guia) {
    pantalla.innerHTML = `
      <h1>Guías de tallas</h1>
      <p class="subtitulo">
        Todavía no existe la estructura donde se guardan las guías. Se crea una vez
        y queda en tu tienda: dos tipos de contenido y las tres guías vacías,
        listas para escribir dentro.
      </p>
      <section class="tarjeta">
        <p>Se van a crear:</p>
        <ul>
          <li><strong>Bloque de guía de tallas</strong> — texto, imagen, vídeo o PDF, con versión en español y en inglés y una casilla de visibilidad por idioma.</li>
          <li><strong>Guía de tallas</strong> — con sus bloques en orden.</li>
          <li>Las tres guías: Anillos, Cadenas y colgantes, Pulseras.</li>
        </ul>
        <div class="acciones"><button class="principal" id="crear">Crear estructura</button></div>
      </section>`;

    document.getElementById('crear').addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Creando…';
      try {
        const pasos = await crearEstructura();
        avisar(pasos.length ? pasos.join(' · ') : 'Ya estaba todo creado');
        await pintarGuias();
      } catch (error) {
        avisar(error.message, true);
        e.target.disabled = false;
        e.target.textContent = 'Crear estructura';
      }
    });
    return;
  }

  const guias = await cargarGuias();
  pantalla.innerHTML = `
    <h1>Guías de tallas</h1>
    <p class="subtitulo">Cada guía se compone de bloques. Un bloque puede existir solo en un idioma.</p>
    ${guias.map((g) => `
      <section class="tarjeta">
        <h2 style="margin:0 0 4px;font-size:16px;">${escapar(g.nombre)}</h2>
        <p class="ayuda">${g.bloques.length} ${g.bloques.length === 1 ? 'bloque' : 'bloques'}</p>
      </section>`).join('')}`;
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
