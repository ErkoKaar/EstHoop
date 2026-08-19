#!/usr/bin/env python3
"""Genereerib logo artworkist saidi brändivarad: favikooni, iOS ikooni,
ruudukujulise logo ja jagamiskaardi vaikepildi.

Miks mitte kasutada igal pool logo/logo.png: see on 300x250, seega pole ruut
ega piisavalt suur. Google nõuab favikoonilt ruutu, soovitatavalt 48 piksli
kordset, ja Facebook näitab alla 600x315 pilti väikese ruudukesena suure
kaardi asemel.

Miks valge märk sinisel: sama lukk mis navbaril, loetav ka tumedas
brauserivahelehes, ja iOS paneb läbipaistvuse taha musta, seega peab ikoon
olema läbipaistmatu.

Käivita frontend/ kaustast, kui logo muutub:
    python3 scripts/generate-brand-assets.py
"""

import pathlib
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow puudub. Paigalda: python3 -m pip install Pillow")

BG = (6, 17, 31)          # #06111f, sama mis hero alusvärv
BLUE = (0, 114, 206)      # #0072ce
BLACK = (10, 10, 26)      # #0a0a1a
FLAG_WHITE = (237, 240, 245)
WHITE = (255, 255, 255)

PUBLIC = pathlib.Path("public")
MARK_WHITE = PUBLIC / "logo" / "logo_white.png"
MARK_BLUE = PUBLIC / "logo" / "logo.png"


def load_mark(path):
    """Märk istub lõuendil ebaühtlase äärisega: vasakul 51, all 18 pikslit
    tühja. Lõikame nähtava osa välja ja tsentreerime ise, muidu jääb ikoonis
    viltu."""
    if not path.exists():
        sys.exit(f"Puudub {path}. Käivita skript frontend/ kaustast.")
    mark = Image.open(path).convert("RGBA")
    box = mark.getchannel("A").getbbox()
    if box is None:
        sys.exit(f"{path} on täiesti läbipaistev, märki ei leitud.")
    return mark.crop(box)


def fitted(mark, height):
    width = max(1, round(mark.width * height / mark.height))
    return mark.resize((width, height), Image.LANCZOS)


def centered(canvas, mark, dy=0):
    x = (canvas.width - mark.width) // 2
    y = (canvas.height - mark.height) // 2 + dy
    canvas.paste(mark, (x, y), mark)


def icon_image(mark, size, fill, background):
    """Ruudukujuline paan. fill on märgi kõrgus paani kõrgusest."""
    tile = Image.new("RGB", (size, size), background)
    centered(tile, fitted(mark, round(size * fill)))
    return tile


def icon(mark, size, fill, background, out):
    icon_image(mark, size, fill, background).save(out, "PNG", optimize=True)
    return out


# Väikestel mõõtudel kaob märk äärise sisse ära, seega anname talle rohkem
# pinda. 48 on nimekirjas sellepärast, et kui Google võtab favikooni ICO seest,
# leiab ta sealt ka 48 piksli kordse variandi.
ICO_TILES = ((48, 0.78), (32, 0.84), (16, 0.90))


def favicon_ico(mark, out):
    """Brauserid ja mitmed roomajad küsivad /favicon.ico juurest ka ilma
    sildita. Iga mõõt joonistatakse eraldi, sest ühe pildi allaskaleerimisel
    jääks väikestel äär liiga laiaks."""
    tiles = {size: icon_image(mark, size, fill, BLUE) for size, fill in ICO_TILES}
    tiles[48].save(
        out,
        format="ICO",
        sizes=[(size, size) for size, _ in ICO_TILES],
        append_images=[tiles[32], tiles[16]],
    )
    return out


# Android lõikab maskable ikooni ringiks ja turvatsoon on keskmine 80%. Märgi
# ümbriskasti pooldiagonaal on 1.31 korda pool kõrgust, millest tuleb ülempiir
# 0.61. Võtame 0.56, et pointsed kõrvad kindlasti sisse jääksid.
MASKABLE_FILL = 0.56


def share_card(mark, out):
    """Sama kaardipõhi mis mängijate kaartidel generate-og-images.py-s, et
    jagamispildid oleksid ühte nägu."""
    width, height, bar = 1200, 630, 12
    card = Image.new("RGB", (width, height), BG)

    # Sinine valgusvihk keskel, sama võte mis lehe heros
    glow = Image.new("RGB", (width, height), BG)
    ImageDraw.Draw(glow).ellipse(
        [width // 2 - 340, height // 2 - 340, width // 2 + 340, height // 2 + 340],
        fill=BLUE,
    )
    card = Image.blend(card, glow.filter(ImageFilter.GaussianBlur(120)), 0.30)

    centered(card, fitted(mark, 320), dy=-16)

    # Eesti lipp allservas, sama üleminek mis lehel hero ja sisu vahel
    draw = ImageDraw.Draw(card)
    for i, colour in enumerate((BLUE, BLACK, FLAG_WHITE)):
        y = height - bar * (3 - i)
        draw.rectangle([0, y, width, y + bar], fill=colour)

    card.save(out, "JPEG", quality=86, optimize=True, progressive=True)
    return out


def main():
    white_mark = load_mark(MARK_WHITE)
    blue_mark = load_mark(MARK_BLUE)

    (PUBLIC / "og").mkdir(parents=True, exist_ok=True)

    written = [
        # 192 on 48 kordne, nagu Google favikoonilt ootab
        icon(white_mark, 192, 0.68, BLUE, PUBLIC / "favicon-192.png"),
        favicon_ico(white_mark, PUBLIC / "favicon.ico"),
        # iOS lõikab nurgad ümaraks, seega märk siin veidi väiksem
        icon(white_mark, 180, 0.60, BLUE, PUBLIC / "apple-touch-icon.png"),
        # manifest.json: tavaline ja maskable variant Androidi jaoks
        icon(white_mark, 512, 0.68, BLUE, PUBLIC / "icon-512.png"),
        icon(white_mark, 512, MASKABLE_FILL, BLUE, PUBLIC / "icon-maskable-512.png"),
        # JSON-LD Organization.logo: teadmuspaneelis on taust hele
        icon(blue_mark, 512, 0.72, WHITE, PUBLIC / "logo" / "logo-square.png"),
        share_card(white_mark, PUBLIC / "og" / "default.jpg"),
    ]

    for path in written:
        with Image.open(path) as im:
            size = f"{im.size[0]}x{im.size[1]}"
        print(f"[bränd] {str(path):34} {size:9} {path.stat().st_size / 1024:5.0f} KB")


if __name__ == "__main__":
    main()
