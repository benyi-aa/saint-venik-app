#!/usr/bin/env node
/* Sella una version en las URLs del panel.
 *
 * GitHub Pages sirve con cache-control: max-age=600, y el navegador tiene
 * derecho a quedarse diez minutos con la version anterior. Dentro del iframe
 * del admin no hay forma comoda de forzar una recarga dura, asi que la version
 * va en la URL: cambia la URL, cambia la entrada de cache.
 *
 * Sin paso de compilacion: esto solo reescribe cadenas.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sello = process.argv[2] ?? new Date().toISOString().replace(/\D/g, '').slice(0, 12);
const dir = 'admin';

let tocados = 0;

for (const nombre of readdirSync(dir)) {
  if (!nombre.endsWith('.js') && !nombre.endsWith('.html')) continue;
  const ruta = join(dir, nombre);
  const antes = readFileSync(ruta, 'utf8');

  const despues = antes
    // imports entre modulos del panel
    .replace(/from '\.\/([\w.-]+\.js)(\?v=[\w.-]+)?'/g, `from './$1?v=${sello}'`)
    // el <script> de entrada y la hoja de estilos
    .replace(/src="\.\/([\w.-]+\.js)(\?v=[\w.-]+)?"/g, `src="./$1?v=${sello}"`)
    .replace(/href="\.\/([\w.-]+\.css)(\?v=[\w.-]+)?"/g, `href="./$1?v=${sello}"`);

  if (despues !== antes) {
    writeFileSync(ruta, despues);
    tocados++;
  }
}

console.log(`versión ${sello} · ${tocados} archivos sellados`);
