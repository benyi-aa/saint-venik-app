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
import { gql, comprobarErrores } from './api.js?v=202609162010';

const NAMESPACE = 'custom';
const CLAVE = 'hermano_de_color';

const BUSCAR = `
  query BuscarProductos($consulta: String!) {
    products(first: 50, query: $consulta) {
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

export async function buscarProductos(texto) {
  /* Sin texto se listan los primeros; con texto, se busca por título. */
  const consulta = texto ? `title:*${texto}*` : '';
  const d = await gql(BUSCAR, { consulta });
  return d.products.nodes.map(aProducto);
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

export async function vincular(a, b) {
  if (a.id === b.id) throw new Error('Un producto no puede ser su propio hermano de color.');

  const deA = new Set([...a.hermanos.map((h) => h.id), b.id]);
  const deB = new Set([...b.hermanos.map((h) => h.id), a.id]);

  await escribirHermanos(a.id, [...deA]);
  await escribirHermanos(b.id, [...deB]);
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

/* Un producto con etiqueta de color pero sin hermano puede ser correcto (una
 * pieza que solo existe en un color) o un enlace que se olvidó. La app no puede
 * saberlo, así que lo señala sin llamarlo error. */
export function sinHermano(producto, etiquetasDeColor) {
  const suyas = producto.etiquetas.map((e) => e.trim().toLowerCase());
  const tieneColor = etiquetasDeColor.some((e) => suyas.includes(e));
  return tieneColor && producto.hermanos.length === 0;
}
