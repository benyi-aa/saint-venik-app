/* Saint Venik · Acceso a la Admin API de Shopify sin servidor.
 *
 * La app va embebida en el admin. App Bridge intercepta las peticiones a
 * `shopify:admin/api/graphql.json` y les pone la autenticacion de la sesion del
 * usuario, asi que no hace falta backend ni guardar ningun token.
 */

const VERSION_API = '2026-01';
const PUNTO = `shopify:admin/api/${VERSION_API}/graphql.json`;

export class ErrorApi extends Error {
  constructor(mensaje, detalles) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.detalles = detalles;
  }
}

/* Shopify limita las consultas con un cupo de puntos que se recarga poco a
 * poco. Una consulta que pide mas de lo que queda vuelve como THROTTLED, aunque
 * luego fuera a gastar menos. Recorrer el catalogo dos veces seguidas basta para
 * toparse con eso, asi que se espera lo justo para que se recargue y se
 * reintenta, en vez de romper la pantalla. */
const REINTENTOS = 5;
const ESPERA_MAXIMA = 10000;

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

function esperaPorCupo(coste) {
  const estado = coste?.throttleStatus;
  if (!estado) return 2000;
  const falta = Math.max(0, (coste.requestedQueryCost ?? 0) - estado.currentlyAvailable);
  const ms = Math.ceil((falta / (estado.restoreRate || 50)) * 1000) + 300;
  return Math.min(ESPERA_MAXIMA, ms);
}

/* Una misma pantalla pregunta varias veces por lo mismo: revisarEstructura
 * pedia la definicion de bloque_guia tres veces seguidas, y recalcular resolvia
 * la etiqueta "oro" una vez por cada beneficio. Son peticiones identicas, y en
 * Shopify cada una cuesta cupo: trece paginas de productos agotaban el balde de
 * 1000 puntos y a partir de ahi cada consulta volvia THROTTLED y se quedaba
 * esperando segundos.
 *
 * Mientras dura una pasada, las LECTURAS repetidas comparten la promesa. Solo
 * las lecturas: una mutacion nunca se memoriza, y la memoria muere al acabar,
 * asi que la siguiente pasada vuelve a preguntar. */
let memoria = null;

/* Solo para tramos CORTOS y sin interaccion de por medio: mientras la memoria
 * esta viva, cualquier lectura que ocurra en el mismo hueco queda memorizada,
 * aunque no sea de este tramo. Por eso el recalculo en segundo plano NO la
 * usa: tenia la memoria abierta durante segundos, y pulsar «Crear lo que
 * falta» en ese rato leia la foto de antes de crear los campos. */
export async function enUnaPasada(fn) {
  const mia = memoria === null;
  if (mia) memoria = new Map();
  try {
    return await fn();
  } finally {
    if (mia) memoria = null;
  }
}

/* Devuelve `data`, o lanza con el detalle util. GraphQL responde 200 aunque
 * haya fallado, y ademas cada mutacion trae sus propios userErrors, asi que hay
 * que mirar en tres sitios distintos antes de dar algo por bueno. */
export async function gql(query, variables = {}, opciones = {}) {
  /* Una escritura deja vieja cualquier lectura ya memorizada. */
  if (/\bmutation\b/.test(query)) {
    if (memoria) memoria.clear();
    return pedirConReintentos(query, variables);
  }

  const sePuedeMemorizar = memoria !== null && !opciones.sinMemoria;
  const clave = sePuedeMemorizar ? `${query}|${JSON.stringify(variables)}` : null;
  if (clave && memoria.has(clave)) return memoria.get(clave);

  const promesa = pedirConReintentos(query, variables);
  if (clave) {
    /* Una promesa rechazada no se guarda: si no, un THROTTLED pasajero tumbaria
     * de golpe a todos los que compartan esa consulta y no habria reintento. */
    const mapa = memoria;
    mapa.set(clave, promesa.catch((error) => { mapa.delete(clave); throw error; }));
    return mapa.get(clave);
  }
  return promesa;
}

async function pedirConReintentos(query, variables) {
  for (let intento = 0; ; intento += 1) {
    const { cuerpo, frenado } = await pedir(query, variables);
    if (!frenado) return cuerpo.data;
    if (intento >= REINTENTOS) {
      throw new ErrorApi('Shopify está limitando las consultas. Espera unos segundos y vuelve a intentarlo.', cuerpo.errors);
    }
    await esperar(esperaPorCupo(cuerpo.extensions?.cost));
  }
}

async function pedir(query, variables) {
  let respuesta;
  try {
    respuesta = await fetch(PUNTO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  } catch (causa) {
    throw new ErrorApi('No se pudo contactar con Shopify. ¿Estás viendo la app dentro del admin?', causa);
  }

  if (!respuesta.ok) {
    throw new ErrorApi(`Shopify respondió ${respuesta.status}`, await respuesta.text());
  }

  const cuerpo = await respuesta.json();

  if (cuerpo.errors?.length) {
    if (cuerpo.errors.some((e) => e.extensions?.code === 'THROTTLED')) {
      return { cuerpo, frenado: true };
    }
    throw new ErrorApi(cuerpo.errors[0].message, cuerpo.errors);
  }

  return { cuerpo, frenado: false };
}

/* Con los estados activo y borrador activados, una entrada creada sin decir
 * nada nace en borrador, y la tienda no la ve. Pedir ACTIVE en una definicion
 * que no los tiene falla con CAPABILITY_NOT_ENABLED, que ya nos paso con las
 * guias. Asi que se pregunta antes. */
const PUBLICABLE = `
  query Publicable($type: String!) {
    metaobjectDefinitionByType(type: $type) { capabilities { publishable { enabled } } }
  }
`;

export async function capacidadActiva(tipo) {
  const d = await gql(PUBLICABLE, { type: tipo });
  return d.metaobjectDefinitionByType?.capabilities?.publishable?.enabled
    ? { publishable: { status: 'ACTIVE' } }
    : undefined;
}

/* Las mutaciones de Shopify devuelven userErrors en vez de fallar. */
export function comprobarErrores(resultado, clave) {
  const errores = resultado?.[clave]?.userErrors ?? [];
  if (errores.length) {
    throw new ErrorApi(errores.map((e) => e.message).join(' · '), errores);
  }
  return resultado[clave];
}

export function estaEmbebida() {
  return window.top !== window.self;
}
