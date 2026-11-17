# Gift card (tarjeta de regalo electrónica) — 17-nov-2026

Pedido de Benjamín: gift card como la de CRAFTD (montos 25–250), tarjeta negra metalizada con el logo blanco
y moño burdeo (estilo de la de Plena, más premium que la de CRAFTD), funcionando de verdad y explicada para
servicio al cliente. Guía de una página para el equipo: `docs/gift-card-guia.pdf`.

## Dónde está
| | .cl (saint-venik) | .com (vd9tn0-et) |
|---|---|---|
| Producto | «Gift Card Electrónica», id 10594163523887 (ya existía) | «Gift Card Electrónica», id 8554938466351 (nuevo 17-nov) |
| URL | /products/tarjeta-de-regalo-electronica | /products/tarjeta-de-regalo-electronica · /en/products/electronic-gift-card |
| Montos (opción «Monto») | $25.000 · 50.000 · 100.000 · 150.000 · 200.000 · 250.000 | $25 · 50 · 100 · 150 · 200 · 250 (USD; en /en la opción es «Amount») |
| Plantilla del tema | `product.gift-card` | `product.gift-card` |

Es un producto de tipo tarjeta de regalo de Shopify (Productos → Tarjetas de regalo): al pagarse, Shopify crea
un código único, lo manda por correo y marca el pedido «Preparado · Envío no requerido». Las compradas no
caducan. Los descuentos no aplican a la compra de una gift card ni se puede pagar una gift card con otra.

## Qué se cambió
- .cl: el monto $100.000 cobraba $120.000 (corregido); opción «Denominaciones/Tamaño» → «Monto» con montos
  con punto; agregado $250.000; quitada la etiqueta `acero-inox`; plantilla `acero-inoxidable` → `gift-card`.
- Plantilla `templates/product.gift-card.json` en los dos temas en vivo: bloques precio, monto, botón con
  `show_gift_card_recipient: true` (casilla «Quiero enviar esto como un regalo»: correo, nombre, mensaje y
  fecha de envío de quien la recibe), separador, descripción, compartir. Sin bloques de joyería.
  Respaldo de cómo estaba: `admin/gift-card/respaldo/`.
- Foto (una sola, la misma en .cl y .com): `admin/gift-card/sv-gift-card-premium-4.jpg`, 1440×2160. Acero negro
  cepillado, horizontal en 3/4, cinta y moño burdeo en el lado izquierdo de la tarjeta, estudio oscuro azul acero
  con piso que refleja. Elegida por Benjamín entre 4 acabados metálicos. Las esquinas venían cortadas: se redondearon
  con una edición del generador pegando solo esas zonas (pegar-zonas.py). Antes se probaron versiones sobre fondo
  blanco (`sv-gift-card-1/2.jpg`, descartadas por poco premium). Foto anterior de .cl: `admin/gift-card/respaldo/`.
- .com en inglés: Translate & Adapt (título, descripción, handle `electronic-gift-card`, opción «Amount»).
  En el editor de T&A los clics no llegan con tamaño emulado: usar el tamaño propio del panel.

## Prueba (17-nov, .cl)
Pedido preliminar #D167 → «Marcar como pagado» → pedido 1SV64600 (nota y etiqueta `prueba-gift-card`).
Shopify creó la gift card …d73g de $25.000, «No caduca», y la envió por correo. Ojo: el pedido queda en
«Sucursal Amplifica Envíos» (Shopify lo marca preparado solo; no hay nada que despachar).

## Ojo
- En .cl la gift card entra sola en las colecciones automáticas por precio («Inferior a $30.000/$40.000/$60.000»).
- En .com no está en ninguna colección ni menú todavía.
