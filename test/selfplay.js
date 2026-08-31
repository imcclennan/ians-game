/*
 * selfplay.js - four computer nobles, Whispers on, played over and over.
 *
 * Unit tests pin the rules down one at a time. They cannot tell you that the
 * rival nobles have quietly stopped believing in their own winners, or that a
 * kind of agent has fallen out of holding sway, because nothing about either is
 * wrong in a way an assertion can see. This measures whole seasons instead.
 *
 *   node test/selfplay.js [seasons]
 *
 * Defaults to 300 seasons. Every figure is deterministic for a given season
 * count: the seeds are fixed.
 */
require('../js/cards.js');
require('../js/rules.js');
require('../js/whispers.js');
require('../js/ai.js');
require('../js/engine.js');

const { Cards, Rules, AI, Engine, Whispers } = globalThis;

function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function sd(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) * (v - m))));
}

function pct(part, whole) {
  return whole ? (100 * part / whole) : 0;
}

/** Was this audience settled only because the second of two equal cards took it? */
function settledByTie(plays, trump, winning) {
  return plays.some((play) => play !== winning &&
    play.card.suit === winning.card.suit &&
    play.card.value === winning.card.value);
}

function blankTally() {
  return {
    seasons: 0,
    nights: 0,
    playerNights: 0,
    exact: 0,
    pledges: [],
    tricks: 0,
    tiedTricks: 0,
    ruffs: 0,
    leads: 0,
    leadsWithWinner: 0,
    foolsErrands: 0,
    foolsErrandsKept: 0,
    nightFavour: [],
    withWord: [],
    withoutWord: [],
    offers: 0,
    taken: 0,
    demands: 0,
    defied: 0,
    sway: { C: 0, D: 0, H: 0, S: 0, none: 0 },
    winnerTotals: [],
    lastTotals: [],
    margins: [],
    spreads: [],
    leadChanges: [],
    wireFinishes: 0,
    finishedNegative: 0,
    finishes: 0
  };
}

function playSeason(tally, seed) {
  const state = Engine.createGame({ dealer: 0, rng: seededRandom(seed) });
  state.players.forEach((player) => { player.isHuman = false; });
  state.players[0].aggression = 1;

  let leaderAfterEach = [];
  let guard = 0;

  while (state.phase !== 'gameOver' && guard++ < 200) {
    Engine.startHand(state);

    // The sway actually in force tonight, the opening No Sway included.
    tally.sway[state.trump === null ? 'none' : state.trump] += 1;

    // Who was entitled to a word, and who took one.
    state.players.forEach((player, seat) => {
      if (Engine.mayTakeWhisper(state, seat)) tally.offers += 1;
    });
    Engine.resolveComputerWhispers(state);
    state.players.forEach((player) => { if (player.whisper) tally.taken += 1; });

    Engine.beginBidding(state);
    Engine.submitComputerBids(state);

    state.players.forEach((player) => {
      tally.pledges.push(player.bid);
      if (Rules.isFoolsErrand(player.bidCards)) tally.foolsErrands += 1;
      if (Whispers.restrictsErrands(player.whisper) &&
          Whispers.canSatisfy(player.whisper, player.hand.concat(player.bidCards))) {
        tally.demands += 1;
        if (!player.obeyed) tally.defied += 1;
      }
    });

    Engine.beginPlay(state);
    while (state.phase === 'playing' || state.phase === 'trickComplete') {
      if (state.phase === 'playing') {
        // Measured at the moment of the lead: does this noble hold an agent
        // nothing unseen can beat?
        if (state.trick.length === 0) {
          const seat = state.turn;
          const seen = Engine.seenBy(state, seat);
          tally.leads += 1;
          if (state.players[seat].hand.some((c) => AI.isTopOutstanding(c, seen))) {
            tally.leadsWithWinner += 1;
          }
        }
        Engine.playComputerCard(state);
      } else {
        const plays = state.trick.slice();
        const winning = Rules.trickWinner(plays, state.trump);
        tally.tricks += 1;
        if (settledByTie(plays, state.trump, winning)) tally.tiedTricks += 1;
        if (state.trump && winning.card.suit === state.trump &&
            plays[0].card.suit !== state.trump) {
          tally.ruffs += 1;
        }
        Engine.completeTrick(state);
      }
    }

    const summary = state.handSummary;
    tally.nights += 1;
    summary.rows.forEach((row) => {
      tally.playerNights += 1;
      if (row.made) tally.exact += 1;
      if (row.foolsErrand && row.made) tally.foolsErrandsKept += 1;
      tally.nightFavour.push(row.points);
      (row.whisper ? tally.withWord : tally.withoutWord).push(row.points);
    });

    const totals = state.players.map((player) => player.score);
    const best = Math.max.apply(null, totals);
    leaderAfterEach.push(totals.indexOf(best));
  }

  const totals = state.players.map((player) => player.score).slice().sort((a, b) => b - a);
  tally.seasons += 1;
  tally.winnerTotals.push(totals[0]);
  tally.lastTotals.push(totals[3]);
  tally.margins.push(totals[0] - totals[1]);
  tally.spreads.push(totals[0] - totals[3]);
  totals.forEach((total) => {
    tally.finishes += 1;
    if (total < 0) tally.finishedNegative += 1;
  });

  let changes = 0;
  for (let i = 1; i < leaderAfterEach.length; i++) {
    if (leaderAfterEach[i] !== leaderAfterEach[i - 1]) changes += 1;
  }
  tally.leadChanges.push(changes);
  // A season still open going into Twelfth Night: whoever led after the
  // eleventh night was not the one who took it.
  const beforeLast = leaderAfterEach[leaderAfterEach.length - 2];
  const atEnd = leaderAfterEach[leaderAfterEach.length - 1];
  if (beforeLast !== atEnd) tally.wireFinishes += 1;
}

function measure(seasons) {
  const tally = blankTally();
  for (let season = 0; season < seasons; season++) playSeason(tally, 0x5eed + season * 7919);
  return tally;
}

function report(tally) {
  const rows = [
    ['Exact-pledge rate', (t) => pct(t.exact, t.playerNights).toFixed(1) + '%'],
    ['Mean pledge', (t) => mean(t.pledges).toFixed(2)],
    ['Audiences settled by a tie', (t) => pct(t.tiedTricks, t.tricks).toFixed(1) + '%'],
    ['Leads holding a provable winner', (t) => pct(t.leadsWithWinner, t.leads).toFixed(1) + '%'],
    ['Fool\u2019s errand rate', (t) => pct(t.foolsErrands, t.playerNights).toFixed(2) + '%'],
    ['Fool\u2019s errand success', (t) => pct(t.foolsErrandsKept, t.foolsErrands).toFixed(1) + '%'],
    ['Ruff wins', (t) => pct(t.ruffs, t.tricks).toFixed(1) + '%'],
    ['Mean night', (t) => mean(t.nightFavour).toFixed(2)],
    ['Season winner', (t) => mean(t.winnerTotals).toFixed(1)],
    ['Season last', (t) => mean(t.lastTotals).toFixed(1)],
    ['Player finishes negative', (t) => pct(t.finishedNegative, t.finishes).toFixed(2) + '%'],
    ['Final margin', (t) => mean(t.margins).toFixed(2)],
    ['Final spread', (t) => mean(t.spreads).toFixed(1)],
    ['Lead changes', (t) => mean(t.leadChanges).toFixed(2)],
    // Named for its own definition: other counts of a close finish will differ.
    ['Lead taken on Twelfth Night', (t) => pct(t.wireFinishes, t.seasons).toFixed(1) + '%'],
    ['Sway C / D / H / S / none', (t) => ['C', 'D', 'H', 'S', 'none']
      .map((k) => Math.round(pct(t.sway[k], t.nights))).join(' / ') + ' %'],
    ['Whisper take rate', (t) => pct(t.taken, t.offers).toFixed(1) + '%'],
    ['Cost of taking a word', (t) => (mean(t.withWord) - mean(t.withoutWord)).toFixed(2)],
    ['Word sd, against no word', (t) => sd(t.withWord).toFixed(2) + ' vs ' + sd(t.withoutWord).toFixed(2)],
    ['Demands defied', (t) => pct(t.defied, t.demands).toFixed(1) + '%']
  ];

  const label = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));
  for (const [name, render] of rows) {
    console.log(label(name, 36) + render(tally));
  }
}

const seasons = Number(process.argv[2]) || 300;
console.log(seasons + ' seasons, four computer nobles, Whispers on.\n');
report(measure(seasons));
