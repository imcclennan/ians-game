/*
 * Plain-node test suite. No dependencies: node test/rules.test.js
 * The logic files attach themselves to globalThis, so requiring them is enough.
 */
require('../js/cards.js');
require('../js/rules.js');
require('../js/ai.js');
require('../js/engine.js');

const { Cards, Rules, AI, Engine } = globalThis;

let passed = 0;
const failures = [];

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) passed++;
  else failures.push(label + '\n    expected ' + e + '\n    actual   ' + a);
}

function ok(label, condition, detail) {
  if (condition) passed++;
  else failures.push(label + (detail ? '\n    ' + detail : ''));
}

const card = (id) => Cards.makeCard(id.slice(-1), id.slice(0, -1));
const hand = (...ids) => ids.map(card);

// --- deck ------------------------------------------------------------------

const deck = Cards.makeDeck();
check('deck has 52 cards', deck.length, 52);
check('deck has no duplicates', new Set(deck.map((c) => c.id)).size, 52);
check('ace is high', card('AS').value, 14);
check('two is low', card('2S').value, 2);
check('ten parses as one card', card('10H').rank, '10');

// --- bidding ---------------------------------------------------------------

check('three spades bid nine', Rules.bidFromCards(hand('2S', '7S', 'KS')), 9);
check('three clubs bid zero', Rules.bidFromCards(hand('AC', '9C', '3C')), 0);
check('spade + heart + diamond bid six', Rules.bidFromCards(hand('4S', 'JH', '2D')), 6);
check('rank is ignored', Rules.bidFromCards(hand('AH', '2H', '3H')), 6);
check('mixed bid of four', Rules.bidFromCards(hand('5S', '5D', 'KC')), 4);

// --- following suit --------------------------------------------------------

const mixed = hand('AS', '4S', 'KH', '2C');
check('must follow suit when able',
  Rules.legalPlays(mixed, 'S').map((c) => c.id), ['AS', '4S']);
check('anything goes when void',
  Rules.legalPlays(mixed, 'D').map((c) => c.id), ['AS', '4S', 'KH', '2C']);
check('leader may play anything',
  Rules.legalPlays(mixed, null).length, 4);

// --- winning the trick -----------------------------------------------------

function trick(...ids) {
  return ids.map((id, seat) => ({ player: seat, card: card(id) }));
}

check('highest of the led suit wins at no trump',
  Rules.trickWinner(trick('5H', 'KH', '2H', '9H'), null).player, 1);
check('off-suit cards cannot win at no trump',
  Rules.trickWinner(trick('5H', 'AS', 'AD', 'AC'), null).player, 0);
check('trump beats the led suit',
  Rules.trickWinner(trick('AH', '2S', 'KH', '3H'), 'S').player, 1);
check('the highest trump wins',
  Rules.trickWinner(trick('AH', '2S', '9S', '3H'), 'S').player, 2);
check('a led trump is still just the led suit',
  Rules.trickWinner(trick('2S', 'AS', 'AH', 'AD'), 'S').player, 1);
check('discarding off-suit never wins',
  Rules.trickWinner(trick('7D', '2D', 'AC', 'AH'), 'S').player, 0);

// --- scoring ---------------------------------------------------------------

check('exact bid pays double', Rules.scoreHand(4, 4), 8);
check('exact bid of one pays two', Rules.scoreHand(1, 1), 2);
check('four tricks on a bid of five', Rules.scoreHand(5, 4), 2);
check('six tricks on a bid of three', Rules.scoreHand(3, 6), 0);
check('two tricks on a bid of five', Rules.scoreHand(5, 2), -4);
check('no tricks on a bid of two', Rules.scoreHand(2, 0), -4);
check('a made nil is worth five', Rules.scoreHand(0, 0), 5);
check('a broken nil costs five', Rules.scoreHand(0, 1), -5);
check('a badly broken nil still costs exactly five', Rules.scoreHand(0, 7), -5);

// --- trump ladder ----------------------------------------------------------

check('nobody made it', Rules.trumpForNextHand(0), 'C');
check('one made it', Rules.trumpForNextHand(1), 'D');
check('two made it', Rules.trumpForNextHand(2), 'H');
check('three made it', Rules.trumpForNextHand(3), 'S');
check('everybody made it', Rules.trumpForNextHand(4), null);
check('no trump reads as No Trump', Rules.trumpLabel(null), 'No Trump');

// --- seating ---------------------------------------------------------------

check('play rotates clockwise', [0, 1, 2, 3].map(Rules.leftOf), [1, 2, 3, 0]);

// --- full games, computer players only -------------------------------------

function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function playWholeGame(seed) {
  const state = Engine.createGame({ dealer: 0, rng: seededRandom(seed) });
  state.players[0].isHuman = false;
  state.players[0].aggression = 1;
  const trumpsSeen = [];
  let guard = 0;

  while (state.phase !== 'gameOver' && guard++ < 200) {
    Engine.startHand(state);
    trumpsSeen.push(state.trump);

    const dealt = state.players.reduce((n, p) => n + p.hand.length, 0);
    if (dealt !== 52) throw new Error('dealt ' + dealt + ' cards');

    Engine.submitComputerBids(state);
    const inPlay = state.players.reduce((n, p) => n + p.hand.length, 0);
    if (inPlay !== 40) throw new Error('after bidding ' + inPlay + ' cards remain');

    Engine.beginPlay(state);
    let leadSeat = state.leader;
    while (state.phase === 'playing' || state.phase === 'trickComplete') {
      if (state.phase === 'playing') {
        if (state.trick.length === 0 && state.turn !== leadSeat) {
          throw new Error('wrong player leading');
        }
        Engine.playComputerCard(state);
      } else {
        Engine.completeTrick(state);
        leadSeat = state.leader;
      }
    }

    const tricks = state.players.reduce((n, p) => n + p.tricksWon, 0);
    if (tricks !== Rules.TRICKS_PER_HAND) throw new Error('hand had ' + tricks + ' tricks');
    if (state.playedCards.length !== 40) throw new Error('played ' + state.playedCards.length);
  }
  return { state: state, trumpsSeen: trumpsSeen };
}

const game = playWholeGame(20260820);
ok('a full game reaches a winner', game.state.phase === 'gameOver', 'phase=' + game.state.phase);
ok('the winner is at or past the target',
  Math.max(...game.state.players.map((p) => p.score)) >= game.state.target);
check('the first hand is played at No Trump', game.trumpsSeen[0], null);
ok('the dealer rotated left every hand',
  game.state.dealer === (game.state.history.length - 1) % 4,
  'dealer=' + game.state.dealer + ' hands=' + game.state.history.length);

for (const summary of game.state.history) {
  const total = summary.rows.reduce((n, row) => n + row.tricksWon, 0);
  ok('hand ' + summary.handNumber + ' has ten tricks', total === 10, 'total=' + total);
  ok('hand ' + summary.handNumber + ' trump follows the ladder',
    summary.nextTrump === Rules.trumpForNextHand(summary.madeCount));
}

for (let i = 1; i < game.state.history.length; i++) {
  const previous = game.state.history[i - 1];
  ok('hand ' + (i + 1) + ' uses the trump the previous hand set',
    game.state.history[i].trump === previous.nextTrump);
}

// Twenty more games, purely as a crash and invariant sweep.
let handsPlayed = 0;
let bidTotal = 0;
let bidCount = 0;
for (let seed = 1; seed <= 20; seed++) {
  const run = playWholeGame(seed * 7919);
  handsPlayed += run.state.history.length;
  for (const summary of run.state.history) {
    for (const row of summary.rows) {
      bidTotal += row.bid;
      bidCount++;
      ok('bids stay within 0-9', row.bid >= 0 && row.bid <= 9, 'bid=' + row.bid);
      check('the score matches the rules for bid ' + row.bid + ' / ' + row.tricksWon,
        row.points, Rules.scoreHand(row.bid, row.tricksWon));
    }
  }
}
ok('twenty games produced hands', handsPlayed > 20, 'hands=' + handsPlayed);

// The four bids should add up to roughly the ten tricks available.
const averageTableBid = (bidTotal / bidCount) * 4;
ok('computer bids are in a sane range',
  averageTableBid > 6 && averageTableBid < 14,
  'average table bid = ' + averageTableBid.toFixed(2));

// --- the AI follows the rules it is given -----------------------------------

const aiHand = hand('AS', '4S', 'KH', '2C', '9D');
const openTrick = [{ player: 0, card: card('7S') }];
const forced = AI.chooseCard({
  hand: aiHand, trick: openTrick, trump: 'H', bid: 3, tricksWon: 0, seen: new Set()
});
ok('the AI follows suit when it can', forced.suit === 'S', 'played ' + forced.id);

const ducking = AI.chooseCard({
  hand: aiHand, trick: openTrick, trump: 'H', bid: 1, tricksWon: 1, seen: new Set()
});
check('the AI ducks once its bid is filled', ducking.id, '4S');

const grabbing = AI.chooseCard({
  hand: aiHand, trick: [
    { player: 0, card: card('7S') },
    { player: 1, card: card('8S') },
    { player: 2, card: card('JS') }
  ], trump: 'H', bid: 3, tricksWon: 0, seen: new Set()
});
check('the AI takes the trick it needs from fourth seat', grabbing.id, 'AS');

const strongHand = hand('AS', 'KS', 'QS', 'AH', 'KH', 'AD', 'KD', 'QD', 'JD', '9C', '5C', '4C', '3C');
const bidCards = AI.chooseBidCards(strongHand, null, 1);
check('the AI sets aside exactly three cards', bidCards.length, 3);
ok('the bid the AI picks matches the hand it keeps',
  Math.abs(Rules.bidFromCards(bidCards) - AI.estimateTricks(Cards.removeCards(strongHand, bidCards), null)) < 1,
  'bid ' + Rules.bidFromCards(bidCards) + ' from discarding ' + bidCards.map((c) => c.id).join(' '));

const weakHand = hand('7S', '5S', '2S', '9H', '6H', '3H', '8D', '4D', '2D', '10C', '7C', '6C', '2C');
const weakBid = Rules.bidFromCards(AI.chooseBidCards(weakHand, null, 1));
ok('a hand with no honours bids low', weakBid <= 2, 'bid ' + weakBid);

// --- report ----------------------------------------------------------------

if (failures.length) {
  console.log(failures.length + ' failed, ' + passed + ' passed\n');
  for (const failure of failures) console.log('  FAIL ' + failure);
  process.exit(1);
}
console.log('all ' + passed + ' checks passed');
