/*
 * rules.js - the pure rules of the game. No state, no DOM.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Ruleset = global.Ruleset;

  const PLAYER_COUNT = 4;
  const HAND_SIZE = 15;      // cards dealt to each noble
  const BID_CARDS = 4;       // agents sent out on errands, face down
  const TRICKS_PER_HAND = HAND_SIZE - BID_CARDS; // 11 audiences
  // A season is twelve nights of court, the last of them Twelfth Night, when
  // the Fool presides and the accounts are settled for good.
  const SEASON_LENGTH = 12;

  // How many nobles kept their pledge last night -> who holds sway this one.
  const SWAY_LADDER = ['C', 'D', 'H', 'S', null];

  /**
   * A pledge is the sum of the four face-down agents, ranks ignored. Four
   * Assassins come to twelve, one more than the court has to give: promise
   * that and you have already broken your word. Overreaching is punished by
   * the scoring, not forbidden by the rules.
   *
   * Where an agent can cost a promise rather than make one, a set that comes to
   * nothing or less pledges nothing; there is no promising the court a negative
   * number of audiences.
   */
  function bidFromCards(cards) {
    const total = Cards.bidValueOf(cards);
    return Ruleset.current().clampPledge ? Math.max(0, total) : total;
  }

  /**
   * Whether an errand of nothing is a true nil -- the whole errand given over
   * to Fools -- rather than a set that merely adds up to nought. The two pay
   * very differently where the ruleset tells them apart, and are the same thing
   * where it does not.
   */
  function isTrueNil(cards) {
    return bidFromCards(cards) === 0 && Ruleset.current().isTrueNil(cards, 0);
  }

  /** The largest pledge that can actually be kept. */
  const KEEPABLE_MAX = TRICKS_PER_HAND;

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
   *
   * Where the deck strikes some ranks twice, two agents of the same kind can
   * meet on the same rank. The audience then goes to whoever played second: the
   * later word is the one the court remembers. A ruling agent still beats a
   * lesser kind whatever its rank, so the tie can only ever be settled inside a
   * single kind.
   */
  function trickWinner(plays, trump) {
    if (!plays.length) return null;
    const tieToSecond = Ruleset.current().tieToSecond;
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
        const takes = tieToSecond ? card.value >= bestCard.value : card.value > bestCard.value;
        if (card.suit === bestCard.suit && takes) best = play;
      }
    }
    return best;
  }

  /**
   * Favour for one noble at the end of a night, per the table the active
   * ruleset keeps. isTrueNil says whether a pledge of nothing was four Fools or
   * merely arithmetic; where a ruleset does not tell the two apart it is
   * ignored, so the signature is the same either way.
   */
  function scoreHand(bid, tricksWon, isTrueNilErrand) {
    return Ruleset.current().scoreHand(bid, tricksWon, !!isTrueNilErrand);
  }

  function madeBid(bid, tricksWon) {
    return bid === tricksWon;
  }

  /** Who holds sway next night, from the number of nobles who kept their pledge. */
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

  /** Seat to the right (anticlockwise), who plays into you rather than after you. */
  function rightOf(seat) {
    return (seat + PLAYER_COUNT - 1) % PLAYER_COUNT;
  }

  /** Combined rank value of the four face-down bid cards. */
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
   * their four bid cards.
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
    KEEPABLE_MAX: KEEPABLE_MAX,
    SEASON_LENGTH: SEASON_LENGTH,
    SWAY_LADDER: SWAY_LADDER,
    bidFromCards: bidFromCards,
    isTrueNil: isTrueNil,
    legalPlays: legalPlays,
    trickWinner: trickWinner,
    scoreHand: scoreHand,
    madeBid: madeBid,
    trumpForNextHand: trumpForNextHand,
    trumpLabel: trumpLabel,
    leftOf: leftOf,
    rightOf: rightOf,
    bidCardValue: bidCardValue,
    TIE_BREAKERS: TIE_BREAKERS,
    compareForWin: compareForWin,
    decideWinner: decideWinner
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
