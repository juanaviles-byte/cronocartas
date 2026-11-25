# Genera los íconos y la pantalla de carga de Android a partir de apk/icono.png y apk/logo.png.
# Uso (desde la raíz del repositorio): python3 apk/recursos.py
import os
from PIL import Image

FONDO = (23, 38, 79)            # #17264F, azul noche de la marca
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
SPLASH = {'mdpi': (320, 480), 'hdpi': (480, 800), 'xhdpi': (720, 1280), 'xxhdpi': (960, 1600), 'xxxhdpi': (1280, 1920)}
RES = 'apk/res'

icono_rgba = Image.open('apk/icono.png').convert('RGBA')   # ficha con esquinas redondeadas (transparentes)
icono = Image.new('RGB', icono_rgba.size, FONDO); icono.paste(icono_rgba, (0, 0), icono_rgba)
logo = Image.open('apk/logo.png').convert('RGBA')
logo = logo.crop(logo.getbbox())

def guardar(img, ruta):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    img.save(ruta, optimize=True)

def redondo(img):
    m = Image.new('L', img.size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).ellipse((0, 0, img.width - 1, img.height - 1), fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0)); out.paste(img, (0, 0), m); return out

for d, f in DENS.items():
    n = round(48 * f)                      # ícono clásico: 48 dp
    guardar(icono.resize((n, n), Image.LANCZOS), f'{RES}/mipmap-{d}/ic_launcher.png')
    guardar(redondo(icono.resize((n, n), Image.LANCZOS)), f'{RES}/mipmap-{d}/ic_launcher_round.png')
    m = round(108 * f)                     # ícono adaptable: capa de 108 dp (se ven los 72 dp del centro)
    capa = Image.new('RGBA', (m, m), (0, 0, 0, 0)); t = round(70 * f)   # la ficha entera cabe en la zona visible
    capa.alpha_composite(icono_rgba.resize((t, t), Image.LANCZOS), ((m - t) // 2, (m - t) // 2))
    guardar(capa, f'{RES}/mipmap-{d}/ic_launcher_foreground.png')

def splash(w, h):
    img = Image.new('RGB', (w, h), FONDO)
    ancho = round(min(w, h) * 0.8)
    l = logo.resize((ancho, round(logo.height * ancho / logo.width)), Image.LANCZOS)
    img.paste(l, ((w - l.width) // 2, (h - l.height) // 2), l)
    return img

for d, (w, h) in SPLASH.items():
    guardar(splash(w, h), f'{RES}/drawable-port-{d}/splash.png')
    guardar(splash(h, w), f'{RES}/drawable-land-{d}/splash.png')
guardar(splash(1280, 1280), f'{RES}/drawable/splash.png')

os.makedirs(f'{RES}/mipmap-anydpi-v26', exist_ok=True)
for n in ('ic_launcher', 'ic_launcher_round'):
    open(f'{RES}/mipmap-anydpi-v26/{n}.xml', 'w').write(
        '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/cronocartas_fondo_icono"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n')
os.makedirs(f'{RES}/values', exist_ok=True)
open(f'{RES}/values/cronocartas.xml', 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="cronocartas_fondo_icono">#17264F</color>\n</resources>\n')
print('recursos listos en', RES)
