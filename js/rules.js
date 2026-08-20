/*
 * rules.js - the pure rules of the game. No state, no DOM.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;

  const PLAYER_COUNT = 4;
  const HAND_SIZE = 13;      // cards dealt to each player
  const BID_CARDS = 3;       // set aside face down as the bid
  const TRICKS_PER_HAND = HAND_SIZE - BID_CARDS; // 10
  const TARGET_SCORE = 50;

  // How many players made their bid last hand -> trump for this hand.
  const TRUMP_LADDER = ['C', 'D', 'H', 'S', null];

  /** Bid = sum of the suit values of the three face-down cards (ranks ignored). */
  function bidFromCards(cards) {
    return Cards.bidValueOf(cards);
  }

  /** Cards a player is allowed to play: must follow the led suit when able. */
  function legalPlays(hand, ledSuit) {
    if (!ledSuit) return hand.slice();
    const followers = hand.filter((card) => card.suit === ledSuit);
    return followers.length > 0 ? followers : hand.slice();
  }

  /**
   * Which play wins the trick.
   * plays: [{ player, card }] in the order they were played, index 0 led.
   * trump: suit letter, or null for No Trump.
   */
  function trickWinner(plays, trump) {
    if (!plays.length) return null;
    let best = plays[0];
    for (const play of plays.slice(1)) {
      const card = play.card;
      const bestCard = best.card;
      const cardIsTrump = trump !== null && card.suit === trump;
      const bestIsTrump = trump !== null && bestCard.suit === trump;
      if (cardIsTrump && !bestIsTrump) {
        best = play;
      } else if (cardIsTrump === bestIsTrump) {
        // Same category. The card currently winning is either trump or the led
        // suit, so only a higher card of that same suit can take it.
        if (card.suit === bestCard.suit && card.value > bestCard.value) best = play;
      }
    }
    return best;
  }

  /**
   * Points for one player at the end of a hand.
   *   bid 0: +5 for taking no tricks, -5 for taking any.
   *   exact bid (> 0): 2 points per trick won.
   *   missed bid: 1 point per trick won, minus 2 for every trick off the bid.
   */
  function scoreHand(bid, tricksWon) {
    if (bid === 0) return tricksWon === 0 ? 5 : -5;
    if (tricksWon === bid) return 2 * tricksWon;
    return tricksWon - 2 * Math.abs(tricksWon - bid);
  }

  function madeBid(bid, tricksWon) {
    return bid === tricksWon;
  }

  /** Trump for the next hand, from the number of players who made their bid. */
  function trumpForNextHand(madeCount) {
    return TRUMP_LADDER[Math.max(0, Math.min(PLAYER_COUNT, madeCount))];
  }

  function trumpLabel(trump) {
    return trump === null ? 'No Trump' : Cards.SUIT_NAME[trump];
  }

  /** Seat to the left (clockwise) of the given seat. */
  function leftOf(seat) {
    return (seat + 1) % PLAYER_COUNT;
  }

  global.Rules = {
    PLAYER_COUNT: PLAYER_COUNT,
    HAND_SIZE: HAND_SIZE,
    BID_CARDS: BID_CARDS,
    TRICKS_PER_HAND: TRICKS_PER_HAND,
    TARGET_SCORE: TARGET_SCORE,
    TRUMP_LADDER: TRUMP_LADDER,
    bidFromCards: bidFromCards,
    legalPlays: legalPlays,
    trickWinner: trickWinner,
    scoreHand: scoreHand,
    madeBid: madeBid,
    trumpForNextHand: trumpForNextHand,
    trumpLabel: trumpLabel,
    leftOf: leftOf
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
