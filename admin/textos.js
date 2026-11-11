/* Textos generales de la tienda. «Resistente al agua» no puede ir en lugares
 * generales (Benjamín, 9-nov): hace creer que toda la tienda lo es, y las joyas
 * con brillantes no lo son. Las descripciones de las colecciones lo decían en la
 * frase de Google («… | Garantía de por vida | Resistentes al Agua, Sudor y
 * Calor | No se destiñen»), y una app de anuncios la copia dentro de cada ficha
 * de producto. Aquí se saca «agua» y queda «Resistentes al Sudor y Calor». */
import { gql, comprobarErrores } from './api.js?v=202611111434';

const LISTA = `query ColeccionesTexto($despues: String) {
  collections(first: 100, after: $despues) {
    nodes { id title descriptionHtml seo { title description } }
    pageInfo { hasNextPage endCursor }
  }
}`;

const CAMBIAR = `mutation TextoColeccion($input: CollectionInput!) {
  collectionUpdate(input: $input) { collection { id } userErrors { field message } }
}`;

const AGUA = /\bagua\b|waterproof|water[- ]resistant|sumergible/i;

export function sinAgua(texto) {
  if (!texto) return texto;
  return texto
    /* «Resistentes al Agua, Sudor y Calor» o «al agua y sudor» → «al Sudor y Calor». */
    .replace(/(resistentes?\s+al\s+)agua\s*(?:,|\sy)\s*/gi, '$1')
    /* «| Resistentes al agua |» sola: se quita el tramo. */
    .replace(/\s*\|\s*resistentes?\s+al\s+agua\b\.?\s*(?=\||<|$)/gi, ' ');
}

export async function quitarAguaDeColecciones() {
  const cambiadas = [];
  const quedan = [];
  let despues = null;
  do {
    const d = (await gql(LISTA, { despues }, { sinMemoria: true })).collections;
    for (const c of d.nodes) {
      const antes = c.descriptionHtml || '';
      const html = sinAgua(antes);
      const seo = c.seo?.description ? sinAgua(c.seo.description) : '';
      const input = { id: c.id };
      if (html !== antes) input.descriptionHtml = html;
      if (seo && seo !== c.seo.description) input.seo = { title: c.seo.title, description: seo };
      if (Object.keys(input).length > 1) {
        comprobarErrores(await gql(CAMBIAR, { input }), 'collectionUpdate');
        cambiadas.push(c.title);
      }
      if (AGUA.test(html) || AGUA.test(seo)) quedan.push(c.title);
    }
    despues = d.pageInfo.hasNextPage ? d.pageInfo.endCursor : null;
  } while (despues);
  return { cambiadas, quedan };
}
