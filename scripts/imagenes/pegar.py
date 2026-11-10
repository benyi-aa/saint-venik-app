# Pega una foto original (o un recorte) encima de una versión generada, alineándola sola.
# Sirve para ampliar una foto (lienzo con gris) o arreglar una zona sin tocar el resto.
# Uso: python3 scripts/imagenes/pegar.py '{"genp":"gen.png","origp":"orig.jpg","x0":0,"y0":0,"w":2048,"h":1404,"salida":"out.jpg","pluma":50,"arriba":true}'
# x0,y0,w,h = dónde y de qué tamaño estaba la original dentro de la generada.
import sys, json
from PIL import Image, ImageFilter, ImageChops, ImageStat, ImageDraw
def alinear(gen, orig, x0, y0, w, h):
    q=4; G=gen.convert('L').resize((gen.width//q,gen.height//q)); OL=orig.convert('L')
    best=None
    for i in range(13):
        sc=0.985+i*0.0025
        ww,hh=round(w*sc/q),round(h*sc/q)
        O=OL.resize((ww,hh)); box=(ww//6,hh//6,ww*5//6,hh*5//6); Oc=O.crop(box)
        for dx in range(-8,9):
            for dy in range(-8,9):
                X=round(x0/q)+dx; Y=round(y0/q)+dy
                if X<0 or Y<0 or X+ww>G.width or Y+hh>G.height: continue
                Gc=G.crop((X+box[0],Y+box[1],X+box[2],Y+box[3]))
                d=ImageStat.Stat(ImageChops.difference(Gc,Oc)).mean[0]
                if best is None or d<best[0]: best=(d,sc,X*q,Y*q)
    return best
def pegar(genp, origp, x0, y0, w, h, salida, pluma=60, arriba=False):
    gen=Image.open(genp).convert('RGB'); orig=Image.open(origp).convert('RGB')
    d,sc,X,Y=alinear(gen,orig,x0,y0,w,h)
    ww,hh=round(w*sc),round(h*sc)
    print('alineado: dif %.1f escala %.4f en %d,%d (pedido %d,%d)'%(d,sc,X,Y,x0,y0))
    o=orig.resize((ww,hh),Image.LANCZOS)
    M=Image.new('L',(ww,hh),0)
    ImageDraw.Draw(M).rectangle([pluma,-3*pluma if arriba else pluma,ww-pluma,hh-pluma],fill=255)
    M=M.filter(ImageFilter.GaussianBlur(pluma/2.5))
    out=gen.copy(); out.paste(o,(X,Y),M)
    out.save(salida,quality=90); print('->',salida,out.size)
pegar(**json.loads(sys.argv[1]))
