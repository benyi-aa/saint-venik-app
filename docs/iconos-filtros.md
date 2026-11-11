# Íconos de los filtros: encargo para otra sesión

Escrito el 11-nov-2026 para seguir el trabajo en otra sesión. Explica qué hay hoy, qué se quiere y
cómo se hace sin romper nada.

## Qué son

Arriba de cada colección (Cadenas, Pulseras, Best Sellers…) hay **pastillas de filtro rápido**:
ícono + texto, en una fila que ocupa todo el ancho en el computador y que se apila en el teléfono.
- **Fila 1, metal:** «Dorado» y «Plateado» muestran la **muestra de color** (la imagen del color en el
  panel → Colores), no un ícono dibujado. «Brillantes» usa un ícono SVG.
- **Fila 2, solo en Best Sellers:** «Cadenas», «Colgantes», «Pulseras» y «Anillos» usan los íconos
  de categoría.
- Los mismos botones salen en la página «Arma tu 3x2» (`sv-filtros-3x2.js`, que recibe el SVG ya
  dibujado).

Hoy (revisado en .cl y .com el 11-nov) **todas las pastillas tienen ícono**. Los de categoría son
trazos muy simples hechos en código: dos óvalos para la cadena, una elipse para la pulsera, dos
círculos para el anillo. Se ven genéricos.

## Qué se quiere

Un **set propio de íconos** minimalista, elegante y reconocible a 16–21 px, coherente con la marca
(joyería de hombre, quiet luxury), que reemplace a los genéricos:

| Clave (`nombre`) | Botón | Idea a mejorar |
|---|---|---|
| `cadena` | Cadenas | eslabón cubano visto de lado, o dos eslabones entrelazados |
| `colgante` | Colgantes | cadena en V con una placa o medalla |
| `pulsera` | Pulseras | pulsera cerrada en perspectiva, con el broche |
| `anillo` | Anillos | anillo de sello visto en tres cuartos |
| `conjunto` | Conjuntos | cadena + pulsera juntas |
| `tenis` / brillantes | Brillantes | fila de piedras o un brillante de corte clásico |
| `perla`, `lentes`, aros | Perlas, Lentes de sol, Aros | por si se agregan pastillas (hay colección Aros sin ícono propio) |

Dorado y Plateado siguen con la muestra de color.

## Reglas técnicas (para que funcione)

- Los íconos viven en **un solo archivo**: `extensions/saint-venik/snippets/sv-icono.liquid`, un
  `{%- when 'clave' -%}` por ícono, con solo los trazos de adentro (`<path>`, `<circle>`, `<rect>`,
  `<ellipse>`). El snippet los envuelve en
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`.
  Por eso tienen que ser **de línea, sin relleno, sobre 24×24 y con trazo de 1,5**; el color lo pone
  el texto del botón (negro, o blanco cuando el filtro está activo).
- **Un solo nombre por `when`.** `when 'lentes', 'lente'` rompió `scripts/iconos.mjs` (10-nov).
- Ese mismo snippet dibuja los **beneficios** de la ficha de producto (agua, garantía, oro…). Tocar
  solo las claves de categoría; no cambiar las de los beneficios sin querer.
- Clave nueva: agregar también su nombre visible en `ROTULOS` de `scripts/iconos.mjs`. `npm run -s
  publicar` genera `admin/iconos.js`, así el panel muestra los mismos íconos que la tienda.
- Tamaño en pantalla: 16 px en pastilla y 21 px en fila apilada (`assets/sv-filtros.css`). Probar
  que se lean a 16 px: pocos trazos, sin detalles finos.
- **Qué ícono lleva cada botón:** panel → **Filtros** → campo «Ícono» de cada botón. Si está vacío y el
  botón es de categoría, se usa solo el valor en singular («Cadenas» → `cadena`), según
  `blocks/filtros.liquid` (~línea 140). Con dibujar bien las claves de categoría alcanza; no hay que
  reasignar nada.

## Cómo publicarlo

1. `git fetch && git merge origin/main` (cada deploy reemplaza la extensión entera).
2. Editar `sv-icono.liquid` (y `scripts/iconos.mjs` si hay clave nueva).
3. `npm run -s publicar`: no puede decir «No publiques así».
4. Commit, `git push`, `npm run -s deploy:cl` y `npm run -s deploy:com`.
5. Revisar como cliente en Best Sellers (las dos filas), Cadenas (Brillantes) y «Arma tu 3x2», en el
   computador (1280 y 1440 px) y en el teléfono (375 y 514 px), y en el panel → Filtros (selector de
   íconos).

## Antes de publicar

Mostrar al usuario una hoja con el set nuevo al lado del actual, a 16 px y a 48 px, y publicar solo
lo aprobado.

## Estado (11-nov-2026)

Publicados los cuatro de categoría en versión de línea, aprobada por el usuario: `cadena` (U de
eslabones en trazo cortado), `colgante` (cadena en V con placa), `pulsera` (óvalo de eslabones con
broche) y `anillo` (aro con placa alargada, girado 20°). Se descartaron el destello de cuatro puntas
y la versión detallada con eslabones reales. `conjunto`, `tenis`, `perla` y `lentes` siguen igual.

### Cómo se llegó y qué queda (para seguir en otro chat)

- Rondas descartadas por el usuario: (1) set genérico de siete íconos; (2) «eslabón y destello»
  (no quiere la estrella); (3) la joya puesta en el cuerpo (ilegible a 16 px). Pidió solo cuatro
  filtros (cadena, colgante, pulsera, anillo) y que se parezcan a lo que se vende. Eligió la versión
  de **línea** sobre la **detallada** (eslabones reales entrelazados, trazo 1–1,2 y relleno en el
  anillo); la detallada se puede regenerar si la pide.
- Referencias reales: Cadena Cuban Link, Faith/Florence/Vault Pendant, Pulsera Miami Cuban (óvalo
  acostado con broche), Anillo Black Hades (placa alargada con incrustación negra).
- Commits: `d381b9c` (íconos + rótulos, desplegado a .cl y .com) y `27b4f73` (panel: la vista previa
  de Filtros usa el ícono de la categoría en singular, como la tienda; solo panel, sin deploy).
- Revisado en .cl y .com: Best Sellers en teléfono (21 px) y computador 1280/1440 (18 px, una fila);
  «Arma tu 3x2» no usa íconos de categoría; panel → Filtros muestra los cuatro en la vista previa.
- Sin revisar: el desplegable «Ícono» del panel (no se abre con automatización) y el trazo a tamaño
  real en computador (la captura sale reducida).
- Dudas abiertas: el anillo puede recordar a un llavero; a 16–18 px los eslabones se achican (opción:
  subir el tamaño del ícono en `assets/sv-filtros.css`).
- Para ver los íconos como imagen sin navegador: armar un SVG y `qlmanage -t -s 1800 -o . hoja.svg`.
- El remoto de GitHub se movió a `benyi-aa/saint-venik-app` (el push funciona, conviene actualizarlo).
