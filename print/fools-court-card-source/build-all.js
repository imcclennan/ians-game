/*
 * build-all.js — renders every image PrinterStudio needs.
 *   60 deck faces + 1 deck back  (heraldic)
 *   15 Whisper faces + 1 Whisper back (midnight)
 *   2 sides of the quick reference card (heraldic, printed light)
 * Everything comes out 900 x 1500 px = 3" x 5" at 300 DPI, which is the
 * 2.75" x 4.75" tarot trim plus 1/8" bleed on every side.
 */
const fs = require('fs');
const path = require('path');
const { BUILD } = require('./cards');
const { whisperFace, refFront, refBack, page } = require('./text-cards');
const WHISPERS = require('./whispers-data');
const { renderAll } = require('./render');
const { ROLE } = require('./art');

const SUIT_ORDER = ['C', 'D', 'H', 'S'];
const OUT = path.join(__dirname, 'out', 'cards');

/** Put a bare SVG card on a 900x1500 page. */
function svgPage(svg) {
  return page(`<div class="art">${svg}</div>`, '');
}

function pad(n, w) { return String(n).padStart(w, '0'); }

function manifest(guides) {
  const items = [];
  const opt = { print: true, guides: !!guides };

  items.push({ name: 'back-deck', html: svgPage(BUILD.heraldic.back('deck', opt)) });
  items.push({ name: 'back-whisper', html: svgPage(BUILD.midnight.back('whisper', opt)) });

  let n = 0;
  for (const suit of SUIT_ORDER) {
    for (let rank = 1; rank <= 15; rank++) {
      n += 1;
      const card = { suit, rank: String(rank) };
      items.push({
        name: `deck-${pad(n, 2)}_${ROLE[suit]}-${pad(rank, 2)}`,
        html: svgPage(BUILD.heraldic.face(card, opt))
      });
    }
  }

  WHISPERS.forEach((w, i) => {
    items.push({
      name: `whisper-${pad(i + 1, 2)}_${w.burden ? 'BURDEN-' : ''}${w.name.replace(/[^A-Za-z]+/g, '-').replace(/^-|-$/g, '')}`,
      html: whisperFace(w, i + 1, WHISPERS.length)
    });
  });

  items.push({ name: 'reference-front', html: refFront() });
  items.push({ name: 'reference-back', html: refBack() });
  return items;
}

(async () => {
  const guides = process.argv.includes('--guides');
  const dir = guides ? OUT + '-guides' : OUT;
  fs.rmSync(dir, { recursive: true, force: true });
  const items = manifest(guides);
  console.log(`rendering ${items.length} cards to ${dir}`);
  await renderAll(items, dir);
  console.log('done');
})();
