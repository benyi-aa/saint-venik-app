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

## Dos tiendas, dos registros de la misma app

saintvenik.com y saintvenik.cl están en **organizaciones de Shopify distintas**,
y una app del Dev Dashboard solo se instala en tiendas de su propia
organización. Por eso el mismo código está registrado dos veces:

| Tienda | Organización | App en el Dev Dashboard | Configuración |
|---|---|---|---|
| saintvenik.com (`vd9tn0-et`) | Saint Venik World (224321345) | Color & Size Picker | `shopify.app.toml` |
| saintvenik.cl (`saint-venik`) | Saint Venik (73555994) | Color & Size Picker | `shopify.app.cl.toml` |

El panel es uno solo: `admin/index.html` elige el client id según la tienda que
lo abre. Los bloques de cada tienda llevan el uuid de su propio registro, así
que **las plantillas de un tema no se pueden copiar tal cual de una tienda a
otra**: hay que cambiar el uuid (ver `docs/tema.md`).

## Trabajar en esto

```bash
npm install
npm run deploy:com  # publica los bloques en saintvenik.com
npm run deploy:cl   # publica los bloques en saintvenik.cl
git push            # publica el panel para las dos (GitHub Pages)
```

Todo cambio en los bloques se publica **en las dos**. Un `shopify app deploy` sin
`--config` usa la configuración activa del CLI, que puede ser cualquiera de las
dos: usar siempre los scripts.

Para llevar las guías a una tienda nueva, el panel ofrece copiarlas desde
`admin/semillas/guias-saintvenik-com.json` cuando todas sus guías están vacías.

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
- «No se puede usar este enlace de instalación… la app no está disponible para
  esta tienda» quiere decir, casi siempre, que la tienda es de otra
  organización. El admin de cada tienda lo dice: su enlace «Desarrollar apps en
  Dev Dashboard» lleva al id de su organización.
- `shopify app execute` no sirve con tiendas reales, solo con tiendas de
  desarrollo: responde «Could not find store … in organization».
- `shopify.app.cl.toml` se enlazó con `app config link`, que la dejó como
  configuración activa del CLI. Se volvió a `shopify.app.toml` con
  `shopify app config use shopify.app.toml`.
