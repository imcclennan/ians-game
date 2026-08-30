/*
 * watermark.js — the court, laid under the face of every card.
 *
 * One plate per kind, plus the monarch for the Whispers. Each is a duotone
 * whose highlight is that card's own stock colour, so the plate replaces the
 * ground rather than tinting it, and its darkest pigment still sits well
 * short of the ink printed over it. See watermarks/make-watermarks.py.
 *
 * Plates are embedded as data URIs because build-all renders each card from a
 * temp file in /tmp, where a relative path would not resolve.
 */
const fs = require('fs');
const path = require('path');
// The design box, from cards.js. Declared here rather than required, since
// cards.js requires this module and the cycle leaves W and H undefined.
const W = 700, H = 1200;

const DIR = path.join(__dirname, 'watermarks');
const NAME = { S: 'assassin', H: 'lover', D: 'merchant', C: 'fool' };
const cache = {};

function uri(plate) {
  if (!(plate in cache)) {
    const file = path.join(DIR, plate + '-watermark.jpg');
    cache[plate] = fs.existsSync(file)
      ? 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64')
      : null;
    if (!cache[plate]) console.warn(`watermark: no plate for "${plate}", card left plain`);
  }
  return cache[plate];
}

/**
 * A full-bleed plate, painted past the trim exactly as sheet() does so the
 * bleed area is covered. `slice` crops rather than distorts, which matters:
 * the plates are 3:5 and the bleed area is not.
 */
function plate(key, bleed) {
  const src = uri(NAME[key] || key);
  if (!src) return '';
  const m = (bleed || 0) + 60;
  return `<image href="${src}" x="${-m}" y="${-m}" ` +
    `width="${W + 2 * m}" height="${H + 2 * m}" ` +
    `preserveAspectRatio="xMidYMid slice"/>`;
}

module.exports = { plate, uri, NAME };
