# Saint Venik · App de tienda

App **extension-only**: no hay servidor ni base de datos. Todo ocurre en el
storefront con Liquid, y los datos viven en metacampos y metaobjetos nativos
de Shopify que ya existen en la tienda.

Tienda: saintvenik.com · Tema: Impulse 7.5.1 · Idiomas: español (por defecto) e inglés (`/en/`)

## Estructura

```
shopify.app.toml                 configuración de la app (sin scopes, install flow legacy)
extensions/saint-venik/
  shopify.extension.toml         la theme app extension
  blocks/selector-color.liquid   BLOQUE 1 · selector de color entre hermanos
  snippets/sv-color-swatch.liquid una muestra de color
  assets/sv-color-selector.css   estilos del bloque 1
  locales/                       textos de la extensión (es / en)
```

## Datos que consume

| Dato | Dónde vive | Uso |
|---|---|---|
| `custom.hermano_de_color` | metacampo de producto, lista de referencias a producto | qué productos son el mismo modelo en otro color |
| metaobjeto `color` | entradas ORO y PLATEADO | `nombre`, `muestra`, `imagen_muestra`, `etiqueta` |
| etiquetas de producto | `oro`, `acero-inox` | unen cada producto con su entrada de color |

El bloque 1 empareja producto ↔ color comparando las etiquetas del producto con
el campo `etiqueta` del metaobjeto. El orden de las muestras es el orden de las
entradas del metaobjeto, así que es idéntico en todas las fichas. Los enlaces
usan `product.url`, que ya trae el prefijo `/en/` cuando el visitante navega en
inglés, y los nombres de color salen ya traducidos porque Shopify devuelve el
metaobjeto en el idioma activo.

## Puesta en marcha

```bash
npm install
npm run link      # crea o enlaza la app y escribe client_id en shopify.app.toml
npm run deploy    # publica la extensión
```

Después, en el editor de temas: **Producto → Añadir bloque → Apps → Selector de color**.

Para probar en vivo sin publicar, `npm run dev` levanta una vista previa del tema
con la extensión conectada.

## Comprobar el Liquid sin desplegar

```bash
npx shopify theme check --path extensions/saint-venik -C theme-check:theme-app-extension
```

## Pendiente

- Bloque 2 · selector de talla leyendo las variantes reales, con estado agotado.
- Bloque 3 · guía de tallas (anillos, cadenas y colgantes, pulseras) con bloques
  bilingües y casillas independientes de visibilidad por idioma.
