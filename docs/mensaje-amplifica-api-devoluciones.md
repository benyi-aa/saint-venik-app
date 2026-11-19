# Mensaje para Amplifica: API de etiquetas de devolución (19-nov-2026)

Condición de Benjamín y del usuario: la etiqueta de Blue Express tiene que salir **100 % automática**,
como hoy con Reversso. Sin eso no se hace la app propia (ver `docs/reversso-analisis.md`).

> **Ojo (19-nov, tarde):** Reversso no usa a Amplifica para la etiqueta: usa la **API Corp de Blue Express**
> con su propia cuenta (ver sección 5b de `docs/reversso-analisis.md`). El camino más seguro es pedirle a
> **Blue Express** una cuenta de empresa con API Corp; este mensaje a Amplifica queda como alternativa.

---

**Asunto:** API para etiquetas de devolución automáticas con Blue Express – Saint Venik

Hola [nombre], ¿cómo estás?

Te escribo de Saint Venik (saintvenik.cl). Estamos evaluando tener nuestra propia plataforma de cambios
y devoluciones, conectada a Shopify y a ustedes. Hoy recibimos unas 200 solicitudes al mes y la mayoría
vuelve a su bodega por Blue Express, con etiquetas que genera Reversso.

Para nosotros es requisito que la etiqueta salga **100 % automática**: el cliente confirma su cambio o
devolución en nuestra web y, en ese mismo momento, nuestro sistema le pide la etiqueta a su API y se la
manda por correo, sin que nadie de su equipo ni del nuestro la cree a mano.

Necesitamos confirmar:

1. ¿Su API puede crear una etiqueta de devolución de Blue Express desde la dirección del cliente
   (cualquier comuna de Chile) hasta su bodega?
2. ¿Entrega en la respuesta el PDF de la etiqueta y el número de seguimiento?
3. ¿El cliente puede dejar el paquete en cualquier sucursal Blue Express o Punto Copec? ¿Cuántos días
   dura vigente la etiqueta?
4. ¿La API informa los estados del envío (dejado en sucursal, en tránsito, recibido en bodega), por aviso
   automático (webhook) o por consulta?
5. Cuando la devolución llega a su bodega, ¿cómo nos avisan y cómo queda asociada al pedido?
6. ¿Cuál es el costo por etiqueta? ¿Hay algún costo de integración?
7. ¿Nos pueden enviar la documentación de la API y una credencial de prueba para generar una etiqueta de
   prueba?

Si su API no permite crear estas etiquetas de forma automática, también nos sirve saberlo para evaluar
otra alternativa.

Quedo atento, ¡gracias!

Saludos,
[tu nombre]
Saint Venik
