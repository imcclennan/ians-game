/*
 * cards.js — builds the SVG for every kind of card, in every candidate style.
 * Units are tenths of a millimetre. Trim is 700 x 1200 (70 x 120 mm).
 */
const A = require('./art');
const WM = require('./watermark');
const { emblem, crown, fleuron, text, block, wrap, r, STYLES, ROLE, PLEDGE } = A;

const W = 700, H = 1200;
const CX = 350, CY = 600;

// Repo palette, so the printed cards match the screen game.
const FACE = { S: '#ccd3de', H: '#f0cdc6', D: '#eeddb0', C: '#ded0e7' };
const INK = { S: '#1e2530', H: '#7c241e', D: '#684d0e', C: '#492851' };

const TITLE = 'THE FOOL’S COURT';
const SUBTITLE = 'A WORD FROM THE COURT';
const W_TITLE = 'WHISPER';

// PrinterStudio tarot spec, in tenths of a millimetre:
//   layout with bleed  3.00" x 5.00"   = 762   x 1270
//   trim (finished)    2.75" x 4.75"   = 698.5 x 1206.5
//   bleed              1/8" all round  = 31.75
const SHEET_W = 762, SHEET_H = 1270;
const TRIM_W = 698.5, TRIM_H = 1206.5;
const BLEED = 31.75;

/**
 * Wrap inner SVG in a document.
 *  - print mode maps the 700 x 1200 design onto the real trim and adds bleed.
 *  - otherwise it is drawn at design size, for on-screen samples.
 */
function doc(inner, opts) {
  const o = opts || {};
  if (o.print) {
    const sx = TRIM_W / W, sy = TRIM_H / H;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${r(SHEET_W / 10)}mm" ` +
      `height="${r(SHEET_H / 10)}mm" viewBox="0 0 ${SHEET_W} ${SHEET_H}">` +
      `<defs>${o.defs || ''}</defs>` +
      `<g transform="translate(${BLEED},${BLEED}) scale(${r(sx, 6)},${r(sy, 6)})">${inner}</g>` +
      (o.guides ? printGuides() : '') +
      `</svg>`;
  }
  const b = o.bleed || 0;
  const w = W + 2 * b, h = H + 2 * b;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r(w / 10)}mm" height="${r(h / 10)}mm" ` +
    `viewBox="0 0 ${r(w)} ${r(h)}">` +
    `<defs>${o.defs || ''}</defs>` +
    `<g transform="translate(${r(b)},${r(b)})">${inner}</g>` +
    (o.guides ? guides(b) : '') +
    `</svg>`;
}

/** Magenta = trim, cyan = the 1/8" safe zone. Proofing only; never printed. */
function printGuides() {
  return `<g fill="none" stroke-width="2">` +
    `<rect x="${BLEED}" y="${BLEED}" width="${TRIM_W}" height="${TRIM_H}" stroke="#ff00ff" stroke-dasharray="14 9"/>` +
    `<rect x="${BLEED * 2}" y="${BLEED * 2}" width="${TRIM_W - 2 * BLEED}" height="${TRIM_H - 2 * BLEED}" ` +
    `stroke="#00c2ff" stroke-dasharray="9 9"/></g>`;
}

function guides(b) {
  const safe = 30;
  return `<g fill="none" stroke-width="2">` +
    `<rect x="${r(b)}" y="${r(b)}" width="${W}" height="${H}" stroke="#ff00ff" stroke-dasharray="12 8"/>` +
    `<rect x="${r(b + safe)}" y="${r(b + safe)}" width="${W - 2 * safe}" height="${H - 2 * safe}" ` +
    `stroke="#00c2ff" stroke-dasharray="8 8"/></g>`;
}

/** A rect painted well past the trim so the bleed area is covered. */
function sheet(fill, bleed, opacity) {
  const m = (bleed || 0) + 60;
  return `<rect x="${-m}" y="${-m}" width="${W + 2 * m}" height="${H + 2 * m}" fill="${fill}"` +
    (opacity != null ? ` opacity="${opacity}"` : '') + `/>`;
}

/** The mirrored title block used on every back: upright above, inverted below. */
function mirrored(inner) {
  return `<g>${inner}</g><g transform="rotate(180 ${CX} ${CY})">${inner}</g>`;
}

/** Four marks set around the medallion. */
function ring(radius, size, fill, opacity) {
  const at = [['C', 0, -1], ['D', 1, 0], ['H', 0, 1], ['S', -1, 0]];
  return at.map(([su, dx, dy]) =>
    emblem(su, CX + dx * radius, CY + dy * radius, size, fill, opacity)).join('');
}

// --------------------------------------------------------- whisper motif ---
// A folded letter under a wax seal: sealed at the deal, opened at the end.
function whisperMotif(size, gold, dark) {
  const w = size * 0.98, h = size * 0.66;
  const x = CX - w / 2, y = CY - h / 2 - size * 0.06;
  const sealY = y + h * 0.66;
  let s = `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${r(size * 0.025)}" ` +
    `fill="none" stroke="${gold}" stroke-width="${r(size * 0.026)}"/>`;
  s += `<path d="M${r(x + 3)} ${r(y + 3)} L${r(CX)} ${r(y + h * 0.54)} L${r(x + w - 3)} ${r(y + 3)}" ` +
    `fill="none" stroke="${gold}" stroke-width="${r(size * 0.022)}"/>`;
  s += `<circle cx="${r(CX)}" cy="${r(sealY)}" r="${r(size * 0.185)}" fill="${gold}"/>`;
  s += `<circle cx="${r(CX)}" cy="${r(sealY)}" r="${r(size * 0.152)}" fill="none" stroke="${dark}" ` +
    `stroke-width="${r(size * 0.016)}"/>`;
  s += crown(CX, sealY, size * 0.2, dark, 1);
  return s;
}

// ================================================================= styles ===
const BUILD = {

  // ------------------------------------------------------------ heraldic ---
  heraldic: {
    back(kind, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.heraldic, g = S.gold, isW = kind === 'whisper';
      let s = sheet('#280b13', bleed);
      s += sheet('url(#h-bg)', bleed) + sheet('url(#h-hatch)', bleed);

      // engraved frame
      s += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="none" stroke="${g}" stroke-width="5" opacity="0.95"/>`;
      s += `<rect x="66" y="66" width="${W - 132}" height="${H - 132}" fill="none" stroke="${g}" stroke-width="1.5" opacity="0.55"/>`;
      for (const [x, y] of [[92, 92], [W - 92, 92], [92, H - 92], [W - 92, H - 92]]) {
        s += fleuron(x, y, 44, g, 0.9);
      }

      // title, mirrored
      s += mirrored(
        text(isW ? W_TITLE : TITLE, CX, 236, { font: S.font, size: isW ? 66 : 47, fill: g, spacing: isW ? 14 : 3.5, weight: 600 }) +
        `<line x1="140" y1="268" x2="310" y2="268" stroke="${g}" stroke-width="1.8" opacity="0.8"/>` +
        `<line x1="390" y1="268" x2="560" y2="268" stroke="${g}" stroke-width="1.8" opacity="0.8"/>` +
        fleuron(CX, 268, 32, g, 1) +
        text(SUBTITLE, CX, 308, { font: S.font, size: 19, fill: S.ink, spacing: 5.5, opacity: 0.8 })
      );

      // medallion
      s += `<circle cx="${CX}" cy="${CY}" r="214" fill="#2a0c15" opacity="0.6"/>`;
      s += `<circle cx="${CX}" cy="${CY}" r="214" fill="none" stroke="${g}" stroke-width="4.5"/>`;
      s += `<circle cx="${CX}" cy="${CY}" r="196" fill="none" stroke="${g}" stroke-width="1.4" opacity="0.6"/>`;
      // rope of beads around the medallion
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        s += `<circle cx="${r(CX + Math.cos(a) * 228)}" cy="${r(CY + Math.sin(a) * 228)}" r="3.4" fill="${g}" opacity="0.75"/>`;
      }
      if (isW) s += whisperMotif(250, g, '#2a0c15');
      else {
        s += ring(150, 78, g, 0.9);
        s += crown(CX, CY, 140, g, 1);
      }
      return doc(s, { bleed, print: printOn, defs: S.defs, guides: guidesOn });
    },

    face(card, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.heraldic, ink = INK[card.suit];
      return faceCommon(card, { bleed, guides: guidesOn, print: printOn }, {
        style: S, defs: S.defs, groundTint: 0.8,
        frame:
          `<rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${ink}" stroke-width="4.5" opacity="0.6"/>` +
          `<rect x="58" y="58" width="${W - 116}" height="${H - 116}" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.34"/>` +
          [[78, 78], [W - 78, 78], [78, H - 78], [W - 78, H - 78]]
            .map(([x, y]) => fleuron(x, y, 30, ink, 0.4)).join(''),
        centre:
          `<ellipse cx="${CX}" cy="540" rx="196" ry="216" fill="none" stroke="${ink}" stroke-width="2.6" opacity="0.42"/>` +
          `<ellipse cx="${CX}" cy="540" rx="182" ry="202" fill="none" stroke="${ink}" stroke-width="1" opacity="0.28"/>` +
          fleuron(CX, 324, 26, ink, 0.42) + fleuron(CX, 756, 26, ink, 0.42)
      });
    }
  },

  // ------------------------------------------------------------ midnight ---
  midnight: {
    back(kind, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.midnight, g = S.gold, isW = kind === 'whisper';
      let s = sheet('#0c0f28', bleed) + sheet('url(#m-bg)', bleed);
      s += `<circle cx="${CX}" cy="${CY}" r="430" fill="url(#m-glow)"/>`;

      const star = (x, y, rad, op) =>
        `<path d="M${r(x)} ${r(y - rad * 2.7)} L${r(x + rad * 0.6)} ${r(y - rad * 0.6)} L${r(x + rad * 2.7)} ${r(y)} ` +
        `L${r(x + rad * 0.6)} ${r(y + rad * 0.6)} L${r(x)} ${r(y + rad * 2.7)} L${r(x - rad * 0.6)} ${r(y + rad * 0.6)} ` +
        `L${r(x - rad * 2.7)} ${r(y)} L${r(x - rad * 0.6)} ${r(y - rad * 0.6)} Z" fill="${g}" opacity="${op}"/>`;
      const stars = [[112, 148, 7], [236, 100, 4.2], [592, 170, 6], [500, 108, 3.4],
      [96, 322, 4.4], [608, 352, 4.6], [156, 462, 3.2], [548, 494, 3.4],
      [86, 214, 3], [618, 246, 3.4], [304, 132, 3.2], [424, 178, 4.4],
      [166, 246, 2.6], [536, 288, 2.6]];
      for (const [x, y, rad] of stars) { s += star(x, y, rad, 0.85) + star(W - x, H - y, rad, 0.85); }

      s += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="none" stroke="${g}" stroke-width="3" opacity="0.9"/>`;
      s += `<rect x="64" y="64" width="${W - 128}" height="${H - 128}" fill="none" stroke="${g}" stroke-width="1" opacity="0.42"/>`;

      const moon = (x, y, rad, f) => {
        let out = `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rad)}" fill="none" stroke="${g}" stroke-width="1.7" opacity="0.8"/>`;
        if (f > 0.02) out += `<path d="M${r(x)} ${r(y - rad)} A ${r(rad)} ${r(rad)} 0 0 1 ${r(x)} ${r(y + rad)} ` +
          `A ${r(rad * (1 - 2 * f))} ${r(rad)} 0 0 ${f > 0.5 ? 1 : 0} ${r(x)} ${r(y - rad)} Z" fill="${g}" opacity="0.85"/>`;
        return out;
      };
      [0.0, 0.34, 0.68, 1.0].forEach((f, i) => {
        const y = 408 + i * 128;
        s += moon(96, y, 16, f) + moon(W - 96, H - y, 16, f);
      });

      s += mirrored(
        text(isW ? W_TITLE : TITLE, CX, 250, { font: S.font, size: isW ? 62 : 45, fill: g, spacing: isW ? 14 : 3, weight: 600 }) +
        text(SUBTITLE, CX, 294, { font: S.font, size: 18, fill: S.ink, spacing: 5.5, opacity: 0.7 })
      );

      s += `<circle cx="${CX}" cy="${CY}" r="200" fill="#0e1231" opacity="0.78"/>`;
      s += `<circle cx="${CX}" cy="${CY}" r="200" fill="none" stroke="${g}" stroke-width="2.8"/>`;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2, long = i % 4 === 0;
        const r1 = 208, r2 = long ? 244 : 224;
        s += `<line x1="${r(CX + Math.cos(a) * r1)}" y1="${r(CY + Math.sin(a) * r1)}" ` +
          `x2="${r(CX + Math.cos(a) * r2)}" y2="${r(CY + Math.sin(a) * r2)}" stroke="${g}" ` +
          `stroke-width="${long ? 3.6 : 1.8}" opacity="0.82"/>`;
      }
      if (isW) s += whisperMotif(240, g, '#0e1231');
      else { s += ring(142, 72, g, 0.9) + crown(CX, CY, 132, g, 1); }
      return doc(s, { bleed, print: printOn, defs: S.defs, guides: guidesOn });
    },

    face(card, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.midnight, ink = INK[card.suit];
      let rays = '';
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2, long = i % 4 === 0;
        rays += `<line x1="${r(CX + Math.cos(a) * 200)}" y1="${r(540 + Math.sin(a) * 200)}" ` +
          `x2="${r(CX + Math.cos(a) * (long ? 226 : 212))}" y2="${r(540 + Math.sin(a) * (long ? 226 : 212))}" ` +
          `stroke="${ink}" stroke-width="${long ? 3 : 1.6}" opacity="0.4"/>`;
      }
      return faceCommon(card, { bleed, guides: guidesOn, print: printOn }, {
        style: S, defs: S.defs, groundTint: 0.72,
        frame:
          `<rect x="44" y="44" width="${W - 88}" height="${H - 88}" fill="none" stroke="${ink}" stroke-width="3" opacity="0.55"/>` +
          `<rect x="58" y="58" width="${W - 116}" height="${H - 116}" fill="none" stroke="${ink}" stroke-width="1" opacity="0.3"/>`,
        centre: `<circle cx="${CX}" cy="540" r="192" fill="none" stroke="${ink}" stroke-width="2.4" opacity="0.42"/>` + rays
      });
    }
  },

  // ---------------------------------------------------------------- deco ---
  deco: {
    back(kind, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.deco, g = S.gold, isW = kind === 'whisper';
      let s = sheet('#141414', bleed) + sheet('url(#d-bg)', bleed);

      // full sunburst from the centre, clipped by the card edge
      for (let i = 0; i < 48; i++) {
        const a0 = (i / 48) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / 96;
        const R0 = 210, R1 = 1000;
        s += `<path d="M${r(CX + Math.cos(a0) * R0)} ${r(CY + Math.sin(a0) * R0)} ` +
          `L${r(CX + Math.cos(a0) * R1)} ${r(CY + Math.sin(a0) * R1)} ` +
          `L${r(CX + Math.cos(a1) * R1)} ${r(CY + Math.sin(a1) * R1)} ` +
          `L${r(CX + Math.cos(a1) * R0)} ${r(CY + Math.sin(a1) * R0)} Z" fill="${g}" opacity="0.075"/>`;
      }

      s += `<rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${g}" stroke-width="5"/>`;
      s += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="none" stroke="${g}" stroke-width="1.6" opacity="0.55"/>`;
      const notch = (x, y, sx, sy) =>
        `<path d="M${r(x)} ${r(y + sy * 62)} L${r(x)} ${r(y)} L${r(x + sx * 62)} ${r(y)}" fill="none" stroke="${g}" stroke-width="10"/>`;
      s += notch(30, 30, 1, 1) + notch(W - 30, 30, -1, 1) + notch(30, H - 30, 1, -1) + notch(W - 30, H - 30, -1, -1);

      s += mirrored(
        text(isW ? W_TITLE : TITLE, CX, 234, { font: S.font, size: isW ? 54 : 38, fill: g, spacing: isW ? 16 : 5, weight: 600 }) +
        `<line x1="150" y1="266" x2="322" y2="266" stroke="${g}" stroke-width="2.6"/>` +
        `<line x1="378" y1="266" x2="550" y2="266" stroke="${g}" stroke-width="2.6"/>` +
        `<rect x="${CX - 13}" y="253" width="26" height="26" transform="rotate(45 ${CX} 266)" fill="${g}"/>` +
        text(SUBTITLE, CX, 306, { font: S.font, size: 16, fill: S.ink, spacing: 6, opacity: 0.72 })
      );

      // stepped lozenge stack
      s += `<g transform="rotate(45 ${CX} ${CY})">` +
        `<rect x="${CX - 152}" y="${CY - 152}" width="304" height="304" fill="#17150f"/>` +
        `<rect x="${CX - 152}" y="${CY - 152}" width="304" height="304" fill="none" stroke="${g}" stroke-width="5"/>` +
        `<rect x="${CX - 132}" y="${CY - 132}" width="264" height="264" fill="none" stroke="${g}" stroke-width="1.6" opacity="0.6"/>` +
        `</g>`;
      s += `<circle cx="${CX}" cy="${CY}" r="196" fill="none" stroke="${g}" stroke-width="2" opacity="0.5"/>`;
      if (isW) s += whisperMotif(226, g, '#17150f');
      else { s += ring(136, 64, g, 0.9) + crown(CX, CY, 124, g, 1); }
      return doc(s, { bleed, print: printOn, defs: S.defs, guides: guidesOn });
    },

    face(card, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.deco, ink = INK[card.suit];
      return faceCommon(card, { bleed, guides: guidesOn, print: printOn }, {
        style: S, defs: S.defs, groundTint: 0.75,
        frame:
          `<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${ink}" stroke-width="5"/>` +
          `<rect x="46" y="46" width="${W - 92}" height="${H - 92}" fill="none" stroke="${ink}" stroke-width="1.6" opacity="0.45"/>` +
          [[26, 26, 1, 1], [W - 26, 26, -1, 1], [26, H - 26, 1, -1], [W - 26, H - 26, -1, -1]]
            .map(([x, y, sx, sy]) => `<path d="M${x} ${y + sy * 52} L${x} ${y} L${x + sx * 52} ${y}" fill="none" stroke="${ink}" stroke-width="10"/>`).join(''),
        centre:
          `<g transform="rotate(45 ${CX} 540)">` +
          `<rect x="${CX - 148}" y="${540 - 148}" width="296" height="296" fill="none" stroke="${ink}" stroke-width="3" opacity="0.45"/>` +
          `<rect x="${CX - 128}" y="${540 - 128}" width="256" height="256" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.3"/></g>`
      });
    }
  },

  // ------------------------------------------------------------- woodcut ---
  woodcut: {
    back(kind, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.woodcut, ink = '#1d1712', pale = '#eee2c6', isW = kind === 'whisper';
      let s = sheet('#e2d3ad', bleed) + sheet('url(#w-bg)', bleed) + sheet('url(#w-grain)', bleed);

      s += `<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${ink}" stroke-width="16"/>`;
      s += `<rect x="56" y="56" width="${W - 112}" height="${H - 112}" fill="none" stroke="${ink}" stroke-width="4"/>`;
      const hatchCorner = (x, y, sx, sy) => {
        let out = '';
        for (let i = 0; i < 8; i++) {
          const d = 14 + i * 10;
          out += `<line x1="${r(x + sx * d)}" y1="${r(y)}" x2="${r(x)}" y2="${r(y + sy * d)}" stroke="${ink}" stroke-width="${r(3.8 - i * 0.34)}"/>`;
        }
        return out;
      };
      s += hatchCorner(72, 72, 1, 1) + hatchCorner(W - 72, 72, -1, 1) +
        hatchCorner(72, H - 72, 1, -1) + hatchCorner(W - 72, H - 72, -1, -1);

      s += mirrored(
        text(isW ? W_TITLE : TITLE, CX, 244, { font: S.font, size: isW ? 64 : 46, fill: ink, spacing: isW ? 12 : 1.5, weight: 700 }) +
        `<rect x="140" y="268" width="420" height="6" fill="${ink}"/>` +
        `<rect x="140" y="282" width="420" height="2.4" fill="${ink}"/>` +
        text(SUBTITLE, CX, 320, { font: S.font, size: 18, fill: ink, spacing: 5, opacity: 0.85 })
      );

      // sunburst of cut rays behind the disc
      for (let i = 0; i < 24; i++) {
        const a0 = (i / 24) * Math.PI * 2 + 0.06, a1 = a0 + (Math.PI * 2) / 60;
        const R0 = 214, R1 = 262;
        s += `<path d="M${r(CX + Math.cos(a0) * R0)} ${r(CY + Math.sin(a0) * R0)} ` +
          `L${r(CX + Math.cos(a0) * R1)} ${r(CY + Math.sin(a0) * R1)} ` +
          `L${r(CX + Math.cos(a1) * R1)} ${r(CY + Math.sin(a1) * R1)} ` +
          `L${r(CX + Math.cos(a1) * R0)} ${r(CY + Math.sin(a1) * R0)} Z" fill="${ink}" opacity="0.9"/>`;
      }
      s += `<circle cx="${CX}" cy="${CY}" r="208" fill="${ink}"/>`;
      s += `<circle cx="${CX}" cy="${CY}" r="186" fill="none" stroke="${pale}" stroke-width="3.4"/>`;
      if (isW) s += whisperMotif(238, pale, ink);
      else { s += ring(142, 74, pale, 1) + crown(CX, CY, 132, pale, 1); }
      return doc(s, { bleed, print: printOn, defs: S.defs, guides: guidesOn });
    },

    face(card, opt) {
      const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
      const S = STYLES.woodcut, ink = INK[card.suit];
      return faceCommon(card, { bleed, guides: guidesOn, print: printOn }, {
        style: S, defs: S.defs, parchment: true, groundTint: 0.5, reverseCentre: true,
        frame:
          `<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${ink}" stroke-width="13"/>` +
          `<rect x="54" y="54" width="${W - 108}" height="${H - 108}" fill="none" stroke="${ink}" stroke-width="3"/>`,
        centre: `<circle cx="${CX}" cy="540" r="196" fill="${ink}"/>` +
          `<circle cx="${CX}" cy="540" r="176" fill="none" stroke="#eee2c6" stroke-width="3"/>`
      });
    }
  }
};

// ------------------------------------------------------------- card faces ---
/** card = { suit, rank } */
function faceCommon(card, opt, cfg) {
  const { bleed = 0, guides: guidesOn = false, print: printOn = false } = opt || {};
  const S = cfg.style;
  const ink = INK[card.suit];
  const tint = FACE[card.suit];
  let s = sheet(cfg.parchment ? '#eee2c6' : '#f6efe1', bleed);
  s += sheet(tint, bleed, cfg.groundTint);
  // The kind's court, printed into the stock. The plate's own highlight is
  // this card's ground colour, so it replaces the two sheets above rather
  // than darkening them, and nothing here can approach the weight of the ink.
  if (!cfg.parchment && cfg.watermark !== false) s += WM.plate(card.suit, bleed);
  if (cfg.parchment) s += sheet('url(#w-grain)', bleed);
  s += cfg.frame;
  s += cfg.centre || '';
  s += emblem(card.suit, CX, 540, 262, cfg.reverseCentre ? '#eee2c6' : ink, cfg.reverseCentre ? 1 : 0.95);

  // corner indices, top-left and bottom-right
  const corner =
    text(String(card.rank), 100, 158, { font: S.font, size: 92, fill: ink, weight: 700 }) +
    emblem(card.suit, 100, 224, 64, ink, 1);
  s += `<g>${corner}</g><g transform="rotate(180 ${CX} ${CY})">${corner}</g>`;

  s += text(ROLE[card.suit].toUpperCase(), CX, 858, { font: S.font, size: 42, fill: ink, spacing: 7, weight: 600 });
  s += `<line x1="212" y1="892" x2="488" y2="892" stroke="${ink}" stroke-width="2" opacity="0.4"/>`;
  s += text(`ERRAND VALUE ${PLEDGE[card.suit]}`, CX, 932, { font: S.font, size: 24, fill: ink, spacing: 3.4, opacity: 0.72 });
  return doc(s, { bleed, print: printOn, defs: cfg.defs, guides: guidesOn });
}

module.exports = { BUILD, W, H, CX, CY, FACE, INK, TITLE, SUBTITLE, doc, sheet, mirrored, ring, whisperMotif, faceCommon };
