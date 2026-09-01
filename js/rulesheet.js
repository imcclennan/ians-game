/*
 * rulesheet.js — the rules as boxed-game inserts: two leaves, each 8.5" x 5.5"
 * and printed on both sides, three columns a side.
 *
 *   out/rulesheet.html    sections 1-9: the game itself
 *   out/whispersheet.html section 9 and the Whispers rule in full
 *
 * This file is the layout and nothing else. The wording lives in rules.md and
 * whispers.md, which are meant to be edited; content.js parses them and fills
 * in every count and payout from the game. To change what the sheets say, edit
 * the .md files and run this again — see FORMAT.md.
 *
 * The split is not cosmetic. The Whispers are optional, and a table playing
 * without them should be able to leave their leaf in the box; a table using
 * them needs all 22 words legible rather than crushed into the last column of
 * a sheet that is already full.
 *
 * Section order and numbering follow js/rulebook.js so the printed sheets and
 * the app's Rules panel agree section for section: the game is 1-8 and the
 * Whispers are 9 and 10, on their own leaf. check-numbering.js compares the
 * two and also checks that sections 1-8 never mention the Whispers, because a
 * table whose insert sheet has gone missing must still have a whole game.
 *
 * Every number here is scored or counted by the game rather than typed: the
 * favour table, the worked examples, the deck's composition, the Whisper and
 * burden counts. Each of them has been wrong on a printed sheet at least once.
 */
const fs = require('fs');
const { EMBLEM } = require('./art');
const WHISPERS = require('./whispers-data');

// The favour table and its worked examples are scored by the game itself. Every
// one of these numbers has been wrong on a printed sheet at least once.
require('../../js/cards.js');
require('../../js/rules.js');
const { Rules, Cards } = globalThis;

/** A promise with a real minus sign where the kind costs one. */
const promised = (n) => (n < 0 ? '&minus;' + Math.abs(n) : String(n));

/** How a kind is arranged: its ranks, and where it is struck more than once. */
const composition = (suit) => Cards.ranksOf(suit).map((rank) => {
  const n = Cards.copiesOf(suit, rank);
  return n === 1 ? rank : `<b>${n}&times;</b>${rank}`;
}).join(', ');

const BURDENS = WHISPERS.filter((w) => w.burden).length;
const BOONS = WHISPERS.length - BURDENS;

const favour = (n) => (n < 0 ? '&minus;' + Math.abs(n) : '+' + n);
const example = (bid, won) =>
  `<div>Pledged ${bid}, won ${won}</div><div class="r">${favour(Rules.scoreHand(bid, won, false))}</div>`;
const foolsErrandExample = (won) =>
  `<div>${Rules.FOOLS_ERRAND_SIZE} Fools out, won ${won}</div>` +
  `<div class="r">${favour(Rules.scoreHand(0, won, true))}</div>`;

const OX = '#4a1524', GOLD = '#8d6a2a', INK = '#20161a', DIM = '#5d4a4f';
const AGENT_INK = { C: '#492851', D: '#684d0e', H: '#7c241e', S: '#1e2530' };

const em = (suit, px, fill) =>
  `<svg class="em" viewBox="0 0 100 100" width="${px}" height="${px}" fill="${fill}" stroke="${fill}" ` +
  `stroke-width="0" stroke-linecap="round" stroke-linejoin="round">${EMBLEM[suit]}</svg>`;

const CROWN = "<path d='M9 56 L13 20 L28 40 L38 11 L50 35 L62 11 L72 40 L87 20 L91 56 Z'/>" +
  "<circle cx='13' cy='16' r='6'/><circle cx='38' cy='7' r='6'/><circle cx='62' cy='7' r='6'/>" +
  "<circle cx='87' cy='16' r='6'/><rect x='7' y='56' width='86' height='12' rx='4'/>";

const agent = (suit, name) =>
  `<span class="ag">${em(suit, 10, AGENT_INK[suit])}<b>${name}</b></span>`;

const SECTIONS = [
  { n: 1, id: 'overview', title: 'Overview' },
  { n: 2, id: 'deck', title: 'The deck' },
  { n: 3, id: 'night', title: 'Seating and the course of a night' },
  { n: 4, id: 'whispers', title: 'The Whispers', optional: true },
  { n: 5, id: 'pledge', title: 'Making a pledge' },
  { n: 6, id: 'play', title: 'Playing the night' },
  { n: 7, id: 'favour', title: 'Winning favour' },
  { n: 8, id: 'sway', title: 'Who holds sway' },
  { n: 9, id: 'season', title: 'Winning the season' },
  { n: 10, id: 'whisperlist', title: 'The Whispers in full', optional: true }
];

// The rules leaf is set from one scale, as the Whispers leaf is. The Whispers
// section left this leaf and took about a column with it, so the type was
// raised rather than leave the sheet 70% full. This fails at 1.11.
const RSCALE = 1.10;
const rpx = (n) => `${(n * RSCALE).toFixed(2)}px`;

const CSS = `
@page { size: 8.5in 5.5in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: 'Lora', Georgia, serif; color: ${INK}; }
.side { width: 8.5in; height: 5.5in; padding: 0.3in 0.34in 0.26in; position: relative;
        page-break-after: always; overflow: hidden; }
.side:last-child { page-break-after: auto; }
.cols { column-count: 3; column-gap: 0.2in; column-fill: auto; height: 4.34in; }
.side.s2 .cols { height: 4.62in; }
.side.s2 { padding-top: 0.24in; }

/* heads */
.mast { display: flex; align-items: center; gap: 9px; border-bottom: 2px solid ${OX};
        padding-bottom: 5px; margin-bottom: 3px; }
.mast h1 { margin: 0; font-size: 18px; font-weight: 600; color: ${OX}; line-height: 1.02; }
.mast .sub { margin: 1px 0 0; font-size: 8.6px; color: ${DIM}; font-style: italic; }
.mast .meta { margin-left: auto; text-align: right; font-family: 'Carlito', system-ui, sans-serif;
              font-size: 7.2px; letter-spacing: .12em; text-transform: uppercase; color: ${GOLD};
              line-height: 1.55; }
.s2head { display: flex; align-items: baseline; border-bottom: 1.4px solid ${OX};
          padding-bottom: 4px; margin-bottom: 4px; }
.s2head b { font-size: 12px; color: ${OX}; font-weight: 600; }
.s2head span { margin-left: auto; font-family: 'Carlito', system-ui, sans-serif; font-size: 7.2px;
               letter-spacing: .12em; text-transform: uppercase; color: ${GOLD}; }
.runner { position: absolute; left: 0.34in; right: 0.34in; bottom: 0.11in; display: flex;
          border-top: 1px solid #e6d9c2; padding-top: 3px;
          font-family: 'Carlito', system-ui, sans-serif; font-size: 6.8px; letter-spacing: .11em;
          text-transform: uppercase; color: ${GOLD}; }
.runner span:last-child { margin-left: auto; }

/* type */
h2 { font-size: ${rpx(9.8)}; margin: ${rpx(6)} 0 ${rpx(2)}; color: ${OX}; font-weight: 700; line-height: 1.16;
     break-after: avoid; display: flex; align-items: baseline; gap: 4px; }
h2 .n { font-family: 'Carlito', system-ui, sans-serif; font-size: ${rpx(7.6)}; color: ${GOLD}; }
h2 .opt { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.2px; letter-spacing: .09em;
          text-transform: uppercase; color: ${GOLD}; border: 1px solid #e6d5b6; border-radius: 2px;
          padding: 0 3px; }
p { margin: 0 0 ${rpx(2.6)}; font-size: ${rpx(8.5)}; line-height: 1.32; text-align: justify; hyphens: auto; }
p.first { margin-top: 0; }
.note { font-size: ${rpx(7.9)}; color: ${DIM}; font-style: italic; line-height: 1.32; }
ol, ul { margin: 0 0 ${rpx(2.6)}; padding-left: ${rpx(10)}; font-size: ${rpx(8.5)}; line-height: 1.3; }
li { margin-bottom: ${rpx(1.4)}; }
b, strong { font-weight: 700; }
.ag { white-space: nowrap; }
.ag .em { vertical-align: -0.13em; margin-right: 1.5px; }

/* contents */
.toc { border: 1px solid #e6d9c2; border-left: 2.5px solid ${GOLD}; padding: 5px 7px 6px;
       margin: 0 0 5px; break-inside: avoid; }
.toc .lbl { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px; letter-spacing: .14em;
            text-transform: uppercase; color: ${GOLD}; margin-bottom: 3px; }
.toc ol { list-style: none; padding: 0; margin: 0; font-size: ${rpx(8)}; line-height: 1.36; }
.toc li { display: flex; gap: 5px; margin: 0; }
.toc li i { font-style: normal; color: ${GOLD}; min-width: 10px; text-align: right;
            font-variant-numeric: tabular-nums; }
.toc li s { text-decoration: none; color: ${DIM}; margin-left: auto; font-size: 7.2px;
            font-family: 'Carlito', system-ui, sans-serif; }

/* the components box */
.kit { border: 1px solid #e6d9c2; padding: 5px 7px 6px; margin: 0 0 5px; break-inside: avoid; }
.kit .lbl { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px; letter-spacing: .14em;
            text-transform: uppercase; color: ${GOLD}; margin-bottom: 3px; }
.kit ul { list-style: none; padding: 0; margin: 0; font-size: ${rpx(8)}; line-height: 1.38; }

/* tables */
/* A table split across a column break loses its header and reads as two
   unrelated tables, so it moves whole. */
table { width: 100%; border-collapse: collapse; font-size: ${rpx(8.1)}; margin: ${rpx(2)} 0 ${rpx(3.4)};
        break-inside: avoid; }
th { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px; letter-spacing: .09em;
     text-transform: uppercase; color: ${GOLD}; font-weight: 700; text-align: left;
     border-bottom: 1px solid ${GOLD}; padding: 0 3px 1.5px; }
td { padding: 1.5px 3px; border-bottom: 1px solid #efe5d5; vertical-align: top;
     font-variant-numeric: tabular-nums; }
td.n, th.n { text-align: right; }
tr:last-child td { border-bottom: 0; }

/* examples */
.ex { display: grid; grid-template-columns: 1fr auto; font-size: 8.1px; margin: 1px 0 4px; }
.ex div { border-bottom: 1px solid #f2eade; padding: 1px 0; }
.ex .r { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

/* whisper list */
.wl { font-size: 7.9px; }
.wl .w { margin-bottom: 1.9px; line-height: 1.27; break-inside: avoid; }
.wl .w b { color: ${OX}; }
.wl .w.burden b { color: ${OX}; }
.wl .w.burden::after { content: " ✦"; color: ${GOLD}; }
.wgroup { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px; letter-spacing: .11em;
          text-transform: uppercase; color: ${GOLD}; margin: 4px 0 1.5px; break-after: avoid; }
.wgroup:first-child { margin-top: 1px; }
`;

const P = (t, cls) => `<p${cls ? ` class="${cls}"` : ''}>${t}</p>`;
const H2 = (t) => `<h3>${t}</h3>`;
const H = (n, t, opt) => `<h2><span class="n">${n}</span>${t}` +
  (opt ? `<span class="opt">optional</span>` : '') + `</h2>`;


// ------------------------------------------------------------------ layout ---
// The wording and the generated tables both come from content.js. Everything
// below decides only where they sit on the page.
// A bad edit should say what is wrong in one line, not bury it in a stack
// trace. Anything content.js throws is a problem with rules.md or whispers.md.
let CONTENT;
try {
  CONTENT = require('./content').build();
} catch (err) {
  console.error('\nCould not build the sheets from the sources:\n');
  console.error('  ' + err.message.split('\n').join('\n  '));
  console.error('\nSee FORMAT.md.\n');
  process.exit(1);
}

const mast = (m) => `
  <div class="mast">
    <svg width="30" height="22" viewBox="0 0 100 74" fill="${OX}">${CROWN}</svg>
    <div>
      <h1>${m.title}</h1>
      <p class="sub">${m.subtitle}</p>
    </div>
    <div class="meta">${m.meta}</div>
  </div>`;

const runner = (m, which) =>
  `<div class="runner"><span>${m.runner}</span><span>${m[which]}</span></div>`;

/** A leaf: the first side takes the masthead, the second a slim head. */
function leaf(doc, extraClass) {
  const m = doc.meta;
  const cls = extraClass ? ' ' + extraClass : '';
  const sideOne = `
<div class="side s1${cls}">
  ${mast(m)}
  <div class="cols">
    ${doc.sides[0]}
  </div>
  ${runner(m, 'side1-runner')}
</div>`;
  const sideTwo = `
<div class="side s2${cls}">
  <div class="s2head"><b>${m['side2-title']}</b><span>${m['side2-subtitle']}</span></div>
  <div class="cols">
    ${doc.sides[1]}
  </div>
  ${runner(m, 'side2-runner')}
</div>`;
  return sideOne + sideTwo;
}

// The Whispers leaf carries less than the rules leaf, so it is set larger
// rather than left half empty. One scale drives every size on it; fit.js
// reports how full each side comes out. This fails at 1.38.
const WSCALE = 1.36;
const wpx = (n) => `${(n * WSCALE).toFixed(2)}px`;

const WCSS = CSS + `
/* The Whispers are a list rather than an argument, so the columns balance
   instead of filling in order and leaving the last one empty. */
.wsheet .cols { column-fill: balance; }
.wsheet .cols p { font-size: ${wpx(8.9)}; }
.wsheet .cols p.note { font-size: ${wpx(8.4)}; }
.wsheet h3 { font-size: ${wpx(9.4)}; margin: 7px 0 2px; color: ${OX}; font-weight: 700;
             break-after: avoid; }
.wsheet .w { margin-bottom: ${wpx(4.4)}; line-height: 1.29; font-size: ${wpx(8.9)};
             break-inside: avoid; }
.wsheet .wsign { display: block; font-size: ${wpx(7.6)}; font-style: italic; color: ${DIM};
                 margin-top: .6px; }
.wsheet .wgroup { margin: 6px 0 2px; }
.wsheet .w b { color: ${OX}; }
/* The runner promises that a fleuron means a burden. It sits against the name:
   as a ::after on the entry it landed below the sign-off and read as a stray
   bullet. */
.wsheet .w .bm { font-style: normal; color: ${GOLD}; margin: 0 0 0 1px; }
`;

const page = (title, css, body) => `<!doctype html><html><head><meta charset="utf-8">
<title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;

fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/rulesheet.html',
  page("The Fool's Court — rules", CSS, leaf(CONTENT.rules)));
fs.writeFileSync('out/whispersheet.html',
  page("The Fool's Court — the Whispers", WCSS, leaf(CONTENT.whispers, 'wsheet')));
console.log('wrote out/rulesheet.html and out/whispersheet.html');
