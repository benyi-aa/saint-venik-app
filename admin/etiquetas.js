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
  resolverHandles, camposDeTipo, TOPE_ENTRADAS,
} from './asignacion.js?v=202611091949';

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
];

/* Un numero que puede valer 0 no se puede leer con `|| defecto`: el 0 es un
 * valor legitimo y se convertiria en el defecto. Vacio si es "sin decidir". */
function numero(valor, defecto) {
  if (valor === '' || valor === undefined || valor === null) return defecto;
  const n = Number(valor);
  return Number.isFinite(n) ? n : defecto;
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
  };
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
