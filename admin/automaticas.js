/* Saint Venik · Insignias automáticas (13-nov).
 *
 * Una insignia, además de sus productos elegidos a mano, puede elegir sola:
 *
 * - «Los más vendidos de cada colección»: los N primeros de cada colección elegida,
 *   en el orden «Más vendidos» que calcula Shopify con las ventas (el mismo de
 *   «Ordenar por: más vendidos» en la tienda). No hace falta leer pedidos, así que
 *   la app no necesita permisos nuevos.
 * - «Los más nuevos»: los creados en los últimos N días (de las colecciones elegidas,
 *   o de toda la tienda si no se elige ninguna).
 *
 * Reglas (pedido de Benjamín y del usuario, 13-nov):
 * - Lo automático SE SUMA a lo elegido a mano; no lo reemplaza. Un producto que ya
 *   la tiene a mano y además sale elegido aparece una sola vez (la lista no repite).
 * - Nunca se pone sobre un producto que ya lleva OTRA insignia (por ejemplo
 *   «Novedad»): ese se descarta y se toma el siguiente de la lista. Entre dos
 *   automáticas manda la que está más arriba en la pantalla.
 * - Tampoco sobre lo que la propia insignia resta (`-essentials`), ni sobre
 *   productos no activos o agotados: también se toma el siguiente.
 *
 * Este archivo solo LEE y decide. Escribir lo hace etiquetas.js (sincronizarTodas).
 */
import { gql } from './api.js?v=202611132011';
import { clavesDe } from './asignacion.js?v=202611132011';

export const TIPOS_AUTO = [
  { valor: '', rotulo: 'Ninguna', ayuda: 'Solo los productos elegidos a mano.' },
  { valor: 'mas_vendidos', rotulo: 'Los más vendidos', ayuda: 'Los primeros de cada colección elegida, según las ventas.' },
  { valor: 'nuevos', rotulo: 'Los más nuevos', ayuda: 'Los creados en los últimos días.' },
];

export const CANTIDAD_POR_DEFECTO = 4;
export const DIAS_POR_DEFECTO = 30;
/* Cada cuánto se recalcula sola al abrir el panel (en cualquier pestaña). */
export const HORAS_ENTRE_CALCULOS = 6;

/* Hasta 60 de cada colección: con 4 por colección sobra margen para saltarse los
 * que tienen otra insignia o están agotados. */
const RANKING = `
  query Ranking($id: ID!, $orden: ProductCollectionSortKeys!, $al_reves: Boolean!) {
    collection(id: $id) {
      id title handle
      products(first: 60, sortKey: $orden, reverse: $al_reves) {
        nodes { id handle title status createdAt totalInventory tracksInventory }
      }
    }
  }
`;

const NUEVOS_TIENDA = `
  query Nuevos($consulta: String!) {
    products(first: 100, sortKey: CREATED_AT, reverse: true, query: $consulta) {
      nodes { id handle title status createdAt totalInventory tracksInventory }
    }
  }
`;

export function autoEncendida(e) {
  return Boolean(e.autoActivo && e.autoTipo && e.activo);
}

function agotado(p) {
  return Boolean(p.tracksInventory) && (p.totalInventory ?? 0) <= 0;
}

function desde(dias) {
  return new Date(Date.now() - Math.max(1, dias) * 24 * 60 * 60 * 1000);
}

/* Las listas de candidatos, cada una en su orden (las más vendidas primero, o las
 * más nuevas primero). Una por colección; si no hay colecciones, una de la tienda. */
async function candidatos(e, cache) {
  const listas = [];
  const pedir = (clave, fn) => {
    if (!cache) return fn();
    if (!cache.has(clave)) cache.set(clave, fn().catch((error) => { cache.delete(clave); throw error; }));
    return cache.get(clave);
  };

  if (e.autoTipo === 'mas_vendidos') {
    for (const c of e.autoColecciones) {
      const d = await pedir(`rank:${c.id}`, () => gql(RANKING, { id: c.id, orden: 'BEST_SELLING', al_reves: false }, { sinMemoria: true }));
      if (d.collection) listas.push({ titulo: d.collection.title, productos: d.collection.products.nodes });
    }
    return listas;
  }

  if (e.autoTipo === 'nuevos') {
    const limite = desde(e.autoDias);
    const recientes = (nodos) => nodos.filter((p) => new Date(p.createdAt) >= limite);
    if (e.autoColecciones.length) {
      for (const c of e.autoColecciones) {
        const d = await pedir(`nuevos:${c.id}`, () => gql(RANKING, { id: c.id, orden: 'CREATED', al_reves: true }, { sinMemoria: true }));
        if (d.collection) listas.push({ titulo: d.collection.title, productos: recientes(d.collection.products.nodes) });
      }
    } else {
      const fecha = limite.toISOString().slice(0, 10);
      const d = await pedir(`nuevos:tienda:${fecha}`, () => gql(NUEVOS_TIENDA, { consulta: `status:active created_at:>='${fecha}'` }, { sinMemoria: true }));
      listas.push({ titulo: 'Toda la tienda', productos: recientes(d.products.nodes) });
    }
  }
  return listas;
}

/* Elige los productos de una insignia automática.
 * - `bloqueo`: Map clave → nombre de la otra insignia que ya lo tiene.
 * - `fuera`: Set de claves que esta insignia resta (`-essentials`).
 * Devuelve las claves elegidas (id y handle de cada producto) y, para la vista
 * previa, qué se eligió y qué se saltó en cada colección y por qué. */
export async function elegirAutomaticos(e, { bloqueo = new Map(), fuera = new Set() } = {}, cache) {
  const cantidad = e.autoTipo === 'mas_vendidos'
    ? Math.max(1, e.autoCantidad || CANTIDAD_POR_DEFECTO)
    : Math.max(0, e.autoCantidad || 0);
  const listas = await candidatos(e, cache);
  const claves = new Set();
  const grupos = [];

  for (const lista of listas) {
    const elegidos = [];
    const saltados = [];
    for (const p of lista.productos) {
      if (cantidad && elegidos.length >= cantidad) break;
      const suyas = clavesDe(p);
      if (p.status !== 'ACTIVE') { saltados.push({ titulo: p.title, motivo: 'no está activo' }); continue; }
      if (agotado(p)) { saltados.push({ titulo: p.title, motivo: 'agotado' }); continue; }
      if (suyas.some((k) => fuera.has(k))) { saltados.push({ titulo: p.title, motivo: 'esta insignia lo resta' }); continue; }
      const otra = suyas.map((k) => bloqueo.get(k)).find(Boolean);
      if (otra) { saltados.push({ titulo: p.title, motivo: `ya tiene «${otra}»` }); continue; }
      suyas.forEach((k) => claves.add(k));
      elegidos.push({ titulo: p.title, id: p.id });
    }
    grupos.push({ titulo: lista.titulo, elegidos, saltados });
  }
  return { claves: [...claves], grupos };
}

/* Si toca recalcular sola: nunca calculada, o hace más de HORAS_ENTRE_CALCULOS. */
export function tocaRecalcular(e, ahora = Date.now()) {
  if (!autoEncendida(e)) return false;
  const t = Date.parse(e.autoFecha || '');
  return !Number.isFinite(t) || ahora - t > HORAS_ENTRE_CALCULOS * 60 * 60 * 1000;
}
