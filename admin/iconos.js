/* Saint Venik · Los iconos de los beneficios, para el panel.
 *
 * Este archivo lo genera scripts/iconos.mjs a partir de
 * extensions/saint-venik/snippets/sv-icono.liquid, que es el original: la
 * tienda no puede leer un .js, y tener los trazos escritos dos veces a mano
 * termina siempre igual, con el panel enseñando un icono y la ficha pintando
 * otro. No lo edites: edita el snippet y vuelve a generarlo.
 *
 *   npm run iconos
 *
 * `npm run revisar` comprueba que las dos listas sigan diciendo lo mismo.
 */

export const ICONOS = [
  {
    clave: 'agua',
    rotulo: 'Gota · resistente al agua',
    trazo: '<path d="M12 3.2c3.1 3.4 5.2 6.1 5.2 8.7a5.2 5.2 0 1 1-10.4 0c0-2.6 2.1-5.3 5.2-8.7Z"/>',
  },
  {
    clave: 'garantia',
    rotulo: 'Escudo · garantía',
    trazo: '<path d="M12 3.3 5.7 5.8v5.3c0 4 2.6 7.7 6.3 8.6 3.7-.9 6.3-4.6 6.3-8.6V5.8L12 3.3Z"/><path d="m9.4 11.8 1.9 2 3.4-3.7"/>',
  },
  {
    clave: 'hipoalergenico',
    rotulo: 'Hoja · hipoalergénico',
    trazo: '<path d="M5.5 18.5C4 15 5.2 9.9 8.8 7.4c2.6-1.8 6.1-1.8 9.7-2.4.6 3.6.6 7.1-1.2 9.7-2.5 3.6-7.6 4.8-11.1 3.3Z"/> <path d="M5.5 18.5c1.8-3.4 4.4-6.1 7.7-8"/>',
  },
  {
    clave: 'joyeria-fina',
    rotulo: 'Gema · joyería fina',
    trazo: '<path d="M12 4.5 4.8 9.6 12 19.5l7.2-9.9L12 4.5Z"/> <path d="M4.8 9.6h14.4M9.2 9.6 12 19.5l2.8-9.9M9.2 9.6 12 4.5l2.8 5.1"/>',
  },
  {
    clave: 'cambios',
    rotulo: 'Flechas · cambios y devoluciones',
    trazo: '<path d="M3.8 9.2h12.4l-3-3"/><path d="M20.2 14.8H7.8l3 3"/>',
  },
  {
    clave: 'envio',
    rotulo: 'Camión · envío',
    trazo: '<path d="M3 7.5h10v9H3z"/><path d="M13 10.5h4l3 3v3h-7z"/> <circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  },
  {
    clave: 'hecho-a-mano',
    rotulo: 'Mano · hecho a mano',
    trazo: '<path d="M9 11.6V5.9a1.35 1.35 0 0 1 2.7 0v4.9"/> <path d="M11.7 10.9V4.7a1.35 1.35 0 0 1 2.7 0v6.1"/> <path d="M14.4 11.1V7a1.35 1.35 0 0 1 2.7 0v7.3c0 3.2-2.1 5.8-5.2 5.8-2.3 0-3.8-1-4.9-2.8l-1.9-3.4a1.35 1.35 0 0 1 2.2-1.6l1.7 1.9"/>',
  },
  {
    clave: 'acero',
    rotulo: 'Tuerca · acero inoxidable',
    trazo: '<path d="M12 3.4 19 7.4v8.2l-7 4-7-4V7.4l7-4Z"/> <circle cx="12" cy="11.5" r="3.1"/>',
  },
  {
    clave: 'caja',
    rotulo: 'Caja · embalaje',
    trazo: '<path d="m12 3.6 7.5 4v8.8L12 20.4l-7.5-4V7.6l7.5-4Z"/> <path d="m4.5 7.6 7.5 4 7.5-4M12 11.6v8.8"/>',
  },
  {
    clave: 'premium',
    rotulo: 'Estrella · premium',
    trazo: '<path d="m12 4 2.4 5 5.5.8-4 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-4-3.8 5.5-.8L12 4Z"/>',
  },
  {
    clave: 'oro',
    rotulo: 'Anillo · baño de oro',
    trazo: '<ellipse cx="12" cy="14.2" rx="5.4" ry="5.6"/> <path d="M8.9 9.6 7.4 5.2h9.2l-1.5 4.4"/><path d="M10.4 5.2 12 9.1l1.6-3.9"/>',
  },
  {
    clave: 'rapido',
    rotulo: 'Reloj · envío rápido',
    trazo: '<circle cx="12" cy="12" r="8"/><path d="M12 7.6V12l3 1.8"/>',
  },
  {
    clave: 'cadena',
    rotulo: 'Cadena de eslabones · cadenas',
    trazo: '<path d="M4 3.2c0 8.8 3.2 14.4 8 14.4s8-5.6 8-14.4" stroke-dasharray="2.6 2.1"/>',
  },
  {
    clave: 'colgante',
    rotulo: 'Cadena con placa · colgantes',
    trazo: '<path d="M4.5 2.5 12 10.6l7.5-8.1"/><circle cx="12" cy="11.6" r="1"/> <rect x="9" y="12.6" width="6" height="8.4" rx="1.6"/>',
  },
  {
    clave: 'pulsera',
    rotulo: 'Pulsera con broche · pulseras',
    trazo: '<path d="M14.4 17.4A9 5.6 0 1 0 9.6 17.4" stroke-dasharray="2.6 2.1"/> <rect x="9.6" y="16" width="4.8" height="2.8" rx="1.4"/>',
  },
  {
    clave: 'anillo',
    rotulo: 'Anillo con placa · anillos',
    trazo: '<rect x="4.5" y="4" width="15" height="4.6" rx="2.3" transform="rotate(-20 12 12)"/> <path d="M5.9 8.6a7.5 7.5 0 1 0 12.2 0" transform="rotate(-20 12 12)"/> <path d="M9.6 8.6a5 5 0 1 0 4.8 0" transform="rotate(-20 12 12)"/>',
  },
  {
    clave: 'perla',
    rotulo: 'Perla · perlas',
    trazo: '<circle cx="12" cy="12" r="6.8"/><path d="M8.9 10a3.6 3.6 0 0 1 3-2.5"/>',
  },
  {
    clave: 'conjunto',
    rotulo: 'Dos aros · conjuntos',
    trazo: '<circle cx="8.6" cy="12" r="5"/><circle cx="15.4" cy="12" r="5"/>',
  },
  {
    clave: 'lentes',
    rotulo: 'Lentes · anteojos',
    trazo: '<circle cx="7" cy="13.4" r="3.6"/><circle cx="17" cy="13.4" r="3.6"/> <path d="M10.6 13.2c.9-.7 1.9-.7 2.8 0M3.4 13 2.6 9.4M20.6 13l.8-3.6"/>',
  },
  {
    clave: 'tenis',
    rotulo: 'Rombos · tenis',
    trazo: '<path d="m5.5 9.6 2.2 2.4-2.2 2.4L3.3 12l2.2-2.4Z"/> <path d="m12 9.6 2.2 2.4-2.2 2.4L9.8 12 12 9.6Z"/> <path d="m18.5 9.6 2.2 2.4-2.2 2.4-2.2-2.4 2.2-2.4Z"/>',
  },
];

/* El panel dibuja el mismo SVG que la tienda: mismo viewBox, mismo trazo. */
export function svgIcono(clave, clase = 'icono') {
  const icono = ICONOS.find((i) => i.clave === clave);
  if (!icono) return '';
  return `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">${icono.trazo}</svg>`;
}

export function rotuloDe(clave) {
  return ICONOS.find((i) => i.clave === clave)?.rotulo ?? '';
}
