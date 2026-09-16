import zlib, struct, base64, sys
from collections import deque
def load(p):
    d=open(p,'rb').read(); pos=8; idat=b''; plte=None
    while pos<len(d):
        ln=struct.unpack('>I',d[pos:pos+4])[0]; typ=d[pos+4:pos+8]; data=d[pos+8:pos+8+ln]; pos+=12+ln
        if typ==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',data[:10])
        elif typ==b'PLTE': plte=data
        elif typ==b'IDAT': idat+=data
    raw=zlib.decompress(idat); stride=w; out=bytearray(); prev=bytearray(stride); i=0
    for y in range(h):
        f=raw[i]; i+=1; line=bytearray(raw[i:i+stride]); i+=stride
        for x in range(stride):
            a=line[x-1] if x>=1 else 0; b=prev[x]; c=prev[x-1] if x>=1 else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                p=a+b-c; pa,pb,pc=abs(p-a),abs(p-b),abs(p-c)
                pr=a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[x]=(line[x]+pr)&255
        out+=line; prev=line
    return w,h,plte,bytes(out)
def png_rgba(w,h,data):
    raw=b''.join(b'\x00'+bytes(data[y*w*4:(y+1)*w*4]) for y in range(h))
    def ck(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return (b'\x89PNG\r\n\x1a\n'+ck(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))
            +ck(b'IDAT',zlib.compress(raw,9))+ck(b'IEND',b''))
W,H,plte,px=load('f.png')
L=[(plte[i*3]*299+plte[i*3+1]*587+plte[i*3+2]*114)//1000 for i in range(len(plte)//3)]
UMBRAL=int(sys.argv[1]) if len(sys.argv)>1 else 240
mask=bytearray(W*H)
for i,v in enumerate(px):
    if L[v]<UMBRAL: mask[i]=1
lab=[0]*(W*H); cur=0; info={}
for s in range(W*H):
    if mask[s] and not lab[s]:
        cur+=1; q=deque([s]); lab[s]=cur; x0=y0=10**9; x1=y1=-1; n=0
        while q:
            p=q.popleft(); y,x=divmod(p,W); n+=1
            x0=min(x0,x); x1=max(x1,x); y0=min(y0,y); y1=max(y1,y)
            for dy in(-1,0,1):
                for dx in(-1,0,1):
                    nx,ny=x+dx,y+dy
                    if 0<=nx<W and 0<=ny<H:
                        q2=ny*W+nx
                        if mask[q2] and not lab[q2]: lab[q2]=cur; q.append(q2)
        info[cur]=(n,x0,y0,x1,y1)
print('umbral',UMBRAL,'-> componentes:')
for c,(n,x0,y0,x1,y1) in sorted(info.items(), key=lambda kv:-kv[1][0])[:8]:
    print(f'  #{c} {n:6d} px  x {x0}-{x1}  y {y0}-{y1}')
# elegir por bbox: S empieza cerca de x=103, V cerca de x=535
def pick(target_x0):
    best=None
    for c,(n,x0,y0,x1,y1) in info.items():
        if n>1500 and abs(x0-target_x0)<25:
            if best is None or n>info[best][0]: best=c
    return best
cs,cv=pick(103),pick(535)
print('S=',cs,info[cs],' V=',cv,info[cv])
def cut(c, ytop, ybot, tinta=0):
    n,x0,y0,x1,y1=info[c]; cw,chh=x1-x0+1, ybot-ytop+1; buf=bytearray(cw*chh*4)
    for y in range(chh):
        for x in range(cw):
            p=(ytop+y)*W+(x0+x)
            if lab[p]==c:
                o=(y*cw+x)*4
                buf[o]=buf[o+1]=buf[o+2]=tinta
                buf[o+3]=255-L[px[p]]
    return cw,chh,png_rgba(cw,chh,buf)
TOP=min(info[cs][2],info[cv][2]); BOT=max(info[cs][4],info[cv][4])
sw,sh,spng=cut(cs,TOP,BOT,255); vw,vh,vpng=cut(cv,TOP,BOT,255)
_,_,spng_n=cut(cs,TOP,BOT,0); _,_,vpng_n=cut(cv,TOP,BOT,0)
print('S',sw,'x',sh,'  V',vw,'x',vh)
GAP=8; mono_w=sw+GAP+vw; TARGET=864.0; k=TARGET/mono_w; mh=sh*k
ox=(1200-TARGET)/2; oy=(1200-mh)/2
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<rect width="1200" height="1200" fill="#000000"/>
<image x="{ox:.2f}" y="{oy:.2f}" width="{sw*k:.2f}" height="{mh:.2f}" href="data:image/png;base64,{base64.b64encode(spng).decode()}"/>
<image x="{ox+(sw+GAP)*k:.2f}" y="{oy:.2f}" width="{vw*k:.2f}" height="{mh:.2f}" href="data:image/png;base64,{base64.b64encode(vpng).decode()}"/>
</svg>'''
open('icono.svg','w').write(svg); print('ok')

# Variante ajustada y sin fondo, para la cabecera del panel.
mw, mh2 = sw + GAP + vw, sh
tight = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{mw}" height="{mh2}" viewBox="0 0 {mw} {mh2}">
<image x="0" y="0" width="{sw}" height="{sh}" href="data:image/png;base64,{base64.b64encode(spng_n).decode()}"/>
<image x="{sw+GAP}" y="0" width="{vw}" height="{vh}" href="data:image/png;base64,{base64.b64encode(vpng_n).decode()}"/>
</svg>'''
open('logo.svg','w').write(tight)
print('logo.svg', mw, 'x', mh2)
