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
 *
 * Cada bloque lleva su propia posicion en el campo `orden`, y el Liquid ordena
 * por ese numero. Podria bastar con el orden de la lista `bloques`, pero Shopify
 * no documenta en ningun sitio que ese orden se conserve, y en Liquid los campos
 * list.metaobject_reference tienen fallos conocidos: `.value` devolviendo solo el
 * primer elemento, y orden por handle en vez de por insercion. Un numero explicito
 * cuesta un campo y quita una forma de fallar en silencio, que es la peor: se veria
 * bien en el panel y desordenado en la tienda.
 *
 * No se usa la capacidad `publishable` (el borrador/publicado de Shopify).
 * Pedir estado ACTIVE en una entrada cuya definicion no la tiene activada falla
 * con "La capacidad no esta activada: publishable", y aqui no aporta nada: la
 * visibilidad en la tienda ya la decide PUBLIC_READ.
 */
import { gql, comprobarErrores } from './api.js?v=202609160910';
import { asegurarConfig, existeConfig } from './config.js?v=202609160910';

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

const ACTUALIZAR_DEFINICION = `
  mutation ActualizarDefinicion($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition { id }
      userErrors { field message code }
    }
  }
`;

const CAMPOS_DE = `
  query CamposDe($type: String!) {
    metaobjectDefinitionByType(type: $type) { id fieldDefinitions { key } }
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
  { key: 'orden', name: 'Posición', type: 'number_integer' },
];

const CAMPOS_GUIA = [
  { key: 'nombre', name: 'Nombre en español', type: 'single_line_text_field', required: true },
  { key: 'nombre_en', name: 'Nombre en inglés', type: 'single_line_text_field' },
  { key: 'bloques', name: 'Bloques', type: 'list.metaobject_reference' },
];

async function faltanCampos(tipo, esperados) {
  const d = await gql(CAMPOS_DE, { type: tipo });
  if (!d.metaobjectDefinitionByType) return esperados.map((c) => c.key);
  const presentes = new Set(d.metaobjectDefinitionByType.fieldDefinitions.map((f) => f.key));
  return esperados.filter((c) => !presentes.has(c.key)).map((c) => c.key);
}

/* La estructura no son solo los tipos de contenido: son tambien sus campos.
 * Mirar solo los tipos dejaba al panel ofreciendo un campo que en la tienda no
 * existia, y el fallo aparecia al guardar, que es tarde y desconcierta. */
export async function revisarEstructura() {
  const estado = await estadoEstructura();
  const pendientes = [];

  if (!estado.bloque) pendientes.push('El tipo de contenido de los bloques.');
  if (!estado.guia) pendientes.push('El tipo de contenido de las guías.');

  if (estado.bloque) {
    const faltan = await faltanCampos(TIPO_BLOQUE, CAMPOS_BLOQUE);
    if (faltan.length) pendientes.push(`Campos que faltan en los bloques: ${faltan.join(', ')}.`);
  }
  if (estado.guia) {
    const faltan = await faltanCampos(TIPO_GUIA, CAMPOS_GUIA);
    if (faltan.length) pendientes.push(`Campos que faltan en las guías: ${faltan.join(', ')}.`);
  }

  if (!(await existeConfig())) pendientes.push('El sitio donde se guarda la configuración.');

  return { estado, pendientes };
}

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

  /* Una definicion creada por una version anterior de la app puede no tener
   * todos los campos. Se completan en vez de obligar a rehacerla. */
  await completarCampos(TIPO_BLOQUE, idBloque, CAMPOS_BLOQUE, pasos);

  if (!estado.guia) {
    const r = await gql(CREAR_DEFINICION, {
      definition: {
        type: TIPO_GUIA,
        name: 'Guía de tallas',
        access: { storefront: 'PUBLIC_READ' },
        displayNameKey: 'nombre',
        fieldDefinitions: [
          { key: 'nombre', name: 'Nombre en español', type: 'single_line_text_field', required: true },
          { key: 'nombre_en', name: 'Nombre en inglés', type: 'single_line_text_field' },
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

  await asegurarConfig(pasos);

  const idGuia = estado.guia ?? (await estadoEstructura()).guia;
  if (idGuia) await completarCampos(TIPO_GUIA, idGuia, CAMPOS_GUIA, pasos);

  const existentes = new Set((await cargarGuias()).map((g) => g.handle));
  for (const guia of GUIAS_INICIALES) {
    if (existentes.has(guia.handle)) continue;
    const r = await gql(CREAR_ENTRADA, {
      metaobject: {
        type: TIPO_GUIA,
        handle: guia.handle,
        fields: [{ key: 'nombre', value: guia.nombre }],
      },
    });
    comprobarErrores(r, 'metaobjectCreate');
    pasos.push(`Guía "${guia.nombre}" creada`);
  }

  return pasos;
}

async function completarCampos(tipo, id, esperados, pasos) {
  const campos = await gql(CAMPOS_DE, { type: tipo });
  const presentes = new Set((campos.metaobjectDefinitionByType?.fieldDefinitions ?? []).map((f) => f.key));
  const faltan = esperados.filter((c) => !presentes.has(c.key));
  if (!faltan.length) return;

  const r = await gql(ACTUALIZAR_DEFINICION, {
    id,
    definition: { fieldDefinitions: faltan.map((c) => ({ create: c })) },
  });
  comprobarErrores(r, 'metaobjectDefinitionUpdate');
  pasos.push(`Campos añadidos a ${tipo}: ${faltan.map((c) => c.key).join(', ')}`);
}

export async function cargarGuias() {
  const datos = await gql(GUIAS);
  return datos.metaobjects.nodes.map((n) => {
    const campos = Object.fromEntries(n.fields.map((f) => [f.key, f]));
    return {
      id: n.id,
      handle: n.handle,
      nombre: campos.nombre?.value ?? n.handle,
      nombreEn: campos.nombre_en?.value ?? '',
      bloques: (campos.bloques?.references?.nodes ?? []).map((b) => {
        const c = Object.fromEntries(b.fields.map((f) => [f.key, f]));
        return {
          id: b.id,
          tipo: c.tipo?.value ?? 'texto',
          textoEs: c.texto_es?.value ?? '',
          textoEn: c.texto_en?.value ?? '',
          videoUrl: c.video_url?.value ?? '',
          mostrarEs: c.mostrar_es?.value === 'true',
          mostrarEn: c.mostrar_en?.value === 'true',
          orden: Number(c.orden?.value ?? 0),
        };
      }).sort((a, b2) => a.orden - b2.orden),
    };
  });
}


/* ---------------------------------------------------------------------------
 * Bloques
 *
 * La pertenencia de un bloque a una guia la da la lista `bloques` de la guia.
 * El ORDEN, en cambio, lo da el campo `orden` de cada bloque, y es el que manda:
 * mover un bloque intercambia dos numeros, no reescribe la lista. Asi el orden
 * no depende de que Shopify conserve el de la lista, que no esta garantizado.
 * ------------------------------------------------------------------------- */

const ACTUALIZAR_ENTRADA = `
  mutation ActualizarEntrada($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message code }
    }
  }
`;

const BORRAR_ENTRADA = `
  mutation BorrarEntrada($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors { field message code }
    }
  }
`;

const TIPOS = ['texto', 'imagen', 'video', 'pdf'];

export const NOMBRE_TIPO = {
  texto: 'Texto',
  imagen: 'Imagen',
  video: 'Vídeo',
  pdf: 'PDF',
};

async function escribirLista(guia, ids) {
  const r = await gql(ACTUALIZAR_ENTRADA, {
    id: guia.id,
    metaobject: { fields: [{ key: 'bloques', value: JSON.stringify(ids) }] },
  });
  return comprobarErrores(r, 'metaobjectUpdate');
}

export async function crearBloque(guia, tipo) {
  if (!TIPOS.includes(tipo)) throw new Error(`Tipo desconocido: ${tipo}`);

  const siguiente = guia.bloques.reduce((max, b) => Math.max(max, b.orden), 0) + 1;

  const r = await gql(CREAR_ENTRADA, {
    metaobject: {
      type: TIPO_BLOQUE,
      fields: [
        { key: 'tipo', value: tipo },
        { key: 'orden', value: String(siguiente) },
        { key: 'mostrar_es', value: 'true' },
        { key: 'mostrar_en', value: 'true' },
      ],
    },
  });
  const creado = comprobarErrores(r, 'metaobjectCreate').metaobject;

  await escribirLista(guia, [...guia.bloques.map((b) => b.id), creado.id]);
  return creado.id;
}

export async function guardarBloque(id, datos) {
  const campos = [
    { key: 'texto_es', value: datos.textoEs ?? '' },
    { key: 'texto_en', value: datos.textoEn ?? '' },
    { key: 'mostrar_es', value: String(Boolean(datos.mostrarEs)) },
    { key: 'mostrar_en', value: String(Boolean(datos.mostrarEn)) },
  ];
  if (datos.tipo === 'video') campos.push({ key: 'video_url', value: datos.videoUrl ?? '' });

  const r = await gql(ACTUALIZAR_ENTRADA, { id, metaobject: { fields: campos } });
  return comprobarErrores(r, 'metaobjectUpdate');
}

export async function borrarBloque(guia, id) {
  await escribirLista(guia, guia.bloques.filter((b) => b.id !== id).map((b) => b.id));
  const r = await gql(BORRAR_ENTRADA, { id });
  return comprobarErrores(r, 'metaobjectDelete');
}

/* Mover = intercambiar la posicion con el vecino. Dos escrituras, sin tocar la
 * lista de la guia. */
export async function moverBloque(guia, id, direccion) {
  const orden = [...guia.bloques].sort((a, b) => a.orden - b.orden);
  const i = orden.findIndex((b) => b.id === id);
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= orden.length) return;

  /* Las posiciones pueden venir repetidas o en cero de datos viejos, asi que se
   * reescribe la secuencia entera: barato y deja el estado siempre sano. */
  const intercambiado = [...orden];
  [intercambiado[i], intercambiado[j]] = [intercambiado[j], intercambiado[i]];

  for (let k = 0; k < intercambiado.length; k++) {
    const r = await gql(ACTUALIZAR_ENTRADA, {
      id: intercambiado[k].id,
      metaobject: { fields: [{ key: 'orden', value: String(k + 1) }] },
    });
    comprobarErrores(r, 'metaobjectUpdate');
  }
}


export async function guardarGuia(id, { nombre, nombreEn }) {
  const r = await gql(ACTUALIZAR_ENTRADA, {
    id,
    metaobject: {
      fields: [
        { key: 'nombre', value: nombre },
        { key: 'nombre_en', value: nombreEn ?? '' },
      ],
    },
  });
  return comprobarErrores(r, 'metaobjectUpdate');
}
