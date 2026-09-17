#!/usr/bin/env node
/* Busca referencias a nombres que no existen.
 *
 * Es la red para la clase de fallo que ya llegó dos veces al usuario: una
 * función borrada por accidente al reescribir un tramo del archivo, y un import
 * que no se insertó porque el reemplazo buscaba una línea que ya había cambiado.
 * Las dos rompían el panel entero, y las dos son invisibles para un chequeo de
 * sintaxis: el archivo parsea perfecto, el nombre simplemente no está.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const GLOBALES = new Set([
  'window', 'document', 'console', 'fetch', 'URL', 'URLSearchParams', 'FormData',
  'encodeURIComponent', 'decodeURIComponent',
  'JSON', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise',
  'Error', 'TypeError', 'Set', 'Map', 'Date', 'RegExp', 'Symbol', 'BigInt',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
  'File', 'Blob', 'FileReader', 'Image', 'Event', 'CustomEvent', 'Node',
  'NodeFilter', 'globalThis', 'undefined', 'NaN', 'Infinity', 'localStorage',
  'sessionStorage', 'history', 'location', 'navigator', 'alert', 'confirm',
  'HTMLElement', 'customElements', 'AbortController', 'Intl', 'structuredClone',
]);

const dir = 'admin';
let problemas = 0;

for (const nombre of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const ruta = join(dir, nombre);
  const codigo = readFileSync(ruta, 'utf8');

  let arbol;
  try {
    arbol = acorn.parse(codigo, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  } catch (e) {
    console.error(`✗ ${ruta}: no parsea — ${e.message}`);
    problemas++;
    continue;
  }

  /* Todo nombre declarado en cualquier sitio del archivo cuenta como conocido.
   * Es una simplificación deliberada: no distingue ámbitos, así que no detecta
   * usar algo antes de tiempo. Pero sí detecta lo que importa aquí, que el
   * nombre no exista en ninguna parte. */
  const declarados = new Set();
  const referencias = [];

  walk.full(arbol, (n) => {
    switch (n.type) {
      case 'ImportSpecifier':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
        declarados.add(n.local.name);
        break;
      case 'VariableDeclarator':
        if (n.id.type === 'Identifier') declarados.add(n.id.name);
        break;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        if (n.id?.name) declarados.add(n.id.name);
        for (const p of n.params) {
          if (p.type === 'Identifier') declarados.add(p.name);
          if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') declarados.add(p.left.name);
          if (p.type === 'RestElement' && p.argument.type === 'Identifier') declarados.add(p.argument.name);
        }
        break;
      case 'ClassDeclaration':
        if (n.id?.name) declarados.add(n.id.name);
        break;
      case 'CatchClause':
        if (n.param?.type === 'Identifier') declarados.add(n.param.name);
        break;
      case 'Property':
        if (n.value?.type === 'Identifier' && n.key === n.value) declarados.add(n.value.name);
        break;
      default:
        break;
    }
    /* Patrones de desestructuración, en parámetros y en asignaciones. */
    if (n.type === 'ObjectPattern' || n.type === 'ArrayPattern') {
      walk.full(n, (m) => { if (m.type === 'Identifier') declarados.add(m.name); });
    }
  });

  walk.full(arbol, (n, _estado, tipo) => {
    if (n.type !== 'Identifier') return;
    referencias.push(n);
  }, { ...walk.base });

  /* Se ignoran los identificadores que son nombres de propiedad (obj.algo) y
   * las claves de objeto literal, que no son referencias a variables. */
  const nombresDePropiedad = new Set();
  walk.full(arbol, (n) => {
    if (n.type === 'MemberExpression' && !n.computed && n.property.type === 'Identifier') {
      nombresDePropiedad.add(n.property);
    }
    if (n.type === 'Property' && !n.computed && n.key.type === 'Identifier') {
      nombresDePropiedad.add(n.key);
    }
  });

  const vistos = new Set();
  for (const ref of referencias) {
    if (nombresDePropiedad.has(ref)) continue;
    if (declarados.has(ref.name) || GLOBALES.has(ref.name)) continue;
    const clave = `${ref.name}:${ref.loc.start.line}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    console.error(`✗ ${ruta}:${ref.loc.start.line} — "${ref.name}" no está declarado ni importado`);
    problemas++;
  }
}

if (problemas) {
  console.error(`\n${problemas} problema(s). No publiques así.`);
  process.exit(1);
}
console.log('✓ Sin referencias rotas en admin/');
