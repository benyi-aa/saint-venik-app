# Temporadas

Pedido del 10-nov: crear «apariencias» de temporada desde la app, cada una con
sus fotos y con los textos de la barra de arriba (cuenta regresiva), del bloque
«3X2 EN TODO» de las colecciones y de la caja de oferta de los productos.

## Cómo se usa (panel)

- **Temporadas**: elegir la activa, crear una nueva (Cyber, San Valentín…),
  editar sus textos y colores con vista previa, o borrarla. Normal y Navidad
  existen siempre.
- **Fotos**: arriba se elige la temporada y se cambian sus fotos.
- Lo que una temporada deja vacío se ve como en **Normal**; lo que Normal deja
  vacío, como estaba el tema (Black Friday, 10-nov). «-» deja un texto sin nada.
- La fecha de término de la barra **no** se hereda: vacía, la cuenta llega a las
  23:59 de cada día (como siempre); con fecha, cuenta hasta ese momento y luego
  la barra se esconde sola. Se guarda en UTC desde la hora del computador.

## Dónde vive

- `sv_configuracion_2.temporada`: clave de la activa (`normal`, `navidad` u otra).
- `sv_configuracion_2.temporadas` (JSON): `{ clave: { nombre, barra_titulo,
  barra_titulo_en, barra_boton, barra_enlace, barra_fin, barra_fondo,
  barra_letra, barra_boton_fondo, barra_boton_letra, barra_activa,
  bloque_activo, bloque_titulo, bloque_texto, bloque_fondo, bloque_letra,
  oferta_activa, oferta_nombre, oferta_etiqueta, oferta_principal, oferta_texto,
  oferta_fondo, oferta_etiqueta_fondo, oferta_letra } }` (los `_en` son de .com).
  La pestaña crea el campo si falta.
- Panel: `admin/temporadas.js` (campos, textos de hoy, vista previa) y
  `pintarTemporadas` en `admin/app.js`. Fotos: `gruposDe()` en `admin/fotos.js`.

## Tema (las dos tiendas)

`scripts/tema/temporadas.py carpeta cl|com [clave]` (sobre una carpeta bajada con
`shopify theme pull`) hizo esto el 10-nov:

- Crea `snippets/sv-temporada.liquid` con tres partes: `barra`, `bloque`,
  `oferta`. Los textos y colores de hoy quedan como valor por defecto.
- `layout/theme.liquid`: el HTML de `#svcd-1` pasa a
  `{% render 'sv-temporada', parte: 'barra', url: url_banner %}`; el script de
  la cuenta acepta `data-fin`. En .com el enlace en inglés ya no se fuerza a
  Best Sellers.
- Plantillas de colección (collection, cadenas-v2, anillosv2, colgantes-v2,
  pulseras-v2): el bloque 3X2 pasa a `render 'sv-temporada', parte: 'bloque'`.
- Plantillas de producto (.cl: acero-inoxidable, brillantes, oro; .com:
  acero-inox, ice, orov2): la caja pasa a `render 'sv-temporada', parte: 'oferta'`.
  Los bloques desactivados (3X2 viejos) no se tocaron.
- `snippets/custom-collecion-cart-page.liquid` (carrito vacío): fuera de Normal
  usa `sv-<clave>-<colección>.jpg` (en Navidad primero la «Foto de Navidad»).

Con el tercer argumento (clave) el snippet fuerza esa temporada: así está el
tema de vista previa de .cl (#189939188015, siempre Navidad). Respaldo de los
archivos de antes: el tema «ANTERIOR (respaldo 8-nov)» de cada tienda y los
originales bajados el 10-nov.

## Fotos de una temporada

Mismo esquema que Navidad, con la clave en vez de `navidad`:

| Dónde | Archivo |
|---|---|
| Tarjetas del inicio y carrito vacío | `sv-<clave>-cadenas.jpg`, `-pulseras`, `-colgantes`, `-anillos` |
| Banner de colección, computador | `sv-<clave>-portada-<k>.jpg` (k: cadena, pulsera, anillos, colgantes, conjuntos, essentials, bestsellers) |
| Banner de colección, teléfono | `sv-<clave>-portada-<k>-movil.jpg` |

La extensión (`sv-portada`, `sv-inicio`) arma los nombres con la clave activa; la
que falte se ve como en Normal. El encuadre de los banners de temporada es el de
Navidad (`--sv-y:50%`; en el teléfono, enteras). «El regalo Nº1 para él» es solo
de Navidad. «Tu cadena de cada día» y el menú no cambian con la temporada.

`?sv-navidad=1` sigue sirviendo para mirar Navidad. Para mirar otra temporada
antes de activarla: un tema de vista previa con el embed «Transiciones» →
«Temporada de este tema» = su clave, y el snippet `sv-temporada` forzado a esa
clave (tercer argumento del script).
