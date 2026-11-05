/* Saint Venik · Beneficios del producto.
 *
 * "Garantia de por vida", "Resistente al agua y el sudor", "Hipoalergenico".
 * No son los mismos para todo el catalogo: los brillantes no resisten el agua
 * y en su lugar llevan "Joyeria fina". Por eso cada beneficio decide a que
 * productos alcanza, igual que las insignias, con el mismo codigo de
 * asignacion.js debajo.
 *
 * Lo propio de un beneficio es el icono: una clave del juego de iconos que
 * vive en el snippet sv-icono.liquid y que admin/iconos.js copia para el
 * panel. No se valida con una lista de opciones en la definicion a proposito:
 * el panel es el unico que escribe este campo, y una clave desconocida en la
 * tienda no rompe nada, simplemente no dibuja icono.
 */
import {
  CAMPOS_COMUNES, aObjetoComun, cargarEntradas, camposComunes, crearEntrada,
  guardarEntrada, borrarEntrada, faltaEstructura, asegurarEstructura,
  resolverHandles, TOPE_ENTRADAS,
} from './asignacion.js?v=202611051620';

export const TIPO_BENEFICIO = 'sv_beneficio';
export const TOPE_BENEFICIOS = TOPE_ENTRADAS;

const CAMPOS_BENEFICIO = [
  ...CAMPOS_COMUNES,
  { key: 'icono', name: 'Icono', type: 'single_line_text_field' },
];

/* Lo que vio en el video, listo para sembrar en una tienda nueva. Las dos
 * familias de material: acero y oro llevan los tres de siempre; los brillantes
 * cambian el del agua por "joyeria fina". */
export const BENEFICIOS_INICIALES = [
  { nombre: 'Garantía de por vida', nombreEn: 'Lifetime warranty', icono: 'garantia', orden: 1 },
  { nombre: 'Resistente al agua y el sudor', nombreEn: 'Water & sweat resistant', icono: 'agua', orden: 2 },
  { nombre: 'Hipoalergénico', nombreEn: 'Hypoallergenic', icono: 'hipoalergenico', orden: 3 },
  { nombre: 'Joyería fina', nombreEn: 'Fine jewellery', icono: 'joyeria-fina', orden: 4 },
];

function aBeneficio(entrada) {
  const valor = (clave) => entrada.fields.find((c) => c.key === clave)?.value ?? '';
  return { ...aObjetoComun(entrada), icono: valor('icono') };
}

export async function cargarBeneficios() {
  return cargarEntradas(TIPO_BENEFICIO, aBeneficio);
}

function camposDe(datos) {
  const campos = camposComunes(datos);
  if (datos.icono !== undefined) campos.push({ key: 'icono', value: datos.icono });
  return campos;
}

export async function guardarBeneficio(id, datos) {
  return guardarEntrada(id, camposDe(datos));
}

export async function crearBeneficio(datos, cuantosHay) {
  if (cuantosHay >= TOPE_BENEFICIOS) {
    throw new Error(`No se pueden tener más de ${TOPE_BENEFICIOS} beneficios.`);
  }
  return crearEntrada(TIPO_BENEFICIO, camposDe({ activo: true, ...datos }));
}

export async function borrarBeneficio(id) {
  return borrarEntrada(id);
}

export async function sincronizar(beneficio, onPaso) {
  const { cadena, cortadas } = await resolverHandles(beneficio, onPaso);
  if (cadena === beneficio.handles) return { cambio: false, cortadas };
  await guardarEntrada(beneficio.id, [{ key: 'handles', value: cadena }]);
  beneficio.handles = cadena;
  return { cambio: true, cortadas };
}

/* La cadena lleva dos claves por producto, el id y el handle, asi que contar
 * trozos daria el doble. Se cuentan los numericos, que son los ids. */
export function cuantosAlcanza(beneficio) {
  if (!beneficio.handles) return 0;
  return beneficio.handles.split('|').filter((c) => /^\d+$/.test(c)).length;
}

export async function faltaEstructuraBeneficios() {
  return faltaEstructura(TIPO_BENEFICIO, CAMPOS_BENEFICIO, 'los beneficios');
}

export async function asegurarEstructuraBeneficios(pasos = []) {
  return asegurarEstructura(TIPO_BENEFICIO, CAMPOS_BENEFICIO, 'Beneficio de producto', pasos);
}

/* Siembra los cuatro del video en una tienda que no tenga ninguno. Nacen sin
 * productos asignados a proposito: asi no aparece nada en la tienda hasta que
 * alguien decida a que familia va cada uno. */
export async function sembrarBeneficios(pasos = []) {
  const yaEstan = await cargarBeneficios();
  if (yaEstan.length) return pasos;

  for (const b of BENEFICIOS_INICIALES) {
    await crearBeneficio(b, 0);
    pasos.push(`Beneficio «${b.nombre}» creado`);
  }
  return pasos;
}
