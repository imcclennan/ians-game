/*
 * rulesheet.js — the rules as a boxed-game insert: 8.5" x 5.5", printed on
 * both sides, three columns a side.
 *
 * Section order and numbering follow js/rulebook.js so the printed sheet and
 * the app's Rules panel agree section for section. Text is condensed to fit;
 * every rule is present, the flavour notes are not.
 *
 * Scoring for a pledge of nothing follows js/rules.js scoreHand (+8 / -8),
 * NOT the prose in rulebook.js, which still describes the older -5/-2 ladder.
 */
const fs = require('fs');
const { EMBLEM } = require('./art');
const WHISPERS = require('./whispers-data');

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
h2 { font-size: 9.8px; margin: 6px 0 2px; color: ${OX}; font-weight: 700; line-height: 1.16;
     break-after: avoid; display: flex; align-items: baseline; gap: 4px; }
h2 .n { font-family: 'Carlito', system-ui, sans-serif; font-size: 7.6px; color: ${GOLD}; }
h2 .opt { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.2px; letter-spacing: .09em;
          text-transform: uppercase; color: ${GOLD}; border: 1px solid #e6d5b6; border-radius: 2px;
          padding: 0 3px; }
p { margin: 0 0 2.6px; font-size: 8.5px; line-height: 1.32; text-align: justify; hyphens: auto; }
p.first { margin-top: 0; }
.note { font-size: 7.9px; color: ${DIM}; font-style: italic; line-height: 1.32; }
ol, ul { margin: 0 0 2.6px; padding-left: 10px; font-size: 8.5px; line-height: 1.3; }
li { margin-bottom: 1.4px; }
b, strong { font-weight: 700; }
.ag { white-space: nowrap; }
.ag .em { vertical-align: -0.13em; margin-right: 1.5px; }

/* contents */
.toc { border: 1px solid #e6d9c2; border-left: 2.5px solid ${GOLD}; padding: 5px 7px 6px;
       margin: 0 0 5px; break-inside: avoid; }
.toc .lbl { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px; letter-spacing: .14em;
            text-transform: uppercase; color: ${GOLD}; margin-bottom: 3px; }
.toc ol { list-style: none; padding: 0; margin: 0; font-size: 8px; line-height: 1.36; }
.toc li { display: flex; gap: 5px; margin: 0; }
.toc li i { font-style: normal; color: ${GOLD}; min-width: 10px; text-align: right;
            font-variant-numeric: tabular-nums; }
.toc li s { text-decoration: none; color: ${DIM}; margin-left: auto; font-size: 7.2px;
            font-family: 'Carlito', system-ui, sans-serif; }

/* the components box */
.kit { border: 1px solid #e6d9c2; padding: 5px 7px 6px; margin: 0 0 5px; break-inside: avoid; }
.kit .lbl { font-family: 'Carlito', system-ui, sans-serif; font-size: 6.6px; letter-spacing: .14em;
            text-transform: uppercase; color: ${GOLD}; margin-bottom: 3px; }
.kit ul { list-style: none; padding: 0; margin: 0; font-size: 8px; line-height: 1.38; }

/* tables */
table { width: 100%; border-collapse: collapse; font-size: 8.1px; margin: 2px 0 3.4px; }
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
const H = (n, t, opt) => `<h2><span class="n">${n}</span>${t}` +
  (opt ? `<span class="opt">optional</span>` : '') + `</h2>`;

// ------------------------------------------------------------------ side 1 ---
const toc = `<div class="toc"><div class="lbl">Contents</div><ol>` +
  SECTIONS.map((s) => `<li><i>${s.n}</i>${s.title}` +
    (s.optional ? `<s>optional</s>` : '') + `</li>`).join('') +
  `</ol></div>`;

const kit = `<div class="kit"><div class="lbl">In this box</div><ul>` +
  `<li><b>60</b> agent cards &mdash; four kinds, ranked 1&ndash;15</li>` +
  `<li><b>22</b> Whisper cards, 7 of them burdens</li>` +
  `<li><b>4</b> quick reference cards</li>` +
  `<li>This sheet</li>` +
  `</ul></div>`;

const side1 = `
<div class="side s1">
  <div class="mast">
    <svg width="30" height="22" viewBox="0 0 100 74" fill="${OX}">${CROWN}</svg>
    <div>
      <h1>The Fool&rsquo;s Court</h1>
      <p class="sub">A trick-taking game of promises, for four players</p>
    </div>
    <div class="meta">Four players &middot; 45 minutes<br>Twelve nights to a season</div>
  </div>

  <div class="cols">
    ${toc}
    ${kit}

    ${H(1, 'Overview')}
    ${P(`Four nobles compete for the ear of the monarch over a series of <b>nights</b>. At the start
    of each night every player privately promises how many <b>audiences</b> they will win, then
    plays to reach that number <i>exactly</i>: overshooting is punished as surely as falling short.
    A season is <b>twelve nights</b>; whoever holds the most favour at the end wins.`, 'first')}
    ${P(`A hand is a <b>night</b>. A promise is a <b>pledge</b>. A trick is an <b>audience</b>. The
    trump suit is the <b>sway</b>. Points are <b>favour</b>. The dealer is the <b>steward</b>.`, 'note')}

    ${H(2, 'The deck')}
    ${P(`Sixty cards: four kinds of agent, each ranked <b>1 to 15</b>. Rank 15 is the most
    influential, rank 1 the least.`, 'first')}
    <table>
      <tr><th>Agent</th><th>Mark</th><th class="n">Promises</th></tr>
      <tr><td>Fool</td><td>${em('C', 10, AGENT_INK.C)} cap and bells</td><td class="n">0</td></tr>
      <tr><td>Merchant</td><td>${em('D', 10, AGENT_INK.D)} a balance</td><td class="n">1</td></tr>
      <tr><td>Lover</td><td>${em('H', 10, AGENT_INK.H)} a rose</td><td class="n">2</td></tr>
      <tr><td>Assassin</td><td>${em('S', 10, AGENT_INK.S)} a dagger</td><td class="n">3</td></tr>
    </table>
    ${P(`An agent&rsquo;s <b>kind</b> decides what it promises on an errand (5); its <b>rank</b>
    decides whether it wins an audience (6). The two never interact.`)}

    ${H(3, 'Seating and the course of a night')}
    ${P(`Four players sit in a fixed order; play and the deal go <b>clockwise</b>. One player is the
    <b>steward</b> for the night, and the stewardship passes one seat left after every night.`, 'first')}
    <ol>
      <li>The steward deals <b>15 cards</b> to each player, exhausting the deck.</li>
      <li>If Whispers are in use, each player looks at their hand and chooses whether to take one,
        unread and for nothing (4).</li>
      <li>Each player sends <b>four agents</b> out on errands, face down. Their kinds are that
        player&rsquo;s pledge (5).</li>
      <li>The player to the steward&rsquo;s left opens the first of <b>eleven audiences</b> (6).</li>
      <li>Errands and Whispers are revealed; favour is scored (7).</li>
      <li>The number of pledges kept sets the sway for the next night (8).</li>
    </ol>
    ${P(`After twelve nights the season ends and the most favour wins (9).`)}

    ${H(4, 'The Whispers', true)}
    ${P(`Optional. A season played without them is a complete game.`, 'first')}
    ${P(`The <b>22</b> Whispers are shuffled face down each night. After the deal and <b>before any
    pledge is made</b>, each eligible player may look at their own hand and then take one Whisper
    or go without.`)}
    ${P(`<b>The monarch does not confide in whoever is winning.</b> Only a player whose favour is
    <i>strictly less</i> than the highest at the table may take one, so on the first night nobody
    is offered a word.`)}
    ${P(`Taking one <b>costs nothing</b>, but it is taken <b>unread</b>. <b>7 of the 22 are
    burdens</b>, which cost rather than pay, so a word is a gamble rather than a formality. A
    burden is framed in oxblood under a broken seal and signed as one; but every Whisper is
    identical face down, and a player who took one need not say which.`)}
    ${P(`A Whisper bends how that player&rsquo;s favour is counted, or restricts which agents they
    may send, or both, and stays <b>private</b> until the night ends. A restriction is binding, but
    a demand a hand cannot obey &mdash; an Assassin required while holding none &mdash; is
    <b>waived</b>. No two players hold the same word on the same night, and a Whisper never changes
    the rules of play in 6. All 22 are listed in 10.`)}

    ${H(5, 'Making a pledge')}
    ${P(`Before any card is played, each player selects <b>four cards</b> from their hand and places
    them face down. These are that player&rsquo;s <b>errands</b>.`, 'first')}
    ${P(`A player&rsquo;s <b>pledge</b> is the sum of the errand values of the four cards sent, by
    kind. <b>Rank is disregarded entirely</b>: a Fool of 15 promises as little as a Fool of 1.
    Errands stay face down and <b>out of play</b>, so eleven cards remain in each hand and
    <b>eleven audiences</b> are contested.`)}
    ${P(`A pledge is <b>not capped</b>: four Assassins pledge twelve, more than the eleven available,
    and cannot be kept. Nothing forbids it. All errands are revealed together when the night ends;
    until then no player knows another&rsquo;s pledge, nor what has left their hand.`)}

  </div>
  <div class="runner"><span>The Fool&rsquo;s Court</span><span>Sections 1&ndash;5 &middot; play, scoring and the Whispers overleaf</span></div>
</div>`;

// ------------------------------------------------------------------ side 2 ---
const groups = [];
for (const w of WHISPERS) {
  let g = groups.find((x) => x.name === w.group);
  if (!g) groups.push(g = { name: w.group, items: [] });
  g.items.push(w);
}
const whisperList = groups.map((g) =>
  `<div class="wgroup">${g.name}</div>` +
  g.items.map((w) => `<div class="w${w.burden ? ' burden' : ''}"><b>${w.name}.</b> ${w.line}</div>`).join('')
).join('');

const side2 = `
<div class="side s2">
  <div class="s2head"><b>The Fool&rsquo;s Court</b><span>Play &middot; favour &middot; sway &middot; the Whispers</span></div>
  <div class="cols">
    ${H(6, 'Playing the night')}
    ${P(`The player to the steward&rsquo;s left <b>opens</b> the first audience with any card,
    including one of the ruling kind.`, 'first')}
    ${P(`Play goes clockwise. Each player must <b>answer in kind</b> &mdash; play a card of the same
    kind as the one that opened the audience &mdash; if they hold one. A player holding none may
    play anything.`)}
    ${P(`The audience is won by the <b>highest-ranked card of the opening kind</b>, unless a card of
    the <b>ruling kind</b> (8) was played, in which case the highest of those wins instead. A card
    of neither kind can never win, whatever its rank.`)}
    ${P(`The winner opens the next. Eleven audiences are played, exhausting every hand.`)}

    ${H(7, 'Winning favour')}
    ${P(`At the end of the night each player compares the audiences they won against the pledge they
    made.`, 'first')}
    <table>
      <tr><th>Result</th><th>Favour</th></tr>
      <tr><td>Pledge kept exactly</td><td>2 for every audience won</td></tr>
      <tr><td>Pledge missed, high or low</td><td>1 for every audience won, less 2 for every audience off the pledge</td></tr>
      <tr><td>Pledged nothing, won nothing</td><td>8</td></tr>
      <tr><td>Pledged nothing, won any</td><td>&minus;8, however many</td></tr>
    </table>
    <p><b>Examples.</b></p>
    <div class="ex">
      <div>Pledged 4, won 4</div><div class="r">+8</div>
      <div>Pledged 5, won 4</div><div class="r">+2</div>
      <div>Pledged 3, won 6</div><div class="r">0</div>
      <div>Pledged 2, won 0</div><div class="r">&minus;4</div>
      <div>Pledged 0, won 0</div><div class="r">+8</div>
      <div>Pledged 0, won 3</div><div class="r">&minus;8</div>
      <div>Pledged 11, won 11</div><div class="r">+22</div>
    </div>
    ${P(`Being wrong costs 2 favour per audience in <i>either</i> direction, so there is no
    advantage in under-promising and overshooting. The only good outcome is the exact one.`, 'note')}

    ${H(8, 'Who holds sway')}
    ${P(`One kind may <b>hold sway</b> for a night, outranking every other kind when audiences are
    decided (6). No player chooses it: it follows from how the <i>previous</i> night went. The first
    night of a season is always <b>No Sway</b>. Counted from pledges kept <b>exactly</b>, and known to everyone before pledges are made.`, 'first')}
    <table>
      <tr><th>Pledges kept</th><th>Sway next night</th></tr>
      <tr><td class="n">0</td><td>${agent('C', 'Fools')}</td></tr>
      <tr><td class="n">1</td><td>${agent('D', 'Merchants')}</td></tr>
      <tr><td class="n">2</td><td>${agent('H', 'Lovers')}</td></tr>
      <tr><td class="n">3</td><td>${agent('S', 'Assassins')}</td></tr>
      <tr><td class="n">4</td><td><b>No Sway</b></td></tr>
    </table>

    ${H(9, 'Winning the season')}
    ${P(`A season is exactly <b>twelve nights</b>. There is no target score and no early finish: the
    court sits twelve times and then rises. The twelfth is <b>Twelfth Night</b>, the feast of
    misrule; the stewardship will have passed three full times round the table, so every player
    deals exactly three nights.`, 'first')}
    ${P(`The player with the most favour after Twelfth Night wins. Level totals are decided, in
    order, by: more favour won on Twelfth Night; then the higher pledge that night; then the higher
    combined rank of the four errands sent that night.`)}

    ${H(10, 'The Whispers in full', true)}
    ${P(`All 22 words, of which the last 7 &mdash; marked &#10022; &mdash; are <b>burdens</b>. The
    rules governing them are in 4.`, 'first')}
    <div class="wl">${whisperList}</div>
  </div>
  <div class="runner"><span>The Fool&rsquo;s Court</span><span>Sections 6&ndash;10 &middot; &#10022; a burden</span></div>
</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<title>The Fool's Court — rules</title><style>${CSS}</style></head>
<body>${side1}${side2}</body></html>`;

fs.writeFileSync('out/rulesheet.html', html);
console.log('wrote out/rulesheet.html');
