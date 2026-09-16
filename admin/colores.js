/* Saint Venik · Pantalla de colores.
 *
 * Edita las entradas del metaobjeto `color`, que es lo que el bloque del
 * storefront usa para dibujar cada muestra. La union entre un producto y su
 * color es la etiqueta: el producto lleva `oro` o `acero-inox`, y la entrada
 * guarda esa misma etiqueta en el campo `etiqueta`.
 */
import { gql, comprobarErrores } from './api.js?v=202609161010';

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

export async function guardarColor(id, { nombre, etiqueta, muestra, muestraOriginal }) {
  const campos = [
    { key: 'nombre', value: nombre },
    { key: 'etiqueta', value: etiqueta },
  ];

  /* Un <input type="color"> nunca está vacío, así que "no elegí color" y "elegí
   * gris" llegan aquí iguales. Solo se escribe si el usuario lo tocó de verdad,
   * porque si no, guardar un nombre dejaría un gris que nadie eligió y la tienda
   * lo pintaría. */
  if (muestra && muestra !== muestraOriginal) campos.push({ key: 'muestra', value: muestra });

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
export function normalizarEtiqueta(e) {
  return String(e ?? '').trim().toLowerCase();
}

export function ordenarComoLaTienda(colores, ordenEtiquetas) {
  /* El Liquid compara en minúsculas y sin espacios (downcase | strip). Si aquí
   * se compara en crudo, basta una etiqueta escrita "Oro" para que el panel la
   * mande al final y la tienda la ponga primera: dos órdenes distintos y ningún
   * error. */
  const posicion = new Map(ordenEtiquetas.map((e, i) => [normalizarEtiqueta(e), i]));
  const donde = (c) => {
    const k = normalizarEtiqueta(c.etiqueta);
    return posicion.has(k) ? posicion.get(k) : Number.MAX_SAFE_INTEGER;
  };
  return [...colores].sort((a, b) => donde(a) - donde(b));
}

export function problemasDe(color) {
  const problemas = [];
  if (!color.etiqueta) problemas.push('Sin etiqueta: ningún producto puede emparejarse con este color.');
  if (!color.imagen && !color.muestra) problemas.push('Sin imagen ni color: la muestra saldrá en blanco.');
  return problemas;
}


/* La imagen de la muestra se guarda como referencia al archivo de la tienda.
 * Un valor vacio la quita. */
export async function guardarImagenColor(id, idArchivo) {
  const r = await gql(ACTUALIZAR, {
    id,
    fields: [{ key: 'imagen_muestra', value: idArchivo ?? '' }],
  });
  return comprobarErrores(r, 'metaobjectUpdate');
}
