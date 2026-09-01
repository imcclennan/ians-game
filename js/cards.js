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
    C: "<path d='M50 44 C31 44 19 56 19 72 L19 84 L81 84 L81 72 C81 56 69 44 50 44 Z'/>" +
       "<path d='M58.5 42.8 L55.7 39.1 L52.8 35.6 L49.8 32.3 L46.8 29.3 L43.8 26.5 L40.7 24.0 L37.6 21.8 L34.5 19.8 L31.4 18.1 L28.2 16.7 L25.1 15.5 L21.9 14.7 L18.8 14.1 L15.8 13.9 L14.2 20.1 L16.6 21.3 L18.8 22.5 L21.0 24.0 L23.0 25.6 L25.0 27.5 L26.9 29.5 L28.9 31.7 L30.7 34.1 L32.6 36.8 L34.4 39.6 L36.2 42.6 L37.9 45.9 L39.7 49.4 L41.5 53.2 Z'/>" +
       "<path d='M58.5 53.2 L60.3 49.4 L62.1 45.9 L63.8 42.6 L65.6 39.6 L67.4 36.8 L69.3 34.1 L71.1 31.7 L73.1 29.5 L75.0 27.5 L77.0 25.6 L79.0 24.0 L81.2 22.5 L83.4 21.3 L85.8 20.1 L84.2 13.9 L81.2 14.1 L78.1 14.7 L74.9 15.5 L71.8 16.7 L68.6 18.1 L65.5 19.8 L62.4 21.8 L59.3 24.0 L56.2 26.5 L53.2 29.3 L50.2 32.3 L47.2 35.6 L44.3 39.1 L41.5 42.8 Z'/>" +
       "<path d='M45 17 L55 17 L55 47 L45 47 Z'/><circle cx='50' cy='11' r='10'/>" +
       "<circle cx='13' cy='14' r='10'/><circle cx='87' cy='14' r='10'/>",
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
