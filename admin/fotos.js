/* Saint Venik · Pestaña «Fotos»: las fotos de temporada que usa la tienda, para
 * cambiarlas sin tocar código (pedido del usuario, 10-nov).
 *
 * Cada foto es un archivo de Contenido → Archivos con un nombre fijo, y el tema,
 * la extensión y los metacampos la piden por ese nombre. Cambiar una foto aquí
 * es cambiar el contenido de ese mismo archivo (mismo id, mismo nombre), así
 * que se actualiza en todos lados a la vez. Para que el nombre no cambie, la
 * foto nueva se pasa a JPG en el navegador antes de subirla. */
import { gql } from './api.js?v=202611101956';
import {
  subirAlDestino, reemplazarArchivo, crearConNombre, elegirDeBiblioteca, hayBiblioteca,
} from './archivos.js?v=202611101956';

/* Las colecciones con banner propio, con su clave en el nombre del archivo. */
const BANNERS = [['cadena', 'Cadenas'], ['pulsera', 'Pulseras'], ['anillos', 'Anillos'], ['colgantes', 'Colgantes'],
  ['conjuntos', 'Conjuntos'], ['essentials', 'Essentials'], ['bestsellers', 'Best Sellers']];

/* Las fotos de una temporada que no es Normal: sv-<clave>-<colección>.jpg en el
 * inicio, sv-<clave>-portada-<k>.jpg en los banners (y -movil). Las que falten
 * se ven como en Normal. Navidad además tiene la foto del regalo. */
function gruposDeTemporada(clave, nombre) {
  const g = [
    {
      titulo: `${nombre} · Inicio`,
      texto: `Las cuatro tarjetas de colecciones del inicio (y del carrito vacío) cuando la temporada es ${nombre}. Cuadradas, la joya al centro. Si falta una, se ve la normal.`,
      forma: [1, 1],
      fotos: [['cadenas', 'Cadenas'], ['pulseras', 'Pulseras'], ['colgantes', 'Colgantes'], ['anillos', 'Anillos']]
        .map(([h, t]) => [`sv-${clave}-${h}.jpg`, t]),
    },
    {
      titulo: `${nombre} · Banners de colección (computador)`,
      texto: 'Franja ancha arriba de cada colección. El título va a la izquierda: la joya, de la mitad hacia la derecha y a media altura (se ve una franja, no la foto entera). Formato 21:9. Si falta una, se ve la normal.',
      forma: [21, 9],
      fotos: BANNERS.map(([k, t]) => [`sv-${clave}-portada-${k}.jpg`, t]),
    },
    {
      titulo: `${nombre} · Banners de colección (teléfono)`,
      texto: 'La versión del teléfono de cada banner. El título va abajo y al centro, encima de la foto: la joya al centro y en la mitad de arriba. Formato 2,4:1 (por ejemplo 2400 × 1000). Si falta, se usa la del computador.',
      forma: [12, 5],
      fotos: BANNERS.map(([k, t]) => [`sv-${clave}-portada-${k}-movil.jpg`, t]),
    },
  ];
  if (clave === 'navidad') {
    g.push({
      titulo: 'Navidad · «El regalo Nº1 para él»',
      texto: 'La foto de la sección de regalo del inicio. Cuadrada; en el computador se funde por la izquierda con el fondo burdeo, así que lo importante va al centro y a la derecha.',
      forma: [1, 1],
      fotos: [['sv-regalo-navidad.jpg', 'Regalo Nº1']],
    });
  }
  return g;
}

const NORMAL = [
  {
    titulo: 'Inicio · Colecciones',
    texto: 'Las cuatro tarjetas de colecciones del inicio (y el carrito vacío). Cuadradas, la joya al centro.',
    forma: [1, 1],
    fotos: [['sv-inicio-cadenas.jpg', 'Cadenas'], ['sv-inicio-pulseras.jpg', 'Pulseras'],
      ['sv-inicio-colgantes.jpg', 'Colgantes'], ['sv-inicio-anillos.jpg', 'Anillos']],
  },
  {
    titulo: 'Inicio · «Tu cadena de cada día»',
    texto: 'Computador: horizontal, la cadena de la mitad hacia la derecha (el texto va a la izquierda). Teléfono: cuadrada, la cadena arriba (el texto va abajo). Sale en todas las temporadas.',
    forma: [16, 9],
    fotos: [['sv-inicio-cadena-dia.jpg', 'Computador'], ['sv-inicio-cadena-dia-movil.jpg', 'Teléfono', [1, 1]]],
  },
  {
    titulo: 'Banners de colección',
    texto: 'Computador: franja ancha con el título a la izquierda. Best Sellers tiene la suya; las demás son las fotos de cada colección. Las «teléfono» van con la joya arriba y al centro.',
    forma: [16, 9],
    fotos: [['coleccion_cadena.jpg', 'Cadenas'], ['coleccion_pulsera.jpg', 'Pulseras'], ['coleccion_anillos.jpg', 'Anillos'],
      ['coleccion_colgantes.jpg', 'Colgantes'], ['coleccion_conjuntos.jpg', 'Conjuntos'], ['coleccion_essentials.jpg', 'Essentials'],
      ['sv-portada-bestsellers.jpg', 'Best Sellers'], ['sv-portada-bestsellers-movil.jpg', 'Best Sellers · teléfono', [21, 9]],
      ['sv-portada-movil-pulsera.jpg', 'Pulseras · teléfono', [21, 9]], ['sv-portada-movil-colgantes.jpg', 'Colgantes · teléfono', [21, 9]],
      ['sv-portada-movil-conjuntos.jpg', 'Conjuntos · teléfono', [21, 9]]],
  },
  {
    titulo: 'Menú del teléfono',
    texto: 'Las fotos de las tarjetas del menú desplegable. Cuadradas, en uso y con la joya al centro. Salen en todas las temporadas.',
    forma: [1, 1],
    fotos: [['sv-menu-best-sellers.jpg', 'Best Sellers'], ['sv-menu-essentials.jpg', 'Essentials'], ['sv-menu-anillos.jpg', 'Anillos'],
      ['sv-menu-colgantes.jpg', 'Colgantes'], ['sv-menu-pulseras.jpg', 'Pulseras'], ['sv-menu-cadenas.jpg', 'Cadenas'],
      ['sv-menu-conjuntos.jpg', 'Conjuntos']],
  },
];

/* Los grupos de fotos de una temporada. */
export function gruposDe(clave, nombre) {
  return clave === 'normal' ? NORMAL : gruposDeTemporada(clave, nombre);
}

const BUSCAR = `
  query FotosPorNombre($q: String!, $despues: String) {
    files(first: 100, query: $q, after: $despues) {
      nodes { id ... on MediaImage { image { url width height } } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const nombreDe = (url) => decodeURIComponent((url || '').split('?')[0].split('/').pop());

/* Los archivos de esos grupos, por nombre exacto: { nombre: {id, url, ancho, alto} }. */
export async function cargarFotos(grupos) {
  const nombres = grupos.flatMap((g) => g.fotos.map((f) => f[0]));
  const q = nombres.map((n) => `filename:${n}`).join(' OR ');
  const mapa = {};
  let despues = null;
  do {
    const { files } = await gql(BUSCAR, { q, despues }, { sinMemoria: true });
    for (const n of files.nodes) {
      const url = n.image?.url;
      const nombre = nombreDe(url);
      if (nombres.includes(nombre) && !mapa[nombre]) mapa[nombre] = { id: n.id, url, ancho: n.image.width, alto: n.image.height };
    }
    despues = files.pageInfo.hasNextPage ? files.pageInfo.endCursor : null;
  } while (despues);
  return mapa;
}

/* Pasa cualquier imagen (archivo del computador o URL de Archivos) a JPG con el
 * nombre pedido, hasta 3200 px de lado. */
async function aJpg(origen, nombre) {
  let blob = origen;
  if (typeof origen === 'string') {
    const r = await fetch(origen);
    if (!r.ok) throw new Error('No se pudo leer la foto elegida.');
    blob = await r.blob();
  }
  const bmp = await window.createImageBitmap(blob);
  const k = Math.min(1, 3200 / Math.max(bmp.width, bmp.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bmp.width * k);
  lienzo.height = Math.round(bmp.height * k);
  lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
  const jpg = await new Promise((listo) => lienzo.toBlob(listo, 'image/jpeg', 0.9));
  return { file: new File([jpg], nombre, { type: 'image/jpeg' }), ancho: lienzo.width, alto: lienzo.height };
}

/* Cambia la foto `nombre` por `origen` (File o URL). Si el archivo no existe, lo crea con ese nombre. */
export async function cambiarFoto(nombre, origen, actual, onPaso = () => {}) {
  onPaso('Preparando la foto…');
  const { file, ancho, alto } = await aJpg(origen, nombre);
  const { resourceUrl } = await subirAlDestino(file, onPaso);
  onPaso('Cambiando la foto en la tienda…');
  const r = actual?.id ? await reemplazarArchivo(actual.id, resourceUrl) : await crearConNombre(resourceUrl, nombre);
  return { ...r, ancho, alto };
}

export { elegirDeBiblioteca, hayBiblioteca };
