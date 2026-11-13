# Lo que hay que tocar en el tema

La app no puede hacer esto sola: son cambios en el tema, y hay que repetirlos en
cualquier tema donde se quiera usar el bloque. Probado en
**Saint Venik · bloques app (pruebas)** (id 160802897967), duplicado del tema en
vivo *Copia de theme-export-saintvenik-cl-working-q1-…*

## 1. Añadir los bloques a las plantillas de producto

Tres plantillas tienen productos asignados: `acero-inox` (74), `orov2` (80) e
`ice` (9). En cada `templates/product.<nombre>.json`, dentro de la sección
`main`, el bloque va justo después de `price`:

```json
"sv_selector_color": {
  "type": "shopify://apps/saint-venik/blocks/selector-color/01a0a760-9c51-786e-8540-94248eb04d7c",
  "settings": {}
},
"sv_selector_talla": {
  "type": "shopify://apps/saint-venik/blocks/selector-talla/01a0a760-9c51-786e-8540-94248eb04d7c",
  "settings": {}
}
```

Ese último UUID es el de **registro** de la extensión, no el `uid` que aparece en
`extensions/saint-venik/shopify.extension.toml`. Los dos se parecen y no son el
mismo: usar el `uid` hace que el bloque no renderice y sin ningún error. El bueno
sale de `.shopify/deploy-bundle/manifest.json`, campo `uuid` del módulo
`theme_app_extension`.

Desde el editor de temas se añade solo: Producto → Añadir bloque → Apps →
Selector de color.

## 2. Quitar el selector de color que ya traía el tema

El tema lleva su propia versión escrita a mano, que hace lo mismo que el bloque
leyendo `custom.hermano_de_color` y el metaobjeto `color`. Vive en
`snippets/sv-color-swatch.liquid` y se invoca desde `snippets/product-template.liquid`,
dentro de la rama `when 'variant_picker'`:

```liquid
{%- render 'sv-color-swatch', product: product -%}
```

Borrar esa línea. Además de duplicar el selector, imprime
`Translation missing: es.products.product.color` porque usa
`{{ 'products.product.color' | t | default: 'Color' }}` y esa clave no existe en
los locales del tema; el `default` no lo tapa, porque `t` devuelve el texto
"Translation missing…", que no es un valor vacío.

Ojo: ese snippet del tema se llama igual que el de la extensión
(`sv-color-swatch`). No chocan, porque los archivos de una theme app extension
están aislados, pero confunde al leer el código.

## 3. Desactivar OPTIS Color Swatch

Es un *app embed*, así que se activa y desactiva por tema:
`config/settings_data.json` → `current.blocks` → el de
`shopify://apps/optis-color-swatch/blocks/bss-se-script/…` → `"disabled": true`.
Desde el admin: Personalizar → Configuración → Incrustaciones de apps.

Desactivarlo en un tema **no cancela la suscripción**: son $49,90 al mes hasta
desinstalar la app en Configuración → Apps, y eso afecta a todos los temas a la
vez. Hacerlo solo después de publicar.

## Datos de la tienda

El metaobjeto `color` tiene cuatro entradas, no dos. `oro` y `plateado` llevan la
imagen pero no la etiqueta; `oro-1` y `plateado-1` llevan la etiqueta y, desde el
15-09-2026, también la imagen. El bloque empareja por etiqueta, así que usa las
terminadas en `-1`. Las otras dos marcan 0 referencias y se pueden borrar.
El campo `muestra` (color plano) está vacío en las cuatro: la muestra es la imagen.

## 4. Quitar el selector de talla del tema

El bloque `variant_picker` del tema pinta la misma fila de tallas que el bloque
de la app, y los dos escriben en el mismo `select[name="id"]` — pero el del tema
no repinta su estado cuando el cambio no viene de él, así que se quedan
discrepando a la vista del cliente. Se saca `variant_picker` de `block_order`
en las tres plantillas.

El `select[name="id"]` **no** lo pinta ese bloque sino el formulario del
producto, así que sigue ahí y el botón de compra funciona igual. Verificado en
`anillo-signet` tras retirarlo.

## Trampas verificadas contra la documentación (16-09-2026)

Cinco decisiones de API se comprobaron con documentación y una pasada adversaria.
Las cinco respuestas optimistas tenían un error material. Lo que quedó:

- **El orden de una lista de referencias no está garantizado.** Ni la doc de
  `MetaobjectField` ni la de Liquid dicen que `list.metaobject_reference`
  conserve el orden de inserción; en Liquid hay fallos conocidos (`.value`
  devolviendo solo el primer elemento, orden por handle). Por eso cada bloque
  lleva un campo `orden` y el Liquid ordena por él.
- **Subir archivos desde el navegador no está resuelto.** El bucket de staged
  uploads (`shopify-staged-uploads.storage.googleapis.com`) sí manda
  `Access-Control-Allow-Origin: *`, pero para `IMAGE`/`FILE` Shopify puede
  devolver `<shop>.myshopify.com/admin/tmp/files`, que **no** manda CORS, y la
  doc de imágenes indica `PUT` con los parámetros como cabeceras, no `POST` con
  FormData. Hay que implementarlo con guarda por host y una salida alternativa.
- **El editor masivo de Shopify probablemente no edita columnas
  `metaobject_reference`.** Si se asocia producto → guía con un metacampo de ese
  tipo, la asignación por lote la tiene que dar el panel de la app: son 154
  productos.
- **Trampa de Liquid:** `guia != blank and guia.bloques.value.count > 0` se
  evalúa de derecha a izquierda e imprime `Liquid error: comparison of Nil with 0
  failed` al cliente en cualquier ficha sin guía. Hay que anidar los `if`.
- **Dos campos por idioma se mantienen.** Las traducciones nativas no cubren el
  requisito (contenido que existe en un idioma y no en el otro, oculto por
  idioma de forma independiente), y para metaobjetos de una app tienen un fallo
  abierto y no se autotraducen en masa.

## Título del producto como en saintvenik.cl (17 sep 2026)

saintvenik.cl fija el título de la ficha con **CSS personalizado** en la sección
principal del producto. saintvenik.com no lo tenía (tampoco el tema anterior), y
el título salía a 20,4 px en vez de 18.

Se añadió la misma regla, como `custom_css` de la sección `main`, en las tres
plantillas que usan los productos de .com — `product.orov2.json` (66),
`product.acero-inox.json` (70) y `product.ice.json` (9):

```css
.product-single__title, .product-card__title,
h1.product-single__title, h2.product-single__title {
  font-size: 18px !important;
  line-height: 1.2em !important;
  padding: 0px !important;
  margin: 0px !important;
}
```

Comprobado en las tres: 18 px, línea de 21,6 px, y 25 px del título al precio,
igual que en .cl. Si se duplica el tema o se crea otra plantilla de producto,
hay que volver a ponerla (editor de temas → sección del producto → CSS
personalizado).

**Pendiente:** 9 productos usan la plantilla de producto por defecto
(`product.json`), que este tema no tiene, y por eso dan 404 aunque están
publicados: los cuatro sets de cadena con colgante, `cuban-set`,
`pulsera-geneva`, `acero`, `brillantes` y `new-packaging`.

## saintvenik.cl (17 sep 2026)

Tema de pruebas: **«Saint Venik · bloques app (pruebas)»** (188341289263), copia
de «Working | Q1 2026 || NEW» (184209015087, el que está en vivo).

Cambios sobre la copia, y nada más:

- Plantillas `product.acero-inoxidable`, `.aceroinox-sinstock`, `.brillantes`,
  `product.json`, `.lentes-de-sol`, `.oro`, `.oro-sinstock`: los tres bloques de
  la app en el sitio del selector de variantes del tema, que queda
  **desactivado** (no borrado). En `.oro` también se desactiva el bloque de
  OPTIS. El bloque «META DE PRODUCTO» (reseñas y stock) queda justo debajo, como
  estaba.
- `settings_data.json`: desactivados los app embeds de OPTIS
  (`optis-color-swatch/bss-se-script`) y de **Avada Size Chart**
  (`size-chart/app-embed`), que es quien pinta la «Guía de Tallas» en .cl (no
  Kiwi).

Los bloques de .cl usan el uuid de su propio registro:
`shopify://apps/color-size-picker/blocks/<bloque>/01a0ad1a-1990-7459-b850-45f32c50d143`.
Los de .com usan `01a0a760-9c51-786e-8540-94248eb04d7c`.

.cl ya tenía la regla del título a 18 px en su CSS personalizado.

### Publicado (17 sep 2026)

- «Saint Venik · bloques app (pruebas)» (188341289263) es el tema en vivo de
  saintvenik.cl. Vuelta atrás: publicar «Working | Q1 2026 || NEW»
  (184209015087), que quedó intacto.
- Antes de publicar se comprobó que el tema en vivo no había cambiado desde la
  copia, y se barrieron las 179 fichas en español e inglés: 134 con color
  (las que tienen hermano), 82 con talla (todas las que tienen talla), 168 con
  guía, los 9 sets con sus 2 o 3 filas, y ni rastro de OPTIS ni de Avada.
  Elegir talla cambia la variante del carrito sin recargar.
- Desinstaladas en .cl: **OPTIS Color Swatch** ($49,90/mes + uso) y **MP Size
  Chart** ($6,95/mes), que es la app de Avada que pintaba «Guía de Tallas».
  En saintvenik.com, OPTIS y Kiwi las desinstala Diego a mano.

## Insignias y beneficios (5 nov 2026)

Dos piezas nuevas, y cada una se enciende de una manera distinta.

### El bloque «Beneficios»

Es un app block normal, así que va dentro de la sección `main` de cada
plantilla de producto, como los otros tres. El sitio natural es justo debajo
del selector de talla:

```json
"sv_beneficios": {
  "type": "shopify://apps/saint-venik/blocks/beneficios/01a0a760-9c51-786e-8540-94248eb04d7c",
  "settings": {}
}
```

En .cl el uuid de registro es el suyo:
`shopify://apps/color-size-picker/blocks/beneficios/01a0ad1a-1990-7459-b850-45f32c50d143`.

Plantillas donde hay que ponerlo, las mismas que ya llevan los otros bloques:

- **.com** (3): `product.acero-inox`, `product.orov2`, `product.ice`.
- **.cl** (7): `product.acero-inoxidable`, `.aceroinox-sinstock`, `.brillantes`,
  `product.json`, `.lentes-de-sol`, `.oro`, `.oro-sinstock`.

### El app embed «Insignias de producto»

No es un bloque de sección: no se añade a ninguna plantilla. Se enciende una
vez por tienda en Personalizar → Configuración → Incrustaciones de apps. En el
archivo eso es una entrada en `config/settings_data.json`, dentro de
`current.blocks`:

```json
"sv_insignias": {
  "type": "shopify://apps/saint-venik/blocks/insignias/01a0a760-9c51-786e-8540-94248eb04d7c",
  "disabled": false,
  "settings": {}
}
```

Vive en el tema, no en la app: **al publicar otro tema hay que volver a
encenderlo**, igual que pasó con los embeds de OPTIS y Avada.

### Por qué las insignias no son un bloque

Una tarjeta de producto no es una sección ni un bloque de tema: es el snippet
`grid-item` dentro del bucle del grid. La documentación de Shopify dice que los
bloques de tipo `@app` no se admiten en secciones renderizadas estáticamente,
así que no hay ningún punto de extensión por tarjeta. La única vía es el embed
+ JavaScript.

El script se apoya en el marcado de Impulse 7.5.1, que hoy es idéntico en las
dos tiendas:

- tarjeta: `.grid-product[data-product-handle]` o `.grid__item[data-product-handle]`
- caja de la imagen: `.grid-product__image-mask` (y si no, `.grid__item-image-wrapper`)
- insignia propia del tema: `.grid-product__tag`, en `top:8px left:8px z-index:2`
  — la nuestra se mide y se coloca debajo, no encima
- ficha: `.product-main-slide[data-index="0"] .product-image-main`, que es el
  único contenedor de la cadena sin `overflow:hidden`
- el grid de la colección se reconoce por la sección `...__main-collection`

Si el tema cambia de versión hay que revisar esos cinco selectores.

### Encendido en las dos tiendas (5 nov 2026)

Hecho ya, sobre los temas **en vivo** y con permiso:

| | .com (vd9tn0-et, tema 160802897967) | .cl (saint-venik, tema 188341289263) |
|---|---|---|
| Bloque «Beneficios» | ~~3 plantillas~~ **quitado** (ver abajo) | ~~7 plantillas~~ **quitado** |
| App embed «Insignias» | encendido | encendido |
| Versión de la app | `saint-venik-29` | `color-size-picker-4` |

El bloque va en `block_order` justo detrás de `buy_buttons`, que es donde se
ven en la referencia. Se puede mover desde el editor de temas sin tocar nada
más.

Ojo con el handle de la app en el `type`: en las DOS tiendas es
`color-size-picker`, aunque el directorio de la extensión se llame
`saint-venik` y en .com el handle de la app del TOML sea `saint-venik`. Lo que
manda es lo que ya hay escrito en las plantillas; el script que los insertó
copia el prefijo de un bloque que ya funcionaba en vez de escribirlo a mano.

Comprobado después de empujar, en las dos: las fichas cargan sin error de
Liquid, siguen saliendo el selector de color, el de talla y la guía, y el JS de
las insignias se carga. Todavía no se ve nada nuevo porque no hay ninguna
insignia creada ni ningún beneficio asignado: los dos bloques no dibujan hasta
que el panel tenga datos.

Vuelta atrás, si hiciera falta: quitar `sv_beneficios` de las plantillas y
poner `"disabled": true` en la entrada de `insignias` de `settings_data.json`.

## Qué quedó configurado (5 nov 2026)

La asignación se hace por **etiqueta de producto**, que es la taxonomía que las
dos tiendas ya usan (`oro`, `acero-inox`, y en .com `ice`) y la misma que mira
el selector de color. Se comprobó antes de elegirla: en .cl las colecciones
«plateadas» solo cubren 72 de los 101 productos de acero, así que por
colección habría quedado mal.

### Beneficios

| | alcance en .cl | alcance en .com |
|---|---|---|
| Garantía de por vida (1) | `oro, acero-inox` → 179 | `oro, acero-inox, ice` → 150 |
| Resistente al agua y el sudor (2) | `oro, acero-inox, -brillantes` → 170 | `oro, acero-inox, -brillantes` → 141 |
| Hipoalergénico (3) | `oro, acero-inox` → 179 | `oro, acero-inox, ice` → 150 |
| Joyería fina (4) | `brillantes` → 9 | `brillantes` → 9 |

El bloque muestra 3 como mucho y los ordena por posición, así que un producto
de oro saca 1-2-3 y uno de brillantes saca 1-3-4: el del agua no le alcanza y
entra «Joyería fina», que es justo lo que pedía el vídeo.

### La etiqueta `brillantes`

Los brillantes son las mismas nueve piezas en las dos tiendas: las cinco
tennis (`pulsera-tennis-3mm`, `pulsera-tennis-5mm`,
`pulsera-square-tennis-5mm`, `cadena-tennis-3mm`, `cadena-tennis-5mm`) y
`pulsera-eclissi`, `pulsera-giglio`, `pulsera-azure` y `pulsera-legacy`.

No había forma de reconocerlas: en .cl no había ninguna etiqueta y en .com la
etiqueta `ice` solo marcaba cuatro, y además es la condición de la colección
automática «Pulseras Ice», así que ampliarla habría metido dos cadenas en una
colección de pulseras. Se creó la etiqueta **`brillantes`** sobre las nueve en
las dos tiendas. Los filtros de .cl son solo disponibilidad y precio, así que
la etiqueta nueva no se le ve al cliente.

### Restar con un guión

«Resistente al agua» alcanza a todo el oro y todo el acero **menos** los
brillantes. Eso no se puede decir sumando, así que una etiqueta con un guión
delante (`-brillantes`) resta. La resta la aplica el panel al calcular, al
final y sobre todo lo reunido, así que da igual el orden y también quita lo
que hubiera entrado por colección o a mano.

### Fotos del usuario: «Tu cadena de cada día» y Best Sellers (9-nov)

El usuario mandó dos fotos: la cadena cubana de oro con camisa de punto para el
banner «Tu cadena de cada día» del inicio y la cadena tennis con camisa negra
para el banner de Best Sellers. En el computador van tal cual
(`sv-inicio-cadena-dia.jpg`, `sv-portada-bestsellers.jpg`). En el teléfono el
texto va encima de la foto y tapaba la cadena, así que cada una tiene una versión
`-movil` ampliada con Nano Banana (más camisa abajo y a los lados, nunca más
arriba de los labios) con la foto original pegada encima, así la cadena y la mano
son exactamente las del usuario. Las trae el botón «Traer las fotos nuevas a
Archivos». El inicio las busca por nombre en el bloque Liquid del
`advanced_content_9QkUY9` (las dos versiones de idioma de .com); si no están,
sale la foto del velero. Best Sellers las usa fuera de Navidad desde
`sv-portada` (clase `sv-pd` en el computador, `sv-pm` en el teléfono); en
Navidad sigue su banner de terciopelo.

### Título del encabezado en la plantilla por defecto de colección (9-nov)

`templates/collection.json` (bloque Liquid de `advanced_content_bpAddx`) es la
plantilla de Best Sellers y de las colecciones sin plantilla propia (Oro, Sale,
Aros, Tendencia, Inferior a $…, Winner's, y en .com también Essentials e Ice).
Tenía el título fijo («Bestsellers» en .cl, «Essentials'26» en .com) y salía en
todas. Ahora el título es el de la colección y el texto es la primera frase de
su descripción de Google (`page_description` hasta el primer « | »); Best
Sellers y Essentials conservan su texto propio. `page_description` ya viene
escapado: no pasarle `escape` o el apóstrofo sale como `&#39;`.

### Pestaña «Fotos» del panel (10-nov)

Para que el usuario cambie las fotos de temporada sin código: cada foto con su
miniatura, dónde se ve, el formato que conviene y dos botones («Subir…» desde el
computador y «Elegir de la biblioteca»). Cambia el contenido del MISMO archivo
(mismo id y nombre, `fileUpdate`), así que el tema, la extensión y los
metacampos lo siguen encontrando. La foto se pasa a JPG en el navegador antes de
subirla para que el nombre no cambie (`admin/fotos.js`). La lista de fotos de
cada temporada la arma `gruposDe()` de ese archivo (arriba se elige la temporada:
ver `docs/temporadas.md`). Ojo: «Traer las fotos nuevas…» y «Preparar las fotos
de Navidad» las vuelven a poner desde la app y pisan los cambios hechos a mano.

### Banners de Navidad: teléfono centrado y Best Sellers entero en el computador (10-nov)

Revisión del usuario en el tema de vista previa: en el teléfono las joyas no
quedaban al centro y el título tapaba varias; en el computador el banner de Best
Sellers cortaba las joyas. Ahora:
- Las 7 versiones `sv-navidad-portada-<k>-movil.jpg` (también Anillos, nueva)
  tienen las joyas al centro y en el 58 % de arriba (el título ocupa de 61 % a
  92 % del alto del banner de 165 px). Anillos es un recorte; las demás se
  ampliaron con Nano Banana y se pegó la original encima. Se muestran enteras
  (`--sv-encuadre: 50% 50%` en `sv-portada.css`).
- `sv-navidad-portada-bestsellers.jpg` (computador) es una toma más abierta con
  las joyas en ~35 % del alto, a la derecha; `--sv-y: 54%`. Cabe entera de 1280
  a 1512 px; a 1920 se corta apenas arriba.
- Las anteriores quedaron en `branding/colecciones-inicio/navidad/portadas/respaldo-10nov/`.

### Banners de Navidad estilo estudio (feedback de Benjamín, 10-nov, tarde)

Video de Benjamín: el inicio de Navidad, perfecto; los banners de colección eran
tomas lejanas sobre terciopelo. Pidió planos cercanos e icónicos, como la foto de
Daniela de las placas con estrella (`branding/referencias/navidad-estilo-placas-estrella.jpg`),
sin terciopelo: fondo de estudio en degradado de negro a burdeo con un halo de luz.
Anillos se queda como estaba. Los otros seis (Cadenas, Pulseras, Colgantes,
Conjuntos, Essentials, Best Sellers) se rehicieron en computador y teléfono, con
piezas reales en oro y plateado (Cuban Link 8 mm, Pulsera Cuban 8 mm, placas con
estrella, Compass II set, Vault Green, Faith Oro + Vault Blue).
- Nano Banana no aleja la cámara aunque se le pida, y al ampliar con gris redibuja
  la joya: para el computador se achicó la foto con `scripts/imagenes/achicar-fondo.py`
  (fondo = la misma foto sin la joya y desenfocada, unión en elipse). En el teléfono
  sí sirvió ampliar con gris (`pegar.py`) para subir la joya sobre el título.
- Segunda vuelta (mismo día): el usuario las encontró chicas y poco atractivas en el
  computador. Se rehicieron Pulseras, Colgantes, Conjuntos, Essentials y Best Sellers con
  composición HORIZONTAL y muy cerca (cada una con su pose: placas en diagonal, pulseras
  acostadas, piedras grandes, cruz y piedra azul, medallones lado a lado), porque la
  franja del computador es ancha y baja. Colgantes y Pulseras corridas 13 % a la derecha
  para no tocar el título largo a 1280 px. Las colgando quedaron en `estudio-10nov/v1-colgando/`.
- Tercera vuelta (mismo día, feedback del usuario con capturas): en el computador se veían
  demasiado cerca y cortadas, Conjuntos mezclaba cadenas rope y cuban, y en el teléfono salía la
  foto del computador. Ahora cada colección tiene UN concepto en dos composiciones: computador
  (producto entero, horizontal, a la derecha) y teléfono (el mismo, centrado y arriba del título).
  Conjuntos = Cuban Set oro y plata (collar + pulsera, solo cuban). La franja de los banners de
  temporada en el computador crece con el ancho: `clamp(300px, 22vw, 440px)` (`sv-portada.css`,
  solo con `html.sv-nav` y foto cambiada), así se ve ~la mitad del alto de la foto en cualquier
  pantalla. El cambio de foto teléfono/computador ahora sigue al tamaño de la ventana
  (`matchMedia` change), no solo al cargar. Las vueltas anteriores: `v1-colgando/` y `v2-horizontal/`.
- Cuarta vuelta (mismo día): Cadenas, Pulseras y Conjuntos se veían tiesos y falsos (círculos),
  Essentials con dos colgantes iguales. Rehechos como foto real: apoyados sobre superficie negra
  brillante que se funde con el fondo burdeo, caída natural en S («estilo serpiente»), nunca
  círculos. Essentials = colgante Vault Green Oro + Pulsera Eclissi. Colgantes y Best Sellers
  quedaron como estaban (aprobados). Las vueltas de círculos: `v3-circulos/`.
- Quinta vuelta: en Cadenas y Pulseras Nano Banana había fundido la pieza dorada con la plateada
  (una cadena que cambia de color, eslabones plateados dentro de la dorada). Rehechas con las piezas
  SEPARADAS, sin tocarse, cada una de un solo metal, y revisadas con lupa antes de subir. Si dos
  piezas de distinto metal se cruzan, la IA tiende a mezclarlas: pedirlas separadas.
- Sexta vuelta: «pésimo diseño, no se ven naturales (las S) y ninguno tiene los colores de navidad».
  Cadenas, Pulseras, Essentials y Conjuntos rehechos con superficie y fondo BURDEO (se le pasó a Nano
  Banana el banner aprobado de Colgantes como referencia de color) y piezas apoyadas con naturalidad
  (pulseras cerradas como óvalos, cadenas sueltas), separadas y de un solo metal. Cadenas teléfono se
  armó desde la del computador (la generada para teléfono volvió a unir oro y plata).
- Séptima vuelta (Cadenas y Pulseras): «muy planas, no comunican». Se pidieron conceptos sin gastar
  y el usuario corrigió: el fondo NO cambia (negro con borde/halo burdeo como Colgantes), solo la
  pose de la joya. Eligió C4 (tres cadenas distintas colgando: cubana oro 8 mm, tennis 5 mm, rope oro
  4 mm, cada una en su espacio) y P3 (tres pulseras DE PIE con reflejo: cubana oro, tennis 5 mm,
  Eclissi). Nano Banana cruza las cadenas colgantes si no se le da a cada una su franja de ancho
  («stays entirely between 50% and 63% of the width…») y dibuja las pulseras de pie enormes: se
  achicaron con `scripts/imagenes/achicar-borde.py` (estira los bordes de la foto achicada, así el
  horizonte del piso sigue parejo; `achicar-fondo.py` dejaba el piso como una repisa flotando).
  Teléfono de P3 armado desde la del computador. Descartadas: C1 y P1 (dos cubanas oro/plata).
  La ronda anterior: `v6-burdeo-plano/`. El usuario las subió «por mientras» y pidió otro
  concepto más fluido, menos rígido.
  Mismo día: el usuario pidió volver en CADENAS a la de la sexta vuelta (cubanas oro y plata sueltas
  sobre burdeo); Pulseras se queda con P3. C4 guardada en `v7-colgando/`.
- 11-nov (feedback del usuario en un teléfono de ~514 px de ancho, «solo en móvil»): (1) en Colgantes
  teléfono a la placa plateada le llegaba también una cadena DORADA (salía de su argolla hacia la derecha):
  se borró sin IA (píxeles dorados de esa zona rellenados con el fondo, protegiendo la plata); la original,
  en `estudio-10nov/respaldo-11nov/`. (2) Pulseras se veía cortada arriba: la franja del teléfono medía 165 px
  fijos y las fotos de temporada (2400×1000) se recortaban arriba y abajo en teléfonos de más de ~400 px.
  Ahora, solo con foto de temporada `-movil`, la franja mide `max(165px, 100vw / 2.4)` (`sv-portada.css`):
  la foto se ve entera en cualquier ancho y el título sigue abajo.
- Descargas del generador (10-nov): el servidor entregaba a pocos KB/s y `erp.sh BAJAR` corta a los
  300 s (archivo truncado). Se completaron pidiendo lo que faltaba por rangos (`curl -r`) en trozos
  paralelos; la API acepta Range.
- Encuadre en el computador (`sv-portada.liquid`): cadena 58 %, pulsera 50 %, essentials 50 %, conjuntos 50 %,
  colgantes 54 %, bestsellers 56 %, anillos 48 %.
- Originales en `branding/colecciones-inicio/navidad/portadas/estudio-10nov/`; los de
  terciopelo, en `respaldo-10nov-terciopelo/`. Costo: ~27 imágenes, unos US$2,40.

### Tema de vista previa de Navidad en .cl (10-nov)

La temporada se cambia desde la app (pestaña «Temporadas», desde el 10-nov;
antes Apariencia → «Inicio: colecciones»). Aparte, en .cl hay un tema **sin publicar** solo para
mirar y compartir la Navidad: «Saint Venik · NAVIDAD (vista previa)»
#189939188015, copia del tema en vivo del 10-nov. Tiene el embed
«Transiciones» con el ajuste **Temporada de este tema = navidad** (ahora es un
texto con la clave; en el tema en vivo queda «panel»), el carrito vacío fijo en
Navidad (`snippets/custom-collecion-cart-page.liquid`) y `snippets/sv-temporada.liquid`
forzado a Navidad (barra, bloque 3X2 y caja de oferta). Es una foto del día: lo que se
cambie después en el tema en vivo no pasa solo a esta copia; se puede volver a
duplicar. Abrir: `saintvenik.cl/?preview_theme_id=189939188015`; salir:
`saintvenik.cl/?preview_theme_id=` (o «Salir de la vista previa» en la barra de
abajo). Si no se sale, ese navegador sigue viendo la copia.

**Salida automática (10-nov).** Shopify guarda la vista previa en la cookie
`_shopify_essential` por **un año** y quita `?preview_theme_id` de la dirección con
un 302. Por eso el usuario seguía viendo Navidad al buscar «saint venik» días
después. El `layout/theme.liquid` de ESTE tema (no el en vivo) ahora:
- deja la vista previa si se entró por el enlace (la página llega con
  `redirectCount > 0`, o viniendo del admin), en esa misma pestaña
  (sessionStorage `sv-prev-tema`), o en otra pestaña antes de 30 min (localStorage
  `sv-prev-visto`);
- si no, va a `?preview_theme_id=` y Shopify la borra: se ve el tema en vivo;
- muestra arriba una barra amarilla «VISTA PREVIA DE NAVIDAD · no es la tienda
  actual · Salir». Nada de esto corre en el editor de temas (`request.design_mode`).
Probado: entrar con el enlace (queda), seguir navegando (queda), volver sin el
enlace pasada media hora (sale al tema en vivo y se queda ahí). Si se vuelve a
duplicar el tema de vista previa, copiar este trozo.

### Franja negra arriba del video del inicio (10-nov)

El video del inicio (4K) trae franjas negras grabadas en el archivo: hasta 7
líneas arriba y 6 abajo de cada 1080 (≈0,65 % del alto), en casi todas las
escenas. En un computador de 1440 px eso es una línea negra de 4–5 px justo
debajo del menú. `sv-inicio` agranda el video 4 % (2 % por lado, el triple de la franja más gruesa) dentro de `.sv-hero__media`
(que recorta), así las franjas quedan fuera. Si se cambia el video por uno sin
franjas, se puede quitar esa regla.

### «Arma tu 3x2» como página de anuncios (video de Benjamín, 10-nov)

Benjamín quiere usar `/pages/arma-tu-3x2` como advertorial de todos los anuncios.
Cambios, en las dos tiendas:
- **Barra fija de arriba** (`sv3-contador`): fondo blanco, texto y progreso en
  negro, sin el dorado/naranjo, línea gris abajo, y en vez del reloj un punto
  burdeo #7f1d2d que late (como el del carrito vacío). Ajustes nuevos «Punto de
  urgencia» y «Línea de abajo». Sin «Envío gratis sobre $80.000» (envío en 0).
- **Portada en el celular** (`sv3-hero`): formato nuevo «Horizontal» (alto en %
  del ancho, 50 = 2:1) con la foto en uso de Pulseras (`coleccion_pulsera.jpg`,
  la joya al centro), y el bloque «Elige 3. Paga 2.» sobre blanco con letra y
  botón negros (ajustes «Fondo del texto en celular» y «Color del texto»). El
  computador no cambia.
- **Bandeja de abajo** (`sv3-bandeja`): «+50.000 clientes» con un ticket ✓ en vez
  de «Envío gratis sobre $80.000» (ajuste «Ícono antes del texto»).
- **Filtros**: la primera fila de botones de la app (Dorado, Plateado,
  Brillantes) debajo de las pestañas. El embed «Filtros rápidos» deja la lista
  en `#sv-filtros-3x2` y `sv-filtros-3x2.js` filtra la grilla en el sitio: color
  por las muestras de metal de cada tarjeta (y la pasa a ese metal), tipo por las
  etiquetas del producto (`brillantes`).
- **Filtros como Best Sellers (11-nov, pedido del usuario):** la página muestra los mismos botones
  que salen en Best Sellers, con sus filas (metal + Brillantes; Cadenas, Colgantes, Pulseras,
  Anillos). Para cambiarlos: panel → Filtros, marcar o desmarcar Best Sellers en el botón. La
  categoría se filtra por estar en la colección de ese nombre (`/collections/cadenas`…), porque
  `products.json` no trae la categoría de la app ni está en las etiquetas.

### 3x2: portada de temporada (11-nov)

Pedido del usuario: en Navidad, la portada de `/pages/arma-tu-3x2` usa el mismo banner que
Essentials. `sections/sv3-hero.liquid` (temas en vivo de .cl y .com, NO va con la extensión) lee
la temporada activa (`sv_configuracion_2.temporada`) y, si existe `sv-<clave>-portada-<colección>.jpg`
(y `-movil.jpg`) en Archivos, la usa en vez de las fotos de la sección. La colección se elige en el
editor del tema: ajuste «En temporada (Navidad…): banner de» (Essentials de fábrica; «Ninguno» =
siempre las fotos propias). Sin temporada vuelve sola a las fotos de siempre.
**Pendiente del usuario:** definir el banner del 3x2 para cuando NO sea Navidad.
Respaldo: `branding/respaldos-tema/2026-11-11-3x2-navidad/`.

### Brillantes: «Apto para pieles sensibles» en vez de «Hipoalergénico» (10-nov)

Pedido del usuario: en los 9 productos con brillantes, el beneficio de la ficha no debe decir
que es de acero ni que no se destiñe. En la lista de beneficios de su plantilla
(.cl `product.brillantes`, bloque `custom_dzRbmL`; .com `product.ice`, `custom_7qn9dU`, y la
copia de vista previa de .cl) «Hipoalergénico — Acero Inoxidable 316L no se destiñe…» quedó
«Apto para pieles sensibles — Puedes usarla todos los días sin irritaciones y no deja marcas
verdes en la piel.» (inglés: «Safe for sensitive skin — Wear it every day without irritation,
and it won't leave green marks on your skin.»). El resto de las plantillas no se tocó.
Respaldo: `branding/respaldos-tema/2026-11-10-piel-sensible/`. Queda la píldora
«Hipoalergénico» sobre las fotos (beneficio de la app, sin texto de acero).

### «Resistente al agua» fuera de los lugares generales (9-nov)

Benjamín: solo los brillantes no son resistentes al agua, así que la frase
puede ir en la ficha de un producto de oro o plata, pero nunca en un lugar
general (inicio, colecciones, páginas), porque hace creer que toda la tienda lo
es. Se sacó de: el «Arma tu 3x2» (bloque i5 desactivado y la reseña de Camilo
C. fuera), el alt de las fotos de product.brillantes en .cl, la página
Materiales de las dos tiendas («resistente al sudor, perfume y calor»), la
colección Lentes de sol de .cl, y la descripción de Google de todas las
colecciones. Esta última la arregla el botón de Apariencia → «Textos de las
colecciones» (`admin/textos.js`): deja «Resistentes al Sudor y Calor». Una app
de anuncios (essentialAnnouncementMeta) copia la descripción de cada colección
dentro de las fichas, por eso la frase aparecía en el código de los brillantes.
Respaldo de los textos de antes en `branding/respaldos/`.

### Insignias

«Novedad» / «New», fondo `#111111`, texto `#FFFFFF`, posición 1, asignada a la
etiqueta `essentials` en las dos tiendas: 34 productos en .com y 34 en .cl.

### El campo `etiquetas` se añadió a mano

Las definiciones ya existían cuando se añadió la asignación por etiqueta, así
que el campo se creó desde Configuración → Metacampos y metaobjetos, en los
dos tipos y en las dos tiendas. El nombre tiene que ser **«Etiquetas»** a
secas: el admin deriva la clave del nombre, y «Etiquetas de producto» habría
dado `etiquetas_de_producto`, que no es la que lee la app. Pulsar «Crear lo
que falta» en el panel lo habría hecho igual.

### El emparejamiento es por id, no por handle

Primero se hizo por handle y la tienda en inglés se quedó sin nada: Shopify
traduce los handles (`anillo-signet` es `signet-ring` en /en/). El campo
calculado guarda ahora el **id y el handle** de cada producto, y tanto el
Liquid como el script preguntan primero por el id. Comprobado en las dos
tiendas y en los dos idiomas.

## Los beneficios también van sobre las fotos (5 nov 2026)

Además del bloque bajo el botón, los beneficios se pintan sobre las fotos de
la ficha, que es donde estaban en la referencia. Lo hace el mismo app embed de
las insignias, por las mismas razones: la galería del tema no admite bloques
de app dentro.

Reglas:

- **La primera foto se deja limpia.** Es la que manda y la que lleva la
  insignia. Los beneficios empiezan en la segunda.
- Van **arriba a la derecha**, con la píldora blanca y el icono de trazo fino.
- **El orden lo decide la app**, no la foto: no hay nada guardado por imagen.
  El primer beneficio cae sobre la segunda foto, el segundo sobre la tercera,
  y así. Cambiar o reordenar las fotos del producto no rompe nada.

Ajustes, en Personalizar → Configuración → Incrustaciones de apps → Insignias
de producto: encender o apagar, cuántas fotos llevan beneficio (3 de fábrica),
esquina, fondo, color del texto, redondeo, tamaño y separación del borde.

El JavaScript de la extensión tiene un tope de 10 KB que Shopify comprueba en
cada `deploy` (`AssetSizeAppBlockJavaScript`). Se rozó al añadir esto, así que
los comentarios largos del script se resumieron y el porqué completo quedó
aquí.

### Notas de sv-badges.js (11-nov)

Shopify exige que `sv-badges.js` (el JavaScript del bloque «Insignias», declarado en su schema)
pese como máximo **10000 bytes**. Cada `deploy` lo revisa (`AssetSizeAppBlockJavaScript`) y avisa
si se pasa. El 11-nov pesaba 10165 B y se bajó a ~8,9 KB acortando los comentarios; las
explicaciones completas quedaron aquí. Para medirlo antes de publicar:
`npx shopify theme check --path extensions/saint-venik`. `sv-filtros.js` (19 KB) no cuenta: se
carga con `<script src>` dentro del bloque, no desde el schema.

- Los datos llegan resueltos en el JSON del bloque: el script no pide nada a la red, solo coloca
  nodos. El grid se repinta sin recargar y no hay evento que avise: de ahí el `MutationObserver`,
  y que decorar se pueda repetir sin duplicar (marcas `svInsignias` / `svBeneficio`).
- El descuento vive en `sv-descuento.js`, que solo se carga si está encendido y llega después
  (los dos van con `defer`): se le espera con el evento `sv:descuento`, y si no llega (se corta la
  red), las insignias salen igual al `load`.
- Un app embed no tiene garantizado `product` en todos los temas: la ficha se saca de la URL.
- Los handles van entre barras (`|anillo|collar|`) para que «oro» no case con «collar-oro». Se
  busca primero por id, porque el handle se traduce («anillo-signet» / «signet-ring»).
- En el grid de una colección también vale la colección de la etiqueta (la lista de handles puede
  ir atrasada); fuera del grid y en la ficha, solo la lista de handles, que el panel mantiene al día.
- `anclar()`: sin contenedor posicionado, la insignia se iría a la esquina de la página.
- El alto de la etiqueta del tema se mide una vez por pasada: por tarjeta eran ochenta reflujos
  seguidos. Con el descuento encendido, la etiqueta «AHORRA» del tema está escondida y no cuenta;
  «Agotado» sí.
- En la tarjeta, el descuento va primero, arriba a la izquierda (donde estaba el del tema), y las
  insignias de la izquierda debajo, a la altura medida (crece con la letra del tema).
- En la ficha, la insignia va en todas las fotos (es un carrusel; así no desaparece al pasar). Con
  «segunda», en el computador el descuento sale solo en la segunda foto (reunión 9-nov, como Lost
  Gen); el resto lo esconde `sv-badges.css`.
- Tarjetas: clase del tema + atributo `data-product-handle`; solo con el atributo se colaban otros
  nodos.
- Beneficios sobre las fotos: uno por foto desde la segunda (la primera queda limpia). El svg es de
  la extensión (`innerHTML`); el texto es del comerciante (`textContent`).
- El observador ignora los nodos que pone el propio script (`sv-tags`, `sv-desc-precio`,
  `sv-benef-foto`); si no, cada insignia pintada provocaría otra pasada entera.

### Y el bloque de la ficha se quitó (5 nov 2026)

Con los beneficios ya sobre las fotos, la fila bajo el botón quedaba repetida,
así que el bloque «Beneficios» se sacó de las diez plantillas: las 7 de .cl y
las 3 de .com. Se quitó exactamente lo que se había añadido —la entrada del
bloque y su línea en `block_order`—, comprobado con un diff contra la versión
que estaba en vivo.

El bloque **sigue existiendo en la extensión**: si algún día se quiere la fila
de vuelta, se añade desde el editor de temas en Producto → Añadir bloque →
Apps → Beneficios, sin tocar código.

Comprobado después en las dos tiendas: cero filas bajo el botón, los tres
beneficios sobre las fotos 2, 3 y 4, la insignia sola en la primera, y el
selector de color y la guía de tallas intactos.

## Mejoras del panel (5 nov 2026)

### El desplegable que no se cerraba

`hidden` no ocultaba nada: `.resultados { display: flex }` es una regla de la
hoja de autor y gana a `[hidden] { display: none }`, que viene del navegador.
La misma trampa ya estaba parcheada para los avisos (`.aviso[hidden]`) y aquí
faltaba. Con eso, los dos cierres que el código ya intentaba empezaron a
funcionar. Además: cerrar vacía la lista, hay un único oyente de `pointerdown`
en captura para cerrar al pulsar fuera, Escape cierra todos, y la lista flota
en vez de empujar la tarjeta.

### Por qué iba lento

Abrir Beneficios en .cl eran **29 consultas, 27 en serie**, y unos 2.080 puntos
de cupo contra un balde de 1.000 que se recarga a 50/s. A mitad de camino
Shopify empezaba a responder `THROTTLED` y la espera por cupo era la mayor
parte del tiempo, no la red.

Tres causas y tres arreglos:

| Causa | Arreglo |
|---|---|
| La misma etiqueta se resolvía una vez por entrada: 13 páginas de productos donde bastan 4 | `gql` memoriza las lecturas repetidas mientras dura una pasada (`enUnaPasada`) |
| `revisarEstructura` encadenaba 12 consultas, 4 de ellas idénticas, y la llaman 5 de las 6 pantallas | Las comprobaciones se lanzan a la vez |
| El recálculo corría **antes** de pintar | Ahora corre después: la pantalla aparece y los números se ponen al día solos |

Las colecciones y las etiquetas de la tienda se guardan cinco minutos.

### Borde, transparencia e iconos propios

- **Insignias**: borde (color y grosor) y opacidad **por insignia**, porque
  dependen de ella; su fondo y su texto ya vivían ahí.
- **Píldoras sobre las fotos**: su aspecto pasa del editor de temas a la
  pantalla Beneficios, con muestra en vivo sobre un damero. Los ajustes del
  embed quedan de respaldo mientras la app no haya guardado nunca.
- El tipo de campo `color` de Shopify es hexadecimal de seis dígitos y **no
  admite alfa**: la opacidad es un número 0-100 aparte y el rgba se compone al
  pintar, en Liquid con `color_modify` y en el panel con la misma cuenta.
  Cuidado con `divided_by` entre enteros, que da cero y lo dejaría todo
  invisible sin ningún error.
- **Iconos propios**: campo `icono_imagen` en `sv_beneficio`. Manda sobre el
  dibujado, igual que la imagen de la muestra manda sobre el color. Un SVG no
  es `MediaImage` para Shopify, así que sube por la rama de archivo genérico.
  Aviso que da la pantalla: una imagen se muestra con sus propios colores; los
  iconos dibujados siguen al color del texto.

Los controles nuevos no aparecen hasta que la tienda tiene los campos: hay que
pulsar **«Crear lo que falta»** una vez en cada tienda después de este cambio.

## La barra en el iPhone (8 nov 2026)

En el computador la barra de carga se veía; en el iPhone, no. Dos razones:

- **Safari congela las animaciones CSS de la página que se deja** en cuanto
  se toca un enlace. La barra era una transición CSS que arrancaba con el
  toque, así que en el iPhone se quedaba quieta e invisible mientras cargaba
  la página siguiente.
- **Safari no tiene reglas de especulación**, así que no precarga nada: cada
  cambio de página carga de verdad, y por eso se siente más lento que en
  Chrome, donde la página ya viene precargada.

Arreglo (`transiciones.liquid`): en los navegadores sin reglas de
especulación (`HTMLScriptElement.supports('speculationrules')` falso), la
barra sale al instante con el toque, sin el cuarto de segundo de espera, y
avanza a pasos de 60 ms desde JavaScript (`setTimeout`, no CSS): ~20 % al
segundo, ~35 % a los dos, tope 90 %. Al irse pasa su avance real (mínimo
30 %) y la página nueva la termina como siempre. Chrome sigue igual.

Se probó primero solo en vista previa y el usuario lo confirmó en su iPhone el
8-nov: desde entonces vale **para todos** (se quitó la condición de `sv-vista`
en `lento`). Para probar ese camino en Chrome, poner
`sessionStorage['sv-lento'] = '1'` en la pestaña.

## Cómo funciona el cambio de página (embed «Transiciones»)

Este texto vivía arriba de `transiciones.liquid`; se movió aquí el 8-nov para
liberar espacio en el tope de 100 KB de Liquid de la extensión.

```text
Calcado de louisvuitton.com (llamada del 6-nov, minuto 0:25 del video): al
tocar un enlace sale arriba una barra gris muy fina que se llena lento y
parejo, el encabezado no se mueve y solo cambia lo de abajo. Cuatro piezas,
todas sin dependencias:

  1. La barra. Sale un cuarto de segundo despues del toque (si la pagina
     llega antes, ni aparece) y se llena hacia el 90 % con la curva medida
     en el video: 20 % al segundo, 35 % al segundo y algo. Al irse, la
     pagina guarda por donde iba; la nueva la recoge ahi y la termina. Se
     lee como una sola barra aunque son dos documentos.
  2. El fundido: `@view-transition { navigation: auto }`, la transicion
     entre documentos del propio navegador. Donde no existe (Firefox), la
     pagina cambia como siempre y la barra sigue funcionando.
  3. Lo quieto: durante el cambio, la cuenta regresiva y el encabezado
     llevan nombre (view-transition-name), y el navegador los deja en su
     sitio en vez de fundirlos con el resto. Solo si estan a la vista.
  4. La precarga: reglas de especulacion. Al apoyar el dedo o el raton
     sobre un enlace, el navegador ya pide esa pagina. El carrito, la
     cuenta y el pago quedan fuera.

Es un embed de <head> porque todo eso tiene que estar antes del primer
pintado de la pagina nueva.

Todo se controla desde la app (pantalla Apariencia). Tres estados, como el
descuento: 'si', 'no' y 'prueba' (solo con ?sv-vista=1).
```

### Segundo intento y diagnóstico (8 nov 2026)

Con lo anterior el usuario seguía sin ver la barra en su iPhone. Lo más
probable: el código solo escuchaba el evento `navigate` cuando el navegador
tiene la Navigation API, y se saltaba el clic. Si Safari no da ese evento en
los enlaces normales, la barra no arranca y la página nueva no recibe nada que
terminar. Ahora, en el camino de Safari, se escuchan los dos (con una guarda de
400 ms para no arrancar dos veces), y Safari se reconoce también por el motor
(`AppleWebKit` sin `Chrome`), por si un día entiende las reglas de
especulación pero sigue congelando las animaciones.

Para ver qué pasa en un teléfono sin herramientas: `?sv-diag=1` carga
`assets/sv-diag.js` (desde una línea en `transiciones.liquid`) y pinta abajo
una caja con lo que pasa en cada cambio de página: qué sabe el navegador
(`spec`, `nav`, `vt`), si llega el toque (`CLICK`, `NAVIGATE`), si sigue
pintando después (`cuadros`), qué avance se guarda y se recoge (`guarda`,
`trae`) y dónde queda la barra (`op`, `x`, `top`). Una captura de pantalla de
esa caja basta. `?sv-diag=0` la quita.

### La barra va bajo la cabecera (8 nov 2026)

El diagnóstico en el iPhone del usuario dio `TOQUE: SI · PASA: 0.300 ·
NUEVA: SI` y la barra roja se veía: la lógica funcionaba. Lo que fallaba era
dónde estaba: `top: 0`, una línea gris de 2 px encima de la cuenta regresiva
negra, pegada a la barra de estado del iPhone. El usuario pidió que fuera
bajo la fila del logo, el buscador y el carrito, como en Louis Vuitton.

`laBarra()` la coloca ahora en el borde inferior de `#SiteHeader` (193 px en
el teléfono, 182 en el computador, con la cuenta regresiva y el aviso
encima). Si la cabecera no se ve porque se bajó en la página, va arriba del
todo. En la página nueva se recoloca en `DOMContentLoaded`, por si se pintó
antes de que existiera la cabecera. Vale para todos, no solo para el iPhone.

### Notas del código de «Transiciones» (sacadas del Liquid el 10-nov para ahorrar espacio)

- La barra pasa por encima del cambio de página tal cual está, sin fundirse.
- `guardar()` ignora el error de sessionStorage en navegación privada.
- En vista previa el fundido se enciende desde el propio embed.
- Con el menú o el carrito abiertos, la barra va bajo el encabezado del cajón y
  de su ancho: si no, cruza el menú por la mitad (video del 9-nov).
- `void b.offsetWidth`: que la animación arranque desde cero aunque ya estuviera.
- Si la navegación no ocurre, la barra no se queda colgada (tiempo máximo).
- Al irse se guarda por dónde iba la barra, para que la página nueva siga de ahí;
  mínimo 30 %, porque con precarga la página llega antes de que salga.
- Solo cuentan navegaciones de verdad a otra página de la tienda; también las que
  hace un script (`location.href = …`). Se mira al final de la burbuja: si el
  tema canceló el clic, no hay navegación.
- La página nueva recoge la barra donde quedó y la acaba; si se pintó antes de
  existir la cabecera, se recoloca.
- Lo que no se mueve al cambiar de página, si está a la vista, no se funde.
- Si el navegador se salta la transición, el rechazo no sale en la consola.
- Volver atrás restaura la página tal cual estaba, con la barra a medias.

## Estilo del descuento (snippet sv-desc-estilo)

Descuento en la ficha: lo que tiene que estar antes del primer pintado.
El precio un poco mas chico y el porcentaje un poco mas grande (llamada del
8-nov: el precio se comia al porcentaje), y el «AHORRA» del tema escondido.
Si llegara al final de la pagina, el precio se veria grande un instante y
despues encogeria. Por eso sale desde el embed de <head> (transiciones), y
tambien desde el de insignias por si alguien apaga ese: repetido no molesta.
En 'prueba' manda la clase que pone sv-descuento.js, solo con ?sv-vista=1.
Recibe `cfg`, la entrada de sv_configuracion.

Colores de los precios (reunión del 9-nov): precio tachado en gris y precio de oferta en rojo, en las tarjetas (`.grid-product__price--original` / `--original2`) y en la ficha (`.product__price--compare` / `.product__price.on-sale`). Viven en `sv_configuracion_2` (`precio_colores` si/no, `precio_oferta`, `precio_tachado`); se cambian en la app, Insignias → Descuento. Vacío o 'no' = los colores del tema.

## El descuento en insignias (bloque insignias)

El porcentaje a secas, como en Lost Gen Club, en vez del «AHORRA 14%» del tema. No se calcula en Liquid: el tema ya pone el porcentaje en la tarjeta y junto al precio, y lo cambia al elegir otra variante, así que el script lo lee de ahí. El bloque solo decide si sale, dónde y cómo. Tres estados en texto (`desc_activo`): 'si' lo ve todo el mundo; 'prueba' solo quien abre la tienda con ?sv-vista=1; 'no' nada, el tema sigue con lo suyo.

En la ficha, en el computador (`desc_foto_compu` en sv_configuracion_2): 'segunda' = el descuento solo en la segunda foto (reunión 9-nov, como Lost Gen); 'todas' = en todas. En el teléfono va siempre en todas. sv-badges.js marca con `.sv-tag--movil` las que no son la segunda y sv-badges.css las esconde desde 769 px.

## Menú del teléfono (snippet sv-menu)

Como gasper.co (reunión 9-nov): cada colección del menú principal (`main-menu`) en una tarjeta gris #f2f2f2 de 80 px con la foto de la colección a la derecha; lo que no es colección (Contacto, Ingresar) queda como enlace simple. Arriba, el logo de la cabecera a la izquierda y la X sin recuadro. El snippet solo pasa el estado (`menu_tarjetas` en sv_configuracion_2: si/no/prueba, vacío = prueba) y el mapa ruta → foto; el resto vive en assets/sv-menu.css y sv-menu.js, que arman el cajón #NavDrawer de Impulse sin tocar el tema. Las fotos se piden al tocar el botón del menú (o un rato después de cargar), no con cada página.

## Colecciones del inicio (snippet sv-inicio)

Reunión del 9-nov: la cuadrícula de colecciones del inicio (sección promo-grid2: Cadenas, Pulseras, Colgantes, Anillos) se queda como está, una debajo de otra; solo cambian el fondo y las fotos. El fondo blanco donde van las fotos, con su borde blanco alrededor de cada una, pasa a negro. Las fotos normales van como las de jaxxon.com (joya sobre degradado oscuro de estudio) y se cambian en el editor del tema, en cada tarjeta de la cuadrícula. Las de Navidad, como las de craftdlondon.com (terciopelo rojo y cintas de satín), van en el metacampo de colección `custom.foto_navidad` («Foto de Navidad», lo crea «Crear lo que falta»).

- Estado del fondo negro: `categorias_inicio` en sv_configuracion_2 (si/no/prueba, vacío = prueba; con prueba solo se ve con ?sv-vista=1). Temporada: `temporada` (normal/navidad). Las dos en la app, Apariencia → «Inicio: colecciones».
- En Navidad, cada tarjeta cuyo enlace va a /collections/<handle> toma la «Foto de Navidad» de esa colección como fondo (CSS :has, sin JavaScript, antes del primer pintado) y esconde la foto normal sin descargarla. Solo se revisan estos handles: cadenas, pulseras, colgantes, anillos, conjuntos, best-sellers. Una colección sin «Foto de Navidad» sigue con la normal.
- Un intento anterior (carrusel horizontal tipo «Shop by Category») se descartó el mismo día: la disposición no cambia.
- Banner «Tu cadena de cada día» (mismo snippet, solo en el inicio, siempre activo): foto del velero recortada sobre la cadena (460 px de alto en el teléfono, 560 px con zoom 1,3 en el computador; solo si la imagen es la del velero, `src*="185102"`; con la foto nueva `cadena-dia` el alto en el computador crece con la pantalla, entre 560 y 760 px, para que la cadena entera quepa hasta 1920 px), degradado oscuro (abajo en el teléfono, a la izquierda en el computador), botón blanco chico con esquinas de 7 px como la píldora «Garantía de por vida», sin los espacios blancos de arriba y abajo (incluidas las secciones de apps vacías del tema, `.index-section:has(>.page-width:empty)`), y el texto entra con un fundido al llegar a la vista (clase `sv-ani` / `sv-visto`). Vale para `.hero-banner` (.cl) y `.sv-hero-daily` (.com).

## Portada de las colecciones en el computador

Desde el 9-nov la portada (foto con el título encima, clic para abrir la descripción) también va en el computador: franja de 300 px a todo el ancho, título, flecha y descripción a la izquierda sobre un degradado lateral (la joya suele estar al centro), y la altura del encuadre de cada foto en `--sv-y` (sv-portada.css, bloque `min-width: 768px`). sv-portada.js ya no se limita al teléfono (`matchMedia('all')`). El teléfono no cambió.

## Banners de Navidad de las colecciones

Desde el 9-nov cada foto de verano de las páginas de colección (`coleccion_<foto>.jpg`, puesta a mano en el bloque «Contenido personalizado» de cada plantilla) tiene una versión de Navidad: `sv-navidad-portada-<foto>.jpg`, con `<foto>` en cadena, pulsera, anillos, colgantes, conjuntos o essentials. Las hizo Nano Banana Pro con el Generador interno, en 21:9 (el mismo formato que la franja del teléfono). Son joyas sobre terciopelo rojo, como CRAFTD, pero con otra disposición que las fotos de Navidad del inicio (filas horizontales, no un montón en diagonal) y con otras joyas:

- Cadena: Rope Oro 4mm, Fígaro 5mm y Tennis 3mm. También la ven las colecciones generales, que usan la foto de cadena (menos Best Sellers, que tiene la suya).
- Pulsera: Red Clover Oro, Black Clover y Brazalete Iconic Oro.
- Anillos: Signet, Black Hades Oro y Hermés Oro, acostados.
- Colgantes: Vault Red Oro, Florence y Compass II Oro.
- Conjuntos: Fleur de lis Rope Set Oro y Compass II Miami Cuban 5mm Set.
- Essentials: Vault Green Oro, Pulsera Sfera y White Capri Oro.
- Best Sellers (`sv-navidad-portada-bestsellers.jpg`): sus más vendidos (Cadena Miami Cuban 5mm, Faith Pendant Oro, Pulsera Miami Cuban 5mm y Vault Blue Pendant Oro) colgados de un rollo de terciopelo. En verano Best Sellers usa la foto de cadena, así que sv-portada.liquid elige este archivo en lugar del de cadena solo cuando `collection.handle` es best-sellers. En el teléfono el título va arriba, como en Colgantes y Conjuntos.

El botón «Preparar las fotos de Navidad» del panel las lleva a Archivos desde `admin/fotos-inicio/`, reemplazando si ya estaban. No hace falta tocar las plantillas: `snippets/sv-portada.liquid` busca cada archivo por nombre (`images[...]`). Si la temporada es Navidad, esconde la foto de verano desde el primer pintado y le cambia el `src` al cargar. Así los encuadres por foto (`--sv-y`, `--sv-encuadre`) son los de la foto de Navidad. Con `?sv-navidad=1` se ve antes de encender la temporada (queda en la sesión; `?sv-navidad=0` lo quita). Desde el 9-nov la misma llave también muestra las fotos de Navidad del inicio (`sv-inicio.liquid` saca sus reglas con `html.sv-nav` delante mientras la temporada sea Normal); el carrito vacío, que es del tema, no tiene vista previa. Las originales están en `branding/colecciones-inicio/navidad/portadas/`.

## «El regalo Nº1 para él» (sección de Navidad del inicio)

Pedida por Benjamín en la reunión del 9-nov. Va en lugar del 3x2, que era el primer bloque de la cuadrícula de colecciones y quedó oculto. Muestra «el regalo Nº1 para él» y «la marca Nº1 de joyas para hombre», con un botón «Comprar ahora» a Best Sellers. El fondo es un degradado como el de Jaxxon, pero burdeo, y la foto (pedido del usuario, 9-nov noche) es la Cadena Tennis 5mm en curvas sueltas con el Anillo Signet, y la caja negra SV con la bolsita de cuero al costado, cortadas por el borde y de tamaño real. La versión anterior (las Miami Cuban amarradas con un lazo) quedó en `branding/colecciones-inicio/navidad/regalo-lazo.jpg`. La foto es `sv-regalo-navidad.jpg`, hecha con Nano Banana Pro; la original está en `branding/colecciones-inicio/navidad/regalo.jpg`.

- **Bloque de la app:** `blocks/regalo.liquid` (target section, solo en el inicio) con estilos en `assets/sv-regalo.css`. Está en una sección «Apps» (`sv_regalo`, `full_width` sí y `space_around` no) de `templates/index.json`, justo después del video y antes de `promo-grid2`, en las dos tiendas.
- **Cuándo se ve:** solo con la temporada en Navidad o con `?sv-navidad=1` (clase `html.sv-nav`, que pone `sv-inicio.liquid`). En temporada Normal el HTML sale oculto y la foto no se descarga (`loading=lazy` con `display:none`).
- **Textos:** salen de `locales/` (es/en). El editor del tema permite cambiarlos, cambiar el enlace (vacío = Best Sellers del idioma) y la foto.
- **Foto:** el botón «Preparar las fotos de Navidad» del panel la lleva a Archivos.

## Fotos del inicio, segunda versión (9-nov, feedback de Benjamín y Alfonso)

Las fotos se rehicieron con Nano Banana Pro con otro estilo. El realismo y la luz sobre el metal se toman de la referencia de Alfonso (`branding/colecciones-inicio/para-nano-banana/referencias/realismo-alfonso.jpg`: joyas sobre negro brillante, cada eslabón nítido, brillos y reflejos de estudio). El fondo es el de la tarjeta «Bracelets» de Jaxxon: negro con un tinte azul acero y haces de luz que entran por una esquina.

Qué cambió en cada foto:
- **Cadenas:** las mismas Cuban 8mm, oro y plata, cruzadas.
- **Pulseras:** las mismas (tennis 5mm y Cuban 8mm de oro y de plata), ahora SEPARADAS y paradas en fila.
- **Colgantes:** Vault Blue Oro, Crucifix (plata) y Cross Minimal Oro, en orden oro–plata–oro.
- **Anillos:** los mismos (Eros Oro, Box y Roman XI), ahora acostados.

Las anteriores quedaron en `branding/colecciones-inicio/v1/`. El carrito vacío usa los mismos archivos (`sv-inicio-<colección>.jpg`).

## Menú del teléfono: fotos en uso y carga temprana (9-nov)

Cada tarjeta del menú usa `sv-menu-<colección>.jpg` si existe en Archivos; si no, la imagen de la colección. Las colecciones de Essentials usan la clave `essentials`. Son recortes cuadrados de las fotos de modelo de los banners de colección, más una de Best Sellers generada en uso, y los lleva a Archivos el botón «Traer las fotos nuevas a Archivos». El mapa por colección (`svMenu.h`) también sirve en .com, donde el menú no sale de la lista de Shopify.

`sv-menu.js` ahora carga async y arma el cajón apenas está entero (ya hay algo después de #NavDrawer), sin esperar a que se lea toda la página. Las fotos se piden al terminar de cargar la página o con el primer toque. Antes se armaba al terminar de leer la página y las fotos llegaban 4 s después de cargar, así que entrando directo a una colección pesada con un teléfono lento, el menú salía sin armar o con las fotos vacías.

## Título del banner siempre abajo en el teléfono (9-nov)

Pedido del usuario: en el teléfono, el título de la portada de cada colección va siempre abajo, en todas las páginas. Antes Colgantes y Conjuntos lo tenían arriba, y eso se quitó de sv-portada.css. Donde el título tapaba la joya, el título no se mueve: se cambia la foto. Cada caso tiene una versión para el teléfono, alargada hacia abajo con Nano Banana Pro (más pecho y camisa, o más terciopelo) y recortada a la proporción del banner del teléfono (≈2,3:1), con la joya arriba:

- **Verano:** `sv-portada-movil-<foto>.jpg` (pulsera, colgantes, conjuntos). La sube «Traer las fotos nuevas a Archivos».
- **Navidad:** `sv-navidad-portada-<foto>-movil.jpg` (cadena, pulsera, colgantes, conjuntos, essentials, bestsellers). La sube «Preparar las fotos de Navidad».

`sv-portada.liquid` las busca por nombre y en el teléfono cambia el `src` (en verano con la clase `html.sv-pm`, en Navidad con `html.sv-nav`). La foto se esconde hasta que la nueva cargó. En el computador no cambia nada. Las originales están en `branding/colecciones-inicio/movil/`.

## Fotos del inicio, tercera versión (9-nov, noche)

Corregidas tras el feedback del usuario. Las de la segunda versión quedaron en `branding/colecciones-inicio/v2/`.

- **Cadenas:** las dos Cuban 8mm completas, separadas y colgando en U, con el SV del broche legible.
- **Anillos:** Eros Oro, Box y Signet (el Signet reemplaza al Roman XI, cuyas letras no salían fieles).
- **Pulseras:** la misma composición (las tres paradas en fila y separadas), más realista.
- **Colgantes:** acostados sobre negro brillante, cámara baja, en orden oro–plata–oro.

La foto de Navidad de Colgantes del inicio ahora tiene los mismos tres (Vault Blue Oro, Crucifix y Cross Minimal Oro).

## Menú del teléfono: fotos de Daniella (9-nov, noche)

Siguiendo el feedback de Benjamín («fotos icónicas de producto en uso, de las de moda que subió Daniella»), cuatro tarjetas del menú ahora usan recortes cuadrados de las fotos en uso de las fichas de producto (archivos con «USO» en el nombre):

- **Essentials:** Vault Red Pendant.
- **Best Sellers:** Faith Pendant Oro.
- **Pulseras:** Red Clover Oro.
- **Colgantes:** Florence Pendant.

Daniella no tiene fotos en uso de Cadenas, Anillos ni Conjuntos, así que esas tres siguen con los recortes de las fotos de modelo en el barco. Las versiones anteriores quedaron en `branding/menu/v1/`.

## Menú del teléfono: fotos elegidas por el usuario (9-nov, noche)

El usuario mandó siete fotos en uso, una por tarjeta del menú, que valen igual en verano y en Navidad:

| Tarjeta | Foto |
|---|---|
| Best Sellers | colgante brújula dorado y anillo Eros |
| Essentials | placa dorada sobre fondo oscuro |
| Anillos | Roman en la mano |
| Colgantes | colgante verde |
| Pulseras | pulsera de cruz |
| Cadenas | tennis |
| Conjuntos | dos Cuban plateadas |

Se recortaron en cuadrado (480 px), con la joya al centro, como `sv-menu-<clave>.jpg`. La de Anillos va con más zoom (420 px, recorte de 210 px de la foto original) para que el anillo se vea bien en la tarjeta de 80 px. Los originales están en `branding/menu/originales/` y la versión anterior en `branding/menu/v2/`.

### 3x2 en inglés en .com (11-nov)

.com tiene el español por defecto y el inglés en `/en/`. El «Arma tu 3x2» salía entero en
español en `/en/pages/arma-tu-3x2` (textos de las secciones `sv3-*`, nombres de producto,
«Oro», pastillas de filtro). Arreglado solo en el tema en vivo de .com (#161295269935):

- **Snippet `sv3-t`** (nuevo): recibe un texto en español de una sección y, si la página va en
  inglés (`request.locale.iso_code == 'en'`), devuelve su inglés de la lista; si no está en la
  lista, lo deja igual. Las 9 secciones `sv3-*` pasan cada texto por él
  (`{% render 'sv3-t', t: s.title %}`). En español no cambia nada.
  **Si se cambia un texto en español en el editor del tema, hay que agregar su inglés en
  `snippets/sv3-t.liquid`** (la clave va sin saltos de línea; un salto en el inglés se arma con
  `| append: nl |`). Copia de lo subido: `branding/tema-com-3x2-ingles/`.
- **`assets/sv-3x2.js`**: pide colecciones, productos y fichas con `Shopify.routes.root` delante
  (`/en/…` en inglés), así los nombres llegan traducidos; reconoce «(Gold)» y «gold/silver»
  para juntar la versión de oro y la de plata, y quita también «stainless steel / sterling
  silver» de las descripciones (como ya hacía con «acero inoxidable»).
- App (embed «Filtros rápidos»): las pastillas del 3x2 usan `nombre_en` en inglés y
  `sv-filtros-3x2.js` pide los productos con la misma raíz.
- Respaldo de lo anterior: `branding/respaldos-tema/2026-11-11-3x2-ingles-com/`.

Comprobado: /en/ todo en inglés (portada, barra, grilla, bandeja, incluye, reseñas, cierre),
filtros Chains y Gold funcionan igual que en español (49 joyas con dos metales, 31 en oro), y
/pages/arma-tu-3x2 sigue igual en español.

### Menú «Filter» de las colecciones en inglés (11-nov)

Los filtros de la app (`sv_color`, `sv_categoria`, `sv_tipo`) tienen nombre y valores en
español (Categoría, Tipo, Dorado, Cadenas, Cubanas…). En `/en/`, `sv-filtros.js` los pasa al
inglés al pintar el menú (Category, Type, Gold, Chains, Cuban, Iced, Pearls, Tennis…). El valor
que se envía al filtrar sigue siendo el español, así que filtrar funciona igual.

### Muestras de las gemas Vault (11-nov)

Las 4 gemas (colores NEGRA, VERDE, AZUL, ROJA con etiquetas `gema-*`, distintos de los cordones
de Capri) tenían un color plano. Ahora llevan una imagen con el mismo degradado del plateado y
el dorado, en los colores sacados de las fotos reales (rubí, zafiro, ónix, esmeralda):
`branding/muestras-gemas/` y publicadas en `admin/muestras/`. Se pusieron con el panel →
Colores → «Desde un enlace…» (nuevo: pegas la dirección de una imagen y Shopify la trae a
Archivos), en las dos tiendas.

### Selector en dos filas para Clover y Green/Red Gem (11-nov)

- **Clover** (10 pulseras: negro, rojo, azul, blanco y verde, cada una en plata y oro, en las dos
  tiendas): arriba el metal, abajo «Trébol» / «Clover» con **color liso** (como los cordones de
  Capri, pedido del usuario). Colores nuevos en el panel → Colores, etiquetas `trebol-negro`
  #171717, `trebol-rojo` #7c3738, `trebol-azul` #2b4f7a, `trebol-blanco` #e3e1e0 (nácar),
  `trebol-verde` #1d6651, sacados de las fotos de producto.
- **Muestras metalizadas de las Clover (11-nov, segunda vuelta):** el usuario pidió que las cinco
  se vieran metalizadas, y que la blanca y la verde copiaran el diseño de la cara del trébol.
  - Negro, rojo y azul: el brillo del dorado (GOLD.webp) pasado a cada color, como las gemas Vault.
  - Verde: malaquita con rayas rectas y paralelas, algo inclinadas, en verde esmeralda y verde
    oscuro, como en la foto.
  - Blanco: nácar lechoso con nubes grises y un tornasol suave (rosa, lila, celeste, menta, durazno).
  - Archivos: `admin/muestras/TREBOL-<NEGRO|ROJO|AZUL|VERDE|BLANCO>.webp`. Copia y vista
    comparada con las fotos en `branding/muestras-trebol/`.
  - Se cargaron en las dos tiendas con panel → Colores → «Desde un enlace…» y
    `https://benyi-aa.github.io/saint-venik-app/admin/muestras/TREBOL-….webp`.
  - El color liso queda debajo como respaldo: si se quita la imagen, vuelve a verse.
- **Green Gem / Red Gem** (4 pulseras): abajo «Gema» con las mismas muestras degradadas de los
  Vault (`gema-verde`, `gema-roja`).
- En .cl la Red Gem de plata tenía también la etiqueta `oro` por error: se le quitó.
- Familias unidas con el botón nuevo del panel → Productos: buscar («Clover», «Gem») y
  «Unir estos N en una familia» (dos clics; hasta 11 joyas).

### Archivados (11-nov, a pedido del usuario)

- Colgantes agotados: Aurelio's Cross, Patron Tag (plata y oro), Savage Tag, Bar Pendant Oro,
  Cross Faith, Roma Cross y Fleur de lis Oro Pendant — en .cl los 8; en .com solo existía Bar
  Pendant Oro Pendant (borrador).
- Conjuntos Fleur de lis (Rope, Miami 5mm, Miami 3mm y OT Fígaro, todos Oro): en las dos tiendas.

### Insignia «Más vendido» (13-nov, video de Benjamín)

Pedido en video («Agregar etiqueta más vendido a productos»): poner «Más vendido» a los
productos que va señalando en Cadenas, Pulseras y Colgantes de .cl, **salvo los que ya
llevan «Novedad»** (no pueden ser las dos cosas; abajo de la de novedad «no quedaría bien»).
Referencia visual: Lost Gen Club, rótulo negro debajo del % rojo, igual que nuestra Novedad.

- Panel → **Insignias** → nueva «Más vendido» / «Best seller», fondo #111111, texto
  #FFFFFF, activa, en .cl y .com.
- Productos sueltos (16, los mismos en las dos tiendas):
  - Cadenas: Miami Cuban 5mm, Cuban Link 8mm, Cuban Link Oro 8mm, Rope 3mm.
  - Pulseras: Miami Cuban 5mm, Cuban 8mm, Cuban Oro 8mm, Black Clover, Black Clover Oro,
    Green Clover Oro, Rope 3mm, Rope Oro 3mm.
  - Colgantes: Crucifix Pendant, Crucifix Pendant Oro, Void Onyx Pendant Oro,
    Cross Minimal Pendant Oro.
- Etiquetas: **`-essentials`** (resta). Novedad sale de la etiqueta `essentials`, así que
  si algún día uno de estos pasa a ser novedad, pierde «Más vendido» solo.
- Quedaron fuera por tener Novedad aunque los señaló: Pulsera Faith, Giglio, Eclissi,
  Viper 4mm, White Capri Oro y Vault Blue Pendant.
- Dudoso: al final de colgantes dice «este» justo al pasar de Cross Minimal Oro a
  **Compass II Pendant** (plata); no se le puso. Se agrega en el panel si lo confirma.
- Truco del buscador de productos del panel: la lista de resultados se corta al borde de
  la tarjeta y a veces solo se ve el primero. Se puede escribir sintaxis de búsqueda de
  Shopify: `Cadena Rope 3mm* -title:*Oro` deja solo la de plata.
