/*
 * ai.js - the rival nobles: hand valuation, choosing which agents to send out,
 * and playing for audiences. Every decision is a heuristic and none of them
 * peek at hidden information.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Rules = global.Rules;

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
   * Choose the agents to send out. Their suits set the pledge and they leave
   * play, so we look for the combination whose pledge best matches the strength
   * of the hand it leaves behind.
   */
  function chooseBidCards(hand, trump, aggression) {
    const bias = aggression || 1;
    let best = null;

    for (const combo of bidCombos(hand, Rules.BID_CARDS)) {
      const bid = Rules.bidFromCards(combo);
      const kept = Cards.removeCards(hand, combo);
      const estimate = estimateTricks(kept, trump) * bias;

      // Tie-break: among equally sensible bids, throw away the weakest cards.
      const discardCost = combo.reduce((sum, card) => {
        return sum + card.value + (trump && card.suit === trump ? 6 : 0);
      }, 0);

      const cost = Math.abs(bid - estimate) + discardCost * 0.002;
      if (!best || cost < best.cost) best = { cards: combo, bid: bid, cost: cost };
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
    const seatsAfterUs = Rules.PLAYER_COUNT - 1 - trick.length;

    const wouldWin = (card) => {
      const hypothetical = trick.concat([{ player: -1, card: card }]);
      return Rules.trickWinner(hypothetical, trump).card.id === card.id;
    };

    const winners = legal.filter(wouldWin);
    const losers = legal.filter((card) => !wouldWin(card));

    if (wantsTrick) {
      if (!winners.length) return cheapest(losers, trump);
      if (seatsAfterUs === 0) return cheapest(winners, trump);
      const safe = winners.filter((card) => isTopOutstanding(card, seen));
      if (safe.length) return cheapest(safe, trump);
      return seatsAfterUs === 1 ? cheapest(winners, trump) : dearest(winners, trump);
    }

    // Bid already filled: shed the biggest card that cannot win the trick.
    if (losers.length) return dearest(losers, trump);
    return cheapest(winners, trump);
  }

  /**
   * ctx: { hand, trick, trump, bid, tricksWon, seen }
   *   trick - plays so far this trick, [] if we are leading
   *   seen  - Set of card ids we know are gone (our hand + everything played)
   */
  function chooseCard(ctx) {
    const ledSuit = ctx.trick.length ? ctx.trick[0].card.suit : null;
    const legal = Rules.legalPlays(ctx.hand, ledSuit);
    if (legal.length === 1) return legal[0];

    const enriched = Object.assign({}, ctx, { wantsTrick: ctx.tricksWon < ctx.bid });
    return ledSuit ? chooseFollow(legal, enriched) : chooseLead(legal, enriched);
  }

  global.AI = {
    estimateTricks: estimateTricks,
    bidCombos: bidCombos,
    chooseBidCards: chooseBidCards,
    chooseCard: chooseCard,
    isTopOutstanding: isTopOutstanding
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
