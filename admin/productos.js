/* Saint Venik · El hermano de color de cada producto.
 *
 * Es el dato central de la app: qué producto es el mismo modelo en otro color.
 * Vive en el metacampo custom.hermano_de_color, una lista de referencias a
 * producto, y hasta ahora solo se podía tocar desde la ficha del producto en
 * Shopify. Aquí se edita desde la app.
 *
 * Vincular escribe SIEMPRE los dos lados. Un enlace de ida sin vuelta deja el
 * selector apareciendo en una ficha y no en la otra, que es un fallo molesto de
 * encontrar porque cada ficha por separado parece correcta.
 */
import { gql, comprobarErrores } from './api.js?v=202611111527';

const NAMESPACE = 'custom';
const CLAVE = 'hermano_de_color';

const BUSCAR = `
  query BuscarProductos($consulta: String!, $cursor: String, $n: Int = 50) {
    products(first: $n, query: $consulta, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        handle
        status
        tags
        featuredMedia { preview { image { url } } }
        metafield(namespace: "${NAMESPACE}", key: "${CLAVE}") {
          value
          references(first: 10) { nodes { ... on Product { id title } } }
        }
      }
    }
  }
`;

const ESCRIBIR = `
  mutation Escribir($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message code }
    }
  }
`;

function aProducto(n) {
  return {
    id: n.id,
    titulo: n.title,
    handle: n.handle,
    activo: n.status === 'ACTIVE',
    etiquetas: n.tags ?? [],
    imagen: n.featuredMedia?.preview?.image?.url ?? null,
    hermanos: (n.metafield?.references?.nodes ?? []).map((h) => ({ id: h.id, titulo: h.title })),
  };
}

function consultaDe(texto) {
  /* Sin texto se listan todos; con texto, se busca por título. */
  return texto ? `title:*${texto}*` : '';
}

export async function buscarProductos(texto) {
  const d = await gql(BUSCAR, { consulta: consultaDe(texto) });
  return d.products.nodes.map(aProducto);
}

/* Un filtro sobre los primeros 50 mentiria: con 154 productos, "ninguno sin
 * color" podria querer decir solo "ninguno entre los 50 primeros". Por eso los
 * filtros recorren el catalogo entero.
 *
 * Va de 25 en 25. Shopify cobra por adelantado lo que la consulta PODRIA
 * gastar, y cada producto trae hasta 10 hermanos: una pagina de 50 pide unos
 * 850 puntos de un cupo de 2000, y dos recorridos seguidos lo agotan. Con 25
 * la mitad, y si aun asi se frena, gql espera y reintenta. */
const POR_PAGINA = 25;
export const TOPE_PAGINAS = 80;

export async function todosLosProductos(texto) {
  const productos = [];
  let cursor = null;
  let paginas = 0;
  do {
    const d = await gql(BUSCAR, { consulta: consultaDe(texto), cursor, n: POR_PAGINA });
    productos.push(...d.products.nodes.map(aProducto));
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
    paginas += 1;
  } while (cursor && paginas < TOPE_PAGINAS);
  /* Si se corto por el tope, quedaron productos fuera y hay que decirlo. */
  return { productos, incompleto: Boolean(cursor) };
}

async function escribirHermanos(idProducto, idsHermanos) {
  const r = await gql(ESCRIBIR, {
    metafields: [{
      ownerId: idProducto,
      namespace: NAMESPACE,
      key: CLAVE,
      type: 'list.product_reference',
      value: JSON.stringify(idsHermanos),
    }],
  });
  return comprobarErrores(r, 'metafieldsSet');
}

/* Vincular une las dos familias enteras (11-nov): con dos filas de color (metal arriba; cordón o
 * gema abajo) cada joya tiene que conocer a todas las demás del modelo. La Capri negra de plata
 * enlaza con la negra de oro, la azul de plata, la azul de oro... Unir dos familias que ya eran
 * pares (oro / plata) da una de cuatro, todos con todos. */
export async function vincular(a, b) {
  if (a.id === b.id) throw new Error('Un producto no puede ser su propio hermano de color.');

  const familia = new Set([a.id, b.id, ...a.hermanos.map((h) => h.id), ...b.hermanos.map((h) => h.id)]);
  /* Los hermanos de los hermanos, por si alguna familia no estaba completa. */
  const ids = [...familia].map((id) => `id:${id.split('/').pop()}`).join(' OR ');
  const d = await gql(BUSCAR, { consulta: ids, n: 50 });
  for (const n of d.products.nodes.map(aProducto)) n.hermanos.forEach((h) => familia.add(h.id));
  if (familia.size > 11) throw new Error('Una familia de color puede tener hasta 11 joyas.');

  for (const id of familia) {
    await escribirHermanos(id, [...familia].filter((x) => x !== id));
  }
}

/* Unir varios productos en una sola familia (11-nov): lo que sale en una búsqueda, por ejemplo
 * «Clover» (5 colores × plata y oro). Cada uno queda con todos los demás como hermanos,
 * sumando las familias que ya tuvieran. */
export async function unirFamilia(productos) {
  if (productos.length < 2) throw new Error('Hacen falta al menos dos productos.');
  const familia = new Set();
  productos.forEach((p) => { familia.add(p.id); p.hermanos.forEach((h) => familia.add(h.id)); });
  if (familia.size > 11) throw new Error(`Serían ${familia.size} joyas: una familia de color puede tener hasta 11.`);
  for (const id of familia) {
    await escribirHermanos(id, [...familia].filter((x) => x !== id));
  }
  return familia.size;
}

export async function desvincular(a, idHermano) {
  await escribirHermanos(a.id, a.hermanos.filter((h) => h.id !== idHermano).map((h) => h.id));

  /* También el otro lado, para no dejar un enlace de vuelta huérfano. */
  const otros = await gql(BUSCAR, { consulta: `id:${idHermano.split('/').pop()}` });
  const otro = otros.products.nodes.map(aProducto)[0];
  if (otro) {
    await escribirHermanos(otro.id, otro.hermanos.filter((h) => h.id !== a.id).map((h) => h.id));
  }
}

/* El color de un producto es una etiqueta (la de la entrada de color). Se
 * pone y se quita desde la ficha del producto en la app, sin ir a Shopify.
 * Un producto puede llevar dos (la Vienna verde lleva `oro` y `verde`): en la
 * tienda cuenta como el primero de la lista «Orden de los colores». */
const PONER_ETIQUETAS = `
  mutation PonerEtiquetas($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
  }
`;

const QUITAR_ETIQUETAS = `
  mutation QuitarEtiquetas($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) { userErrors { field message } }
  }
`;

export async function ponerEtiquetaColor(producto, etiqueta, poner) {
  const limpia = String(etiqueta ?? '').trim();
  if (!limpia) throw new Error('Ese color no tiene etiqueta.');
  if (poner) {
    comprobarErrores(await gql(PONER_ETIQUETAS, { id: producto.id, tags: [limpia] }), 'tagsAdd');
    if (!producto.etiquetas.includes(limpia)) producto.etiquetas.push(limpia);
  } else {
    /* Se quita tal como esta escrita en el producto, aunque varie en
     * mayusculas: tagsRemove distingue. */
    const suyas = producto.etiquetas.filter((e) => e.trim().toLowerCase() === limpia.toLowerCase());
    if (suyas.length) comprobarErrores(await gql(QUITAR_ETIQUETAS, { id: producto.id, tags: suyas }), 'tagsRemove');
    producto.etiquetas = producto.etiquetas.filter((e) => !suyas.includes(e));
  }
}

/* Tener color es llevar la etiqueta de alguna entrada de color. Se compara en
 * minusculas y sin espacios, igual que el Liquid (downcase | strip): si no, una
 * etiqueta escrita "Oro" contaria distinto aqui que en la tienda. */
const normal = (e) => String(e ?? '').trim().toLowerCase();

export function tieneColor(producto, etiquetasDeColor) {
  const suyas = new Set(producto.etiquetas.map(normal));
  return etiquetasDeColor.map(normal).some((e) => e && suyas.has(e));
}

/* Un producto con etiqueta de color pero sin hermano puede ser correcto (una
 * pieza que solo existe en un color) o un enlace que se olvidó. La app no puede
 * saberlo, así que lo señala sin llamarlo error. */
export function sinHermano(producto, etiquetasDeColor) {
  return tieneColor(producto, etiquetasDeColor) && producto.hermanos.length === 0;
}

/* Sin ninguna etiqueta de color, la ficha nunca puede pintar su propia muestra.
 * Tambien puede ser correcto (un empaque, una tarjeta regalo), asi que tampoco
 * se llama error. */
export function sinColor(producto, etiquetasDeColor) {
  return !tieneColor(producto, etiquetasDeColor);
}
