#!/usr/bin/env python3
"""Genereerib mängijate jagamispildid (og:image) failist public/players/<slug>.webp.

Miks eraldi JPEG, kui fotod on juba WebP-s: Facebook ja LinkedIn ei toeta WebP-d
og:image'ina usaldusväärselt. Need kaardid on ainsad pildid saidil, mida päris
külastaja kunagi ei lae, seega nende maht ei mõjuta lehe kiirust.

Miks 1200x630: see on sotsiaalvõrkude eelistatud kuvasuhe. Ruudukujuline 600x600
foto lõigataks kaardil keskelt ribaks ja pea jääks välja.

Käivita, kui mängijate fotod muutuvad:
    python3 scripts/generate-og-images.py
"""

import pathlib
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow puudub. Paigalda: python3 -m pip install Pillow")

W, H = 1200, 630
BG = (6, 17, 31)        # #06111f, sama mis hero alusvärv
BLUE = (0, 114, 206)    # #0072ce
BLACK = (10, 10, 26)    # #0a0a1a
WHITE = (237, 240, 245)

PHOTO_SIZE = 420
BAR = 12                # Eesti lipu riba kõrgus

SRC = pathlib.Path("public/players")
OUT = pathlib.Path("public/og/players")


def make_card(photo_path, out_path):
    card = Image.new("RGB", (W, H), BG)

    # Sinine valgusvihk keskel, sama võte mis lehe heros
    glow = Image.new("RGB", (W, H), BG)
    ImageDraw.Draw(glow).ellipse(
        [W // 2 - 340, H // 2 - 340, W // 2 + 340, H // 2 + 340], fill=BLUE
    )
    card = Image.blend(card, glow.filter(ImageFilter.GaussianBlur(120)), 0.30)

    # Foto ringina. Mask joonistatakse neljakordses mõõdus ja vähendatakse,
    # muidu jääb ringi serv trepitud.
    photo = Image.open(photo_path).convert("RGB").resize((PHOTO_SIZE, PHOTO_SIZE), Image.LANCZOS)
    mask = Image.new("L", (PHOTO_SIZE * 4, PHOTO_SIZE * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, PHOTO_SIZE * 4, PHOTO_SIZE * 4], fill=255)
    mask = mask.resize((PHOTO_SIZE, PHOTO_SIZE), Image.LANCZOS)
    card.paste(photo, ((W - PHOTO_SIZE) // 2, (H - PHOTO_SIZE) // 2 - 16), mask)

    # Eesti lipp allservas, sama üleminek mis lehel hero ja sisu vahel
    draw = ImageDraw.Draw(card)
    for i, colour in enumerate((BLUE, BLACK, WHITE)):
        y = H - BAR * (3 - i)
        draw.rectangle([0, y, W, y + BAR], fill=colour)

    card.save(out_path, "JPEG", quality=86, optimize=True, progressive=True)
    return out_path.stat().st_size


def main():
    photos = sorted(SRC.glob("*.webp"))
    if not photos:
        sys.exit(f"Ühtegi fotot ei leitud kaustast {SRC}")

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for photo in photos:
        total += make_card(photo, OUT / f"{photo.stem}.jpg")

    print(f"[og] {len(photos)} kaarti kirjutatud -> {OUT}  ({total / 1024:.0f} KB kokku)")


if __name__ == "__main__":
    main()
