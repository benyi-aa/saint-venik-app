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

Una automatización por tienda, **cada hora**:

1. Disparador «Scheduled time» (cada 1 hora).
2. «Get product data»: `tag:sv-conjunto` (hasta 100).
3. «For each» conjunto → «Send Admin API request» `productVariantsBulkUpdate` con el precio
   calculado en Liquid a partir de `custom.conjunto_joyas` (precio mínimo de cada joya) y
   `custom.conjunto_descuento`, con el mismo redondeo de arriba.

Así, si alguien cambia el precio de una joya en el admin, el conjunto se corrige dentro de
la hora. Si se cambian las joyas o el descuento, mejor hacerlo desde el panel (guarda y
recalcula al tiro).

Flow: en .com ya estaba instalado; en .cl se instala desde la Shopify App Store (gratis).
