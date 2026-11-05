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

| Bloque | Tipo | Lee |
|---|---|---|
| Selector de color | app block | `custom.hermano_de_color` + metaobjeto `color` |
| Selector de talla | app block | las variantes reales del producto |
| Guía de tallas | app block | metaobjetos `guia_de_tallas` y `bloque_guia` |
| Beneficios | app block | metaobjeto `sv_beneficio` |
| Insignias de producto | **app embed** | metaobjeto `sv_etiqueta` |

Los colores no son variantes: son productos separados que se apuntan entre sí.
Un producto se asocia a su color por la etiqueta (`oro`, `acero-inox`), que es lo
que guarda el campo `etiqueta` del metaobjeto.

### Insignias y beneficios

Las dos cosas funcionan igual por debajo: una entrada de metaobjeto que decide a
qué productos alcanza, eligiéndolos a mano o por colección entera.

Las **insignias** son un app embed y no un app block porque una tarjeta de
producto no es una sección ni un bloque de tema: es un snippet dentro del bucle
del grid, y Shopify dice que los bloques `@app` no se admiten en secciones
renderizadas estáticamente. No hay dónde enganchar un bloque por tarjeta, así
que el embed emite los datos en Liquid y un script los coloca en el DOM.

Un app embed **no se enciende solo**: en cada tienda hay que activarlo en
Personalizar → Configuración → Incrustaciones de apps → «Insignias de
producto». Queda guardado en el tema, no en la app: al cambiar de tema o
publicar otro, hay que volver a encenderlo.

Se asigna por **etiqueta de producto** (`oro`, `acero-inox`, `brillantes`),
que es la taxonomía que las tiendas ya usan y la misma que mira el selector de
color. Una etiqueta con un guión delante resta: `oro, acero-inox, -brillantes`
es «todo el oro y todo el acero menos los brillantes».

El campo `handles` de las dos entradas es **derivado**: lo calcula el panel a
partir de `productos` y `colecciones`, y guarda el id y el handle de cada
producto entre barras (`|8328987607087|cadena-cuban-oro-8mm|`). Van los dos
porque Shopify traduce los handles —en inglés `anillo-signet` es
`signet-ring`— y el id no cambia de idioma. Existe porque en Liquid un campo de lista de
referencias solo deja leer 50 elementos por bucle, y una colección de oro pasa
de 50. El panel lo recalcula al abrir la pantalla y al guardar; si alguien lo
edita a mano en el admin de Shopify, el siguiente recálculo lo pisa.

Los iconos de los beneficios viven en
`extensions/saint-venik/snippets/sv-icono.liquid`, que es el original.
`admin/iconos.js` es una copia generada con `npm run iconos` para que el panel
pueda enseñarlos; `npm run revisar` falla si las dos listas se separan.

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
