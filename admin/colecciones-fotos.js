/* Saint Venik · Foto de cada colección (Productos → Colecciones), 14-nov.
 *
 * Las fotos nuevas (estilo de las tarjetas del inicio: joyas sobre negro azulado con haces de
 * luz y piso que refleja) están en admin/colecciones-fotos/ y fotos.json dice cuál va en cada
 * colección de cada tienda. Cada foto lleva solo joyas de esa colección (Oro, solo oro;
 * «Inferior a $40.000», solo productos bajo ese precio…). Cómo se hicieron: docs/tema.md,
 * «Fotos de las colecciones».
 *
 * Poner una foto es `collectionUpdate` con la URL pública de la foto: Shopify la descarga y la
 * guarda. La foto que tenía cada colección el 14-nov está copiada en anteriores/ (lista en
 * anteriores/anteriores.json), así que «Volver a la anterior» siempre tiene de dónde sacarla.
 */
import { gql, comprobarErrores } from './api.js?v=202611142213';

const COLECCIONES = `
  query ColeccionesConFoto($cursor: String) {
    collections(first: 100, after: $cursor, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle title templateSuffix productsCount { count } image { url altText } }
    }
  }
`;

const PONER = `
  mutation PonerFotoColeccion($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id image { url altText } }
      userErrors { field message }
    }
  }
`;

export async function cargarColeccionesConFoto() {
  const todas = [];
  let cursor = null;
  for (let i = 0; i < 10; i += 1) {
    const d = await gql(COLECCIONES, { cursor }, { sinMemoria: true });
    todas.push(...d.collections.nodes.map((c) => ({
      id: c.id,
      handle: c.handle,
      titulo: c.title,
      plantilla: c.templateSuffix || '',
      cuantos: c.productsCount?.count ?? 0,
      imagen: c.image?.url ?? null,
      alt: c.image?.altText ?? '',
    })));
    if (!d.collections.pageInfo.hasNextPage) break;
    cursor = d.collections.pageInfo.endCursor;
  }
  return todas;
}

/* Las fotos viven al lado de esta página (GitHub Pages). */
export function urlDeFoto(archivo) {
  return new URL(`./colecciones-fotos/${archivo}`, location.href.split('?')[0]).href;
}

async function leerJson(archivo) {
  const r = await fetch(urlDeFoto(`${archivo}?v=${Date.now()}`));
  if (!r.ok) throw new Error('No se encontró la lista de fotos de colecciones.');
  return r.json();
}

/* Qué foto nueva y cuál anterior le toca a cada colección de ESTA tienda. */
export async function cargarPlan() {
  const tienda = (new URLSearchParams(location.search).get('shop') || '').replace('.myshopify.com', '');
  const [fotos, anteriores] = await Promise.all([leerJson('fotos.json'), leerJson('anteriores/anteriores.json')]);
  return {
    nuevas: fotos.tiendas?.[tienda] ?? {},
    productos: fotos.productos ?? {},
    anteriores: anteriores[tienda] ?? {},
  };
}

/* Shopify suele guardar la foto con el nombre del archivo de origen (si ya existe uno igual le
 * agrega «_» y un código); pero si la foto anterior también era .jpg, a veces conserva el nombre
 * viejo y solo cambia el contenido. Por eso la foto nueva va con el texto alternativo
 * «<colección> · Saint Venik» (altNueva) y la anterior vuelve con el título solo. */
export function altNueva(titulo) {
  return `${titulo} · Saint Venik`;
}

export function usaArchivo(urlImagen, archivo) {
  if (!urlImagen || !archivo) return false;
  const base = archivo.split('/').pop().replace(/\.[a-z0-9]+$/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nombre = decodeURIComponent(urlImagen.split('?')[0].split('/').pop());
  return new RegExp(`^${base}(?:_[0-9a-f-]{8,})?\\.[a-z0-9]+$`, 'i').test(nombre);
}

export async function ponerFoto(id, archivo, alt) {
  const r = await gql(PONER, { input: { id, image: { src: urlDeFoto(archivo), altText: alt || '' } } });
  return comprobarErrores(r, 'collectionUpdate').collection;
}
