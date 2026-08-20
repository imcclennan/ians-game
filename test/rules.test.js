/*
 * Plain-node test suite. No dependencies: node test/rules.test.js
 * The logic files attach themselves to globalThis, so requiring them is enough.
 */
require('../js/cards.js');
require('../js/rules.js');
require('../js/whispers.js');
require('../js/ai.js');
require('../js/engine.js');

const { Cards, Rules, AI, Engine, Whispers } = globalThis;

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

function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

// --- deck ------------------------------------------------------------------

const deck = Cards.makeDeck();
check('the deck holds 60 agents', deck.length, 60);
check('no agent appears twice', new Set(deck.map((c) => c.id)).size, 60);
check('every suit has fifteen ranks', Cards.cardsOfSuit(deck, 'S').length, 15);
check('fifteen is the most influential', card('15S').value, 15);
check('one is the least', card('1S').value, 1);
check('two-digit ranks parse as one card', card('12H').rank, '12');
check('two-digit ranks keep their suit', card('12H').suit, 'H');

// --- bidding ---------------------------------------------------------------

check('four Fools pledge nothing', Rules.bidFromCards(hand('15C', '9C', '3C', '1C')), 0);
check('four Lovers pledge eight', Rules.bidFromCards(hand('1H', '2H', '3H', '15H')), 8);
check('standing at court is ignored', Rules.bidFromCards(hand('15H', '14H', '13H', '12H')), 8);
check('one of each pledges six', Rules.bidFromCards(hand('4S', '11H', '2D', '7C')), 6);
check('three Assassins and a Lover pledge eleven',
  Rules.bidFromCards(hand('4S', '5S', '6S', '2H')), 11);
check('four Assassins pledge twelve, which the court cannot give',
  Rules.bidFromCards(hand('4S', '5S', '6S', '7S')), 12);
ok('overreaching cannot pay as well as promising the lot',
  Rules.scoreHand(12, 11) < Rules.scoreHand(11, 11),
  'twelve at best pays ' + Rules.scoreHand(12, 11) + ', eleven kept pays ' + Rules.scoreHand(11, 11));
check('the most that can actually be kept', Rules.KEEPABLE_MAX, Rules.TRICKS_PER_HAND);

// --- following suit --------------------------------------------------------

const mixed = hand('15S', '4S', '13H', '2C');
check('you must answer with the agent that was sent',
  Rules.legalPlays(mixed, 'S').map((c) => c.id), ['15S', '4S']);
check('holding none of them, anyone may go',
  Rules.legalPlays(mixed, 'D').map((c) => c.id), ['15S', '4S', '13H', '2C']);
check('whoever opens may send anyone',
  Rules.legalPlays(mixed, null).length, 4);

// --- winning the trick -----------------------------------------------------

function trick(...ids) {
  return ids.map((id, seat) => ({ player: seat, card: card(id) }));
}

check('the most influential of the kind sent wins under No Sway',
  Rules.trickWinner(trick('5H', '13H', '2H', '9H'), null).player, 1);
check('another kind cannot win under No Sway',
  Rules.trickWinner(trick('5H', '15S', '15D', '15C'), null).player, 0);
check('the ruling suit beats the one that was sent',
  Rules.trickWinner(trick('15H', '2S', '13H', '3H'), 'S').player, 1);
check('the highest of the ruling suit takes it',
  Rules.trickWinner(trick('15H', '2S', '9S', '3H'), 'S').player, 2);
check('opening with the ruling suit is just an ordinary lead',
  Rules.trickWinner(trick('2S', '15S', '15H', '15D'), 'S').player, 1);
check('an agent of neither kind never wins',
  Rules.trickWinner(trick('7D', '2D', '15C', '15H'), 'S').player, 0);
check('rank 15 outranks rank 14',
  Rules.trickWinner(trick('14S', '15S'), 'H').player, 1);

// --- scoring ---------------------------------------------------------------

check('a pledge kept pays double', Rules.scoreHand(4, 4), 8);
check('a pledge of one kept pays two', Rules.scoreHand(1, 1), 2);
check('the full eleven kept pays twenty-two', Rules.scoreHand(11, 11), 22);
check('four audiences on a pledge of five', Rules.scoreHand(5, 4), 2);
check('six audiences on a pledge of three', Rules.scoreHand(3, 6), 0);
check('two audiences on a pledge of five', Rules.scoreHand(5, 2), -4);
check('none at all on a pledge of two', Rules.scoreHand(2, 0), -4);
check('pledging nothing and taking nothing is worth five', Rules.scoreHand(0, 0), 5);
check('one audience breaks it for five', Rules.scoreHand(0, 1), -5);
check('a second costs two more', Rules.scoreHand(0, 2), -7);
check('a third costs two more again', Rules.scoreHand(0, 3), -9);
check('a thoroughly broken promise', Rules.scoreHand(0, 7), -17);

// --- trump ladder ----------------------------------------------------------

check('nobody kept their word, so the Fools rule', Rules.trumpForNextHand(0), 'C');
check('one kept it, so the Merchants rule', Rules.trumpForNextHand(1), 'D');
check('two kept it, so the Lovers rule', Rules.trumpForNextHand(2), 'H');
check('three kept it, so the Assassins rule', Rules.trumpForNextHand(3), 'S');
check('all four kept it, so nobody rules', Rules.trumpForNextHand(4), null);
check('an empty sway reads as No Sway', Rules.trumpLabel(null), 'No Sway');
check('the ruling suit reads as its agents', Rules.trumpLabel('C'), 'Fools');

// --- deciding the game -----------------------------------------------------

check('fifteen agents are dealt to each noble', Rules.HAND_SIZE, 15);
check('four go out on errands', Rules.BID_CARDS, 4);
check('eleven audiences remain', Rules.TRICKS_PER_HAND, 11);
check('the season is won at fifty favour', Rules.TARGET_SCORE, 50);
check('the whole deck is dealt out',
  Rules.HAND_SIZE * Rules.PLAYER_COUNT, Cards.makeDeck().length);

function finalRow(name, total, points, bid, bidIds) {
  return { name: name, total: total, points: points, bid: bid, bidCards: hand.apply(null, bidIds) };
}

check('a clear lead wins outright',
  Rules.decideWinner([
    finalRow('You', 41, 6, 3, ['2S', '2C', '3C', '4C']),
    finalRow('Verane', 40, 4, 2, ['15S', '15H', '15D', '15C'])
  ]),
  { winners: ['You'], wasTied: false, reason: null });

check('level favour goes to the better session',
  Rules.decideWinner([
    finalRow('You', 40, 2, 1, ['15S', '15H', '15D', '15C']),
    finalRow('Verane', 40, 8, 4, ['2C', '3C', '4C', '5C'])
  ]),
  { winners: ['Verane'], wasTied: true, reason: 'more points that hand' });

check('still level goes to the bolder pledge',
  Rules.decideWinner([
    finalRow('You', 40, 4, 4, ['2C', '3C', '4C', '5C']),
    finalRow('Verane', 40, 4, 2, ['15S', '15H', '15D', '15C'])
  ]),
  { winners: ['You'], wasTied: true, reason: 'the higher bid' });

check('still level goes to the agents sent out',
  Rules.decideWinner([
    finalRow('You', 40, 4, 2, ['2H', '3C', '4C', '5C']),
    finalRow('Verane', 40, 4, 2, ['15H', '14C', '13C', '12C'])
  ]),
  { winners: ['Verane'], wasTied: true, reason: 'higher-ranked bid cards' });

check('three-way ties resolve to one winner',
  Rules.decideWinner([
    finalRow('You', 42, 4, 2, ['2H', '3C', '4C', '5C']),
    finalRow('Verane', 42, 4, 2, ['15H', '14C', '13C', '12C']),
    finalRow('Mors', 42, 4, 2, ['9H', '9C', '8C', '8C']),
    finalRow('Ilka', 12, 0, 1, ['2D', '2C', '3C', '4C'])
  ]),
  { winners: ['Verane'], wasTied: true, reason: 'higher-ranked bid cards' });

check('an identical finish is left as a shared win',
  Rules.decideWinner([
    finalRow('You', 40, 4, 2, ['15H', '14C', '13C', '12C']),
    finalRow('Verane', 40, 4, 2, ['15H', '14C', '13C', '12C'])
  ]),
  { winners: ['You', 'Verane'], wasTied: true, reason: null });

check('the standings sort by the same order',
  [
    finalRow('You', 40, 4, 2, ['2H', '3C', '4C', '5C']),
    finalRow('Verane', 41, 4, 2, ['15H', '14C', '13C', '12C']),
    finalRow('Mors', 40, 9, 2, ['9H', '9C', '8C', '8C'])
  ].sort(Rules.compareForWin).map((row) => row.name),
  ['Verane', 'Mors', 'You']);

// --- whispers --------------------------------------------------------------

check('there are fifteen whispers', Whispers.ALL.length, 15);
check('every whisper is uniquely named',
  new Set(Whispers.ALL.map((w) => w.name)).size, Whispers.ALL.length);
check('every whisper has a unique id',
  new Set(Whispers.ALL.map((w) => w.id)).size, Whispers.ALL.length);
for (const whisper of Whispers.ALL) {
  ok(whisper.name + ' explains itself in one line',
    typeof whisper.line === 'string' && whisper.line.length > 0);
  ok(whisper.name + ' says why it matters',
    typeof whisper.detail === 'string' && whisper.detail.length > 0);
  ok(whisper.name + ' carries a demand exactly when it restricts errands',
    !whisper.demand === (!whisper.allows && !whisper.permits));
}

const plainRow = { seat: 0, bid: 3, tricksWon: 3, counted: 3, made: true, takenWith: [] };
check('no whisper leaves favour alone', Whispers.adjust(null, 6, plainRow, [plainRow]), 6);
check('no whisper leaves the count alone', Whispers.countedTricks(null, 4), 4);
check('no whisper lets any agent go', Whispers.allowsCard(null, card('15S')), true);
check('no whisper keeps the ordinary test', Whispers.wasKept(null, plainRow, [plainRow]), true);

function row(fields) {
  return Object.assign(
    { seat: 0, bid: 3, tricksWon: 3, counted: 3, made: true, takenWith: [] }, fields);
}

// -- what you may send
const blackmailed = Whispers.BY_ID.blackmailed;
ok('Blackmailed refuses errands with no Assassin',
  !Whispers.permitsSet(blackmailed, hand('1C', '2C', '3C', '4C'), hand('1C', '2C', '3C', '4S')));
ok('Blackmailed accepts errands with one',
  Whispers.permitsSet(blackmailed, hand('1C', '2C', '3C', '4S'), hand('1C', '2C', '3C', '4S')));
ok('Blackmailed is waived on a hand holding no Assassin',
  Whispers.permitsSet(blackmailed, hand('1C', '2C', '3C', '4C'), hand('1C', '2C', '3C', '4C')));
check('Blackmailed pays five for a pledge kept',
  Whispers.adjust(blackmailed, 6, row({}), []), 11);
check('Blackmailed pays nothing for one broken',
  Whispers.adjust(blackmailed, -2, row({ made: false }), []), -2);

const silenced = Whispers.BY_ID.silenced;
ok('Sworn to Silence forbids an Assassin', !Whispers.allowsCard(silenced, card('9S')));
ok('Sworn to Silence permits every other kind', Whispers.allowsCard(silenced, card('9H')));
ok('Sworn to Silence refuses a set containing one',
  !Whispers.permitsSet(silenced, hand('1C', '2C', '3C', '4S')));

const smitten = Whispers.BY_ID.smitten;
ok('the Smitten will not send a Lover', !Whispers.allowsCard(smitten, card('9H')));
ok('the Smitten will send anyone else', Whispers.allowsCard(smitten, card('9S')));
ok('the Smitten refuses a set containing a Lover',
  !Whispers.permitsSet(smitten, hand('1C', '2C', '3C', '4H')));

const audited = Whispers.BY_ID.audited;
const fourPurses = hand('1D', '2D', '3D', '4D');
const richHand = hand('1D', '2D', '3D', '4D', '5D', '1C', '2C', '3C', '4C',
  '1S', '2S', '3S', '1H', '2H', '3H');
ok('the Audited must empty four Merchants when it holds five',
  Whispers.permitsSet(audited, fourPurses, richHand));
ok('the Audited may not hold three back',
  !Whispers.permitsSet(audited, hand('1D', '2D', '3D', '1C'), richHand));
const twoPurses = hand('1D', '2D', '1C', '2C', '3C', '4C', '5C',
  '1S', '2S', '3S', '4S', '1H', '2H', '3H', '4H');
ok('the Audited owes only what it holds',
  Whispers.permitsSet(audited, hand('1D', '2D', '1C', '2C'), twoPurses));
ok('the Audited still owes every one of them',
  !Whispers.permitsSet(audited, hand('1D', '1C', '2C', '3C'), twoPurses));
check('four Merchants make a pledge of four', Rules.bidFromCards(fourPurses), 4);
check('the Audited pays eight for a pledge kept',
  Whispers.adjust(audited, 8, row({ bid: 4, tricksWon: 4, counted: 4 }), []), 16);

// -- how your own result is scored
const debtor = Whispers.BY_ID.debtor;
check('a Debtor earns nothing for a small kept pledge',
  Whispers.adjust(debtor, 4, row({ bid: 2, tricksWon: 2, counted: 2 }), []), 0);
check('a Debtor is paid extra for a real one',
  Whispers.adjust(debtor, 8, row({ bid: 4, tricksWon: 4, counted: 4 }), []), 11);
check('a Debtor who breaks the pledge is scored normally',
  Whispers.adjust(debtor, -4, row({ bid: 2, made: false }), []), -4);

const allOrNothing = Whispers.BY_ID.allOrNothing;
check('All or Nothing doubles a pledge kept',
  Whispers.adjust(allOrNothing, 8, row({}), []), 16);
check('All or Nothing zeroes a pledge broken',
  Whispers.adjust(allOrNothing, -9, row({ made: false }), []), 0);
check('All or Nothing cannot turn a loss into a gain',
  Whispers.adjust(allOrNothing, -20, row({ made: false }), []), 0);

const clerk = Whispers.BY_ID.clerk;
check('the Clerk cannot lose favour', Whispers.adjust(clerk, -12, row({}), []), 0);
check('the Clerk is capped at six', Whispers.adjust(clerk, 22, row({}), []), 6);
check('the Clerk keeps a modest gain', Whispers.adjust(clerk, 4, row({}), []), 4);

// -- how you compare to the table
const bold = Whispers.BY_ID.bold;
const spread = [row({ seat: 0, bid: 6 }), row({ seat: 1, bid: 4 }),
  row({ seat: 2, bid: 2 }), row({ seat: 3, bid: 1 })];
check('the Bold are paid for the highest pledge outright',
  Whispers.adjust(bold, 3, spread[0], spread), 8);
check('the Bold are paid nothing for a middling pledge',
  Whispers.adjust(bold, 3, spread[1], spread), 3);
const tiedTop = [row({ bid: 6 }), row({ bid: 6 }), row({ bid: 2 }), row({ bid: 1 })];
check('a tie at the top pays the Bold nothing',
  Whispers.adjust(bold, 3, tiedTop[0], tiedTop), 3);

const meek = Whispers.BY_ID.meek;
check('the Meek are docked for a pledge tied at the floor',
  Whispers.adjust(meek, 2, row({ bid: 1, made: false }), spread.concat([row({ bid: 1 })])), -2);
check('the Meek keep their pledge for four',
  Whispers.adjust(meek, 2, spread[0], spread), 6);

const kingmaker = Whispers.BY_ID.kingmaker;
const courtInRuins = [
  row({ seat: 0, bid: 3, made: true }),
  row({ seat: 1, bid: 4, made: false }),
  row({ seat: 2, bid: 2, made: false }),
  row({ seat: 3, bid: 1, made: true })
];
check('a Kingmaker profits from every broken word but their own',
  Whispers.adjust(kingmaker, 6, courtInRuins[0], courtInRuins), 10);
check('a Kingmaker who broke their own word profits from none of it',
  Whispers.adjust(kingmaker, 1, courtInRuins[1], courtInRuins), 1);

const favourite = Whispers.BY_ID.favourite;
const audienceCount = [row({ tricksWon: 6 }), row({ tricksWon: 3 }),
  row({ tricksWon: 1 }), row({ tricksWon: 1 })];
check('the Favourite is paid for taking the most, outright',
  Whispers.adjust(favourite, 4, audienceCount[0], audienceCount), 10);
check('the Favourite is paid nothing for second place',
  Whispers.adjust(favourite, 4, audienceCount[1], audienceCount), 4);
const tiedMost = [row({ tricksWon: 5 }), row({ tricksWon: 5 }), row({ tricksWon: 1 })];
check('sharing the lead pays the Favourite nothing',
  Whispers.adjust(favourite, 4, tiedMost[0], tiedMost), 4);

const wallflower = Whispers.BY_ID.wallflower;
const quiet = [row({ tricksWon: 6 }), row({ tricksWon: 3 }),
  row({ tricksWon: 2 }), row({ tricksWon: 0 })];
check('the Wallflower is paid for taking the fewest, outright',
  Whispers.adjust(wallflower, 1, quiet[3], quiet), 7);
check('the Wallflower is paid nothing for second quietest',
  Whispers.adjust(wallflower, 1, quiet[2], quiet), 1);
const tiedFewest = [row({ tricksWon: 5 }), row({ tricksWon: 1 }), row({ tricksWon: 1 })];
check('sharing the silence pays the Wallflower nothing',
  Whispers.adjust(wallflower, 1, tiedFewest[1], tiedFewest), 1);

// -- how you win audiences
const swornToFool = Whispers.BY_ID.swornToFool;
check('Sworn to the Fool pays three an audience taken with one',
  Whispers.adjust(swornToFool, 4, row({ takenWith: hand('9C', '2C', '15S') }), []), 10);
check('Sworn to the Fool pays nothing for the others',
  Whispers.adjust(swornToFool, 4, row({ takenWith: hand('9S', '2H', '15D') }), []), 4);
check('Sworn to the Fool would rather win with a Fool',
  Whispers.favouredSuit(swornToFool), 'C');
check('nobody else has a favoured kind',
  Whispers.ALL.filter((w) => w.favouredSuit).length, 1);

// -- inversion and misdirection
const contrarian = Whispers.BY_ID.contrarian;
check('a Contrarian counts what it did not win', Whispers.countedTricks(contrarian, 3), 8);
check('a Contrarian aims at the complement of its pledge', Whispers.aimFor(contrarian, 8), 3);
check('a Contrarian pledges the complement of its strength',
  Whispers.pledgeFor(contrarian, 3), 8);
check('a Contrarian who pledged eight and won three is paid as a kept three, plus two',
  Whispers.adjust(contrarian, 0, row({ bid: 8, tricksWon: 3, counted: 8, made: true }), []),
  Rules.scoreHand(3, 3) + 2);
check('a Contrarian who wins too many is paid as a missed three',
  Whispers.adjust(contrarian, 0, row({ bid: 8, tricksWon: 5, counted: 6, made: false }), []),
  Rules.scoreHand(3, 5));

const understudy = Whispers.BY_ID.understudy;
const stage = [
  row({ seat: 0, bid: 2, tricksWon: 5, counted: 5 }),
  row({ seat: 1, bid: 5, tricksWon: 3, counted: 3 }),
  row({ seat: 2, bid: 1, tricksWon: 2, counted: 2 }),
  row({ seat: 3, bid: 4, tricksWon: 1, counted: 1 })
];
check('an Understudy is judged against the noble on their left',
  Whispers.wasKept(understudy, stage[0], stage), true);
check('an Understudy who matches their own pledge instead has missed',
  Whispers.wasKept(understudy, stage[2], stage), false);
check('an Understudy who hits the borrowed number takes the pair of bonuses',
  Whispers.adjust(understudy, 0, Object.assign({}, stage[0], { made: true }), stage),
  Rules.scoreHand(5, 5) + 3 + 5);
check('an Understudy who misses it takes only the three',
  Whispers.adjust(understudy, 0, Object.assign({}, stage[2], { made: false }), stage),
  Rules.scoreHand(4, 2) + 3);

// Dealing four at a time should never repeat a whisper.
for (let seed = 1; seed <= 50; seed++) {
  const dealt = Whispers.deal(Rules.PLAYER_COUNT, seededRandom(seed));
  check('four whispers are dealt', dealt.length, Rules.PLAYER_COUNT);
  check('no two nobles share a whisper', new Set(dealt.map((w) => w.id)).size, Rules.PLAYER_COUNT);
}

// Whispers are optional, and the game must be whole without them.
const plainGame = Engine.createGame({ dealer: 0, rng: seededRandom(4242), whispers: false });
plainGame.players[0].isHuman = false;
Engine.startHand(plainGame);
ok('no whispers are dealt when they are switched off',
  plainGame.players.every((player) => player.whisper === null));
Engine.submitComputerBids(plainGame);
Engine.beginPlay(plainGame);
while (plainGame.phase === 'playing' || plainGame.phase === 'trickComplete') {
  if (plainGame.phase === 'playing') Engine.playComputerCard(plainGame);
  else Engine.completeTrick(plainGame);
}
for (const summary of plainGame.history) {
  for (const plainSession of summary.rows) {
    check('without whispers the count is simply the audiences won',
      plainSession.counted, plainSession.tricksWon);
    check('without whispers favour is exactly the rules',
      plainSession.points, Rules.scoreHand(plainSession.bid, plainSession.tricksWon));
  }
}

// --- seating ---------------------------------------------------------------

check('play rotates clockwise', [0, 1, 2, 3].map(Rules.leftOf), [1, 2, 3, 0]);

// --- full games, computer players only -------------------------------------

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
    if (dealt !== 60) throw new Error('dealt ' + dealt + ' agents');

    Engine.submitComputerBids(state);
    const inPlay = state.players.reduce((n, p) => n + p.hand.length, 0);
    if (inPlay !== 44) throw new Error('after pledging ' + inPlay + ' agents remain');

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
    if (tricks !== Rules.TRICKS_PER_HAND) throw new Error('session had ' + tricks + ' audiences');
    if (state.playedCards.length !== 44) throw new Error('played ' + state.playedCards.length);
  }
  return { state: state, trumpsSeen: trumpsSeen };
}

const game = playWholeGame(20260820);
ok('a full game reaches a winner', game.state.phase === 'gameOver', 'phase=' + game.state.phase);
ok('the winner is at or past the target',
  Math.max(...game.state.players.map((p) => p.score)) >= game.state.target);
check('a finished game names exactly one winner', game.state.winners.length, 1);
check('the opening session is played at No Sway', game.trumpsSeen[0], null);
ok('the dealer rotated left every hand',
  game.state.dealer === (game.state.history.length - 1) % 4,
  'dealer=' + game.state.dealer + ' hands=' + game.state.history.length);

for (const summary of game.state.history) {
  const total = summary.rows.reduce((n, row) => n + row.tricksWon, 0);
  ok('session ' + summary.handNumber + ' has eleven audiences', total === 11, 'total=' + total);
  ok('session ' + summary.handNumber + ' passes sway down the ladder',
    summary.nextTrump === Rules.trumpForNextHand(summary.madeCount));
  ok('session ' + summary.handNumber + ' gave every noble a different whisper',
    new Set(summary.rows.map((row) => row.whisper.id)).size === Rules.PLAYER_COUNT);
  for (const row of summary.rows) {
    ok('session ' + summary.handNumber + ' sent exactly four agents',
      row.bidCards.length === Rules.BID_CARDS);
    ok('session ' + summary.handNumber + ' obeyed the whisper',
      Whispers.permitsSet(row.whisper, row.bidCards, row.bidCards.concat([])) ||
      !Whispers.canSatisfy(row.whisper, row.bidCards));
  }
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
      bidTotal += Whispers.aimFor(row.whisper, row.bid);
      bidCount++;
      ok('pledges stay within 0-12', row.bid >= 0 && row.bid <= 12, 'pledge=' + row.bid);
      check('the counted audiences follow the whisper for ' + row.whisper.id,
        row.counted, Whispers.countedTricks(row.whisper, row.tricksWon));
      check('the base favour follows the rules for ' + row.bid + ' / ' + row.counted,
        row.base, Rules.scoreHand(row.bid, row.counted));
      check('the whisper decides whether the pledge was kept',
        row.made, Whispers.wasKept(row.whisper, row, summary.rows));
      check('the audiences taken match what they were taken with',
        row.takenWith.length, row.tricksWon);
    }
  }
}
ok('twenty games produced hands', handsPlayed > 20, 'hands=' + handsPlayed);

// What the nobles are really aiming at -- a Contrarian promises the complement
// of the pledge it shows -- should add up to roughly the audiences on offer.
const averageTableBid = (bidTotal / bidCount) * 4;
ok('the table aims at roughly the audiences on offer',
  averageTableBid > 9 && averageTableBid < 13,
  'average table aim = ' + averageTableBid.toFixed(2));

// --- the AI follows the rules it is given -----------------------------------

const aiHand = hand('15S', '4S', '13H', '2C', '9D');
const openTrick = [{ player: 0, card: card('7S') }];
const forced = AI.chooseCard({
  hand: aiHand, trick: openTrick, trump: 'H', bid: 3, tricksWon: 0, seen: new Set()
});
ok('a noble answers with the kind that was sent', forced.suit === 'S', 'played ' + forced.id);

const ducking = AI.chooseCard({
  hand: aiHand, trick: openTrick, trump: 'H', bid: 1, tricksWon: 1, seen: new Set()
});
check('a noble ducks once the pledge is filled', ducking.id, '4S');

const grabbing = AI.chooseCard({
  hand: aiHand, trick: [
    { player: 0, card: card('7S') },
    { player: 1, card: card('8S') },
    { player: 2, card: card('11S') }
  ], trump: 'H', bid: 3, tricksWon: 0, seen: new Set()
});
check('a noble takes the audience it still needs from last seat', grabbing.id, '15S');

const strongHand = hand('15S', '14S', '13S', '15H', '14H', '15D', '14D', '13D', '12D',
  '9C', '5C', '4C', '3C', '2C', '1C');
const bidCards = AI.chooseBidCards(strongHand, null, 1, null);
check('a noble sends out exactly four agents', bidCards.length, Rules.BID_CARDS);
ok('the pledge chosen matches the hand it leaves behind',
  Math.abs(Rules.bidFromCards(bidCards) - AI.estimateTricks(Cards.removeCards(strongHand, bidCards), null)) < 1,
  'pledged ' + Rules.bidFromCards(bidCards) + ' by sending ' + bidCards.map((c) => c.id).join(' '));

const weakHand = hand('7S', '5S', '2S', '9H', '6H', '3H', '8D', '4D', '2D',
  '10C', '7C', '6C', '2C', '1D', '1H');
const weakBid = Rules.bidFromCards(AI.chooseBidCards(weakHand, null, 1, null));
ok('a hand of nobodies pledges low', weakBid <= 2, 'pledged ' + weakBid);

const silencedPick = AI.chooseBidCards(strongHand, null, 1, Whispers.BY_ID.silenced);
ok('a silenced noble sends no Assassin',
  !silencedPick.some((c) => c.suit === 'S'), silencedPick.map((c) => c.id).join(' '));

const blackmailedPick = AI.chooseBidCards(strongHand, null, 1, Whispers.BY_ID.blackmailed);
ok('a blackmailed noble sends at least one',
  blackmailedPick.some((c) => c.suit === 'S'), blackmailedPick.map((c) => c.id).join(' '));

const contrarianPick = Rules.bidFromCards(
  AI.chooseBidCards(weakHand, null, 1, Whispers.BY_ID.contrarian));
ok('a Contrarian on a weak hand pledges high', contrarianPick >= 7, 'pledged ' + contrarianPick);

ok('no noble is tempted to promise more than the court can give',
  Rules.bidFromCards(AI.chooseBidCards(strongHand, null, 1, Whispers.BY_ID.bold)) <= Rules.KEEPABLE_MAX);

const nothingButFools = hand('1C', '2C', '3C', '4C', '5C', '6C', '7C', '8C',
  '9C', '10C', '11C', '12C', '13C', '14C', '15C');
check('a hand of nothing but Fools can only pledge nothing',
  Rules.bidFromCards(AI.chooseBidCards(nothingButFools, null, 1, null)), 0);

// --- report ----------------------------------------------------------------

if (failures.length) {
  console.log(failures.length + ' failed, ' + passed + ' passed\n');
  for (const failure of failures) console.log('  FAIL ' + failure);
  process.exit(1);
}
console.log('all ' + passed + ' checks passed');
