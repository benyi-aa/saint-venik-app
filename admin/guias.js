/* Saint Venik · Guias de tallas.
 *
 * La estructura vive en dos metaobjetos:
 *
 *   bloque_guia      una pieza de contenido: texto, imagen, video o PDF.
 *                    Lleva su version en espanol y en ingles, y dos casillas
 *                    de visibilidad independientes, porque hay contenido que
 *                    existe en un idioma y no en el otro.
 *
 *   guia_de_tallas   una guia (anillos, cadenas y colgantes, pulseras) con su
 *                    lista ordenada de bloques.
 *
 * Los dos se crean con acceso PUBLIC_READ desde el storefront: sin eso el
 * bloque Liquid no podria leerlos y la guia saldria vacia en la tienda.
 */
import { gql, comprobarErrores } from './api.js';

export const TIPO_BLOQUE = 'bloque_guia';
export const TIPO_GUIA = 'guia_de_tallas';

export const GUIAS_INICIALES = [
  { handle: 'anillos', nombre: 'Anillos' },
  { handle: 'cadenas-y-colgantes', nombre: 'Cadenas y colgantes' },
  { handle: 'pulseras', nombre: 'Pulseras' },
];

const DEFINICIONES = `
  query Definiciones {
    bloque: metaobjectDefinitionByType(type: "${TIPO_BLOQUE}") { id name }
    guia: metaobjectDefinitionByType(type: "${TIPO_GUIA}") { id name }
  }
`;

const CREAR_DEFINICION = `
  mutation CrearDefinicion($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message code }
    }
  }
`;

const CREAR_ENTRADA = `
  mutation CrearEntrada($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`;

const GUIAS = `
  query Guias {
    metaobjects(type: "${TIPO_GUIA}", first: 20) {
      nodes {
        id
        handle
        fields {
          key
          value
          references(first: 50) {
            nodes {
              ... on Metaobject {
                id
                fields { key value reference { ... on MediaImage { image { url } } ... on GenericFile { url } } }
              }
            }
          }
        }
      }
    }
  }
`;

const CAMPOS_BLOQUE = [
  { key: 'tipo', name: 'Tipo', type: 'single_line_text_field', required: true,
    validations: [{ name: 'choices', value: JSON.stringify(['texto', 'imagen', 'video', 'pdf']) }] },
  { key: 'texto_es', name: 'Texto en español', type: 'multi_line_text_field' },
  { key: 'texto_en', name: 'Texto en inglés', type: 'multi_line_text_field' },
  { key: 'imagen', name: 'Imagen', type: 'file_reference' },
  { key: 'video_url', name: 'Vídeo (URL)', type: 'url' },
  { key: 'pdf', name: 'PDF', type: 'file_reference' },
  { key: 'mostrar_es', name: 'Mostrar en español', type: 'boolean' },
  { key: 'mostrar_en', name: 'Mostrar en inglés', type: 'boolean' },
];

export async function estadoEstructura() {
  const datos = await gql(DEFINICIONES);
  return { bloque: datos.bloque?.id ?? null, guia: datos.guia?.id ?? null };
}

/* Idempotente: se puede repetir sin duplicar nada. */
export async function crearEstructura() {
  const estado = await estadoEstructura();
  const pasos = [];

  let idBloque = estado.bloque;
  if (!idBloque) {
    const r = await gql(CREAR_DEFINICION, {
      definition: {
        type: TIPO_BLOQUE,
        name: 'Bloque de guía de tallas',
        access: { storefront: 'PUBLIC_READ' },
        fieldDefinitions: CAMPOS_BLOQUE,
      },
    });
    idBloque = comprobarErrores(r, 'metaobjectDefinitionCreate').metaobjectDefinition.id;
    pasos.push('Definición de bloques creada');
  }

  if (!estado.guia) {
    const r = await gql(CREAR_DEFINICION, {
      definition: {
        type: TIPO_GUIA,
        name: 'Guía de tallas',
        access: { storefront: 'PUBLIC_READ' },
        displayNameKey: 'nombre',
        fieldDefinitions: [
          { key: 'nombre', name: 'Nombre', type: 'single_line_text_field', required: true },
          {
            key: 'bloques', name: 'Bloques', type: 'list.metaobject_reference',
            validations: [{ name: 'metaobject_definition_id', value: idBloque }],
          },
        ],
      },
    });
    comprobarErrores(r, 'metaobjectDefinitionCreate');
    pasos.push('Definición de guías creada');
  }

  const existentes = new Set((await cargarGuias()).map((g) => g.handle));
  for (const guia of GUIAS_INICIALES) {
    if (existentes.has(guia.handle)) continue;
    const r = await gql(CREAR_ENTRADA, {
      metaobject: {
        type: TIPO_GUIA,
        handle: guia.handle,
        fields: [{ key: 'nombre', value: guia.nombre }],
        capabilities: { publishable: { status: 'ACTIVE' } },
      },
    });
    comprobarErrores(r, 'metaobjectCreate');
    pasos.push(`Guía "${guia.nombre}" creada`);
  }

  return pasos;
}

export async function cargarGuias() {
  const datos = await gql(GUIAS);
  return datos.metaobjects.nodes.map((n) => {
    const campos = Object.fromEntries(n.fields.map((f) => [f.key, f]));
    return {
      id: n.id,
      handle: n.handle,
      nombre: campos.nombre?.value ?? n.handle,
      bloques: (campos.bloques?.references?.nodes ?? []).map((b) => {
        const c = Object.fromEntries(b.fields.map((f) => [f.key, f]));
        return {
          id: b.id,
          tipo: c.tipo?.value ?? 'texto',
          textoEs: c.texto_es?.value ?? '',
          textoEn: c.texto_en?.value ?? '',
          mostrarEs: c.mostrar_es?.value === 'true',
          mostrarEn: c.mostrar_en?.value === 'true',
        };
      }),
    };
  });
}
