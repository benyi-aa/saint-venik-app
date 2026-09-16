"""Convierte el monograma (un bitmap pequeno) en contornos vectoriales.

El original mide 61x47 px utiles. Escalarlo a 1200 lo dejaria borroso, asi que
en vez de estirar pixeles se trazan los contornos con marching squares sobre la
luminancia -con interpolacion, para que el antialias del original aporte
precision de subpixel- y luego se suavizan con Chaikin.
"""
from leerpng import leer

UMBRAL = 128.0

def campo(ruta, margen=2):
    w, h, g = leer(ruta)
    W, H = w + margen*2, h + margen*2
    f = [[0.0]*W for _ in range(H)]
    for y in range(h):
        for x in range(w):
            f[y+margen][x+margen] = 255.0 - g[y*w+x]   # tinta = valor alto
    return W, H, f

def interp(a, b):
    """Punto donde el campo cruza el umbral entre dos esquinas."""
    va, vb = a[2], b[2]
    if abs(vb - va) < 1e-9: t = 0.5
    else: t = (UMBRAL - va) / (vb - va)
    t = max(0.0, min(1.0, t))
    return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)

def segmentos(W, H, f):
    """Marching squares. Devuelve segmentos orientados con la tinta a la izquierda."""
    segs = []
    for y in range(H-1):
        for x in range(W-1):
            tl = (x,   y,   f[y][x])
            tr = (x+1, y,   f[y][x+1])
            br = (x+1, y+1, f[y+1][x+1])
            bl = (x,   y+1, f[y+1][x])
            c = (1 if tl[2] >= UMBRAL else 0) | (2 if tr[2] >= UMBRAL else 0) \
              | (4 if br[2] >= UMBRAL else 0) | (8 if bl[2] >= UMBRAL else 0)
            if c in (0, 15): continue
            arriba, derecha, abajo, izq = interp(tl,tr), interp(tr,br), interp(bl,br), interp(tl,bl)
            if   c == 1:  segs.append((arriba, izq))
            elif c == 2:  segs.append((derecha, arriba))
            elif c == 3:  segs.append((derecha, izq))
            elif c == 4:  segs.append((abajo, derecha))
            elif c == 6:  segs.append((abajo, arriba))
            elif c == 7:  segs.append((abajo, izq))
            elif c == 8:  segs.append((izq, abajo))
            elif c == 9:  segs.append((arriba, abajo))
            elif c == 11: segs.append((derecha, abajo))
            elif c == 12: segs.append((izq, derecha))
            elif c == 13: segs.append((arriba, derecha))
            elif c == 14: segs.append((izq, arriba))
            else:
                # casos ambiguos: los desempata el promedio del centro
                centro = (tl[2]+tr[2]+br[2]+bl[2])/4.0
                if c == 5:
                    if centro >= UMBRAL: segs += [(arriba,izq),(abajo,derecha)]
                    else:                segs += [(arriba,derecha),(abajo,izq)]
                else:  # c == 10
                    if centro >= UMBRAL: segs += [(derecha,arriba),(izq,abajo)]
                    else:                segs += [(izq,arriba),(derecha,abajo)]
    return segs

def encadenar(segs, tol=1e-6):
    """Une los segmentos en contornos cerrados."""
    def clave(p): return (round(p[0], 5), round(p[1], 5))
    desde = {}
    for a, b in segs: desde.setdefault(clave(a), []).append((a, b))
    contornos = []
    usados = set()
    for i, (a0, b0) in enumerate(segs):
        if i in usados: continue
        # recorre hacia delante hasta volver al principio
        cam = [a0, b0]
        usados.add(i)
        actual = b0
        while True:
            k = clave(actual)
            sig = None
            for s in desde.get(k, []):
                j = segs.index(s)
                if j not in usados: sig = (j, s); break
            if sig is None: break
            j, (a, b) = sig
            usados.add(j); cam.append(b); actual = b
            if clave(b) == clave(a0): break
        if len(cam) > 3: contornos.append(cam)
    return contornos

def chaikin(pts, pasos=4):
    """Suaviza el poligono redondeando cada esquina."""
    for _ in range(pasos):
        nuevo = []
        n = len(pts)
        for i in range(n):
            p, q = pts[i], pts[(i+1) % n]
            nuevo.append((p[0]*0.75 + q[0]*0.25, p[1]*0.75 + q[1]*0.25))
            nuevo.append((p[0]*0.25 + q[0]*0.75, p[1]*0.25 + q[1]*0.75))
        pts = nuevo
    return pts

def trazar(ruta, pasos=4):
    W, H, f = campo(ruta)
    cont = encadenar(segmentos(W, H, f))
    cont = [chaikin(c, pasos) for c in cont]
    xs = [p[0] for c in cont for p in c]; ys = [p[1] for c in cont for p in c]
    return cont, (min(xs), min(ys), max(xs), max(ys))

def a_path(cont, x0, y0, k, dx=0.0, dy=0.0):
    partes = []
    for c in cont:
        d = f'M{(c[0][0]-x0)*k+dx:.2f},{(c[0][1]-y0)*k+dy:.2f}'
        d += ''.join(f'L{(p[0]-x0)*k+dx:.2f},{(p[1]-y0)*k+dy:.2f}' for p in c[1:])
        partes.append(d + 'Z')
    return ' '.join(partes)

def desenfocar(W, H, f, sigma):
    """Gaussiana separable: quita el escalonado de un bitmap pequeno."""
    import math
    r = max(1, int(sigma*3))
    k = [math.exp(-(i*i)/(2*sigma*sigma)) for i in range(-r, r+1)]
    s = sum(k); k = [v/s for v in k]
    tmp = [[0.0]*W for _ in range(H)]
    for y in range(H):
        fila = f[y]
        for x in range(W):
            a = 0.0
            for i, kv in enumerate(k):
                xx = min(W-1, max(0, x + i - r)); a += fila[xx]*kv
            tmp[y][x] = a
    out = [[0.0]*W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            a = 0.0
            for i, kv in enumerate(k):
                yy = min(H-1, max(0, y + i - r)); a += tmp[yy][x]*kv
            out[y][x] = a
    return out

def trazar_suave(ruta, sigma=0.7, pasos=3):
    W, H, f = campo(ruta)
    if sigma > 0: f = desenfocar(W, H, f, sigma)
    cont = encadenar(segmentos(W, H, f))
    cont = [chaikin(c, pasos) for c in cont]
    xs = [p[0] for c in cont for p in c]; ys = [p[1] for c in cont for p in c]
    return cont, (min(xs), min(ys), max(xs), max(ys))

def simplificar(pts, eps):
    """Ramer-Douglas-Peucker sobre un contorno cerrado.

    Chaikin deja miles de puntos casi colineales. A 1200 px un error de 0.01
    unidades del original es una quinta parte de pixel: invisible, y recorta
    el archivo mas de un 90%.
    """
    def rdp(p):
        if len(p) < 3: return p
        x0, y0 = p[0]; x1, y1 = p[-1]
        dx, dy = x1-x0, y1-y0
        norma = (dx*dx + dy*dy) ** 0.5
        peor, idx = -1.0, 0
        for i in range(1, len(p)-1):
            x, y = p[i]
            if norma < 1e-12: d = ((x-x0)**2 + (y-y0)**2) ** 0.5
            else: d = abs(dy*x - dx*y + x1*y0 - y1*x0) / norma
            if d > peor: peor, idx = d, i
        if peor <= eps: return [p[0], p[-1]]
        return rdp(p[:idx+1])[:-1] + rdp(p[idx:])
    n = len(pts)
    if n < 4: return pts
    medio = n // 2
    a = rdp(pts[:medio+1]); b = rdp(pts[medio:] + [pts[0]])
    return a[:-1] + b[:-1]

def trazar_limpio(ruta, pasos=5, eps=0.01):
    cont, caja = trazar(ruta, pasos=pasos)
    return [simplificar(c, eps) for c in cont], caja

def suavizar_contorno(pts, ventana):
    """Media movil circular sobre el contorno.

    El escalonado que deja una imagen de 61 px es ondulacion de frecuencia alta
    a lo largo del trazado. Chaikin redondea esquinas pero no la quita, porque
    no es ruido de esquina sino de rejilla. Promediar a lo largo del contorno si.
    """
    n = len(pts)
    if ventana < 2 or n < ventana * 2: return pts
    r = ventana // 2
    out = []
    for i in range(n):
        sx = sy = 0.0
        for j in range(-r, r+1):
            p = pts[(i+j) % n]; sx += p[0]; sy += p[1]
        out.append((sx/(2*r+1), sy/(2*r+1)))
    return out

def trazar_fino(ruta, ventana=5, pasos=3, eps=0.006):
    cont, _ = trazar(ruta, pasos=0)
    cont = [suavizar_contorno(c, ventana) for c in cont]
    cont = [chaikin(c, pasos) for c in cont]
    cont = [simplificar(c, eps) for c in cont]
    xs = [p[0] for c in cont for p in c]; ys = [p[1] for c in cont for p in c]
    return cont, (min(xs), min(ys), max(xs), max(ys))
