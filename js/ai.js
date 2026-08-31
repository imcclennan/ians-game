/*
 * ai.js - the rival nobles: hand valuation, choosing which agents to send out,
 * and playing for audiences. Every decision is a heuristic and none of them
 * peek at hidden information.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Rules = global.Rules;
  const Whispers = global.Whispers;

  /**
   * The four most influential ranks a kind actually holds, highest first. The
   * kinds do not share a ladder -- the Fools stop at 5 and the Assassins start
   * at 11 -- so an honour has to be read against its own kind.
   *
   * Kept for the rulebook and the tests; the estimate itself no longer asks
   * which ranks a hand holds, but what can still beat them.
   */
  function honours(suit) {
    const ranks = Cards.ranksOf(suit).map(Number);
    return ranks.slice(-4).reverse();
  }

  /**
   * How many agents of a card's own kind, held by somebody else, could take an
   * audience from it.
   *
   * An equal rank counts as a threat, not merely a higher one: an audience
   * between two of a kind goes to whoever played second, so a matching card
   * played after this one beats it. Cards of that rank in our own hand are not
   * threats, since we choose when they are played.
   *
   * This is what a rank position cannot tell you on this deck. The top rank of
   * the Assassins is struck five times, so holding one leaves four outstanding
   * and proves almost nothing; the top rank of the Fools is struck once, and
   * holding it settles the kind outright.
   */
  function threatsTo(card, hand) {
    let inKind = 0;
    for (const rank of Cards.ranksOf(card.suit)) {
      if (Number(rank) >= card.value) inKind += Cards.copiesOf(card.suit, rank);
    }
    const ours = hand.filter(
      (held) => held.suit === card.suit && held.value >= card.value).length;
    return inKind - ours;
  }

  /**
   * Fitted by test/selfplay.js against whole seasons: the four nobles'
   * estimates should sum to about the eleven audiences on offer, and the
   * exact-pledge rate should be as high as the heuristic can make it.
   */
  const TUNING = {
    // How fast a card's promise falls away as more of its kind outrank it.
    // At 0.65 a card with nothing above it is a whole audience, one threat
    // leaves 0.61 of it, and an Assassin 15 with its four twins unaccounted
    // for is worth 0.28 -- which is about what one is worth when led.
    commandDecay: 0.65,
    // Applied to the whole estimate once the suits are added up.
    scale: 0.86
  };

  /** Roughly the chance a card takes the audience it is played into. */
  function command(threats) {
    return 1 / (1 + TUNING.commandDecay * threats);
  }

  // What the best, second-best, third and fourth-best agent of a kind are worth
  // in hand. These are the weights the game has always used; what has changed
  // is that each is now discounted by how much of the kind is still out there
  // above it, which is the job the old rank-position test did badly.
  const SLOT = {
    trump: [1.10, 1.00, 0.74, 0.40],
    side: [1.05, 0.76, 0.45, 0.20]
  };

  /**
   * Roughly how many audiences a hand is worth. Calibrated for eleven-card
   * hands with sixteen agents away on errands, so the four nobles' estimates
   * sum to about eleven.
   */
  function estimateTricks(hand, trump) {
    const trumpLength = trump ? Cards.cardsOfSuit(hand, trump).length : 0;
    let total = 0;

    for (const suit of Cards.SUITS) {
      const cards = Cards.cardsOfSuit(hand, suit);
      const length = cards.length;

      if (length === 0) {
        // Being void only helps if we hold agents of the ruling suit.
        if (trump && suit !== trump) total += Math.min(trumpLength, 3) * 0.48;
        continue;
      }

      const isTrump = !!trump && suit === trump;
      const slot = isTrump ? SLOT.trump : SLOT.side;
      const ranked = cards.slice().sort(Cards.byValueDesc);

      for (let i = 0; i < Math.min(4, length); i++) {
        total += slot[i] * command(threatsTo(ranked[i], hand));
      }

      if (isTrump) {
        total += Math.max(0, length - 4) * 0.63; // a long suit of sway runs at the end
      } else if (trump) {
        if (length === 1) total += Math.min(trumpLength, 2) * 0.32;
      } else {
        total += Math.max(0, length - 4) * 0.34; // a long suit runs when nobody holds sway
      }
    }
    return total * TUNING.scale;
  }

  /** Every combination of the hand that could be sent out as a pledge. */
  function bidCombos(hand, size) {
    const combos = [];
    const pick = [];
    (function walk(start) {
      if (pick.length === size) {
        combos.push(pick.slice());
        return;
      }
      for (let i = start; i <= hand.length - (size - pick.length); i++) {
        pick.push(hand[i]);
        walk(i + 1);
        pick.pop();
      }
    })(0);
    return combos;
  }

  /**
   * Would this noble rather have a word from the court, or go without?
   *
   * Taking one is free but blind, and a Whisper can bind as easily as it can
   * pay. A hand that already promises something exact has more to lose from a
   * demand it cannot refuse than it stands to gain, so it keeps its own
   * counsel; anything vaguer takes the word and hopes.
   */
  function wantsWhisper(hand, trump, aggression) {
    const bias = aggression || 1;
    let closest = Infinity;
    let estimateThere = 0;

    for (const combo of bidCombos(hand, Rules.BID_CARDS)) {
      const bid = Rules.bidFromCards(combo);
      if (bid > Rules.KEEPABLE_MAX) continue;
      const estimate = estimateTricks(Cards.removeCards(hand, combo), trump) * bias;
      const gap = Math.abs(bid - estimate);
      if (gap < closest) {
        closest = gap;
        estimateThere = estimate;
      }
    }

    // Measured over whole seasons, every word in the book is worth more than
    // silence, so a noble takes one almost always. The exception is a hand
    // that already sits exactly on a substantial promise: that is the one
    // hand a demand it cannot refuse can actually spoil.
    return !(closest < 0.16 && estimateThere >= 3.5);
  }

  /**
   * Choose the agents to send out. Their suits set the pledge and they leave
   * play, so we look for the combination whose pledge best matches the strength
   * of the hand it leaves behind.
   */
  function chooseBidCards(hand, trump, aggression, whisper) {
    const bias = aggression || 1;
    // Heeding a demand is worth roughly what the word pays for it, so a noble
    // weighs disobedience rather than being forbidden it.
    const bound = Whispers.canSatisfy(whisper, hand);
    const defiance = Whispers.restrictsErrands(whisper) ? 1.8 : 0;
    let best = null;

    for (const combo of bidCombos(hand, Rules.BID_CARDS)) {
      const bid = Rules.bidFromCards(combo);
      const kept = Cards.removeCards(hand, combo);
      const estimate = estimateTricks(kept, trump) * bias;

      // What this hand wants to promise, once the Whisper has had its say.
      const wanted = Whispers.pledgeFor(whisper, estimate);

      // Tie-break: among equally sensible pledges, send the weakest agents.
      const discardCost = combo.reduce((sum, card) => {
        return sum + card.value + (trump && card.suit === trump ? 6 : 0);
      }, 0);

      // Promising more than the court can give is never worth it.
      const overreach = Math.max(0, bid - Rules.KEEPABLE_MAX) * 3;

      // Promising nothing and meaning it pays far more than the two a single
      // audience is otherwise worth, so it is worth reaching a little for. A
      // hollow promise pays less than the smallest kept
      // pledge, so it is worth reaching slightly away from.
      const noughtPull = bid === 0 ? (Rules.isFoolsErrand(combo) ? -0.55 : 0.45) : 0;

      const cost = Math.abs(bid - wanted) + overreach + noughtPull +
        Whispers.pledgeCost(whisper, bid) + discardCost * 0.002;

      const disobeys = bound && !Whispers.permitsSet(whisper, combo, hand);
      const candidate = { cards: combo, bid: bid, cost: cost + (disobeys ? defiance : 0) };
      if (!best || candidate.cost < best.cost) best = candidate;
    }
    return best.cards;
  }

  // --- card play -----------------------------------------------------------

  /** Cost of parting with a card: trumps are precious. */
  function keepCost(card, trump) {
    return card.value + (trump && card.suit === trump ? 20 : 0);
  }

  function cheapest(cards, trump) {
    return cards.reduce((a, b) => (keepCost(b, trump) < keepCost(a, trump) ? b : a));
  }

  function dearest(cards, trump) {
    return cards.reduce((a, b) => (keepCost(b, trump) > keepCost(a, trump) ? b : a));
  }

  /**
   * Nothing unseen can beat this card in its own suit.
   *
   * An audience is settled in favour of whoever played second, so an unseen
   * agent of the *same* rank beats this one as surely as a higher one does.
   * The scan therefore starts at the card's own rank and accounts for every
   * copy of every rank at or above it -- the card itself excepted, which is in
   * hand and therefore beats nothing but itself.
   */
  function isTopOutstanding(card, seen) {
    for (const rank of Cards.ranksOf(card.suit)) {
      if (Number(rank) < card.value) continue;
      for (const id of Cards.idsFor(card.suit, rank)) {
        if (id === card.id) continue;
        if (!seen.has(id)) return false;
      }
    }
    return true;
  }

  function longestSuit(hand, trump) {
    let best = null;
    for (const suit of Cards.SUITS) {
      if (trump && suit === trump) continue;
      const length = Cards.cardsOfSuit(hand, suit).length;
      if (length > 0 && (!best || length > best.length)) best = { suit: suit, length: length };
    }
    return best;
  }

  function chooseLead(legal, ctx) {
    const { trump, seen, hand, wantsTrick } = ctx;
    const favoured = Whispers.favouredSuit(ctx.whisper);

    // If a noble has shown us a pledge they have already filled, every further
    // audience costs them. Opening with a card nobody can beat keeps the lead
    // in our hands; opening low hands it around, and they may be the one who
    // has to take it.
    const sated = (ctx.watched || []).some((other) => other.needs <= 0);
    if (!wantsTrick && sated) {
      const throwaway = legal.filter((card) => !isTopOutstanding(card, seen));
      if (throwaway.length) return cheapest(throwaway, trump);
    }

    if (wantsTrick && favoured) {
      // Lead a Fool we can actually win with, if we hold one.
      const winners = Cards.cardsOfSuit(legal, favoured)
        .filter((card) => isTopOutstanding(card, seen));
      if (winners.length) return winners.reduce((a, b) => (b.value > a.value ? b : a));
    }

    if (!wantsTrick) {
      // Bid already filled: lead something small and hope to duck.
      return cheapest(legal, trump);
    }

    const trumps = trump ? Cards.cardsOfSuit(hand, trump) : [];
    if (trumps.length >= 4) {
      const topTrump = trumps.reduce((a, b) => (b.value > a.value ? b : a));
      if (isTopOutstanding(topTrump, seen)) return topTrump; // draw trumps
    }

    const sure = legal.filter((card) => isTopOutstanding(card, seen));
    if (sure.length) {
      const sideSure = sure.filter((card) => !trump || card.suit !== trump);
      const pool = sideSure.length ? sideSure : sure;
      return pool.reduce((a, b) => (b.value > a.value ? b : a));
    }

    const long = longestSuit(hand, trump);
    const pool = long ? Cards.cardsOfSuit(legal, long.suit) : legal;
    const candidates = pool.length ? pool : legal;
    return candidates.reduce((a, b) => (b.value > a.value ? b : a));
  }

  function chooseFollow(legal, ctx) {
    const { trick, trump, seen, wantsTrick } = ctx;
    const favoured = Whispers.favouredSuit(ctx.whisper);
    const shunned = Whispers.shunnedSuit(ctx.whisper);
    const seatsAfterUs = Rules.PLAYER_COUNT - 1 - trick.length;

    const wouldWin = (card) => {
      const hypothetical = trick.concat([{ player: -1, card: card }]);
      return Rules.trickWinner(hypothetical, trump).card.id === card.id;
    };

    const winners = legal.filter(wouldWin);
    const losers = legal.filter((card) => !wouldWin(card));

    // A noble whose pledge is on show gets played at rather than played with.
    if (!wantsTrick && winners.length && trick.length) {
      const leading = Rules.trickWinner(trick, trump).player;
      const exposed = (ctx.watched || []).find((other) => other.seat === leading);
      if (exposed && exposed.needs > 0) {
        // Free to spoil: our own promise is already broken, so an extra
        // audience costs us almost nothing.
        if (ctx.overshot) return cheapest(winners, trump);
        // Not free, but worth it: this audience would complete a large pledge,
        // and taking a kept pledge off them costs them far more than breaking
        // ours costs us.
        if (exposed.needs === 1 && exposed.bid >= 4) return cheapest(winners, trump);
      }
    }

    if (wantsTrick) {
      if (!winners.length) return cheapest(losers, trump);
      const wanted = favoured ? winners.filter((card) => card.suit === favoured) : [];
      // A noble marked for the blade would rather take the audience some other
      // way than with an Assassin.
      const unmarked = shunned ? winners.filter((card) => card.suit !== shunned) : [];
      const pool = wanted.length ? wanted : (unmarked.length ? unmarked : winners);
      if (seatsAfterUs === 0) return cheapest(pool, trump);
      const safe = pool.filter((card) => isTopOutstanding(card, seen));
      if (safe.length) return cheapest(safe, trump);
      return seatsAfterUs === 1 ? cheapest(pool, trump) : dearest(pool, trump);
    }

    // Bid already filled: shed the biggest card that cannot win the trick.
    if (losers.length) return dearest(losers, trump);
    return cheapest(winners, trump);
  }

  /**
   * ctx: { hand, trick, trump, bid, tricksWon, seen, whisper }
   *   trick - plays so far this audience, [] if we are opening
   *   seen  - Set of card ids we know are gone (our hand + everything played)
   */
  function chooseCard(ctx) {
    const ledSuit = ctx.trick.length ? ctx.trick[0].card.suit : null;
    const legal = Rules.legalPlays(ctx.hand, ledSuit);
    if (legal.length === 1) return legal[0];

    // A Contrarian is chasing the audiences it does not win, so what it is
    // actually aiming at may be nothing like its pledge.
    const target = Whispers.aimFor(ctx.whisper, ctx.bid);
    const enriched = Object.assign({}, ctx, {
      wantsTrick: ctx.tricksWon < target,
      // Our own promise is already broken past mending, so one more audience
      // costs little -- which is when spite becomes affordable.
      overshot: ctx.tricksWon > target
    });
    return ledSuit ? chooseFollow(legal, enriched) : chooseLead(legal, enriched);
  }

  global.AI = {
    TUNING: TUNING,
    honours: honours,
    threatsTo: threatsTo,
    estimateTricks: estimateTricks,
    bidCombos: bidCombos,
    wantsWhisper: wantsWhisper,
    chooseBidCards: chooseBidCards,
    chooseCard: chooseCard,
    isTopOutstanding: isTopOutstanding
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
