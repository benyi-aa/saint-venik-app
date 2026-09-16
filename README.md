# Saint Venik · Color & Size Picker

App de Shopify para saintvenik.com. Sustituye a OPTIS Color Swatch y a Kiwi Size
Chart por algo propio, editable desde un panel y sin depender del soporte de
nadie.

Tienda: saintvenik.com · Tema: Impulse 7.5.1 · Idiomas: español e inglés (`/en/`)

## Cómo está armada

No hay servidor, ni base de datos, ni tokens guardados en ninguna parte. Las tres
piezas:

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| Panel | `admin/`, publicado en GitHub Pages | Donde se edita todo. Habla con la Admin API desde el navegador. |
| Bloques | `extensions/saint-venik/` | Lo que ve el cliente. Liquid puro, sin JavaScript para lo esencial. |
| Datos | Metaobjetos y metacampos de Shopify | La fuente de verdad. Ni el panel ni los bloques guardan nada propio. |

Lo que hace posible el panel sin servidor es el acceso directo a la Admin API:
App Bridge autentica cada petición con la sesión del usuario que está mirando la
página. Por eso el panel **solo funciona dentro del admin** — abierto suelto no
tiene con qué autenticarse, y lo dice en vez de fallar raro.

Los archivos del panel son estáticos y sin paso de compilación, a propósito:
se abren, se leen y se despliegan copiándolos.

## Los bloques

| Bloque | Estado | Lee |
|---|---|---|
| Selector de color | funcionando | `custom.hermano_de_color` + metaobjeto `color` |
| Selector de talla | funcionando | las variantes reales del producto |
| Guía de tallas | pendiente | — |

Los colores no son variantes: son productos separados que se apuntan entre sí.
Un producto se asocia a su color por la etiqueta (`oro`, `acero-inox`), que es lo
que guarda el campo `etiqueta` del metaobjeto.

## Trabajar en esto

```bash
npm install
npm run deploy      # publica los bloques
git push            # publica el panel (GitHub Pages)
```

Comprobar el Liquid sin desplegar:

```bash
npx shopify theme check --path extensions/saint-venik -C theme-check:theme-app-extension
```

Los pasos manuales sobre el tema están en [docs/tema.md](docs/tema.md).

## Cosas que cuesta redescubrir

- El UUID que va en la referencia de un bloque es el `uuid` de registro de
  `.shopify/deploy-bundle/manifest.json`, **no** el `uid` de
  `shopify.extension.toml`. Se parecen. Con el equivocado el bloque no se dibuja
  y no da ningún error.
- `use_legacy_install_flow = true` impide instalar una app sin servidor: ese modo
  usa el OAuth antiguo y necesita un backend que atienda el callback.
- Shopify no instala una app con `scopes = ""`; hace falta al menos un permiso.
