/*
 * cards.js - the deck and its primitives.
 *
 * Sixty cards: four agents, fifteen apiece, each ranked by their standing at
 * court. Which ranks a kind runs to, and how many of each it holds, is the
 * business of the active ruleset -- one card at every rank from 1 to 15 under
 * A, four kinds with ladders of their own under B. Either way the deck comes
 * to sixty.
 *
 * The classic pips are kept because they already read as the four agents --
 * the blade, the heart, the coin, the jester's bauble.
 *
 * Loaded as a plain script in the browser (sets globalThis.Cards) and
 * require()-able from Node for the test suite.
 */
(function (global) {
  'use strict';

  const Ruleset = global.Ruleset;

  const SUITS = ['C', 'D', 'H', 'S'];

  // The agent each suit stands for. This is what the game calls them.
  const SUIT_ROLE = { C: 'Fool', D: 'Merchant', H: 'Lover', S: 'Assassin' };
  const SUIT_ROLE_PLURAL = { C: 'Fools', D: 'Merchants', H: 'Lovers', S: 'Assassins' };

  const SUIT_NAME = { C: 'Clubs', D: 'Diamonds', H: 'Hearts', S: 'Spades' };
  const SUIT_SYMBOL = { C: '♣', D: '♦', H: '♥', S: '♠' };
  const SUIT_COLOR = { C: 'black', D: 'red', H: 'red', S: 'black' };

  // The mark each agent is known by. These are the suits: a dagger for the
  // Assassin, a rose for the Lover, a balance for the Merchant, a cap and
  // bells for the Fool. Drawn rather than borrowed from a font so they carry
  // the same weight at every size, and filled with currentColor so each takes
  // the ink of its own kind.
  const SUIT_EMBLEM = {
    S: "<path d='M50 6 L58 32 L58 60 L42 60 L42 32 Z'/>" +
       "<rect x='27' y='60' width='46' height='8' rx='2'/>" +
       "<rect x='45' y='68' width='10' height='18'/>" +
       "<circle cx='50' cy='90' r='7'/>",
    H: "<circle cx='50' cy='26' r='14'/><circle cx='72' cy='42' r='14'/>" +
       "<circle cx='64' cy='66' r='14'/><circle cx='36' cy='66' r='14'/>" +
       "<circle cx='28' cy='42' r='14'/><circle cx='50' cy='48' r='13'/>" +
       "<rect x='46' y='66' width='8' height='28'/>",
    D: "<rect x='46' y='14' width='8' height='66'/>" +
       "<rect x='16' y='24' width='68' height='7' rx='3'/>" +
       "<path d='M6 32 L34 32 L20 54 Z'/><path d='M66 32 L94 32 L80 54 Z'/>" +
       "<rect x='28' y='80' width='44' height='8' rx='3'/>",
    C: "<path d='M50 36 C33 36 21 48 21 64 L21 76 L79 76 L79 64 C79 48 67 36 50 36 Z'/>" +
       "<rect x='24' y='28' width='7' height='24' transform='rotate(28 27 40)'/>" +
       "<circle cx='16' cy='20' r='9'/>" +
       "<rect x='69' y='28' width='7' height='24' transform='rotate(-28 73 40)'/>" +
       "<circle cx='84' cy='20' r='9'/>" +
       "<rect x='46' y='12' width='8' height='26'/><circle cx='50' cy='9' r='9'/>"
  };

  /** The agent's mark as inline SVG, taking its colour from the surrounding text. */
  function emblem(suit, extraClass) {
    return '<svg class="emblem' + (extraClass ? ' ' + extraClass : '') +
      '" viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="currentColor">' +
      SUIT_EMBLEM[suit] + '</svg>';
  }

  // Display order for a fanned hand: by what each kind promises, richest first,
  // with whoever holds sway pulled to the front of all of them.
  const DISPLAY_ORDER = ['S', 'H', 'D', 'C'];

  /**
   * How many cards of this rank the active deck holds in this kind. Zero where
   * the kind does not run to that rank at all -- the kinds need not share a
   * ladder, and under Ruleset B they do not.
   */
  function copiesOf(suit, rank) {
    return Ruleset.current().copies[suit][String(rank)] || 0;
  }

  /** The ranks this kind actually holds, lowest first. */
  function ranksOf(suit) {
    return Object.keys(Ruleset.current().copies[suit]).sort((a, b) => Number(a) - Number(b));
  }

  /**
   * An agent's name in the pack. Cards of one rank and kind are identical in
   * play and carry no distinguishing face, but they must still be told apart
   * here: a shared id would let removeCards strip every copy at once, and
   * would make every Set of cards already seen quietly undercount.
   *
   * The copy number is always present, in both rulesets, so that no code
   * anywhere has to know which ruleset it is building an id for.
   */
  function idFor(suit, rank, copy) {
    return String(rank) + suit + (copy || 0);
  }

  /** Every id a rank could be holding in this kind. */
  function idsFor(suit, rank) {
    const ids = [];
    for (let copy = 0; copy < copiesOf(suit, rank); copy++) ids.push(idFor(suit, rank, copy));
    return ids;
  }

  function makeCard(suit, rank, copy) {
    const which = copy || 0;
    return {
      suit: suit,
      rank: rank,
      value: Number(rank), // 1 is the weakest agent, the highest rank the most influential
      copy: which,
      id: idFor(suit, rank, which)
    };
  }

  function makeDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of ranksOf(suit)) {
        for (let copy = 0; copy < copiesOf(suit, rank); copy++) {
          deck.push(makeCard(suit, rank, copy));
        }
      }
    }
    return deck;
  }

  // Fisher-Yates. rng defaults to Math.random so tests can inject a seeded one.
  function shuffle(cards, rng) {
    const random = rng || Math.random;
    const out = cards.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  /**
   * What a set of agents promises, before any ruleset has had its say about
   * what to do with a total of nothing or less. Rules.bidFromCards is the one
   * that turns this into a pledge.
   */
  function bidValueOf(cards) {
    const bidValue = Ruleset.current().bidValue;
    return cards.reduce((total, card) => total + bidValue[card.suit], 0);
  }

  function cardsOfSuit(cards, suit) {
    return cards.filter((card) => card.suit === suit);
  }

  function byValueDesc(a, b) {
    return b.value - a.value;
  }

  function suitOrder(sway) {
    const order = DISPLAY_ORDER.filter((suit) => suit !== sway);
    return sway ? [sway].concat(order) : order;
  }

  /** Sorted for the fan on the table: sway first, then alternating colours, high to low. */
  function sortHand(cards, sway) {
    const order = suitOrder(sway);
    return cards.slice().sort((a, b) => {
      const suitDiff = order.indexOf(a.suit) - order.indexOf(b.suit);
      return suitDiff !== 0 ? suitDiff : b.value - a.value;
    });
  }

  function removeCards(hand, cards) {
    const ids = new Set(cards.map((card) => card.id));
    return hand.filter((card) => !ids.has(card.id));
  }

  function describe(card) {
    return SUIT_ROLE[card.suit] + ' ' + card.rank;
  }

  global.Cards = {
    SUITS: SUITS,
    SUIT_ROLE: SUIT_ROLE,
    SUIT_ROLE_PLURAL: SUIT_ROLE_PLURAL,
    SUIT_NAME: SUIT_NAME,
    SUIT_SYMBOL: SUIT_SYMBOL,
    SUIT_EMBLEM: SUIT_EMBLEM,
    emblem: emblem,
    SUIT_COLOR: SUIT_COLOR,
    copiesOf: copiesOf,
    ranksOf: ranksOf,
    idFor: idFor,
    idsFor: idsFor,
    makeCard: makeCard,
    makeDeck: makeDeck,
    shuffle: shuffle,
    bidValueOf: bidValueOf,
    cardsOfSuit: cardsOfSuit,
    byValueDesc: byValueDesc,
    sortHand: sortHand,
    suitOrder: suitOrder,
    removeCards: removeCards,
    describe: describe
  };

  // The shape of the deck belongs to the ruleset in force, and the ruleset can
  // change between seasons, so these are read through rather than copied out.
  // Anything that captures one of them at load time will be wrong the moment
  // the court changes its rules.
  Object.defineProperties(global.Cards, {
    RANKS: { enumerable: true, get: () => Ruleset.current().ranks },
    HIGHEST_VALUE: { enumerable: true, get: () => Ruleset.current().highestValue },
    // Audiences promised when an agent is sent out on an errand.
    BID_VALUE: { enumerable: true, get: () => Ruleset.current().bidValue }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
