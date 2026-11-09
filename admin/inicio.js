/* Inicio de la tienda: la cuadrícula de colecciones sobre negro (reunión
 * 9-nov). En Navidad, cada foto es la del metacampo de colección
 * custom.foto_navidad, que esta app crea. */
import { gql, comprobarErrores } from './api.js?v=202611091947';

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
      description: 'La foto de esta colección en la cuadrícula del inicio cuando la temporada es Navidad (estilo terciopelo rojo). La usa Color & Size Picker.',
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
 * cuadrícula del inicio y el carrito vacío. */
const COLECCION = `query Coleccion($q: String!) { collections(first: 1, query: $q) { nodes { id handle } } }`;
const PONER = `mutation PonerNavidad($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message code } }
}`;

export async function prepararNavidad(copiar, base) {
  const hechas = [];
  for (const h of ['cadenas', 'pulseras', 'colgantes', 'anillos']) {
    const c = (await gql(COLECCION, { q: `handle:${h}` })).collections.nodes.find((n) => n.handle === h);
    if (!c) continue;
    const f = await copiar(`${base}sv-navidad-${h}.jpg`);
    comprobarErrores(await gql(PONER, {
      metafields: [{ ownerId: c.id, namespace: 'custom', key: 'foto_navidad', type: 'file_reference', value: f.id }],
    }), 'metafieldsSet');
    hechas.push(h);
  }
  return hechas;
}
