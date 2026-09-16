/* Saint Venik · Pantalla de colores.
 *
 * Edita las entradas del metaobjeto `color`, que es lo que el bloque del
 * storefront usa para dibujar cada muestra. La union entre un producto y su
 * color es la etiqueta: el producto lleva `oro` o `acero-inox`, y la entrada
 * guarda esa misma etiqueta en el campo `etiqueta`.
 */
import { gql, comprobarErrores } from './api.js';

const CONSULTA_COLORES = `
  query Colores {
    metaobjects(type: "color", first: 50) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference { ... on MediaImage { id image { url altText } } }
        }
      }
    }
  }
`;

const ACTUALIZAR = `
  mutation ActualizarColor($id: ID!, $fields: [MetaobjectFieldInput!]!) {
    metaobjectUpdate(id: $id, metaobject: { fields: $fields }) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

function aObjeto(entrada) {
  const campos = {};
  for (const c of entrada.fields) {
    campos[c.key] = { valor: c.value, imagen: c.reference?.image?.url ?? null };
  }
  return {
    id: entrada.id,
    handle: entrada.handle,
    nombre: campos.nombre?.valor ?? '',
    etiqueta: campos.etiqueta?.valor ?? '',
    muestra: campos.muestra?.valor ?? '',
    imagen: campos.imagen_muestra?.imagen ?? null,
    tieneImagen: Boolean(campos.imagen_muestra?.valor),
  };
}

export async function cargarColores() {
  const datos = await gql(CONSULTA_COLORES);
  return datos.metaobjects.nodes.map(aObjeto);
}

export async function guardarColor(id, { nombre, etiqueta }) {
  const resultado = await gql(ACTUALIZAR, {
    id,
    fields: [
      { key: 'nombre', value: nombre },
      { key: 'etiqueta', value: etiqueta },
    ],
  });
  return comprobarErrores(resultado, 'metaobjectUpdate');
}

/* Una entrada solo sirve para el storefront si tiene etiqueta y algo que
 * pintar. Lo avisamos aqui porque es el fallo que ya nos mordio una vez: habia
 * entradas con la etiqueta y sin imagen, y las muestras salian en blanco. */
export function problemasDe(color) {
  const problemas = [];
  if (!color.etiqueta) problemas.push('Sin etiqueta: ningún producto puede emparejarse con este color.');
  if (!color.imagen && !color.muestra) problemas.push('Sin imagen ni color: la muestra saldrá en blanco.');
  return problemas;
}
