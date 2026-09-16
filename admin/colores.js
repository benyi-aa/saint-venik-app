/* Saint Venik · Pantalla de colores.
 *
 * Edita las entradas del metaobjeto `color`, que es lo que el bloque del
 * storefront usa para dibujar cada muestra. La union entre un producto y su
 * color es la etiqueta: el producto lleva `oro` o `acero-inox`, y la entrada
 * guarda esa misma etiqueta en el campo `etiqueta`.
 */
import { gql, comprobarErrores } from './api.js?v=202609160710';

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

const CREAR = `
  mutation CrearColor($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`;

const BORRAR = `
  mutation BorrarColor($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors { field message code }
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

export async function guardarColor(id, { nombre, etiqueta, muestra }) {
  const campos = [
    { key: 'nombre', value: nombre },
    { key: 'etiqueta', value: etiqueta },
  ];

  /* La muestra solo se manda si viene con algo: un valor vacío en un campo de
   * tipo color es un error de validación, no un "déjalo en blanco". */
  if (muestra) campos.push({ key: 'muestra', value: muestra });

  const resultado = await gql(ACTUALIZAR, { id, fields: campos });
  return comprobarErrores(resultado, 'metaobjectUpdate');
}

export async function crearColor({ nombre, etiqueta, muestra }) {
  const campos = [{ key: 'nombre', value: nombre }];
  if (etiqueta) campos.push({ key: 'etiqueta', value: etiqueta });
  if (muestra) campos.push({ key: 'muestra', value: muestra });

  const r = await gql(CREAR, { metaobject: { type: 'color', fields: campos } });
  return comprobarErrores(r, 'metaobjectCreate').metaobject;
}

export async function borrarColor(id) {
  const r = await gql(BORRAR, { id });
  return comprobarErrores(r, 'metaobjectDelete');
}

/* Una entrada solo sirve para el storefront si tiene etiqueta y algo que
 * pintar. Lo avisamos aqui porque es el fallo que ya nos mordio una vez: habia
 * entradas con la etiqueta y sin imagen, y las muestras salian en blanco. */
/* El orden de las muestras en la ficha no lo decide el orden en que Shopify
 * devuelve las entradas: lo decide esta lista de etiquetas, que es la misma que
 * lee el bloque de la tienda. Sin esto la vista previa y la tienda pueden
 * discrepar, que es el peor fallo de una vista previa. */
export function ordenarComoLaTienda(colores, ordenEtiquetas) {
  const posicion = new Map(ordenEtiquetas.map((e, i) => [e, i]));
  return [...colores].sort((a, b) => {
    const pa = posicion.has(a.etiqueta) ? posicion.get(a.etiqueta) : Number.MAX_SAFE_INTEGER;
    const pb = posicion.has(b.etiqueta) ? posicion.get(b.etiqueta) : Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });
}

export function problemasDe(color) {
  const problemas = [];
  if (!color.etiqueta) problemas.push('Sin etiqueta: ningún producto puede emparejarse con este color.');
  if (!color.imagen && !color.muestra) problemas.push('Sin imagen ni color: la muestra saldrá en blanco.');
  return problemas;
}
