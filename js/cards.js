/*
 * cards.js - the deck and its primitives.
 *
 * Sixty cards: four agents, each ranked 1 to 15 by their standing at court.
 * The classic pips are kept because they already read as the four agents --
 * the blade, the heart, the coin, the jester's bauble.
 *
 * Loaded as a plain script in the browser (sets globalThis.Cards) and
 * require()-able from Node for the test suite.
 */
(function (global) {
  'use strict';

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

  // Audiences promised when an agent is sent out on an errand.
  const BID_VALUE = { C: 0, D: 1, H: 2, S: 3 };

  const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10', '11', '12', '13', '14', '15'];

  const HIGHEST_VALUE = 15;

  // Display order for a fanned hand: alternating colours, sway pulled to the front.
  const DISPLAY_ORDER = ['S', 'H', 'C', 'D'];

  function makeCard(suit, rank) {
    return {
      suit: suit,
      rank: rank,
      value: Number(rank), // 1 is the weakest agent, 15 the most influential
      id: rank + suit
    };
  }

  function makeDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) deck.push(makeCard(suit, rank));
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

  function bidValueOf(cards) {
    return cards.reduce((total, card) => total + BID_VALUE[card.suit], 0);
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
    BID_VALUE: BID_VALUE,
    RANKS: RANKS,
    HIGHEST_VALUE: HIGHEST_VALUE,
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
})(typeof globalThis !== 'undefined' ? globalThis : this);
