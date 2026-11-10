/* Saint Venik · A que productos alcanza algo.
 *
 * Las insignias ("Mas vendido") y los beneficios ("Resistente al agua") son
 * dos cosas distintas con el mismo problema debajo: una entrada de metaobjeto
 * que tiene que saber a que productos se aplica, elegidos a mano o por
 * coleccion entera. Eso es lo que vive aqui, para que las dos pantallas no
 * tengan dos copias del mismo CRUD que luego se separan.
 *
 * EL CAMPO `handles` Y POR QUE EXISTE
 * Lo natural seria que la tienda recorriera `productos` y `colecciones`. No se
 * puede: en Liquid un campo de lista de referencias solo deja leer 50
 * elementos por bucle, y una coleccion de oro pasa de 50 sin esfuerzo. Asi que
 * el panel resuelve las dos listas a una cadena de handles entre barras
 * (|anillo-x|collar-y|) y la tienda pregunta con un `contains`, sin bucle y
 * sin tope.
 *
 * El precio es que esa cadena se queda vieja cuando entra un producto nuevo a
 * una coleccion. Se paga de dos maneras: la pantalla la recalcula al abrirse,
 * y el storefront, en una pagina de coleccion, se fia de la coleccion y no de
 * la cadena.
 */
import { gql, comprobarErrores, capacidadActiva } from './api.js?v=202611100030';

/* Los campos que comparten los dos tipos. Cada pantalla añade los suyos. */
export const CAMPOS_COMUNES = [
  { key: 'nombre', name: 'Texto en español', type: 'single_line_text_field', required: true },
  { key: 'nombre_en', name: 'Texto en inglés', type: 'single_line_text_field' },
  { key: 'orden', name: 'Posición', type: 'number_integer' },
  { key: 'activo', name: 'Activo', type: 'boolean' },
  { key: 'productos', name: 'Productos', type: 'list.product_reference' },
  { key: 'colecciones', name: 'Colecciones', type: 'list.collection_reference' },
  /* Las etiquetas de producto son la taxonomia que esta tienda ya usa: cada
   * producto lleva `oro` o `acero-inox`, que es lo mismo que mira el selector
   * de color. Asignar por etiqueta acierta donde las colecciones se quedan
   * cortas (en .cl las colecciones "plateadas" solo cubren 72 de los 101
   * productos de acero). Van separadas por comas, como las palabras clave de
   * las guias. */
  { key: 'etiquetas', name: 'Etiquetas de producto', type: 'single_line_text_field' },
  { key: 'handles', name: 'Handles (lo calcula la app)', type: 'multi_line_text_field' },
];

/* Shopify topa las listas de referencias en 128. Es un limite del dato, no de
 * la app: mas vale decirlo al asignar que descubrirlo al guardar. */
export const TOPE_REFERENCIAS = 128;
export const TOPE_ENTRADAS = 25;

const DEFINICION = `
  query Definicion($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      access { storefront }
      fieldDefinitions { key type { name } }
    }
  }
`;

const CREAR_DEFINICION = `
  mutation CrearDefinicion($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id }
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

/* Sin `references`, a proposito. Pedirlas aqui costaba 50 entradas x 50
 * referencias, muy por encima del coste maximo que Shopify acepta en una sola
 * consulta, y ademas solo habria devuelto las 50 primeras de cada lista: al
 * volver a guardar se habrian borrado las demas. El valor crudo del campo trae
 * todos los GID, y los titulos se resuelven despues con `nodes`. */
const ENTRADAS = `
  query Entradas($type: String!) {
    metaobjects(type: $type, first: 50) {
      nodes {
        id
        handle
        fields { key value }
      }
    }
  }
`;

const TITULOS = `
  query Titulos($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product { id title handle }
      ... on Collection { id title handle productsCount { count } }
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

const ACTUALIZAR_ENTRADA = `
  mutation ActualizarEntrada($id: ID!, $fields: [MetaobjectFieldInput!]!) {
    metaobjectUpdate(id: $id, metaobject: { fields: $fields }) {
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

const ETIQUETAS_TIENDA = `
  query EtiquetasDeProducto {
    productTags(first: 250) { edges { node } }
  }
`;

const POR_ETIQUETA = `
  query ProductosPorEtiqueta($consulta: String!, $cursor: String) {
    products(first: 100, query: $consulta, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle }
    }
  }
`;

const COLECCIONES = `
  query Colecciones($cursor: String) {
    collections(first: 100, after: $cursor, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle title productsCount { count } }
    }
  }
`;

const PRODUCTOS_DE = `
  query ProductosDeColeccion($id: ID!, $cursor: String) {
    collection(id: $id) {
      products(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id handle }
      }
    }
  }
`;

/* ---------------------------------------------------------------------------
 * Lectura
 * ------------------------------------------------------------------------- */

/* El valor de un campo de lista de referencias es un JSON con los GID. Si esta
 * vacio o mal formado se devuelve una lista vacia en vez de reventar: una
 * entrada tocada a mano en el admin no debe tumbar la pantalla entera. */
function idsDe(campos, clave) {
  const valor = campos.find((c) => c.key === clave)?.value;
  if (!valor) return [];
  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : [];
  } catch (error) {
    return [];
  }
}

/* Las etiquetas viajan como texto separado por comas, pero en la pantalla son
 * fichas como las colecciones, asi que llevan un id falso para poder quitarlas
 * con el mismo codigo. */
export function listaDeEtiquetas(texto) {
  return String(texto ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ id: `tag:${t}`, titulo: t }));
}

export function aObjetoComun(entrada) {
  const valor = (clave) => entrada.fields.find((c) => c.key === clave)?.value ?? '';
  return {
    id: entrada.id,
    handle: entrada.handle,
    nombre: valor('nombre'),
    nombreEn: valor('nombre_en'),
    /* Una entrada vieja sin el campo no esta apagada: esta sin decidir, y lo
     * que esperaba el usuario al crearla es que se viera. */
    activo: valor('activo') !== 'false',
    orden: Number(valor('orden') || 0),
    handles: valor('handles'),
    etiquetas: listaDeEtiquetas(valor('etiquetas')),
    idsProductos: idsDe(entrada.fields, 'productos'),
    idsColecciones: idsDe(entrada.fields, 'colecciones'),
    productos: [],
    colecciones: [],
  };
}

/* Los titulos de todo lo referenciado, de una vez. Un producto borrado deja un
 * hueco (`nodes` devuelve null) y se descarta: la referencia muerta se limpia
 * sola la proxima vez que se guarde. */
const POR_TANDA = 100;

async function titulosDe(ids) {
  const mapa = new Map();
  for (let i = 0; i < ids.length; i += POR_TANDA) {
    const d = await gql(TITULOS, { ids: ids.slice(i, i + POR_TANDA) });
    for (const n of d.nodes ?? []) {
      if (!n?.id) continue;
      mapa.set(n.id, {
        id: n.id,
        titulo: n.title,
        handle: n.handle,
        ...(n.productsCount ? { cuantos: n.productsCount.count } : {}),
      });
    }
  }
  return mapa;
}

export async function cargarEntradas(tipo, aObjeto) {
  const d = await gql(ENTRADAS, { type: tipo });
  const entradas = d.metaobjects.nodes.map(aObjeto);

  const ids = [...new Set(entradas.flatMap((e) => [...e.idsProductos, ...e.idsColecciones]))];
  const titulos = ids.length ? await titulosDe(ids) : new Map();
  const resolver = (lista) => lista.map((id) => titulos.get(id)).filter(Boolean);

  for (const e of entradas) {
    e.productos = resolver(e.idsProductos);
    e.colecciones = resolver(e.idsColecciones);
  }

  return entradas.sort((a, b) => a.orden - b.orden);
}

/* ---------------------------------------------------------------------------
 * Escritura
 * ------------------------------------------------------------------------- */

export function camposComunes({ nombre, nombreEn, orden, activo, productos, colecciones, etiquetas, handles }) {
  const campos = [];
  if (nombre !== undefined) campos.push({ key: 'nombre', value: nombre });
  if (nombreEn !== undefined) campos.push({ key: 'nombre_en', value: nombreEn });
  if (orden !== undefined) campos.push({ key: 'orden', value: String(orden) });
  if (activo !== undefined) campos.push({ key: 'activo', value: String(Boolean(activo)) });
  if (productos !== undefined) {
    campos.push({ key: 'productos', value: JSON.stringify(productos.map((p) => p.id)) });
  }
  if (colecciones !== undefined) {
    campos.push({ key: 'colecciones', value: JSON.stringify(colecciones.map((c) => c.id)) });
  }
  if (etiquetas !== undefined) {
    campos.push({ key: 'etiquetas', value: etiquetas.map((e) => e.titulo).join(', ') });
  }
  if (handles !== undefined) campos.push({ key: 'handles', value: handles });
  return campos;
}

export async function guardarEntrada(id, campos) {
  const r = await gql(ACTUALIZAR_ENTRADA, { id, fields: campos });
  return comprobarErrores(r, 'metaobjectUpdate');
}

export async function crearEntrada(tipo, campos) {
  const metaobject = { type: tipo, fields: campos };
  const capabilities = await capacidadActiva(tipo);
  if (capabilities) metaobject.capabilities = capabilities;
  const r = await gql(CREAR_ENTRADA, { metaobject });
  return comprobarErrores(r, 'metaobjectCreate').metaobject;
}

export async function borrarEntrada(id) {
  const r = await gql(BORRAR_ENTRADA, { id });
  return comprobarErrores(r, 'metaobjectDelete');
}

/* ---------------------------------------------------------------------------
 * Colecciones y resolucion de handles
 * ------------------------------------------------------------------------- */

/* Las etiquetas que ya existen en la tienda, para poder ofrecerlas en vez de
 * obligar a escribirlas de memoria (y a acertar con el guion de acero-inox). */
/* Las colecciones y las etiquetas de la tienda se piden en cada pantalla y
 * cambian poco. Se guardan unos minutos: lo que se nota es volver de Guardar y
 * que la pantalla aparezca ya, y el precio es que una coleccion creada hace un
 * momento tarde eso en aparecer en el buscador. */
const VIDA_CACHE = 5 * 60 * 1000;
const cacheDeLista = new Map();

async function conCacheCorto(clave, traer) {
  const guardado = cacheDeLista.get(clave);
  if (guardado && Date.now() - guardado.cuando < VIDA_CACHE) return guardado.datos;
  const datos = await traer();
  cacheDeLista.set(clave, { cuando: Date.now(), datos });
  return datos;
}

export function olvidarListas() {
  cacheDeLista.clear();
}

export async function cargarEtiquetasDeTienda() {
  try {
    return await conCacheCorto('etiquetas', traerEtiquetasDeTienda);
  } catch (error) {
    /* El fallo NO se guarda: si se cacheara, un THROTTLED pasajero dejaria el
     * buscador sin sugerencias durante cinco minutos. El campo sigue sirviendo
     * escribiendo la etiqueta a mano, que es texto. */
    return [];
  }
}

async function traerEtiquetasDeTienda() {
  const d = await gql(ETIQUETAS_TIENDA);
  return (d.productTags?.edges ?? []).map((e) => e.node).filter(Boolean).sort();
}

export async function handlesDeEtiqueta(etiqueta) {
  const handles = [];
  let cursor = null;
  let vueltas = 0;
  /* Entre comillas simples: una etiqueta con espacios ("summer 2024") sin
   * comillas se parte en dos terminos y devuelve de mas. */
  const consulta = `tag:'${String(etiqueta).replace(/'/g, "")}'`;
  do {
    const d = await gql(POR_ETIQUETA, { consulta, cursor });
    const pagina = d.products;
    if (!pagina) break;
    handles.push(...pagina.nodes.flatMap(clavesDe));
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null;
    vueltas += 1;
  } while (cursor && vueltas < TOPE_PAGINAS_COLECCION);
  return { handles, incompleto: Boolean(cursor) };
}

export async function cargarColecciones() {
  return conCacheCorto('colecciones', async () => traerColecciones());
}

async function traerColecciones() {
  const todas = [];
  let cursor = null;
  let vueltas = 0;
  do {
    const d = await gql(COLECCIONES, { cursor });
    todas.push(...d.collections.nodes.map((c) => ({
      id: c.id, handle: c.handle, titulo: c.title, cuantos: c.productsCount?.count ?? 0,
    })));
    cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
    vueltas += 1;
  } while (cursor && vueltas < 10);
  return todas;
}

export const TOPE_PAGINAS_COLECCION = 10;

export async function handlesDeColeccion(id) {
  const handles = [];
  let cursor = null;
  let vueltas = 0;
  do {
    const d = await gql(PRODUCTOS_DE, { id, cursor });
    const pagina = d.collection?.products;
    if (!pagina) break;
    handles.push(...pagina.nodes.flatMap(clavesDe));
    cursor = pagina.pageInfo.hasNextPage ? pagina.pageInfo.endCursor : null;
    vueltas += 1;
  } while (cursor && vueltas < TOPE_PAGINAS_COLECCION);
  /* Si se corto por el tope quedaron productos fuera. Callarlo seria lo peor:
   * la tienda marcaria unos si y otros no sin ninguna razon visible. */
  return { handles, incompleto: Boolean(cursor) };
}

/* El numero del final del GID. El id no cambia de idioma y el handle si:
 * en ingles "anillo-signet" se llama "signet-ring", asi que emparejar solo por
 * handle dejaba la tienda en ingles sin insignias ni beneficios. Se guardan
 * los dos, y la tienda pregunta primero por el id. */
export function numeroDe(gid) {
  return String(gid ?? '').split('/').pop();
}

export function clavesDe(producto) {
  return [numeroDe(producto.id), producto.handle].filter(Boolean);
}

/* Las barras de los extremos no son adorno: sin ellas la tienda, al preguntar
 * si la cadena contiene "oro", diria que si para "collar-oro". */
export function cadenaDeHandles(handles) {
  /* Ordenados a proposito: asi dos calculos del mismo conjunto dan la misma
   * cadena, y comparar cadenas vale para saber si algo cambio de verdad. Sin
   * ordenar, que una coleccion devuelva sus productos en otro orden bastaba
   * para reescribir en Shopify sin que hubiera cambiado nada. */
  const limpios = [...new Set(handles.filter(Boolean))].sort();
  if (!limpios.length) return '';
  return `|${limpios.join('|')}|`;
}

/* Una etiqueta que empieza por guion RESTA en vez de sumar. Hace falta para
 * el caso real que lo motivo: "resistente al agua" alcanza a todo el oro y
 * todo el acero MENOS a los brillantes, que no lo son. Sin restar habria que
 * enumerar a mano las decenas de productos que si lo son, y rehacerlo cada vez
 * que entra uno nuevo. */
export function esResta(etiqueta) {
  return String(etiqueta ?? '').trim().startsWith('-');
}

export function sinSigno(etiqueta) {
  return String(etiqueta ?? '').trim().replace(/^-\s*/, '');
}

/* Las cuatro entradas comparten las mismas etiquetas, asi que sin esto la
 * misma consulta se repetia una vez por entrada: trece paginas de productos
 * donde bastan cuatro, y eran las que agotaban el cupo de Shopify. El cache lo
 * crea quien lanza la pasada y muere con ella; aqui no hay nada global, que es
 * lo que hacia que una escritura de otra parte leyera datos viejos. */
function conCache(cache, clave, traer) {
  if (!cache) return traer();
  if (!cache.has(clave)) cache.set(clave, traer().catch((error) => { cache.delete(clave); throw error; }));
  return cache.get(clave);
}

export async function resolverHandles({ productos = [], colecciones = [], etiquetas = [] }, onPaso, cache) {
  const todos = productos.flatMap(clavesDe);
  const fuera = new Set();
  const cortadas = [];

  for (const c of colecciones) {
    if (onPaso) onPaso(`Leyendo «${c.titulo}»…`);
    const { handles, incompleto } = await conCache(cache, `col:${c.id}`, () => handlesDeColeccion(c.id));
    todos.push(...handles);
    if (incompleto) cortadas.push(c.titulo);
  }

  for (const e of etiquetas) {
    const nombre = sinSigno(e.titulo);
    if (!nombre) continue;
    if (onPaso) onPaso(`Leyendo «${nombre}»…`);
    /* La clave va sin signo: «oro» y «-oro» son la misma consulta, la resta se
     * aplica despues. */
    const { handles, incompleto } = await conCache(cache, `tag:${nombre}`, () => handlesDeEtiqueta(nombre));
    if (esResta(e.titulo)) {
      handles.forEach((h) => fuera.add(h));
    } else {
      todos.push(...handles);
    }
    if (incompleto) cortadas.push(nombre);
  }

  /* La resta se aplica al final, sobre todo lo reunido: asi da igual el orden
   * en que se escribieran las etiquetas, y tambien quita lo que hubiera
   * entrado por coleccion o a mano. */
  return { cadena: cadenaDeHandles(todos.filter((h) => !fuera.has(h))), cortadas };
}

/* ---------------------------------------------------------------------------
 * Estructura
 * ------------------------------------------------------------------------- */

/* Que campos existen de verdad en la tienda. El panel no debe ofrecer un
 * control cuyo campo todavia no esta creado: el error saldria al guardar, que
 * es tarde. Mismo motivo que camposDeColor en colores.js. */
export async function camposDeTipo(tipo) {
  const d = await gql(DEFINICION, { type: tipo });
  return new Set((d.metaobjectDefinitionByType?.fieldDefinitions ?? []).map((f) => f.key));
}

export async function faltaEstructura(tipo, campos, nombreLegible) {
  const d = await gql(DEFINICION, { type: tipo });
  const def = d.metaobjectDefinitionByType;
  if (!def) return [`El tipo de contenido de ${nombreLegible}.`];

  const pendientes = [];
  const presentes = new Set(def.fieldDefinitions.map((f) => f.key));
  const faltan = campos.filter((c) => !presentes.has(c.key)).map((c) => c.key);
  if (faltan.length) pendientes.push(`Campos que faltan en ${nombreLegible}: ${faltan.join(', ')}.`);

  /* Que el campo exista no basta: si es de otro tipo, el panel diria que todo
   * esta bien y el guardado fallaria. Mismo chequeo que ya hacen las guias. */
  const porClave = new Map(def.fieldDefinitions.map((f) => [f.key, f.type?.name]));
  for (const campo of campos) {
    const real = porClave.get(campo.key);
    if (real && real !== campo.type) {
      pendientes.push(`El campo «${campo.key}» de ${nombreLegible} es ${real} y debería ser ${campo.type}.`);
    }
  }

  /* Sin PUBLIC_READ el panel se ve perfecto y la tienda no muestra nada: es el
   * fallo que mas cuesta diagnosticar, asi que se avisa aqui. */
  if (def.access?.storefront !== 'PUBLIC_READ') {
    pendientes.push(`«${tipo}» no se puede leer desde la tienda, así que no se mostrará nada.`);
  }
  return pendientes;
}

export async function asegurarEstructura(tipo, campos, nombreDefinicion, pasos = []) {
  const d = await gql(DEFINICION, { type: tipo });
  const def = d.metaobjectDefinitionByType;

  if (!def) {
    const r = await gql(CREAR_DEFINICION, {
      definition: {
        type: tipo,
        name: nombreDefinicion,
        access: { storefront: 'PUBLIC_READ' },
        displayNameKey: 'nombre',
        fieldDefinitions: campos,
      },
    });
    comprobarErrores(r, 'metaobjectDefinitionCreate');
    pasos.push(`Tipo de contenido «${nombreDefinicion}» creado`);
    return pasos;
  }

  const presentes = new Set(def.fieldDefinitions.map((f) => f.key));
  const faltan = campos.filter((c) => !presentes.has(c.key));
  if (faltan.length) {
    const r = await gql(ACTUALIZAR_DEFINICION, {
      id: def.id,
      definition: { fieldDefinitions: faltan.map((c) => ({ create: c })) },
    });
    comprobarErrores(r, 'metaobjectDefinitionUpdate');
    pasos.push(`Campos añadidos a «${nombreDefinicion}»: ${faltan.map((c) => c.key).join(', ')}`);
  }

  /* El aviso de "no se lee desde la tienda" tiene que poder arreglarse desde el
   * mismo boton. Si no, el botón se pulsa, no cambia nada y el aviso sigue
   * ahí para siempre. */
  if (def.access?.storefront !== 'PUBLIC_READ') {
    const r = await gql(ACTUALIZAR_DEFINICION, {
      id: def.id,
      definition: { access: { storefront: 'PUBLIC_READ' } },
    });
    comprobarErrores(r, 'metaobjectDefinitionUpdate');
    pasos.push(`«${nombreDefinicion}» ahora se puede leer desde la tienda`);
  }
  return pasos;
}
