#!/usr/bin/env python3
"""Genera el icono de la app y el logo del panel a partir de branding/logo-original.png.

El monograma solo existe como bitmap de 61x47 px utiles: estirarlo a 1200 lo
dejaria borroso, asi que se traza a vectores (ver vectorizar.py) y se rasteriza
al tamano que haga falta. El icono va claro sobre negro, como el isologo que
usan saintvenik.com y saintvenik.cl de favicon.
"""
import os, subprocess, sys
import vectorizar
from vectorizar import a_path

sys.setrecursionlimit(20000)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'branding', 'logo-original.png')
LADO = 1200
PARTE = 0.74       # cuanto del cuadro ocupa la marca; el favicon usa 0.72
EPS = 0.006        # error maximo del trazado, en unidades del original
VENTANA = 5        # suavizado a lo largo del contorno, para quitar la rejilla
FONDO = '#000000'
TINTA = '#ffffff'

vectorizar.UMBRAL = 128.0   # mas alto rompe los trazos finos; mas bajo los engorda

def marca():
    cont, (x0, y0, x1, y1) = vectorizar.trazar_fino(ORIGEN, ventana=VENTANA, pasos=3, eps=EPS)
    return cont, x0, y0, x1 - x0, y1 - y0

def escribir(ruta, texto):
    with open(ruta, 'w') as f: f.write(texto)
    return ruta

def main():
    cont, x0, y0, mw, mh = marca()
    print(f'marca trazada: {mw:.1f} x {mh:.1f}  ({len(cont)} contornos)')

    # 1. el icono cuadrado
    ancho = LADO * PARTE
    k = ancho / mw
    d = a_path(cont, x0, y0, k, (LADO - ancho) / 2, (LADO - mh * k) / 2)
    icono = escribir(os.path.join(RAIZ, 'branding', 'icono-app.svg'),
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{LADO}" height="{LADO}" viewBox="0 0 {LADO} {LADO}">'
        f'<rect width="{LADO}" height="{LADO}" fill="{FONDO}"/>'
        f'<path d="{d}" fill="{TINTA}" fill-rule="evenodd"/></svg>')

    # 2. el logo de la cabecera del panel: ajustado, sin fondo y en negro,
    #    porque el panel tiene fondo claro
    k2 = 600.0 / mw
    d2 = a_path(cont, x0, y0, k2)
    escribir(os.path.join(RAIZ, 'admin', 'logo.svg'),
        f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="{mh*k2:.0f}" viewBox="0 0 600 {mh*k2:.2f}">'
        f'<path d="{d2}" fill="#111111" fill-rule="evenodd"/></svg>')

    png = os.path.join(RAIZ, 'branding', 'icono-app-1200.png')
    subprocess.run(['sips', '-s', 'format', 'png', icono, '--out', png],
                   check=True, capture_output=True)
    print('escritos: branding/icono-app.svg, branding/icono-app-1200.png, admin/logo.svg')

if __name__ == '__main__':
    main()
