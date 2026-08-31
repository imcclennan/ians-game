/*
 * text-cards.js — the cards whose content is mostly words: the twenty-two
 * Whisper faces and the two sides of the quick reference card. These are laid
 * out in HTML so the browser does the line breaking, over an SVG ornament layer.
 */
const A = require('./art');
const { EMBLEM, emblem, crown, fleuron, r } = A;
const C = require('./cards');
const WM = require('./watermark');
const { W, H, CX, doc, sheet } = C;

// What an errand promises, the favour table and its worked examples are all
// taken from the game itself. Every one of these numbers has been wrong on a
// printed card at least once.
require('../../js/cards.js');
require('../../js/rules.js');
const { Cards: GameCards, Rules } = globalThis;

/** A favour figure with a real minus sign in front of it. */
const fav = (n) => (n < 0 ? '&minus;' + Math.abs(n) : '+' + n);
/** A worked example, scored rather than typed. */
const ex = (bid, won, foolsErrand) =>
  `<span>${foolsErrand ? `${Rules.FOOLS_ERRAND_SIZE} Fools out` : `Pledged ${bid}`}, won ${won} ` +
  `&rarr; <b>${fav(Rules.scoreHand(bid, won, !!foolsErrand))}</b></span>`;

// 300 DPI page: 3" x 5" = 900 x 1500 px, 1/8" bleed, 1/8" safe zone inside trim.
const PXW = 900, PXH = 1500;
const SX = 825 / W, SY = 1425 / H, OX = 37.5, OY = 37.5;
const X = (u) => r(OX + u * SX);
const Y = (v) => r(OY + v * SY);
const S = (u) => r(u * SX);   // scale a design length to px (horizontal)

const CREAM = '#f4f0e6';
const INDIGO = '#1a2050';
const GOLD_D = '#977524';
const OX_BLOOD = '#4a1524';
const GOLD_H = '#8d6a2a';
const BURDEN_INK = '#4a1524';
const BURDEN_ACCENT = '#8a3346';

/** An inline emblem for use inside HTML. */
function inlineEmblem(suit, px, fill) {
  return `<svg class="em" viewBox="0 0 100 100" width="${px}" height="${px}" fill="${fill}" ` +
    `stroke="${fill}" stroke-width="0" stroke-linecap="round" stroke-linejoin="round">${EMBLEM[suit]}</svg>`;
}

function star(x, y, rad, fill, op) {
  return `<path d="M${r(x)} ${r(y - rad * 2.7)} L${r(x + rad * 0.6)} ${r(y - rad * 0.6)} L${r(x + rad * 2.7)} ${r(y)} ` +
    `L${r(x + rad * 0.6)} ${r(y + rad * 0.6)} L${r(x)} ${r(y + rad * 2.7)} L${r(x - rad * 0.6)} ${r(y + rad * 0.6)} ` +
    `L${r(x - rad * 2.7)} ${r(y)} L${r(x - rad * 0.6)} ${r(y - rad * 0.6)} Z" fill="${fill}" opacity="${op}"/>`;
}

/** Crescent moon, opening to the left. */
function crescent(cx, cy, rad, fill) {
  return `<path d="M${r(cx + rad * 0.35)} ${r(cy - rad)} A ${r(rad)} ${r(rad)} 0 1 0 ${r(cx + rad * 0.35)} ${r(cy + rad)} ` +
    `A ${r(rad * 0.78)} ${r(rad * 0.92)} 0 1 1 ${r(cx + rad * 0.35)} ${r(cy - rad)} Z" fill="${fill}"/>`;
}

// ----------------------------------------------------------- whisper face ---
// The court's seal: a coronet in a beaded ring. Ported from js/whispercard.js
// so the printed card and the on-screen card carry the same mark.
function seal(cx, cy, size, fill, opacity) {
  let beads = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    beads += `<circle cx="${r(50 + 44 * Math.cos(a))}" cy="${r(50 + 44 * Math.sin(a))}" r="1.7"/>`;
  }
  const inner =
    `<circle cx="50" cy="50" r="37" fill="none" stroke="${fill}" stroke-width="1.6"/>` + beads +
    `<path d="M31 62 L31 39 L40 47 L50 33 L60 47 L69 39 L69 62 Z"/>` +
    `<rect x="31" y="65" width="38" height="4.5" rx="2"/>` +
    `<circle cx="31" cy="36" r="3.4"/><circle cx="50" cy="30" r="3.4"/>` +
    `<circle cx="69" cy="36" r="3.4"/>`;
  return wrapMark(inner, cx, cy, size, fill, opacity);
}

/** The same coronet, snapped: the court's word gone wrong. */
function brokenSeal(cx, cy, size, fill, opacity) {
  let beads = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const x = 50 + 44 * Math.cos(a), y = 50 + 44 * Math.sin(a);
    if (Math.abs(x - 50) < 7) continue;   // the crack runs down the middle
    beads += `<circle cx="${r(x)}" cy="${r(y)}" r="1.7"/>`;
  }
  const inner =
    `<path d="M46 13 A37 37 0 0 0 46 87" fill="none" stroke="${fill}" stroke-width="1.6"/>` +
    `<path d="M54 13 A37 37 0 0 1 54 87" fill="none" stroke="${fill}" stroke-width="1.6"/>` + beads +
    `<path d="M31 62 L31 39 L40 47 L46 38 L46 62 Z"/>` +
    `<path d="M69 62 L69 39 L60 47 L54 38 L54 62 Z"/>` +
    `<rect x="31" y="65" width="15" height="4.5" rx="2"/>` +
    `<rect x="54" y="65" width="15" height="4.5" rx="2"/>` +
    `<circle cx="31" cy="36" r="3.4"/><circle cx="69" cy="36" r="3.4"/>` +
    `<path d="M50 8 L50 92" stroke="${fill}" stroke-width="1.4" stroke-dasharray="5 4" fill="none"/>`;
  return wrapMark(inner, cx, cy, size, fill, opacity);
}

function wrapMark(inner, cx, cy, size, fill, opacity) {
  const k = size / 100;
  return `<g transform="translate(${r(cx - size / 2)},${r(cy - size / 2)}) scale(${r(k, 5)})" ` +
    `fill="${fill}"${opacity != null ? ` opacity="${opacity}"` : ''}>${inner}</g>`;
}

/**
 * A whisper's ornament layer. Ordinary words are indigo under a whole seal;
 * burdens are oxblood under a broken one, so the table can tell at a glance
 * that the monarch has not done you a favour. The BACK is identical for both.
 */
function whisperArt(burden) {
  const line = burden ? BURDEN_INK : INDIGO;
  const accent = burden ? BURDEN_ACCENT : GOLD_D;
  const washId = burden ? 'wf-wash-b' : 'wf-wash';
  let s = sheet(CREAM, 0);
  // The monarch, watching. Cream under indigo for a word, under oxblood for a
  // burden — the two plates differ only in tone, and the back of both is the
  // same, so face down they still cannot be told apart.
  s += WM.plate(burden ? 'burden' : 'whisper', 0);
  s += `<rect x="-60" y="-60" width="${W + 120}" height="${H + 120}" fill="url(#${washId})"/>`;
  s += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="none" stroke="${line}" ` +
    `stroke-width="${burden ? 6 : 4}" opacity="${burden ? 0.9 : 0.75}"/>`;
  s += `<rect x="66" y="66" width="${W - 132}" height="${H - 132}" fill="none" stroke="${line}" ` +
    `stroke-width="1.2" opacity="0.42"/>`;
  for (const [x, y] of [[94, 94], [W - 94, 94], [94, H - 94], [W - 94, H - 94]]) {
    s += star(x, y, 6, accent, 0.85);
  }
  // the seal at the head of the card
  s += burden ? brokenSeal(CX, 142, 96, line, 0.95) : seal(CX, 142, 96, line, 0.95);
  s += `<line x1="120" y1="212" x2="${W - 120}" y2="212" stroke="${line}" stroke-width="1.6" opacity="0.42"/>`;
  // a large, very faint seal behind the text so the lower half is not bare
  s += (burden ? brokenSeal : seal)(CX, 700, 470, line, 0.05);
  // foot
  s += `<line x1="120" y1="1030" x2="${W - 120}" y2="1030" stroke="${line}" stroke-width="1.6" opacity="0.42"/>`;
  s += crown(CX, 1112, 58, line, 0.9);
  const defs =
    `<linearGradient id="wf-wash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${INDIGO}" stop-opacity="0.10"/>
      <stop offset="34%" stop-color="${INDIGO}" stop-opacity="0.02"/>
      <stop offset="66%" stop-color="${INDIGO}" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="${INDIGO}" stop-opacity="0.10"/></linearGradient>
     <linearGradient id="wf-wash-b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BURDEN_INK}" stop-opacity="0.14"/>
      <stop offset="34%" stop-color="${BURDEN_INK}" stop-opacity="0.03"/>
      <stop offset="66%" stop-color="${BURDEN_INK}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${BURDEN_INK}" stop-opacity="0.14"/></linearGradient>`;
  return doc(s, { print: true, defs });
}

function page(bodyHtml, extraCss) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: ${PXW}px ${PXH}px; margin: 0; }
  html, body { margin:0; padding:0; }
  body { width:${PXW}px; height:${PXH}px; overflow:hidden; }
  .card { position:relative; width:${PXW}px; height:${PXH}px; }
  .art { position:absolute; inset:0; }
  .art svg { display:block; width:${PXW}px; height:${PXH}px; }
  .t { position:absolute; }
  .em { vertical-align:-0.14em; }
  ${extraCss || ''}
  </style></head><body><div class="card">${bodyHtml}</div></body></html>`;
}

/** One Whisper. n is 1-based, of 22. */
function whisperFace(w, n, total) {
  const burden = !!w.burden;
  const line = burden ? BURDEN_INK : INDIGO;
  const accent = burden ? BURDEN_ACCENT : GOLD_D;
  const flavInk = burden ? '#5d3540' : '#3a3f66';

  // Long names and long rules step down a size so every card keeps the same
  // margins and the block stays optically centred.
  const nameSize = w.name.length > 17 ? 58 : 68;
  const ruleSize = w.line.length > 92 ? 33 : (w.line.length > 60 ? 35 : 39);
  const flavSize = w.detail.length > 170 ? 26 : 29;

  const css = `
  .wf { font-family:'Lora', 'TeX Gyre Pagella', serif; color:${line}; text-align:center;
        text-wrap:balance; }
  .stack { left:${X(74)}px; top:${Y(232)}px; width:${S(552)}px; height:${S(770)}px;
           display:flex; flex-direction:column; align-items:center; justify-content:center;
           gap:${S(38)}px; }
  .name  { font-size:${S(nameSize)}px; line-height:1.1; font-weight:600; }
  .rule  { width:${S(512)}px; font-size:${S(ruleSize)}px; line-height:1.4; }
  .flav  { width:${S(496)}px; font-size:${S(flavSize)}px; line-height:1.5; font-style:italic;
           color:${flavInk}; }
  /* Who the word came from, set as a sign-off under the fiction. Nested inside
     .flav rather than added to .stack so it does not take a full stack gap. */
  .sign  { display:block; margin-top:${S(16)}px; font-size:${S(21)}px; font-style:italic;
           color:${flavInk}; opacity:.85; }
  .div   { display:flex; align-items:center; justify-content:center; gap:${S(14)}px;
           width:${S(380)}px; }
  .div i { display:block; height:${S(1.6)}px; background:${accent}; flex:1; opacity:.9; }
  .foot  { left:${X(90)}px; top:${Y(1052)}px; width:${S(520)}px; font-size:${S(20)}px;
           letter-spacing:${S(5)}px; text-transform:uppercase; color:${accent};
           font-weight:${burden ? 700 : 400}; }`;

  const divider = `<div class="div"><i></i>` +
    `<svg width="${S(20)}" height="${S(20)}" viewBox="0 0 40 40">${star(20, 20, 6.4, accent, 1)}</svg>` +
    `<i></i></div>`;

  const body =
    `<div class="art">${whisperArt(burden)}</div>` +
    `<div class="t wf stack">` +
    `<div class="name">${esc(w.name)}</div>` +
    `<div class="rule">${esc(w.line)}</div>` +
    divider +
    `<div class="flav">${esc(w.detail)}` +
      `<div class="sign">&mdash; ${esc(w.signed)}</div>` +
    `</div>` +
    `</div>` +
    `<div class="t wf foot">${burden ? 'A Burden' : 'A Whisper'} &middot; ${n} of ${total}</div>`;
  return page(body, css);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { whisperFace, whisperArt, seal, brokenSeal, page, X, Y, S, PXW, PXH, inlineEmblem, star, crescent, esc, CREAM, INDIGO, GOLD_D, OX_BLOOD, GOLD_H };

// ------------------------------------------------------ quick reference ----
// Heraldic vocabulary, but printed dark-on-cream: this is the one card people
// read at arm's length across a table.
function refArt() {
  let s = sheet('#f4ecdb', 0);
  s += `<rect x="-60" y="-60" width="${W + 120}" height="${H + 120}" fill="url(#rf-wash)"/>`;
  s += `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="none" stroke="${OX_BLOOD}" stroke-width="4.5" opacity="0.85"/>`;
  s += `<rect x="64" y="64" width="${W - 128}" height="${H - 128}" fill="none" stroke="${OX_BLOOD}" stroke-width="1.2" opacity="0.45"/>`;
  for (const [x, y] of [[92, 92], [W - 92, 92], [92, H - 92], [W - 92, H - 92]]) {
    s += fleuron(x, y, 30, GOLD_H, 0.9);
  }
  const defs = `<linearGradient id="rf-wash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a1524" stop-opacity="0.09"/>
      <stop offset="30%" stop-color="#4a1524" stop-opacity="0.015"/>
      <stop offset="70%" stop-color="#4a1524" stop-opacity="0.015"/>
      <stop offset="100%" stop-color="#4a1524" stop-opacity="0.09"/></linearGradient>`;
  return doc(s, { print: true, defs });
}

const REF_CSS = `
  .rf { font-family:'Lora','TeX Gyre Pagella',serif; color:${OX_BLOOD}; }
  .sheetbox { left:${X(84)}px; top:${Y(92)}px; width:${S(532)}px; height:${S(1024)}px;
              display:flex; flex-direction:column; }
  .head { text-align:center; }
  .head .kicker { font-size:${S(17)}px; letter-spacing:${S(4.4)}px; text-transform:uppercase;
                  color:${GOLD_H}; font-weight:600; }
  .head .big { font-size:${S(34)}px; font-weight:600; letter-spacing:${S(1)}px; margin-top:${S(4)}px; }
  .head .crownwrap { margin-bottom:${S(6)}px; }
  h3 { margin:${S(14)}px 0 ${S(7)}px; font-size:${S(19)}px; letter-spacing:${S(3.6)}px;
       text-transform:uppercase; color:${GOLD_H}; font-weight:600; text-align:center;
       display:flex; align-items:center; gap:${S(12)}px; }
  h3 i { display:block; height:${S(1.2)}px; background:${GOLD_H}; flex:1; opacity:.7; }
  ol, ul { margin:0; padding:0; list-style:none; }
  li { font-size:${S(21)}px; line-height:1.31; margin-bottom:${S(5.5)}px; display:flex; gap:${S(10)}px; }
  li b.n { color:${GOLD_H}; font-weight:700; min-width:${S(20)}px; }
  li span.dot { color:${GOLD_H}; }
  .vals { display:grid; grid-template-columns:1fr 1fr; gap:${S(6)}px ${S(16)}px; }
  .val { display:flex; align-items:center; gap:${S(9)}px; font-size:${S(23)}px; }
  .val b { margin-left:auto; font-size:${S(26)}px; }
  .note { font-size:${S(19)}px; line-height:1.34; font-style:italic; opacity:.85; margin-top:${S(8)}px; }
  .rows { display:flex; flex-direction:column; gap:${S(6)}px; }
  .row2 { display:flex; align-items:baseline; gap:${S(10)}px; font-size:${S(22)}px; line-height:1.28; }
  .row2 .k { flex:1; }
  .row2 .v { font-weight:600; text-align:right; white-space:nowrap; }
  .ladder { display:grid; grid-template-columns:repeat(5,1fr); gap:${S(6)}px; text-align:center; }
  .ladder .c { font-size:${S(19)}px; }
  .ladder .c .num { font-size:${S(27)}px; font-weight:700; color:${GOLD_H}; }
  .examples { display:flex; flex-wrap:wrap; justify-content:space-between; gap:${S(6)}px;
              font-size:${S(20)}px; margin-top:${S(7)}px; }
  .examples span b { font-weight:700; }
  .foot2 { margin-top:auto; padding-top:${S(8)}px; text-align:center; font-size:${S(18)}px; letter-spacing:${S(5)}px;
           text-transform:uppercase; color:${GOLD_H}; }`;

function refHead(kicker, big) {
  return `<div class="head">` +
    `<div class="crownwrap"><svg width="${S(60)}" height="${S(42)}" viewBox="0 0 100 74" ` +
    `fill="${OX_BLOOD}">${A.CROWN_PATH}</svg></div>` +
    `<div class="kicker">${esc(kicker)}</div><div class="big">${esc(big)}</div></div>`;
}

const h3 = (t) => `<h3><i></i>${esc(t)}<i></i></h3>`;

function refFront() {
  const val = (suit, name, n) =>
    `<div class="val">${inlineEmblem(suit, S(30), OX_BLOOD)}<span>${name}</span><b>${n}</b></div>`;
  const body =
    `<div class="art">${refArt()}</div>` +
    `<div class="t rf sheetbox">` +
    refHead('The Fool’s Court', 'Quick Reference') +
    h3('A night, in order') +
    `<ol>` +
    `<li><b class="n">1</b><span>The steward deals <b>15</b> cards to each of four players.</span></li>` +
    `<li><b class="n">2</b><span>If Whispers are in use, each player looks at their own hand and may <b>take one, unread</b> (overleaf).</span></li>` +
    `<li><b class="n">3</b><span>Each sends <b>four agents</b> out on errands, face down. Their kinds are your pledge; ranks are ignored.</span></li>` +
    `<li><b class="n">4</b><span><b>Eleven audiences</b> are played out.</span></li>` +
    `<li><b class="n">5</b><span>Errands and Whispers are revealed; favour is scored.</span></li>` +
    `<li><b class="n">6</b><span>The stewardship passes one seat left.</span></li>` +
    `</ol>` +
    h3('What an errand promises') +
    `<div class="vals">` +
      GameCards.SUITS.slice().reverse()
        .map((suit) => val(suit, GameCards.SUIT_ROLE[suit],
          fav(GameCards.BID_VALUE[suit]))).join('') +
    `</div>` +
    `<div class="note">Your pledge is the sum of the four you send, and never less than nothing. Four Assassins pledge ${4 * GameCards.BID_VALUE.S} &mdash; more than the court can give.</div>` +
    h3('Winning an audience') +
    `<ul>` +
    `<li><span class="dot">&#9670;</span><span>Answer in kind if you can; otherwise play anything.</span></li>` +
    `<li><span class="dot">&#9670;</span><span>The <b>highest of the opening kind</b> wins &mdash; unless the <b>ruling kind</b> was played, then the highest of those.</span></li>` +
    `<li><span class="dot">&#9670;</span><span>A card of neither kind never wins, whatever its rank.</span></li>` +
    `<li><span class="dot">&#9670;</span><span>The winner opens the next audience.</span></li>` +
    `</ul>` +
    `<div class="foot2">Favour &amp; sway overleaf</div>` +
    `</div>`;
  return page(body, REF_CSS);
}

function refBack() {
  const rung = (n, label, suit) =>
    `<div class="c"><div class="num">${n}</div>` +
    (suit ? inlineEmblem(suit, S(28), OX_BLOOD) : '') +
    `<div>${label}</div></div>`;
  const body =
    `<div class="art">${refArt()}</div>` +
    `<div class="t rf sheetbox">` +
    refHead('Favour and sway', 'Scoring') +
    h3('Favour') +
    `<div class="rows">` +
    `<div class="row2"><span class="k">Kept exactly</span><span class="v">${fav(Rules.FLAT_BONUS)}, then 2 &times; won</span></div>` +
    `<div class="row2"><span class="k">Missed, high or low</span><span class="v">the pledge, &minus;2 per off</span></div>` +
    `<div class="row2"><span class="k">Fool&rsquo;s errand kept</span><span class="v">${fav(Rules.FOOLS_ERRAND_PAY)}</span></div>` +
    `<div class="row2"><span class="k">Hollow promise kept</span><span class="v">${fav(Rules.FLAT_BONUS)}</span></div>` +
    `<div class="row2"><span class="k">Pledged 0, won any</span><span class="v">&minus;2 each</span></div>` +
    `</div>` +
    `<div class="examples">` +
    ex(4, 4) + ex(5, 4) +
    ex(3, 6) + ex(2, 0) +
    ex(0, 3, true) + ex(Rules.TRICKS_PER_HAND, Rules.TRICKS_PER_HAND) +
    `</div>` +
    h3('Who holds sway next night') +
    `<div class="ladder">${rung(0, 'Fools', 'C')}${rung(1, 'Merchants', 'D')}${rung(2, 'Lovers', 'H')}${rung(3, 'Assassins', 'S')}${rung(4, 'No sway', null)}</div>` +
    `<div class="note">From how many nobles kept their pledge <b>exactly</b> last night. A season opens at No Sway.</div>` +
    h3('The season') +
    `<ul>` +
    `<li><span class="dot">&#9670;</span><span>Twelve nights, the last of them <b>Twelfth Night</b>. No target score: most favour at the end wins.</span></li>` +
    `<li><span class="dot">&#9670;</span><span>Level totals break on Twelfth Night: more favour, then higher pledge, then higher errand ranks.</span></li>` +
    `</ul>` +
    h3('The Whispers') +
    `<ul>` +
    `<li><span class="dot">&#9670;</span><span>Optional. <b>22</b> words, <b>7</b> of them burdens that cost rather than pay.</span></li>` +
    `<li><span class="dot">&#9670;</span><span>After the deal, before pledging, any player whose favour is <b>below the table&rsquo;s highest</b> may take one &mdash; free, and unread. Private until the night ends.</span></li>` +
    `</ul>` +
    `<div class="foot2">The order of a night overleaf</div>` +
    `</div>`;
  return page(body, REF_CSS);
}

module.exports.refFront = refFront;
module.exports.refBack = refBack;
