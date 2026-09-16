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

/* Devuelve `data`, o lanza con el detalle util. GraphQL responde 200 aunque
 * haya fallado, y ademas cada mutacion trae sus propios userErrors, asi que hay
 * que mirar en tres sitios distintos antes de dar algo por bueno. */
export async function gql(query, variables = {}) {
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
    throw new ErrorApi(cuerpo.errors[0].message, cuerpo.errors);
  }

  return cuerpo.data;
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
