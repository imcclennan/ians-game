/*
 * Plain-node test suite. No dependencies: node test/rules.test.js
 * The logic files attach themselves to globalThis, so requiring them is enough.
 */
require('../js/cards.js');
require('../js/rules.js');
require('../js/whispers.js');
require('../js/whispercard.js');
require('../js/rulebook.js');
require('../js/ai.js');
require('../js/engine.js');

const { Cards, Rules, AI, Engine, Whispers, WhisperCard, Rulebook } = globalThis;

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

/**
 * An expectation that is correct but that the game does not meet yet. It is
 * recorded and reported rather than failing the run, so a known defect stays
 * visible without a red suite hiding a real regression behind it. Anything
 * fixed here should be turned back into an ok().
 */
const known = [];
function knownIssue(label, condition, detail) {
  if (condition) failures.push('FIXED, promote this back to ok(): ' + label);
  else known.push(label + (detail ? '\n    ' + detail : ''));
}

/**
 * A card from a short name: '15S', or '10S/1' for the second copy of a doubled
 * rank. Ids themselves always carry the copy number.
 */
const card = (name) => {
  const [face, copy] = name.split('/');
  return Cards.makeCard(face.slice(-1), face.slice(0, -1), Number(copy) || 0);
};
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

check('four Fools pledge nothing', Rules.bidFromCards(hand('1C', '2C', '3C', '4C')), 0);
check('four Lovers pledge eight', Rules.bidFromCards(hand('1H', '2H', '4H', '6H')), 8);
check('standing at court is ignored', Rules.bidFromCards(hand('2H', '4H', '12H', '14H')), 8);
check('one of each pledges five', Rules.bidFromCards(hand('11S', '2H', '7D', '3C')), 5);
check('three Assassins and a Lover pledge eleven',
  Rules.bidFromCards(hand('11S', '12S', '13S', '2H')), 11);
check('four Assassins pledge twelve, which the court cannot give',
  Rules.bidFromCards(hand('11S', '12S', '13S', '14S')), 12);
ok('overreaching cannot pay as well as promising the lot',
  Rules.scoreHand(12, 11) < Rules.scoreHand(11, 11),
  'twelve at best pays ' + Rules.scoreHand(12, 11) + ', eleven kept pays ' + Rules.scoreHand(11, 11));
check('the most that can actually be kept', Rules.KEEPABLE_MAX, Rules.TRICKS_PER_HAND);

// --- following suit --------------------------------------------------------

const mixed = hand('15S', '4S', '13H', '2C');
check('you must answer with the agent that was sent',
  Rules.legalPlays(mixed, 'S').map((c) => c.id), ['15S0', '4S0']);
check('holding none of them, anyone may go',
  Rules.legalPlays(mixed, 'D').map((c) => c.id), ['15S0', '4S0', '13H0', '2C0']);
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
check('a season runs twelve nights', Rules.SEASON_LENGTH, 12);
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

check('there are twenty-two whispers', Whispers.ALL.length, 22);
check('seven of them are burdens', Whispers.ALL.filter((w) => w.burden).length, 7);
for (const whisper of Whispers.ALL.filter((w) => w.burden)) {
  ok(whisper.name + ' is marked as a burden', Whispers.isBurden(whisper));
}
ok('no ordinary whisper is marked as a burden',
  Whispers.ALL.filter((w) => !w.burden).every((w) => !Whispers.isBurden(w)));

// A burden must be indistinguishable face down, so only the face may differ.
for (const whisper of Whispers.ALL) {
  const face = WhisperCard.html(whisper);
  ok(whisper.name + ' prints a card face', face.indexOf('wcard-frame') > 0);
  check(whisper.name + ' is framed according to its nature',
    face.indexOf('wcard-burden') > 0, !!whisper.burden);
  ok(whisper.name + ' signs itself',
    face.indexOf(whisper.burden ? 'A Burden' : 'A Whisper') > 0);
}
check('an absent whisper prints nothing', WhisperCard.html(null), '');
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

// --- the printed edition says the same thing --------------------------------
// print/fools-court-card-source/whispers-data.js is a hand transcription of the
// array above, and the card renderer reads it rather than the game. It has gone
// an edition stale once already, which is twenty-two wrong cards at the printer
// before anybody notices. The transcription sets `--` as a real em dash and a
// leading minus as U+2212, so compare through that.

const PRINTED = require('../print/fools-court-card-source/whispers-data.js');

function asPrinted(text) {
  return String(text)
    .replace(/--/g, '\u2014')
    .replace(/(^|\s)-(?=\d)/g, '$1\u2212');
}

check('the printed edition carries every whisper, in the order they are dealt',
  PRINTED.map((w) => w.id), Whispers.ALL.map((w) => w.id));
check('and seven of them are burdens there too',
  PRINTED.filter((w) => w.burden).length, 7);
for (let i = 0; i < Math.min(PRINTED.length, Whispers.ALL.length); i++) {
  const word = Whispers.ALL[i];
  const printed = PRINTED[i];
  if (word.id !== printed.id) continue;   // the order check above has it
  check('the printed ' + word.name + ' is named as the game names it',
    printed.name, word.name);
  check('the printed ' + word.name + ' is signed as the game signs it',
    printed.signed, word.signed);
  check('the printed ' + word.name + ' rules as the game rules',
    printed.line, asPrinted(word.line));
  check('the printed ' + word.name + ' reads as the game reads',
    printed.detail, asPrinted(word.detail));
  check('the printed ' + word.name + ' is framed as the game frames it',
    !!printed.burden, !!word.burden);
}

// --- the rulebook renders ---------------------------------------------------
// The prose is built from the game's own data, so a rename in the deck or the
// deck or the constants can break it without any assertion above noticing.

function rulebookCheck(label) {
  let sections = null;
  let error = null;
  try {
    sections = Rulebook.sections();
  } catch (problem) {
    error = problem;
  }
  ok(label + ': the rulebook builds', !error, error && error.message);
  if (!sections) return;
  ok(label + ': every section has a title and a body',
    sections.every((section) => section.title && section.html && section.html.length > 20));
  ok(label + ': no cross-reference is left unresolved',
    sections.every((section) => !/\{\{/.test(section.html)));
  const html = sections.map((section) => section.html).join('');
  ok(label + ': nothing rendered as undefined or NaN',
    !/undefined|NaN|\[object/.test(html));
}
rulebookCheck('under A');

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
check('Blackmailed pays six for a pledge kept',
  Whispers.adjust(blackmailed, 6, row({}), []), 12);
check('Blackmailed pays nothing for one broken',
  Whispers.adjust(blackmailed, -2, row({ made: false }), []), -2);

const silenced = Whispers.BY_ID.silenced;
ok('Sworn to Silence forbids an Assassin', !Whispers.allowsCard(silenced, card('11S')));
ok('Sworn to Silence permits every other kind', Whispers.allowsCard(silenced, card('8H')));
ok('Sworn to Silence refuses a set containing one',
  !Whispers.permitsSet(silenced, hand('1C', '2C', '3C', '11S')));

const smitten = Whispers.BY_ID.smitten;
ok('the Smitten will not send a Lover', !Whispers.allowsCard(smitten, card('8H')));
ok('the Smitten will send anyone else', Whispers.allowsCard(smitten, card('11S')));
ok('the Smitten refuses a set containing a Lover',
  !Whispers.permitsSet(smitten, hand('1C', '2C', '3C', '4H')));

const audited = Whispers.BY_ID.audited;
const noPurses = hand('1C', '2C', '3C', '4C', '5C', '1C/1', '2C/1', '3C/1',
  '11S', '12S', '13S', '14S', '1H', '2H', '4H');
ok('a hand short of Merchants cannot satisfy the Audited',
  !Whispers.canSatisfy(audited, noPurses));
ok('and so the demand is waived for it',
  Whispers.permitsSet(audited, hand('1C', '2C', '3C', '4C'), noPurses));
const noFools = hand('1D', '2D', '3D', '4D', '5D', '6D', '7D', '8D',
  '1S', '2S', '3S', '4S', '1H', '2H', '3H');
ok('a hand short of Fools cannot satisfy it either',
  !Whispers.canSatisfy(audited, noFools));

check('the Audited pays six for the pledge it was handed',
  Whispers.adjust(audited, 4, row({ bid: 2, tricksWon: 2, counted: 2 }), []), 10);
check('the Audited pays nothing for one broken',
  Whispers.adjust(audited, -4, row({ bid: 2, made: false }), []), -4);

// -- how your own result is scored
const debtor = Whispers.BY_ID.debtor;
check('a Debtor earns nothing for a small kept pledge',
  Whispers.adjust(debtor, 4, row({ bid: 2, tricksWon: 2, counted: 2 }), []), 0);
check('a Debtor is paid extra for a real one',
  Whispers.adjust(debtor, 8, row({ bid: 4, tricksWon: 4, counted: 4 }), []), 13);
check('a Debtor who breaks the pledge is scored normally',
  Whispers.adjust(debtor, -4, row({ bid: 2, made: false }), []), -4);

const allOrNothing = Whispers.BY_ID.allOrNothing;
check('All or Nothing doubles a pledge kept',
  Whispers.adjust(allOrNothing, 8, row({}), []), 16);
check('All or Nothing costs one for an audience missed by one',
  Whispers.adjust(allOrNothing, -9, row({ bid: 3, counted: 4, made: false }), []), -1);
check('and three for a pledge missed by three',
  Whispers.adjust(allOrNothing, -20, row({ bid: 3, counted: 6, made: false }), []), -3);
check('the same either side of the pledge',
  Whispers.adjust(allOrNothing, 7, row({ bid: 6, counted: 3, made: false }), []), -3);
ok('and whatever else the night was worth counts for nothing',
  Whispers.adjust(allOrNothing, 20, row({ bid: 3, counted: 5, made: false }), []) ===
  Whispers.adjust(allOrNothing, -20, row({ bid: 3, counted: 5, made: false }), []));

// -- how you compare to the table
const bold = Whispers.BY_ID.bold;
const spread = [row({ seat: 0, bid: 6 }), row({ seat: 1, bid: 4 }),
  row({ seat: 2, bid: 2 }), row({ seat: 3, bid: 1 })];
check('the Bold are paid for the highest pledge',
  Whispers.adjust(bold, 3, spread[0], spread), 7);
check('the Bold are paid nothing for a middling pledge',
  Whispers.adjust(bold, 3, spread[1], spread), 3);
const tiedTop = [row({ bid: 6 }), row({ bid: 6 }), row({ bid: 2 }), row({ bid: 1 })];
check('and a tie at the top pays them just the same',
  Whispers.adjust(bold, 3, tiedTop[0], tiedTop), 7);

const kingmaker = Whispers.BY_ID.kingmaker;
const courtInRuins = [
  row({ seat: 0, bid: 3, made: true }),
  row({ seat: 1, bid: 4, made: false }),
  row({ seat: 2, bid: 2, made: false }),
  row({ seat: 3, bid: 1, made: true })
];
check('a Kingmaker profits from every broken word but their own',
  Whispers.adjust(kingmaker, 6, courtInRuins[0], courtInRuins), 12);
check('a Kingmaker who broke their own word profits from none of it',
  Whispers.adjust(kingmaker, 1, courtInRuins[1], courtInRuins), 1);

const favourite = Whispers.BY_ID.favourite;
const audienceCount = [row({ tricksWon: 6 }), row({ tricksWon: 3 }),
  row({ tricksWon: 1 }), row({ tricksWon: 1 })];
check('the Favourite is paid for taking the most',
  Whispers.adjust(favourite, 4, audienceCount[0], audienceCount), 10);
check('the Favourite is paid nothing for second place',
  Whispers.adjust(favourite, 4, audienceCount[1], audienceCount), 4);
const tiedMost = [row({ tricksWon: 5 }), row({ tricksWon: 5 }), row({ tricksWon: 1 })];
check('and sharing the lead pays it too',
  Whispers.adjust(favourite, 4, tiedMost[0], tiedMost), 10);

const wallflower = Whispers.BY_ID.wallflower;
const quiet = [row({ tricksWon: 6 }), row({ tricksWon: 3 }),
  row({ tricksWon: 2 }), row({ tricksWon: 0 })];
check('the Wallflower is paid for taking the fewest',
  Whispers.adjust(wallflower, 1, quiet[3], quiet), 6);
check('the Wallflower is paid nothing for second quietest',
  Whispers.adjust(wallflower, 1, quiet[2], quiet), 1);
const tiedFewest = [row({ tricksWon: 5 }), row({ tricksWon: 1 }), row({ tricksWon: 1 })];
check('and sharing the silence pays it too',
  Whispers.adjust(wallflower, 1, tiedFewest[1], tiedFewest), 6);

// -- how you win audiences
const swornToFool = Whispers.BY_ID.swornToFool;
check('Sworn to the Fool would rather win with a Fool',
  Whispers.favouredSuit(swornToFool), 'C');
check('only the two words that want a Fool in the room have a favoured kind',
  Whispers.ALL.filter((w) => w.favouredSuit).map((w) => w.id), ['swornToFool', 'beggar']);

// -- misdirection
const understudy = Whispers.BY_ID.understudy;
const stage = [
  row({ seat: 0, bid: 2, tricksWon: 5, counted: 5 }),
  row({ seat: 1, bid: 5, tricksWon: 3, counted: 3 }),
  row({ seat: 2, bid: 1, tricksWon: 2, counted: 2 }),
  row({ seat: 3, bid: 4, tricksWon: 1, counted: 1 })
];
// Seat 3's right-hand neighbour is seat 2, who pledged 1, and seat 3 took 1.
check('an Understudy is judged against the noble on their right',
  Whispers.wasKept(understudy, stage[3], stage), true);
check('the noble on their left is nothing to do with it',
  Whispers.wasKept(understudy, stage[0], stage), false);
check('an Understudy who hits the borrowed number takes the pair of bonuses',
  Whispers.adjust(understudy, 0, Object.assign({}, stage[3], { made: true }), stage),
  Rules.scoreHand(1, 1) + 2 + 5);
check('an Understudy who misses it takes only the two',
  Whispers.adjust(understudy, 0, Object.assign({}, stage[0], { made: false }), stage),
  Rules.scoreHand(4, 5) + 2);
check('a noble on the far side is judged against their own right hand',
  Whispers.wasKept(understudy, stage[1], stage), false);

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

// --- taking a whisper, or not ------------------------------------------------

const offered = Engine.createGame({ dealer: 0, rng: seededRandom(808) });
Engine.startHand(offered);
check('the deal stops to offer a word', offered.phase, 'whisperOffer');
ok('nobody has been given one yet',
  offered.players.every((player) => player.whisper === null));
ok('nobody has decided yet',
  offered.players.every((player) => player.tookWhisper === null));
check('every whisper is still in the pool', offered.whisperPool.length, Whispers.ALL.length);

// On the first night the court is level, so nobody is behind and nobody is
// confided in.
ok('a level table is offered nothing',
  offered.players.every((player, seat) => !Engine.mayTakeWhisper(offered, seat)));
let levelRefusal = false;
try { Engine.takeWhisper(offered, 0); } catch (error) { levelRefusal = true; }
ok('and taking one anyway is refused', levelRefusal);

Engine.resolveComputerWhispers(offered);
ok('the rivals all go without on a level table',
  offered.players.every((player, seat) =>
    player.isHuman || player.tookWhisper === false));

// Put the table out of joint and the trailing nobles become eligible.
const behind = Engine.createGame({ dealer: 0, rng: seededRandom(4242) });
behind.players[0].score = 2;
behind.players[1].score = 17;
behind.players[2].score = 17;
behind.players[3].score = 9;
Engine.startHand(behind);
ok('a noble at the back may take a word', Engine.mayTakeWhisper(behind, 0));
ok('so may one merely off the pace', Engine.mayTakeWhisper(behind, 3));
ok('but not the leader', !Engine.mayTakeWhisper(behind, 1));
ok('nor anyone level with the leader', !Engine.mayTakeWhisper(behind, 2));

const taken = Engine.takeWhisper(behind, 0);
ok('taking one gives a word', taken && taken.id);
check('and marks the noble as having taken it', behind.players[0].tookWhisper, true);
check('and draws it out of the pool', behind.whisperPool.length, Whispers.ALL.length - 1);

Engine.refuseWhisper(behind, 3);
check('going without leaves no word', behind.players[3].whisper, null);
check('but is still a decision', behind.players[3].tookWhisper, false);
check('and costs the pool nothing', behind.whisperPool.length, Whispers.ALL.length - 1);

let refused = false;
try { Engine.takeWhisper(behind, 3); } catch (error) { refused = true; }
ok('a noble may not decide twice', refused);

let leaderRefusal = false;
try { Engine.takeWhisper(behind, 1); } catch (error) { leaderRefusal = true; }
ok('and the leader is refused outright', leaderRefusal);

ok('the night cannot begin until everyone has decided', !Engine.whispersSettled(behind));
Engine.resolveComputerWhispers(behind);
ok('the rivals decide for themselves', Engine.whispersSettled(behind));
ok('the leader was given nothing', behind.players[1].tookWhisper === false);
Engine.beginBidding(behind);
check('and then the pledging opens', behind.phase, 'bidding');

// Across many deals of an uneven table the rivals should be doing both.
let asked = 0;
let eligible = 0;
for (let seed = 1; seed <= 200; seed++) {
  const table = Engine.createGame({ dealer: 0, rng: seededRandom(seed * 7919) });
  table.players[0].score = 20;
  table.players[1].score = 4;
  table.players[2].score = 11;
  table.players[3].score = 7;
  Engine.startHand(table);
  Engine.resolveComputerWhispers(table);
  table.players.forEach((player, seat) => {
    if (player.isHuman || !Engine.mayTakeWhisper(table, seat)) return;
    eligible += 1;
    if (player.tookWhisper) asked += 1;
  });
}
ok('a trailing rival is at least sometimes tempted',
  asked > eligible * 0.2, Math.round((asked / eligible) * 100) + '% of those able took one');

// With whispers switched off there is nothing to offer.
const noWords = Engine.createGame({ dealer: 0, rng: seededRandom(99), whispers: false });
noWords.players[0].score = 5;
noWords.players[1].score = 30;
Engine.startHand(noWords);
check('no offer is made when whispers are off', noWords.phase, 'bidding');
ok('and nobody is left undecided',
  noWords.players.every((player) => player.tookWhisper === false));
ok('nor is anyone eligible',
  noWords.players.every((player, seat) => !Engine.mayTakeWhisper(noWords, seat)));

// --- a demand is a request, not a rule ---------------------------------------

const asks = Whispers.ALL.filter((w) => Whispers.restrictsErrands(w));
check('five whispers ask something of the errands', asks.length, 5);
ok('and none of them is a burden', asks.every((w) => !w.burden));
ok('every one of them explains the demand in words',
  asks.every((w) => typeof w.demand === 'string' && w.demand.length > 0));
ok('no whisper without a demand claims one',
  Whispers.ALL.every((w) => Whispers.restrictsErrands(w) || !w.demand));

// A word that was heeded pays; the same word ignored pays nothing at all.
const heededRow = row({ bid: 3, tricksWon: 3, counted: 3, made: true, obeyed: true });
const defiedRow = row({ bid: 3, tricksWon: 3, counted: 3, made: true, obeyed: false });
for (const asking of asks) {
  const paid = Whispers.adjust(asking, 6, heededRow, [heededRow]);
  const unpaid = Whispers.adjust(asking, 6, defiedRow, [defiedRow]);
  ok(asking.name + ' pays when it is heeded', paid > 6, 'paid ' + paid);
  check(asking.name + ' pays nothing when it is not', unpaid, 6);
}

// A word that asks nothing is unaffected by the obedience flag.
const brokenCourt = [
  row({ seat: 0, made: true, obeyed: false }),
  row({ seat: 1, made: false }),
  row({ seat: 2, made: false }),
  row({ seat: 3, made: true })
];
check('a word that asks nothing is paid regardless',
  Whispers.adjust(Whispers.BY_ID.kingmaker, 6, brokenCourt[0], brokenCourt), 12);

// Pledging against a word is allowed, and the engine remembers it.
const defiant = Engine.createGame({ dealer: 0, rng: seededRandom(31337) });
defiant.players[0].score = 0;
defiant.players[1].score = 9;
Engine.startHand(defiant);
defiant.players[0].whisper = Whispers.BY_ID.silenced;   // no Assassin may go out
defiant.players[0].tookWhisper = true;
const blades = Cards.cardsOfSuit(defiant.players[0].hand, 'S');
if (blades.length) {
  const against = [blades[0]].concat(
    Cards.removeCards(defiant.players[0].hand, [blades[0]]).slice(0, Rules.BID_CARDS - 1));
  let blocked = false;
  try { Engine.submitBid(defiant, 0, against); } catch (error) { blocked = true; }
  ok('sending an agent the word asked you to keep back is allowed', !blocked);
  check('and is recorded as disobedience', defiant.players[0].obeyed, false);
  check('while the pledge itself stands', defiant.players[0].bidCards.length, Rules.BID_CARDS);
}

const obedient = Engine.createGame({ dealer: 0, rng: seededRandom(2024) });
obedient.players[1].score = 12;
Engine.startHand(obedient);
obedient.players[0].whisper = Whispers.BY_ID.silenced;
obedient.players[0].tookWhisper = true;
const noBlades = obedient.players[0].hand.filter((card) => card.suit !== 'S');
if (noBlades.length >= Rules.BID_CARDS) {
  Engine.submitBid(obedient, 0, noBlades.slice(0, Rules.BID_CARDS));
  check('keeping the blades back is recorded as obedience', obedient.players[0].obeyed, true);
}

const watched = Whispers.BY_ID.watched;
ok('the Watched lays its errands open', Whispers.revealsErrands(watched));
check('no other whisper does',
  Whispers.ALL.filter((w) => Whispers.revealsErrands(w)).length, 1);
check('and it is paid nothing for the indignity',
  Whispers.adjust(watched, 4, row({}), []), 4);
check('nor charged for it -- the exposure is the whole of the burden',
  Whispers.adjust(watched, -6, row({ made: false }), []), -6);

// --- what a rival may not learn ----------------------------------------------

// Every scrap the AI is handed, checked against what it is allowed to know.
const table = Engine.createGame({ dealer: 0, rng: seededRandom(31337) });
Engine.startHand(table);
Engine.resolveComputerWhispers(table);
Engine.beginBidding(table);
Engine.submitComputerBids(table);
Engine.beginPlay(table);

const seat = table.turn;
const context = Engine.contextFor(table, seat);
const ownIds = new Set(table.players[seat].hand.map((card) => card.id));
const ownErrands = new Set(table.players[seat].bidCards.map((card) => card.id));

check('a noble is told its own pledge and no other',
  context.bid, table.players[seat].bid);
check('a noble is told its own word and no other',
  context.whisper, table.players[seat].whisper);
ok('a noble sees only its own hand',
  context.hand.every((card) => ownIds.has(card.id)));
ok('what a noble has seen is its own hand and what has been played',
  [...context.seen].every((id) => ownIds.has(id) ||
    table.playedCards.some((card) => card.id === id)));
ok('a noble cannot see another noble\'s errands',
  ![...context.seen].some((id) => table.players.some((other, index) =>
    index !== seat && other.bidCards.some((card) => card.id === id))));
ok('a noble cannot see another noble\'s hand',
  ![...context.seen].some((id) => table.players.some((other, index) =>
    index !== seat && other.hand.some((card) => card.id === id))));
// The only thing a noble learns about anyone else is what that noble chose to
// expose: a pledge laid face up under The Watched, and audiences already taken,
// which are public in any case.
check('the context carries nothing but the permitted keys',
  Object.keys(context).sort().join(','),
  'bid,hand,seen,trick,tricksWon,trump,watched,whisper');
ok('only nobles who laid their errands open appear in it',
  context.watched.every((other) =>
    Whispers.revealsErrands(table.players[other.seat].whisper)));
ok('and never the noble itself', context.watched.every((other) => other.seat !== seat));
for (const other of context.watched) {
  check('a watched pledge is reported truthfully',
    other.bid, table.players[other.seat].bid);
  check('and so is what they still need',
    other.needs, Whispers.aimFor(table.players[other.seat].whisper, other.bid) -
      table.players[other.seat].tricksWon);
}
ok('a noble who kept their errands sealed is not in it',
  table.players.every((other, index) =>
    index === seat || Whispers.revealsErrands(other.whisper) ||
    !context.watched.some((row) => row.seat === index)));
ok('the sealed errands stay out of what anyone has seen',
  ownErrands.size === Rules.BID_CARDS &&
  ![...ownErrands].some((id) => table.playedCards.some((card) => card.id === id)));

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

    Engine.resolveComputerWhispers(state);
    Engine.beginBidding(state);
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
check('a season is exactly twelve nights long', game.state.history.length, 12);
check('a finished season names exactly one winner', game.state.winners.length, 1);
ok('the winner holds the most favour',
  game.state.players.find((p) => p.name === game.state.winners[0]).score ===
    Math.max(...game.state.players.map((p) => p.score)));
check('the opening session is played at No Sway', game.trumpsSeen[0], null);
ok('the dealer rotated left every hand',
  game.state.dealer === (game.state.history.length - 1) % 4,
  'dealer=' + game.state.dealer + ' hands=' + game.state.history.length);

for (const summary of game.state.history) {
  const total = summary.rows.reduce((n, row) => n + row.tricksWon, 0);
  ok('night ' + summary.handNumber + ' has eleven audiences', total === 11, 'total=' + total);
  ok('night ' + summary.handNumber + ' passes sway down the ladder',
    summary.nextTrump === Rules.trumpForNextHand(summary.madeCount));
  const heard = summary.rows.map((row) => row.whisper).filter(Boolean);
  ok('night ' + summary.handNumber + ' gave no two nobles the same whisper',
    new Set(heard.map((whisper) => whisper.id)).size === heard.length);
  for (const row of summary.rows) {
    ok('night ' + summary.handNumber + ' sent exactly four agents',
      row.bidCards.length === Rules.BID_CARDS);
    // Obedience cannot be recomputed here -- it was judged against the full
    // fifteen-card hand, which is gone by now -- but it must be recorded, and
    // an unheeded demand must have paid nothing.
    ok('night ' + summary.handNumber + ' recorded a verdict on the whisper',
      typeof row.obeyed === 'boolean');
    if (row.obeyed === false) {
      ok('night ' + summary.handNumber + ' only disobeyed a word that asked something',
        row.whisper && Whispers.restrictsErrands(row.whisper));
      check('night ' + summary.handNumber + ' paid nothing for a word ignored',
        row.points, row.base);
    }
  }
}

for (let i = 1; i < game.state.history.length; i++) {
  const previous = game.state.history[i - 1];
  ok('night ' + (i + 1) + ' uses the sway the night before set',
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
      check('the counted audiences follow the whisper for ' +
        (row.whisper ? row.whisper.id : 'a noble who went without'),
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

// What the four nobles are aiming at should add up to roughly the audiences on
// offer. This is the check that catches a miscalibrated estimate: it read 16.18
// while estimateTricks valued an honour by rank position, which is nearly free
// on a deck that strikes a rank up to five times.
const averageTableBid = (bidTotal / bidCount) * 4;
ok('the table aims at roughly the audiences on offer',
  averageTableBid > 9 && averageTableBid < 13,
  'average table aim = ' + averageTableBid.toFixed(2) +
  ', against ' + Rules.TRICKS_PER_HAND + ' on offer');

// A card with nothing of its kind above it is worth the most the model can say
// about one; the same card with its twins outstanding is worth much less.
check('nothing outranks the only Fool 5', AI.threatsTo(card('5C'), hand('5C')), 0);
check('four Assassin 15s are still out there', AI.threatsTo(card('15S'), hand('15S')), 4);
check('holding two of them leaves three', AI.threatsTo(card('15S'), hand('15S', '15S/1')), 3);
check('an equal rank counts as a threat, since the tie goes to the second card',
  AI.threatsTo(card('14H'), hand('14H')), 1);
ok('a crowded top rank is worth less than a lonely one',
  AI.estimateTricks(hand('5C'), null) > AI.estimateTricks(hand('15S'), null),
  'Fool 5 = ' + AI.estimateTricks(hand('5C'), null).toFixed(2) +
  ', Assassin 15 = ' + AI.estimateTricks(hand('15S'), null).toFixed(2));

// --- the AI follows the rules it is given -----------------------------------

const aiHand = hand('15S', '11S', '14H', '2C', '9D');
const openTrick = [{ player: 0, card: card('12S') }];
const forced = AI.chooseCard({
  hand: aiHand, trick: openTrick, trump: 'H', bid: 3, tricksWon: 0, seen: new Set()
});
ok('a noble answers with the kind that was sent', forced.suit === 'S', 'played ' + forced.id);

const ducking = AI.chooseCard({
  hand: aiHand, trick: openTrick, trump: 'H', bid: 1, tricksWon: 1, seen: new Set()
});
check('a noble ducks once the pledge is filled', ducking.id, '11S0');

const grabbing = AI.chooseCard({
  hand: aiHand, trick: [
    { player: 0, card: card('12S') },
    { player: 1, card: card('13S') },
    { player: 2, card: card('14S') }
  ], trump: 'H', bid: 3, tricksWon: 0, seen: new Set()
});
check('a noble takes the audience it still needs from last seat', grabbing.id, '15S0');

const strongHand = hand('15S', '14S', '13S', '14H', '12H', '15D', '14D', '13D', '12D',
  '5C', '4C', '3C', '2C', '1C', '1C/1');
const bidCards = AI.chooseBidCards(strongHand, null, 1, null);
check('a noble sends out exactly four agents', bidCards.length, Rules.BID_CARDS);
ok('the pledge chosen matches the hand it leaves behind',
  Math.abs(Rules.bidFromCards(bidCards) - AI.estimateTricks(Cards.removeCards(strongHand, bidCards), null)) < 1,
  'pledged ' + Rules.bidFromCards(bidCards) + ' by sending ' + bidCards.map((c) => c.id).join(' '));

const weakHand = hand('11S', '2H', '6H', '8H', '1H', '2D', '4D', '3D',
  '1C', '2C', '3C', '4C', '1C/1', '2C/1', '1D');
const weakBid = Rules.bidFromCards(AI.chooseBidCards(weakHand, null, 1, null));
ok('a hand of nobodies pledges low', weakBid <= 2, 'pledged ' + weakBid);

const silencedPick = AI.chooseBidCards(strongHand, null, 1, Whispers.BY_ID.silenced);
ok('a silenced noble sends no Assassin',
  !silencedPick.some((c) => c.suit === 'S'), silencedPick.map((c) => c.id).join(' '));

const blackmailedPick = AI.chooseBidCards(strongHand, null, 1, Whispers.BY_ID.blackmailed);
ok('a blackmailed noble sends at least two',
  blackmailedPick.filter((c) => c.suit === 'S').length >= 2,
  blackmailedPick.map((c) => c.id).join(' '));

ok('no noble is tempted to promise more than the court can give',
  Rules.bidFromCards(AI.chooseBidCards(strongHand, null, 1, Whispers.BY_ID.bold)) <= Rules.KEEPABLE_MAX);

const nothingButFools = hand('1C', '1C/1', '1C/2', '1C/3', '1C/4', '2C', '2C/1', '2C/2',
  '2C/3', '3C', '3C/1', '3C/2', '4C', '4C/1', '5C');
check('a hand of nothing but Fools can only pledge nothing',
  Rules.bidFromCards(AI.chooseBidCards(nothingButFools, null, 1, null)), 0);

// --- the deck --------------------------------------------------------------

const deckB = Cards.makeDeck();
check('B deals sixty agents too', deckB.length, 60);
check('no two agents share a name', new Set(deckB.map((c) => c.id)).size, 60);
check('the ladder still runs to fifteen', Cards.HIGHEST_VALUE, 15);
check('fifteen is still the most influential', card('15S').value, 15);

// The four kinds no longer share a ladder. Each holds fifteen cards, but over
// its own stretch of the ranks and with its own crowding.
const COPIES_B = {
  C: { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 },
  D: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1,
    9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1 },
  H: { 1: 1, 2: 2, 4: 2, 6: 2, 8: 2, 10: 2, 12: 2, 14: 2 },
  S: { 11: 1, 12: 2, 13: 3, 14: 4, 15: 5 }
};
for (const suit of Cards.SUITS) {
  const kind = Cards.cardsOfSuit(deckB, suit);
  check('B gives ' + Cards.SUIT_ROLE_PLURAL[suit] + ' fifteen cards', kind.length, 15);
  check('and lists exactly the ranks it holds',
    Cards.ranksOf(suit), Object.keys(COPIES_B[suit]));
  for (const rank of Cards.RANKS) {
    const wanted = COPIES_B[suit][rank] || 0;
    check('B strikes ' + Cards.SUIT_ROLE[suit] + ' ' + rank + ' ' + wanted + ' time(s)',
      kind.filter((c) => c.rank === rank).length, wanted);
    check('and says so', Cards.copiesOf(suit, rank), wanted);
  }
}
check('the Assassins are all crowded at the top',
  Cards.ranksOf('S'), ['11', '12', '13', '14', '15']);
check('and the Fools all at the bottom', Cards.ranksOf('C'), ['1', '2', '3', '4', '5']);
check('the Lovers take a single 1 and every even rank in pairs',
  Cards.ranksOf('H'), ['1', '2', '4', '6', '8', '10', '12', '14']);
check('the Merchants alone run the whole ladder', Cards.ranksOf('D').length, 15);
check('five is the most of any one agent', Cards.copiesOf('S', '15'), 5);
check('and the deck knows it', Cards.MOST_COPIES, 5);

ok('copies of one rank are told apart', card('15S').id !== card('15S/1').id);
check('and are otherwise the same agent',
  [card('15S').suit, card('15S').value], [card('15S/1').suit, card('15S/1').value]);
check('sending one copy on an errand leaves the others in hand',
  Cards.removeCards(hand('15S', '15S/1', '15S/2', '4H'), [card('15S')]).map((c) => c.id),
  ['15S1', '15S2', '4H0']);
check('a rank a kind does not hold is simply not there', Cards.copiesOf('C', '15'), 0);
check('and offers no names', Cards.idsFor('C', '15').length, 0);

// --- the pledge ------------------------------------------------------------

check('a Fool costs a promise rather than making none', Cards.BID_VALUE.C, -1);
check('four Fools pledge nothing', Rules.bidFromCards(hand('1C', '2C', '3C', '4C')), 0);
check('a set that comes to less than nothing still pledges nothing',
  Rules.bidFromCards(hand('1C', '2C', '3C', '1D')), 0);
check('and so does one that lands exactly on nothing',
  Rules.bidFromCards(hand('1C', '2C', '3C', '1H')), 0);
check('two Fools and two Assassins pledge four',
  Rules.bidFromCards(hand('1C', '2C', '1S', '2S')), 4);
check('three Merchants and a Fool pledge two',
  Rules.bidFromCards(hand('1D', '3D', '5D', '1C')), 2);
check('four Assassins still pledge twelve',
  Rules.bidFromCards(hand('7S', '8S', '9S', '10S')), 12);
ok('overreaching cannot pay as well as promising the lot',
  Rules.scoreHand(12, 11) < Rules.scoreHand(11, 11),
  'twelve at best pays ' + Rules.scoreHand(12, 11) +
  ', eleven kept pays ' + Rules.scoreHand(11, 11));

ok('four Fools is a Fool\u2019s errand', Rules.isFoolsErrand(hand('1C', '2C', '3C', '4C')));
ok('a set that merely adds up to nothing is not',
  !Rules.isFoolsErrand(hand('1C', '2C', '3C', '1H')));
ok('nor is one that adds up to less than nothing',
  !Rules.isFoolsErrand(hand('1C', '2C', '3C', '1D')));
ok('a pledge of something is never a Fool\u2019s errand',
  !Rules.isFoolsErrand(hand('1C', '2C', '3C', '2S')));

// --- ties ------------------------------------------------------------------

check('equal ranks go to whoever played second',
  Rules.trickWinner(trick('7S', '7S/1', '2S', '3S'), null).player, 1);
check('and to the second even from the last seat',
  Rules.trickWinner(trick('7S', '2S', '3S', '7S/1'), null).player, 3);
check('a higher rank still takes it outright',
  Rules.trickWinner(trick('7S', '7S/1', '8S', '3S'), null).player, 2);
check('equal ruling agents go to the second as well',
  Rules.trickWinner(trick('6H', '2H', '6H/1', '3H'), 'H').player, 2);
check('a ruling agent beats a higher rank of another kind',
  Rules.trickWinner(trick('10S', '1H', '2S', '3S'), 'H').player, 1);
check('an equal rank of another kind wins nothing',
  Rules.trickWinner(trick('7S', '7D', '2S', '3S'), null).player, 0);
check('a lesser ruling agent still beats an equal rank of the led kind',
  Rules.trickWinner(trick('7S', '7S/1', '1H', '3S'), 'H').player, 2);

// --- favour ----------------------------------------------------------------

check('a pledge of two kept pays five', Rules.scoreHand(2, 2, false), 5);
check('a pledge of one kept pays three', Rules.scoreHand(1, 1, false), 3);
check('three audiences on a pledge of four pays two', Rules.scoreHand(4, 3, false), 2);
check('four audiences on a pledge of two costs two', Rules.scoreHand(2, 4, false), -2);
check('a Fool\u2019s errand kept pays eight', Rules.scoreHand(0, 0, true), 8);
check('a Fool\u2019s errand broken on two audiences costs four',
  Rules.scoreHand(0, 2, true), -4);
check('a hollow promise kept pays one', Rules.scoreHand(0, 0, false), 1);
ok('the two ways of promising nothing pay differently',
  Rules.scoreHand(0, 0, true) !== Rules.scoreHand(0, 0, false));
check('a broken promise of nothing scales with the damage',
  [1, 2, 3].map((won) => Rules.scoreHand(0, won, true)), [-2, -4, -6]);
check('and scales the same however the nothing was arrived at',
  [1, 2, 3].map((won) => Rules.scoreHand(0, won, false)), [-2, -4, -6]);
check('missing by one costs the same high as low',
  Rules.scoreHand(4, 3, false), Rules.scoreHand(4, 5, false));
ok('so under-promising on purpose buys nothing',
  Rules.scoreHand(4, 4, false) > Rules.scoreHand(3, 4, false),
  'kept 4 pays ' + Rules.scoreHand(4, 4, false) +
  ', under-promised 3 and won 4 pays ' + Rules.scoreHand(3, 4, false));

// --- what the rival nobles can prove ---------------------------------------

function seenExcept(missing) {
  const set = new Set(Cards.makeDeck().map((c) => c.id));
  for (const id of missing) set.delete(id);
  return set;
}
ok('an unseen copy of the same rank means nothing is proven',
  !AI.isTopOutstanding(card('15S'), seenExcept(['15S1'])),
  'another Assassin 15 is still out there');
ok('and four unseen copies certainly do not',
  !AI.isTopOutstanding(card('15S'), seenExcept(['15S1', '15S2', '15S3', '15S4'])));
ok('once every copy is accounted for, the rank is safe',
  AI.isTopOutstanding(card('15S'), seenExcept([])));
ok('an unseen higher rank still refuses the claim',
  !AI.isTopOutstanding(card('14S'), seenExcept(['15S0'])));
ok('the card itself being in hand does not count against it',
  AI.isTopOutstanding(card('5C'), seenExcept(['5C0'])),
  'a card cannot be beaten by itself');
ok('a kind is judged against its own ladder, not the whole deck',
  AI.isTopOutstanding(card('5C'), seenExcept([])),
  'the Fools stop at 5, so nothing in the kind outranks a Fool 5');
ok('the lowest Assassin is still beaten from above',
  !AI.isTopOutstanding(card('11S'), seenExcept(['12S0'])));
check('the honours of a kind are read off its own ranks',
  AI.honours('C'), [5, 4, 3, 2]);
check('so the Assassins keep theirs at the top', AI.honours('S'), [15, 14, 13, 12]);
check('and the Lovers count only the ranks they hold', AI.honours('H'), [14, 12, 10, 8]);

// --- the words that read differently ---------------------------------------

const auditedB = Whispers.BY_ID.audited;
const auditedHand = hand('1D', '3D', '5D', '7D', '1C', '2C', '3C', '1S', '2S', '3S',
  '4H', '5H', '6H', '7H', '8H');
ok('The Audited accepts three Merchants and one Fool',
  Whispers.permitsSet(auditedB, hand('1D', '3D', '5D', '1C'), auditedHand));
ok('and refuses two of each',
  !Whispers.permitsSet(auditedB, hand('1D', '3D', '1C', '2C'), auditedHand));
ok('and refuses four Merchants',
  !Whispers.permitsSet(auditedB, hand('1D', '3D', '5D', '7D'), auditedHand));
check('the set it asks for pledges exactly two',
  Rules.bidFromCards(hand('1D', '3D', '5D', '1C')), 2);
ok('it is waived on a hand holding too few Merchants',
  Whispers.permitsSet(auditedB, hand('1C', '2C', '3C', '1S'),
    hand('1D', '3D', '1C', '2C', '3C', '1S', '2S', '3S',
      '4H', '5H', '6H', '7H', '8H', '9H', '10H')));

// -- the roster
const EXPECTED_WORDS = ['blackmailed', 'silenced', 'smitten', 'ledger', 'audited', 'debtor',
  'allOrNothing', 'bold', 'kingmaker', 'favourite', 'wallflower', 'swornToFool', 'twin',
  'modest', 'understudy', 'saboteur', 'watched', 'marked', 'outOfFavour', 'optimist',
  'beggar', 'duellist'];
check('the monarch has twenty-two words and no others',
  Whispers.ALL.map((whisper) => whisper.id), EXPECTED_WORDS);
check('seven of them are burdens', Whispers.ALL.filter((w) => w.burden).length, 7);
ok('and the burdens are the last of them, as the rulebook says',
  Whispers.ALL.slice(Whispers.ALL.length - 7).every((w) => w.burden));
check('every word can be drawn from the pool',
  new Set(Whispers.deal(Whispers.ALL.length).map((w) => w.id)).size, 22);

// -- Blackmailed asks for two blades
const blackmailedB = Whispers.BY_ID.blackmailed;
ok('Blackmailed wants two Assassins',
  Whispers.permitsSet(blackmailedB, hand('6S', '7S', '1C', '2C')));
ok('and one is no longer enough',
  !Whispers.permitsSet(blackmailedB, hand('6S', '1H', '1C', '2C')));
ok('a hand holding a single blade cannot obey it',
  !Whispers.canSatisfy(blackmailedB, hand('6S', '1H', '2H', '3H')));
ok('a hand holding two can', Whispers.canSatisfy(blackmailedB, hand('6S', '7S', '2H', '3H')));
check('its demand says so', blackmailedB.demand, 'at least two Assassins must go out');

// -- Sworn to the Ledger
const ledger = Whispers.BY_ID.ledger;
ok('Sworn to the Ledger lets a Fool go', Whispers.allowsCard(ledger, card('1C')));
ok('but holds every Merchant back', !Whispers.allowsCard(ledger, card('1D')));
ok('it refuses a set with a Merchant in it',
  !Whispers.permitsSet(ledger, hand('1D', '2H', '3H', '1C')));
ok('and accepts one without',
  Whispers.permitsSet(ledger, hand('2H', '3H', '1C', '6S')));
check('a kept pledge pays five', Whispers.adjust(ledger, 5, row({ made: true }), []), 10);
check('a broken one pays nothing', Whispers.adjust(ledger, 5, row({ made: false }), []), 5);

// -- The Twin
const twin = Whispers.BY_ID.twin;
const twinRow = (audiences) => row({
  wonAudiences: audiences.map((ids) => ids.map((id) => {
    const copy = Number(id.slice(-1));
    const rest = id.slice(0, -1);
    return Cards.makeCard(rest.slice(-1), rest.slice(0, -1), copy);
  }))
});
check('The Twin pays nothing for an audience of four different agents',
  Whispers.adjust(twin, 5, twinRow([['7S0', '7H0', '7D0', '7C0']]), []), 5);
check('two for a matched pair taken together',
  Whispers.adjust(twin, 5, twinRow([['7S0', '7S1', '7H0', '7C0']]), []), 7);
check('four for two pairs in the one audience',
  Whispers.adjust(twin, 5, twinRow([['7S0', '7S1', '6H0', '6H1']]), []), 9);
check('and nothing for a matched pair split across two audiences',
  Whispers.adjust(twin, 5, twinRow([['7S0', '1H0', '1D0', '1C0'],
    ['7S1', '2H0', '2D0', '2C0']]), []), 5);
check('same rank, different kind, is no pair at all',
  Whispers.adjust(twin, 5, twinRow([['7S0', '7H0', '1D0', '1C0']]), []), 5);

// -- The Modest
const modest = Whispers.BY_ID.modest;
check('The Modest pays three for an audience taken with a low agent',
  Whispers.adjust(modest, 5, row({ takenWith: hand('5S') }), []), 8);
check('nothing for one taken with a high agent',
  Whispers.adjust(modest, 5, row({ takenWith: hand('6S') }), []), 5);
check('and counts each of them',
  Whispers.adjust(modest, 5, row({ takenWith: hand('1C', '5H', '6D', '10S') }), []), 11);

// -- More Was Expected
const optimist = Whispers.BY_ID.optimist;
ok('More Was Expected is a burden', Whispers.isBurden(optimist));
check('it costs three for every audience short of the pledge',
  Whispers.adjust(optimist, 5, row({ bid: 5, tricksWon: 2 }), []), -4);
check('nothing when the pledge is kept',
  Whispers.adjust(optimist, 5, row({ bid: 5, tricksWon: 5 }), []), 5);
check('and nothing for overshooting it',
  Whispers.adjust(optimist, 5, row({ bid: 5, tricksWon: 8 }), []), 5);

const saboteur = Whispers.BY_ID.saboteur;
function goatTable(keepers) {
  const table = [row({ seat: 0, bid: 3, made: true })];
  for (let seat = 1; seat <= 3; seat++) {
    table.push(row({ seat: seat, bid: 3, made: seat <= keepers }));
  }
  return table;
}
const SABOTEUR_BASE = 5;
for (const keepers of [0, 1, 2, 3]) {
  const table = goatTable(keepers);
  check('In Another’s Pay pays ' + SABOTEUR_BASE + ' less 3 a head, with ' + keepers + ' keeping',
    Whispers.adjust(saboteur, 99, table[0], table), SABOTEUR_BASE - 3 * keepers);
}
const goatBest = goatTable(0);
const goatWorst = goatTable(3);
check('so its best night is +' + SABOTEUR_BASE,
  Whispers.adjust(saboteur, 99, goatBest[0], goatBest), 5);
check('and its worst is -4',
  Whispers.adjust(saboteur, 99, goatWorst[0], goatWorst), -4);
const goatOne = goatTable(1);
ok('its own pledge is not scored at all',
  Whispers.adjust(saboteur, 22, goatOne[0], goatOne) ===
  Whispers.adjust(saboteur, -8, goatOne[0], goatOne));
ok('but the pledge is still kept or broken as a fact, for the sway ladder',
  Whispers.wasKept(saboteur, row({ bid: 3, counted: 3 }), goatOne) === true &&
  Whispers.wasKept(saboteur, row({ bid: 3, counted: 2 }), goatOne) === false);

// -- Out of Favour, which now asks for silence rather than modesty
const outOfFavour = Whispers.BY_ID.outOfFavour;
const quietest = (mine) => {
  const table = [row({ seat: 0, tricksWon: mine })];
  for (let seat = 1; seat <= 3; seat++) table.push(row({ seat: seat, tricksWon: 2 + seat }));
  return table;
};
ok('Out of Favour is a burden', Whispers.isBurden(outOfFavour));
check('it costs two when somebody was quieter than you',
  Whispers.adjust(outOfFavour, 5, quietest(4)[0], quietest(4)), 3);
check('nothing when nobody was',
  Whispers.adjust(outOfFavour, 5, quietest(1)[0], quietest(1)), 5);
check('and nothing when you are level with the quietest',
  Whispers.adjust(outOfFavour, 5, quietest(3)[0], quietest(3)), 5);
ok('it is the mirror of the Wallflower, which pays for the same thing',
  Whispers.adjust(Whispers.BY_ID.wallflower, 0, quietest(1)[0], quietest(1)) > 0 &&
  Whispers.adjust(outOfFavour, 0, quietest(1)[0], quietest(1)) === 0);

const swornB = Whispers.BY_ID.swornToFool;
const wonRow = (ids, tookWith) => row({
  wonCards: hand.apply(null, ids),
  takenWith: tookWith ? hand.apply(null, tookWith) : []
});
check('Sworn to the Fool pays two for a Fool in an audience won',
  Whispers.adjust(swornB, 99, wonRow(['1C', '2S', '3H', '4D']), []), 2);
check('four for two of them',
  Whispers.adjust(swornB, 99, wonRow(['1C', '2C', '3H', '4D']), []), 4);
check('and nothing at all where no Fool was won',
  Whispers.adjust(swornB, 99, wonRow(['1S', '2S', '3H', '4D']), []), 0);
check('and six for three',
  Whispers.adjust(swornB, 99, wonRow(['1C', '2C', '3C', '4D']), []), 6);
check('nothing at all where no Fool was in the room',
  Whispers.adjust(swornB, 99, wonRow(['1S', '2S', '3H', '4D']), []), 0);
check('it counts Fools inside the audiences, not audiences won by a Fool',
  Whispers.adjust(swornB, 0, wonRow(['1S', '2S'], ['1C', '2C']), []), 0);
ok('its own pledge is not scored either',
  Whispers.adjust(swornB, 22, wonRow(['1C', '2C']), []) ===
  Whispers.adjust(swornB, -8, wonRow(['1C', '2C']), []));
check('and it chases every audience there is', Whispers.aimFor(swornB, 2), Rules.TRICKS_PER_HAND);

// -- The Beggar's Bargain
const beggar = Whispers.BY_ID.beggar;
ok("The Beggar's Bargain is a burden", Whispers.isBurden(beggar));
check('it leaves favour alone where a Fool was in an audience won',
  Whispers.adjust(beggar, 7, wonRow(['1C', '2S', '3H', '4D']), []), 7);
check('and halves it where none was',
  Whispers.adjust(beggar, 7, wonRow(['1S', '2S', '3H', '4D']), []), 3);
check('a noble who won nothing at all is halved too',
  Whispers.adjust(beggar, 8, wonRow([]), []), 4);
check('but a losing night is not softened by it',
  Whispers.adjust(beggar, -6, wonRow(['1S', '2S']), []), -6);
check('nor is a night worth nothing',
  Whispers.adjust(beggar, 0, wonRow(['1S', '2S']), []), 0);

// -- Called Out
const duellist = Whispers.BY_ID.duellist;
const duel = (mine, theirs) => {
  const table = [];
  for (let seat = 0; seat < Rules.PLAYER_COUNT; seat++) table.push(row({ seat: seat }));
  table[0].tricksWon = mine;
  table[Rules.rightOf(0)].tricksWon = theirs;
  return table;
};
ok('Called Out is a burden', Whispers.isBurden(duellist));
check('it costs three for outshining the noble on your right',
  Whispers.adjust(duellist, 5, duel(4, 2)[0], duel(4, 2)), 2);
check('nothing for matching them', Whispers.adjust(duellist, 5, duel(3, 3)[0], duel(3, 3)), 5);
check('and nothing for falling short of them',
  Whispers.adjust(duellist, 5, duel(1, 3)[0], duel(1, 3)), 5);


// A second whole season, to shake out anything the assertions above miss.
const wholeB = playWholeGame(90210);
check('a season runs its twelve nights', wholeB.state.handNumber, Rules.SEASON_LENGTH);
ok('and leaves somebody holding the ear of the monarch', wholeB.state.winners.length >= 1);

const deckProse = Rulebook.sections().find((section) => section.id === 'rule-deck').html;
ok('the rulebook prints the deck actually dealt',
  deckProse.indexOf('5&times;15') !== -1 && deckProse.indexOf('5&times;1') !== -1,
  'the composition table should show the crowded ranks');
ok('and says the kinds do not share a ladder',
  deckProse.indexOf('do not share a ladder') !== -1);

// --- report ----------------------------------------------------------------

if (failures.length) {
  console.log(failures.length + ' failed, ' + passed + ' passed\n');
  for (const failure of failures) console.log('  FAIL ' + failure);
  process.exit(1);
}
console.log('all ' + passed + ' checks passed');
if (known.length) {
  console.log('\n' + known.length + ' known issue' + (known.length === 1 ? '' : 's') +
    ', recorded rather than asserted:');
  for (const issue of known) console.log('  KNOWN ' + issue);
}
