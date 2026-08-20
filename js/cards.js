/*
 * cards.js - deck, card and sorting primitives.
 * Loaded as a plain script in the browser (sets globalThis.Cards) and
 * require()-able from Node for the test suite.
 */
(function (global) {
  'use strict';

  const SUITS = ['C', 'D', 'H', 'S'];
  const SUIT_NAME = { C: 'Clubs', D: 'Diamonds', H: 'Hearts', S: 'Spades' };
  const SUIT_SYMBOL = { C: '♣', D: '♦', H: '♥', S: '♠' };
  const SUIT_COLOR = { C: 'black', D: 'red', H: 'red', S: 'black' };

  // How many tricks each suit is worth when used as a face-down bidding card.
  const BID_VALUE = { C: 0, D: 1, H: 2, S: 3 };

  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  // Display order for a fanned hand: alternating colours, trump pulled to the front.
  const DISPLAY_ORDER = ['S', 'H', 'C', 'D'];

  function makeCard(suit, rank) {
    return {
      suit: suit,
      rank: rank,
      value: RANKS.indexOf(rank) + 2, // 2..14, Ace high
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

  function suitOrder(trump) {
    const order = DISPLAY_ORDER.filter((suit) => suit !== trump);
    return trump ? [trump].concat(order) : order;
  }

  // Sorted for the human's fan: trump first, then alternating colours, high to low.
  function sortHand(cards, trump) {
    const order = suitOrder(trump);
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
    return card.rank + SUIT_SYMBOL[card.suit];
  }

  global.Cards = {
    SUITS: SUITS,
    SUIT_NAME: SUIT_NAME,
    SUIT_SYMBOL: SUIT_SYMBOL,
    SUIT_COLOR: SUIT_COLOR,
    BID_VALUE: BID_VALUE,
    RANKS: RANKS,
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
