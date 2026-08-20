/*
 * rules.js - the pure rules of the game. No state, no DOM.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;

  const PLAYER_COUNT = 4;
  const HAND_SIZE = 15;      // cards dealt to each noble
  const BID_CARDS = 4;       // agents sent out on errands, face down
  const TRICKS_PER_HAND = HAND_SIZE - BID_CARDS; // 11 audiences
  const TARGET_SCORE = 40;   // favour needed to win the season

  // How many nobles kept their pledge last session -> who holds sway this one.
  const SWAY_LADDER = ['C', 'D', 'H', 'S', null];

  /**
   * A pledge is the sum of the four face-down agents, ranks ignored. Four
   * Assassins would come to twelve, so a pledge is capped at the number of
   * audiences the session actually has: you cannot promise the court more
   * than it can give.
   */
  function bidFromCards(cards) {
    return Math.min(Cards.bidValueOf(cards), TRICKS_PER_HAND);
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
   *   bid 0: +3 for taking no tricks; -5 for the first trick taken and -2 for
   *          every trick after that.
   *   exact bid (> 0): 2 points per trick won.
   *   missed bid: 1 point per trick won, minus 2 for every trick off the bid.
   */
  function scoreHand(bid, tricksWon) {
    if (bid === 0) return tricksWon === 0 ? 3 : -5 - 2 * (tricksWon - 1);
    if (tricksWon === bid) return 2 * tricksWon;
    return tricksWon - 2 * Math.abs(tricksWon - bid);
  }

  function madeBid(bid, tricksWon) {
    return bid === tricksWon;
  }

  /** Who holds sway next session, from the number of nobles who kept their pledge. */
  function trumpForNextHand(madeCount) {
    return SWAY_LADDER[Math.max(0, Math.min(PLAYER_COUNT, madeCount))];
  }

  function trumpLabel(trump) {
    return trump === null ? 'No Sway' : Cards.SUIT_ROLE_PLURAL[trump];
  }

  /** Seat to the left (clockwise) of the given seat. */
  function leftOf(seat) {
    return (seat + 1) % PLAYER_COUNT;
  }

  /** Combined rank value of the three face-down bid cards. */
  function bidCardValue(row) {
    return row.bidCards.reduce((total, card) => total + card.value, 0);
  }

  // Applied in order when two players finish the last hand on the same total.
  const TIE_BREAKERS = [
    { label: 'more points that hand', value: (row) => row.points },
    { label: 'the higher bid', value: (row) => row.bid },
    { label: 'higher-ranked bid cards', value: bidCardValue }
  ];

  /** Ranking used for the final standings: total first, then the tie-breakers. */
  function compareForWin(a, b) {
    if (b.total !== a.total) return b.total - a.total;
    for (const breaker of TIE_BREAKERS) {
      const difference = breaker.value(b) - breaker.value(a);
      if (difference !== 0) return difference;
    }
    return 0;
  }

  /**
   * Decide the game from the rows of the final hand. The highest total wins.
   * If two players end level, the winner is the one who scored more points that
   * hand; failing that the higher bid; failing that the higher combined rank of
   * their three bid cards.
   */
  function decideWinner(rows) {
    const bestTotal = Math.max.apply(null, rows.map((row) => row.total));
    let pool = rows.filter((row) => row.total === bestTotal);
    const wasTied = pool.length > 1;
    let reason = null;

    for (const breaker of TIE_BREAKERS) {
      if (pool.length === 1) break;
      const best = Math.max.apply(null, pool.map((row) => breaker.value(row)));
      const narrowed = pool.filter((row) => breaker.value(row) === best);
      if (narrowed.length < pool.length) reason = breaker.label;
      pool = narrowed;
    }

    return {
      winners: pool.map((row) => row.name),
      wasTied: wasTied,
      reason: pool.length === 1 ? reason : null
    };
  }

  global.Rules = {
    PLAYER_COUNT: PLAYER_COUNT,
    HAND_SIZE: HAND_SIZE,
    BID_CARDS: BID_CARDS,
    TRICKS_PER_HAND: TRICKS_PER_HAND,
    TARGET_SCORE: TARGET_SCORE,
    SWAY_LADDER: SWAY_LADDER,
    bidFromCards: bidFromCards,
    legalPlays: legalPlays,
    trickWinner: trickWinner,
    scoreHand: scoreHand,
    madeBid: madeBid,
    trumpForNextHand: trumpForNextHand,
    trumpLabel: trumpLabel,
    leftOf: leftOf,
    bidCardValue: bidCardValue,
    TIE_BREAKERS: TIE_BREAKERS,
    compareForWin: compareForWin,
    decideWinner: decideWinner
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
