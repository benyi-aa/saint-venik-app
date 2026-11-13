/* Saint Venik · Textos en inglés de saintvenik.com/en (13-nov).
 *
 * Tres diccionarios español → inglés que hasta ahora vivían fijos en el código, y que
 * desde aquí se editan en el panel (pestaña «Inglés»):
 *
 * - `tres`: el «Arma tu 3x2». Lo usa el snippet `sv3-t` del tema de .com, en el servidor.
 *   La clave es el texto en español tal como está en el editor del tema (sin saltos de
 *   línea); el inglés puede llevar saltos de línea.
 * - `popup`: el popup de descuento de Klaviyo. Lo usa `sv-idioma.js` de la extensión.
 * - `filtros`: nombres y valores del menú «Filter» (Categoría, Dorado…). Lo usa
 *   `sv-filtros.js`; se compara sin mayúsculas.
 *
 * Se guardan en el metaobjeto `sv_ingles` (una sola entrada, handle `textos`), un campo
 * JSON por diccionario. Lo que NO está en el metaobjeto se sigue traduciendo con el
 * diccionario fijo de cada archivo (que es el mismo de aquí abajo): guardar desde el
 * panel nunca deja algo sin traducir.
 */
import { gql, comprobarErrores, capacidadActiva } from './api.js?v=202611132011';
import { faltaEstructura, asegurarEstructura } from './asignacion.js?v=202611132011';

export const TIPO_INGLES = 'sv_ingles';
const HANDLE = 'textos';

const CAMPOS_INGLES = [
  { key: 'nombre', name: 'Nombre', type: 'single_line_text_field', required: true },
  { key: 'tres', name: '3x2 (Arma tu 3x2)', type: 'json' },
  { key: 'popup', name: 'Popup de descuento (Klaviyo)', type: 'json' },
  { key: 'filtros', name: 'Menú Filter', type: 'json' },
];

export const GRUPOS = [
  { clave: 'tres', titulo: 'Arma tu 3x2', ayuda: 'Los textos de la página «Arma tu 3x2». A la izquierda, el texto en español tal como está en el editor del tema; a la derecha, cómo se ve en /en. Si cambias un texto en español en el editor, agrega aquí una fila con el texto nuevo.' },
  { clave: 'popup', titulo: 'Popup de descuento (Klaviyo)', ayuda: 'Las tres pantallas del popup «Desbloqueaste un descuento extra». Si se cambia el texto del popup en Klaviyo, agrega aquí la línea nueva.' },
  { clave: 'filtros', titulo: 'Menú «Filter» de las colecciones', ayuda: 'Los nombres (Categoría, Tipo) y valores (Dorado, Cadenas…) de los filtros de la app. No importan las mayúsculas.' },
];

/* Los diccionarios fijos de hoy (copiados de sv3-t.liquid, sv-idioma.js y sv-filtros.js). */
export const BASE = {
  tres: {
  "4.87/5 · +50.000 clientes": "4.87/5 · 50,000+ customers",
  "Elige 3.Paga 2.": "Pick 3.\nPay for 2.",
  "Una de las joyas va por nuestra cuenta.": "One of the pieces is on us.",
  "Armar mi 3x2": "Build my 3 for 2",
  "Oferta por tiempo limitado · Garantía Eterna": "Limited-time offer · Lifetime Warranty",
  "Oro 18k": "18K Gold",
  "No se destiñe": "Won't tarnish",
  "Hipoalergénico": "Hypoallergenic",
  "Garantía Eterna": "Lifetime Warranty",
  "Últimas horas del 3x2": "Final hours of the 3 for 2",
  "Elige 3 joyas y una va por nuestra cuenta": "Pick 3 pieces and one is on us",
  "Agrega {n} más y una es gratis": "Add {n} more and one is free",
  "¡Solo 1 más y una es gratis!": "Just 1 more and one is free!",
  "¡Listo! Una joya va por nuestra cuenta": "Done! One piece is on us",
  "Envío gratis sobre $80.000": "Free shipping over $80",
  "Te faltan {monto} para envío gratis": "You're {monto} away from free shipping",
  "✓ Tienes envío gratis": "✓ You've got free shipping",
  "Más de 50.000 hombres en todo Chile ya llevan Saint Venik": "More than 50,000 men already wear Saint Venik",
  "Garantía Eterna · Apto para piel sensible": "Lifetime Warranty · Safe for sensitive skin",
  "3X2 en todo": "3 for 2 on everything",
  "Cada pieza incluye Garantía Eterna": "Every piece includes a Lifetime Warranty",
  "{n} joyas": "{n} pieces",
  "Ordenar": "Sort",
  "Más vendidos": "Best selling",
  "Precio: menor a mayor": "Price: low to high",
  "Precio: mayor a menor": "Price: high to low",
  "Añadir": "Add",
  "En tu 3x2": "In your 3 for 2",
  "Vista rápida": "Quick view",
  "Medida": "Size",
  "Oro": "Gold",
  "Plateado": "Silver",
  "Agotado": "Sold out",
  "Ahorra {n}%": "Save {n}%",
  "Añadir a mi 3x2": "Add to my 3 for 2",
  "Descripción": "Description",
  "Ver ficha completa": "View full details",
  "Guía de tallas": "Size guide",
  "No pudimos agregar las joyas. Intenta de nuevo.": "We couldn't add the pieces. Please try again.",
  "No pudimos cargar esta colección. Intenta de nuevo.": "We couldn't load this collection. Please try again.",
  "No hay joyas disponibles en esta colección.": "No pieces available in this collection.",
  "Elige 3 joyas": "Pick 3 pieces",
  "Escoge color y medida": "Choose color and size",
  "Paga 2: una va por nuestra cuenta": "Pay for 2: one is on us",
  "Cadenas": "Chains",
  "Anillos": "Rings",
  "Pulseras": "Bracelets",
  "Colgantes": "Pendants",
  "Conjuntos": "Sets",
  "Total": "Total",
  "Elige {n} más": "Pick {n} more",
  "Ir a pagar": "Checkout",
  "GRATIS": "FREE",
  "+50.000 clientes": "50,000+ customers",
  "Tienes envío gratis": "You've got free shipping",
  "Garantía Eterna incluida": "Lifetime Warranty included",
  "Quitar": "Remove",
  "Agregando…": "Adding…",
  "Añadida ({n}/3)": "Added ({n}/3)",
  "¡Listo! Una de tus joyas va por nuestra cuenta.": "Done! One of your pieces is on us.",
  "Ya elegiste tus 3. Quita una para cambiarla.": "You've already picked 3. Remove one to swap it.",
  "Qué incluye tu 3x2": "What's included in your 3 for 2",
  "3 joyas, pagas 2": "3 pieces, pay for 2",
  "Una de las tres va por nuestra cuenta.": "One of the three is on us.",
  "Envío gratis": "Free shipping",
  "Cada pieza, respaldada para siempre.": "Every piece, backed forever.",
  "Apto para piel sensible": "Safe for sensitive skin",
  "Hipoalergénico y no se destiñe.": "Hypoallergenic and won't tarnish.",
  "Resistente al agua": "Water resistant",
  "Al agua, al sudor y al calor.": "Water, sweat and heat.",
  "Lo que dicen quienes ya lo llevan": "What our customers say",
  "Compra verificada": "Verified purchase",
  "Cadena Cuban Link Oro 8mm": "Cuban Link Chain 8mm (Gold)",
  "Pulsera Black Clover Oro": "Black Clover Bracelet (Gold)",
  "Desde que la uso, no he parado de tener cumplidos. Excelente calidad y versátil para todo momento.": "Ever since I started wearing it, I haven't stopped getting compliments. Excellent quality and versatile for any occasion.",
  "Al principio me compré una y ya llevo como 6. Sabía que me volvería adicto a estas joyas. Lo que más me gusta es el brillo y las terminaciones. Además todas las joyas tanto los collares como las pulseras combinan muy bien entre sí pero sin llegar a verse exagerado.": "I bought one at first and now I'm on about 6. I knew I'd get hooked on these pieces. What I like most is the shine and the finish. Plus, all of them, necklaces and bracelets alike, pair really well together without ever looking over the top.",
  "Así lo llevan": "How they wear it",
  "+50.000 clientes en todo Chile": "50,000+ happy customers",
  "Oferta por tiempo limitado": "Limited-time offer",
  "Tres joyas.Una va por nuestra cuenta.": "Three pieces.\nOne is on us.",
  "Eliges 3 joyas y la de menor valor va por nuestra cuenta. El descuento se aplica solo al pagar.": "Pick 3 pieces and the lowest-priced one is on us. The discount applies automatically at checkout."
},
  popup: {
  "DESBLOQUEASTE UN": "YOU UNLOCKED AN",
  "DESCUENTO": "EXTRA",
  "EXTRA": "DISCOUNT",
  "RECLAMAR DESCUENTO": "CLAIM DISCOUNT",
  "Prefiero pagar el precio completo.": "I’d rather pay full price.",
  "Desbloqueaste un": "You unlocked an",
  "DESCUENTO EXTRA": "EXTRA DISCOUNT",
  "Ingresa el correo electrónico al que deseas recibirlo": "Enter the email where you’d like to receive it",
  "Ingresa el correo electrónico": "Enter the email address",
  "al que deseas recibirlo": "where you’d like to receive it",
  "Tu correo aquí.": "Your email here.",
  "¡RECLAMAR DESCUENTO!": "CLAIM DISCOUNT!",
  "Dirección inválida": "Invalid email address",
  "LISTO, ¡YA LO TIENES!": "DONE, IT’S YOURS!",
  "Tu código de descuento ya fue enviado al correo electrónico que acabas de ingresar. Podría tardar uno o dos minutos en llegar.": "Your discount code has been sent to the email you just entered. It may take a minute or two to arrive.",
  "SEGUIR COMPRANDO": "KEEP SHOPPING"
},
  filtros: {
  "Categoría": "Category",
  "Tipo": "Type",
  "Dorado": "Gold",
  "Plateado": "Silver",
  "Anillos": "Rings",
  "Cadenas": "Chains",
  "Colgantes": "Pendants",
  "Pulseras": "Bracelets",
  "Conjuntos": "Sets",
  "Lentes": "Sunglasses",
  "Brillantes": "Iced",
  "Cubanas": "Cuban",
  "Perlas": "Pearls",
  "Tenis": "Tennis"
},
};

const LEER = `
  query Ingles($type: String!) {
    metaobjects(type: $type, first: 1) { nodes { id handle fields { key value } } }
  }
`;

const GUARDAR = `
  mutation GuardarIngles($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message code }
    }
  }
`;

function objeto(valor) {
  try {
    const o = JSON.parse(valor || 'null');
    return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
  } catch (error) {
    return null;
  }
}

/* Devuelve los tres diccionarios tal como se ven en la tienda: lo guardado encima de
 * lo fijo. `guardado` dice si ya hay una entrada en Shopify. */
export async function cargarIngles() {
  let entrada = null;
  try {
    const d = await gql(LEER, { type: TIPO_INGLES }, { sinMemoria: true });
    entrada = d.metaobjects?.nodes?.[0] ?? null;
  } catch (error) {
    entrada = null;
  }
  const campo = (k) => entrada?.fields.find((f) => f.key === k)?.value ?? '';
  const datos = {};
  for (const g of GRUPOS) {
    datos[g.clave] = { ...BASE[g.clave], ...(objeto(campo(g.clave)) ?? {}) };
  }
  return { datos, guardado: Boolean(entrada) };
}

export async function faltaEstructuraIngles() {
  return faltaEstructura(TIPO_INGLES, CAMPOS_INGLES, 'los textos en inglés');
}

export async function guardarIngles(datos) {
  await asegurarEstructura(TIPO_INGLES, CAMPOS_INGLES, 'Textos en inglés (Panel Saint Venik)');
  const metaobject = {
    fields: [
      { key: 'nombre', value: 'Textos en inglés' },
      ...GRUPOS.map((g) => ({ key: g.clave, value: JSON.stringify(datos[g.clave] ?? {}) })),
    ],
  };
  const capabilities = await capacidadActiva(TIPO_INGLES);
  if (capabilities) metaobject.capabilities = capabilities;
  const r = await gql(GUARDAR, { handle: { type: TIPO_INGLES, handle: HANDLE }, metaobject });
  return comprobarErrores(r, 'metaobjectUpsert');
}

const TIENDA = `query TiendaIngles { shop { currencyCode primaryDomain { url } } }`;

/* La dirección pública de la tienda (saintvenik.com) y si tiene inglés. */
export async function datosTienda() {
  const d = await gql(TIENDA);
  return { url: d.shop.primaryDomain?.url ?? '', conIngles: d.shop.currencyCode !== 'CLP' };
}
