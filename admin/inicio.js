/* Inicio de la tienda: la cuadrícula de colecciones sobre negro (reunión
 * 9-nov). En Navidad, cada foto es la del metacampo de colección
 * custom.foto_navidad, que esta app crea. */
import { gql, comprobarErrores } from './api.js?v=202611132017';

const METACAMPO_NAVIDAD = `
  query MetacampoNavidad {
    metafieldDefinitions(ownerType: COLLECTION, namespace: "custom", key: "foto_navidad", first: 1) {
      nodes { id }
    }
  }
`;

const CREAR_METACAMPO = `
  mutation CrearMetacampoNavidad($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id }
      userErrors { field message code }
    }
  }
`;

export async function faltaEstructuraInicio() {
  const m = await gql(METACAMPO_NAVIDAD);
  return m.metafieldDefinitions.nodes.length ? [] : ['El campo «Foto de Navidad» de las colecciones.'];
}

export async function asegurarEstructuraInicio(pasos) {
  const m = await gql(METACAMPO_NAVIDAD);
  if (m.metafieldDefinitions.nodes.length) return pasos;
  const r = await gql(CREAR_METACAMPO, {
    definition: {
      name: 'Foto de Navidad',
      namespace: 'custom',
      key: 'foto_navidad',
      description: 'La foto de esta colección en la cuadrícula del inicio cuando la temporada es Navidad (estilo terciopelo rojo). La usa Panel Saint Venik.',
      type: 'file_reference',
      ownerType: 'COLLECTION',
      validations: [{ name: 'file_type_options', value: '["Image"]' }],
      access: { storefront: 'PUBLIC_READ' },
    },
  });
  comprobarErrores(r, 'metafieldDefinitionCreate');
  pasos.push('Campo «Foto de Navidad» de las colecciones creado');
  return pasos;
}

/* Las fotos de Navidad (9-nov, Nano Banana, estilo CRAFTD): se copian a Archivos
 * desde admin/fotos-inicio/ y cada una queda en el «Foto de Navidad» de su
 * colección. Con la temporada en Normal no se ve nada; en Navidad las usan la
 * cuadrícula del inicio y el carrito vacío. Si la colección ya tiene foto, se
 * cambia el contenido de ese mismo archivo: volver a apretar el botón no deja
 * copias repetidas en Archivos. */
const COLECCION = `query Coleccion($q: String!) {
  collections(first: 1, query: $q) {
    nodes { id handle foto: metafield(namespace: "custom", key: "foto_navidad") { reference { ... on MediaImage { id } } } }
  }
}`;
const PONER = `mutation PonerNavidad($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message code } }
}`;

export async function prepararNavidad(copiar, reemplazar, traer, base) {
  const hechas = [];
  /* ?v= para que Shopify no se lleve una copia vieja guardada en GitHub Pages. */
  const v = Date.now();
  for (const h of ['cadenas', 'pulseras', 'colgantes', 'anillos']) {
    const c = (await gql(COLECCION, { q: `handle:${h}` }, { sinMemoria: true })).collections.nodes.find((n) => n.handle === h);
    if (!c) continue;
    const fuente = `${base}sv-navidad-${h}.jpg?v=${v}`;
    const actual = c.foto?.reference?.id;
    if (actual) {
      await reemplazar(actual, fuente);
      hechas.push(h);
      continue;
    }
    const f = await copiar(fuente);
    comprobarErrores(await gql(PONER, {
      metafields: [{ ownerId: c.id, namespace: 'custom', key: 'foto_navidad', type: 'file_reference', value: f.id }],
    }), 'metafieldsSet');
    hechas.push(h);
  }
  /* Los banners de cada colección (terciopelo rojo, 21:9): van a Archivos con
   * su nombre y la extensión los cambia por la foto de verano coleccion_<k>.jpg
   * cuando la temporada es Navidad. Mismo nombre: se reemplazan, no se copian. */
  for (const k of ['cadena', 'pulsera', 'anillos', 'colgantes', 'conjuntos', 'essentials', 'bestsellers']) {
    await traer(`${base}sv-navidad-portada-${k}.jpg?v=${v}`);
    hechas.push(`banner ${k}`);
  }
  /* Sus versiones para el teléfono: el título va siempre abajo y aquí la joya queda arriba. */
  for (const k of ['cadena', 'pulsera', 'anillos', 'colgantes', 'conjuntos', 'essentials', 'bestsellers']) {
    await traer(`${base}sv-navidad-portada-${k}-movil.jpg?v=${v}`);
  }
  /* La foto de la sección «El regalo Nº1 para él» (bloque regalo del inicio). */
  await traer(`${base}sv-regalo-navidad.jpg?v=${v}`);
  hechas.push('regalo');
  return hechas;
}
