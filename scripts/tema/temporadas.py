# Conecta el tema a las temporadas de la app (pestaña «Temporadas» del panel).
#
# Crea snippets/sv-temporada.liquid y cambia, en una carpeta bajada con
# `shopify theme pull`:
#   - layout/theme.liquid: el HTML de la barra de arriba (#svcd-1) pasa a ser
#     {% render 'sv-temporada', parte: 'barra' %}; el script de la cuenta
#     regresiva acepta una fecha de término (data-fin).
#   - las plantillas de colección: el bloque «3X2 EN TODO» pasa a ser
#     {% render 'sv-temporada', parte: 'bloque' %}.
#   - las plantillas de producto: la caja «BLACK FRIDAY / 3X2 + HASTA …» pasa a
#     ser {% render 'sv-temporada', parte: 'oferta' %}.
#   - snippets/custom-collecion-cart-page.liquid: el carrito vacío usa las fotos
#     de cualquier temporada (sv-<clave>-<colección>.jpg), no solo Navidad.
# Los textos de hoy quedan como valor por defecto del snippet: sin datos en la
# app, la tienda se ve igual que antes.
#
# Uso: python3 scripts/tema/temporadas.py carpeta cl|com [clave-forzada]
#   clave-forzada: para un tema de vista previa (p. ej. navidad).
import json, re, sys, os

carpeta, tienda = sys.argv[1], sys.argv[2]
forzada = sys.argv[3] if len(sys.argv) > 3 else ''

TEXTOS = {
    'cl': dict(
        bt='VIP BLACK FRIDAY: 3X2 + HASTA 60% OFF', bt_en='VIP BLACK FRIDAY: 3X2 + HASTA 60% OFF',
        bb='COMPRAR AHORA', bb_en='COMPRAR AHORA',
        qt='3X2 EN TODO', qt_en='3X2 EN TODO',
        qx='AÑADE 3 JOYAS AL CARRITO Y 1 ES GRATIS', qx_en='AÑADE 3 JOYAS AL CARRITO Y 1 ES GRATIS',
        o1='BLACK FRIDAY', o1_en='BLACK FRIDAY',
        o2='AGOTÁNDOSE RÁPIDO', o2_en='AGOTÁNDOSE RÁPIDO',
        o3='3X2 + HASTA 60% OFF', o3_en='3X2 + HASTA 60% OFF',
        o4='Aprovecha nuestra mayor oferta del año mientras duran las existencias.',
        o4_en='Aprovecha nuestra mayor oferta del año mientras duran las existencias.',
    ),
    'com': dict(
        bt='BLACK FRIDAY: 3X2 + HASTA 75% OFF', bt_en='BLACK FRIDAY: BUY 2, GET 1 FREE + UP TO 75% OFF',
        bb='VER REBAJAS', bb_en='SHOP THE SALE',
        qt='3X2 EN TODO', qt_en='BUY 2, GET 1 FREE',
        qx='AÑADE 3 JOYAS AL CARRITO Y 1 ES GRATIS', qx_en='ADD 3 PIECES TO YOUR CART — THE LOWEST PRICED ONE IS FREE',
        o1='BLACK FRIDAY', o1_en='BLACK FRIDAY',
        o2='AGOTÁNDOSE RÁPIDO', o2_en='SELLING OUT FAST',
        o3='3X2 + HASTA 75% OFF', o3_en='3 FOR 2 + UP TO 75% OFF',
        o4='Aprovecha nuestra mayor oferta del año mientras duran las existencias.',
        o4_en='Take advantage of our biggest offer of the year while supplies last.',
    ),
}[tienda]


def leer_json(p):
    s = open(p, encoding='utf-8').read()
    i = s.find('{')
    return s[:i], json.loads(s[i:])


def escribir_json(p, cabecera, d):
    open(p, 'w', encoding='utf-8').write(cabecera + json.dumps(d, ensure_ascii=False, indent=2) + '\n')


def lit(t):
    assert '"' not in t
    return '"' + t + '"'


def estilo_de(code):
    i = code.find('<style>')
    j = code.find('</style>', i)
    assert i >= 0 and j > i
    return code[i:j + len('</style>')].replace('{{ section.id }}', '{{ sid }}')


# --- 1. Plantillas: guardar el CSS de hoy y cambiar el bloque por el render ---
css_bloque = css_oferta = None
cambios = []
for nombre in sorted(os.listdir(os.path.join(carpeta, 'templates'))):
    p = os.path.join(carpeta, 'templates', nombre)
    cab, d = leer_json(p)
    tocado = False
    for sid, sec in d.get('sections', {}).items():
        for bid, b in (sec.get('blocks') or {}).items():
            code = (b.get('settings') or {}).get('code')
            if not isinstance(code, str) or b.get('disabled'):
                continue
            if nombre.startswith('collection') and '3X2 EN TODO' in code and 'banner-3x2-' in code:
                css_bloque = css_bloque or estilo_de(code)
                b['settings']['code'] = "{%- render 'sv-temporada', parte: 'bloque', sid: section.id -%}"
                tocado = True
                cambios.append(f'{nombre} {bid}: bloque 3X2')
            elif nombre.startswith('product') and 'bo-principal' in code and 'banner-3x2-' in code:
                css_oferta = css_oferta or estilo_de(code)
                b['settings']['code'] = "{%- render 'sv-temporada', parte: 'oferta', sid: section.id -%}"
                tocado = True
                cambios.append(f'{nombre} {bid}: caja de oferta')
    if tocado:
        escribir_json(p, cab, d)

if css_bloque is None or css_oferta is None:
    raise SystemExit('No están los bloques de hoy (¿ya se convirtieron?): no se genera el snippet.')

# Colores editables dentro del CSS de hoy (deben aparecer tal cual).
for viejo, nuevo in [('background-color: #E2D8CE;', 'background-color: {{ fo }};'),
                     ('color: #5B5147;', 'color: {{ l1 }};'), ('color: #33291F;', 'color: {{ l2 }};')]:
    assert css_bloque.count(viejo) == 1, viejo
    css_bloque = css_bloque.replace(viejo, nuevo)
for viejo, nuevo in [('background-color: #E5D9CC;', 'background-color: {{ fo }};'),
                     ('background-color: #631D29;', 'background-color: {{ et }};')]:
    assert css_oferta.count(viejo) == 1, viejo
    css_oferta = css_oferta.replace(viejo, nuevo)
css_oferta = css_oferta.replace('</style>', "  {%- if le != blank %}\n  .banner-3x2-{{ sid }} .bo-nombre, .banner-3x2-{{ sid }} .bo-principal, .banner-3x2-{{ sid }} .bo-texto { color: {{ le }}; }\n  {%- endif %}\n</style>")

T = TEXTOS
forzar = f"\n    assign k = '{forzada}'" if forzada else ''
aviso_forzada = (f"\n  ESTE TEMA ES DE VISTA PREVIA: siempre muestra la temporada «{forzada}».") if forzada else ''

snippet = f'''{{%- comment -%}}
  Saint Venik · textos de temporada. Se editan en la app Panel Saint Venik → pestaña
  «Temporadas» (metaobjeto sv_configuracion_2: «temporada» = la activa, «temporadas» = los
  textos de cada una, en JSON). Un campo vacío en la temporada activa usa el de «Normal»; uno
  vacío en Normal usa el texto de abajo (el que había en el tema). «-» deja ese texto vacío.
  Uso: render 'sv-temporada', parte: 'barra', url: url_banner   (layout/theme.liquid)
       render 'sv-temporada', parte: 'bloque', sid: section.id   (bloque 3X2 de las colecciones)
       render 'sv-temporada', parte: 'oferta', sid: section.id   (caja de oferta de los productos)
  Ver docs/temporadas.md en el repo saint-venik-app (scripts/tema/temporadas.py lo genera).{aviso_forzada}
{{%- endcomment -%}}
{{%- liquid
  assign k = 'normal'
  for e in shop.metaobjects.sv_configuracion_2.values
    assign k = e.temporada.value | default: 'normal' | append: ''
    assign tj = e.temporadas.value
    break
  endfor{forzar}
  assign ta = tj[k]
  assign tn = tj.normal
  assign en = false
  if request.locale.iso_code == 'en'
    assign en = true
  endif
-%}}
{{%- case parte -%}}
{{%- when 'barra' -%}}
  {{%- comment -%}} La fecha de término no se hereda de Normal: cada temporada tiene la suya. Vacía, la cuenta llega a las 23:59 de cada día. Va en UTC (la app la guarda así). {{%- endcomment -%}}
  {{%- liquid
    assign on = ta.barra_activa | default: tn.barra_activa | default: 'si'
    assign t_es = ta.barra_titulo | default: tn.barra_titulo | default: {lit(T['bt'])}
    assign t_en = ta.barra_titulo_en | default: tn.barra_titulo_en | default: {lit(T['bt_en'])}
    assign b_es = ta.barra_boton | default: tn.barra_boton | default: {lit(T['bb'])}
    assign b_en = ta.barra_boton_en | default: tn.barra_boton_en | default: {lit(T['bb_en'])}
    assign u = url | default: '/collections/best-sellers'
    assign uc = ta.barra_enlace | default: tn.barra_enlace
    if uc != blank
      assign u = uc
      assign u0 = uc | slice: 0
      if u0 == '/' and routes.root_url != '/'
        assign u = routes.root_url | append: uc
      endif
    endif
    assign fin = ta.barra_fin
    assign fo = ta.barra_fondo | default: tn.barra_fondo | default: '#000000'
    assign le = ta.barra_letra | default: tn.barra_letra | default: '#FFFFFF'
    assign bf = ta.barra_boton_fondo | default: tn.barra_boton_fondo | default: '#C8102E'
    assign bl = ta.barra_boton_letra | default: tn.barra_boton_letra | default: '#FFFFFF'
    assign dos = {'true' if tienda == 'com' else 'false'}
  -%}}
  {{%- if on != 'no' -%}}
<div class="svcd" id="svcd-1"
     data-hora-fin="23"
     data-minuto-fin="59"{{% if fin != blank %}}
     data-fin="{{{{ fin | escape }}}}"{{% endif %}}
     data-destino="#barra-oferta, #barra-cyber"
     data-temporada="{{{{ k | escape }}}}"
     style="background:{{{{ fo }}}};color:{{{{ le }}}};">
  <style>#svcd-1 .svcd__titulo,#svcd-1 .svcd__num,#svcd-1 .svcd__etiqueta,#svcd-1 .svcd__sep{{color:{{{{ le }}}}}}#svcd-1 .svcd__boton,#svcd-1 .svcd__boton:hover,#svcd-1 .svcd__boton:focus-visible{{background:{{{{ bf }}}};color:{{{{ bl }}}}}}#svcd-1 .svcd__boton:focus-visible{{outline-color:{{{{ bl }}}}}}</style>
  <div class="svcd__inner">
    <a class="svcd__titulo svcd__enlace" href="{{{{ u }}}}">{{%- if dos -%}}<span class="svcd__txt svcd__txt--es">{{{{ t_es | escape }}}}</span><span class="svcd__txt svcd__txt--en">{{{{ t_en | escape }}}}</span>{{%- else -%}}{{{{ t_es | escape }}}}{{%- endif -%}}</a>
    <div class="svcd__fila">
      <a class="svcd__reloj svcd__enlace" href="{{{{ u }}}}">
        {{%- assign un_es = 'Días,Horas,Min,Seg' | split: ',' -%}}
        {{%- assign un_en = 'Days,Hours,Min,Sec' | split: ',' -%}}
        {{%- assign un_dt = 'dias,horas,min,seg' | split: ',' -%}}
        {{%- for x in un_dt -%}}
        {{%- unless forloop.first %}}
        <span class="svcd__sep" aria-hidden="true">:</span>
        {{%- endunless %}}
        <div class="svcd__unidad">
          <span class="svcd__num" data-svcd-{{{{ x }}}}>00</span>
          <span class="svcd__etiqueta">{{%- if dos -%}}<span class="svcd__txt svcd__txt--es">{{{{ un_es[forloop.index0] }}}}</span><span class="svcd__txt svcd__txt--en">{{{{ un_en[forloop.index0] }}}}</span>{{%- else -%}}{{{{ un_es[forloop.index0] }}}}{{%- endif -%}}</span>
        </div>
        {{%- endfor %}}
      </a>
      <a class="svcd__boton" data-svcd-cta href="{{{{ u }}}}">{{%- if dos -%}}<span class="svcd__txt svcd__txt--es">{{{{ b_es | escape }}}}</span><span class="svcd__txt svcd__txt--en">{{{{ b_en | escape }}}}</span>{{%- else -%}}{{{{ b_es | escape }}}}{{%- endif -%}}</a>
    </div>
  </div>
</div>
  {{%- endif -%}}
{{%- when 'bloque' -%}}
  {{%- liquid
    assign on = ta.bloque_activo | default: tn.bloque_activo | default: 'si'
    if en
      assign t1 = ta.bloque_titulo_en | default: tn.bloque_titulo_en | default: {lit(T['qt_en'])}
      assign t2 = ta.bloque_texto_en | default: tn.bloque_texto_en | default: {lit(T['qx_en'])}
    else
      assign t1 = ta.bloque_titulo | default: tn.bloque_titulo | default: {lit(T['qt'])}
      assign t2 = ta.bloque_texto | default: tn.bloque_texto | default: {lit(T['qx'])}
    endif
    assign fo = ta.bloque_fondo | default: tn.bloque_fondo | default: '#E2D8CE'
    assign l1 = ta.bloque_letra | default: tn.bloque_letra | default: '#5B5147'
    assign l2 = ta.bloque_letra | default: tn.bloque_letra | default: '#33291F'
  -%}}
  {{%- if on != 'no' -%}}
<div class="banner-3x2-{{{{ sid }}}}" id="barra-oferta">
  {{%- if t1 != '-' %}}
  <p><strong>{{{{ t1 | escape }}}}</strong></p>
  {{%- endif -%}}
  {{%- if t2 != '-' %}}
  <p>{{{{ t2 | escape }}}}</p>
  {{%- endif %}}
</div>
{css_bloque}
  {{%- endif -%}}
{{%- when 'oferta' -%}}
  {{%- liquid
    assign on = ta.oferta_activa | default: tn.oferta_activa | default: 'si'
    if en
      assign o1 = ta.oferta_nombre_en | default: tn.oferta_nombre_en | default: {lit(T['o1_en'])}
      assign o2 = ta.oferta_etiqueta_en | default: tn.oferta_etiqueta_en | default: {lit(T['o2_en'])}
      assign o3 = ta.oferta_principal_en | default: tn.oferta_principal_en | default: {lit(T['o3_en'])}
      assign o4 = ta.oferta_texto_en | default: tn.oferta_texto_en | default: {lit(T['o4_en'])}
    else
      assign o1 = ta.oferta_nombre | default: tn.oferta_nombre | default: {lit(T['o1'])}
      assign o2 = ta.oferta_etiqueta | default: tn.oferta_etiqueta | default: {lit(T['o2'])}
      assign o3 = ta.oferta_principal | default: tn.oferta_principal | default: {lit(T['o3'])}
      assign o4 = ta.oferta_texto | default: tn.oferta_texto | default: {lit(T['o4'])}
    endif
    assign fo = ta.oferta_fondo | default: tn.oferta_fondo | default: '#E5D9CC'
    assign et = ta.oferta_etiqueta_fondo | default: tn.oferta_etiqueta_fondo | default: '#631D29'
    assign le = ta.oferta_letra | default: tn.oferta_letra
  -%}}
  {{%- if on != 'no' -%}}
<div class="banner-3x2-{{{{ sid }}}}">
  {{%- if o1 != '-' or o2 != '-' %}}
  <div class="bo-fila">
    {{%- if o1 != '-' %}}
    <p class="bo-nombre">{{{{ o1 | escape }}}}</p>
    {{%- endif -%}}
    {{%- if o2 != '-' %}}
    <span class="bo-tag">{{{{ o2 | escape }}}}</span>
    {{%- endif %}}
  </div>
  {{%- endif -%}}
  {{%- if o3 != '-' %}}
  <p class="bo-principal">{{{{ o3 | escape }}}}</p>
  {{%- endif -%}}
  {{%- if o4 != '-' %}}
  <p class="bo-texto">{{{{ o4 | escape }}}}</p>
  {{%- endif %}}
</div>

{css_oferta}
  {{%- endif -%}}
{{%- endcase -%}}
'''
os.makedirs(os.path.join(carpeta, 'snippets'), exist_ok=True)
open(os.path.join(carpeta, 'snippets', 'sv-temporada.liquid'), 'w', encoding='utf-8').write(snippet)
cambios.append('snippets/sv-temporada.liquid creado')

# --- 2. layout/theme.liquid: la barra ---
p = os.path.join(carpeta, 'layout', 'theme.liquid')
s = open(p, encoding='utf-8').read()
i = s.find('<div class="svcd" id="svcd-1"')
if i >= 0:
    j = s.find('<script>', i)
    marcado = s[i:j].rstrip()
    assert marcado.endswith('</div>') and s.count('<div class="svcd" id="svcd-1"') == 1
    s = s[:i] + "{%- render 'sv-temporada', parte: 'barra', url: url_banner -%}\n\n" + s[j:]
    reemplazos = [
        ("  var elDias  = raiz.querySelector('[data-svcd-dias]');",
         "  /* Fecha de término de la temporada (app → Temporadas, data-fin en UTC). Sin ella, la\n"
         "   * cuenta llega a las 23:59 de cada día. Pasada la fecha, la barra se esconde. */\n"
         "  var fin = raiz.dataset.fin ? new Date(raiz.dataset.fin) : null;\n"
         "  if (fin && isNaN(fin.getTime())) fin = null;\n"
         "  if (fin && fin.getTime() <= Date.now()) { raiz.style.display = 'none'; return; }\n\n"
         "  var elDias  = raiz.querySelector('[data-svcd-dias]');"),
        ("  function objetivo() {\n    var ahora = new Date();",
         "  function objetivo() {\n    if (fin) return fin;\n    var ahora = new Date();"),
        ("    if (restante <= 0) {\n      meta = objetivo();",
         "    if (restante <= 0) {\n      if (fin) { raiz.style.display = 'none'; return; }\n      meta = objetivo();"),
    ]
    if tienda == 'com':
        reemplazos.append((
            "    cta.setAttribute('href', '/en/collections/best-sellers');",
            "    var h = cta.getAttribute('href') || '';\n"
            "    if (h.charAt(0) === '/' && h.indexOf('/en/') !== 0) cta.setAttribute('href', '/en' + h);"))
    for viejo, nuevo in reemplazos:
        assert s.count(viejo) == 1, viejo
        s = s.replace(viejo, nuevo)
    open(p, 'w', encoding='utf-8').write(s)
    cambios.append('layout/theme.liquid: barra')

# --- 3. Carrito vacío: fotos de cualquier temporada ---
p = os.path.join(carpeta, 'snippets', 'custom-collecion-cart-page.liquid')
s = open(p, encoding='utf-8').read()
viejo = ("        {%- if sv_temporada == 'navidad' and c.metafields.custom.foto_navidad.value -%}"
         "{%- assign foto = c.metafields.custom.foto_navidad.value -%}{%- endif -%}")
nuevo = ("        {%- comment -%} Fuera de Normal, la foto de la temporada (sv-<clave>-<coleccion>.jpg; en Navidad, "
         "primero la «Foto de Navidad» de la coleccion). Si no hay, la normal. {%- endcomment -%}\n"
         "        {%- if sv_temporada != 'normal' -%}{%- assign sv_n = 'sv-' | append: sv_temporada | append: '-' | append: c.handle | append: '.jpg' -%}"
         "{%- assign sv_f = images[sv_n] -%}"
         "{%- if sv_temporada == 'navidad' and c.metafields.custom.foto_navidad.value -%}{%- assign sv_f = c.metafields.custom.foto_navidad.value -%}{%- endif -%}"
         "{%- if sv_f != blank -%}{%- assign foto = sv_f -%}{%- endif -%}{%- endif -%}")
if viejo in s:
    assert s.count(viejo) == 1
    s = s.replace(viejo, nuevo)
    open(p, 'w', encoding='utf-8').write(s)
    cambios.append('snippets/custom-collecion-cart-page.liquid: fotos de temporada')

print('\n'.join(cambios))
