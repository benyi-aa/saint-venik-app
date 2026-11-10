# Guía para editar páginas de Saint Venik (exportada el 10-nov-2026)

Resumen de cómo se trabajó en saintvenik.cl y saintvenik.com: dónde vive cada
cosa, cómo se cambia, cómo se publica y cómo se comprueba. Sirve para seguir
en otro chat. Las notas largas siguen en `docs/tema.md` (cambios del tema, por
fecha) y `docs/bloques.md` (explicaciones del código de la extensión).

**Para arrancar otro chat:** abrirlo en la carpeta `~/saint-venik-app` (así carga
la memoria del proyecto) y decirle: «Lee `docs/guia-edicion-paginas.md`,
`docs/tema.md` y `docs/bloques.md` antes de tocar nada».

---

## 1. Las dos tiendas

| | Chile | Mundo |
|---|---|---|
| Dominio | saintvenik.cl | saintvenik.com |
| myshopify | saint-venik.myshopify.com | vd9tn0-et.myshopify.com |
| Admin | admin.shopify.com/store/saint-venik | admin.shopify.com/store/vd9tn0-et |
| Tema en vivo | «Saint Venik · OPTIMIZADO» #189793632559 | «Saint Venik · OPTIMIZADO» #161295269935 |
| Respaldo (8-nov) | #188341289263 | #160802897967 |
| App (handle) | `color-size-picker` | `saint-venik` |
| Config CLI | `shopify.app.cl.toml` | `shopify.app.toml` |

- Tema base: **Impulse**, muy personalizado (secciones `sv3-*`, `sv-hero`,
  bloques «Contenido personalizado» con Liquid, etc.).
- **Todo cambio va en las dos tiendas**, salvo que se diga lo contrario (.cl tiene
  60 % en Black Friday y .com 75 %; .com es bilingüe con `sv-es`/`sv-en`).
- No publicar en los temas de respaldo. Volver atrás:
  `./node_modules/.bin/shopify theme publish --theme <respaldo> --store <tienda> --force`.

## 2. Dónde vive cada cosa

1. **Archivos del tema** (secciones, plantillas JSON, assets): se editan con la CLI
   (punto 3). Ej.: `templates/index.json`, `templates/collection.json`,
   `templates/page.arma-tu-3x2.json`, `sections/sv3-*.liquid`, `assets/sv-3x2.css/js`.
2. **App «Panel Saint Venik»** (antes «Color & Size Picker»; este repo):
   - `extensions/saint-venik/` = bloques y embeds que la app pone en el tema
     (`blocks/*.liquid`, `snippets/*.liquid`, `assets/*`). Ej.: `sv-inicio`
     (estilos del inicio), `sv-portada` (banners de colección), `filtros`,
     `sv-menu` (menú del teléfono), `regalo`, `transiciones`.
   - `admin/` = el **panel** de la app (HTML/JS sin servidor, servido por
     GitHub Pages desde `main`). Habla con la Admin API por App Bridge.
   - `admin/fotos-inicio/` = fotos que el panel sube a Archivos de Shopify.
   - `branding/` = originales, borradores y respaldos de imágenes y textos.
3. **Contenido de Shopify** (texto de páginas, descripciones de colecciones,
   SEO, archivos): Admin de Shopify o el panel. La app **no** tiene permiso de
   páginas (solo `write_products, write_metaobjects,
   write_metaobject_definitions, write_files`): el cuerpo de una página se edita
   en el admin desde el navegador.
4. **Configuración del panel**: metaobjeto `sv_configuracion_2` (temporada
   normal/navidad, menú, inicio, colores de precio…) y `sv_configuracion`
   (filtros). Los botones de filtro son metaobjetos `sv_boton_filtro`.

Para saber qué plantilla y sección pinta algo en la tienda:
`curl -s https://saintvenik.cl/<ruta>?z=$RANDOM` y buscar
`id="shopify-section-template--…__<seccion>"` y la clase `template-…`.
`?z=…` evita la caché. Si se hacen muchas peticiones seguidas Shopify responde
**429** un rato: espaciar.

## 3. Editar el tema con la CLI

Siempre con la CLI del repo (`./node_modules/.bin/shopify`), nunca `npx` en otra
carpeta.

```bash
# bajar solo lo que se va a tocar (la carpeta --path debe existir)
./node_modules/.bin/shopify theme pull --store saint-venik.myshopify.com --theme 189793632559 --path /tmp/tema-cl --only templates/index.json
# subir solo eso, al tema en vivo, sin borrar nada
./node_modules/.bin/shopify theme push --store saint-venik.myshopify.com --theme 189793632559 --path /tmp/tema-cl --only templates/index.json --allow-live --nodelete
```

- **Volver a bajar justo antes de editar**: el usuario o Benjamín pueden haber
  cambiado algo en el editor de temas.
- Los JSON de plantillas traen un comentario `/* … */` arriba: leer desde la
  primera `{`, y al guardar volver a poner esa cabecera.
- Editar JSON con Python (`json.loads` / `json.dumps(ensure_ascii=False)`), no
  con sed.
- Muchos textos/fotos viven dentro de bloques «Contenido personalizado»
  (`advanced_content_*` → bloque `liquid_*` → `settings.code`). Ahí se puede usar
  Liquid, por ejemplo `images['sv-inicio-cadena-dia.jpg'] | image_url: width: 2400`
  para que la foto salga de Archivos por nombre.
- Para desactivar un bloque sin borrarlo: `"disabled": true`.
- Al cambiar una sección compartida, agregar ajustes nuevos al `{% schema %}`
  (así se manejan desde el editor) en vez de dejar valores fijos.
- Guardar respaldo del archivo antes de subir.

## 4. Publicar la app (extensión y panel)

Orden fijo:

```bash
git fetch -q && git merge -q origin/main      # cada deploy reemplaza la extensión entera
npm run -s publicar                            # sella la versión (?v=) del panel y revisa referencias
git add … && git commit -m "…"                 # terminar con Co-Authored-By
git push origin main                           # GitHub Pages publica el panel y admin/fotos-inicio
npm run -s deploy:cl                           # extensión en .cl
npm run -s deploy:com                          # extensión en .com
gh api repos/benyi-aa/saint-venik-app/pages/builds/latest --jq '.status+" "+.commit[0:7]'
```

- **Tope de 100 KB de Liquid** en la extensión (va en ~97,7 KB). Los comentarios
  cuentan: las explicaciones largas van a `docs/bloques.md`. Los `.js`/`.css` no
  cuentan.
- Si GitHub Pages falla con «try again later» o se queda en cola:
  `gh api -X POST repos/benyi-aa/saint-venik-app/pages/builds`.
- `shopify app execute` (GraphQL desde la terminal) **no funciona** con estas
  tiendas: se usan botones del panel o el admin.

## 5. Imágenes

- Se dejan en `admin/fotos-inicio/<nombre>.jpg`, se publican con git y se suben
  con el panel: Apariencia → «Inicio: colecciones» → **«Traer las fotos nuevas a
  Archivos»** (fotos del inicio, menú, banners de teléfono, «Tu cadena de cada
  día», Best Sellers) o **«Preparar las fotos de Navidad»**. Reemplazan el
  archivo **con el mismo nombre** (no crean copias), así que las referencias
  `shopify://shop_images/<nombre>` y los metacampos siguen sirviendo.
- Comprobar que cambió el `?v=` del archivo en la tienda. A veces hay que apretar
  el botón dos veces.
- Antes de reemplazar una foto, guardar la anterior en `branding/…`.
- Banners de colección: computador = franja de 300 px de alto con
  `--sv-y`; teléfono ≈ 390 × 165 con el título **siempre abajo**. Si el título
  tapa la joya, se hace una versión `-movil` (más alejada), no se mueve el título.

### Generador interno (Nano Banana Pro)

- Scripts en el repo (`scripts/imagenes/`):
  - `generar.py <trabajos.json> [carpeta]`: cada trabajo es `nombre`, `aspecto`,
    `imagenes` (rutas de referencia) y `prompt`; sale en `<carpeta>/out/<nombre>-N.png`.
    Por debajo usa `~/.claude/skills/estudio-venik/mesa/BENYI/scripts/erp.sh`.
  - `pegar.py`: pega la original encima de una versión ampliada, alineándola sola.
  - `pegar-zonas.py original generada salida x0,y0,x1,y1 …`: pega solo esas zonas
    de la generada sobre la original (lo usado para el broche).
- Costo: 18 créditos = **US$0,09 por imagen** (2K). Avisar siempre el costo.
  La clave del agente nunca se imprime.
- Lo que funcionó:
  - Dar las fotos reales del producto y decir «reproduce ESTAS piezas exactas».
  - Para **arreglar un detalle** (ej. el broche con «SV»): editar la foto y
    luego pegar **solo la zona arreglada** sobre la original (máscara con
    borde suave). Fuera de esa zona la diferencia queda en 0.
  - Para **ampliar una foto** (versión de teléfono): poner la original en un
    lienzo con gris plano donde falta, pedir que rellene solo el gris, y volver a
    pegar la original encima, alineada. Nunca extender por encima de los labios
    (no mostrar la cara).
  - Bajar el foco para que el texto no tape la joya: alejar la toma, no solo
    alargarla hacia abajo.
  - Mandarle al usuario antes de publicar cuando lo pide («envíamela antes»).

### Detalles de producto que hay que respetar

- Broche de la Cuban 8 mm: caja con lengüeta que se dobla sobre la otra mitad,
  un pasador redondo a un lado de cada mitad, «SV» grabado **girado** a lo largo
  de la cadena (S abajo, V arriba), sin seguros de alambre a los lados.
- Anillos acostados (de pie «se ven falsos»); el Roman XI no sale bien, usar
  Signet o Eros.
- Brillantes = las 9 piezas con etiqueta `brillantes`.

## 6. Texto de páginas y colecciones (admin)

- Páginas: admin → Contenido → Páginas → abrir → «…» → **</>** (HTML). El
  editor es CodeMirror: para cambiar un trozo exacto se selecciona con
  `document.querySelector('.cm-content').cmView.view.dispatch({selection:{anchor:i, head:j}})`
  y luego se aprieta Suprimir con el teclado (así el formulario se da por
  modificado); guardar con el ✓ de arriba.
- Descripción y SEO de muchas colecciones: con un botón del panel que use
  `collectionUpdate` (ej. Apariencia → «Textos de las colecciones»).
- Regla vigente: **«resistente al agua» solo en fichas de productos sin
  brillantes**; nunca en lugares generales (inicio, colecciones, páginas, SEO).

## 7. Comprobar como lo ve un cliente

- Navegador del panel: tamaños 375/390/400 (teléfono) y 1280/1440/1512/1920
  (computador). Medir con JS (`getBoundingClientRect`, `getComputedStyle`) y
  sacar captura. Al terminar, volver el tamaño a «desktop».
- `curl` con `?z=$RANDOM` para ver el HTML real sin caché.
- El panel de la app está en un iframe: hay que bajar con la rueda y apretar por
  coordenadas (Apariencia queda en (132, 413) a la mitad de escala).
- Videos del usuario: sacar cuadros con Swift (`AVAssetImageGenerator`) y
  transcribir con `SpeechTranscriber` (es-CL). Las grabaciones de Meet solo
  traen la voz del usuario.
- El usuario a veces mira el tema de respaldo en su Chrome (barra «Borrador»
  abajo): si dice que algo no cambió, revisar eso.

## 8. Cómo trabaja el equipo

- Benjamín dirige; el usuario manda transcripciones, audios y videos. Juntar
  todos los mensajes escalonados, no perder el primero.
- Todo debe poder manejarse desde la app o el editor de temas (ajustes, no
  valores fijos).
- No encender nada nuevo («Activo») sin el OK del usuario. Preguntar antes de
  cosas visibles o difíciles de deshacer. No perder la configuración actual.
- Referencias de estilo: Lost Gen Club, CRAFTD London, Marlo, JAXXON (fondos
  oscuros con halos azul acero), gasper.co (menú). Navidad: burdeo, terciopelo
  rojo, cintas rojas.

## 9. Mapa rápido de lo que ya está hecho

- **Inicio**: video con franjas negras propias tapadas (zoom 4 % en `sv-inicio`);
  cuadrícula de colecciones sobre negro (fotos `sv-inicio-*.jpg`); «Eleva tu
  presencia»; «Tu cadena de cada día» (foto `sv-inicio-cadena-dia*.jpg`, alto que
  crece con la pantalla); sección «El regalo Nº1 para él» (oculta hasta Navidad).
- **Colecciones**: banners con título abajo en teléfono (`sv-portada`), Best
  Sellers con foto propia fuera de Navidad (`sv-portada-bestsellers*.jpg`),
  pastillas de filtros (embed `filtros`), barra negra «Hipoalergénicos», título
  de la plantilla por defecto según la colección.
- **Arma tu 3x2** (`/pages/arma-tu-3x2`, la página de anuncios): barra fija
  blanca con punto burdeo que late, portada horizontal en teléfono, bloque de
  texto blanco, filtros de la app, bandeja con «✓ +50.000 clientes».
- **Navidad**: todo listo y oculto; se enciende con Temporada = Navidad en el
  panel, se previsualiza con `?sv-navidad=1` (`=0` lo quita).
- **Menú del teléfono**: tarjetas tipo gasper.co con 7 fotos en uso.
- **Carrito vacío**: rediseñado, usa las fotos del inicio.
