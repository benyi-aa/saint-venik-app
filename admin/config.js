/* Saint Venik · Configuración de la app.
 *
 * Una sola entrada de metaobjeto donde vive lo que hasta ahora vivía en los
 * ajustes del bloque en el editor de temas. El objetivo es que todo se edite en
 * un sitio, el panel, y no repartido entre Personalizar y Contenido.
 *
 * Se usa un metaobjeto y no un metacampo de tienda a propósito: metaobjetos es
 * el mecanismo que ya está probado de punta a punta en esta app (se escribe
 * desde el panel, se lee desde Liquid), y no añade permisos nuevos.
 */
import { gql, comprobarErrores } from './api.js?v=202609160710';

export const TIPO_CONFIG = 'sv_configuracion';
const HANDLE = 'general';

export const ORDEN_POR_DEFECTO = ['acero-inox', 'oro'];

const CAMPOS_CONFIG = [
  { key: 'orden_colores', name: 'Orden de los colores', type: 'single_line_text_field' },
];

const DEFINICION = `
  query DefinicionConfig {
    metaobjectDefinitionByType(type: "${TIPO_CONFIG}") { id fieldDefinitions { key } }
  }
`;

const CREAR_DEFINICION = `
  mutation CrearDefinicionConfig($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id }
      userErrors { field message code }
    }
  }
`;

const LEER = `
  query Config {
    metaobjects(type: "${TIPO_CONFIG}", first: 1) {
      nodes { id handle fields { key value } }
    }
  }
`;

const GUARDAR = `
  mutation GuardarConfig($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message code }
    }
  }
`;

export async function existeConfig() {
  const d = await gql(DEFINICION);
  return Boolean(d.metaobjectDefinitionByType);
}

export async function asegurarConfig(pasos = []) {
  const d = await gql(DEFINICION);
  if (!d.metaobjectDefinitionByType) {
    const r = await gql(CREAR_DEFINICION, {
      definition: {
        type: TIPO_CONFIG,
        name: 'Configuración de Color & Size Picker',
        access: { storefront: 'PUBLIC_READ' },
        fieldDefinitions: CAMPOS_CONFIG,
      },
    });
    comprobarErrores(r, 'metaobjectDefinitionCreate');
    pasos.push('Configuración creada');
  }
  return pasos;
}

export async function leerConfig() {
  const d = await gql(LEER);
  const nodo = d.metaobjects.nodes[0];
  const campos = Object.fromEntries((nodo?.fields ?? []).map((f) => [f.key, f.value]));

  const crudo = (campos.orden_colores ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  return {
    id: nodo?.id ?? null,
    ordenColores: crudo.length ? crudo : ORDEN_POR_DEFECTO,
  };
}

export async function guardarOrdenColores(etiquetas) {
  const r = await gql(GUARDAR, {
    handle: { type: TIPO_CONFIG, handle: HANDLE },
    metaobject: { fields: [{ key: 'orden_colores', value: etiquetas.join(', ') }] },
  });
  return comprobarErrores(r, 'metaobjectUpsert');
}
