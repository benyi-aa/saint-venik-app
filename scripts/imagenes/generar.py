import subprocess, json, os, sys, time
# Uso: python3 scripts/imagenes/generar.py trabajos.json [carpeta_salida]
# trabajos.json = [{"nombre", "aspecto" (1:1, 4:5, 16:9, 21:9...), "imagenes": [rutas], "prompt"}]
# Cada imagen cuesta 18 créditos (US$0,09). La clave del agente la lee erp.sh; nunca imprimirla.
B=os.path.abspath(sys.argv[2] if len(sys.argv)>2 else 'generadas'); O=os.path.join(B,'out'); os.makedirs(O,exist_ok=True)
ERP=os.path.expanduser('~/.claude/skills/estudio-venik/mesa/BENYI/scripts/erp.sh')
def run(a): return subprocess.run(['bash',ERP]+a,capture_output=True,text=True).stdout.strip()
def erp(m,ruta,cuerpo=None):
    a=[m,ruta]
    if cuerpo is not None:
        p=os.path.join(B,'cuerpo.json'); json.dump(cuerpo,open(p,'w'),ensure_ascii=False); a.append(p)
    return json.loads(run(a))
P={}; R={}
SUB_F=os.path.join(B,'subidas.json'); SUB=json.load(open(SUB_F)) if os.path.exists(SUB_F) else {}
def subir(ruta):
    if ruta in SUB: return SUB[ruta]
    from PIL import Image
    im=Image.open(ruta)
    if im.mode in ('P','LA','RGBA') or 'transparency' in im.info:
        im=im.convert('RGBA'); f=Image.new('RGBA',im.size,(255,255,255,255)); f.alpha_composite(im); im=f
    im=im.convert('RGB'); im.thumbnail((2752,2752)); j=os.path.join(B,'sub-'+os.path.basename(ruta).rsplit('.',1)[0]+'.jpg'); im.save(j,quality=92)
    SUB[ruta]=json.loads(run(['SUBIR','/api/generador/referencia?nombre=sv-banner-'+os.path.basename(j),j,'image/jpeg']))['clave']
    json.dump(SUB,open(SUB_F,'w'),indent=1); return SUB[ruta]
def clave(x):
    if x in P: return P[x]['clave']
    if x in R: return R[x]
    return subir(x)
TRABAJOS=json.load(open(sys.argv[1]))     # [{nombre, prompt, imagenes:[...], aspecto}]
E={}; ses=None
for t in TRABAJOS:
    c=dict(modelo='nano-banana-pro',prompt=t['prompt'],valores=dict(aspect_ratio=t.get('aspecto','16:9'),resolution='2K',output_format='png',image_input=[clave(x) for x in t['imagenes']]))
    if ses: c['sesion_id']=ses
    r=erp('POST','/api/generador/generar',c)
    if 'generacion' not in r: print(t['nombre'],'ERROR',r); continue
    ses=r['sesion']['id']; E[r['generacion']['id']]=t['nombre']; print('lanzada',t['nombre'])
pend=dict(E)
while pend:
    time.sleep(15)
    por={g['id']:g for g in erp('GET','/api/generador/sesion?id='+ses)['sesion'].get('generaciones',[])}
    for gid,nom in list(pend.items()):
        g=por.get(gid,{})
        if g.get('estado')=='listo':
            n=1
            while os.path.exists(os.path.join(O,f'{nom}-{n}.png')): n+=1
            d=os.path.join(O,f'{nom}-{n}.png'); run(['BAJAR',gid,d]); print('lista',os.path.basename(d)); del pend[gid]
        elif g.get('estado')=='error': print('error',nom,g.get('error')); del pend[gid]
print('fin')
