# Conjuntos con precio automático (11-nov-2026)

Pedido: cada conjunto (colección `conjuntos`, dos joyas juntas) vale la **suma de los precios
de sus dos joyas, menos 15 %**, redondeado para que **termine en 990** en saintvenik.cl
(62.990) y en **,90** en saintvenik.com (102.90). Si sube una joya, sube el conjunto: nunca
queda desactualizado.

## Dónde se configura

Panel Saint Venik → **Conjuntos** (`admin/conjuntos.js` + `pintarConjuntos` en `admin/app.js`).

- Arriba: el **descuento** (15 % de fábrica) y «Guardar todos».
- Una tarjeta por conjunto: sus dos joyas (con precio de hoy), un buscador para cambiar una,
  la cuenta (`A + B = suma − 15 % → precio`) y si está «Al día» o «Por guardar».
- La primera vez las joyas se **detectan solas desde la descripción** del conjunto
  («Incluye: - Cadena Miami Cuban 5mm 50cm - Hermés Pendant + Cadena Rope 2.5mm»): de cada
  línea vale lo que va antes del «+» (el colgante trae su cadena fina) y el metal tiene que
  coincidir (un conjunto «(Oro)» lleva joyas «Oro»). Hay que revisarlas antes de guardar.
- «Guardar» escribe en el producto del conjunto:
  - `custom.conjunto_joyas` (lista de productos, las dos joyas),
  - `custom.conjunto_descuento` (entero, el %),
  - etiqueta `sv-conjunto` en el conjunto y `sv-conjunto-parte` en cada joya,
  - el precio de **todas** sus variantes = precio calculado; precio «antes» (tachado) = suma.

Precio de una joya = su variante **más barata** (`priceRangeV2.minVariantPrice`). Todas las
variantes del conjunto (tallas) quedan con el mismo precio, como ya estaban.

## Redondeo

- Pesos: al 990 más cercano → `round((v + 10) / 1000) × 1000 − 10`. 66.300 → 65.990; 66.600 → 66.990.
- Dólares: al ,90 más cercano → `round(v + 0,1) − 0,1`. 94,35 → 93,90; 94,60 → 94,90.

## Al día solo: Shopify Flow

Automatización **«Conjuntos: precio automático (Panel Saint Venik)»**, activa en las dos
tiendas desde el 11-nov-2026 (admin → Apps → Flow). Flow no permite repetir cada hora
(solo días/semanas/meses), así que tiene **6 programaciones diarias: 0:00, 4:00, 8:00,
12:00, 16:00 y 20:00** (hora de Santiago) = revisa cada 4 horas.

1. **Scheduled time** con las 6 programaciones (cada una «Todos los días»).
2. **Get product data** · máximo 100 · consulta avanzada
   `tag:sv-conjunto OR tag:sv-conjunto-parte` (conjuntos y sus joyas; .cl ~50, .com ~60).
3. **For each** sobre `getProductData`.
4. Dentro, **Send Admin API request** · `productVariantsBulkUpdate` con el Liquid de abajo.
   - Si el producto es un conjunto (etiqueta exacta `sv-conjunto`) y encuentra sus dos
     joyas en la lista: pone a todas sus variantes el precio calculado y el «antes» = suma.
   - Si es una joya (o un conjunto al que le falta una joya): reescribe el precio que ya
     tiene su primera variante, o sea no cambia nada (Flow siempre manda la mutación).

La prueba de Flow («Seleccionar evento de prueba») **no escribe**: solo muestra la
mutación por artículo. Así se comprobó: .com «Atemporal Set» → 72.9 / 86.0;
.cl «Compass II Miami Cuban 5mm Set (Oro)» → 58990 / 68980 (iguales al panel).

Liquid de .cl (en .com cambia solo la línea de `precio`, ver abajo):

```liquid
{%- assign joyas = "" -%}{%- assign d = 15 -%}
{%- for m in getProductDataForeachitem.metafields -%}
{%- if m.namespace == "custom" and m.key == "conjunto_joyas" -%}{%- assign joyas = m.value -%}{%- endif -%}
{%- if m.namespace == "custom" and m.key == "conjunto_descuento" -%}{%- assign d = m.value | plus: 0 -%}{%- endif -%}
{%- endfor -%}
{%- assign suma = 0 -%}{%- assign n = 0 -%}
{%- if getProductDataForeachitem.tags contains "sv-conjunto" -%}
{%- for p in getProductData -%}
{%- assign q = p.id | prepend: '"' | append: '"' -%}
{%- if joyas contains q -%}
{%- assign min = -1 -%}
{%- for v in p.variants -%}{%- assign x = v.price | plus: 0 -%}{%- if min < 0 or x < min -%}{%- assign min = x -%}{%- endif -%}{%- endfor -%}
{%- assign suma = suma | plus: min -%}{%- assign n = n | plus: 1 -%}
{%- endif -%}
{%- endfor -%}
{%- endif -%}
{%- if n == 2 -%}
{%- assign f = 100 | minus: d -%}
{%- assign precio = suma | times: f | divided_by: 100.0 | plus: 10 | divided_by: 1000.0 | round | times: 1000 | minus: 10 -%}
{%- assign antes = suma | round -%}
{"productId": "{{ getProductDataForeachitem.id }}", "variants": [{%- for v in getProductDataForeachitem.variants -%}{"id": "{{ v.id }}", "price": "{{ precio }}", "compareAtPrice": "{{ antes }}"}{%- unless forloop.last -%},{%- endunless -%}{%- endfor -%}]}
{%- else -%}
{"productId": "{{ getProductDataForeachitem.id }}", "variants": [{%- for v in getProductDataForeachitem.variants limit: 1 -%}{"id": "{{ v.id }}", "price": "{{ v.price }}"}{%- endfor -%}]}
{%- endif -%}
```

En .com (dólares, termina en ,90):

```liquid
{%- assign precio = suma | times: f | divided_by: 100.0 | plus: 0.1 | round | minus: 0.1 | round: 2 -%}
{%- assign antes = suma | round: 2 -%}
```

Cómo se escribió en el editor de Flow (navegador del panel): el editor es CodeMirror;
`cmd+a` no funciona, sí `cmd+Home` y luego `cmd+shift+End` para seleccionar todo y
escribir encima (si se deja vacío, Flow vuelve a poner la plantilla). Escribir por
trozos que terminen en `-%}` + salto de línea evita líos con el autocierre de llaves.

## Estado al 11-nov-2026

- .cl: 23 conjuntos (19 publicados + 4 borradores), todos con sus dos joyas y precio nuevo.
- .com: 42 conjuntos (con borradores y duplicados antiguos); 36 con precio nuevo. Quedan
  **6 sin sus dos joyas** (mantienen su precio): «Miami cuban OT Link Set (Oro)» publicado
  (en .com no hay «Pulsera Link OT Oro» activa) y 5 borradores Fleur de lis / OT (sin sus
  joyas oro activas en .com). Se completan en el panel si se crean esas joyas.
- Respaldo de los precios anteriores: `branding/respaldos-tema/2026-11-11-conjuntos-precios/`.
