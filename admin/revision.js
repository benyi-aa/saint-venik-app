/* Saint Venik · Revisión general de la tienda (13-nov).
 *
 * Un solo botón que recorre el catálogo y avisa de lo que está mal o a medias:
 * productos sin color, familias de color rotas, conjuntos sin sus joyas o con el
 * precio atrasado, activos agotados o sin foto, insignias y beneficios que apuntan
 * a productos archivados, y lo que falta en inglés.
 *
 * SOLO LEE. No hay ni una mutación en este archivo, a propósito: revisar no puede
 * cambiar nada de la tienda. Arreglar se hace en la pantalla de cada cosa (o en
 * Shopify), a la que lleva cada aviso.
 *
 * El panel se abre por separado en cada tienda, así que la revisión es de la tienda
 * en la que está abierto: para las dos, se pulsa en cada una.
 */
import { gql } from './api.js?v=202611131958';
import { cargarColores } from './colores.js?v=202611131958';
import { cargarEtiquetas } from './etiquetas.js?v=202611131958';
import { cargarBeneficios } from './beneficios.js?v=202611131958';
import { cargarBotones } from './filtros.js?v=202611131958';
import { cargarConjuntos, calcular, estaAlDia, DESCUENTO_POR_DEFECTO, ETIQUETA_CONJUNTO } from './conjuntos.js?v=202611131958';
import { sinColor } from './productos.js?v=202611131958';

/* 25 por página: cada producto trae hasta 20 variantes y Shopify cobra por
 * adelantado lo que la consulta podría gastar. Con 50 se pasaba del máximo. */
const CATALOGO = `
  query Revision($cursor: String) {
    products(first: 25, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id title handle status tags totalInventory tracksInventory
        featuredMedia { id }
        variants(first: 20) { nodes { price compareAtPrice inventoryPolicy } }
        collections(first: 1) { nodes { id } }
        hermanos: metafield(namespace: "custom", key: "hermano_de_color") { value }
      }
    }
  }
`;

const TIENDA = `
  query TiendaRevision { shop { currencyCode } }
`;

const TOPE_PAGINAS = 40;

function idsDeJson(valor) {
  try {
    const lista = JSON.parse(valor || '[]');
    return Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : [];
  } catch (error) {
    return [];
  }
}

async function cargarCatalogo(onPaso) {
  const productos = [];
  let cursor = null;
  let paginas = 0;
  do {
    const d = await gql(CATALOGO, { cursor }, { sinMemoria: true });
    productos.push(...d.products.nodes.map((n) => ({
      id: n.id,
      titulo: n.title,
      handle: n.handle,
      estado: n.status,
      activo: n.status === 'ACTIVE',
      etiquetas: n.tags ?? [],
      stock: n.totalInventory,
      controlaStock: n.tracksInventory,
      tieneFoto: Boolean(n.featuredMedia?.id),
      variantes: (n.variants?.nodes ?? []).map((v) => ({
        precio: Number(v.price),
        antes: v.compareAtPrice == null ? null : Number(v.compareAtPrice),
        sigueVendiendo: v.inventoryPolicy === 'CONTINUE',
      })),
      enColeccion: (n.collections?.nodes ?? []).length > 0,
      hermanos: idsDeJson(n.hermanos?.value),
    })));
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
    paginas += 1;
    if (onPaso) onPaso(`Leyendo el catálogo… ${productos.length} productos`);
  } while (cursor && paginas < TOPE_PAGINAS);
  return { productos, incompleto: Boolean(cursor) };
}

/* Cada revisión devuelve { clave, titulo, explicacion, tono, items }. Un item es
 * { id, titulo, detalle } — si `id` es de un producto, la pantalla pone el enlace
 * para abrirlo en Shopify. */
function revisionColor(activos, etiquetasColor) {
  const conjunto = ETIQUETA_CONJUNTO.toLowerCase();
  const items = activos
    .filter((p) => !p.etiquetas.some((e) => e.toLowerCase() === conjunto))
    .filter((p) => sinColor(p, etiquetasColor))
    .map((p) => ({ id: p.id, titulo: p.titulo, detalle: 'No lleva la etiqueta de ningún color: su ficha no puede mostrar su muestra.' }));
  return {
    clave: 'color',
    titulo: 'Productos sin color',
    explicacion: 'Activos que no llevan la etiqueta de ninguna entrada de Colores (los conjuntos no cuentan). Se arregla en Productos, con las fichas de color de cada uno.',
    pantalla: 'productos',
    items,
  };
}

function revisionFamilias(productos) {
  const porId = new Map(productos.map((p) => [p.id, p]));
  const items = [];
  for (const p of productos) {
    if (!p.activo) continue;
    for (const h of p.hermanos) {
      const otro = porId.get(h);
      if (h === p.id) {
        items.push({ id: p.id, titulo: p.titulo, detalle: 'Se tiene a sí mismo como hermano de color.' });
      } else if (!otro) {
        items.push({ id: p.id, titulo: p.titulo, detalle: 'Tiene de hermano un producto que ya no existe.' });
      } else if (!otro.activo) {
        items.push({ id: p.id, titulo: p.titulo, detalle: `Tiene de hermano «${otro.titulo}», que está ${otro.estado === 'ARCHIVED' ? 'archivado' : 'en borrador'}.` });
      } else if (!otro.hermanos.includes(p.id)) {
        items.push({ id: p.id, titulo: p.titulo, detalle: `Enlaza con «${otro.titulo}», pero «${otro.titulo}» no enlaza de vuelta: el selector sale en una ficha y no en la otra.` });
      }
    }
  }
  return {
    clave: 'familias',
    titulo: 'Familias de color rotas',
    explicacion: 'Enlaces de «hermano de color» sin vuelta, o hacia productos archivados o borrados. Se arregla en Productos (desvincular y volver a vincular, o «Unir en una familia»).',
    pantalla: 'productos',
    items,
  };
}

function revisionConjuntos(conjuntos, moneda) {
  const items = [];
  for (const c of conjuntos) {
    if (!c.activo) continue;
    if (c.joyas.length !== 2) {
      items.push({ id: c.id, titulo: c.titulo, detalle: c.joyas.length ? `Tiene ${c.joyas.length} joya${c.joyas.length === 1 ? '' : 's'} elegida${c.joyas.length === 1 ? '' : 's'}; necesita dos para calcular su precio.` : 'No tiene sus dos joyas elegidas: su precio no se calcula solo.' });
      continue;
    }
    const inactivas = c.joyas.filter((j) => !j.activo);
    if (inactivas.length) {
      items.push({ id: c.id, titulo: c.titulo, detalle: `Una de sus joyas no está activa: ${inactivas.map((j) => `«${j.titulo}»`).join(' y ')}.` });
    }
    const calculo = calcular(c.joyas, c.descuento ?? DESCUENTO_POR_DEFECTO, moneda);
    if (calculo && !estaAlDia(c, calculo)) {
      items.push({ id: c.id, titulo: c.titulo, detalle: 'Su precio no coincide con la suma de sus joyas menos el descuento. Flow lo corrige cada 4 horas; si sigue así, guárdalo en Conjuntos.' });
    }
  }
  return {
    clave: 'conjuntos',
    titulo: 'Conjuntos',
    explicacion: 'Conjuntos activos sin sus dos joyas, con una joya archivada o con el precio atrasado.',
    pantalla: 'conjuntos',
    items,
  };
}

function revisionAgotados(activos) {
  const items = activos
    .filter((p) => p.controlaStock && (p.stock ?? 0) <= 0 && p.variantes.length && p.variantes.every((v) => !v.sigueVendiendo))
    .map((p) => ({ id: p.id, titulo: p.titulo, detalle: 'Activo, pero sin stock en ninguna talla: se ve en la tienda y no se puede comprar.' }));
  return {
    clave: 'agotados',
    titulo: 'Activos y agotados',
    explicacion: 'Productos publicados sin stock (y sin «seguir vendiendo»). Se archivan o se reponen en Shopify.',
    items,
  };
}

function revisionFotosYColecciones(activos) {
  const items = [];
  for (const p of activos) {
    if (!p.tieneFoto) items.push({ id: p.id, titulo: p.titulo, detalle: 'No tiene ninguna foto.' });
    if (!p.enColeccion) items.push({ id: p.id, titulo: p.titulo, detalle: 'No está en ninguna colección: solo se llega a él por el buscador o un enlace directo.' });
  }
  return {
    clave: 'fotos',
    titulo: 'Sin foto o sin colección',
    explicacion: 'Productos activos sin foto, o que no están en ninguna colección.',
    items,
  };
}

function revisionPrecios(activos) {
  const items = [];
  for (const p of activos) {
    if (p.variantes.some((v) => !(v.precio > 0))) {
      items.push({ id: p.id, titulo: p.titulo, detalle: 'Alguna talla tiene precio 0.' });
    }
    if (p.variantes.some((v) => v.antes != null && v.antes > 0 && v.antes <= v.precio)) {
      items.push({ id: p.id, titulo: p.titulo, detalle: 'El precio «antes» (tachado) es igual o menor que el precio: el descuento sale mal o no sale.' });
    }
  }
  return {
    clave: 'precios',
    titulo: 'Precios',
    explicacion: 'Tallas con precio 0, o con el precio tachado igual o menor que el de venta.',
    items,
  };
}

/* Las insignias y los beneficios guardan sus productos sueltos como referencias:
 * un producto archivado sigue en la lista sin que nadie lo vea. */
function revisionReferencias(etiquetas, beneficios, porId) {
  const items = [];
  const mirar = (entradas, que) => {
    for (const e of entradas) {
      for (const id of e.idsProductos) {
        const p = porId.get(id);
        if (!p) {
          items.push({ id: null, titulo: `${que} «${e.nombre}»`, detalle: 'Tiene en su lista un producto que ya no existe (se limpia sola al guardarla).' });
        } else if (!p.activo) {
          items.push({ id: p.id, titulo: `${que} «${e.nombre}»`, detalle: `Incluye «${p.titulo}», que está ${p.estado === 'ARCHIVED' ? 'archivado' : 'en borrador'}.` });
        }
      }
    }
  };
  mirar(etiquetas, 'Insignia');
  mirar(beneficios, 'Beneficio');
  return {
    clave: 'referencias',
    titulo: 'Insignias y beneficios con productos archivados',
    explicacion: 'Productos sueltos de una insignia o un beneficio que ya no están activos. No hacen daño en la tienda, pero ensucian la lista.',
    pantalla: 'etiquetas',
    items,
  };
}

function revisionIngles(colores, etiquetas, beneficios, botones) {
  const items = [];
  const falta = (lista, que, pantalla, nombre = (x) => x.nombre) => {
    for (const x of lista) {
      if (x.activo === false) continue;
      if (!String(x.nombreEn ?? '').trim()) {
        items.push({ id: null, titulo: `${que} «${nombre(x)}»`, detalle: 'No tiene su texto en inglés: en /en sale en español.', pantalla });
      }
    }
  };
  falta(colores.filter((c) => c.etiqueta), 'Color', 'colores');
  falta(etiquetas, 'Insignia', 'etiquetas');
  falta(beneficios, 'Beneficio', 'beneficios');
  falta(botones, 'Botón de filtro', 'filtros');
  return {
    clave: 'ingles',
    titulo: 'Falta el inglés',
    explicacion: 'Textos del panel que no tienen su versión en inglés. En saintvenik.com/en salen en español.',
    pantalla: 'ingles',
    items,
  };
}

/* Corre todas las revisiones. `onPaso` recibe un texto de avance para la pantalla.
 * Si una revisión falla (Shopify ocupado, por ejemplo), las demás siguen y esa
 * sale con su error en vez de tumbar todo. */
export async function revisarTienda(onPaso) {
  const paso = (t) => { if (onPaso) onPaso(t); };

  paso('Leyendo la tienda…');
  const [{ shop }, colores] = await Promise.all([gql(TIENDA), cargarColores()]);
  const moneda = shop.currencyCode;
  const conIngles = moneda !== 'CLP';

  const { productos, incompleto } = await cargarCatalogo(paso);
  const porId = new Map(productos.map((p) => [p.id, p]));
  const activos = productos.filter((p) => p.activo);
  const etiquetasColor = [...new Set(colores.map((c) => c.etiqueta.trim()).filter(Boolean))];

  const resultados = [];
  const intentar = async (titulo, fn) => {
    try {
      resultados.push(await fn());
    } catch (error) {
      resultados.push({ clave: titulo, titulo, explicacion: '', items: [], error: error.message });
    }
  };

  await intentar('Productos sin color', () => revisionColor(activos, etiquetasColor));
  await intentar('Familias de color rotas', () => revisionFamilias(productos));
  paso('Revisando los conjuntos…');
  await intentar('Conjuntos', async () => revisionConjuntos(await cargarConjuntos(), moneda));
  await intentar('Activos y agotados', () => revisionAgotados(activos));
  await intentar('Sin foto o sin colección', () => revisionFotosYColecciones(activos));
  await intentar('Precios', () => revisionPrecios(activos));

  paso('Revisando insignias, beneficios y filtros…');
  let etiquetas = [];
  let beneficios = [];
  let botones = [];
  try { etiquetas = await cargarEtiquetas(); } catch (error) { etiquetas = []; }
  try { beneficios = await cargarBeneficios(); } catch (error) { beneficios = []; }
  try { botones = await cargarBotones(); } catch (error) { botones = []; }
  await intentar('Insignias y beneficios con productos archivados', () => revisionReferencias(etiquetas, beneficios, porId));
  if (conIngles) await intentar('Falta el inglés', () => revisionIngles(colores, etiquetas, beneficios, botones));

  return {
    resultados,
    total: productos.length,
    activos: activos.length,
    incompleto,
    moneda,
    cuando: new Date(),
  };
}
