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
import { gql, comprobarErrores } from './api.js?v=202609162010';

export const TIPO_CONFIG = 'sv_configuracion';
const HANDLE = 'general';

export const ORDEN_POR_DEFECTO = ['acero-inox', 'oro'];

/* Por defecto, lo más discreto: alineado a la izquierda y compacto. Un bloque de
 * app que llega gritando obliga a que la primera tarea sea apagarlo. */
export const APARIENCIA_POR_DEFECTO = {
  alineacion: 'izquierda',
  tamanoMuestra: 34,
  escala: 'compacto',
};

const CAMPOS_CONFIG = [
  { key: 'orden_colores', name: 'Orden de los colores', type: 'single_line_text_field' },
  { key: 'boton_guia_es', name: 'Texto del botón de guía (español)', type: 'single_line_text_field' },
  { key: 'boton_guia_en', name: 'Texto del botón de guía (inglés)', type: 'single_line_text_field' },
  { key: 'alineacion', name: 'Alineación de los bloques', type: 'single_line_text_field' },
  { key: 'tamano_muestra', name: 'Tamaño de las muestras de color', type: 'number_integer' },
  { key: 'escala', name: 'Tamaño de los textos y botones', type: 'single_line_text_field' },
];

const DEFINICION = `
  query DefinicionConfig {
    metaobjectDefinitionByType(type: "${TIPO_CONFIG}") { id fieldDefinitions { key } }
  }
`;

const ACTUALIZAR_DEFINICION = `
  mutation ActualizarDefinicionConfig($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition { id }
      userErrors { field message code }
    }
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

/* La definición pudo crearse con una versión anterior, sin todos los campos. */
export async function faltanCamposConfig() {
  const d = await gql(DEFINICION);
  if (!d.metaobjectDefinitionByType) return [];
  const presentes = new Set(d.metaobjectDefinitionByType.fieldDefinitions.map((f) => f.key));
  return CAMPOS_CONFIG.filter((c) => !presentes.has(c.key)).map((c) => c.key);
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

  const d2 = await gql(DEFINICION);
  if (d2.metaobjectDefinitionByType) {
    const presentes = new Set(d2.metaobjectDefinitionByType.fieldDefinitions.map((f) => f.key));
    const faltan = CAMPOS_CONFIG.filter((c) => !presentes.has(c.key));
    if (faltan.length) {
      const r = await gql(ACTUALIZAR_DEFINICION, {
        id: d2.metaobjectDefinitionByType.id,
        definition: { fieldDefinitions: faltan.map((c) => ({ create: c })) },
      });
      comprobarErrores(r, 'metaobjectDefinitionUpdate');
      pasos.push(`Campos de configuración añadidos: ${faltan.map((c) => c.key).join(', ')}`);
    }
  }

  /* Si no hay entrada, el Liquid cae al ajuste del tema y el panel a su
   * constante: dos fuentes de verdad que pueden discrepar. Se escribe una
   * entrada desde el principio para que solo haya una. */
  const actual = await leerConfig();
  if (!actual.id) {
    await guardarOrdenColores(actual.ordenColores);
    pasos.push('Orden de colores inicializado');
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
    botonGuiaEs: campos.boton_guia_es ?? '',
    botonGuiaEn: campos.boton_guia_en ?? '',
    alineacion: campos.alineacion || APARIENCIA_POR_DEFECTO.alineacion,
    tamanoMuestra: Number(campos.tamano_muestra) || APARIENCIA_POR_DEFECTO.tamanoMuestra,
    escala: campos.escala || APARIENCIA_POR_DEFECTO.escala,
  };
}

export async function guardarApariencia({ alineacion, tamanoMuestra, escala }) {
  const r = await gql(GUARDAR, {
    handle: { type: TIPO_CONFIG, handle: HANDLE },
    metaobject: {
      fields: [
        { key: 'alineacion', value: alineacion },
        { key: 'tamano_muestra', value: String(tamanoMuestra) },
        { key: 'escala', value: escala },
      ],
    },
  });
  return comprobarErrores(r, 'metaobjectUpsert');
}

export async function guardarTextosBoton({ es, en }) {
  const r = await gql(GUARDAR, {
    handle: { type: TIPO_CONFIG, handle: HANDLE },
    metaobject: {
      fields: [
        { key: 'boton_guia_es', value: es ?? '' },
        { key: 'boton_guia_en', value: en ?? '' },
      ],
    },
  });
  return comprobarErrores(r, 'metaobjectUpsert');
}

export async function guardarOrdenColores(etiquetas) {
  /* Se guarda normalizado para que lo escrito y lo leído coincidan siempre, y
   * para que coincida con lo que compara el Liquid. */
  const limpias = etiquetas.map((e) => String(e ?? '').trim().toLowerCase()).filter(Boolean);

  const r = await gql(GUARDAR, {
    handle: { type: TIPO_CONFIG, handle: HANDLE },
    metaobject: { fields: [{ key: 'orden_colores', value: limpias.join(', ') }] },
  });
  return comprobarErrores(r, 'metaobjectUpsert');
}
