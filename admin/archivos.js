/* Saint Venik · Subir archivos a Shopify desde el navegador, sin servidor.
 *
 * El flujo es: stagedUploadsCreate pide un destino temporal, se sube el archivo
 * a ese destino, y fileCreate lo registra en la biblioteca de la tienda.
 *
 * La pieza fragil es la del medio. Shopify devuelve un destino que normalmente
 * es un bucket con CORS abierto, pero puede devolver uno del propio dominio de
 * la tienda que NO manda cabeceras CORS: desde el navegador eso falla con un
 * "Failed to fetch" sin codigo ni cuerpo, imposible de diagnosticar a ciegas.
 * Por eso se comprueba el host ANTES de intentarlo y, si no es de los conocidos,
 * se explica que paso en vez de dejar un error mudo.
 */
import { gql, comprobarErrores } from './api.js?v=202609170212';

const HOSTS_CON_CORS = /(storage\.googleapis\.com|s3\.amazonaws\.com)$/;

const DESTINO = `
  mutation Destino($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }
`;

const REGISTRAR = `
  mutation Registrar($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
        ... on MediaImage { image { url } }
        ... on GenericFile { url }
      }
      userErrors { field message code }
    }
  }
`;

const ESTADO = `
  query EstadoArchivo($id: ID!) {
    node(id: $id) {
      ... on MediaImage { id fileStatus image { url } }
      ... on GenericFile { id fileStatus url }
    }
  }
`;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* Shopify procesa los archivos de forma asincrona: recien subido todavia no
 * tiene URL, y guardarlo asi deja una muestra en blanco. */
async function esperarListo(id, intentos = 25) {
  for (let i = 0; i < intentos; i++) {
    const { node } = await gql(ESTADO, { id });
    if (node?.fileStatus === 'READY') return node;
    if (node?.fileStatus === 'FAILED') throw new Error('Shopify no pudo procesar el archivo.');
    await espera(1000);
  }
  throw new Error('El archivo tarda más de lo normal en procesarse. Recarga en un momento.');
}

export async function subirArchivo(file, { onPaso = () => {} } = {}) {
  const esImagen = file.type.startsWith('image/');

  onPaso('Pidiendo destino…');
  const d1 = await gql(DESTINO, {
    input: [{
      filename: file.name,
      mimeType: file.type,
      resource: esImagen ? 'IMAGE' : 'FILE',
      httpMethod: 'POST',
      fileSize: String(file.size),
    }],
  });
  const destino = comprobarErrores(d1, 'stagedUploadsCreate').stagedTargets[0];
  if (!destino) throw new Error('Shopify no devolvió un destino para subir el archivo.');

  const host = new URL(destino.url).host;
  if (!HOSTS_CON_CORS.test(host)) {
    throw new Error(
      `Shopify devolvió un destino que no admite subidas desde el navegador (${host}). ` +
      'Sube el archivo en Contenido → Archivos y luego elígelo con "Elegir de la biblioteca".'
    );
  }

  onPaso('Subiendo…');
  const formulario = new FormData();
  for (const p of destino.parameters) formulario.append(p.name, p.value);
  formulario.append('file', file);   // el archivo va el último, después de los parámetros

  let respuesta;
  try {
    /* Sin cabeceras propias: así es una petición simple y no hay preflight. */
    respuesta = await fetch(destino.url, { method: 'POST', body: formulario });
  } catch (causa) {
    throw new Error(`El navegador no pudo subir a ${host}. Probablemente CORS. Detalle: ${causa.message}`);
  }
  if (!respuesta.ok) {
    throw new Error(`${host} rechazó la subida (HTTP ${respuesta.status}).`);
  }

  onPaso('Registrando…');
  const d2 = await gql(REGISTRAR, {
    files: [{
      originalSource: destino.resourceUrl,
      contentType: esImagen ? 'IMAGE' : 'FILE',
      filename: file.name,
      alt: file.name,
    }],
  });
  const creado = comprobarErrores(d2, 'fileCreate').files[0];

  onPaso('Procesando…');
  const listo = await esperarListo(creado.id);

  return { id: listo.id, url: listo.image?.url ?? listo.url ?? null };
}

/* La otra via: el selector de archivos del propio admin. No depende de CORS
 * porque la subida, si la hay, ocurre dentro de Shopify. */
export function hayBiblioteca() {
  return Boolean(window.shopify?.intents?.invoke);
}

export async function elegirDeBiblioteca({ tipo = 'MediaImage' } = {}) {
  if (!hayBiblioteca()) throw new Error('Tu versión del admin no ofrece el selector de archivos.');

  const actividad = await window.shopify.intents.invoke('pick:shopify/File', {
    data: { mediaTypes: [tipo], multiSelect: false },
  });
  const res = await actividad.complete;

  if (res.code === 'closed') return null;
  if (res.code !== 'ok') throw new Error('El selector de archivos devolvió un error.');

  const id = res.data?.ids?.[0];
  if (!id) return null;

  const listo = await esperarListo(id);
  return { id: listo.id, url: listo.image?.url ?? listo.url ?? null };
}

/* Copia a esta tienda un archivo que ya esta publicado en otra URL, por ejemplo
 * en la otra tienda. Lo descarga Shopify, no el navegador: no hay CORS y no
 * hace falta tener el archivo a mano. */
export async function copiarArchivo(url, { imagen = true } = {}) {
  const absoluta = url.startsWith('//') ? `https:${url}` : url;
  const nombre = decodeURIComponent(new URL(absoluta).pathname.split('/').pop() || 'archivo');

  const d = await gql(REGISTRAR, {
    files: [{
      originalSource: absoluta,
      contentType: imagen ? 'IMAGE' : 'FILE',
      filename: nombre,
      alt: nombre,
    }],
  });
  const creado = comprobarErrores(d, 'fileCreate').files[0];
  const listo = await esperarListo(creado.id);
  return { id: listo.id, url: listo.image?.url ?? listo.url ?? null };
}
