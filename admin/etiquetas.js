/* Saint Venik · Insignias de producto.
 *
 * "Mas vendido", "Novedad": un rectangulo macizo sobre la foto, en la tarjeta
 * de la coleccion y en la ficha. Cada entrada del metaobjeto `sv_etiqueta`
 * guarda el texto en los dos idiomas, sus dos colores, y a que productos
 * alcanza (elegidos a mano o por coleccion entera).
 *
 * Todo el trabajo de "a que productos alcanza" esta en asignacion.js, que es
 * lo que comparte con los beneficios.
 */
import {
  CAMPOS_COMUNES, aObjetoComun, cargarEntradas, camposComunes, crearEntrada,
  guardarEntrada, borrarEntrada, faltaEstructura, asegurarEstructura,
  resolverHandles, resolverPartes, cadenaDeHandles, camposDeTipo, TOPE_ENTRADAS,
} from './asignacion.js?v=202611132017';
import {
  autoEncendida, elegirAutomaticos, CANTIDAD_POR_DEFECTO, DIAS_POR_DEFECTO,
} from './automaticas.js?v=202611132017';

export const TIPO_ETIQUETA = 'sv_etiqueta';
export const TOPE_ETIQUETAS = TOPE_ENTRADAS;

export const FONDO_POR_DEFECTO = '#111111';
export const TEXTO_POR_DEFECTO = '#FFFFFF';
export const BORDE_POR_DEFECTO = '#FFFFFF';
export const GROSOR_POR_DEFECTO = 0;
export const OPACIDAD_POR_DEFECTO = 100;

const CAMPOS_ETIQUETA = [
  ...CAMPOS_COMUNES,
  { key: 'color_fondo', name: 'Color de fondo', type: 'color' },
  { key: 'color_texto', name: 'Color del texto', type: 'color' },
  /* El borde y la opacidad van POR INSIGNIA y no en la configuracion general
   * porque dependen de ella: una insignia blanca sobre una foto clara necesita
   * borde y una negra no. Su fondo y su texto ya viven aqui; partir el aspecto
   * de una misma insignia entre dos pantallas seria peor. */
  { key: 'color_borde', name: 'Color del borde', type: 'color' },
  { key: 'borde_grosor', name: 'Grosor del borde', type: 'number_integer' },
  { key: 'opacidad', name: 'Opacidad', type: 'number_integer' },
  /* Insignia automática (13-nov, automaticas.js). Apagada salvo que alguien marque
   * «auto_activo»: sin eso, la insignia se calcula igual que antes. */
  { key: 'auto_tipo', name: 'Automática: qué productos', type: 'single_line_text_field' },
  { key: 'auto_activo', name: 'Automática: encendida', type: 'boolean' },
  { key: 'auto_cantidad', name: 'Automática: cuántos por colección', type: 'number_integer' },
  { key: 'auto_dias', name: 'Automática: días (los más nuevos)', type: 'number_integer' },
  { key: 'auto_colecciones', name: 'Automática: colecciones', type: 'list.collection_reference' },
  { key: 'auto_handles', name: 'Automática: elegidos (lo calcula la app)', type: 'multi_line_text_field' },
  { key: 'auto_fecha', name: 'Automática: calculada por última vez', type: 'date_time' },
];

/* Los campos de la automática son nuevos: hasta que la tienda los tenga (botón
 * «Crear lo que falta»), el panel no los ofrece ni los escribe. */
export const CAMPOS_AUTO = ['auto_tipo', 'auto_activo', 'auto_cantidad', 'auto_dias', 'auto_colecciones', 'auto_handles', 'auto_fecha'];

/* Un numero que puede valer 0 no se puede leer con `|| defecto`: el 0 es un
 * valor legitimo y se convertiria en el defecto. Vacio si es "sin decidir". */
function numero(valor, defecto) {
  if (valor === '' || valor === undefined || valor === null) return defecto;
  const n = Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

function listaIds(valor) {
  try {
    const lista = JSON.parse(valor || '[]');
    return Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : [];
  } catch (error) {
    return [];
  }
}

function aEtiqueta(entrada) {
  const valor = (clave) => entrada.fields.find((c) => c.key === clave)?.value ?? '';
  return {
    ...aObjetoComun(entrada),
    fondo: valor('color_fondo') || FONDO_POR_DEFECTO,
    texto: valor('color_texto') || TEXTO_POR_DEFECTO,
    borde: valor('color_borde') || BORDE_POR_DEFECTO,
    grosor: numero(valor('borde_grosor'), GROSOR_POR_DEFECTO),
    opacidad: numero(valor('opacidad'), OPACIDAD_POR_DEFECTO),
    autoTipo: valor('auto_tipo'),
    /* Al revés que «activo»: una insignia sin el campo NO es automática. */
    autoActivo: valor('auto_activo') === 'true',
    autoCantidad: numero(valor('auto_cantidad'), CANTIDAD_POR_DEFECTO),
    autoDias: numero(valor('auto_dias'), DIAS_POR_DEFECTO),
    idsAutoColecciones: listaIds(valor('auto_colecciones')),
    /* Las colecciones con su título las pone la pantalla, que ya las tiene cargadas. */
    autoColecciones: [],
    autoHandles: valor('auto_handles'),
    autoFecha: valor('auto_fecha'),
  };
}

/* Pone título y handle a las colecciones de la automática (los ids vienen sueltos). */
export function resolverColeccionesAuto(etiquetas, colecciones) {
  const porId = new Map(colecciones.map((c) => [c.id, c]));
  for (const e of etiquetas) {
    e.autoColecciones = e.idsAutoColecciones.map((id) => porId.get(id)).filter(Boolean);
  }
}

export async function cargarEtiquetas() {
  return cargarEntradas(TIPO_ETIQUETA, aEtiqueta);
}

function camposDe(datos) {
  const campos = camposComunes(datos);
  if (datos.fondo !== undefined) campos.push({ key: 'color_fondo', value: datos.fondo });
  if (datos.texto !== undefined) campos.push({ key: 'color_texto', value: datos.texto });
  if (datos.borde !== undefined) campos.push({ key: 'color_borde', value: datos.borde });
  if (datos.grosor !== undefined) campos.push({ key: 'borde_grosor', value: String(datos.grosor) });
  if (datos.opacidad !== undefined) campos.push({ key: 'opacidad', value: String(datos.opacidad) });
  if (datos.autoTipo !== undefined) campos.push({ key: 'auto_tipo', value: datos.autoTipo });
  if (datos.autoActivo !== undefined) campos.push({ key: 'auto_activo', value: String(Boolean(datos.autoActivo)) });
  if (datos.autoCantidad !== undefined) campos.push({ key: 'auto_cantidad', value: String(datos.autoCantidad) });
  if (datos.autoDias !== undefined) campos.push({ key: 'auto_dias', value: String(datos.autoDias) });
  if (datos.autoColecciones !== undefined) {
    campos.push({ key: 'auto_colecciones', value: JSON.stringify(datos.autoColecciones.map((c) => c.id)) });
  }
  return campos;
}

export async function guardarEtiqueta(id, datos) {
  return guardarEntrada(id, camposDe(datos));
}

export async function crearEtiqueta(datos, cuantasHay) {
  if (cuantasHay >= TOPE_ETIQUETAS) {
    throw new Error(`No se pueden tener más de ${TOPE_ETIQUETAS} insignias.`);
  }
  /* Sin borde ni opacidad a menos que vengan: hasta que la tienda tenga esos
   * campos, escribirlos haria fallar la creacion entera. Sin valor se leen con
   * el de fabrica igual. */
  return crearEntrada(TIPO_ETIQUETA, camposDe({
    activo: true,
    fondo: FONDO_POR_DEFECTO,
    texto: TEXTO_POR_DEFECTO,
    ...datos,
  }));
}

export async function borrarEtiqueta(id) {
  return borrarEntrada(id);
}

/* Recalcula la cadena de handles de una insignia y la guarda si cambio.
 * Devuelve si cambio (para poder decir cuantas se actualizaron sin contar las
 * que no hacia falta tocar) y que colecciones se quedaron a medio leer. */
export async function sincronizar(etiqueta, onPaso, cache) {
  const { cadena, cortadas } = await resolverHandles(etiqueta, onPaso, cache);
  if (cadena === etiqueta.handles) return { cambio: false, cortadas };
  await guardarEntrada(etiqueta.id, [{ key: 'handles', value: cadena }]);
  etiqueta.handles = cadena;
  return { cambio: true, cortadas };
}

/* Todas las insignias a la vez (13-nov). Hace falta calcularlas juntas porque una
 * automática no puede caer en un producto que ya tiene otra insignia, así que
 * tiene que saber qué tienen las demás.
 *
 * 1. Lo elegido a mano de cada una (igual que sincronizar).
 * 2. Las automáticas encendidas, de arriba abajo (manda la de más arriba): cada
 *    una se salta lo que ya tienen las demás, a mano o por automática anterior.
 * 3. Se guarda en cada una «a mano ∪ automáticos», sin repetir. Si ninguna está
 *    encendida, el resultado es exactamente el de siempre.
 *
 * `lista` viene ordenada como en la pantalla (cargarEtiquetas ordena). `conAuto`
 * dice si la tienda ya tiene los campos de la automática. Devuelve cuántas
 * cambiaron, las colecciones leídas a medias y, por insignia, el detalle de qué
 * eligió la automática (para enseñarlo). */
export async function sincronizarTodas(lista, { cache, pase, conAuto = false } = {}) {
  const partes = new Map();
  const cortadas = new Set();
  for (const e of lista) {
    if (pase && !pase.vivo) return null;
    const p = await resolverPartes(e, undefined, cache);
    p.cortadas.forEach((c) => cortadas.add(c));
    partes.set(e.id, { manual: p.todos.filter((h) => !p.fuera.has(h)), fuera: p.fuera });
  }

  const autos = new Map();
  const detalle = new Map();
  if (conAuto) {
    for (const e of lista) {
      if (!autoEncendida(e)) continue;
      if (pase && !pase.vivo) return null;
      const bloqueo = new Map();
      for (const o of lista) {
        if (o.id === e.id || !o.activo) continue;
        partes.get(o.id).manual.forEach((k) => { if (!bloqueo.has(k)) bloqueo.set(k, o.nombre); });
        (autos.get(o.id) ?? []).forEach((k) => { if (!bloqueo.has(k)) bloqueo.set(k, o.nombre); });
      }
      const r = await elegirAutomaticos(e, { bloqueo, fuera: partes.get(e.id).fuera }, cache);
      autos.set(e.id, r.claves);
      detalle.set(e.id, r);
    }
  }

  let cambiadas = 0;
  const ahora = new Date().toISOString();
  for (const e of lista) {
    if (pase && !pase.vivo) return null;
    const auto = autos.get(e.id) ?? [];
    const cadena = cadenaDeHandles([...partes.get(e.id).manual, ...auto]);
    const campos = [];
    if (cadena !== (e.handles || '')) campos.push({ key: 'handles', value: cadena });
    if (conAuto) {
      const cadenaAuto = cadenaDeHandles(auto);
      if (cadenaAuto !== (e.autoHandles || '')) campos.push({ key: 'auto_handles', value: cadenaAuto });
      if (autoEncendida(e)) campos.push({ key: 'auto_fecha', value: ahora });
    }
    if (!campos.length) continue;
    await guardarEntrada(e.id, campos);
    if (campos.some((c) => c.key === 'handles')) cambiadas += 1;
    e.handles = cadena;
    if (conAuto) {
      e.autoHandles = cadenaDeHandles(auto);
      if (autoEncendida(e)) e.autoFecha = ahora;
    }
  }
  return { cambiadas, cortadas: [...cortadas], detalle };
}

/* Cuántos productos eligió la automática (mismo conteo que cuantosAlcanza). */
export function cuantosAutomaticos(etiqueta) {
  if (!etiqueta.autoHandles) return 0;
  return etiqueta.autoHandles.split('|').filter((c) => /^\d+$/.test(c)).length;
}

/* La cadena lleva dos claves por producto, el id y el handle, asi que contar
 * trozos daria el doble. Se cuentan los numericos, que son los ids. */
export function cuantosAlcanza(etiqueta) {
  if (!etiqueta.handles) return 0;
  return etiqueta.handles.split('|').filter((c) => /^\d+$/.test(c)).length;
}

export async function camposDeEtiqueta() {
  return camposDeTipo(TIPO_ETIQUETA);
}

export async function faltaEstructuraEtiquetas() {
  return faltaEstructura(TIPO_ETIQUETA, CAMPOS_ETIQUETA, 'las insignias');
}

export async function asegurarEstructuraEtiquetas(pasos = []) {
  return asegurarEstructura(TIPO_ETIQUETA, CAMPOS_ETIQUETA, 'Insignia de producto', pasos);
}
