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
  // Redrawn from newmarks.py, which is where the geometry is worked out: the
  // Fool's arms are a tapered band along a quadratic, the Merchant's chains are
  // thin filled bars, the Lover's hearts are one path moved and scaled. Edit
  // there and re-emit rather than editing these coordinates by hand.
  //
  // Everything is filled, nothing stroked. emblem() wraps a mark in a group
  // carrying fill and nothing else, so a stroked path would print black
  // wherever a kind sets its mark in its own ink.
  H: "<path d='M26.5 95.8 L72.5 33.8 L67.5 30.2 L21.5 92.2 Z'/>" +
     "<path d='M78.5 92.2 L32.5 30.2 L27.5 33.8 L73.5 95.8 Z'/>" +
     "<path d='M60.4 45.0 C57.4 28.7 57.3 20.6 60.7 16.0 C64.1 11.5 69.2 11.3 73.1 14.2 C76.1 16.3 77.1 19.7 76.8 22.9 C79.7 21.6 83.2 21.7 86.1 23.8 C90.0 26.7 91.4 31.7 88.0 36.3 C84.6 40.8 76.9 43.1 60.4 45.0 Z'/>" +
     "<path d='M39.6 45.0 C23.1 43.1 15.4 40.8 12.0 36.3 C8.6 31.7 10.0 26.7 13.9 23.8 C16.8 21.7 20.3 21.6 23.2 22.9 C22.9 19.7 23.9 16.3 26.9 14.2 C30.8 11.3 35.9 11.5 39.3 16.0 C42.7 20.6 42.6 28.7 39.6 45.0 Z'/>",
  D: "<path d='M46 14 L54 14 L54 76 L46 76 Z'/><path d='M14 22 L86 22 L86 29 L14 29 Z'/>" +
     "<circle cx='50' cy='13' r='6'/><path d='M18.9 28.3 L2.9 55.3 L5.1 56.7 L21.1 29.7 Z'/>" +
     "<path d='M18.9 29.7 L34.9 56.7 L37.1 55.3 L21.1 28.3 Z'/>" +
     "<path d='M4 56 A16 16 0 0 0 36 56 Z'/>" +
     "<path d='M78.9 28.3 L62.9 55.3 L65.1 56.7 L81.1 29.7 Z'/>" +
     "<path d='M78.9 29.7 L94.9 56.7 L97.1 55.3 L81.1 28.3 Z'/>" +
     "<path d='M64 56 A16 16 0 0 0 96 56 Z'/><path d='M34 84 C34 75 66 75 66 84 Z'/>" +
     "<path d='M24 84 L76 84 L76 92 L24 92 Z'/>",
  C: "<path d='M50 44 C31 44 19 56 19 72 L19 84 L81 84 L81 72 C81 56 69 44 50 44 Z'/>" +
     "<path d='M58.5 42.8 L55.7 39.1 L52.8 35.6 L49.8 32.3 L46.8 29.3 L43.8 26.5 L40.7 24.0 L37.6 21.8 L34.5 19.8 L31.4 18.1 L28.2 16.7 L25.1 15.5 L21.9 14.7 L18.8 14.1 L15.8 13.9 L14.2 20.1 L16.6 21.3 L18.8 22.5 L21.0 24.0 L23.0 25.6 L25.0 27.5 L26.9 29.5 L28.9 31.7 L30.7 34.1 L32.6 36.8 L34.4 39.6 L36.2 42.6 L37.9 45.9 L39.7 49.4 L41.5 53.2 Z'/>" +
     "<path d='M58.5 53.2 L60.3 49.4 L62.1 45.9 L63.8 42.6 L65.6 39.6 L67.4 36.8 L69.3 34.1 L71.1 31.7 L73.1 29.5 L75.0 27.5 L77.0 25.6 L79.0 24.0 L81.2 22.5 L83.4 21.3 L85.8 20.1 L84.2 13.9 L81.2 14.1 L78.1 14.7 L74.9 15.5 L71.8 16.7 L68.6 18.1 L65.5 19.8 L62.4 21.8 L59.3 24.0 L56.2 26.5 L53.2 29.3 L50.2 32.3 L47.2 35.6 L44.3 39.1 L41.5 42.8 Z'/>" +
     "<path d='M45 17 L55 17 L55 47 L45 47 Z'/><circle cx='50' cy='11' r='10'/>" +
     "<circle cx='13' cy='14' r='10'/><circle cx='87' cy='14' r='10'/>",
};

const SUITS = ['C', 'D', 'H', 'S'];
const ROLE = { C: 'Fool', D: 'Merchant', H: 'Lover', S: 'Assassin' };
const ROLE_PLURAL = { C: 'Fools', D: 'Merchants', H: 'Lovers', S: 'Assassins' };

// What each kind promises on an errand. Taken from the game rather than typed:
// this table said the Fool promised 0 for an entire edition, when the rules
// have it costing a promise (-1), and nothing here noticed.
require('../../js/cards.js');
const PLEDGE = globalThis.Cards.BID_VALUE;

/** A promise with a real minus sign where the kind costs one. */
function promised(value) {
  return value < 0 ? '\u2212' + Math.abs(value) : String(value);
}

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
  emblem, crown, fleuron, text, block, wrap, esc, r, promised
};
