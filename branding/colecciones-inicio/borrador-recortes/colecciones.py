import sys; sys.path.insert(0, '/private/tmp/claude-501/-Users-diegogardilcicverschae-saint-venik-app/37734014-a181-4537-a56e-a6f740c60ba3/scratchpad/scripts')
from componer import *
O = '/private/tmp/claude-501/-Users-diegogardilcicverschae-saint-venik-app/37734014-a181-4537-a56e-a6f740c60ba3/scratchpad/fotos/salida'
os.makedirs(O, exist_ok=True)
W = H = 1200
F = dict(abajo=(52, 58, 68), piso_luz=50, sombra_abajo=.75)

# Cadenas: plateada y oro cruzadas, colgando desde arriba; el titulo va abajo
c = fondo(W, H, hx=.5, hy=.42, piso=.74, **F)
poner(c, pieza('cadena-cuban-8mm-1', 1.16, -12), .41, .33, reflejo=.26, piso_y=.70)
poner(c, pieza('cadena-cuban-oro-8mm', 1.16, 11), .59, .355, reflejo=.26, piso_y=.72)
guardar(c, f'{O}/cadenas.jpg')

# Pulseras: tres apiladas (tennis, oro, plateada)
c = fondo(W, H, hx=.5, hy=.42, piso=.72, **F)
poner(c, pieza('pulsera-cuban-8mm', 1.12, 6), .52, .555, reflejo=.26, sombra=.55)
poner(c, pieza('pulsera-cuban-oro-8mm', 1.12, -7), .48, .40)
poner(c, pieza('pulsera-tennis-5mm', 1.16, 9, brillo=1.05), .53, .245)
guardar(c, f'{O}/pulseras.jpg')

# Colgantes: crucifijo oro y plateado colgando lado a lado
c = fondo(W, H, hx=.5, hy=.42, piso=.78, **F)
poner(c, pieza('crucifix-pendant-oro', .98, -4), .38, .36)
poner(c, pieza('crucifix-pendant', .98, 5), .62, .385)
guardar(c, f'{O}/colgantes.jpg')

# Anillos: tres agrupados sobre el piso
c = fondo(W, H, hx=.5, hy=.40, piso=.66, **F)
poner(c, pieza('anillo-box', .72, 6), .31, .44, reflejo=.26, sombra=.6)
poner(c, pieza('anillo-roman-xi-1', .72, -6), .70, .435, reflejo=.26, sombra=.6)
poner(c, pieza('anillo-classic-onyx-oro', .80, 0), .51, .50, reflejo=.26, sombra=.65)
guardar(c, f'{O}/anillos.jpg')
print('ok')
