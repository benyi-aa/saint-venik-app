/* Saint Venik · Conjuntos con precio automático (11-nov, pedido del usuario).
 *
 * Cada producto de la colección «Conjuntos» guarda sus dos joyas en el metacampo
 * custom.conjunto_joyas (lista de productos). Su precio sale de las joyas en vivo:
 *   precio = (precio joya A + precio joya B) × (100 − descuento) / 100
 * redondeado para que termine en 990 (pesos) o en ,90 (dólares), y el precio tachado
 * («antes») es la suma de las dos joyas. El descuento (15 % de fábrica) va en
 * custom.conjunto_descuento de cada conjunto.
 *
 * Esta pantalla lo calcula y lo guarda. Para que se mantenga al día solo, cada hora, una
 * automatización de Shopify Flow hace la misma cuenta con los mismos datos: por eso cada
 * conjunto lleva la etiqueta sv-conjunto y cada joya sv-conjunto-parte (Flow los busca así).
 * Detalle: docs/conjuntos.md.
 */
import { gql, comprobarErrores } from './api.js?v=202611131958';

export const CLAVE_JOYAS = 'conjunto_joyas';
export const CLAVE_DESCUENTO = 'conjunto_descuento';
export const ETIQUETA_CONJUNTO = 'sv-conjunto';
export const ETIQUETA_PARTE = 'sv-conjunto-parte';
export const DESCUENTO_POR_DEFECTO = 15;

const ESTRUCTURA = `
  query EstructuraConjuntos {
    joyas: metafieldDefinitions(ownerType: PRODUCT, namespace: "custom", key: "${CLAVE_JOYAS}", first: 1) { nodes { id } }
    descuento: metafieldDefinitions(ownerType: PRODUCT, namespace: "custom", key: "${CLAVE_DESCUENTO}", first: 1) { nodes { id } }
    shop { currencyCode }
  }
`;

const CREAR_DEFINICION = `
  mutation CrearDefinicion($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id }
      userErrors { field message code }
    }
  }
`;

/* Crea los dos metacampos si faltan y devuelve la moneda de la tienda. */
export async function prepararConjuntos() {
  const d = await gql(ESTRUCTURA, {}, { sinMemoria: true });
  if (!d.joyas.nodes.length) {
    comprobarErrores(await gql(CREAR_DEFINICION, { definition: {
      name: 'Conjunto: sus joyas', namespace: 'custom', key: CLAVE_JOYAS, ownerType: 'PRODUCT',
      type: 'list.product_reference',
      description: 'Las dos joyas del conjunto. Su precio sale de ellas (Panel Saint Venik → Conjuntos).',
    } }), 'metafieldDefinitionCreate');
  }
  if (!d.descuento.nodes.length) {
    comprobarErrores(await gql(CREAR_DEFINICION, { definition: {
      name: 'Conjunto: descuento (%)', namespace: 'custom', key: CLAVE_DESCUENTO, ownerType: 'PRODUCT',
      type: 'number_integer',
      description: 'Descuento sobre la suma de las dos joyas (Panel Saint Venik → Conjuntos).',
    } }), 'metafieldDefinitionCreate');
  }
  return d.shop.currencyCode;
}

const PRODUCTO = `
  id title handle status tags
  featuredMedia { preview { image { url } } }
  priceRangeV2 { minVariantPrice { amount } }
`;

const CONJUNTOS = `
  query Conjuntos {
    collections(first: 1, query: "handle:conjuntos") {
      nodes {
        id title
        products(first: 100) {
          nodes {
            ${PRODUCTO}
            descriptionHtml
            variants(first: 50) { nodes { id title price compareAtPrice } }
            joyas: metafield(namespace: "custom", key: "${CLAVE_JOYAS}") {
              references(first: 4) { nodes { ... on Product { ${PRODUCTO} } } }
            }
            descuento: metafield(namespace: "custom", key: "${CLAVE_DESCUENTO}") { value }
          }
        }
      }
    }
  }
`;

const CATALOGO = `
  query Catalogo($cursor: String) {
    products(first: 250, after: $cursor, query: "status:active") {
      pageInfo { hasNextPage endCursor }
      nodes { ${PRODUCTO} }
    }
  }
`;

/* HTML de la descripción → texto con un salto por párrafo (como se lee en la tienda). */
function aTexto(html) {
  const conSaltos = String(html ?? '').replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, '\n');
  const caja = document.createElement('textarea');
  caja.innerHTML = conSaltos.replace(/<[^>]*>/g, ' ');
  return caja.value;
}

function aJoya(n) {
  return {
    id: n.id, titulo: n.title, handle: n.handle, activo: n.status === 'ACTIVE',
    imagen: n.featuredMedia?.preview?.image?.url ?? null,
    precio: Number(n.priceRangeV2?.minVariantPrice?.amount ?? 0),
    etiquetas: n.tags ?? [],
  };
}

export async function cargarConjuntos() {
  const d = await gql(CONJUNTOS, {}, { sinMemoria: true });
  const col = d.collections.nodes[0];
  if (!col) return [];
  return col.products.nodes.map((n) => ({
    ...aJoya(n),
    descripcion: aTexto(n.descriptionHtml),
    variantes: n.variants.nodes.map((v) => ({
      id: v.id, titulo: v.title, precio: Number(v.price), antes: v.compareAtPrice == null ? null : Number(v.compareAtPrice),
    })),
    joyas: (n.joyas?.references?.nodes ?? []).map(aJoya),
    descuento: n.descuento?.value != null ? Number(n.descuento.value) : null,
  }));
}

/* Todas las joyas activas, para detectar y para buscar. */
export async function cargarCatalogo() {
  const todas = [];
  let cursor = null;
  for (let i = 0; i < 8; i += 1) {
    const d = await gql(CATALOGO, { cursor });
    todas.push(...d.products.nodes.map(aJoya));
    if (!d.products.pageInfo.hasNextPage) break;
    cursor = d.products.pageInfo.endCursor;
  }
  return todas;
}

/* Termina en 990 (pesos: 62.990) o en ,90 (dólares: 102,90), al más cercano. */
export function redondear(valor, moneda) {
  if (moneda === 'CLP') return Math.max(990, Math.round((valor + 10) / 1000) * 1000 - 10);
  return Math.max(0.9, Number((Math.round(valor + 0.1) - 0.1).toFixed(2)));
}

export function calcular(joyas, descuento, moneda) {
  if (joyas.length !== 2) return null;
  const suma = Number(joyas.reduce((s, j) => s + j.precio, 0).toFixed(2));
  return { suma, precio: redondear(suma * (100 - descuento) / 100, moneda) };
}

export function formatear(valor, moneda) {
  if (moneda === 'CLP') return `$${Math.round(valor).toLocaleString('es-CL')}`;
  return `$${Number(valor).toFixed(2)}`;
}

/* Lo que se escribe en Shopify: entero en pesos, dos decimales en dólares. */
function aPrecio(valor, moneda) {
  return moneda === 'CLP' ? String(Math.round(valor)) : Number(valor).toFixed(2);
}

/* ¿Hace falta escribir? (el precio o el «antes» de alguna variante no coincide) */
export function estaAlDia(conjunto, calculo) {
  if (!calculo) return true;
  return conjunto.variantes.every((v) => Math.abs(v.precio - calculo.precio) < 0.005
    && v.antes != null && Math.abs(v.antes - calculo.suma) < 0.005);
}

/* ---------------------------------------------------------------------------
 * Detectar las dos joyas desde la descripción: «Incluye: - Cadena Miami Cuban 5mm 50cm
 * - Hermés Pendant + Cadena Rope 2.5mm». De cada línea vale lo que va antes del «+» o «:» (el
 * colgante trae su propia cadena fina; tras «:» viene su ficha), y gana la joya cuyo nombre entero aparece en la
 * línea (con más palabras; ver OPCIONALES). El metal tiene que coincidir: un conjunto «Oro» lleva joyas «Oro».
 * ------------------------------------------------------------------------- */
const SINONIMOS = { pendiente: 'pendant', colgante: 'pendant', pendientes: 'pendant', cubans: 'cuban', cuban: 'cuban' };
function llano(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function palabras(s) {
  return llano(s).replace(/['’]s\b/g, '').replace(/\.(?!\d)/g, ' ').replace(/[^a-z0-9.]+/g, ' ').split(' ')
    .filter((p) => p && p !== 'de' && p !== 'la' && p !== 'el' && p !== 'y' && p !== 'con')
    .map((p) => SINONIMOS[p] || p);
}
const esOro = (t) => palabras(t).includes('oro');
/* Palabras que la descripción a veces omite («Compass» por «Compass Pendant», «Cadena Cuban
 * 3mm» por «Cadena Miami Cuban Oro 3mm»): no hace falta que estén, pero suman si están. */
const OPCIONALES = new Set(['pendant', 'cadena', 'miami']);

export function sugerirJoyas(conjunto, catalogo) {
  const texto = conjunto.descripcion || '';
  const i = llano(texto).indexOf('incluye');
  if (i < 0) return [];
  const parte = texto.slice(i + 7).replace(/^[\s:]+/, '');
  const lineas = parte.split(/\s+-\s+|\n|•/).map((l) => l.split(/[+:]/)[0].trim()).filter((l) => l.length > 3).slice(0, 4);
  const oro = esOro(conjunto.titulo);
  const candidatas = catalogo.filter((p) => p.activo && !p.etiquetas.includes(ETIQUETA_CONJUNTO)
    && !/\bset\b|conjunto/i.test(p.titulo) && esOro(p.titulo) === oro);
  const elegidas = [];
  for (const linea of lineas) {
    const enLinea = new Set(palabras(linea));
    if (oro) enLinea.add('oro');
    let mejor = null;
    let puntos = 0;
    for (const p of candidatas) {
      const suyas = palabras(p.titulo);
      const fijas = suyas.filter((w) => !OPCIONALES.has(w));
      if (!fijas.some((w) => w !== 'oro') || !fijas.every((w) => enLinea.has(w))) continue;
      const n = fijas.length + suyas.filter((w) => OPCIONALES.has(w) && enLinea.has(w)).length / 2;
      if (n > puntos) { mejor = p; puntos = n; }
    }
    if (mejor && !elegidas.some((e) => e.id === mejor.id)) elegidas.push(mejor);
    if (elegidas.length === 2) break;
  }
  return elegidas;
}

/* ---------------------------------------------------------------------------
 * Guardar
 * ------------------------------------------------------------------------- */
const METACAMPOS = `
  mutation Metacampos($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message code } }
  }
`;
const ETIQUETAR = `
  mutation Etiquetar($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
  }
`;
const PRECIOS = `
  mutation Precios($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }
`;

/* Guarda las joyas y el descuento, etiqueta para Flow y pone el precio calculado. */
export async function guardarConjunto(conjunto, joyas, descuento, moneda) {
  const calculo = calcular(joyas, descuento, moneda);
  if (!calculo) throw new Error(`«${conjunto.titulo}» necesita exactamente dos joyas.`);
  comprobarErrores(await gql(METACAMPOS, { metafields: [
    { ownerId: conjunto.id, namespace: 'custom', key: CLAVE_JOYAS, type: 'list.product_reference', value: JSON.stringify(joyas.map((j) => j.id)) },
    { ownerId: conjunto.id, namespace: 'custom', key: CLAVE_DESCUENTO, type: 'number_integer', value: String(Math.round(descuento)) },
  ] }), 'metafieldsSet');
  if (!conjunto.etiquetas.includes(ETIQUETA_CONJUNTO)) {
    comprobarErrores(await gql(ETIQUETAR, { id: conjunto.id, tags: [ETIQUETA_CONJUNTO] }), 'tagsAdd');
  }
  for (const j of joyas) {
    if (!j.etiquetas.includes(ETIQUETA_PARTE)) {
      comprobarErrores(await gql(ETIQUETAR, { id: j.id, tags: [ETIQUETA_PARTE] }), 'tagsAdd');
      j.etiquetas.push(ETIQUETA_PARTE);
    }
  }
  const r = comprobarErrores(await gql(PRECIOS, {
    productId: conjunto.id,
    variants: conjunto.variantes.map((v) => ({
      id: v.id, price: aPrecio(calculo.precio, moneda), compareAtPrice: aPrecio(calculo.suma, moneda),
    })),
  }), 'productVariantsBulkUpdate');
  conjunto.variantes = r.productVariants.map((v) => ({
    ...conjunto.variantes.find((x) => x.id === v.id), precio: Number(v.price), antes: v.compareAtPrice == null ? null : Number(v.compareAtPrice),
  }));
  conjunto.joyas = joyas;
  conjunto.descuento = descuento;
  return calculo;
}
