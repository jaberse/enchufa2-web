#!/usr/bin/env python3
"""
procesar-fotos-comparador.py
─────────────────────────────
Script para procesar fotos de coches para el comparador de enchufa2.
Elimina el fondo, coloca el coche sobre un degradado oscuro consistente,
y exporta como WebP optimizado.

USO:
  1. Coloca las fotos originales en la carpeta 'raw/' al lado de este script.
     Nombra cada archivo con el slug del modelo:
       volkswagen-id3-pro-s.jpg
       tesla-model-y-rwd-long-range.jpg
       hyundai-ioniq-5-long-range-rwd.png
       etc.

  2. Ejecuta: python3 procesar-fotos-comparador.py

  3. Las fotos procesadas aparecerán en 'processed/' como .webp

  4. Copia los .webp a 03_Web/enchufa2-web/public/comparador/

REQUISITOS:
  pip install rembg pillow
"""

import os
import sys
import io
from pathlib import Path

try:
    from rembg import remove
    from PIL import Image, ImageDraw
except ImportError:
    print("Faltan dependencias. Ejecuta:")
    print("  pip install rembg pillow")
    sys.exit(1)


# ─── Configuración ───────────────────────────────────
TARGET_W = 1280           # Ancho final
TARGET_H = 720            # Alto final (16:9)
CAR_SCALE = 0.82          # El coche ocupa el 82% del ancho
WEBP_QUALITY = 90         # Calidad WebP (85-95 recomendado)
VERTICAL_OFFSET = 0.06    # Desplazar coche ligeramente abajo (simula perspectiva)

# Degradado oscuro enchufa2
BG_TOP = (10, 10, 10)       # #0a0a0a
BG_BOTTOM = (26, 26, 26)    # #1a1a1a
# ─────────────────────────────────────────────────────


def create_gradient_bg(w, h):
    """Crea fondo con degradado vertical oscuro."""
    bg = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(bg)
    for y in range(h):
        t = y / h
        r = int(BG_TOP[0] + t * (BG_BOTTOM[0] - BG_TOP[0]))
        g = int(BG_TOP[1] + t * (BG_BOTTOM[1] - BG_TOP[1]))
        b = int(BG_TOP[2] + t * (BG_BOTTOM[2] - BG_TOP[2]))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return bg


def add_subtle_floor(bg, y_pos):
    """Añade una línea sutil de suelo para dar profundidad."""
    draw = ImageDraw.Draw(bg)
    w = bg.width
    # Línea horizontal muy sutil
    floor_y = y_pos + 2
    for x in range(int(w * 0.15), int(w * 0.85)):
        # Fade in/out from edges
        dist_from_center = abs(x - w/2) / (w * 0.35)
        alpha = max(0, 1 - dist_from_center)
        gray = int(30 + alpha * 8)
        draw.point((x, floor_y), fill=(gray, gray, gray))
    return bg


def process_photo(input_path, output_path):
    """Procesa una foto: elimina fondo, coloca sobre degradado."""
    print(f"  Leyendo {input_path.name}...")
    with open(input_path, 'rb') as f:
        input_data = f.read()

    print(f"  Eliminando fondo...")
    output_data = remove(input_data)

    # Abrir como RGBA
    car = Image.open(io.BytesIO(output_data)).convert('RGBA')

    # Recortar espacios transparentes
    bbox = car.getbbox()
    if bbox:
        car = car.crop(bbox)

    print(f"  Coche recortado: {car.size[0]}x{car.size[1]}")

    # Crear fondo
    bg = create_gradient_bg(TARGET_W, TARGET_H)

    # Escalar coche para que ocupe CAR_SCALE del ancho
    car_w, car_h = car.size
    scale = min((TARGET_W * CAR_SCALE) / car_w, (TARGET_H * CAR_SCALE) / car_h)
    new_w = int(car_w * scale)
    new_h = int(car_h * scale)
    car_resized = car.resize((new_w, new_h), Image.LANCZOS)

    # Posicionar: centrado horizontal, ligeramente abajo del centro
    x = (TARGET_W - new_w) // 2
    y = (TARGET_H - new_h) // 2 + int(TARGET_H * VERTICAL_OFFSET)

    # Añadir línea de suelo sutil
    floor_y = y + new_h
    bg = add_subtle_floor(bg, floor_y)

    # Componer coche sobre fondo
    bg.paste(car_resized, (x, y), car_resized)

    # Guardar como WebP
    bg.save(output_path, 'WEBP', quality=WEBP_QUALITY)
    fsize = os.path.getsize(output_path) / 1024
    print(f"  Guardado: {output_path.name} ({fsize:.0f} KB)")


def main():
    script_dir = Path(__file__).parent
    raw_dir = script_dir / 'raw'
    out_dir = script_dir / 'processed'

    if not raw_dir.exists():
        raw_dir.mkdir()
        print(f"Carpeta 'raw/' creada. Coloca las fotos originales ahí y vuelve a ejecutar.")
        return

    out_dir.mkdir(exist_ok=True)

    # Formatos soportados
    extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    photos = [f for f in raw_dir.iterdir() if f.suffix.lower() in extensions]

    if not photos:
        print(f"No hay fotos en {raw_dir}/")
        print(f"Coloca archivos .jpg/.png con el slug del modelo como nombre.")
        return

    print(f"═══════════════════════════════════════════")
    print(f"  Procesador de fotos — enchufa2 comparador")
    print(f"  {len(photos)} fotos encontradas")
    print(f"  Tamaño final: {TARGET_W}x{TARGET_H} WebP")
    print(f"═══════════════════════════════════════════\n")

    ok = 0
    fail = 0
    for i, photo in enumerate(sorted(photos), 1):
        slug = photo.stem
        out_path = out_dir / f"{slug}.webp"

        print(f"[{i}/{len(photos)}] {slug}")
        try:
            process_photo(photo, out_path)
            ok += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            fail += 1
        print()

    print(f"═══════════════════════════════════════════")
    print(f"  Completado: {ok} OK, {fail} errores")
    print(f"  Fotos en: {out_dir}/")
    print(f"")
    print(f"  Siguiente paso: copiar los .webp a")
    print(f"  03_Web/enchufa2-web/public/comparador/")
    print(f"═══════════════════════════════════════════")


if __name__ == '__main__':
    main()
