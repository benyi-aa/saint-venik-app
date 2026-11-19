# Reversso: cómo funciona hoy en Saint Venik y si una app propia es viable (19-nov-2026)

Fuentes: grabación del panel (19-nov, 10:32), recorrido del panel `dashboard.reversso.com` con la sesión
de la tienda, y recorrido del portal del cliente `saintvenik.reversso.cl` con 3 pedidos reales ya
entregados (1SV64669, 1SV64696, 1SV64680). En el portal se llegó hasta antes de confirmar: **no se creó
ningún ticket ni etiqueta** (comprobado en Tickets: el último es #R4413, anterior a las pruebas).

Respuestas de Benjamín (19-nov):
- No hay cuenta propia con Blue Express; es de Amplifica o de Reversso.
- Amplifica sí tiene API.
- Una app propia **solo es viable si la etiqueta de Blue Express se genera sola** al aprobarse el caso.
- Reversso funciona bien, pero no adapta el 3x2 sin costo extra.
- Amplifica solo recibe devoluciones; la logística inversa la hace Reversso.

---

## 1. Números de hoy (panel de Reversso)

| | |
|---|---|
| Tickets últimos ~30 días | 217: 164 cambios (76 %), 53 devoluciones (24 %) |
| Últimos 7 días | 62 tickets: 51 cambios, 11 devoluciones |
| Tickets con venta adicional (upselling) | 19 %; $197.217 en el período |
| Motivos más comunes | Cambiar la talla 38 %, producto dañado 29 %, no me gustó 16 %, no cumplió expectativas 15 % |
| Tiempo del cliente en el portal | mediana 7 min |
| Tiempo de reembolso | ~9 días 11 h |
| Courier, tiempo promedio | Chilexpress 1 d 8 h · **Blue Express 2 d 23 h** · Uber 4 d 21 h |
| Etiquetas | 152 pendientes de drop-off, 10 en camino (casi todas Blue Express) |
| Pendientes ahora | 5 por autorizar, 13 por aprobar, 0 por reembolsar |
| **Costo Reversso** | Plan «Saint Venik» **UF 9 + IVA al mes** (hasta 2.400 tickets, 4 usuarios). Facturación real ~**$450.000/mes** |
| Lo que Reversso le transfiere a SV | entre ~$120.000 y ~$1.060.000 al mes (lo que pagan los clientes por diferencias y etiquetas); los últimos 6 meses entre $198.000 y $537.000 |

> Dato raro en Facturación: el período 28/02/2026 marca $43.137.454 «a pagar a Reversso». Revisarlo con ellos.

## 2. El portal del cliente, paso a paso (lo que ve el cliente)

**Entrada** (`saintvenik.reversso.cl`): número de orden + correo o teléfono del pedido. Fondo con
foto de marca, logo, preguntas frecuentes (políticas de devolución y cambio, estado del producto,
plazo de pago 2 días hábiles). **Flujo de regalo** («¿Quieres cambiar un regalo?»): pide **solo el número
de orden**.

**Paso 1 · Productos:** muestra cada producto del pedido con talla y **precio realmente pagado**.
Al elegir uno: motivo (4 motivos), comentario y **mínimo 2 fotos obligatorias**, con instrucción
«Necesitamos una foto de tu producto en su totalidad».

**Paso 2 · ¿Qué te gustaría?** Dos pestañas:
- **Cambio:** buscador + **21 recomendados** (primero «Mismo que devuelves»). Cada producto se abre en una
  ficha dentro del portal: fotos, precio lista, tallas con stock y «También te podría interesar».
  **Upselling:** si el nuevo vale más, paga la diferencia (prueba: devuelve $18.692, recibe $23.990 →
  paga **$5.298**). Cambios por menor valor: **no permitidos**.
- **Reembolso:** «Gift Card» (código para comprar en la tienda) o «Medio de pago original».

**Paso 3 · Envío.** Datos personales (pide **RUT obligatorio**; nombre, teléfono y correo vienen del pedido) y
dirección (editable). Opciones según reglas:
- Devolver: **Devolución en tienda – gratis** · **Blue Express – $2.368** (etiqueta por correo; se deja en
  sucursal Blue Express o Punto Copec) · **Uber retiro a domicilio 30 min – $5.896**.
- Recibir el nuevo (cambios): Amplifica estándar $3.290 · Ultra Express PedidosYa/Uber $4.990 ·
  **retiro en Sucursal Amplifica Centro o La Reina – gratis**.
- **Garantía:** solo «**Sin Logística – Gratis**» (no se manda el producto), total a pagar $0.

**Paso 4 · Resumen y pago** (no se ejecutó en la prueba): confirma, cobra con **Mercado Pago** lo que
corresponda (diferencia + etiqueta + envío) y crea el ticket. Si es garantía, queda «En revisión» hasta
que el equipo la autorice.

## 3. El panel (lo que hace el equipo)

- **Tickets:** lista con filtros (Autorización pendiente, Aprobación pendiente, Reembolso pendiente,
  Reembolso de rechazo pendiente), búsqueda, exportar CSV, crear ticket manual.
- **Detalle de ticket:** productos devueltos y solicitados (con fotos, motivo, comentario), datos del
  cliente, información de pago (ej. envío $3.990 + etiqueta $2.368 = $6.358 pagado por Mercado Pago),
  **seguimiento** (etiqueta Blue Express, descargar etiqueta, nº de seguimiento, «el cliente aún no
  entrega»), **aprobación** (al aprobar se confirma el pedido nuevo en Shopify para despacho; desglose de
  reembolsos), datos internos, costo de etiqueta, tareas pendientes («Envío de nuevos productos: pedido
  1SV64777», se cierra solo al despacharse), historial completo, evaluación del cliente, notas.
- **Al crear un cambio** Reversso ya **crea el pedido nuevo en Shopify** (ej. 1SV64777) con etiqueta
  «Amplifica», y se libera al aprobar.
- **Automatizaciones:** cancelación automática a los 2 días si no paga (3 recordatorios); rechazo
  automático a los 5 días si no entrega el paquete (6 recordatorios).
- **Etiquetas de devolución:** listado de etiquetas con courier, seguimiento y estado (pendiente de
  drop-off, en tránsito, entregada, por vencer, vencida); etiqueta manual.
- **Estadísticas, NPS** (sin respuestas), **Quiebres de stock** (módulo nuevo, no activado).
- **16 correos automáticos** al cliente (devolución y cambio: pendiente, autorizado, rechazado, aprobado,
  cancelado, recordatorios) + correo de gift card y de reembolso.

## 4. Configuración actual (lo que habría que replicar)

| Tema | Cómo está |
|---|---|
| Plazos | Desde la **fecha de entrega**: devoluciones 10 días, cambios 20 días, garantía 1.500 días |
| Upselling | Sí; buscador de productos sí; por categorías no; recomendados sí; inventario de seguridad 0 |
| Revisión manual | **Solo garantías** (el resto se autoriza solo) |
| Fotos | Obligatorias, mínimo 2 · Comentario: opcional |
| Datos del cliente | Puede editar datos y dirección; se borra la dirección si el pedido era «Retiro en tienda» |
| Regalos | Flujo de regalo activo; sin devoluciones de dinero en regalos |
| Reembolso del envío original | No |
| Motivos | Cambiar la talla · No cumplió mis expectativas · **El producto está dañado (garantía)** · No me gustó · sin «Otros» |
| Políticas avanzadas | Tag «Reversso» en el producto → no permite cambios ni devoluciones (otra regla con el mismo tag deja solo la garantía) |
| Medios de reembolso | Gift Card y medio de pago original (sin pedir datos bancarios) |
| Cobro al cliente | Mercado Pago (credenciales de Reversso) |
| Couriers | Sin Logística, Uber, **Blue Express**, Chilexpress activos; sucursales Amplifica inactivas como courier. **Blue Express sin credenciales propias: usa la cuenta de Reversso** |
| Devolución en tienda | Activa, elige sucursal, sin confirmación manual |
| Bodegas | Centro Envíos Amplifica (predeterminada, Carmen 1323), Amplifica Santiago Centro, La Reina, Lo Barnechea |
| Reglas de logística (devolver) | 1) Producto dañado → Sin logística gratis · 2) Garantía → Uber con $1.785 de descuento, Blue Express y tienda gratis · 3) Por defecto (talla, expectativas, no me gustó) → Uber, Blue Express y Chilexpress a **tarifa completa**, tienda gratis |
| Reglas de despacho (nuevo) | Garantía → envío gratis · Cambio → tarifas de envío de Shopify (incluye retiro en sucursal) |
| Reposición | Básica (manual), no automática por Shopify |
| Tickets | Prefijo #R |

**Inconsistencia a corregir:** la política de cambio del portal dice «el envío del nuevo producto será
cubierto por Saint Venik», pero la regla cobra el envío del nuevo producto con tarifa de Shopify ($3.290+).

**3x2:** Reversso **reparte el descuento del 3x2 entre las tres joyas** (pedido 1SV64680: la que salió
gratis figura a $18.660, las otras a $23.660 y $20.660). Si devuelven una, reciben esa parte y se quedan
con las otras dos con descuento. Personalizar esto cuesta extra en Reversso.

## 5. ¿Es viable una app propia?

**Sí, técnicamente**, con una condición que decide todo (la de Benjamín):

> **¿La API de Amplifica puede crear sola una etiqueta de devolución de Blue Express** (desde la casa del
> cliente hacia su bodega) y devolver el PDF y el número de seguimiento?

Si la respuesta es sí, todo lo demás se puede construir sobre Shopify. Si es no, no conviene: habría
que contratar Blue Express directo o seguir con Reversso.

**Qué tendría que tener la app para igualar lo que se usa hoy:**
1. Portal: entrada por pedido + correo/teléfono, flujo de regalo, preguntas frecuentes, diseño de marca.
2. Los 3 casos (cambio, devolución, garantía) con motivos, fotos obligatorias y plazos desde la entrega.
3. Cambio con catálogo, stock, tallas, recomendados y **pago de la diferencia** (se puede cobrar con el
   propio checkout de Shopify, sin pasarela aparte).
4. Reglas de logística por motivo y opciones de envío (Blue Express vía Amplifica, devolución en tienda,
   sin logística para garantía; retiro en sucursal para el producto nuevo).
5. Panel del equipo: tickets, autorizar/aprobar/rechazar, reembolsos (gift card o medio original),
   pedido nuevo en Shopify para Amplifica, seguimiento de la etiqueta, recordatorios y vencimientos
   automáticos, correos al cliente, estadísticas.
6. **Reglas propias para el 3x2** (lo que Reversso cobra aparte).

**Esfuerzo honesto:** igualar todo esto es más que la primera versión de 1–2 semanas que se estimó para
«solo la etiqueta». Para reemplazar Reversso completo: **4 a 6 semanas** de trabajo, más pruebas con
pedidos reales antes de cambiar. Se puede hacer por etapas: primero devoluciones y garantías, después
cambios con upselling.

**Comparación de costo:** Reversso cuesta UF 9 + IVA (~$430.000) al mes. La app propia: servidor de
US$5–20/mes más las etiquetas que cobre Amplifica (hoy el cliente ya paga $2.368 por la de Blue Express).

## 6. Próximo paso (antes de ver reglas)

1. Pedir a Amplifica la **documentación de su API** y una credencial de prueba.
2. Probar crear **una etiqueta de devolución de Blue Express** por API (desde una dirección de cliente a su
   bodega) y ver si devuelve PDF y número de seguimiento, y si informa los cambios de estado.
3. Si funciona → recién ahí definir reglas (plazos, 3x2, quién paga la etiqueta) y armar la app por etapas.
