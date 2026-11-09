"""Fotos de coleccion estilo Jaxxon con las joyas reales de Saint Venik.
Fondo de estudio oscuro (negro arriba, gris azulado abajo), halo de luz detras
de la joya, piso con brillo, reflejo y sombra de contacto."""
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops
import sys, json, os
R = '/private/tmp/claude-501/-Users-diegogardilcicverschae-saint-venik-app/37734014-a181-4537-a56e-a6f740c60ba3/scratchpad/fotos/recortes'

def lerp(a, b, t): return tuple(int(a[i] + (b[i]-a[i]) * t) for i in range(3))

def fondo(W, H, arriba=(5, 6, 8), medio=(14, 17, 22), abajo=(70, 77, 88), halo=(150, 168, 192), halo_a=0.33, hx=.5, hy=.5, piso=.80, piso_luz=70, sombra_abajo=0.0):
    g = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(g)
    for y in range(H):
        t = y / (H - 1)
        if t < piso * .78: c = lerp(arriba, medio, t / (piso * .78))
        else: c = lerp(medio, abajo, min(1, (t - piso * .78) / (1 - piso * .78)) ** 1.4)
        d.line([(0, y), (W, y)], fill=c)
    # halo detras de la joya
    m = Image.radial_gradient('L').resize((int(W * 1.3), int(H * 1.1)))
    m = ImageChops.invert(m).point(lambda v: int(max(0, v - 70) * 255 / 185 * halo_a))
    capa = Image.new('RGB', m.size, halo)
    g.paste(capa, (int(W * hx - m.width / 2), int(H * hy - m.height / 2)), m)
    # brillo del piso (elipse ancha y suave)
    m2 = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m2).ellipse([W * .05, H * (piso - .03), W * .95, H * (piso + .26)], fill=piso_luz)
    m2 = m2.filter(ImageFilter.GaussianBlur(W * .06))
    g.paste(Image.new('RGB', (W, H), (175, 186, 202)), (0, 0), m2)
    # abajo mas oscuro: ahi va el titulo de la tarjeta, en blanco
    if sombra_abajo:
        b = Image.linear_gradient('L').resize((W, H)).point(lambda v: int(max(0, v - 175) * 255 / 80 * sombra_abajo))
        g.paste(Image.new('RGB', (W, H), (0, 0, 0)), (0, 0), b)
    # vineta
    v = Image.radial_gradient('L').resize((int(W * 1.5), int(H * 1.5))).crop((int(W * .25), int(H * .25), int(W * 1.25), int(H * 1.25)))
    v = v.point(lambda x: int(max(0, x - 120) * 1.1))
    g.paste(Image.new('RGB', (W, H), (0, 0, 0)), (0, 0), v)
    return g.convert('RGBA')

def pieza(nombre, escala, angulo=0, brillo=1.0, contraste=1.06):
    im = Image.open(os.path.join(R, nombre + '.png')).convert('RGBA')
    im = im.resize((int(im.width * escala), int(im.height * escala)), Image.LANCZOS)
    rgb, a = im.convert('RGB'), im.split()[3]
    rgb = ImageEnhance.Contrast(ImageEnhance.Brightness(rgb).enhance(brillo)).enhance(contraste)
    im = Image.merge('RGBA', (*rgb.split(), a))
    if angulo: im = im.rotate(angulo, resample=Image.BICUBIC, expand=True)
    return im

def poner(lienzo, im, cx, cy, reflejo=0.0, sombra=0.0, piso_y=None):
    """cx, cy: centro (0..1). Con reflejo, se refleja bajo su borde inferior (o piso_y)."""
    W, H = lienzo.size
    x, y = int(W * cx - im.width / 2), int(H * cy - im.height / 2)
    base = y + im.height if piso_y is None else int(H * piso_y)
    if sombra:
        s = Image.new('L', (W, H), 0)
        ImageDraw.Draw(s).ellipse([x + im.width * .12, base - im.height * .04, x + im.width * .88, base + im.height * .05], fill=int(255 * sombra))
        s = s.filter(ImageFilter.GaussianBlur(max(6, im.width * .05)))
        lienzo.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 0), s)
    if reflejo:
        r = im.transpose(Image.FLIP_TOP_BOTTOM)
        fade = Image.linear_gradient('L').resize(r.size).point(lambda v: int((255 - v) * reflejo))
        ra = ImageChops.multiply(r.split()[3], fade)
        r.putalpha(ra)
        r = r.filter(ImageFilter.GaussianBlur(2))
        lienzo.alpha_composite(r, (x, base + 2 - (y + im.height - base)))
    lienzo.alpha_composite(im, (x, y))

def guardar(lienzo, ruta):
    lienzo.convert('RGB').save(ruta, quality=90)
