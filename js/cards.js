/*
 * cards.js - the deck and its primitives.
 *
 * Sixty cards: four agents, fifteen apiece, each ranked by their standing at
 * court. The four kinds do not share a ladder. Each keeps to its own stretch
 * of the ranks and crowds it in its own way -- the Assassins at the top, the
 * Fools at the bottom, the Merchants alone running the whole range, and the
 * Lovers taking every other rung in pairs.
 *
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
  // Redrawn from newmarks.py, which is where the geometry is worked out: the
  // Fool's arms are a tapered band along a quadratic, the Merchant's chains are
  // thin filled bars, the Lover's hearts are one path moved and scaled. Edit
  // there and re-emit rather than editing these coordinates by hand.
  //
  // Everything is filled, nothing stroked. emblem() wraps a mark in a group
  // carrying fill and nothing else, so a stroked path would print black
  // wherever a kind sets its mark in its own ink.
    S: "<path d='M50 6 L58 32 L58 60 L42 60 L42 32 Z'/>" +
       "<rect x='27' y='60' width='46' height='8' rx='2'/>" +
       "<rect x='45' y='68' width='10' height='18'/>" +
       "<circle cx='50' cy='90' r='7'/>",
    H: "<path d='M26.5 95.8 L72.5 33.8 L67.5 30.2 L21.5 92.2 Z'/>" +
       "<path d='M78.5 92.2 L32.5 30.2 L27.5 33.8 L73.5 95.8 Z'/>" +
       "<path d='M60.4 45.0 C57.4 28.7 57.3 20.6 60.7 16.0 C64.1 11.5 69.2 11.3 73.1 14.2 C76.1 16.3 77.1 19.7 76.8 22.9 C79.7 21.6 83.2 21.7 86.1 23.8 C90.0 26.7 91.4 31.7 88.0 36.3 C84.6 40.8 76.9 43.1 60.4 45.0 Z'/>" +
       "<path d='M39.6 45.0 C23.1 43.1 15.4 40.8 12.0 36.3 C8.6 31.7 10.0 26.7 13.9 23.8 C16.8 21.7 20.3 21.6 23.2 22.9 C22.9 19.7 23.9 16.3 26.9 14.2 C30.8 11.3 35.9 11.5 39.3 16.0 C42.7 20.6 42.6 28.7 39.6 45.0 Z'/>",
    D: "<path d='M46 14 L54 14 L54 76 L46 76 Z'/><path d='M14 22 L86 22 L86 29 L14 29 Z'/>" +
       "<circle cx='50' cy='13' r='6'/><path d='M18.9 28.3 L2.9 55.3 L5.1 56.7 L21.1 29.7 Z'/>" +
       "<path d='M18.9 29.7 L34.9 56.7 L37.1 55.3 L21.1 28.3 Z'/>" +
       "<path d='M4 56 A16 16 0 0 0 36 56 Z'/>" +
       "<path d='M78.9 28.3 L62.9 55.3 L65.1 56.7 L81.1 29.7 Z'/>" +
       "<path d='M78.9 29.7 L94.9 56.7 L97.1 55.3 L81.1 28.3 Z'/>" +
       "<path d='M64 56 A16 16 0 0 0 96 56 Z'/><path d='M34 84 C34 75 66 75 66 84 Z'/>" +
       "<path d='M24 84 L76 84 L76 92 L24 92 Z'/>",
    C: "<circle cx='22.50' cy='25.00' r='7'/>" +
       "<path d='m 52.5,51 c -19,0 -31,9.3 -31,21.7 l 0,9.3 l 62,0 l 0,-9.3 c 0,-12.4 -12,-21.7 -31,-21.7 z'/>" +
       "<path d='M45.20 51.45 L42.61 47.43 L39.93 43.87 L37.00 41.01 L33.80 38.77 L30.00 37.38 L25.94 37.30 L22.14 38.46 L19.20 40.63 L16.79 43.33 L14.63 46.66 L12.64 50.60 L10.74 55.24 L8.93 60.50 L7.20 66.45 L12.90 68.00 L15.15 62.35 L17.30 57.48 L19.46 53.46 L21.54 50.29 L23.52 47.97 L25.25 46.58 L26.46 46.12 L26.89 46.19 L27.06 46.42 L27.58 46.89 L28.62 48.05 L30.09 50.06 L31.73 52.84 L33.63 56.71 L45.20 51.45 Z'/>" +
       "<path d='M67.61 56.40 L68.39 52.00 L69.19 48.77 L70.03 46.38 L70.68 44.96 L71.03 44.37 L71.13 44.09 L71.50 43.92 L72.70 44.15 L74.58 45.24 L76.92 47.24 L79.54 50.10 L82.44 53.82 L85.55 58.43 L88.91 63.83 L93.66 61.04 L90.68 55.22 L87.79 50.14 L84.98 45.71 L82.25 42.03 L79.52 39.03 L76.70 36.72 L73.54 35.08 L69.85 34.67 L66.23 35.59 L63.15 37.82 L60.82 40.81 L58.87 44.39 L57.32 48.63 L55.96 53.34 L67.61 56.40 Z'/>" +
       "<circle cx='11.50' cy='60.00' r='9'/>" +
       "<circle cx='88.50' cy='58.00' r='9'/>" +
       "<path d='M52.02 62.43 L53.76 57.82 L55.08 53.28 L55.70 48.68 L55.69 44.00 L54.66 38.91 L52.44 33.99 L49.39 29.85 L46.02 27.11 L42.51 25.20 L38.66 23.83 L34.41 22.90 L29.66 22.33 L24.47 22.09 L18.77 22.22 L20.74 29.66 L26.49 30.27 L31.57 31.07 L35.97 32.18 L39.65 33.50 L42.61 35.03 L44.69 36.60 L45.73 37.88 L45.91 38.43 L45.83 38.72 L45.75 39.52 L45.41 41.20 L44.64 43.71 L43.35 46.72 L41.35 50.44 L52.02 62.43 Z'/>",
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

  // Audiences promised when an agent is sent out on an errand. A Fool costs a
  // promise rather than making none, which is what lets a set of errands come
  // to nothing at all.
  const BID_VALUE = { C: -1, D: 1, H: 2, S: 3 };

  /** A kind holding one card at every rank from 1 up to the given rank. */
  function oneEach(highest) {
    const copies = {};
    for (let rank = 1; rank <= highest; rank++) copies[rank] = 1;
    return copies;
  }

  const HIGHEST_VALUE = 15;

  // Every rank the deck holds anywhere. Only the Merchants run all of them.
  const RANKS = Object.keys(oneEach(HIGHEST_VALUE));

  /**
   * How many of each rank each kind holds. Fifteen cards apiece, sixty in all.
   * A rank a kind does not appear at is simply absent, and cards of one rank
   * and kind are identical in play.
   */
  const COPIES = {
    // One 5 down to five 1s: the Fools are worthless and there are hordes of
    // them, which is the point of a kind that costs you a promise.
    C: { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 },
    // The only kind that runs the whole ladder, one of each.
    D: oneEach(HIGHEST_VALUE),
    // A single 1, then a pair at every even rank up to 14.
    H: { 1: 1, 2: 2, 4: 2, 6: 2, 8: 2, 10: 2, 12: 2, 14: 2 },
    // Five 15s down to a single 11. Rank only ever settles an audience between
    // two agents of the same kind, so the range itself says nothing about the
    // Assassins against anyone else -- what it carries is the crowding, thin at
    // the bottom and five deep at the top. Starting them at 11 does have one
    // consequence: no Assassin can be an agent of rank 5 or lower, which is
    // what The Modest pays for.
    S: { 11: 1, 12: 2, 13: 3, 14: 4, 15: 5 }
  };

  /**
   * Why each kind is arranged the way it is: the politics of the ladder, not a
   * rule. Kept here beside COPIES because the two have to agree -- a note that
   * says the Merchants share no rung is wrong the moment COPIES.D holds a pair
   * -- and because both the app's rulebook and the printed sheet set it, and a
   * second copy of a paragraph is a second copy to go stale.
   */
  const KIND_NOTE = {
    S: 'The trade admits nobody without a name already made. Above that, standing is ' +
       'reputation, and reputation is shared: five of them claim to be the best, and ' +
       'not one can prove the claim.',
    H: 'They arrive in pairs. Only one comes to court unattached, and stands at the ' +
       'bottom alone.',
    D: 'The ledger settles it. Every station is held by exactly one merchant, nobody ' +
       'shares a rung, and each of them knows to the penny who stands above them.',
    C: 'Anyone may call themselves a fool, and most of the court does, so the low rungs ' +
       'are packed and the ladder is short. At the top of it there is one \u2014 the ' +
       'single fool the monarch actually listens to.'
  };

  // The most of any one rank the deck holds, which is how many marks a card
  // may have to carry.
  const MOST_COPIES = 5;

  /**
   * How many cards of this rank the deck holds in this kind. Zero where the
   * kind does not run to that rank at all.
   */
  function copiesOf(suit, rank) {
    return COPIES[suit][String(rank)] || 0;
  }

  /** The ranks this kind actually holds, lowest first. */
  function ranksOf(suit) {
    return Object.keys(COPIES[suit]).sort((a, b) => Number(a) - Number(b));
  }

  /**
   * An agent's name in the pack. Cards of one rank and kind are identical in
   * play and carry no distinguishing face, but they must still be told apart
   * here: a shared id would let removeCards strip every copy at once, and
   * would make every Set of cards already seen quietly undercount.
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
   * What a set of agents promises, before anything is done about a total of
   * nothing or less. Rules.bidFromCards turns this into a pledge.
   */
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
    COPIES: COPIES,
    KIND_NOTE: KIND_NOTE,
    MOST_COPIES: MOST_COPIES,
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
})(typeof globalThis !== 'undefined' ? globalThis : this);
