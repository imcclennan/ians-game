/*
 * bidsheet.js — one extra page for the printed rules: every pledge a noble can
 * make, and every set of four errands that makes it.
 *
 *   out/bidsheet.html   8.5" x 5.5", one side, set to match the rules leaf
 *
 * Nothing here is typed from the rules. The sets are every way of choosing
 * Rules.BID_CARDS agents from the four kinds, and each is run through the
 * game's own Rules.bidFromCards and Rules.isFoolsErrand, so a change to an
 * errand value or to the size of a Fool's errand reaches this page on the next
 * build. The table has one row per pledge that can be made: the pledges from
 * the largest down to 1, then the two ways of pledging nothing.
 *
 * Run it from this directory:  node bidsheet.js
 */
const fs = require('fs');
const { EMBLEM } = require('./art');

require('../../js/cards.js');
require('../../js/rules.js');
const { Rules, Cards } = globalThis;

const OX = '#4a1524', GOLD = '#8d6a2a', INK = '#20161a', DIM = '#5d4a4f';
const AGENT_INK = { C: '#492851', D: '#684d0e', H: '#7c241e', S: '#1e2530' };

// Strongest first, so each set reads from its heaviest errand to its lightest.
const KIND_ORDER = ['S', 'H', 'D', 'C'];

/** A real minus sign where a kind costs a promise. */
const signed = (n) => (n < 0 ? '&minus;' + Math.abs(n) : String(n));

const em = (suit, px) =>
  `<svg class="em" viewBox="0 0 100 100" width="${px}" height="${px}" ` +
  `fill="${AGENT_INK[suit]}" aria-label="${Cards.SUIT_ROLE[suit]}">${EMBLEM[suit]}</svg>`;

// ------------------------------------------------------------------- sets ---
/** Every multiset of `size` kinds, as a string of suit letters in KIND_ORDER. */
function everySet(size) {
  const out = [];
  (function pick(from, left, so_far) {
    if (left === 0) { out.push(so_far); return; }
    for (let i = from; i < KIND_ORDER.length; i++) pick(i, left - 1, so_far + KIND_ORDER[i]);
  })(0, size, '');
  return out;
}

const asCards = (set) => set.split('').map((suit) => ({ suit }));

const SETS = everySet(Rules.BID_CARDS).map((set) => ({
  set,
  pledge: Rules.bidFromCards(asCards(set)),
  foolsErrand: Rules.isFoolsErrand(asCards(set))
}));

/** The rows, largest pledge first, the two nothings last. */
function rows() {
  const top = Math.max(...SETS.map((s) => s.pledge));
  const out = [];
  for (let pledge = top; pledge >= 1; pledge--) {
    out.push({ label: String(pledge), sets: SETS.filter((s) => s.pledge === pledge) });
  }
  out.push({
    label: '0 <span class="kind">(Hollow Promise)</span>',
    sets: SETS.filter((s) => s.pledge === 0 && !s.foolsErrand)
  });
  out.push({
    label: '0 <span class="kind">(Fool’s Errand)</span>',
    sets: SETS.filter((s) => s.pledge === 0 && s.foolsErrand)
  });
  return out;
}

const ROWS = rows();
// Every set must land in exactly one row, or the page is silently incomplete.
const listed = ROWS.reduce((n, r) => n + r.sets.length, 0);
if (listed !== SETS.length) {
  throw new Error(`The table lists ${listed} errand sets but there are ${SETS.length}.`);
}
if (ROWS.length !== 14) {
  throw new Error(`Expected 14 rows (12 down to 1, and two nothings); built ${ROWS.length}.`);
}

// ------------------------------------------------------------------- page ---
const setHtml = (s) => `<span class="set">${s.set.split('').map((k) => em(k, 18)).join('')}</span>`;

const body = ROWS.map((r) =>
  `<tr><td class="pledge">${r.label}</td><td>${r.sets.map(setHtml).join('')}</td></tr>`
).join('\n');

const key = KIND_ORDER.map((suit) =>
  `<span class="key">${em(suit, 12)}<b>${Cards.SUIT_ROLE[suit]}</b> ${signed(Cards.BID_VALUE[suit])}</span>`
).join('');

const CSS = `
@page { size: 8.5in 5.5in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: 'Lora', Georgia, serif; color: ${INK}; }
.side { width: 8.5in; height: 5.5in; padding: 0.24in 0.34in 0.26in; position: relative;
        overflow: hidden; background: #faf6ec; }
.s2head { display: flex; align-items: baseline; border-bottom: 1.4px solid ${OX};
          padding-bottom: 4px; margin-bottom: 5px; }
.s2head b { font-size: 12px; color: ${OX}; font-weight: 600; }
.s2head span { margin-left: auto; font-family: 'Carlito', system-ui, sans-serif; font-size: 7.2px;
               letter-spacing: .12em; text-transform: uppercase; color: ${GOLD}; }
.runner { position: absolute; left: 0.34in; right: 0.34in; bottom: 0.11in; display: flex;
          border-top: 1px solid #e6d9c2; padding-top: 3px;
          font-family: 'Carlito', system-ui, sans-serif; font-size: 6.8px; letter-spacing: .11em;
          text-transform: uppercase; color: ${GOLD}; }
.runner span:last-child { margin-left: auto; }

.keyrow { display: flex; gap: 14px; align-items: center; font-size: 8.4px; color: ${DIM};
          margin: 0 0 4px; }
.keyrow .lbl { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px;
               letter-spacing: .14em; text-transform: uppercase; color: ${GOLD}; }
.key { white-space: nowrap; }
.key .em { vertical-align: -0.14em; margin-right: 3px; }
.key b { color: ${INK}; font-weight: 600; }

table { width: 100%; border-collapse: collapse; font-size: 10.6px; }
th { font-family: 'Carlito', system-ui, sans-serif; font-size: 7px; letter-spacing: .1em;
     text-transform: uppercase; color: ${GOLD}; font-weight: 700; text-align: left;
     border-bottom: 1px solid ${GOLD}; padding: 0 4px 2px; }
td { padding: 4.2px 4px; border-bottom: 1px solid #efe5d5; vertical-align: middle;
     font-variant-numeric: tabular-nums; }
tr:last-child td { border-bottom: 0; }
td.pledge, th.pledge { width: 1.55in; font-weight: 700; color: ${OX}; font-size: 11.8px; }
td.pledge .kind { font-weight: 400; font-size: 8.6px; color: ${DIM}; font-style: italic; }
.set { display: inline-flex; gap: 2px; margin-right: 15px; vertical-align: middle; }
.set .em { display: block; }
.foot { margin: 7px 0 0; font-size: 8.4px; line-height: 1.35; color: ${DIM}; font-style: italic; }
`;

const nothing = SETS.filter((s) => s.pledge === 0);
const hollow = nothing.filter((s) => !s.foolsErrand).length;
const html = `<!doctype html><html><head><meta charset="utf-8">
<title>The Fool's Court — every pledge</title><style>${CSS}</style></head><body>
<div class="side">
  <div class="s2head"><b>Every pledge, and the errands that make it</b>
    <span>${SETS.length} sets of ${Rules.BID_CARDS} agents &middot; ${ROWS.length} pledges</span></div>
  <div class="keyrow"><span class="lbl">Each agent promises</span>${key}
    <span>&mdash; rank is ignored</span></div>
  <table>
    <tr><th class="pledge">Pledge</th><th>Errands</th></tr>
${body}
  </table>
  <p class="foot">A set that comes to nothing or less pledges nothing. All
    ${Rules.FOOLS_ERRAND_SIZE} errands sent as Fools is a Fool&rsquo;s errand; the other ${hollow}
    sets that fall to nothing are hollow promises.</p>
  <div class="runner"><span>The Fool&rsquo;s Court</span><span>Pledges and errands</span></div>
</div>
</body></html>`;

fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/bidsheet.html', html);
console.log(`wrote out/bidsheet.html (${ROWS.length} rows, ${listed} errand sets)`);
