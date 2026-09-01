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
# A cap: a bell, a stem with a bell on top, and two arms that leave the centre
# where the stem meets the bell and curve out to a bell on each side. The arms
# were two straight rotated bars; they are now curves, and they start together
# at the centre rather than at two separate points on the body.
def fool():
    body = ("M50 44 C31 44 19 56 19 72 L19 84 L81 84 L81 72 "
            "C81 56 69 44 50 44 Z")
    stem = "M45 17 L55 17 L55 47 L45 47 Z"
    # The control point sits above the chord, so each arm rises out of the
    # centre and arcs over to its bell. The base is about three times the width
    # of the tip: at the old 11.5 the arms read as wires strung between the
    # bells rather than as cloth falling from the cap.
    arm_r = band(bezier((50, 48), (66, 21), (85, 17)), taper(20.0, 6.5, 14))
    arm_l = band(bezier((50, 48), (34, 21), (15, 17)), taper(20.0, 6.5, 14))
    bells = ("<circle cx='50' cy='11' r='10'/>"
             "<circle cx='13' cy='14' r='10'/>"
             "<circle cx='87' cy='14' r='10'/>")
    return (f"<path d='{body}'/><path d='{arm_l}'/><path d='{arm_r}'/>"
            f"<path d='{stem}'/>{bells}")


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
