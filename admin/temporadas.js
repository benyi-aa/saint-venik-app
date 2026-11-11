/* Saint Venik · Pestaña «Temporadas» (pedido del usuario, 10-nov).
 *
 * Una temporada es una «apariencia» de la tienda: sus fotos (pestaña Fotos,
 * archivos sv-<clave>-…) y los textos de tres piezas del tema: la barra de
 * arriba con la cuenta regresiva, el bloque «3X2» de las colecciones y la caja
 * de oferta de los productos. Normal y Navidad existen siempre; las demás se
 * crean aquí.
 *
 * Dónde vive: en sv_configuracion_2, «temporada» es la clave de la activa y
 * «temporadas» un JSON { clave: { nombre, barra_titulo, … } }. Lo lee
 * snippets/sv-temporada.liquid del tema (scripts/tema/temporadas.py) y las
 * fotos las cambian sv-portada / sv-inicio de la extensión.
 * Un campo vacío en una temporada = el de Normal; vacío en Normal = el texto
 * que tenía el tema (TEXTOS_DE_HOY). Ver docs/temporadas.md. */
import { leerTemporadas, guardarTemporadas, guardarTemporadaActiva } from './config.js?v=202611111236';

export { leerTemporadas, guardarTemporadas, guardarTemporadaActiva };

/* Las que existen siempre. */
export const FIJAS = { normal: 'Normal', navidad: 'Navidad' };

/* Claves que chocarían con los nombres de las fotos normales (sv-inicio-…,
 * sv-portada-…, sv-menu-…, sv-regalo-…) o con el ajuste del tema. */
const RESERVADAS = new Set(['normal', 'navidad', 'inicio', 'portada', 'menu', 'regalo', 'coleccion', 'panel', 'vista']);

export function claveDe(nombre) {
  return String(nombre ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

export function validarClave(clave, datos) {
  if (!clave) return 'Escribe un nombre con letras o números.';
  if (RESERVADAS.has(clave) || datos[clave]) return `Ya hay una temporada «${clave}» o es un nombre reservado. Prueba con otro.`;
  return '';
}

/* Lista ordenada: Normal, Navidad y luego las creadas. */
export function listaDe(datos) {
  const l = Object.entries(FIJAS).map(([clave, nombre]) => ({ clave, nombre: datos[clave]?.nombre || nombre, fija: true }));
  for (const [clave, v] of Object.entries(datos)) {
    if (!FIJAS[clave] && v && typeof v === 'object') l.push({ clave, nombre: v.nombre || clave, fija: false });
  }
  return l;
}

export const PARTES = [
  {
    clave: 'barra',
    titulo: 'Barra de arriba con cuenta regresiva',
    texto: 'La franja con el reloj que sale arriba de todas las páginas. Toda la barra lleva al enlace.',
    campos: [
      { k: 'barra_activa', tipo: 'mostrar' },
      { k: 'barra_titulo', tipo: 'texto', etiqueta: 'Texto', en: true },
      { k: 'barra_boton', tipo: 'texto', etiqueta: 'Texto del botón', en: true },
      { k: 'barra_enlace', tipo: 'texto', etiqueta: 'Enlace', ayuda: 'Una página de la tienda, por ejemplo /collections/best-sellers o /collections/sale.' },
      { k: 'barra_fin', tipo: 'fecha', etiqueta: 'La cuenta termina', ayuda: 'Vacío: cuenta hasta las 23:59 de cada día y vuelve a empezar (como hoy). Con fecha y hora: cuenta hasta ese momento y luego la barra se esconde sola. Esta no se copia de Normal.' },
      { k: 'barra_fondo', tipo: 'color', etiqueta: 'Fondo' },
      { k: 'barra_letra', tipo: 'color', etiqueta: 'Letra' },
      { k: 'barra_boton_fondo', tipo: 'color', etiqueta: 'Botón' },
      { k: 'barra_boton_letra', tipo: 'color', etiqueta: 'Letra del botón' },
    ],
  },
  {
    clave: 'bloque',
    titulo: 'Bloque «3X2» de las colecciones',
    texto: 'La franja de color arriba de los productos en Cadenas, Pulseras, Anillos, Colgantes, Best Sellers y las demás colecciones.',
    campos: [
      { k: 'bloque_activo', tipo: 'mostrar' },
      { k: 'bloque_titulo', tipo: 'texto', etiqueta: 'Título', en: true },
      { k: 'bloque_texto', tipo: 'texto', etiqueta: 'Texto', en: true },
      { k: 'bloque_fondo', tipo: 'color', etiqueta: 'Fondo' },
      { k: 'bloque_letra', tipo: 'color', etiqueta: 'Letra', ayuda: 'Vacío: los dos cafés de siempre.' },
    ],
  },
  {
    clave: 'oferta',
    titulo: 'Caja de oferta en los productos',
    texto: 'El recuadro debajo del botón de compra, en la ficha de cada producto.',
    campos: [
      { k: 'oferta_activa', tipo: 'mostrar' },
      { k: 'oferta_nombre', tipo: 'texto', etiqueta: 'Nombre de la oferta', en: true },
      { k: 'oferta_etiqueta', tipo: 'texto', etiqueta: 'Etiqueta', en: true },
      { k: 'oferta_principal', tipo: 'texto', etiqueta: 'Texto grande', en: true },
      { k: 'oferta_texto', tipo: 'texto', etiqueta: 'Texto chico', en: true },
      { k: 'oferta_fondo', tipo: 'color', etiqueta: 'Fondo' },
      { k: 'oferta_etiqueta_fondo', tipo: 'color', etiqueta: 'Fondo de la etiqueta' },
      { k: 'oferta_letra', tipo: 'color', etiqueta: 'Letra', ayuda: 'Vacío: negro y gris, como siempre.' },
    ],
  },
];

export const CAMPOS = PARTES.flatMap((p) => p.campos.flatMap((c) => (c.en ? [c.k, `${c.k}_en`] : [c.k])));

const COLORES = {
  barra_fondo: '#000000', barra_letra: '#ffffff', barra_boton_fondo: '#c8102e', barra_boton_letra: '#ffffff',
  bloque_fondo: '#e2d8ce', oferta_fondo: '#e5d9cc', oferta_etiqueta_fondo: '#631d29',
};

/* Lo que mostraba el tema antes de esto (scripts/tema/temporadas.py tiene lo mismo). */
const TEXTOS = {
  cl: {
    barra_titulo: 'VIP BLACK FRIDAY: 3X2 + HASTA 60% OFF', barra_boton: 'COMPRAR AHORA',
    bloque_titulo: '3X2 EN TODO', bloque_texto: 'AÑADE 3 JOYAS AL CARRITO Y 1 ES GRATIS',
    oferta_nombre: 'BLACK FRIDAY', oferta_etiqueta: 'AGOTÁNDOSE RÁPIDO', oferta_principal: '3X2 + HASTA 60% OFF',
    oferta_texto: 'Aprovecha nuestra mayor oferta del año mientras duran las existencias.',
  },
  com: {
    barra_titulo: 'BLACK FRIDAY: 3X2 + HASTA 75% OFF', barra_titulo_en: 'BLACK FRIDAY: BUY 2, GET 1 FREE + UP TO 75% OFF',
    barra_boton: 'VER REBAJAS', barra_boton_en: 'SHOP THE SALE',
    bloque_titulo: '3X2 EN TODO', bloque_titulo_en: 'BUY 2, GET 1 FREE',
    bloque_texto: 'AÑADE 3 JOYAS AL CARRITO Y 1 ES GRATIS', bloque_texto_en: 'ADD 3 PIECES TO YOUR CART — THE LOWEST PRICED ONE IS FREE',
    oferta_nombre: 'BLACK FRIDAY', oferta_nombre_en: 'BLACK FRIDAY',
    oferta_etiqueta: 'AGOTÁNDOSE RÁPIDO', oferta_etiqueta_en: 'SELLING OUT FAST',
    oferta_principal: '3X2 + HASTA 75% OFF', oferta_principal_en: '3 FOR 2 + UP TO 75% OFF',
    oferta_texto: 'Aprovecha nuestra mayor oferta del año mientras duran las existencias.',
    oferta_texto_en: 'Take advantage of our biggest offer of the year while supplies last.',
  },
};

/* saintvenik.com (vd9tn0-et) tiene inglés; saintvenik.cl no. */
export const conIngles = (tienda) => /^vd9tn0-et\./.test(tienda || '');

export function textosDeHoy(tienda) {
  const t = conIngles(tienda) ? TEXTOS.com : TEXTOS.cl;
  return { barra_activa: 'si', bloque_activo: 'si', oferta_activa: 'si', barra_enlace: '/collections/best-sellers', ...COLORES, ...t };
}

/* Lo que se ve con esa temporada: el suyo, si no el de Normal, si no el de hoy.
 * La fecha de término no se hereda. */
export function efectivo(datos, clave, campo, tienda) {
  const propio = datos[clave]?.[campo];
  if (propio) return propio;
  if (campo === 'barra_fin') return '';
  return datos.normal?.[campo] || textosDeHoy(tienda)[campo] || '';
}

/* datetime-local (hora de este computador) <-> ISO en UTC, que es lo que guarda. */
export function aLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function aUtc(local) {
  if (!local) return '';
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export const colorValido = (v) => (/^#[0-9a-f]{6}$/i.test(String(v || '').trim()) ? String(v).trim().toLowerCase() : '');

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sinGuion = (t) => (t === '-' ? '' : t);

/* Cómo se ve cada pieza (aproximado, con el CSS de app.css). `v(campo)` da el
 * valor efectivo. */
export function vistaPrevia(parte, v, ingles = false) {
  const t = (k) => sinGuion(ingles ? v(`${k}_en`) : v(k));
  if (parte === 'barra') {
    if (v('barra_activa') === 'no') return '<p class="ayuda">No se muestra.</p>';
    const le = v('barra_letra');
    const uni = (ingles ? ['Days', 'Hours', 'Min', 'Sec'] : ['Días', 'Horas', 'Min', 'Seg'])
      .map((u, i) => `<span class="tv-barra__u"><b>${['02', '14', '37', '05'][i]}</b><small>${u}</small></span>`).join('<span class="tv-barra__s">:</span>');
    return `<div class="tv-barra" style="background:${esc(v('barra_fondo'))};color:${esc(le)}">
      <span class="tv-barra__t">${esc(t('barra_titulo'))}</span>
      <span class="tv-barra__f"><span class="tv-barra__r">${uni}</span>
      <span class="tv-barra__b" style="background:${esc(v('barra_boton_fondo'))};color:${esc(v('barra_boton_letra'))}">${esc(t('barra_boton'))}</span></span>
    </div>`;
  }
  if (parte === 'bloque') {
    if (v('bloque_activo') === 'no') return '<p class="ayuda">No se muestra.</p>';
    const le = v('bloque_letra');
    const a = t('bloque_titulo');
    const b = t('bloque_texto');
    return `<div class="tv-bloque" style="background:${esc(v('bloque_fondo'))}">
      ${a ? `<p><strong style="color:${esc(le || '#33291f')}">${esc(a)}</strong></p>` : ''}
      ${b ? `<p style="color:${esc(le || '#5b5147')}">${esc(b)}</p>` : ''}
    </div>`;
  }
  if (v('oferta_activa') === 'no') return '<p class="ayuda">No se muestra.</p>';
  const le = v('oferta_letra');
  const [n, e, p, x] = ['oferta_nombre', 'oferta_etiqueta', 'oferta_principal', 'oferta_texto'].map(t);
  return `<div class="tv-oferta" style="background:${esc(v('oferta_fondo'))}">
    ${n || e ? `<div class="tv-oferta__fila">${n ? `<span class="tv-oferta__n" style="${le ? `color:${esc(le)}` : ''}">${esc(n)}</span>` : ''}${e ? `<span class="tv-oferta__e" style="background:${esc(v('oferta_etiqueta_fondo'))}">${esc(e)}</span>` : ''}</div>` : ''}
    ${p ? `<p class="tv-oferta__p" style="${le ? `color:${esc(le)}` : ''}">${esc(p)}</p>` : ''}
    ${x ? `<p class="tv-oferta__x" style="${le ? `color:${esc(le)}` : ''}">${esc(x)}</p>` : ''}
  </div>`;
}
