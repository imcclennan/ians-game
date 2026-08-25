/*
 * art.js — vector art for The Fools' Court card deck.
 * All geometry in tenths of a millimetre: a 70x120mm card is 700 x 1200 units.
 */

// ---------------------------------------------------------------- emblems ---
// Lifted from the game's js/cards.js so the printed marks match the screen.
const EMBLEM = {
  S: "<path d='M50 6 L58 32 L58 60 L42 60 L42 32 Z'/>" +
     "<rect x='27' y='60' width='46' height='8' rx='2'/>" +
     "<rect x='45' y='68' width='10' height='18'/>" +
     "<circle cx='50' cy='90' r='7'/>",
  H: "<circle cx='50' cy='26' r='14'/><circle cx='72' cy='42' r='14'/>" +
     "<circle cx='64' cy='66' r='14'/><circle cx='36' cy='66' r='14'/>" +
     "<circle cx='28' cy='42' r='14'/><circle cx='50' cy='48' r='13'/>" +
     "<rect x='46' y='66' width='8' height='28'/>",
  D: "<rect x='46' y='14' width='8' height='66'/>" +
     "<rect x='16' y='24' width='68' height='7' rx='3'/>" +
     "<path d='M6 32 L34 32 L20 54 Z'/><path d='M66 32 L94 32 L80 54 Z'/>" +
     "<rect x='28' y='80' width='44' height='8' rx='3'/>",
  // The Fool's cap and bells, redrawn for print: three drooping horns, each
  // belled, over a banded cap. Reads at index size as well as at full size.
  C: "<path d='M50 44 C31 44 19 56 19 72 L19 84 L81 84 L81 72 C81 56 69 44 50 44 Z'/>" +
     "<rect x='21' y='20' width='9' height='34' rx='4' transform='rotate(32 25 37)'/>" +
     "<rect x='70' y='20' width='9' height='34' rx='4' transform='rotate(-32 75 37)'/>" +
     "<rect x='45' y='12' width='10' height='34' rx='5'/>" +
     "<circle cx='12' cy='14' r='10'/><circle cx='88' cy='14' r='10'/>" +
     "<circle cx='50' cy='8' r='10'/>"
};

const SUITS = ['C', 'D', 'H', 'S'];
const ROLE = { C: 'Fool', D: 'Merchant', H: 'Lover', S: 'Assassin' };
const ROLE_PLURAL = { C: 'Fools', D: 'Merchants', H: 'Lovers', S: 'Assassins' };
const PLEDGE = { C: 0, D: 1, H: 2, S: 3 };

/** An emblem drawn at (x,y) with the given width, in the given colour. */
function emblem(suit, x, y, size, fill, opacity) {
  const s = size / 100;
  return `<g transform="translate(${r(x - size / 2)},${r(y - size / 2)}) scale(${r(s, 5)})" ` +
    `fill="${fill}" stroke="${fill}" stroke-width="0" stroke-linecap="round" ` +
    `stroke-linejoin="round"${opacity != null ? ` opacity="${opacity}"` : ''}>${EMBLEM[suit]}</g>`;
}

// A heraldic crown, drawn in a 100 x 74 box with its top-left at the origin.
const CROWN =
  "<path d='M9 56 L13 20 L28 40 L38 11 L50 35 L62 11 L72 40 L87 20 L91 56 Z'/>" +
  "<circle cx='13' cy='16' r='6'/><circle cx='38' cy='7' r='6'/>" +
  "<circle cx='62' cy='7' r='6'/><circle cx='87' cy='16' r='6'/>" +
  "<rect x='7' y='56' width='86' height='12' rx='4'/>";

function crown(x, y, size, fill, opacity) {
  const s = size / 100;
  return `<g transform="translate(${r(x - size / 2)},${r(y - size * 0.34)}) scale(${r(s, 5)})" ` +
    `fill="${fill}"${opacity != null ? ` opacity="${opacity}"` : ''}>${CROWN}</g>`;
}

// A small four-lobed fleuron for corners and rules.
function fleuron(x, y, size, fill, opacity) {
  const s = size / 100;
  const d = "<path d='M50 8 C58 28 72 42 92 50 C72 58 58 72 50 92 " +
    "C42 72 28 58 8 50 C28 42 42 28 50 8 Z'/><circle cx='50' cy='50' r='9'/>";
  return `<g transform="translate(${r(x - size / 2)},${r(y - size / 2)}) scale(${r(s, 5)})" ` +
    `fill="${fill}"${opacity != null ? ` opacity="${opacity}"` : ''}>${d}</g>`;
}

function r(n, p) { return Number(n.toFixed(p == null ? 2 : p)); }

/** Text helper. */
function text(str, x, y, opts) {
  const o = opts || {};
  const attrs = [
    `x="${r(x)}"`, `y="${r(y)}"`,
    `font-family="${o.font || 'serif'}"`,
    `font-size="${r(o.size || 30)}"`,
    `fill="${o.fill || '#000'}"`,
    `text-anchor="${o.anchor || 'middle'}"`,
    o.weight ? `font-weight="${o.weight}"` : '',
    o.spacing ? `letter-spacing="${r(o.spacing)}"` : '',
    o.style ? `font-style="${o.style}"` : '',
    o.opacity != null ? `opacity="${o.opacity}"` : ''
  ].filter(Boolean).join(' ');
  return `<text ${attrs}>${esc(str)}</text>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Wrap a string to a given number of characters per line (rough but adequate). */
function wrap(str, perLine) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > perLine) { lines.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) lines.push(line);
  return lines;
}

function block(lines, x, y, lead, opts) {
  return lines.map((l, i) => text(l, x, y + i * lead, opts)).join('');
}

// ----------------------------------------------------------------- styles ---
// Each style supplies a palette and the three layers that make a card:
// ground (full-bleed background), frame (border treatment) and the type.

const STYLES = {

  heraldic: {
    name: 'Heraldic engraving',
    blurb: 'Oxblood ground, engraved gold filigree, a crowned cartouche. Traditional and courtly.',
    font: "'Lora', 'TeX Gyre Pagella', serif",
    gold: '#d6ad50',
    ink: '#f3ead7',
    faceGround: '#f3ead7',
    defs: `
      <radialGradient id="h-bg" cx="50%" cy="42%" r="78%">
        <stop offset="0%" stop-color="#63202f"/>
        <stop offset="55%" stop-color="#45152340"/>
        <stop offset="100%" stop-color="#280b13"/>
      </radialGradient>
      <pattern id="h-hatch" width="18" height="18" patternUnits="userSpaceOnUse"
               patternTransform="rotate(45)">
        <rect width="18" height="18" fill="none"/>
        <line x1="0" y1="0" x2="0" y2="18" stroke="#d6ada0" stroke-opacity="0.10" stroke-width="2.4"/>
        <line x1="9" y1="0" x2="9" y2="18" stroke="#000000" stroke-opacity="0.16" stroke-width="2.4"/>
      </pattern>`
  },

  midnight: {
    name: 'Midnight tarot',
    blurb: 'Indigo night, gold stars and moon phases, a radiant crown. Mystical, tarot-traditional.',
    font: "'Lora', 'TeX Gyre Pagella', serif",
    gold: '#e3c169',
    ink: '#eae4f5',
    faceGround: '#f4f0e6',
    defs: `
      <radialGradient id="m-bg" cx="50%" cy="50%" r="72%">
        <stop offset="0%" stop-color="#2b3675"/>
        <stop offset="52%" stop-color="#1a2050"/>
        <stop offset="100%" stop-color="#0c0f28"/>
      </radialGradient>
      <radialGradient id="m-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e3c169" stop-opacity="0.42"/>
        <stop offset="70%" stop-color="#e3c169" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#e3c169" stop-opacity="0"/>
      </radialGradient>`
  },

  deco: {
    name: 'Art deco court',
    blurb: 'Black and gold, stepped geometry and sunburst fans. Modern, graphic, high contrast.',
    font: "'Poppins', 'Carlito', sans-serif",
    gold: '#d8b25c',
    ink: '#f5f1e8',
    faceGround: '#f5f1e8',
    defs: `
      <linearGradient id="d-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#141414"/>
        <stop offset="50%" stop-color="#22201c"/>
        <stop offset="100%" stop-color="#141414"/>
      </linearGradient>`
  },

  woodcut: {
    name: 'Woodcut broadside',
    blurb: 'Parchment and heavy black line, cut as a village print shop would. Bold and tactile.',
    font: "'Lora', 'Utopia', serif",
    gold: '#1d1712',
    ink: '#1d1712',
    faceGround: '#eee2c6',
    defs: `
      <linearGradient id="w-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e9dcbc"/>
        <stop offset="50%" stop-color="#e2d3ad"/>
        <stop offset="100%" stop-color="#d9c79c"/>
      </linearGradient>
      <pattern id="w-grain" width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="none"/>
        <circle cx="1.5" cy="2" r="0.8" fill="#6b5a3c" fill-opacity="0.16"/>
        <circle cx="5" cy="5.5" r="0.6" fill="#6b5a3c" fill-opacity="0.12"/>
      </pattern>`
  }
};

module.exports = {
  CROWN_PATH: CROWN,
  EMBLEM, SUITS, ROLE, ROLE_PLURAL, PLEDGE, STYLES,
  emblem, crown, fleuron, text, block, wrap, esc, r
};
