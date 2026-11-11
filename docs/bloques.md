# Notas de los bloques del tema

Explicaciones que vivían como comentarios dentro de los archivos Liquid de la extensión. Se movieron aquí el 9-nov-2026 porque Shopify limita a 100 KB el Liquid de una extensión, y los comentarios también cuentan. En cada archivo queda una línea que apunta a la sección de aquí.

## blocks/selector-color.liquid

### selector-color.liquid · 1

Saint Venik · Selector de color entre productos hermanos
---------------------------------------------------------------------------
En esta tienda los colores NO son variantes: son productos separados que se
apuntan entre si con el metacampo `custom.hermano_de_color`
(lista de referencias a producto).

El aspecto de cada muestra sale del metaobjeto `color`:
nombre         -> texto visible en espanol (Translate & Adapt lo traduce)
nombre_en      -> texto visible en ingles; si esta vacio, manda la traduccion
muestra        -> color de la muestra
imagen_muestra -> archivo, tiene prioridad sobre el color
etiqueta       -> etiqueta del producto que corresponde (oro, acero-inox)

El producto se asocia a su color porque lleva esa etiqueta. El orden lo fija
el ajuste "Orden de los colores", no el orden del metacampo ni el del
metaobjeto, para que sea identico en todas las fichas. Los enlaces usan
`product.url`, que ya incluye /en/ cuando toca.

Si el producto no tiene hermanos, el bloque no dibuja nada.

### selector-color.liquid · 2

De que color es ESTE producto. Se decide una sola vez, antes de dibujar
nada, porque un producto puede llevar dos etiquetas de color por error y
entonces se adueñaba de las dos muestras: las dos salian marcadas como
"la actual", ninguna quedaba enlazada y el selector se moria. Paso de
verdad con una pulsera etiquetada a la vez `acero-inox` y `oro`.

Manda la primera que aparezca en el mismo orden en que se dibujan. Las
demas se buscan entre los hermanos, asi que siguen siendo pulsables.

### selector-color.liquid · 3

Lo mismo para cada hermano: de que color es, uno solo. Hace falta para
familias que se distinguen por algo que no es el metal, como la Vienna
Link (blanca, turquesa, verde): las tres llevan `oro` y ademas la suya.
Si al buscar «oro» bastara con llevar la etiqueta, cualquiera de las tres
se quedaba la muestra de oro. Asi, cada hermano solo responde a su color.
Va como «|id:etiqueta|» para poder preguntarlo con un `contains`.

## blocks/insignias.liquid

### insignias.liquid · 1

Saint Venik · Insignias sobre los productos
---------------------------------------------------------------------------
"Mas vendido", "Novedad": un rectangulo macizo arriba a la izquierda de la
tarjeta en la coleccion, y arriba a la derecha sobre la foto en la ficha.

POR QUE ESTO ES UN APP EMBED Y NO UN BLOQUE COMO LOS OTROS TRES
Una tarjeta de producto no es una seccion ni un bloque de tema: es un snippet
dentro del bucle del grid, y la documentacion de Shopify dice que los bloques
de tipo @app no se admiten en secciones renderizadas estaticamente. O sea que
no hay ningun sitio donde enganchar un bloque por tarjeta. La unica via es un
embed que emita los datos en Liquid y un JS que coloque los nodos. Los datos
NO se piden por fetch a proposito: salen ya resueltos aqui, del lado del
servidor, que es lo que pide la guia de rendimiento de Shopify.

SE ACTIVA A MANO EN CADA TIENDA
Personalizar -> Configuracion -> Incrustaciones de apps -> "Insignias de
producto". Un embed no aparece en la tienda hasta que alguien lo enciende
ahi, y eso queda guardado en el tema, no en la app: al cambiar de tema hay
que volver a encenderlo.

LOS DATOS
De cada entrada de `sv_etiqueta` salen el texto en los dos idiomas, los dos
colores y la lista de handles que el panel ya resolvio (productos elegidos a
mano + los de las colecciones elegidas). Se emite tambien la lista de
colecciones: en una pagina de coleccion eso permite acertar aunque los
handles se hayan quedado viejos porque entro un producto nuevo a la
coleccion despues del ultimo recalculo.

### insignias.liquid · 2

Lo del tema se esconde desde el servidor y no desde el script: si lo
escondiera el script, el «AHORRA» del tema se veria un instante en cada
carga. En 'prueba' lo hace el script, porque solo el sabe si hay
?sv-vista=1, y ese parpadeo en una vista previa da igual.

## blocks/selector-talla.liquid

### selector-talla.liquid · 1

Saint Venik · Selector de talla
---------------------------------------------------------------------------
Lee las variantes reales del producto. No inventa tallas ni las saca de
metacampos: cada boton es una variante, con su disponibilidad.

Dibuja UNA FILA POR OPCION. Casi todo el catalogo tiene una sola ("Tamano",
con 8 US y 10 US), pero los conjuntos llevan dos: el Cuban Set tiene la talla
de la cadena y la de la pulsera por separado. Antes esos productos no
mostraban nada; ahora muestran una fila para cada medida.

Con dos o mas opciones, un valor puede no existir: no toda combinacion tiene
variante. Esos se dibujan apagados y sin enlace, distintos de los agotados.

Cada boton es un enlace a ?variant=..., asi funciona sin JavaScript y el
enlace se puede compartir. Con una sola opcion y JavaScript, elegir talla no
recarga: se cambia el input del formulario. Con varias opciones siempre se
navega, porque al cambiar una medida cambian las combinaciones validas de la
otra, y recalcularlas en el navegador seria repetir en JavaScript lo que
Liquid ya sabe hacer bien.

## blocks/beneficios.liquid

### beneficios.liquid · 1

Saint Venik · Beneficios del producto
---------------------------------------------------------------------------
Tres ventajas cortas bajo el boton de compra: "Garantia de por vida",
"Resistente al agua y el sudor", "Hipoalergenico". No son las mismas para
todo el catalogo: los brillantes no resisten el agua, asi que ahi ese se
cambia por "Joyeria fina". Por eso cada beneficio decide a que productos
alcanza, en vez de haber una lista fija por tienda.

Cada entrada del metaobjeto `sv_beneficio` lleva:
nombre / nombre_en   el texto visible en cada idioma
icono                clave del juego de iconos (snippet sv-icono)
orden                posicion; manda sobre el orden de la lista
productos            productos elegidos a mano, para el panel
colecciones          colecciones elegidas, para el panel
handles              los handles que salen de las dos listas de arriba,
ya resueltos por el panel, entre barras: |a|b|c|
activo               permite apagarlo sin borrarlo

El emparejamiento se hace contra `handles` y no recorriendo `productos`:
un campo de lista de referencias solo deja leer 50 elementos por bucle en
Liquid, y una coleccion de oro pasa de 50 facil. Una cadena con los handles
no tiene ese tope y la comprobacion es un `contains`, no un bucle. El precio
es que el panel tiene que recalcularla cuando cambia una coleccion, y eso
lo hace al abrir la pantalla.

## blocks/guia-de-tallas.liquid

### guia-de-tallas.liquid · 1

Saint Venik · Guia de tallas
---------------------------------------------------------------------------
Dibuja un enlace que abre una ventana con la guia que corresponde al producto.

Que guia le toca lo decide el campo `palabras_clave` de cada guia: si alguna de
sus palabras aparece en el tipo, el titulo o las etiquetas del producto, esa es
su guia. Asi un producto nuevo encuentra su guia sin que nadie se la asigne.

El contenido y el texto del boton se editan en el panel de la app, no aqui.
El bloque solo se coloca una vez y ya.

Si el producto no encaja en ninguna guia, o la guia no tiene bloques visibles
en el idioma actual, no se dibuja nada: mas vale sin boton que con un boton
que abre una ventana vacia.

### guia-de-tallas.liquid · 2

Se recorre por posicion en vez de fiarse del orden de la lista,
que Shopify no garantiza. Son pocos bloques, asi que el coste de
recorrerlos varias veces no se nota.

## snippets/sv-icono.liquid

### sv-icono.liquid · 1

Saint Venik · Iconos de los beneficios
---------------------------------------------------------------------------
Un solo trazo de 1.5 sobre una rejilla de 24, sin relleno: el estilo es el
mismo en los doce, que es lo que los hace parecer una familia y no doce
iconos sueltos. El color lo pone `currentColor`, asi que el icono sigue al
texto de la pildora sin tener que tocarlo aqui.

La misma lista esta en admin/iconos.js, porque el panel tiene que poder
enseñarlos para elegir y Liquid no puede leer un .js. Ese archivo lo genera
`npm run iconos` desde aqui, y `npm run revisar` falla si se han separado.

Parametros:
nombre  clave del icono. Una clave desconocida no dibuja nada, a proposito:
un beneficio sin icono se ve igual de bien y es mejor que un hueco
con un interrogante.

### sv-icono.liquid · 2

El trazo se captura primero y solo despues se decide si hay svg que dibujar.
Antes habia una lista de claves conocidas aqui arriba para eso, pero era una
tercera copia de la misma lista: anadir un icono al `case` y olvidar la lista
daba un icono que el panel ofrecia y la tienda no pintaba, sin ningun error.

## snippets/sv-color-entry.liquid

### sv-color-entry.liquid · 1

Saint Venik · Una entrada del metaobjeto `color` dibujada como muestra.

Busca, entre el producto actual y sus hermanos, el que lleva la etiqueta de
esta entrada, y lo dibuja. Si ningun producto la lleva, no dibuja nada.

Parametros:
entrada            (metaobject) entrada del metaobjeto `color`
producto_actual    (product)    el producto de esta pagina
hermanos           (array)      custom.hermano_de_color
etiquetas_actuales (string)     etiquetas del producto actual, entre barras
etiqueta_propia    (string)     de que color es el producto actual. Solo esa
muestra se marca como la actual, aunque el
producto lleve mas etiquetas de color.
propias_hermanos   (string)     de que color es cada hermano, como
«|id:etiqueta|». Un hermano solo ocupa la
muestra de SU color. Si no llega (un tema
con el snippet viejo), basta con la etiqueta.
idioma             (string)     'es' o 'en'
mostrar_etiqueta   (boolean)
marcar_agotado     (boolean)

## snippets/sv-beneficio-icono.liquid

### sv-beneficio-icono.liquid · 1

Saint Venik · El icono de un beneficio
---------------------------------------------------------------------------
Manda la imagen subida; si no hay, el icono dibujado del juego de la app.
Es la misma regla que la muestra de color, donde la imagen manda sobre el
color, y conviene que se diga igual en el panel.

La precedencia vive aqui y no dentro de sv-icono.liquid porque ese archivo es
el ORIGINAL del juego de iconos: scripts/iconos.mjs lo lee por texto para
generar admin/iconos.js, y meterle logica lo dejaria colgando de su forma.

Un aviso que hay que dar en el panel: una imagen se muestra con sus propios
colores. Los iconos dibujados siguen al color del texto de la pildora
(stroke="currentColor"); un PNG no, asi que uno negro sobre fondo oscuro
desaparece.

Parametros: b (entrada de sv_beneficio), clase (para el <img>).

### sv-beneficio-icono.liquid · 2

Se distinguen por `url`, que SOLO tiene el archivo generico (un SVG): el
objeto de imagen de Liquid no lo expone y hay que pedirle `image_url`, que
ademas lo sirve ya escalado por la CDN. Mirar `.image` no sirve: eso es la
forma de GraphQL, no la de Liquid, y dejaba un <img src=""> vacio en la
ficha justo con un PNG, que es el caso normal.

## snippets/sv-beneficio-item.liquid

### sv-beneficio-item.liquid · 1

Saint Venik · Una linea de beneficio
---------------------------------------------------------------------------
Separado del bloque porque se dibuja desde tres sitios distintos del bucle
de ordenacion, y tenerlo tres veces era pedir que se separaran.

El ingles solo gana si esta escrito. Si `nombre_en` esta vacio se usa
`nombre`, que es lo que Translate & Adapt ya devuelve traducido: asi un
beneficio traducido por ahi no se rompe por crear el campo.

Parametros: b (entrada de sv_beneficio), lang ('es' | 'en').

## snippets/sv-color-filas.liquid

Selector de color en dos filas (11-nov, pedido del usuario para las pulseras Capri y los colgantes
Vault): arriba el metal (Plateado / Dorado: el broche, el colgante), abajo un segundo color (el
cordón de las Capri; la gema de los Vault).

- Lo dibuja `blocks/selector-color.liquid` solo si el producto lleva la etiqueta de un color que
  tiene «Fila» en el panel → Colores (campo `fila` / `fila_en` del metaobjeto `color`). Sin eso, la
  ficha sigue con la fila única de siempre: no cambia nada para los demás productos.
- Fila 1: las entradas sin «Fila» (los metales), en el orden de la app. Fila 2: las entradas con la
  misma «Fila» que el color del producto; su título es esa «Fila» (`fila_en` en inglés).
- Cada muestra enlaza a la joya de la familia (`custom.hermano_de_color`) con ese color y el mismo
  valor en la otra fila (Capri negra de plata → «Dorado» lleva a la negra de oro; «Azul» lleva a la
  azul de plata). Si esa combinación no existe, a cualquiera con ese color.
- Por eso la familia tiene que estar entera: en el panel → Productos, vincular dos joyas une sus
  familias completas (todas con todas, hasta 11).
- Se arma una clave por hermano, `|id:metal:segundo|`, y se busca con `contains`: Liquid no tiene
  mapas.

## snippets/sv-color-swatch.liquid

### sv-color-swatch.liquid · 1

Saint Venik · Una muestra de color.

Parametros:
producto         (product)  obligatorio
nombre           (string)   texto accesible y etiqueta visible
color            (color)    campo `muestra` del metaobjeto
imagen           (imagen)   campo `imagen_muestra`; manda sobre el color
actual           (boolean)  true si es el producto de esta pagina
mostrar_etiqueta (boolean)
marcar_agotado   (boolean)


## Notas que estaban dentro del código (movidas el 9-nov por el límite de 100 KB de Liquid)

**beneficios.liquid:** Se recorre por posicion en vez de fiarse del orden de la lista, que Shopify no garantiza. Son pocas entradas: el coste no se nota.

**filtros.liquid:** Esto va en linea para que la barra este en su sitio antes de pintarse; lo que hacen las pastillas y el menu esta en assets/sv-filtros.js.

**insignias.liquid:** Solo se descarga si el descuento esta encendido (o en vista previa). sv-badges.js lo espera: ver el final de ese archivo.

**insignias.liquid:** Por posicion, igual que el bloque de la ficha: el orden de la lista que devuelve Shopify no esta garantizado y aqui cada beneficio cae sobre una foto distinta, asi que el orden se nota.

**selector-color.liquid:** Nombre del color de este producto, para el encabezado: el de SU color, no el de la primera etiqueta de color que lleve. Una Vienna verde se llama «Verde» aunque tambien lleve `oro`.

**selector-color.liquid:** 2) Colores que existen en el metaobjeto pero no estan en el ajuste: van detras, en el orden del metaobjeto, para que un color nuevo aparezca sin tener que tocar nada.

**selector-color.liquid:** 3) Red de seguridad: un producto sin ninguna etiqueta de color se dibuja igual con su imagen destacada, en vez de desaparecer.

**sv-color-entry.liquid:** En ingles manda nombre_en si alguien lo escribio en el panel. Si esta vacio se usa nombre, que Translate & Adapt ya devuelve traducido: asi los colores que no se tocaron siguen como estaban.

**sv-guia-bloque.liquid:** Saint Venik · Un bloque de la guia de tallas. Parametros: bloque (metaobject bloque_guia) lang (string) 'es' o 'en'

**sv-guia-bloque.liquid:** width y height con las medidas reales: el navegador reserva el hueco antes de descargar la imagen y la ventana no da un salto al abrirse.

**sv-guia-bloque.liquid:** Se extrae el identificador de YouTube a mano: Liquid no tiene expresiones regulares, y split es suficiente para las dos formas de URL que existen.

**sv-icono.liquid:** Tuerca: metal, no escudo. El escudo es el de garantia, y dos escudos iguales en la misma ficha no distinguen nada.

**sv-inicio.liquid:** Banner «Tu cadena de cada dia» (reunion 9-nov): foto mas cerca de la cadena, texto sobre degradado, boton chico redondeado, sin espacios blancos y el texto entra suave. Ver docs/tema.md.

**sv-portada.liquid:** Navidad (9-nov): banners de terciopelo rojo, sv-navidad-portada-<foto>.jpg en Archivos, uno por cada foto de verano (coleccion_<foto>.jpg); Best Sellers tiene el suyo (sv-navidad-portada-bestsellers.jpg) en vez del de cadena. Con la temporada en Navidad, o con ?sv-navidad=1 para verlo antes (=0 lo quita). Ver docs/tema.md.

## Más notas movidas el 10-nov (para dejar sitio a los filtros del 3x2)

**selector-talla.liquid:** Si no queda ninguna variante disponible -los dos Cuban Set estan asi- el filtro devuelve vacio, y sin este respaldo no habria con que comparar y todos los botones saldrian como inexistentes.

**selector-talla.liquid:** La apariencia la manda la app. El ajuste del editor de temas queda de respaldo por si la configuracion todavia no existe.

**selector-talla.liquid:** Se coge con un bucle y no con `.first`. La lista que devuelve shop.metaobjects.<tipo>.values dice que tiene una entrada, pero `.first` sobre ella devuelve vacio: no es un array normal. Con `.first` la configuracion de la app se ignoraba entera y todo caia en los valores de respaldo del tema.

**selector-talla.liquid:** Para comparar combinaciones se juntan los valores en una cadena. El separador es raro a proposito: un valor con espacios o guiones no puede producir una coincidencia falsa.

**selector-talla.liquid:** Con una sola opcion manda el encabezado del bloque ("Talla" / "Size"). Con varias, cada fila se llama como su opcion, que es lo unico que las distingue.

**selector-talla.liquid:** La combinacion buscada es la elegida ahora mismo, cambiando solo esta opcion. Asi cada fila respeta lo que haya elegido el cliente en las otras.

**selector-talla.liquid:** El filtro t va aparte: encadenado detras del append se aplicaria a la frase entera, y se imprimiria "Translation missing: es.8 US — sold_out".

**insignias.liquid:** Los beneficios de ESTA ficha, para pintarlos sobre las fotos. Es el mismo dato que usa el bloque de la ficha, pero aqui hay que resolverlo otra vez: el bloque dibuja donde el tema le deja, y sobre una foto solo se puede llegar por javascript.

**insignias.liquid:** La configuracion de la app manda sobre los ajustes del tema, igual que en los otros tres bloques. Se coge con un bucle y no con `.first`, que sobre shop.metaobjects.<tipo>.values devuelve vacio.

**insignias.liquid:** Los booleanos no se pueden resolver con `default`: `false | default: true` da true, asi que apagarlo desde la app no apagaria nada. Van como 'si'/'no'.

**insignias.liquid:** El tipo de campo `color` de Shopify es hexadecimal de seis digitos y no admite alfa, asi que la opacidad va en su propio campo de 0 a 100 y el rgba se compone aqui. Ojo con el 100.0: `80 | divided_by: 100` con dos enteros da 0, y dejaria todo invisible sin dar ningun error.

**insignias.liquid:** Un campo de tipo `color` no devuelve una cadena, devuelve un objeto Color, y `json` sobre un objeto no da "#111111". El append lo pasa por to_s, que si da el hexadecimal.
