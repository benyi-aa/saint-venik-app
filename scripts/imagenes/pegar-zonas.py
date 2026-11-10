# Arregla solo unas zonas de una foto: toma la versión generada (ej. con el broche
# corregido), la alinea con la original y pega SOLO las cajas indicadas, con borde
# suave. Fuera de las cajas la foto queda idéntica a la original (lo imprime).
# Uso:
#   python3 scripts/imagenes/pegar-zonas.py original.jpg generada.png salida.jpg 250,415,400,745 1158,415,1310,745
# Cada caja es x0,y0,x1,y1 en píxeles de la original. Las dos fotos deben tener el
# mismo encuadre (la generada se reescala al tamaño de la original).
import sys
from PIL import Image, ImageChops, ImageStat, ImageFilter, ImageDraw

orig_p, gen_p, salida = sys.argv[1:4]
cajas = [tuple(int(v) for v in c.split(',')) for c in sys.argv[4:]]
o = Image.open(orig_p).convert('RGB')
W, H = o.size
g = Image.open(gen_p).convert('RGB').resize((W, H), Image.LANCZOS)

# Alinear con una zona sin cajas (a 1/4 de tamaño): escala ±1,5 % y ±8 px.
q = 4
O = o.convert('L').resize((W // q, H // q))
ref = (W // q // 8, H // q // 2, W // q * 7 // 8, H // q * 7 // 8)
mejor = None
for i in range(11):
    sc = 0.985 + i * 0.003
    G = g.convert('L').resize((round(W * sc / q), round(H * sc / q)))
    for dx in range(-8, 9):
        for dy in range(-8, 9):
            b = (ref[0] + dx, ref[1] + dy, ref[2] + dx, ref[3] + dy)
            if b[0] < 0 or b[1] < 0 or b[2] > G.width or b[3] > G.height:
                continue
            d = ImageStat.Stat(ImageChops.difference(G.crop(b), O.crop(ref))).mean[0]
            if mejor is None or d < mejor[0]:
                mejor = (d, sc, dx, dy)
d, sc, dx, dy = mejor
print('alineado: diferencia %.1f, escala %.3f, desplazamiento %d,%d' % (d, sc, dx * q, dy * q))
G = g.resize((round(W * sc), round(H * sc)), Image.LANCZOS)
ga = Image.new('RGB', (W, H))
ga.paste(G, (-dx * q, -dy * q))

M = Image.new('L', (W, H), 0)
D = ImageDraw.Draw(M)
for c in cajas:
    D.rounded_rectangle(c, radius=30, fill=255)
M = M.filter(ImageFilter.GaussianBlur(14))
out = o.copy()
out.paste(ga, (0, 0), M)
out.save(salida, quality=92)
fuera = M.point(lambda v: 255 if v == 0 else 0)
print('diferencia fuera de las cajas:', ImageStat.Stat(ImageChops.difference(out, o), fuera).mean)
