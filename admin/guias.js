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
import { gql, comprobarErrores, capacidadActiva } from './api.js?v=202609170133';
import { asegurarConfig, existeConfig, faltanCamposConfig } from './config.js?v=202609170133';
import { faltaEstructuraColor, asegurarEstructuraColor } from './colores.js?v=202609170133';

export const TIPO_BLOQUE = 'bloque_guia';

export const TIPOS = ['texto', 'html', 'imagen', 'video', 'pdf'];
export const TIPO_GUIA = 'guia_de_tallas';

export const GUIAS_INICIALES = [
  { handle: 'anillos', nombre: 'Anillos', palabras: 'anillo, ring' },
  { handle: 'cadenas-y-colgantes', nombre: 'Cadenas y colgantes', palabras: 'cadena, collar, chain, colgante, pendant, dije' },
  { handle: 'pulseras', nombre: 'Pulseras', palabras: 'pulsera, bracelet' },
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
    metaobjectDefinitionByType(type: $type) {
      id
      access { storefront }
      fieldDefinitions { key type { name } validations { name value } }
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
    validations: [{ name: 'choices', value: JSON.stringify(TIPOS) } ] },
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
  { key: 'palabras_clave', name: 'Palabras clave', type: 'single_line_text_field' },
  /* Sin la validación que lo ata a bloque_guia, Shopify rechaza el campo. La
   * definición del bloque no se conoce hasta ejecutar, así que se completa
   * justo antes de crearlo. */
  { key: 'bloques', name: 'Bloques', type: 'list.metaobject_reference', necesitaIdDeBloque: true },
];

async function faltanCampos(tipo, esperados) {
  const d = await gql(CAMPOS_DE, { type: tipo });
  if (!d.metaobjectDefinitionByType) return esperados.map((c) => c.key);
  const presentes = new Set(d.metaobjectDefinitionByType.fieldDefinitions.map((f) => f.key));
  return esperados.filter((c) => !presentes.has(c.key)).map((c) => c.key);
}

/* Que el campo exista no basta: si es de otro tipo, o si la definición no se
 * puede leer desde la tienda, el panel diría que todo está bien y la ficha no
 * mostraría nada. Es el modo de fallo que más cuesta diagnosticar, y el que
 * puede aparecer al instalar en una tienda que ya tenía sus propios datos. */
export async function problemasDeDefinicion(tipo, esperados) {
  const d = await gql(CAMPOS_DE, { type: tipo });
  const def = d.metaobjectDefinitionByType;
  if (!def) return [];

  const problemas = [];

  if (def.access?.storefront !== 'PUBLIC_READ') {
    problemas.push(`«${tipo}» no se puede leer desde la tienda, así que los bloques no mostrarán nada.`);
  }

  const porClave = new Map(def.fieldDefinitions.map((f) => [f.key, f.type?.name]));
  for (const esperado of esperados) {
    const real = porClave.get(esperado.key);
    if (real && real !== esperado.type) {
      problemas.push(`El campo «${esperado.key}» de «${tipo}» es ${real} y debería ser ${esperado.type}.`);
    }
  }

  return problemas;
}

async function faltanOpcionesDeTipo() {
  const d = await gql(CAMPOS_DE, { type: TIPO_BLOQUE });
  const campo = d.metaobjectDefinitionByType?.fieldDefinitions.find((f) => f.key === 'tipo');
  if (!campo) return [];

  const choices = campo.validations.find((v) => v.name === 'choices');
  let actuales = [];
  try { actuales = JSON.parse(choices?.value ?? '[]'); } catch { actuales = []; }

  return TIPOS.filter((t) => !actuales.includes(t));
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

  if (!(await existeConfig())) {
    pendientes.push('El sitio donde se guarda la configuración.');
  } else {
    const faltan = await faltanCamposConfig();
    if (faltan.length) pendientes.push(`Campos de configuración que faltan: ${faltan.join(', ')}.`);
  }

  /* Los colores también son estructura. En saintvenik.com existen porque se
   * crearon a mano, pero la app tiene que poder montarlos en cualquier tienda. */
  pendientes.push(...(await faltaEstructuraColor()));

  for (const [tipo, esperados] of [[TIPO_BLOQUE, CAMPOS_BLOQUE], [TIPO_GUIA, CAMPOS_GUIA]]) {
    pendientes.push(...(await problemasDeDefinicion(tipo, esperados)));
  }

  if (estado.bloque) {
    const faltan = await faltanOpcionesDeTipo();
    if (faltan.length) pendientes.push(`Tipos de bloque que faltan: ${faltan.join(', ')}.`);
  }

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
          { key: 'palabras_clave', name: 'Palabras clave', type: 'single_line_text_field' },
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
  await asegurarEstructuraColor(pasos);

  /* El campo `tipo` limita sus valores con una lista de opciones. Un tipo nuevo
   * no basta con soportarlo en el panel: hay que ampliar esa lista o Shopify
   * rechaza el bloque al crearlo. */
  if (idBloque) {
    const faltanTipos = await faltanOpcionesDeTipo();
    if (faltanTipos.length) {
      const r = await gql(ACTUALIZAR_DEFINICION, {
        id: idBloque,
        definition: {
          fieldDefinitions: [{
            update: {
              key: 'tipo',
              validations: [{ name: 'choices', value: JSON.stringify(TIPOS) }],
            },
          }],
        },
      });
      comprobarErrores(r, 'metaobjectDefinitionUpdate');
      pasos.push(`Tipos de bloque añadidos: ${faltanTipos.join(', ')}`);
    }
  }

  const idGuia = estado.guia ?? (await estadoEstructura()).guia;
  if (idGuia) await completarCampos(TIPO_GUIA, idGuia, CAMPOS_GUIA, pasos, idBloque);

  const yaEstan = await cargarGuias();

  /* Una guía creada por una versión anterior no tiene palabras clave, y sin
   * ellas ningún producto la encuentra. Se siembran solo si están vacías, para
   * no pisar lo que el usuario haya escrito. */
  for (const existente of yaEstan) {
    if (existente.palabras) continue;
    const inicial = GUIAS_INICIALES.find((g) => g.handle === existente.handle);
    if (!inicial) continue;
    await guardarGuia(existente.id, {
      nombre: existente.nombre,
      nombreEn: existente.nombreEn,
      palabras: inicial.palabras,
    });
    pasos.push(`Palabras clave de «${existente.nombre}» rellenadas`);
  }

  const existentes = new Set(yaEstan.map((g) => g.handle));
  for (const guia of GUIAS_INICIALES) {
    if (existentes.has(guia.handle)) continue;
    const r = await gql(CREAR_ENTRADA, {
      metaobject: {
        type: TIPO_GUIA,
        handle: guia.handle,
        fields: [
          { key: 'nombre', value: guia.nombre },
          { key: 'palabras_clave', value: guia.palabras },
        ],
      },
    });
    comprobarErrores(r, 'metaobjectCreate');
    pasos.push(`Guía "${guia.nombre}" creada`);
  }

  return pasos;
}

async function completarCampos(tipo, id, esperados, pasos, idBloque = null) {
  const campos = await gql(CAMPOS_DE, { type: tipo });
  const presentes = new Set((campos.metaobjectDefinitionByType?.fieldDefinitions ?? []).map((f) => f.key));
  const faltan = esperados.filter((c) => !presentes.has(c.key));
  if (!faltan.length) return;

  const r = await gql(ACTUALIZAR_DEFINICION, {
    id,
    definition: {
      fieldDefinitions: faltan.map((campo) => {
        const { necesitaIdDeBloque, ...limpio } = campo;
        if (!necesitaIdDeBloque) return { create: limpio };
        return {
          create: {
            ...limpio,
            validations: [{ name: 'metaobject_definition_id', value: idBloque }],
          },
        };
      }),
    },
  });
  comprobarErrores(r, 'metaobjectDefinitionUpdate');
  pasos.push(`Campos añadidos a ${tipo}: ${faltan.map((c) => c.key).join(', ')}`);
}

export const TOPE_GUIAS = 20;
export const TOPE_BLOQUES = 50;

export async function cargarGuias() {
  const datos = await gql(GUIAS);
  return datos.metaobjects.nodes.map((n) => {
    const campos = Object.fromEntries(n.fields.map((f) => [f.key, f]));
    return {
      id: n.id,
      handle: n.handle,
      nombre: campos.nombre?.value ?? n.handle,
      nombreEn: campos.nombre_en?.value ?? '',
      palabras: campos.palabras_clave?.value ?? '',
      bloques: (campos.bloques?.references?.nodes ?? []).map((b) => {
        const c = Object.fromEntries(b.fields.map((f) => [f.key, f]));
        return {
          id: b.id,
          tipo: c.tipo?.value ?? 'texto',
          imagenId: c.imagen?.value ?? '',
          imagenUrl: c.imagen?.reference?.image?.url ?? '',
          pdfId: c.pdf?.value ?? '',
          pdfUrl: c.pdf?.reference?.url ?? '',
          textoEs: c.texto_es?.value ?? '',
          textoEn: c.texto_en?.value ?? '',
          videoUrl: c.video_url?.value ?? '',
          mostrarEs: c.mostrar_es?.value === 'true',
          mostrarEn: c.mostrar_en?.value === 'true',
          orden: Number(c.orden?.value ?? 0),
        };
      }).sort((a, b2) => a.orden - b2.orden),
      /* Si se llega al tope pudo quedarse algo fuera, y perder bloques en
       * silencio sería peor que decirlo. */
      puedeFaltarBloque: (campos.bloques?.references?.nodes ?? []).length >= TOPE_BLOQUES,
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



export const NOMBRE_TIPO = {
  texto: 'Texto',
  html: 'HTML',
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


/* Una guia nueva nace sin bloques, y asi no se ve en la tienda: el bloque de
 * la ficha no dibuja el boton si la guia no tiene nada visible. Se puede crear
 * y rellenar con calma sin que un cliente vea una ventana vacia.
 *
 * Ojo con las palabras clave: si un producto encaja en dos guias, la tienda usa
 * la primera que devuelve Shopify, y ese orden no esta garantizado. Para eso
 * esta "Comprobar que productos coinciden" en el editor. */
export async function crearGuia({ nombre, nombreEn, palabras }) {
  const actuales = await cargarGuias();
  if (actuales.length >= TOPE_GUIAS) {
    throw new Error(`Ya hay ${TOPE_GUIAS} guías, que es lo máximo que lee el panel. Quita una en Contenido → Metaobjetos antes de crear otra.`);
  }
  const fields = [{ key: 'nombre', value: nombre }];
  if (nombreEn) fields.push({ key: 'nombre_en', value: nombreEn });
  if (palabras) fields.push({ key: 'palabras_clave', value: palabras });

  /* Sin handle: Shopify lo deriva del nombre, que es el campo que se muestra. */
  const metaobject = { type: TIPO_GUIA, fields };
  const capabilities = await capacidadActiva(TIPO_GUIA);
  if (capabilities) metaobject.capabilities = capabilities;

  const r = await gql(CREAR_ENTRADA, { metaobject });
  return comprobarErrores(r, 'metaobjectCreate').metaobject;
}

export async function guardarGuia(id, { nombre, nombreEn, palabras }) {
  const r = await gql(ACTUALIZAR_ENTRADA, {
    id,
    metaobject: {
      fields: [
        { key: 'nombre', value: nombre },
        { key: 'nombre_en', value: nombreEn ?? '' },
        { key: 'palabras_clave', value: palabras ?? '' },
      ],
    },
  });
  return comprobarErrores(r, 'metaobjectUpdate');
}


/* Los campos de archivo se guardan aparte del resto: el archivo se sube (o se
 * elige) primero y aqui solo se anota su referencia. Un valor vacio lo quita. */
export async function guardarArchivoDeBloque(id, campo, idArchivo) {
  if (campo !== 'imagen' && campo !== 'pdf') throw new Error(`Campo de archivo desconocido: ${campo}`);
  const r = await gql(ACTUALIZAR_ENTRADA, {
    id,
    metaobject: { fields: [{ key: campo, value: idArchivo ?? '' }] },
  });
  return comprobarErrores(r, 'metaobjectUpdate');
}


/* ---------------------------------------------------------------------------
 * A que guia pertenece un producto
 *
 * Se decide por palabras clave contra el tipo, el titulo y las etiquetas del
 * producto. Es la misma regla que el tema ya usa hoy, y evita tener que asignar
 * una guia a mano a 154 productos: un producto nuevo la encuentra solo.
 * ------------------------------------------------------------------------- */

const PRODUCTOS = `
  query Productos($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id title productType tags status }
    }
  }
`;

export function coincide(producto, palabras) {
  const texto = [producto.productType, producto.title, ...(producto.tags ?? [])]
    .join(' ')
    .toLowerCase();
  return palabras
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
    .some((p) => texto.includes(p));
}

/* Bajo demanda, no al cargar la pantalla: recorrer el catalogo entero cuesta
 * varias llamadas y no hace falta salvo que se quiera comprobar. */
export async function revisarReparto(guias) {
  const productos = [];
  let cursor = null;
  do {
    const d = await gql(PRODUCTOS, { cursor });
    productos.push(...d.products.nodes);
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);

  /* Solo cuentan los que estan a la venta. Un borrador sin guia no es un
   * problema que haya que resolver, y meterlo en la cuenta solo asusta. */
  const activos = productos.filter((p) => p.status === 'ACTIVE');

  const conteo = new Map(guias.map((g) => [g.handle, 0]));
  const sinGuia = [];
  const ambiguos = [];

  for (const producto of activos) {
    const suyas = guias.filter((g) => g.palabras && coincide(producto, g.palabras));
    if (!suyas.length) { sinGuia.push(producto); continue; }
    if (suyas.length > 1) ambiguos.push({ producto, guias: suyas.map((g) => g.nombre) });
    conteo.set(suyas[0].handle, conteo.get(suyas[0].handle) + 1);
  }

  return {
    total: activos.length,
    borradores: productos.length - activos.length,
    conteo,
    sinGuia,
    ambiguos,
  };
}
