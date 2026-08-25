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

  // The four most influential ranks in a suit, whatever the deck size.
  const FIRST = Cards.HIGHEST_VALUE;
  const SECOND = FIRST - 1;
  const THIRD = FIRST - 2;
  const FOURTH = FIRST - 3;

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
      const has = (value) => cards.some((card) => card.value === value);

      if (trump && suit === trump) {
        if (has(FIRST)) total += 1.10;
        if (has(SECOND)) total += length >= 2 ? 1.00 : 0.53;
        if (has(THIRD)) total += length >= 3 ? 0.74 : 0.27;
        if (has(FOURTH)) total += length >= 4 ? 0.40 : 0.11;
        total += Math.max(0, length - 4) * 0.63; // a long suit of sway runs at the end
        continue;
      }

      if (length === 0) {
        // Being void only helps if we hold agents of the ruling suit.
        total += Math.min(trumpLength, 3) * 0.48;
        continue;
      }

      if (has(FIRST)) total += 1.05;
      if (has(SECOND)) total += length >= 2 ? 0.76 : 0.32;
      if (has(THIRD)) total += length >= 3 ? 0.45 : 0.11;
      if (has(FOURTH)) total += length >= 4 ? 0.20 : 0.03;

      if (trump) {
        if (length === 1) total += Math.min(trumpLength, 2) * 0.32;
      } else {
        total += Math.max(0, length - 4) * 0.34; // a long suit runs when nobody holds sway
      }
    }
    return total;
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
   * Would this noble rather have a word from the monarch, or go without?
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

      // Promising nothing pays +10 and costs -10, far more than the two a
      // trick is otherwise worth, so it is worth reaching a little for.
      const nilPull = bid === 0 ? -0.55 : 0;

      const cost = Math.abs(bid - wanted) + overreach + nilPull +
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

  /** Nothing unseen can beat this card in its own suit. */
  function isTopOutstanding(card, seen) {
    for (const rank of Cards.RANKS) {
      const value = Cards.RANKS.indexOf(rank) + 2;
      if (value <= card.value) continue;
      if (!seen.has(rank + card.suit)) return false;
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
    estimateTricks: estimateTricks,
    bidCombos: bidCombos,
    wantsWhisper: wantsWhisper,
    chooseBidCards: chooseBidCards,
    chooseCard: chooseCard,
    isTopOutstanding: isTopOutstanding
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
