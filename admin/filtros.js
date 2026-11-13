/* Saint Venik · Filtros de las colecciones.
 *
 * Dos cosas que se manejan desde la app:
 *
 *  1. QUE ES CADA PRODUCTO. Tres metacampos de producto que la tienda puede
 *     filtrar (Search & Discovery los ofrece como filtro):
 *       custom.sv_color      Dorado / Plateado
 *       custom.sv_categoria  Cadenas / Colgantes / Pulseras / Anillos / ...
 *       custom.sv_tipo       lista: Brillantes, Tenis, Perlas, Cubanas, ...
 *     Las listas de valores posibles viven en la configuracion de la app, asi
 *     que se pueden ampliar o renombrar sin tocar codigo. La app propone el
 *     valor de cada producto a partir de lo que ya hay (las etiquetas oro /
 *     acero-inox, las colecciones Cadenas, Anillos..., y el titulo), y se
 *     corrige a mano lo que haga falta.
 *
 *  2. LOS BOTONES DE LA PAGINA. Las pastillas que salen encima de los
 *     productos («Dorado», «Plateado», «Brillantes», «Cadenas»...). Cada una es
 *     una entrada del metaobjeto `sv_boton_filtro`: texto en los dos idiomas,
 *     icono, que filtro aplica y con que valor, en que fila va y en que
 *     colecciones sale (todas, o solo las elegidas).
 *
 * Los botones no filtran por su cuenta: llevan a la misma coleccion con el
 * filtro de Shopify puesto (?filter.p.m.custom.sv_color=Dorado). Asi los
 * botones, el menu «Filtrar» y la paginacion dicen siempre lo mismo.
 */
import { gql, comprobarErrores } from './api.js?v=202611131432';
import {
  aObjetoComun, cargarEntradas, crearEntrada, guardarEntrada, borrarEntrada,
  faltaEstructura, asegurarEstructura, TOPE_ENTRADAS,
} from './asignacion.js?v=202611131432';

/* ---------------------------------------------------------------------------
 * Los tres metacampos de producto
 * ------------------------------------------------------------------------- */

export const NAMESPACE = 'custom';

export const FILTROS = [
  { clave: 'color', key: 'sv_color', nombre: 'Color', type: 'single_line_text_field' },
  { clave: 'categoria', key: 'sv_categoria', nombre: 'Categoría', type: 'single_line_text_field' },
  { clave: 'tipo', key: 'sv_tipo', nombre: 'Tipo', type: 'list.single_line_text_field' },
];

export const filtroDe = (clave) => FILTROS.find((f) => f.clave === clave);

/* El nombre del parametro que usa la tienda para cada filtro. */
export const parametroDe = (clave) => `filter.p.m.${NAMESPACE}.${filtroDe(clave).key}`;

const DEFINICIONES = `
  query DefinicionesFiltro {
    metafieldDefinitions(ownerType: PRODUCT, namespace: "${NAMESPACE}", first: 100) {
      nodes { id key type { name } access { storefront } }
    }
  }
`;

const CREAR_DEFINICION_METACAMPO = `
  mutation CrearDefinicionMetacampo($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id }
      userErrors { field message code }
    }
  }
`;

const ACTUALIZAR_DEFINICION_METACAMPO = `
  mutation ActualizarDefinicionMetacampo($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition { id }
      userErrors { field message code }
    }
  }
`;

async function definicionesActuales() {
  const d = await gql(DEFINICIONES);
  return new Map((d.metafieldDefinitions?.nodes ?? []).map((n) => [n.key, n]));
}

/* ---------------------------------------------------------------------------
 * Los botones de la pagina (metaobjeto sv_boton_filtro)
 * ------------------------------------------------------------------------- */

export const TIPO_BOTON = 'sv_boton_filtro';
export const TOPE_BOTONES = TOPE_ENTRADAS;

const CAMPOS_BOTON = [
  { key: 'nombre', name: 'Texto en español', type: 'single_line_text_field', required: true },
  { key: 'nombre_en', name: 'Texto en inglés', type: 'single_line_text_field' },
  { key: 'orden', name: 'Posición', type: 'number_integer' },
  { key: 'activo', name: 'Activo', type: 'boolean' },
  { key: 'filtro', name: 'Qué filtra (color, categoria o tipo)', type: 'single_line_text_field' },
  { key: 'valor', name: 'Valor del filtro', type: 'single_line_text_field' },
  { key: 'icono', name: 'Icono (clave, o color:etiqueta para una muestra)', type: 'single_line_text_field' },
  { key: 'fila', name: 'Fila', type: 'number_integer' },
  { key: 'donde', name: 'Dónde sale (todas o elegidas)', type: 'single_line_text_field' },
  { key: 'colecciones', name: 'Colecciones donde sale', type: 'list.collection_reference' },
];

function aBoton(entrada) {
  const valor = (clave) => entrada.fields.find((c) => c.key === clave)?.value ?? '';
  const comun = aObjetoComun(entrada);
  return {
    ...comun,
    filtro: FILTROS.some((f) => f.clave === valor('filtro')) ? valor('filtro') : 'color',
    valor: valor('valor'),
    icono: valor('icono'),
    fila: Number(valor('fila')) || 1,
    donde: valor('donde') === 'elegidas' ? 'elegidas' : 'todas',
  };
}

export async function cargarBotones() {
  return cargarEntradas(TIPO_BOTON, aBoton);
}

function camposDeBoton(b) {
  const campos = [];
  if (b.nombre !== undefined) campos.push({ key: 'nombre', value: b.nombre });
  if (b.nombreEn !== undefined) campos.push({ key: 'nombre_en', value: b.nombreEn });
  if (b.orden !== undefined) campos.push({ key: 'orden', value: String(b.orden) });
  if (b.activo !== undefined) campos.push({ key: 'activo', value: String(Boolean(b.activo)) });
  if (b.filtro !== undefined) campos.push({ key: 'filtro', value: b.filtro });
  if (b.valor !== undefined) campos.push({ key: 'valor', value: b.valor });
  if (b.icono !== undefined) campos.push({ key: 'icono', value: b.icono });
  if (b.fila !== undefined) campos.push({ key: 'fila', value: String(b.fila) });
  if (b.donde !== undefined) campos.push({ key: 'donde', value: b.donde });
  if (b.colecciones !== undefined) {
    campos.push({ key: 'colecciones', value: JSON.stringify(b.colecciones.map((c) => c.id)) });
  }
  return campos;
}

export async function guardarBoton(id, datos) {
  return guardarEntrada(id, camposDeBoton(datos));
}

export async function crearBoton(datos, cuantosHay) {
  if (cuantosHay >= TOPE_BOTONES) {
    throw new Error(`No se pueden tener más de ${TOPE_BOTONES} botones.`);
  }
  return crearEntrada(TIPO_BOTON, camposDeBoton({ activo: true, fila: 1, donde: 'todas', ...datos }));
}

export async function borrarBoton(id) {
  return borrarEntrada(id);
}

/* Lo que se ve en la pagina el primer dia, sacado de la llamada: colores y
 * brillantes en todas las colecciones, y en Best Sellers ademas las
 * categorias. Todo se puede cambiar o borrar despues. */
export const BOTONES_INICIALES = [
  { nombre: 'Dorado', nombreEn: 'Gold', filtro: 'color', valor: 'Dorado', icono: 'color:oro', fila: 1 },
  { nombre: 'Plateado', nombreEn: 'Silver', filtro: 'color', valor: 'Plateado', icono: 'color:acero-inox', fila: 1 },
  { nombre: 'Brillantes', nombreEn: 'Iced', filtro: 'tipo', valor: 'Brillantes', icono: 'joyeria-fina', fila: 1 },
  { nombre: 'Cadenas', nombreEn: 'Chains', filtro: 'categoria', valor: 'Cadenas', icono: 'cadena', fila: 2, soloEn: 'best-sellers' },
  { nombre: 'Colgantes', nombreEn: 'Pendants', filtro: 'categoria', valor: 'Colgantes', icono: 'colgante', fila: 2, soloEn: 'best-sellers' },
  { nombre: 'Pulseras', nombreEn: 'Bracelets', filtro: 'categoria', valor: 'Pulseras', icono: 'pulsera', fila: 2, soloEn: 'best-sellers' },
  { nombre: 'Anillos', nombreEn: 'Rings', filtro: 'categoria', valor: 'Anillos', icono: 'anillo', fila: 2, soloEn: 'best-sellers' },
];

const COLECCION_POR_HANDLE = `
  query ColeccionPorHandle($handle: String!) {
    collectionByHandle(handle: $handle) { id title handle }
  }
`;

/* Solo si no hay ninguno: es la semilla, no un «restaurar». */
export async function sembrarBotones(pasos = []) {
  const actuales = await cargarBotones();
  if (actuales.length) return pasos;
  const cache = new Map();
  let orden = 1;
  for (const b of BOTONES_INICIALES) {
    let colecciones = [];
    let donde = 'todas';
    if (b.soloEn) {
      if (!cache.has(b.soloEn)) {
        const d = await gql(COLECCION_POR_HANDLE, { handle: b.soloEn });
        cache.set(b.soloEn, d.collectionByHandle);
      }
      const c = cache.get(b.soloEn);
      /* Sin esa coleccion en esta tienda, el boton sale en todas en vez de en
       * ninguna: es mas facil quitarlo que descubrir por que no sale. */
      if (c) {
        colecciones = [{ id: c.id }];
        donde = 'elegidas';
      }
    }
    await crearBoton({
      nombre: b.nombre, nombreEn: b.nombreEn, filtro: b.filtro, valor: b.valor,
      icono: b.icono, fila: b.fila, orden, donde, colecciones,
    }, orden - 1);
    orden += 1;
  }
  pasos.push(`Botones de filtro iniciales creados (${BOTONES_INICIALES.length})`);
  return pasos;
}

/* ---------------------------------------------------------------------------
 * Estructura: lo que el boton «Crear lo que falta» tiene que montar
 * ------------------------------------------------------------------------- */

export async function faltaEstructuraFiltros() {
  const pendientes = await faltaEstructura(TIPO_BOTON, CAMPOS_BOTON, 'los botones de filtro');
  const defs = await definicionesActuales();
  for (const f of FILTROS) {
    const def = defs.get(f.key);
    if (!def) {
      pendientes.push(`El metacampo de producto «${f.nombre}» (${NAMESPACE}.${f.key}) para los filtros.`);
    } else if (def.type?.name !== f.type) {
      pendientes.push(`El metacampo ${NAMESPACE}.${f.key} es ${def.type?.name} y debería ser ${f.type}.`);
    } else if (def.access?.storefront !== 'PUBLIC_READ') {
      pendientes.push(`El metacampo ${NAMESPACE}.${f.key} no se puede leer desde la tienda.`);
    }
  }
  return pendientes;
}

export async function asegurarEstructuraFiltros(pasos = []) {
  await asegurarEstructura(TIPO_BOTON, CAMPOS_BOTON, 'Botón de filtro', pasos);
  const defs = await definicionesActuales();
  for (const f of FILTROS) {
    const def = defs.get(f.key);
    if (!def) {
      const r = await gql(CREAR_DEFINICION_METACAMPO, {
        definition: {
          name: `${f.nombre} (filtro)`,
          namespace: NAMESPACE,
          key: f.key,
          type: f.type,
          ownerType: 'PRODUCT',
          description: 'Lo escribe la app Panel Saint Venik (pantalla Filtros). Es lo que filtra la tienda.',
          access: { storefront: 'PUBLIC_READ' },
        },
      });
      comprobarErrores(r, 'metafieldDefinitionCreate');
      pasos.push(`Metacampo «${f.nombre}» creado`);
    } else if (def.access?.storefront !== 'PUBLIC_READ') {
      const r = await gql(ACTUALIZAR_DEFINICION_METACAMPO, {
        definition: {
          namespace: NAMESPACE, key: f.key, ownerType: 'PRODUCT',
          access: { storefront: 'PUBLIC_READ' },
        },
      });
      comprobarErrores(r, 'metafieldDefinitionUpdate');
      pasos.push(`El metacampo «${f.nombre}» ahora se puede leer desde la tienda`);
    }
  }
  await sembrarBotones(pasos);
  return pasos;
}

/* ---------------------------------------------------------------------------
 * Los productos y su clasificacion
 * ------------------------------------------------------------------------- */

const PRODUCTOS = `
  query ProductosFiltro($cursor: String) {
    products(first: 50, after: $cursor, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        handle
        status
        tags
        featuredMedia { preview { image { url(transform: { maxWidth: 80 }) } } }
        collections(first: 20) { nodes { handle } }
        color: metafield(namespace: "${NAMESPACE}", key: "sv_color") { value }
        categoria: metafield(namespace: "${NAMESPACE}", key: "sv_categoria") { value }
        tipo: metafield(namespace: "${NAMESPACE}", key: "sv_tipo") { value }
      }
    }
  }
`;

function lista(valor) {
  if (!valor) return [];
  try {
    const l = JSON.parse(valor);
    return Array.isArray(l) ? l.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch (e) {
    return [];
  }
}

export async function cargarProductosFiltro() {
  const productos = [];
  let cursor = null;
  for (let vuelta = 0; vuelta < 40; vuelta += 1) {
    const d = await gql(PRODUCTOS, { cursor });
    for (const n of d.products.nodes) {
      productos.push({
        id: n.id,
        titulo: n.title,
        handle: n.handle,
        activo: n.status === 'ACTIVE',
        etiquetas: n.tags ?? [],
        imagen: n.featuredMedia?.preview?.image?.url ?? null,
        colecciones: (n.collections?.nodes ?? []).map((c) => c.handle),
        color: n.color?.value ?? '',
        categoria: n.categoria?.value ?? '',
        tipo: lista(n.tipo?.value),
      });
    }
    if (!d.products.pageInfo.hasNextPage) break;
    cursor = d.products.pageInfo.endCursor;
  }
  return productos;
}

const ESCRIBIR = `
  mutation EscribirFiltros($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message code }
    }
  }
`;

const BORRAR = `
  mutation BorrarFiltros($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields { key }
      userErrors { field message }
    }
  }
`;

/* Guarda los cambios de muchos productos de una vez. Shopify admite 25
 * metacampos por llamada; un valor vacio se borra en vez de guardarse vacio
 * (un metacampo vacio no se puede escribir). `cambios` es una lista de
 * { id, color, categoria, tipo } con solo lo que cambio. */
export async function guardarClasificacion(cambios, alAvanzar) {
  const escribir = [];
  const borrar = [];
  for (const c of cambios) {
    for (const f of FILTROS) {
      if (!(f.clave in c)) continue;
      const v = c[f.clave];
      const vacio = Array.isArray(v) ? !v.length : !String(v ?? '').trim();
      if (vacio) {
        borrar.push({ ownerId: c.id, namespace: NAMESPACE, key: f.key });
      } else {
        escribir.push({
          ownerId: c.id, namespace: NAMESPACE, key: f.key, type: f.type,
          value: Array.isArray(v) ? JSON.stringify(v) : String(v).trim(),
        });
      }
    }
  }
  const total = escribir.length + borrar.length;
  let hechos = 0;
  for (let i = 0; i < escribir.length; i += 25) {
    const tanda = escribir.slice(i, i + 25);
    const r = await gql(ESCRIBIR, { metafields: tanda });
    comprobarErrores(r, 'metafieldsSet');
    hechos += tanda.length;
    alAvanzar?.(hechos, total);
  }
  for (let i = 0; i < borrar.length; i += 25) {
    const tanda = borrar.slice(i, i + 25);
    const r = await gql(BORRAR, { metafields: tanda });
    comprobarErrores(r, 'metafieldsDelete');
    hechos += tanda.length;
    alAvanzar?.(hechos, total);
  }
  return total;
}

/* ---------------------------------------------------------------------------
 * La propuesta automatica
 * ------------------------------------------------------------------------- */

const sinAcentos = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* «Cadenas» -> «cadena», «Pulseras» -> «pulsera», «Lentes» -> «lente». */
function singular(t) {
  const s = sinAcentos(t).trim();
  if (s.endsWith('es') && s.length > 4 && !/(ntes|ces)$/.test(s)) return s.slice(0, -2);
  if (s.endsWith('s')) return s.slice(0, -1);
  return s;
}

/* Palabras que, ademas de la propia, delatan cada valor. Los titulos de esta
 * tienda mezclan español e inglés («Vault Blue Pendant», «Cadena Tennis»). */
const SINONIMOS = {
  cadena: ['cadena', 'chain'],
  colgante: ['colgante', 'pendant', 'dije'],
  pulsera: ['pulsera', 'brazalete', 'bracelet', 'bangle'],
  anillo: ['anillo', 'ring', 'sello', 'signet'],
  conjunto: ['conjunto', 'set', 'pack', 'combo'],
  lente: ['lente', 'lentes', 'anteojo', 'gafa', 'sunglass', 'sunglasses'],
  tenis: ['tenis', 'tennis'],
  perla: ['perla', 'pearl', 'pearls', 'vienna'],
  cubana: ['cubana', 'cuban'],
  rope: ['rope', 'cuerda'],
  brillante: ['brillante', 'brillantes', 'iced'],
  dorado: ['oro', 'gold', 'dorado', 'dorada'],
  plateado: ['plata', 'silver', 'plateado', 'plateada', 'acero'],
};

/* «Tenis» no es plural de nada: se busca tal cual antes de quitarle la s. */
function palabrasDe(valor) {
  const tal = sinAcentos(valor).trim();
  const base = singular(valor);
  return SINONIMOS[tal] ?? SINONIMOS[base] ?? [base, tal];
}

function tokens(texto) {
  return sinAcentos(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

/* Lo que la app propone para un producto, a partir de lo que ya tiene. No
 * pisa nada: quien decide que se guarda es la pantalla. */
export function sugerir(p, valores) {
  const titulo = tokens(p.titulo);
  const etiquetas = p.etiquetas.map(sinAcentos);
  const colecciones = p.colecciones.map(sinAcentos);
  const enTitulo = (palabras) => palabras.some((w) => titulo.includes(w));

  /* Color: la etiqueta de color manda, que es la misma que mira el selector.
   * Con las dos (pasa: «Pulsera Red Gem»), decide el titulo. */
  let color = '';
  const dorado = valores.colores.find((v) => singular(v) === 'dorado');
  const plateado = valores.colores.find((v) => singular(v) === 'plateado');
  const tieneOro = etiquetas.includes('oro');
  const tieneAcero = etiquetas.includes('acero-inox');
  if (tieneOro && !tieneAcero) color = dorado ?? '';
  else if (tieneAcero && !tieneOro) color = plateado ?? '';
  else if (enTitulo(['oro', 'gold'])) color = dorado ?? '';
  else if (tieneAcero || tieneOro) color = plateado ?? '';

  /* Categoria: primero lo que dice el titulo («Cadena ...», «... Pendant»),
   * despues las colecciones en las que esta. */
  let categoria = '';
  /* Un conjunto suele nombrar sus piezas («Set Cadena + Pulsera»): se mira
   * antes que las demas para que no se lo quede la primera pieza. */
  const porPrioridad = [...valores.categorias].sort((a, b2) => (
    (singular(b2) === 'conjunto') - (singular(a) === 'conjunto')
  ));
  for (const v of porPrioridad) {
    if (enTitulo(palabrasDe(v))) { categoria = v; break; }
  }
  /* Si el titulo no lo dice, lo dicen sus colecciones o sus etiquetas
   * («anteojos-de-sol», la etiqueta «lentes»). Por principio de palabra:
   * «anteojos» empieza por «anteojo». */
  if (!categoria) {
    for (const v of valores.categorias) {
      const palabras = [singular(v), ...palabrasDe(v)];
      const casa = (texto) => texto.split(/[^a-z0-9]+/).some((t) => palabras.some((w) => t.startsWith(w)));
      if (colecciones.some(casa) || etiquetas.some(casa)) {
        categoria = v;
        break;
      }
    }
  }

  /* Sin categoria no es una joya (el empaque, la tarjeta regalo, los
   * strips): llevan la etiqueta acero-inox por arrastre, y con color saldrian
   * al filtrar por «Plateado». */
  if (!categoria) color = '';

  /* Tipo: todos los que encajen. «Brillantes» sale tambien de la etiqueta
   * `brillantes` (y de `ice`, que es la de .com). */
  const tipo = [];
  for (const v of valores.tipos) {
    const base = singular(v);
    let si = enTitulo(palabrasDe(v));
    if (base === 'brillante' && (etiquetas.includes('brillantes') || etiquetas.includes('ice'))) si = true;
    if (si) tipo.push(v);
  }

  return { color, categoria, tipo };
}
