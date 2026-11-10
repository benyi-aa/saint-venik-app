# Achica una foto de producto sobre fondo liso (degradado de estudio con halo) dentro de un
# lienzo del mismo tamaño, sin IA. El fondo nuevo es la MISMA foto muy desenfocada (conserva
# el degradado y el halo, más grande), y la foto achicada se funde encima con un borde
# redondeado y muy suave, así no queda la "caja" del recorte. Sirve cuando la joya queda
# demasiado grande para el encuadre del banner y la IA, al ampliar con gris o al pedirle
# alejar la cámara, vuelve a dibujar la joya en otro lado o igual de grande (Navidad, 10-nov).
# Uso:
#   python3 scripts/imagenes/achicar-fondo.py entrada.png salida.jpg ESCALA X_DESTINO Y_ARRIBA [CENTRO_X] [PLUMA] [CAJA]
#   CAJA: x0,y0,x1,y1 de la joya en la original (fracciones), si la detección automática toma el halo.
#   ESCALA: 0.5 = la foto a la mitad. X_DESTINO: dónde queda el centro de la joya (0–1 del ancho).
#   CENTRO_X: dónde estaba ese centro en la original (0–1, por defecto 0.5).
#   Y_ARRIBA: dónde queda el borde de arriba de la foto (0 = pegada arriba, para que las
#   cadenas sigan saliendo por arriba). PLUMA: ancho de la transición, fracción del alto (0.12).
import sys
import numpy as np
from PIL import Image, ImageFilter

ent, sal, s, tx, ya = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
cx = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5
pl = float(sys.argv[7]) if len(sys.argv) > 7 else 0.12
o = Image.open(ent).convert('RGB')
W, H = o.size
w, h = round(W * s), round(H * s)
x0, y0 = round(tx * W - s * cx * W), round(ya * H)

# Fondo: la foto sin la joya (se borra lo que es metal o piedra y se rellena con el color
# de alrededor) y muy desenfocada: queda solo el degradado y el halo.
q = 8
c = np.asarray(o.resize((W // q, H // q), Image.BOX)).astype(np.float64)
R, G, B = c[..., 0], c[..., 1], c[..., 2]
oro = (G - B > 35) & (R > 110)
plata = (np.abs(R - G) < 28) & (np.abs(G - B) < 28) & (G > 85)
piedra = ((G > R + 12) | (B > R + 12)) & (G + B > 60)
joya = oro | plata | piedra
joya = np.asarray(Image.fromarray((joya * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
al = (~joya).astype(np.float64)
def bajar(c, al):
    hh, ww = al.shape
    hh2, ww2 = (hh + 1) // 2, (ww + 1) // 2
    cp = np.zeros((hh2 * 2, ww2 * 2, 3)); ap = np.zeros((hh2 * 2, ww2 * 2))
    cp[:hh, :ww] = c * al[..., None]; ap[:hh, :ww] = al
    cs = cp.reshape(hh2, 2, ww2, 2, 3).sum((1, 3)); a2 = ap.reshape(hh2, 2, ww2, 2).sum((1, 3))
    return np.where(a2[..., None] > 0, cs / np.maximum(a2[..., None], 1e-9), 0), np.minimum(a2, 1)
pir = [(c * al[..., None], al)]
while min(pir[-1][1].shape) > 2:
    pir.append(bajar(*pir[-1]))
f = pir[-1][0]
for cc, a1 in reversed(pir[:-1]):
    up = np.asarray(Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).resize((a1.shape[1], a1.shape[0]), Image.BILINEAR)).astype(np.float64)
    f = cc * a1[..., None] + up * (1 - a1[..., None])
limpio = Image.fromarray(np.clip(f, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
fondo = np.asarray(limpio.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(20))).astype(np.float64)

lienzo = np.zeros((H, W, 3))
X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
r = np.asarray(o.resize((w, h), Image.LANCZOS)).astype(np.float64)
lienzo[Y0:Y1, X0:X1] = r[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]

# Máscara: una elipse alrededor de la joya (su caja, medida en la original con la misma
# detección de metal/piedra), con caída muy suave; fuera de la foto achicada, cero.
ys_, xs_ = np.where(joya)
jx0, jx1 = xs_.min() * q, (xs_.max() + 1) * q
jy0, jy1 = ys_.min() * q, (ys_.max() + 1) * q
if len(sys.argv) > 8:   # caja de la joya a mano (fracciones x0,y0,x1,y1), si la detección toma el halo
    bx = [float(v) for v in sys.argv[8].split(',')]
    jx0, jy0, jx1, jy1 = bx[0] * W, bx[1] * H, bx[2] * W, bx[3] * H
ecx, ecy = x0 + s * (jx0 + jx1) / 2, y0 + s * (jy0 + jy1) / 2
erx, ery = s * (jx1 - jx0) / 2 * 1.15 + 0.03 * W, s * (jy1 - jy0) / 2 * 1.15 + 0.05 * H
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
d = np.sqrt(((xx - ecx) / erx) ** 2 + ((yy - ecy) / ery) ** 2)
f = pl * 4
m = np.clip((1 + f - d) / f, 0, 1)
m[(xx < X0) | (xx >= X1) | (yy < Y0) | (yy >= Y1)] = 0
# dentro de la foto achicada, cerca de su borde, que llegue a cero (salvo bordes del lienzo)
p = round(pl * H * 0.6)
def rampa(v):
    return np.clip(v / p, 0, 1)
if X0 > 0: m *= rampa(xx - X0)
if X1 < W: m *= rampa(X1 - 1 - xx)
if Y0 > 0: m *= rampa(yy - Y0)
if Y1 < H: m *= rampa(Y1 - 1 - yy)
m = m * m * (3 - 2 * m)   # suave en los extremos
print('joya en la original', jx0, jy0, jx1, jy1)
# Igualar la luz del fondo con la de la foto en la zona de unión (si no, queda una "caja").
# Ganancia suave que vale lo que pide la unión cerca de ella y 1 lejos.
anillo = ((m > 0.02) & (m < 0.7)).astype(np.float64)
peq = lambda a_: np.asarray(Image.fromarray(np.clip(a_, 0, 255).astype(np.uint8)).resize((W // 16, H // 16), Image.BOX)).astype(np.float64)
an = np.asarray(Image.fromarray((anillo * 255).astype(np.uint8)).resize((W // 16, H // 16), Image.BOX)).astype(np.float64) / 255
li, fo = peq(lienzo), peq(fondo)
ga = np.ones((H // 16, W // 16, 3)); pesos = np.zeros((H // 16, W // 16))
num = li * an[..., None]; den = fo * an[..., None]
# difunde la razón desde el anillo hacia afuera (push-pull sobre num y den)
def difundir(v, al):
    pir = [(v, al)]
    while min(pir[-1][1].shape) > 2:
        pir.append(bajar(*pir[-1]))
    f_ = pir[-1][0]
    for cc, a1 in reversed(pir[:-1]):
        up = np.asarray(Image.fromarray(np.clip(f_, 0, 255).astype(np.uint8)).resize((a1.shape[1], a1.shape[0]), Image.BILINEAR)).astype(np.float64)
        f_ = cc * a1[..., None] + up * (1 - a1[..., None])
    return f_
al_ = (an > 0.05).astype(np.float64)
nd = difundir(np.where(al_[..., None] > 0, li, 0), al_)
dd = difundir(np.where(al_[..., None] > 0, fo, 0), al_)
razon = np.clip((nd + 4) / (dd + 4), 0.35, 1.6)
razon = np.asarray(Image.fromarray(np.clip(razon * 100, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BICUBIC)).astype(np.float64) / 100
fondo = fondo * razon
out = lienzo * m[..., None] + fondo * (1 - m[..., None])
rng = np.random.default_rng(7)
out += rng.normal(0, 1.4, out.shape) * (1 - m[..., None])
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(sal, quality=92)
print('ok', sal, 'foto en', X0, Y0, X1 - X0, Y1 - Y0)
