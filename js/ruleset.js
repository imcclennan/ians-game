/*
 * ruleset.js - which rules the court is playing under tonight.
 *
 * The game as it was first written is Ruleset A, and it is the default. B is an
 * alternate set of rules: a shorter ladder of ranks with duplicates in it, ties
 * settled by whoever played second, Fools that cost rather than promise
 * nothing, and a revised table of favour.
 *
 * The two differ in the deck itself, not only in the scoring, so the choice has
 * to be made before a single card is dealt. Everything that varies lives in the
 * frozen config objects below; the rest of the game reads Ruleset.current()
 * rather than carrying its own copy of any of it.
 *
 * Loaded as a plain script in the browser (sets globalThis.Ruleset) and
 * require()-able from Node for the test suite.
 */
(function (global) {
  'use strict';

  const SUITS = ['C', 'D', 'H', 'S'];

  function ranksUpTo(highest) {
    const ranks = [];
    for (let n = 1; n <= highest; n++) ranks.push(String(n));
    return ranks;
  }

  /**
   * A kind holding one card at every rank from 1 up to the given rank. Written
   * as the same rank -> how many map the uneven kinds use, so nothing has to
   * special-case an even ladder.
   */
  function oneEach(highest) {
    const copies = {};
    for (const rank of ranksUpTo(highest)) copies[rank] = 1;
    return copies;
  }

  /** The flat deck: every kind runs 1 to 15, one card apiece. */
  const FLAT = { C: oneEach(15), D: oneEach(15), H: oneEach(15), S: oneEach(15) };

  /**
   * Ruleset A -- the game as it stands. Fifteen ranks, one card of each, no
   * ties possible, and a pledge that cannot come to less than nothing because
   * no agent is worth less than nothing.
   */
  const A = {
    id: 'A',
    name: 'Ruleset A',
    summary: 'Fifteen ranks, one of each, and the favour table the court has always used.',

    // --- the deck ---------------------------------------------------------
    highestValue: 15,
    ranks: ranksUpTo(15),
    copies: FLAT,

    // --- errands ----------------------------------------------------------
    bidValue: { C: 0, D: 1, H: 2, S: 3 },
    clampPledge: false,
    nilFools: 0,

    /**
     * A pledge of nothing. Under A only Fools promise nothing and nothing
     * promises less, so a pledge of nought is already four Fools and there is
     * no second kind of it to tell apart.
     */
    isTrueNil: function (cards, bid) {
      return bid === 0;
    },

    // --- audiences --------------------------------------------------------
    tieToSecond: false,

    // --- favour -----------------------------------------------------------
    flatBonus: 0,
    nilPay: 8,

    /**
     *   bid 0: +8 for taking no tricks, -8 for taking any. Promising the court
     *          nothing is the boldest thing a noble can do, and the cheapest to
     *          be caught at.
     *   exact bid (> 0): 2 points per trick won.
     *   missed bid: 1 point per trick won, minus 2 for every trick off the bid.
     */
    scoreHand: function (bid, tricksWon) {
      if (bid === 0) return tricksWon === 0 ? 8 : -8;
      if (tricksWon === bid) return 2 * tricksWon;
      return tricksWon - 2 * Math.abs(tricksWon - bid);
    },

    // --- what the words ask -----------------------------------------------
    // Every word in the book is dealt under A.
    clerkCap: 7,
    meekOutright: false,
    blackmailAssassins: 1,
    auditedMerchants: 2,
    auditedFools: 2,
    auditedExact: false,
    scapegoatScoresPledge: true,
    swornCountsInAudiences: false
  };

  /**
   * Ruleset B -- the same sixty cards dealt very differently. Each kind holds
   * fifteen, but they no longer share a ladder: the Assassins are all crowded
   * at the top and the Fools all at the bottom, the Merchants alone run the
   * whole range, and the Lovers take every other rung in pairs.
   *
   * Because a rank can be struck as many as five times, two agents can meet on
   * the same rank, and the second one played takes the audience. Fools cost a
   * promise rather than making none, which puts two kinds of nought in the
   * game: a true nil of four Fools, and a set that merely adds up to nothing.
   */
  const B = {
    id: 'B',
    name: 'Ruleset B',
    summary: 'Four kinds with ladders of their own, ties to the second card, ' +
      'Fools worth −1, and a revised favour table.',

    // --- the deck ---------------------------------------------------------
    highestValue: 15,
    // Every rank the deck holds anywhere. Only the Merchants run all of them;
    // the others each occupy their own stretch of the ladder.
    ranks: ranksUpTo(15),
    // How many of each rank each kind holds. Fifteen cards apiece, sixty in
    // all, and cards of one rank and kind are identical in play.
    copies: {
      // One 5 down to five 1s: the Fools are worthless and there are hordes of
      // them, which is the point of a kind that costs you a promise.
      C: { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 },
      // The only kind that runs the whole ladder, one of each.
      D: oneEach(15),
      // A single 1, then a pair at every even rank up to 14.
      H: { 1: 1, 2: 2, 4: 2, 6: 2, 8: 2, 10: 2, 12: 2, 14: 2 },
      // Five 15s down to a single 11. Every Assassin outranks every Fool,
      // every Lover but the 12s and 14s, and all but the top four Merchants.
      S: { 11: 1, 12: 2, 13: 3, 14: 4, 15: 5 }
    },

    // --- errands ----------------------------------------------------------
    bidValue: { C: -1, D: 1, H: 2, S: 3 },
    clampPledge: true,
    nilFools: 4,

    /**
     * A true nil is four Fools and nothing else -- the whole errand given over
     * to promising nothing. Any other set that adds up to nought or below is an
     * arithmetic nought, and pays far less for it.
     */
    isTrueNil: function (cards) {
      return cards.filter((card) => card.suit === 'C').length >= B.nilFools;
    },

    // --- audiences --------------------------------------------------------
    tieToSecond: true,

    // --- favour -----------------------------------------------------------
    flatBonus: 1,
    nilPay: 8,

    /**
     *   true nil kept: nilPay.
     *   arithmetic nought kept: flatBonus, and no more.
     *   either nought broken: 2 lost for every audience taken.
     *   exact pledge (> 0): flatBonus, plus 2 per audience won.
     *   missed pledge: the pledge itself, less 2 for every audience off it --
     *          so falling short and overshooting cost the same, and there is
     *          nothing to be had by under-promising on purpose.
     */
    scoreHand: function (bid, tricksWon, isTrueNil) {
      if (bid === 0) {
        if (tricksWon === 0) return isTrueNil ? B.nilPay : B.flatBonus;
        return -2 * tricksWon;
      }
      if (tricksWon === bid) return B.flatBonus + 2 * tricksWon;
      return bid - 2 * Math.abs(bid - tricksWon);
    },

    // --- what the words ask -----------------------------------------------
    // Five words are not dealt under B and five others are dealt only under it;
    // each says so in its own definition in whispers.js. The Cautious Clerk and
    // The Meek are among those withdrawn, so neither clerkCap nor meekOutright
    // means anything here.
    blackmailAssassins: 2,
    auditedMerchants: 3,
    auditedFools: 1,
    auditedExact: true,
    scapegoatScoresPledge: false,
    // What a Scapegoat's night is worth before the other nobles are counted,
    // three favour a head coming off it. At 5 the range runs +5 to -4.
    scapegoatBase: 5,
    swornCountsInAudiences: true
  };

  const RULESETS = { A: A, B: B };
  for (const id of Object.keys(RULESETS)) {
    const ruleset = RULESETS[id];
    // Whether the deck strikes any rank more than once. A deck that does has
    // to say so on the cards, and has to settle an audience between equals.
    ruleset.hasDuplicates = SUITS.some((suit) =>
      Object.keys(ruleset.copies[suit]).some((rank) => ruleset.copies[suit][rank] > 1));
    // The most of any one rank the deck holds, which is how many marks a card
    // may have to carry.
    ruleset.mostCopies = Math.max.apply(null, SUITS.map((suit) =>
      Math.max.apply(null, Object.keys(ruleset.copies[suit])
        .map((rank) => ruleset.copies[suit][rank]))));
    for (const suit of SUITS) Object.freeze(ruleset.copies[suit]);
    Object.freeze(ruleset.copies);
    Object.freeze(ruleset.bidValue);
    Object.freeze(ruleset.ranks);
    Object.freeze(ruleset);
  }
  Object.freeze(RULESETS);

  const DEFAULT_ID = 'A';
  let active = RULESETS[DEFAULT_ID];

  /**
   * Seasons currently under way. A ruleset cannot be swapped while one is: the
   * cards already dealt carry ranks the incoming deck may not have. The engine
   * opens a season when it deals the first night and closes it when the season
   * ends or is abandoned.
   */
  const openSeasons = new Set();

  function current() {
    return active;
  }

  function currentId() {
    return active.id;
  }

  function ids() {
    return Object.keys(RULESETS);
  }

  function get(id) {
    return RULESETS[id] || null;
  }

  function inSeason() {
    return openSeasons.size > 0;
  }

  function beginSeason(token) {
    openSeasons.add(token);
  }

  function endSeason(token) {
    openSeasons.delete(token);
  }

  /** Teardown: forget every open season without ending it properly. */
  function releaseAll() {
    openSeasons.clear();
  }

  /**
   * Change which rules the court plays under. Refused outright while a season
   * is in progress -- the caller is expected to have finished or abandoned it
   * first.
   */
  function use(id) {
    const wanted = RULESETS[id];
    if (!wanted) throw new Error('No such ruleset: ' + id);
    if (inSeason()) {
      throw new Error('A season is in progress; the ruleset cannot be changed mid-season');
    }
    active = wanted;
    return active;
  }

  /** Back to the rules the game has always used, with no season held open. */
  function reset() {
    releaseAll();
    active = RULESETS[DEFAULT_ID];
    return active;
  }

  global.Ruleset = {
    RULESETS: RULESETS,
    DEFAULT_ID: DEFAULT_ID,
    current: current,
    currentId: currentId,
    ids: ids,
    get: get,
    use: use,
    reset: reset,
    inSeason: inSeason,
    beginSeason: beginSeason,
    endSeason: endSeason,
    releaseAll: releaseAll
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
