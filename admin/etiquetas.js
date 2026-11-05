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
  resolverHandles, TOPE_ENTRADAS,
} from './asignacion.js?v=202611051530';

export const TIPO_ETIQUETA = 'sv_etiqueta';
export const TOPE_ETIQUETAS = TOPE_ENTRADAS;

export const FONDO_POR_DEFECTO = '#111111';
export const TEXTO_POR_DEFECTO = '#FFFFFF';

const CAMPOS_ETIQUETA = [
  ...CAMPOS_COMUNES,
  { key: 'color_fondo', name: 'Color de fondo', type: 'color' },
  { key: 'color_texto', name: 'Color del texto', type: 'color' },
];

function aEtiqueta(entrada) {
  const valor = (clave) => entrada.fields.find((c) => c.key === clave)?.value ?? '';
  return {
    ...aObjetoComun(entrada),
    fondo: valor('color_fondo') || FONDO_POR_DEFECTO,
    texto: valor('color_texto') || TEXTO_POR_DEFECTO,
  };
}

export async function cargarEtiquetas() {
  return cargarEntradas(TIPO_ETIQUETA, aEtiqueta);
}

function camposDe(datos) {
  const campos = camposComunes(datos);
  if (datos.fondo !== undefined) campos.push({ key: 'color_fondo', value: datos.fondo });
  if (datos.texto !== undefined) campos.push({ key: 'color_texto', value: datos.texto });
  return campos;
}

export async function guardarEtiqueta(id, datos) {
  return guardarEntrada(id, camposDe(datos));
}

export async function crearEtiqueta(datos, cuantasHay) {
  if (cuantasHay >= TOPE_ETIQUETAS) {
    throw new Error(`No se pueden tener más de ${TOPE_ETIQUETAS} insignias.`);
  }
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
export async function sincronizar(etiqueta, onPaso) {
  const { cadena, cortadas } = await resolverHandles(etiqueta, onPaso);
  if (cadena === etiqueta.handles) return { cambio: false, cortadas };
  await guardarEntrada(etiqueta.id, [{ key: 'handles', value: cadena }]);
  etiqueta.handles = cadena;
  return { cambio: true, cortadas };
}

export function cuantosAlcanza(etiqueta) {
  if (!etiqueta.handles) return 0;
  return etiqueta.handles.split('|').filter(Boolean).length;
}

export async function faltaEstructuraEtiquetas() {
  return faltaEstructura(TIPO_ETIQUETA, CAMPOS_ETIQUETA, 'las insignias');
}

export async function asegurarEstructuraEtiquetas(pasos = []) {
  return asegurarEstructura(TIPO_ETIQUETA, CAMPOS_ETIQUETA, 'Insignia de producto', pasos);
}
