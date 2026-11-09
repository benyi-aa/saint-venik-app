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

### Los componentes del admin (Polaris)

`admin/index.html` carga `polaris-2.js` justo **después** de `app-bridge.js`
(ese orden importa: App Bridge avisa de qué aspecto tiene el admin de esa
tienda antes de que Polaris arranque). Son elementos a secas —`<s-section>`,
`<s-text-field>`…—, así que funcionan con JavaScript normal, sin React y sin
compilar nada. La pantalla de insignias ya está hecha con ellos; las demás van
migrando.

Lo que se aprendió montándolos, que no está en la documentación:

- El atributo `slot` va en **guión**: `slot="primary-action"`. En camelCase el
  elemento no se asigna a ningún slot y **desaparece sin avisar**.
- `s-page heading` no pinta nada cuando la app va embebida en el admin: el
  título lo ponemos nosotros con un `<h1>`.
- Los **iconos** de Polaris (`icon="chevron-up"`, `<s-icon>`) salen vacíos
  fuera del admin. Donde el icono es la única señal, va texto.
- `s-section` no mete sus botones de acción en el DOM: los vuelve a pintar
  dentro de su shadow. Los clics y las propiedades (`loading`, `disabled`)
  igual llegan al elemento original, así que los oyentes funcionan.
- Los eventos (`input`, `change`, `remove`) **suben**, así que se puede
  escuchar en la tarjeta entera en vez de campo por campo. `focus` no sube:
  para eso, `focusin`.
- Un campo numérico devuelve **texto**, y vacío devuelve cadena vacía.
- `s-color-field alpha` da el color con transparencia en ocho dígitos
  (`#rrggbbaa`). La tienda lo guarda partido en color + opacidad, y
  `partirAlfa`/`conAlfaHex` traducen entre lo uno y lo otro.
- El CSS propio **no entra** en los componentes (shadow DOM). Sí alcanza a lo
  nuestro: la muestra de la insignia, la lista de resultados del buscador y los
  textos de ayuda, que es justo lo que queremos que se parezca a la tienda.
- Para verlo sin el admin hay un banco de pruebas: una copia de `index.html`
  con un `fetch` de mentira dentro de un iframe (el panel se cree embebido).

## Los bloques

| Bloque | Tipo | Lee |
|---|---|---|
| Selector de color | app block | `custom.hermano_de_color` + metaobjeto `color` |
| Selector de talla | app block | las variantes reales del producto |
| Guía de tallas | app block | metaobjetos `guia_de_tallas` y `bloque_guia` |
| Beneficios | app block + el embed | metaobjeto `sv_beneficio` |
| Insignias de producto (y descuento) | **app embed** | metaobjeto `sv_etiqueta` + configuración |
| Transiciones de página | **app embed** (head) | configuración |
| Filtros rápidos | **app embed** | metaobjeto `sv_boton_filtro` + metacampos `custom.sv_*` |

Los colores no son variantes: son productos separados que se apuntan entre sí.
Un producto se asocia a su color por la etiqueta (`oro`, `acero-inox`), que es lo
que guarda el campo `etiqueta` del metaobjeto. Un producto puede llevar dos
etiquetas de color (la Vienna verde lleva `oro` y `verde`): cuenta como la que
esté antes en «Orden de los colores», y cada hermano responde solo a la suya.
Las etiquetas de color se ponen y quitan desde la pantalla Productos.

### Insignias y beneficios

Las dos cosas funcionan igual por debajo: una entrada de metaobjeto que decide a
qué productos alcanza, eligiéndolos a mano o por colección entera.

Las **insignias** son un app embed y no un app block porque una tarjeta de
producto no es una sección ni un bloque de tema: es un snippet dentro del bucle
del grid, y Shopify dice que los bloques `@app` no se admiten en secciones
renderizadas estáticamente. No hay dónde enganchar un bloque por tarjeta, así
que el embed emite los datos en Liquid y un script los coloca en el DOM.

El embed pinta dos cosas: las insignias y, sobre las fotos de la ficha (desde
la segunda, la primera se deja limpia), los beneficios. El bloque de
beneficios de la ficha sigue existiendo aparte, para la fila bajo el botón.

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

### Descuento, cambio de página y filtros

Tres cosas más que se manejan desde el panel, las tres con el mismo interruptor
de tres estados: **Apagado**, **Vista previa** (solo la ve quien abre la tienda
con `?sv-vista=1`; se recuerda durante la sesión) y **Activo en la tienda**. Así
se puede enseñar antes de encender.

- **Descuento** (pantalla Insignias). El porcentaje a secas, rojo y pequeño, como
  en Lost Gen Club, en lugar del «AHORRA 14%» del tema: en la tarjeta, sobre las
  fotos de la ficha y junto al precio. No se calcula: se lee del tema, que ya lo
  saca del precio tachado y lo cambia al elegir otra variante. Vive en
  `assets/sv-descuento.js`, que el embed de insignias solo carga cuando está
  encendido; `sv-badges.js` lo espera (evento `sv:descuento`). En la ficha el
  precio va más chico (17 px; el tema lo pone a 20) y el porcentaje más grande
  (14 px), los dos ajustables en la pantalla. Ese estilo lo pinta el snippet
  `sv-desc-estilo` desde el embed de `<head>` (y repetido desde el de insignias,
  por si apagan aquel): si llegara al final de la página, el precio se vería
  grande un instante y después encogería.
- **Cambio de página** (pantalla Apariencia, embed «Transiciones de página», de
  `<head>`). Calcado de louisvuitton.com, medido cuadro a cuadro en el video de
  la llamada: una barra gris muy fina (`#999999`; negra no se vería sobre la
  cuenta regresiva) que sale a los 0,25 s del toque y se llena lento y parejo
  (≈20 % a los 0,8 s, 35 % al segundo); la página siguiente la recoge donde
  quedó y la termina. La cuenta regresiva y el encabezado no se mueven: durante
  el cambio llevan `view-transition-name`, y solo se funde lo de abajo. Además,
  el fundido entre páginas (`@view-transition`, del navegador) y la precarga al
  apoyar el dedo (reglas de especulación; nunca carrito, cuenta ni pago). Si la
  página llega en menos de 0,25 s, la barra ni aparece.
- **Filtros** (pantalla Filtros, embed «Filtros rápidos»). Los botones encima de
  los productos («Dorado», «Plateado», «Brillantes» en todas; las categorías en
  Best Sellers). Cada botón es una entrada de `sv_boton_filtro` y lleva a la misma
  colección con el filtro de Shopify puesto, así que dependen de que esos filtros
  existan en **Search & Discovery**: Color, Categoría y Tipo, que son los
  metacampos de producto `custom.sv_color`, `custom.sv_categoria` y
  `custom.sv_tipo`. La pantalla los propone para cada producto (etiqueta de color,
  título, colecciones) y se corrigen a mano.

  Como en CRAFTD: tocar un botón filtra en el sitio, sin recargar ni saltar
  arriba (usa la misma función del tema que el menú Filtrar). Los botones no
  desaparecen al filtrar; el que se quedaría sin productos se ve apagado. El
  menú Filtrar queda Color, Categoría, Tipo, Precio, Disponibilidad y Ordenar;
  las opciones se marcan sin que el menú se cierre y se aplican juntas con «Ver
  resultados» (o al cerrarlo). Ojo: Impulse pinta cada opción dos veces con el
  mismo id (barra lateral y menú) y la etiqueta del menú marcaba la casilla de
  la barra lateral; el embed hace que cada etiqueta del menú marque la suya.

  **Filtrar en el computador** (campo `filtros_cajon`, pedido del 8-nov: «que
  aparezcan como la barrita del costado, no dentro de la página»). En vez de la
  columna de la izquierda, el botón «Filtrar» y el mismo cajón lateral que en el
  teléfono. Es el modo «cajón» de Impulse, pero hecho con CSS (snippet
  `sv-cajon`, desde el embed de `<head>` y, de respaldo, desde el de filtros) en
  vez de cambiar `filter_style` en las 18 plantillas de colección de cada tienda:
  el cajón y su botón ya están en todas las páginas, el tema solo los esconde en
  el computador. Mismos tres estados; con el campo sin crear vale `prueba`, así
  que nadie lo ve hasta encenderlo en la app.

  **Precio escrito a mano** (campo `filtros_precio`, pedido del 8-nov: «abajo
  del slider se debe poder escribir los valores… deben estar ambas opciones»).
  Debajo del slider de Impulse, «Desde» y «Hasta». Van juntos: mover el slider
  escribe las casillas y escribir mueve el slider. El slider salta de 10 en 10,
  pero el filtro usa lo escrito tal cual. En el menú se aplica como el resto
  (Ver resultados, Enter o al cerrarlo); en la columna de la izquierda, con
  Enter o al salir de las casillas. Las casillas no tienen `name` y cortan su
  evento `input`, porque el tema filtra y cierra el menú con cada `input` del
  formulario. Lo pinta `sv-filtros.js`; el estado llega en `data-precio`. Mismos
  tres estados, y con el campo sin crear vale `prueba`.

  Ojo en .cl: Impulse escribe el rango con el formato de la tienda («59.990») y
  lo lee con `parseFloat`, o sea 59,99. Sin arreglo, el slider de .cl va de $0
  a $60 y moverlo filtra «hasta 30 pesos»: 0 productos. Con las casillas
  encendidas, `sv-filtros.js` lee solo las cifras en pesos, corrige el rango
  del slider (`updateOptions`) y muestra los montos como las fichas («$27,990»).

  Las píldoras se combinan entre sí: cada una añade o quita su valor y deja los
  demás. Dos del mismo filtro suman (Cadenas o Pulseras); de filtros distintos
  se cruzan (Cadenas y Dorado). Un botón sin icono (Icono → ninguno en la app)
  queda como pastilla de texto también en el teléfono, en vez de caja apilada.

  Por qué un embed y no un bloque: la tienda tiene dieciocho plantillas de
  colección. Un bloque habría que ponerlo a mano en cada una (y en cada
  plantilla nueva); el embed sale en todas y se coloca solo encima de los
  productos. Al filtrar, las pastillas no desaparecen: la que se quedaría sin
  productos se apaga hasta que vuelva a tenerlos.

- **Portada de las colecciones** (campo `colecciones_portada`, pedido del 9-nov
  con la referencia de lostgenclub; snippet `sv-portada` desde el embed de
  `<head>`, `assets/sv-portada.css` y `.js`). Cada colección empieza con un
  bloque de texto y foto (`.collection-description-wrapper`, de una sección
  «Contenido personalizado» de cada plantilla), luego la barra negra de
  beneficios y el banner 3x2. Quita las franjas blancas entre los tres, y en el
  teléfono, donde el tema escondía la foto, la deja baja (165 px) con el título
  encima sobre un degradado negro. Debajo del título, una flecha que se
  enciende y apaga muy despacio. Al tocar, el título sube, aparece la
  descripción entera y la foto se oscurece; se cierra al volver a tocar, al
  tocar fuera o al bajar más de 60 px. El encuadre va por foto (`--sv-encuadre`
  según el nombre del archivo) para que la joya quede sobre el título; en
  Colgantes y Conjuntos la cruz está en el borde de abajo de la foto y el título
  la tapa en parte: esas piden una foto pensada para el teléfono. Va con
  `:has(img)` para estar en su sitio desde el primer pintado. El bloque tiene
  alto fijo y el texto es una capa (`position: absolute`) que nunca sale de la
  foto: abierta, el título se achica, el texto pasa a 12 px y, si aun así no
  cupiera, se desliza dentro. Ni se mueve la página ni se tapa la barra negra
  (pedidos del 9-nov, dos grabaciones). Tres estados;
  con el campo sin crear vale `si`.

**Configuración en dos metaobjetos.** Shopify admite como mucho 40 campos por
definición de metaobjeto, y `sv_configuracion` ya tiene los 40 (al crear
`colecciones_portada` salía «Máximo 40 campos por definición de metaobjeto»).
Lo nuevo va en `sv_configuracion_2` (lista `CAMPOS_CONFIG_2` de
`admin/config.js`), con su propia entrada `general`. «Crear lo que falta» crea
esa segunda definición; el panel lee y guarda las dos como una sola, y el
Liquid que usa uno de esos campos lo busca en `shop.metaobjects.sv_configuracion_2`.

Los dos embeds nuevos, como el de insignias, hay que encenderlos una vez por
tema en Personalizar → Configuración → Incrustaciones de apps.

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
