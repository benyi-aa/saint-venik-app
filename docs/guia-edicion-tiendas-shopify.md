# Cómo editar páginas de una tienda Shopify con Claude Code

Método general (sirve para cualquier marca), sacado del trabajo en otra tienda.
Pásale este archivo al chat nuevo y dile: «Lee esta guía antes de tocar nada».

---

## 0. Arranque en el chat nuevo

Dar al principio:
- Dominio de la tienda y su `xxxx.myshopify.com`.
- Qué página o sección se quiere cambiar, con capturas o un video si hay.
- Si hay más de una tienda o idioma (y si los cambios van en todas).

Lo primero que debe hacer Claude:
1. Ver los temas: `npx shopify theme list --store xxxx.myshopify.com` (o la CLI
   instalada en la carpeta del proyecto). Anotar el id del tema **en vivo**.
2. **Respaldar** antes de tocar: duplicar el tema en el admin, o bajarlo entero
   a una carpeta con git (`shopify theme pull --path … --theme <id>`).
3. Abrir la página en el navegador del panel (tamaño teléfono y computador) y
   ubicar qué la dibuja (punto 2).

## 1. Dónde vive cada cosa en Shopify

| Qué | Dónde | Cómo se cambia |
|---|---|---|
| Estructura y diseño | Tema: `templates/*.json`, `sections/`, `snippets/`, `assets/`, `layout/theme.liquid`, `locales/` | CLI del tema (punto 3) o editor de temas |
| Textos/fotos puestos en el editor | Ajustes dentro de los JSON de plantillas (`settings` de secciones y bloques) | CLI o editor |
| Cuerpo de una página | Admin → Contenido → Páginas | Navegador (punto 4); la API pide permiso de páginas |
| Descripción / SEO de colecciones y productos | Admin o Admin API (`collectionUpdate`, `productUpdate`) | Navegador o una app con permisos |
| Imágenes | Admin → Contenido → Archivos | Subir / reemplazar (punto 6) |
| Datos estructurados | Metacampos y metaobjetos | Admin o API |
| Cosas de apps de terceros | Bloques/embeds de esas apps | En la app o el editor de temas |

Para saber qué plantilla y sección pinta algo:
```bash
curl -s "https://dominio.com/ruta?z=$RANDOM" | grep -o 'id="shopify-section-[^"]*"'
curl -s "https://dominio.com/ruta?z=$RANDOM" | grep -o 'template-[a-z0-9._-]*' | sort -u
```
`?z=…` salta la caché. Una colección o página sin plantilla propia usa la
plantilla por defecto (`collection.json`, `page.json`): un cambio ahí afecta a
**todas** las que la comparten. Muchos temas tienen bloques «Contenido
personalizado / Custom liquid» con HTML y Liquid dentro de `settings.code`:
mucho texto vive ahí, no en archivos de sección.

## 2. Diagnosticar antes de cambiar

- Medir con JS en el navegador: `getBoundingClientRect()`, `getComputedStyle()`,
  qué elemento ocupa una franja, de dónde viene un color.
- Si algo «aparece en algunos momentos» (un video, un carrusel), revisar cuadro
  por cuadro: puede venir del propio archivo y no de la página.
- Si el usuario dice que algo no cambió: revisar caché, que no esté mirando un
  tema en vista previa (barra «Borrador»), y que el cambio sí esté en el HTML
  servido (`curl`).

## 3. Editar el tema con la CLI

```bash
# bajar solo lo que se va a tocar (la carpeta --path debe existir)
shopify theme pull --store xxxx.myshopify.com --theme <id> --path /tmp/tema --only templates/index.json --only sections/mi-seccion.liquid
# subir solo eso al tema en vivo, sin borrar nada más
shopify theme push --store xxxx.myshopify.com --theme <id> --path /tmp/tema --only templates/index.json --allow-live --nodelete
```

Reglas:
- **Volver a bajar justo antes de editar**: alguien pudo cambiar algo en el editor.
- Guardar copia del archivo antes de subir.
- Los JSON de plantillas suelen traer un comentario `/* … */` arriba: leer desde la
  primera `{` y volver a poner la cabecera al guardar.
- Editar JSON con Python (`json.loads` / `json.dumps(…, ensure_ascii=False)`), no
  con sed. Para HTML/Liquid largos dentro de `settings.code`, reemplazar trozos
  exactos y comprobar con `assert` que el trozo existía una sola vez.
- En vez de dejar valores fijos, agregar **ajustes al `{% schema %}`** de la
  sección (color, texto, alto, imagen) para que se manejen desde el editor.
- Para ocultar un bloque sin borrarlo: `"disabled": true`.
- Si la tienda tiene dos países o idiomas, repetir en cada tema y comprobar en los dos.

## 4. Editar contenido en el admin desde el navegador

- Páginas: Contenido → Páginas → abrir → «…» → **</>** (ver HTML). El editor es
  CodeMirror. Para cambiar un trozo exacto:
  ```js
  const v = document.querySelector('.cm-content').cmView.view;
  const s = v.state.doc.toString(); const i = s.indexOf('texto a quitar');
  v.focus(); v.dispatch({ selection: { anchor: i, head: i + 'texto a quitar'.length } });
  ```
  y luego apretar Suprimir con el teclado (así el formulario se marca como
  modificado). Guardar con el ✓ de arriba y comprobar en la tienda con `curl`.
- Lo mismo sirve para la descripción de una colección (botón «Mostrar HTML»).
- Muchas descripciones SEO repetidas: mejor un script o botón con la Admin API
  que editar una por una (guardando antes un respaldo de los textos).
- Nunca escribir contraseñas ni crear cuentas; si pide iniciar sesión, que lo
  haga el usuario.

## 5. Si la tienda tiene una app propia (extensión + panel)

- La extensión de tema (bloques y embeds) tiene un tope de **100 KB de Liquid en
  total**; los comentarios cuentan. Explicaciones largas, a un `docs/`. JS y CSS
  no cuentan.
- Orden de publicación: `git fetch && git merge` (cada deploy reemplaza la
  extensión entera) → commit → push → `shopify app deploy --config <toml>
  --allow-updates` en cada tienda.
- Un panel estático (GitHub Pages) puede hablar con la Admin API por App Bridge
  (`fetch('shopify:admin/api/<versión>/graphql.json')`) sin servidor. Revisar los
  permisos (`scopes`) antes de prometer algo.
- `shopify app execute` (GraphQL desde la terminal) solo funciona con tiendas de
  la organización de partners / desarrollo.
- Si GitHub Pages falla al publicar («try again later»):
  `gh api -X POST repos/<dueño>/<repo>/pages/builds`.

## 6. Imágenes

### Archivos y referencias
- En el tema, una imagen de Archivos se puede pedir por nombre:
  `{{ images['mi-foto.jpg'] | image_url: width: 2400 }}`. Así, al reemplazar el
  archivo con el mismo nombre, la página se actualiza sola.
- Reemplazar en el sitio (mismo id y nombre) con la Admin API `fileUpdate`
  (`originalSource`), en vez de subir copias. Comprobar que cambió el `?v=`.
- Guardar siempre la versión anterior antes de reemplazar.

### Generador interno de Venik (Nano Banana Pro)
- Script: `python3 /Users/diegogardilcicverschae/saint-venik-app/scripts/imagenes/generar.py trabajos.json [carpeta]`
  (cada trabajo: `nombre`, `aspecto` 1:1/4:5/16:9/21:9…, `imagenes` = rutas de
  referencia, `prompt`). Por debajo usa
  `~/.claude/skills/estudio-venik/mesa/BENYI/scripts/erp.sh`.
- Costo: 18 créditos = **US$0,09 por imagen** (2K). Avisar siempre lo gastado.
  La clave del agente nunca se imprime ni se copia.
- Técnicas que funcionaron:
  - Dar fotos reales del producto y pedir «reproduce ESTAS piezas exactas»; para
    estilo, una foto aparte marcada «solo referencia de estilo».
  - **Arreglar un detalle** (un logo, un broche): editar la foto y pegar **solo esa
    zona** sobre la original: `scripts/imagenes/pegar-zonas.py original generada
    salida x0,y0,x1,y1 …` (fuera de las cajas queda idéntica).
  - **Ampliar una foto** (versión para teléfono, más fondo): poner la original en
    un lienzo con gris plano donde falta, pedir que rellene solo el gris («no gray
    may remain»), y volver a pegar la original encima con `pegar.py`.
  - Si un texto encima tapa el producto: alejar la toma (más ancho y más abajo a
    la vez), no solo alargar hacia abajo.
  - Mostrarle la imagen al usuario antes de publicarla.
- Revisar con lupa logos, grabados, broches, letras y manos: es donde más falla.

## 7. Patrones de diseño responsivo que salieron bien

- Banner con texto encima de la foto: medir dónde cae el texto en el teléfono
  (375–430 px) y en el computador (1280–1920 px). Si tapa el producto, hacer una
  **versión de teléfono** de la foto en vez de mover el texto.
- Alturas que crecen con la pantalla: `height: clamp(560px, 45vw, 760px)` y
  `object-position` ajustado para que el producto quepa en todos los anchos.
- Video de fondo con franjas negras grabadas: `overflow: hidden` en el contenedor
  y `transform: scale(1.04)` en el video.
- Un formato de foto distinto en teléfono: `<picture>` con
  `<source media="(max-width: 767px)">`, o una opción nueva en el schema.
- Barras fijas: blancas y sobrias se ven más premium que oscuras con acentos
  «tipo IA» (naranjo, dorado).

## 8. Comprobar como lo ve un cliente

- Navegador del panel con tamaños 375/390/400 (teléfono) y 1280/1440/1512/1920
  (computador). Medir con JS y sacar captura o lupa (`zoom`). Al terminar, volver
  el tamaño a «desktop».
- `curl` con `?z=$RANDOM` para ver el HTML real. Si se hacen muchas seguidas,
  Shopify devuelve **429** un rato: espaciar.
- El navegador oculto no pinta videos pausados: medir por geometría.
- Después de subir algo, comprobar en **todas** las tiendas/idiomas.

## 9. Feedback que llega en video o audio

- Cuadros: Swift con `AVAssetImageGenerator` (un cuadro cada 1–2 s) y armar hojas
  de contacto con PIL para ver qué señala la persona.
- Audio a texto: `afconvert -f WAVE -d LEI16@16000 -c 1 video.mp4 audio.wav` y
  Swift `SpeechTranscriber(locale: es-CL)` + `SpeechAnalyzer`.
- Las grabaciones de Meet del usuario suelen traer solo su micrófono.
- Juntar todos los mensajes que lleguen escalonados; si algo no se entiende, no
  inventarlo: preguntar al final.

## 10. Reglas de trabajo

- Confirmar antes de encender algo nuevo o hacer visible un cambio grande; no
  perder la configuración que ya existe.
- Todo lo que se pueda, manejable desde el editor de temas o la app (ajustes),
  no valores fijos en el código.
- Respaldar antes de reemplazar (archivos, textos, plantillas).
- Commits pequeños y descriptivos; documentar en `docs/` qué se cambió y dónde.
- Decir el costo de cada imagen generada; nunca imprimir claves.
- Informar con honestidad: qué se comprobó en vivo, qué no y qué queda pendiente.
