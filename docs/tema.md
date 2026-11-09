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
- Banner «Tu cadena de cada día» (mismo snippet, solo en el inicio, siempre activo): foto del velero recortada sobre la cadena (460 px de alto en el teléfono, 560 px con zoom 1,3 en el computador; solo si la imagen es la del velero, `src*="185102"`), degradado oscuro (abajo en el teléfono, a la izquierda en el computador), botón blanco chico con esquinas de 7 px como la píldora «Garantía de por vida», sin los espacios blancos de arriba y abajo (incluidas las secciones de apps vacías del tema, `.index-section:has(>.page-width:empty)`), y el texto entra con un fundido al llegar a la vista (clase `sv-ani` / `sv-visto`). Vale para `.hero-banner` (.cl) y `.sv-hero-daily` (.com).

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
