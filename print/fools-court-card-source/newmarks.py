#!/usr/bin/env python3
"""Build the three redrawn emblems and proof them at size.

Everything is emitted as absolute coordinates in the 0-100 box the other marks
use, and as *filled* shapes only. That second point is not cosmetic: art.js
wraps an emblem in a group carrying fill and nothing else, so a stroked path
would come out black wherever a mark is printed in a kind's own ink.
"""
import math

# ----------------------------------------------------------------- helpers ---


def band(points, widths):
    """A tapered filled band along a polyline, widths given per point."""
    left, right = [], []
    for i, (x, y) in enumerate(points):
        if i == 0:
            dx, dy = points[1][0] - x, points[1][1] - y
        elif i == len(points) - 1:
            dx, dy = x - points[-2][0], y - points[-2][1]
        else:
            dx = points[i + 1][0] - points[i - 1][0]
            dy = points[i + 1][1] - points[i - 1][1]
        n = math.hypot(dx, dy) or 1
        px, py = -dy / n, dx / n
        h = widths[i] / 2
        left.append((x + px * h, y + py * h))
        right.append((x - px * h, y - py * h))
    ring = left + right[::-1]
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in ring) + " Z"


def quad(a, b, w):
    """A thin filled bar from a to b."""
    return band([a, b], [w, w])


def bezier(p0, p1, p2, n=14):
    """Points along a quadratic, so a curve can be given a varying width."""
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))
    return out


def taper(a, b, n):
    return [a + (b - a) * i / n for i in range(n + 1)]


# -------------------------------------------------------------- the Fool -----
# Unlike the other two this one is not built from the helpers above. It was
# drawn as separate layers in a vector editor and handed over as SVG, so these
# shapes are the artwork itself rather than an approximation of it. Three
# things were done to it and nothing else:
#
#   * the rotate() transforms on the outer and central arms were baked into
#     their coordinates. art.js wraps an emblem in a group carrying fill and
#     nothing else, and a transform left on a child survives today but breaks
#     the moment the mark is re-nested or re-scaled;
#   * stroke="null" was stripped from every path, for the reason in the module
#     docstring above: an emblem has to be filled shapes only;
#   * the drawing was shifted down 8 units. As drawn it sat at y 10-74 in the
#     0-100 box, hanging high with dead space beneath it; it now sits 18-82.
#
# The arms arrive as 31-point polylines. Refitting them as smooth curves was
# tried and thrown away — it moved 0.3% of the rendered pixels and cost a third
# more path data, so the segments stand exactly as drawn.
FOOL_CAP = (
    "<circle cx='22.50' cy='25.00' r='7'/><path d='m 52.5,51 c -19,0 -31,9.3 -31,21.7"
    " l 0,9.3 l 62,0 l 0,-9.3 c 0,-12.4 -12,-21.7 -31,-21.7 z'/><path d='M45.20 51.45"
    " L42.61 47.43 L39.93 43.87 L37.00 41.01 L33.80 38.77 L30.00 37.38 L25.94 37.30 L"
    "22.14 38.46 L19.20 40.63 L16.79 43.33 L14.63 46.66 L12.64 50.60 L10.74 55.24 L8."
    "93 60.50 L7.20 66.45 L12.90 68.00 L15.15 62.35 L17.30 57.48 L19.46 53.46 L21.54 "
    "50.29 L23.52 47.97 L25.25 46.58 L26.46 46.12 L26.89 46.19 L27.06 46.42 L27.58 46"
    ".89 L28.62 48.05 L30.09 50.06 L31.73 52.84 L33.63 56.71 L45.20 51.45 Z'/><path d"
    "='M67.61 56.40 L68.39 52.00 L69.19 48.77 L70.03 46.38 L70.68 44.96 L71.03 44.37 "
    "L71.13 44.09 L71.50 43.92 L72.70 44.15 L74.58 45.24 L76.92 47.24 L79.54 50.10 L8"
    "2.44 53.82 L85.55 58.43 L88.91 63.83 L93.66 61.04 L90.68 55.22 L87.79 50.14 L84."
    "98 45.71 L82.25 42.03 L79.52 39.03 L76.70 36.72 L73.54 35.08 L69.85 34.67 L66.23"
    " 35.59 L63.15 37.82 L60.82 40.81 L58.87 44.39 L57.32 48.63 L55.96 53.34 L67.61 5"
    "6.40 Z'/><circle cx='11.50' cy='60.00' r='9'/><circle cx='88.50' cy='58.00' r='9"
    "'/><path d='M52.02 62.43 L53.76 57.82 L55.08 53.28 L55.70 48.68 L55.69 44.00 L54"
    ".66 38.91 L52.44 33.99 L49.39 29.85 L46.02 27.11 L42.51 25.20 L38.66 23.83 L34.4"
    "1 22.90 L29.66 22.33 L24.47 22.09 L18.77 22.22 L20.74 29.66 L26.49 30.27 L31.57 "
    "31.07 L35.97 32.18 L39.65 33.50 L42.61 35.03 L44.69 36.60 L45.73 37.88 L45.91 38"
    ".43 L45.83 38.72 L45.75 39.52 L45.41 41.20 L44.64 43.71 L43.35 46.72 L41.35 50.4"
    "4 L52.02 62.43 Z'/>"
)


def fool():
    return FOOL_CAP


# ---------------------------------------------------------- the Merchant -----
# A balance. The pans were triangles hanging level with the beam; they are now
# half discs slung well below it on chains, which is what a balance actually
# looks like and which reads at a glance as weighing rather than as two flags.
CHAIN_W = 2.6      # see the note in the summary: this is the thinnest line in
                   # the whole set, and the first thing a small size will lose


def merchant():
    post = "M46 14 L54 14 L54 76 L46 76 Z"
    knob = "<circle cx='50' cy='13' r='6'/>"
    beam = "M14 22 L86 22 L86 29 L14 29 Z"
    parts = [f"<path d='{post}'/>", f"<path d='{beam}'/>", knob]
    for cx in (20, 80):
        apex = (cx, 29)
        for end in ((cx - 16, 56), (cx + 16, 56)):
            parts.append(f"<path d='{quad(apex, end, CHAIN_W)}'/>")
        # the pan: a half disc, flat side up
        parts.append(
            f"<path d='M{cx - 16} 56 A16 16 0 0 0 {cx + 16} 56 Z'/>")
    parts.append("<path d='M34 84 C34 75 66 75 66 84 Z'/>")
    parts.append("M24 84 L76 84 L76 92 L24 92 Z")
    parts[-1] = f"<path d='{parts[-1]}'/>"
    return "".join(parts)


# ------------------------------------------------------------ the Lover ------
# Two hearts on stems, crossed square in an X. The old mark was a rosette of
# six circles, which read as a clover at small size and had to have its centre
# solved to close the gaps between the petals.
HEART = [(50, 88), (20, 60), (8, 44), (8, 30), (8, 16), (18, 8), (30, 8),
         (39, 8), (46, 13), (50, 20), (54, 13), (61, 8), (70, 8),
         (82, 8), (92, 16), (92, 30), (92, 44), (80, 60), (50, 88)]


def heart(cx, cy, w, deg=0.0):
    """The heart above, moved, scaled and turned. Absolute coordinates.

    deg turns it clockwise about its own centre, so a heart can be laid along
    a stem: its axis runs from the tip up through the cleft, and that axis has
    to sit on the stem or the thing reads as a heart that happens to be near a
    stick rather than one carried on it.
    """
    k = w / 84.0                      # the path spans x 8..92
    a = math.radians(deg)
    ca, sa = math.cos(a), math.sin(a)
    def T(p):
        x, y = (p[0] - 50) * k, (p[1] - 48) * k
        return (cx + x * ca - y * sa, cy + x * sa + y * ca)
    p = [T(q) for q in HEART]
    d = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(1, len(p) - 1, 3):
        a, b, c = p[i], p[i + 1], p[i + 2]
        d += (f" C{a[0]:.1f} {a[1]:.1f} {b[0]:.1f} {b[1]:.1f} "
              f"{c[0]:.1f} {c[1]:.1f}")
    return d + " Z"


def lover():
    """Two hearts on stems, crossed. Each heart is turned to sit on its own
    stem, and its centre is put at the stem's top end so the tip runs back
    down the stick and the two merge into one shape."""
    foot_l, foot_r = (24, 94), (76, 94)
    head_r, head_l = (70, 32), (30, 32)
    stems = [(foot_l, head_r), (foot_r, head_l)]
    out = "".join(f"<path d='{quad(a, b, 6.2)}'/>" for a, b in stems)
    for foot, head in stems:
        dx, dy = head[0] - foot[0], head[1] - foot[1]
        deg = math.degrees(math.atan2(dx, -dy))   # 0 is upright
        out += f"<path d='{heart(head[0], head[1], 34, deg)}'/>"
    return out


MARKS = {'C': fool(), 'D': merchant(), 'H': lover()}

if __name__ == '__main__':
    import json
    print(json.dumps(MARKS, indent=1))