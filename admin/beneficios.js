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
  resolverHandles, camposDeTipo, TOPE_ENTRADAS,
} from './asignacion.js?v=202611100006';
import { gql } from './api.js?v=202611100006';

export const TIPO_BENEFICIO = 'sv_beneficio';
export const TOPE_BENEFICIOS = TOPE_ENTRADAS;

const CAMPOS_BENEFICIO = [
  ...CAMPOS_COMUNES,
  { key: 'icono', name: 'Icono', type: 'single_line_text_field' },
  /* Un icono propio subido por el comerciante. Manda sobre el dibujado, igual
   * que la imagen de la muestra manda sobre el color. Sin validacion de tipo,
   * porque tiene que aceptar PNG o WebP (MediaImage) y tambien SVG, que para
   * Shopify es un archivo generico. La clave del icono dibujado se conserva:
   * quitar la imagen devuelve el de antes sin volver a elegirlo. */
  { key: 'icono_imagen', name: 'Icono subido', type: 'file_reference' },
];

/* El valor crudo de un file_reference es un GID, no una URL. La consulta que
 * carga las entradas es compartida con las insignias y no pide `reference`
 * para no pagar ese coste donde no hay archivos, asi que las URL se resuelven
 * aparte y de una vez. */
const URLS = `
  query UrlsDeIconos($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on MediaImage { id image { url } }
      ... on GenericFile { id url }
    }
  }
`;

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
  return {
    ...aObjetoComun(entrada),
    icono: valor('icono'),
    iconoImagenId: valor('icono_imagen'),
    iconoImagenUrl: null,
  };
}

export async function cargarBeneficios() {
  const lista = await cargarEntradas(TIPO_BENEFICIO, aBeneficio);

  const ids = [...new Set(lista.map((b) => b.iconoImagenId).filter(Boolean))];
  if (!ids.length) return lista;

  /* Si esto falla, los beneficios se enseñan igual y sin icono propio. Antes
   * tumbaba la pantalla entera y parecia que no habia ningun beneficio. */
  try {
    const urls = new Map();
    for (let i = 0; i < ids.length; i += 100) {
      const d = await gql(URLS, { ids: ids.slice(i, i + 100) });
      for (const n of d.nodes ?? []) {
        if (n?.id) urls.set(n.id, n.image?.url ?? n.url ?? null);
      }
    }
    for (const b of lista) b.iconoImagenUrl = urls.get(b.iconoImagenId) ?? null;
  } catch (error) {
    /* sin urls: cada beneficio cae en su icono dibujado */
  }
  return lista;
}

/* Se guarda sola, como la imagen de la muestra de color: asi subir un icono no
 * arrastra el resto de los campos a medio editar. Una cadena vacia la quita. */
export async function guardarIconoImagen(id, idArchivo) {
  return guardarEntrada(id, [{ key: 'icono_imagen', value: idArchivo ?? '' }]);
}

export async function camposDeBeneficio() {
  return camposDeTipo(TIPO_BENEFICIO);
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

export async function sincronizar(beneficio, onPaso, cache) {
  const { cadena, cortadas } = await resolverHandles(beneficio, onPaso, cache);
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
