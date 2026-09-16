import zlib, struct
def leer(p):
    d=open(p,'rb').read(); pos=8; plte=None; idat=b''
    while pos<len(d):
        ln=struct.unpack('>I',d[pos:pos+4])[0]; t=d[pos+4:pos+8]; data=d[pos+8:pos+8+ln]; pos+=12+ln
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',data[:10])
        elif t==b'PLTE': plte=data
        elif t==b'IDAT': idat+=data
    if bd!=8: raise SystemExit('solo 8 bits')
    ch={0:1,2:3,3:1,4:2,6:4}[ct]; stride=w*ch
    raw=zlib.decompress(idat); out=bytearray(); prev=bytearray(stride); i=0
    for y in range(h):
        f=raw[i]; i+=1; line=bytearray(raw[i:i+stride]); i+=stride
        for x in range(stride):
            a=line[x-ch] if x>=ch else 0; b=prev[x]; c=prev[x-ch] if x>=ch else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pp=a+b-c; pa,pb,pc=abs(pp-a),abs(pp-b),abs(pp-c)
                line[x]=(line[x]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
        out+=line; prev=line
    # devuelve luminancia 0..255 por pixel
    g=[0]*(w*h)
    for y in range(h):
        for x in range(w):
            o=(y*stride)+x*ch
            if ct==3:
                i2=out[o]; r,gg,b=plte[i2*3],plte[i2*3+1],plte[i2*3+2]
            elif ct in (0,4): r=gg=b=out[o]
            else: r,gg,b=out[o],out[o+1],out[o+2]
            g[y*w+x]=(r*299+gg*587+b*114)//1000
    return w,h,g
