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
