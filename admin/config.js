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
import { gql, comprobarErrores } from './api.js?v=202611092012';

export const TIPO_CONFIG = 'sv_configuracion';
/* Shopify admite como mucho 40 campos por definición de metaobjeto y
 * sv_configuracion ya tiene los 40. Lo nuevo va en una segunda definición,
 * con su propia entrada «general»: el panel lee y guarda las dos como si
 * fueran una, y el Liquid que usa un campo de aquí lo busca en esta. */
export const TIPO_CONFIG_2 = 'sv_configuracion_2';
const HANDLE = 'general';

export const ORDEN_POR_DEFECTO = ['acero-inox', 'oro'];

/* Por defecto, alineado a la izquierda y a la escala de saintvenik.cl, que es
 * la referencia de la marca: "normal" esta calcado de alli. "compacto" queda
 * como opcion mas pequena. Antes el defecto era compacto, y junto al enlace de
 * la guia los botones de talla se veian diminutos. */
export const APARIENCIA_POR_DEFECTO = {
  alineacion: 'izquierda',
  tamanoMuestra: 34,
  escala: 'normal',
};

/* Los de saintvenik.cl y .com. Vacios, el bloque usaria la traduccion ("Guia de
 * tallas", con t minuscula), que no es lo que muestran las tiendas. */
export const TEXTOS_BOTON_POR_DEFECTO = { es: 'Guía de Tallas', en: 'Size guide' };

/* Llena: 40 campos, el tope de Shopify. Los nuevos van en CAMPOS_CONFIG_2. */
const CAMPOS_CONFIG = [
  { key: 'orden_colores', name: 'Orden de los colores', type: 'single_line_text_field' },
  { key: 'boton_guia_es', name: 'Texto del botón de guía (español)', type: 'single_line_text_field' },
  { key: 'boton_guia_en', name: 'Texto del botón de guía (inglés)', type: 'single_line_text_field' },
  { key: 'alineacion', name: 'Alineación de los bloques', type: 'single_line_text_field' },
  { key: 'tamano_muestra', name: 'Tamaño de las muestras de color', type: 'number_integer' },
  { key: 'escala', name: 'Tamaño de los textos y botones', type: 'single_line_text_field' },
  /* El aspecto de las píldoras de beneficio sobre las fotos. Es global a
   * propósito: todas las de una ficha tienen que verse iguales, y el beneficio
   * no lleva colores propios. Vive aquí y no en los ajustes del tema porque
   * todo se maneja desde la app.
   *
   * `foto_activo` va como texto 'si'/'no' y no como boolean: en Liquid el
   * filtro `default` sustituye también el false, así que un booleano apagado
   * aquí no podría apagar el ajuste del tema. */
  { key: 'foto_activo', name: 'Beneficios sobre las fotos', type: 'single_line_text_field' },
  { key: 'foto_esquina', name: 'Esquina de la píldora', type: 'single_line_text_field' },
  { key: 'foto_cuantas', name: 'Cuántas fotos llevan beneficio', type: 'number_integer' },
  { key: 'foto_fondo', name: 'Fondo de la píldora', type: 'color' },
  { key: 'foto_texto', name: 'Texto e icono de la píldora', type: 'color' },
  { key: 'foto_borde', name: 'Borde de la píldora', type: 'color' },
  { key: 'foto_grosor', name: 'Grosor del borde de la píldora', type: 'number_integer' },
  { key: 'foto_opacidad', name: 'Opacidad de la píldora', type: 'number_integer' },
  { key: 'foto_radio', name: 'Redondeo de la píldora', type: 'number_integer' },
  { key: 'foto_letra', name: 'Tamaño del texto de la píldora', type: 'number_integer' },
  { key: 'foto_margen', name: 'Separación del borde de la foto', type: 'number_integer' },
  /* El descuento: el porcentaje a secas en vez del «AHORRA 14%» del tema.
   * `desc_activo` tiene tres estados en texto: 'si', 'no' y 'prueba' (solo se
   * ve abriendo la tienda con ?sv-vista=1). Los «donde» van como 'si'/'no' por
   * lo mismo que foto_activo. */
  { key: 'desc_activo', name: 'Descuento: estado', type: 'single_line_text_field' },
  { key: 'desc_tarjetas', name: 'Descuento en las tarjetas', type: 'single_line_text_field' },
  { key: 'desc_foto', name: 'Descuento sobre las fotos de la ficha', type: 'single_line_text_field' },
  { key: 'desc_precio', name: 'Descuento junto al precio', type: 'single_line_text_field' },
  { key: 'desc_formato', name: 'Descuento: cómo se escribe', type: 'single_line_text_field' },
  { key: 'desc_fondo', name: 'Descuento: fondo', type: 'color' },
  { key: 'desc_texto', name: 'Descuento: texto', type: 'color' },
  { key: 'desc_radio', name: 'Descuento: redondeo', type: 'number_integer' },
  /* En la ficha el precio del tema (20 px) se comia al porcentaje: el precio
   * baja un poco y el porcentaje sube un poco. 0 en el precio = el del tema. */
  { key: 'desc_precio_letra', name: 'Descuento: tamaño del precio en la ficha (px)', type: 'number_integer' },
  { key: 'desc_letra', name: 'Descuento: tamaño del porcentaje junto al precio (px)', type: 'number_integer' },
  /* Transiciones entre páginas (embed de <head>): la barra que se llena, el
   * fundido y la precarga. Mismo esquema de tres estados que el descuento. */
  { key: 'trans_activo', name: 'Transiciones: estado', type: 'single_line_text_field' },
  { key: 'trans_color', name: 'Transiciones: color de la barra', type: 'color' },
  { key: 'trans_grosor', name: 'Transiciones: grosor de la barra', type: 'number_integer' },
  { key: 'trans_fundido', name: 'Transiciones: duración del fundido (ms)', type: 'number_integer' },
  { key: 'trans_precarga', name: 'Transiciones: precargar al apoyar el dedo', type: 'single_line_text_field' },
  /* Filtros de las colecciones: los botones de la página y los valores
   * posibles de cada filtro (las listas que ofrece la pantalla Filtros al
   * clasificar los productos). Los botones en sí son el metaobjeto
   * sv_boton_filtro. */
  { key: 'filtros_activo', name: 'Filtros: estado de los botones', type: 'single_line_text_field' },
  { key: 'filtros_colores', name: 'Filtros: valores de color', type: 'single_line_text_field' },
  { key: 'filtros_categorias', name: 'Filtros: valores de categoría', type: 'single_line_text_field' },
  { key: 'filtros_tipos', name: 'Filtros: valores de tipo', type: 'single_line_text_field' },
  { key: 'filtros_ordenar', name: 'Filtros: «Ordenar» dentro de Filtrar', type: 'single_line_text_field' },
  { key: 'filtros_columnas', name: 'Filtros: botones por fila en el teléfono', type: 'number_integer' },
  /* El menú Filtrar en el computador: la columna del tema ('no') o el mismo
   * cajón lateral que en el teléfono. Vacío = 'prueba' (snippet sv-cajon). */
  { key: 'filtros_cajon', name: 'Filtros: menú en cajón lateral en el computador', type: 'single_line_text_field' },
  /* Debajo del slider de precio, «Desde» y «Hasta» para escribirlo. Vacío =
   * 'prueba' (data-precio del embed de filtros). */
  { key: 'filtros_precio', name: 'Filtros: casillas para escribir el precio', type: 'single_line_text_field' },
];

/* En sv_configuracion_2. Hasta 40 también. */
const CAMPOS_CONFIG_2 = [
  /* La foto de cada colección en el teléfono, con el título encima y la
   * descripción al tocarla, y sin espacios hasta el 3x2. Vacío = 'si'
   * (snippet sv-portada): se pidió aplicarla en todas el 9-nov. */
  { key: 'colecciones_portada', name: 'Colecciones: foto con título en el teléfono', type: 'single_line_text_field' },
  /* Reunión del 9-nov: precio tachado en gris y precio de oferta en rojo, en
   * las tarjetas y en la ficha. 'si' = usa los dos colores de abajo; vacío o
   * 'no' = los del tema (snippet sv-desc-estilo). */
  { key: 'precio_colores', name: 'Precios: colores propios', type: 'single_line_text_field' },
  { key: 'precio_oferta', name: 'Precios: color del precio de oferta', type: 'color' },
  { key: 'precio_tachado', name: 'Precios: color del precio tachado', type: 'color' },
  /* Descuento sobre las fotos de la ficha en el computador: 'segunda' (solo
   * en la segunda, como Lost Gen; reunión 9-nov) o 'todas'. Vacío = 'segunda'.
   * En el teléfono va en todas. */
  { key: 'desc_foto_compu', name: 'Descuento en las fotos: en el computador', type: 'single_line_text_field' },
  /* Menú del teléfono como gasper.co (reunión 9-nov): cada colección en una
   * tarjeta gris con su foto, el logo a la izquierda y la X sin recuadro.
   * 'si' / 'no' / 'prueba'; vacío = 'prueba' (snippet sv-menu). */
  { key: 'menu_tarjetas', name: 'Menú del teléfono: tarjetas con foto', type: 'single_line_text_field' },
  /* Inicio: la cuadrícula de colecciones (Cadenas, Pulseras…) sobre negro en
   * vez de blanco, misma disposición (snippet sv-inicio). 'si' / 'no' /
   * 'prueba'; vacío = 'prueba'. */
  { key: 'categorias_inicio', name: 'Inicio: colecciones sobre negro', type: 'single_line_text_field' },
  /* 'normal' o 'navidad': en Navidad las fotos de la cuadrícula del inicio
   * son la «Foto de Navidad» de cada colección. Vacío = 'normal'. */
  { key: 'temporada', name: 'Temporada de la tienda', type: 'single_line_text_field' },
];

/* Lo mismo que ya pinta hoy el embed con sus ajustes de fábrica: así mover la
 * configuración a la app no cambia nada de lo que se ve. */
export const PILDORA_POR_DEFECTO = {
  activo: true,
  /* Abajo a la izquierda: arriba a la derecha es donde va la insignia, y las
   * dos cosas en la misma esquina se pisan. */
  esquina: 'abajo-izquierda',
  cuantas: 3,
  fondo: '#FFFFFF',
  texto: '#111111',
  borde: '#E4DFD7',
  grosor: 0,
  opacidad: 100,
  radio: 7,
  letra: 12,
  margen: 10,
};

/* Como el de Lost Gen Club: rojo, letra blanca, esquina casi viva. Apagado
 * de fábrica: hasta que alguien lo encienda, la tienda sigue como estaba. */
export const DESCUENTO_POR_DEFECTO = {
  modo: 'no',
  tarjetas: true,
  foto: true,
  precio: true,
  formato: 'pct',
  fondo: '#C4161C',
  texto: '#FFFFFF',
  radio: 2,
  precioLetra: 17,
  letra: 14,
  /* Apagado de fábrica: hasta guardarlo, los precios siguen como en el tema. */
  precioColores: false,
  oferta: '#E32C2B',
  tachado: '#8C8C8C',
  fotoCompu: 'segunda',
};

/* Como la de louisvuitton.com: fina y gris (medida en el video de la
 * llamada), y un fundido corto. Gris y no negra: lo primero de la tienda es
 * la cuenta regresiva, negra, y una barra negra encima no se ve. */
export const TRANSICION_POR_DEFECTO = {
  modo: 'no',
  color: '#999999',
  grosor: 2,
  fundido: 250,
  precarga: true,
};

/* Lo de la llamada: colores, brillantes y las categorías del menú. */
export const FILTROS_POR_DEFECTO = {
  modo: 'no',
  colores: ['Dorado', 'Plateado'],
  categorias: ['Cadenas', 'Colgantes', 'Pulseras', 'Anillos', 'Conjuntos', 'Lentes'],
  tipos: ['Brillantes', 'Tenis', 'Perlas', 'Cubanas', 'Rope'],
  ordenar: true,
  columnas: 4,
  cajon: 'prueba',
  precio: 'prueba',
  portada: 'si',
};

export const FORMATOS_DESCUENTO = [
  { valor: 'pct', rotulo: '20 %' },
  { valor: 'menos', rotulo: '-20 %' },
  { valor: 'off', rotulo: '20 % OFF' },
];

export function textoDescuento(n, formato) {
  if (formato === 'menos') return `-${n}\u00a0%`;
  if (formato === 'off') return `${n}\u00a0% OFF`;
  return `${n}\u00a0%`;
}

const DEFINICION = `
  query DefinicionConfig {
    metaobjectDefinitionByType(type: "${TIPO_CONFIG}") { id fieldDefinitions { key } }
    dos: metaobjectDefinitionByType(type: "${TIPO_CONFIG_2}") { id fieldDefinitions { key } }
  }
`;

/* Las dos definiciones, con lo que le toca a cada una. */
const PARTES = [
  { clave: 'metaobjectDefinitionByType', tipo: TIPO_CONFIG, campos: CAMPOS_CONFIG },
  { clave: 'dos', tipo: TIPO_CONFIG_2, campos: CAMPOS_CONFIG_2 },
];
const DE_LA_2 = new Set(CAMPOS_CONFIG_2.map((c) => c.key));
const clavesDe = (def) => new Set((def?.fieldDefinitions ?? []).map((f) => f.key));

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

const LEER_2 = `
  query Config2 {
    metaobjects(type: "${TIPO_CONFIG_2}", first: 1) {
      nodes { fields { key value } }
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

/* Los campos que existen en la tienda, de las dos definiciones. */
export async function camposDeConfig() {
  const d = await gql(DEFINICION);
  return new Set([...clavesDe(d.metaobjectDefinitionByType), ...clavesDe(d.dos)]);
}

/* La definición pudo crearse con una versión anterior, sin todos los campos. */
export async function faltanCamposConfig() {
  const d = await gql(DEFINICION);
  if (!d.metaobjectDefinitionByType) return [];
  return PARTES.flatMap(({ clave, campos }) => {
    const presentes = clavesDe(d[clave]);
    return campos.filter((c) => !presentes.has(c.key)).map((c) => c.key);
  });
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
    for (const { clave, tipo, campos } of PARTES) {
      const def = d2[clave];
      if (!def) {
        /* La segunda definición: se crea ya con sus campos. */
        const r = await gql(CREAR_DEFINICION, {
          definition: {
            type: tipo,
            name: 'Configuración de Color & Size Picker (2)',
            access: { storefront: 'PUBLIC_READ' },
            fieldDefinitions: campos,
          },
        });
        comprobarErrores(r, 'metaobjectDefinitionCreate');
        pasos.push(`Campos de configuración añadidos: ${campos.map((c) => c.key).join(', ')}`);
        continue;
      }
      const presentes = clavesDe(def);
      const faltan = campos.filter((c) => !presentes.has(c.key));
      if (faltan.length) {
        const r = await gql(ACTUALIZAR_DEFINICION, {
          id: def.id,
          definition: { fieldDefinitions: faltan.map((c) => ({ create: c })) },
        });
        comprobarErrores(r, 'metaobjectDefinitionUpdate');
        pasos.push(`Campos de configuración añadidos: ${faltan.map((c) => c.key).join(', ')}`);
      }
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

  /* Y con todos sus valores, no solo el orden. Un campo vacio hace que el
   * bloque use su respaldo, y el del tamano de muestra (36) no es el de la app
   * (34): en una tienda nueva las muestras salian mas grandes que en la
   * referencia. Solo se rellena lo vacio, para no pisar lo que alguien eligio. */
  const crudo = await leerCrudo();
  const semillas = {
    alineacion: APARIENCIA_POR_DEFECTO.alineacion,
    tamano_muestra: String(APARIENCIA_POR_DEFECTO.tamanoMuestra),
    escala: APARIENCIA_POR_DEFECTO.escala,
    boton_guia_es: TEXTOS_BOTON_POR_DEFECTO.es,
    boton_guia_en: TEXTOS_BOTON_POR_DEFECTO.en,
  };
  const vacios = Object.entries(semillas).filter(([k]) => !String(crudo[k] ?? '').trim());
  if (vacios.length) {
    const r = await gql(GUARDAR, {
      handle: { type: TIPO_CONFIG, handle: HANDLE },
      metaobject: { fields: vacios.map(([key, value]) => ({ key, value })) },
    });
    comprobarErrores(r, 'metaobjectUpsert');
    pasos.push(`Configuración inicial: ${vacios.map(([k]) => k).join(', ')}`);
  }

  return pasos;
}

async function leerCrudo() {
  const d = await gql(LEER);
  const nodo = d.metaobjects.nodes[0];
  return Object.fromEntries((nodo?.fields ?? []).map((f) => [f.key, f.value]));
}

/* Los campos de sv_configuracion_2. Sin la definición todavía, vacío. */
async function leerCampos2() {
  try {
    const d = await gql(LEER_2);
    return Object.fromEntries((d.metaobjects.nodes[0]?.fields ?? []).map((f) => [f.key, f.value]));
  } catch {
    return {};
  }
}

/* Guarda cada campo en la definición que le toca. */
async function guardarCampos(fields) {
  let hecho = null;
  for (const [type, lista] of [
    [TIPO_CONFIG, fields.filter((f) => !DE_LA_2.has(f.key))],
    [TIPO_CONFIG_2, fields.filter((f) => DE_LA_2.has(f.key))],
  ]) {
    if (!lista.length) continue;
    const r = await gql(GUARDAR, { handle: { type, handle: HANDLE }, metaobject: { fields: lista } });
    hecho = comprobarErrores(r, 'metaobjectUpsert');
  }
  return hecho;
}

export async function leerConfig() {
  const [d, campos2] = await Promise.all([gql(LEER), leerCampos2()]);
  const nodo = d.metaobjects.nodes[0];
  const campos = { ...Object.fromEntries((nodo?.fields ?? []).map((f) => [f.key, f.value])), ...campos2 };

  const crudo = (campos.orden_colores ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  return {
    id: nodo?.id ?? null,
    ordenColores: crudo.length ? crudo : ORDEN_POR_DEFECTO,
    botonGuiaEs: campos.boton_guia_es ?? '',
    botonGuiaEn: campos.boton_guia_en ?? '',
    alineacion: campos.alineacion || APARIENCIA_POR_DEFECTO.alineacion,
    tamanoMuestra: Number(campos.tamano_muestra) || APARIENCIA_POR_DEFECTO.tamanoMuestra,
    escala: campos.escala || APARIENCIA_POR_DEFECTO.escala,
    pildora: aPildora(campos),
    descuento: aDescuento(campos),
    transicion: aTransicion(campos),
    filtros: aFiltros(campos),
    menu: ['si', 'no', 'prueba'].includes(campos.menu_tarjetas) ? campos.menu_tarjetas : 'prueba',
    inicio: {
      modo: ['si', 'no', 'prueba'].includes(campos.categorias_inicio) ? campos.categorias_inicio : 'prueba',
      temporada: campos.temporada === 'navidad' ? 'navidad' : 'normal',
    },
  };
}

const listaDeTexto = (t, defecto) => {
  const l = String(t ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return l.length ? l : [...defecto];
};

function aFiltros(campos) {
  const d = FILTROS_POR_DEFECTO;
  return {
    modo: ['si', 'no', 'prueba'].includes(campos.filtros_activo) ? campos.filtros_activo : d.modo,
    colores: listaDeTexto(campos.filtros_colores, d.colores),
    categorias: listaDeTexto(campos.filtros_categorias, d.categorias),
    tipos: listaDeTexto(campos.filtros_tipos, d.tipos),
    ordenar: siNo(campos.filtros_ordenar, d.ordenar),
    columnas: numero(campos.filtros_columnas, d.columnas),
    cajon: ['si', 'no', 'prueba'].includes(campos.filtros_cajon) ? campos.filtros_cajon : d.cajon,
    precio: ['si', 'no', 'prueba'].includes(campos.filtros_precio) ? campos.filtros_precio : d.precio,
    portada: ['si', 'no', 'prueba'].includes(campos.colecciones_portada) ? campos.colecciones_portada : d.portada,
  };
}

/* `presentes`: los campos que la tienda ya tiene. Uno que aún no se creó
 * («Crear lo que falta») no se manda, para que guardar no falle por él. */
export async function guardarInicio(v) {
  return guardarCampos([
    { key: 'categorias_inicio', value: v.modo },
    { key: 'temporada', value: v.temporada },
  ]);
}

export async function guardarMenu(modo) {
  return guardarCampos([{ key: 'menu_tarjetas', value: modo }]);
}

export async function guardarFiltrosConfig(f, presentes = null) {
  return guardarCampos([
    { key: 'filtros_activo', value: f.modo },
    { key: 'filtros_colores', value: f.colores.join(', ') },
    { key: 'filtros_categorias', value: f.categorias.join(', ') },
    { key: 'filtros_tipos', value: f.tipos.join(', ') },
    { key: 'filtros_ordenar', value: f.ordenar ? 'si' : 'no' },
    { key: 'filtros_columnas', value: String(f.columnas) },
    { key: 'filtros_cajon', value: f.cajon || 'prueba' },
    { key: 'filtros_precio', value: f.precio || 'prueba' },
    { key: 'colecciones_portada', value: f.portada || 'si' },
  ].filter((c) => !presentes || presentes.has(c.key)));
}

function aTransicion(campos) {
  const d = TRANSICION_POR_DEFECTO;
  return {
    modo: ['si', 'no', 'prueba'].includes(campos.trans_activo) ? campos.trans_activo : d.modo,
    color: campos.trans_color || d.color,
    grosor: numero(campos.trans_grosor, d.grosor),
    fundido: numero(campos.trans_fundido, d.fundido),
    precarga: siNo(campos.trans_precarga, d.precarga),
  };
}

export async function guardarTransicion(t) {
  const r = await gql(GUARDAR, {
    handle: { type: TIPO_CONFIG, handle: HANDLE },
    metaobject: {
      fields: [
    { key: 'trans_activo', value: t.modo },
    { key: 'trans_color', value: t.color },
    { key: 'trans_grosor', value: String(t.grosor) },
    { key: 'trans_fundido', value: String(t.fundido) },
    { key: 'trans_precarga', value: t.precarga ? 'si' : 'no' },
      ],
    },
  });
  return comprobarErrores(r, 'metaobjectUpsert');
}

function siNo(valor, defecto) {
  if (valor === 'si') return true;
  if (valor === 'no') return false;
  return defecto;
}

function aDescuento(campos) {
  const d = DESCUENTO_POR_DEFECTO;
  const modo = ['si', 'no', 'prueba'].includes(campos.desc_activo) ? campos.desc_activo : d.modo;
  return {
    modo,
    tarjetas: siNo(campos.desc_tarjetas, d.tarjetas),
    foto: siNo(campos.desc_foto, d.foto),
    precio: siNo(campos.desc_precio, d.precio),
    formato: FORMATOS_DESCUENTO.some((f) => f.valor === campos.desc_formato) ? campos.desc_formato : d.formato,
    fondo: campos.desc_fondo || d.fondo,
    texto: campos.desc_texto || d.texto,
    radio: numero(campos.desc_radio, d.radio),
    precioLetra: numero(campos.desc_precio_letra, d.precioLetra),
    letra: numero(campos.desc_letra, d.letra),
    precioColores: siNo(campos.precio_colores, d.precioColores),
    oferta: campos.precio_oferta || d.oferta,
    tachado: campos.precio_tachado || d.tachado,
    fotoCompu: campos.desc_foto_compu === 'todas' ? 'todas' : d.fotoCompu,
  };
}

/* `presentes`: los campos que tiene hoy la definicion. Los dos de tamano son
 * nuevos; mientras no se anadan (tarjeta de pendientes), guardar el resto no
 * debe fallar por ellos. */
export async function guardarDescuento(d, presentes = null) {
  /* Los colores de los precios viven en sv_configuracion_2: guardarCampos
   * manda cada clave a su definición. */
  return guardarCampos([
    { key: 'desc_activo', value: d.modo },
    { key: 'desc_tarjetas', value: d.tarjetas ? 'si' : 'no' },
    { key: 'desc_foto', value: d.foto ? 'si' : 'no' },
    { key: 'desc_precio', value: d.precio ? 'si' : 'no' },
    { key: 'desc_formato', value: d.formato },
    { key: 'desc_fondo', value: d.fondo },
    { key: 'desc_texto', value: d.texto },
    { key: 'desc_radio', value: String(d.radio) },
    { key: 'desc_precio_letra', value: String(d.precioLetra) },
    { key: 'desc_letra', value: String(d.letra) },
    { key: 'precio_colores', value: d.precioColores ? 'si' : 'no' },
    { key: 'precio_oferta', value: d.oferta },
    { key: 'precio_tachado', value: d.tachado },
    { key: 'desc_foto_compu', value: d.fotoCompu },
  ].filter((f) => !presentes || presentes.has(f.key)));
}

/* Cuántos productos activos tienen hoy precio tachado por encima del precio:
 * son los que van a llevar descuento. Es solo para decirlo en la pantalla. */
const CON_DESCUENTO = `
  query ConDescuento($cursor: String) {
    products(first: 250, after: $cursor, query: "status:active") {
      pageInfo { hasNextPage endCursor }
      nodes {
        compareAtPriceRange { maxVariantCompareAtPrice { amount } }
        priceRangeV2 { minVariantPrice { amount } }
      }
    }
  }
`;

export async function contarConDescuento() {
  let cursor = null;
  let total = 0;
  let con = 0;
  for (let vuelta = 0; vuelta < 20; vuelta += 1) {
    const d = await gql(CON_DESCUENTO, { cursor });
    for (const p of d.products.nodes) {
      total += 1;
      const antes = Number(p.compareAtPriceRange?.maxVariantCompareAtPrice?.amount ?? 0);
      const ahora = Number(p.priceRangeV2?.minVariantPrice?.amount ?? 0);
      if (antes > ahora && ahora > 0) con += 1;
    }
    if (!d.products.pageInfo.hasNextPage) break;
    cursor = d.products.pageInfo.endCursor;
  }
  return { total, con };
}

/* Un numero que puede valer 0 no se lee con `||`. Y una entrada vieja sin el
 * campo tiene que leerse con el valor de fabrica, no con cero. */
function numero(valor, defecto) {
  /* null tambien: un campo creado pero nunca rellenado llega asi, y sin esto
   * toda la pildora se leeria con ceros en vez de con sus valores de fabrica. */
  if (valor === '' || valor === undefined || valor === null) return defecto;
  const n = Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

function aPildora(campos) {
  const d = PILDORA_POR_DEFECTO;
  return {
    activo: campos.foto_activo ? campos.foto_activo === 'si' : d.activo,
    esquina: campos.foto_esquina || d.esquina,
    cuantas: numero(campos.foto_cuantas, d.cuantas),
    fondo: campos.foto_fondo || d.fondo,
    texto: campos.foto_texto || d.texto,
    borde: campos.foto_borde || d.borde,
    grosor: numero(campos.foto_grosor, d.grosor),
    opacidad: numero(campos.foto_opacidad, d.opacidad),
    radio: numero(campos.foto_radio, d.radio),
    letra: numero(campos.foto_letra, d.letra),
    margen: numero(campos.foto_margen, d.margen),
  };
}

export async function guardarPildora(p) {
  const r = await gql(GUARDAR, {
    handle: { type: TIPO_CONFIG, handle: HANDLE },
    metaobject: {
      fields: [
        { key: 'foto_activo', value: p.activo ? 'si' : 'no' },
        { key: 'foto_esquina', value: p.esquina },
        { key: 'foto_cuantas', value: String(p.cuantas) },
        { key: 'foto_fondo', value: p.fondo },
        { key: 'foto_texto', value: p.texto },
        { key: 'foto_borde', value: p.borde },
        { key: 'foto_grosor', value: String(p.grosor) },
        { key: 'foto_opacidad', value: String(p.opacidad) },
        { key: 'foto_radio', value: String(p.radio) },
        { key: 'foto_letra', value: String(p.letra) },
        { key: 'foto_margen', value: String(p.margen) },
      ],
    },
  });
  return comprobarErrores(r, 'metaobjectUpsert');
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
