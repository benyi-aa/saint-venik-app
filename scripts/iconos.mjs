#!/usr/bin/env node
/* Genera admin/iconos.js a partir del snippet de la extension.
 *
 * El original es extensions/saint-venik/snippets/sv-icono.liquid, porque es lo
 * que ve el cliente. El panel necesita los mismos trazos para que elegir un
 * icono enseñe lo que de verdad se va a pintar, y Liquid no se puede importar
 * desde JavaScript. Generarlo quita la unica forma de que se separen.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SNIPPET = 'extensions/saint-venik/snippets/sv-icono.liquid';
const SALIDA = 'admin/iconos.js';

/* Lo unico que no esta en el snippet: como se llama cada icono en el panel.
 * Va aqui y no en el Liquid porque el cliente no lee estos rotulos. */
const ROTULOS = {
  agua: 'Gota · resistente al agua',
  garantia: 'Escudo · garantía',
  hipoalergenico: 'Hoja · hipoalergénico',
  'joyeria-fina': 'Gema · joyería fina',
  cambios: 'Flechas · cambios y devoluciones',
  envio: 'Camión · envío',
  'hecho-a-mano': 'Mano · hecho a mano',
  acero: 'Tuerca · acero inoxidable',
  caja: 'Caja · embalaje',
  premium: 'Estrella · premium',
  oro: 'Anillo · baño de oro',
  rapido: 'Reloj · envío rápido',
};

export function leerIconos(texto) {
  const trozos = texto.split(/\{%-\s*when\s*'([a-z-]+)'\s*-%\}/);
  const iconos = [];
  for (let i = 1; i < trozos.length; i += 2) {
    const clave = trozos[i];
    const trazo = trozos[i + 1]
      .split(/\{%-\s*endcase/)[0]
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ');
    iconos.push({ clave, trazo });
  }
  return iconos;
}

function generar() {
  const iconos = leerIconos(readFileSync(SNIPPET, 'utf8'));

  const sinRotulo = iconos.filter((i) => !ROTULOS[i.clave]).map((i) => i.clave);
  if (sinRotulo.length) {
    console.error(`✗ Iconos sin rótulo en scripts/iconos.mjs: ${sinRotulo.join(', ')}`);
    process.exit(1);
  }

  const cuerpo = iconos.map((i) => (
    `  {\n    clave: '${i.clave}',\n    rotulo: '${ROTULOS[i.clave]}',\n    trazo: '${i.trazo}',\n  },`
  )).join('\n');

  const js = `/* Saint Venik · Los iconos de los beneficios, para el panel.
 *
 * Este archivo lo genera scripts/iconos.mjs a partir de
 * extensions/saint-venik/snippets/sv-icono.liquid, que es el original: la
 * tienda no puede leer un .js, y tener los trazos escritos dos veces a mano
 * termina siempre igual, con el panel enseñando un icono y la ficha pintando
 * otro. No lo edites: edita el snippet y vuelve a generarlo.
 *
 *   npm run iconos
 *
 * \`npm run revisar\` comprueba que las dos listas sigan diciendo lo mismo.
 */

export const ICONOS = [
${cuerpo}
];

/* El panel dibuja el mismo SVG que la tienda: mismo viewBox, mismo trazo. */
export function svgIcono(clave, clase = 'icono') {
  const icono = ICONOS.find((i) => i.clave === clave);
  if (!icono) return '';
  return \`<svg class="\${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">\${icono.trazo}</svg>\`;
}

export function rotuloDe(clave) {
  return ICONOS.find((i) => i.clave === clave)?.rotulo ?? '';
}
`;

  writeFileSync(SALIDA, js);
  console.log(`✓ ${SALIDA} · ${iconos.length} iconos`);
}

if (process.argv[1] && process.argv[1].endsWith('iconos.mjs')) generar();
