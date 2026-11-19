# App de devoluciones propia: estructura y flujos (propuesta, 19-nov-2026)

Base: lo que hace hoy Reversso en Saint Venik (ver `docs/reversso-analisis.md`). Condición para
construirla: que la API de Amplifica genere sola la etiqueta de devolución de Blue Express.

## 1. Piezas

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **Portal del cliente** | Donde el cliente pide cambio, devolución o garantía | Dentro de la tienda: `saintvenik.cl/apps/cambios` (proxy de Shopify), con el diseño de la marca |
| **Panel del equipo** | Tickets, autorizar/aprobar, etiquetas, configuración | Dentro del admin de Shopify, como Panel Saint Venik |
| **Servidor** | Reglas, base de datos, tareas automáticas, avisos | Servidor pequeño (US$5–20/mes) + base de datos + almacenamiento de fotos |
| **Shopify** (API) | Pedidos, fecha de entrega, catálogo y stock, pedido nuevo del cambio, cobro de la diferencia, reembolsos, gift cards, reposición | Ya existe |
| **Amplifica** (API) | Etiqueta Blue Express de devolución, seguimiento, aviso de llegada a bodega, despacho del pedido nuevo | Ya existe (hay que validar la etiqueta) |
| **Correos** | Confirmación, etiqueta, recordatorios, aprobado/rechazado, gift card | Servicio de correo (o Klaviyo) |

Datos que guarda: **ticket** (#R…, tipo, estado, pedido, cliente, motivo, fotos, comentario), productos
devueltos y solicitados, **logística** (método, etiqueta, seguimiento, estado), **pagos** (diferencia,
etiqueta, envío), **reembolso** (medio, monto), **historial** de todo lo que pasó, y la **configuración**
(plazos, motivos, reglas, textos).

## 2. Portal: los 4 pasos (iguales para los 3 casos)

0. **Entrada:** número de pedido + correo o teléfono. Regalo: solo número de pedido.
   La app revisa: pedido entregado, dentro de plazo (desde la fecha de entrega), productos que se pueden
   devolver (sin tag de no retornable, no devueltos antes).
1. **Productos:** elige qué devolver, el motivo y sube fotos (mínimo 2) y comentario.
2. **Qué quiere:**
   - **Cambio:** buscador + recomendados + «el mismo en otra talla»; muestra solo lo que tiene stock. Si el
     nuevo vale más, paga la diferencia (venta adicional); si vale menos, no se permite.
   - **Reembolso:** gift card o medio de pago original.
3. **Envío:**
   - Devolver: **Blue Express (etiqueta por correo)**, entrega en tienda, o **sin logística** (garantía).
   - Recibir el nuevo: Amplifica a domicilio o retiro en sucursal.
   - Datos y dirección (editables).
4. **Resumen y pago:** si hay algo que pagar (diferencia, etiqueta o envío) se paga con el **checkout de
   Shopify** (mismo medio de pago de la tienda, sin pasarela aparte). Se crea el ticket.

## 3. Los 3 flujos

**Cambio**
1. Cliente confirma (y paga si corresponde).
2. La app pide a Amplifica la **etiqueta Blue Express** → se la manda por correo.
3. Cliente deja el paquete → seguimiento automático.
4. Amplifica lo recibe en bodega → el equipo revisa y **aprueba**.
5. Se libera el **pedido nuevo en Shopify** → Amplifica lo despacha.
6. Cerrado.

**Devolución**
1. Cliente confirma (paga la etiqueta si la regla lo dice).
2. Etiqueta Blue Express por correo.
3. Paquete en camino → recibido en bodega.
4. El equipo revisa y aprueba → **reembolso** (gift card al instante o al medio de pago original).
5. Cerrado.

**Garantía** (motivo «El producto está dañado»)
1. Fotos obligatorias → queda **en revisión**.
2. El equipo **autoriza o rechaza** mirando las fotos.
3. Si autoriza: **sin logística** (no se devuelve) y se repone gratis (pedido nuevo con envío gratis) o se
   reembolsa.
4. Cerrado.

## 4. Estados del ticket

```
Borrador ─▶ Pago pendiente ─▶ Autorización pendiente* ─▶ Esperando entrega ─▶ En camino
   ─▶ Recibido en bodega ─▶ Aprobación pendiente ─▶ Aprobado ─▶ (pedido nuevo despachado | reembolsado) ─▶ Cerrado
* solo garantías

Salidas: Cancelado (no pagó en 2 días, con 3 recordatorios)
         Rechazado (no entregó el paquete en 5 días, con 6 recordatorios; o no pasó la revisión)
```

## 5. Panel del equipo

- **Inicio:** pendientes por autorizar, por aprobar y por reembolsar.
- **Tickets:** lista con filtros por estado, tipo y courier; detalle con fotos, pagos, seguimiento,
  historial y botones **Autorizar / Aprobar / Rechazar / Reembolsar**.
- **Etiquetas:** todas las etiquetas con su estado (por dejar, en camino, entregada, vencida).
- **Configuración:** plazos, motivos, reglas de logística y precios, reglas del 3x2, textos del portal y
  correos.
- **Estadísticas:** tickets, motivos, venta adicional, tiempos.

## 6. Lo automático (servidor)

- Al confirmar: crear etiqueta (Amplifica), mandar correo con etiqueta e instrucciones.
- Cada pocas horas: actualizar seguimiento, recordatorios, cancelar/rechazar vencidos.
- Al recibir en bodega: avisar al equipo.
- Al aprobar: liberar pedido nuevo o hacer el reembolso en Shopify, y reponer stock.

## 7. Etapas

0. **Validar** la etiqueta Blue Express con la API de Amplifica (sin esto no se sigue).
1. **Devoluciones y garantías** (portal, etiqueta, panel, reembolsos, correos).
2. **Cambios** con venta adicional, pago de diferencia y pedido nuevo.
3. **Reglas del 3x2**, estadísticas y cambio desde Reversso (los tickets abiertos terminan en Reversso).
