#!/usr/bin/env python3
"""Card-front watermarks, one plate per kind plus the monarch for the Whispers.

900 x 1500px at 300dpi: the 2.75 x 4.75in tarot trim plus 1/8in bleed on every
edge, per the production spec. Each plate is a duotone whose highlight is that
card's own stock colour, so the paper is unchanged and the watermark can only
ever be lighter than the ink printed over it.

The depth of the darkest pigment is not a flat number. It is solved per kind so
that every plate loses the same amount of luminance from its stock -- otherwise
the Merchant, whose ink is a light gold, would come out far fainter than the
Assassin, whose ink is nearly black.
"""
import pathlib
from PIL import Image, ImageOps, ImageEnhance

W, H = 900, 1500
SRC = pathlib.Path("/mnt/user-data/uploads")
OUT = pathlib.Path("/mnt/user-data/outputs/watermarks")
OUT.mkdir(parents=True, exist_ok=True)


def rgb(hexstr):
    return tuple(int(hexstr[i:i+2], 16) for i in (1, 3, 5))


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def lab(c):
    """sRGB to CIE Lab, D65. Needed because matching luminance alone is not
    enough: the Merchant's gold separates from cream by chroma as well as by
    lightness, and came out looking twice the weight of the Assassin's slate
    at the same luminance drop."""
    import math
    def f(u):
        u = u / 255
        u = u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
        return u
    r_, g_, b_ = (f(v) for v in c)
    x = (0.4124 * r_ + 0.3576 * g_ + 0.1805 * b_) / 0.95047
    y = (0.2126 * r_ + 0.7152 * g_ + 0.0722 * b_)
    z = (0.0193 * r_ + 0.1192 * g_ + 0.9505 * b_) / 1.08883
    def h(t):
        return t ** (1/3) if t > 0.008856 else 7.787 * t + 16/116
    fx, fy, fz = h(x), h(y), h(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def delta_e(a, b):
    la, lb = lab(a), lab(b)
    return sum((la[i] - lb[i]) ** 2 for i in range(3)) ** 0.5


def solve_depth(face, ink, target):
    """Smallest depth whose darkest pigment sits `target` from the stock in Lab."""
    lo, hi = 0.0, 0.75
    for _ in range(40):
        mid = (lo + hi) / 2
        dark = tuple(face[c] + (ink[c] - face[c]) * mid for c in range(3))
        if delta_e(face, dark) < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


# stock, ink, and how far the darkest pigment should sit from the stock in Lab. Agent faces carry a rank and one mark, so they can hold more; a Whisper
# face is covered in text and takes roughly half.
PLATES = [
    # zoom pulls the subject up to a size that still reads once the frame, the
    # index and the central mark are printed over it. The engravings are framed
    # very differently: the merchants fill their plate, the jesters do not.
    ("assassin", "assassins", "#d4d9df", "#1e2530", 21, 0.60, 0.66, 1.30),
    ("lover",    "lovers",    "#f1d4cb", "#7c241e", 21, 0.76, 0.66, 1.22),
    ("merchant", "merchants", "#f0e1ba", "#684d0e", 21, 0.30, 0.66, 1.10),
    ("fool",     "fools2",    "#e3d6e6", "#492851", 21, 0.45, 0.66, 1.15),
    ("whisper",  "monarch",   "#f4f0e6", "#1a2050", 16, 0.42, 0.70, 1.20),
    ("burden",   "monarch",   "#f4f0e6", "#4a1524", 16, 0.42, 0.70, 1.20),
]


def build(name, source, face_hex, ink_hex, target, bias, mean_target, zoom=1.0):
    face, ink = rgb(face_hex), rgb(ink_hex)
    depth = min(0.55, solve_depth(face, ink, target))
    dark = tuple(round(face[c] + (ink[c] - face[c]) * depth) for c in range(3))

    im = Image.open(SRC / f"{source}.PNG").convert("L")
    sw, sh = im.size
    scale = max(W / sw, H / sh) * zoom
    im = im.resize((round(sw * scale), round(sh * scale)), Image.LANCZOS)
    left = (im.width - W) // 2
    # A larger bias slides the crop window down the plate, which lifts the
    # subject up the card -- out from behind the central mark, which covers
    # the middle third of every agent face.
    top = max(0, min(im.height - H, round((im.height - H) * bias)))
    im = im.crop((left, top, left + W, top + H))

    im = ImageOps.autocontrast(im, cutoff=(1, 1))
    im = ImageEnhance.Contrast(im).enhance(0.62)
    # The four engravings differ enormously in overall darkness -- the assassins
    # are half again as heavy as the merchants -- so matching only the darkest
    # tone leaves one card looking muddy beside the rest. Solve a gamma that
    # puts every plate's average at the same weight.
    stats = im.resize((90, 150), Image.LANCZOS)
    mean = sum(stats.getdata()) / (90 * 150 * 255)
    import math
    gamma = math.log(mean_target) / math.log(max(0.02, min(0.98, mean)))
    im = im.point([round(255 * (i / 255) ** gamma) for i in range(256)])

    plate = Image.merge("RGB", tuple(
        im.point([round(dark[c] + (face[c] - dark[c]) * i / 255) for i in range(256)])
        for c in range(3)))
    path = OUT / f"{name}-watermark.jpg"
    plate.save(path, quality=96, subsampling=0)
    check = sum(plate.convert("L").resize((90, 150), Image.LANCZOS).getdata()) / (90 * 150)
    print(f"{name:9s} stock {face_hex}  darkest #{dark[0]:02x}{dark[1]:02x}{dark[2]:02x}"
          f"  depth {depth:.3f}  \u0394E {delta_e(face, dark):4.1f}"
          f"  source mean {mean:.2f} -> gamma {gamma:.2f}  plate mean {check:.0f}")
    return plate


plates = {name: build(name, *rest) for name, *rest in PLATES}

# a contact sheet, at the size the plates will actually be seen
sheet = Image.new("RGB", (6 * 300 + 7 * 20, 500 + 40), "#55504a")
for i, (name, *_rest) in enumerate(PLATES):
    sheet.paste(plates[name].resize((300, 500), Image.LANCZOS), (20 + i * 320, 20))
sheet.save("/home/claude/plates.png")
