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
