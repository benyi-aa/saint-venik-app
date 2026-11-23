# Molvek · Videos founder con avatar IA (23-11-2026) — LISTOS PARA ÁNGELO

Los dos videos que van arriba de las páginas «Presión · Antes de cancelar» y «Firmeza · Antes de cancelar» de Loop.
Guiones: v8 aprobado el 17-11 (`docs/molvek-guiones-founder-v8.md`), sin cambiar una palabra. Método: skill `avatar-ia`
(SOP Avatar IA v5 + Yappers, familia D «el fundador»). El de Alpha no se hace todavía (gomita de 4 g y suscripción).

## Qué hay en `docs/video-antes-de-cancelar/`

| Archivo | Qué es |
|---|---|
| `Molvek_Omni_V2_FounderPresion.pdf` | Presión: 16 clips, ~110 s de habla, 27 páginas, un clip por página (copiar y pegar) |
| `Molvek_Omni_V3_FounderFirmeza.pdf` | Firmeza: 16 clips, ~104 s de habla, 27 páginas |
| `Molvek_Founder_imagen-0-madre.jpg` | la imagen madre aprobada por Diego: la base de 14 clips de cada video |
| `Molvek_Founder_imagen-P-frasco.jpg` | el founder con el frasco: la base de los dos últimos clips (CTA y «Gracias por escucharme») |

Los PDF de `Molvek_AvatarIA_V1_…` (14-11, HeyGen, Don Ramón y Javier) quedan como registro: nunca se produjeron.

## Lo decidido

- **Un solo founder para los dos videos** (los dos dicen «Soy el fundador de Molvek»): hombre de unos 46, ojos azul
  grisáceo, pelo castaño con canas, barba corta entrecana, suéter azul marino. Sin nombre (Diego, 16-11).
- **La cara** sale de thispersondoesnotexist (cara 40), no de un prompt: la primera vuelta, generada solo desde texto,
  fue «muy falso, fondo falso, muy IA» (Diego, 23-11). Diego eligió la cara D y después el lugar 1.
- **Lugar:** su estudio en casa, de tarde (repisas blancas con cerámica, sillón de cuero, lámpara de bronce, ventana a la
  izquierda), en **selfie a brazo estirado**. Todos los gestos van con la mano libre (la del reloj).
- **Voz:** hombre de mediados de los 40, español latino neutro (ACCENT LOCK del SOP), 145-150 ppm; el VOICE PROFILE va
  idéntico en cada clip. La escena del dolor va en clips cortos, cortados en los «…», para que la voz haga sus pausas.
- **Frasco** solo en los dos últimos clips, con la foto oficial. En la imagen P la letra chica de la etiqueta salió
  inventada (MOLVEK, Nitric Oxide, Triple Pathway Formula y 60 CAPSULES están bien); a la escala de la página no se lee.
- **Formato:** Omni (un prompt por clip, máx. 10 s), vertical 9:16 como la página de Loop. Sin overlay de cierre.

## Mensaje para Ángelo

> **Molvek V2 «Founder · Presión» y V3 «Founder · Firmeza»** — 16 clips cada uno, ~1:50 y ~1:44, motor Omni. Las dos
> imágenes base ya están generadas y aprobadas (`Molvek_Founder_imagen-0-madre.jpg` e `…-P-frasco.jpg`): úsalas tal
> cual. Clips en orden, copiando el bloque de cada página entero. **El clip 1 fija la voz: escúchalo antes de seguir**
> (hombre de unos 45, español neutro, sin tonada, sin música). Frasco solo en los clips 15 y 16. Todo texto va en post;
> sin texto de cierre (el botón está debajo del video). Si el timbre cambia entre clips, la voz definitiva se hace en
> ElevenLabs con una voz fija y se monta encima. Al terminar, pasa el enlace del .mp4 para ponerlo en `VIDEO`
> (`scripts/molvek-loop/armar_beneficios_v5.py`).

## Fuente y costo

- Piezas (fuera del repo): `~/AvatarIA/Molvek/` — `comun/fundador.py` (founder, voz, escenario, imágenes, frasco),
  `V2-founder-presion/pieza.py`, `V3-founder-firmeza/pieza.py`. Se arman con
  `python3 ~/.claude/skills/avatar-ia/mesa/avatar.py armar <carpeta>` (VALIDADO, 0 avisos, LISTO PARA ENTREGAR).
- Candidatas descartadas: `~/AvatarIA/Molvek/comun/candidatas*/`.
- Imágenes: 15 generaciones de Nano Banana Pro 2K en el generador interno, **US$ 1,35** (tres vueltas de 4 candidatas,
  una limpieza sin efecto y dos intentos de la imagen con frasco; el primero tapaba la boca).
- Lo que falta: que Ángelo genere los clips (estimado sin repetir: ~US$ 8 por video en Gemini Omni Flash, ~US$ 40 en
  Seedance 720p) y el enlace en `VIDEO`.
- Punto abierto del v8, sin cambiar: «Soy el fundador de Molvek» o «Te hablo desde Molvek». Va la primera.
