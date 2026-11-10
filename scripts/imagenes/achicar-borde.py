# Achica una foto con piso/horizonte: la foto achicada se pega en el lienzo y lo de afuera se
# rellena estirando sus propios bordes (así el horizonte sigue a la misma altura) muy
# desenfocado; abajo se apaga a negro para no estirar reflejos.
# Uso: entrada salida ESCALA X_CENTRO_DESTINO Y_ARRIBA [CENTRO_X_ORIGINAL]
import sys, numpy as np
from PIL import Image, ImageFilter
ent, sal, s, tx, ya = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
cx = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5
o = Image.open(ent).convert('RGB'); W, H = o.size
w, h = round(W * s), round(H * s)
x0, y0 = round(tx * W - s * cx * W), round(ya * H)
x0 = max(0, min(W - w, x0)); y0 = max(0, min(H - h, y0))
r = np.asarray(o.resize((w, h), Image.LANCZOS)).astype(np.float64)
pad = np.pad(r, ((y0, H - y0 - h), (x0, W - x0 - w), (0, 0)), mode='edge')
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
# abajo de la foto: se apaga hacia negro (si no, los reflejos se estiran en rayas)
abajo = yy > (y0 + h)
pad[abajo] *= np.exp(-((yy[abajo] - (y0 + h)) / (0.03 * H)))[:, None]
q = 6
bl = Image.fromarray(np.clip(pad, 0, 255).astype(np.uint8)).resize((W // q, H // q), Image.BOX)
bl = bl.filter(ImageFilter.GaussianBlur(10)).resize((W, H), Image.BICUBIC)
bl = np.asarray(bl).astype(np.float64)
lienzo = pad.copy()
p = 0.07 * H
m = np.ones((H, W))
def rampa(v): return np.clip(v / p, 0, 1)
if x0 > 0: m *= rampa(xx - x0)
if x0 + w < W: m *= rampa(x0 + w - 1 - xx)
if y0 > 0: m *= rampa(yy - y0)
if y0 + h < H: m *= rampa(y0 + h - 1 - yy)
m = m * m * (3 - 2 * m)
out = lienzo * m[..., None] + bl * (1 - m[..., None])
out += np.random.default_rng(7).normal(0, 1.3, out.shape) * (1 - m[..., None])
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(sal, quality=92)
print('ok', sal, 'foto en', x0, y0, w, h)
