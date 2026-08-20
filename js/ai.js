/*
 * ai.js - computer opponents: hand valuation, bid-card selection, card play.
 * Every decision is a heuristic; nothing here peeks at hidden information.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Rules = global.Rules;

  const ACE = 14, KING = 13, QUEEN = 12, JACK = 11;

  /**
   * Rough number of tricks a hand is worth. Calibrated for 10-card hands with
   * 12 cards out of play, so the four players' estimates sum to about 10.
   */
  function estimateTricks(hand, trump) {
    const trumpLength = trump ? Cards.cardsOfSuit(hand, trump).length : 0;
    let total = 0;

    for (const suit of Cards.SUITS) {
      const cards = Cards.cardsOfSuit(hand, suit);
      const length = cards.length;
      const has = (value) => cards.some((card) => card.value === value);

      if (trump && suit === trump) {
        if (has(ACE)) total += 1;
        if (has(KING)) total += length >= 2 ? 0.9 : 0.5;
        if (has(QUEEN)) total += length >= 3 ? 0.65 : 0.25;
        if (has(JACK)) total += length >= 4 ? 0.35 : 0.1;
        total += Math.max(0, length - 4) * 0.55; // long trumps run at the end
        continue;
      }

      if (length === 0) {
        // A void is only worth something if we have trumps to ruff with.
        total += Math.min(trumpLength, 3) * 0.45;
        continue;
      }

      if (has(ACE)) total += 0.95;
      if (has(KING)) total += length >= 2 ? 0.7 : 0.3;
      if (has(QUEEN)) total += length >= 3 ? 0.4 : 0.1;
      if (has(JACK)) total += length >= 4 ? 0.18 : 0.03;

      if (trump) {
        if (length === 1) total += Math.min(trumpLength, 2) * 0.3;
      } else {
        total += Math.max(0, length - 4) * 0.3; // long suit runs at No Trump
      }
    }
    return total;
  }

  /** Every 3-card combination of a hand (286 of them for 13 cards). */
  function threeCardCombos(hand) {
    const combos = [];
    for (let i = 0; i < hand.length - 2; i++) {
      for (let j = i + 1; j < hand.length - 1; j++) {
        for (let k = j + 1; k < hand.length; k++) {
          combos.push([hand[i], hand[j], hand[k]]);
        }
      }
    }
    return combos;
  }

  /**
   * Pick the three face-down bid cards. The suits chosen set the bid, and the
   * cards leave play, so we look for the combination whose bid best matches the
   * strength of the ten cards left behind.
   */
  function chooseBidCards(hand, trump, aggression) {
    const bias = aggression || 1;
    let best = null;

    for (const combo of threeCardCombos(hand)) {
      const bid = Rules.bidFromCards(combo);
      const kept = Cards.removeCards(hand, combo);
      const estimate = estimateTricks(kept, trump) * bias;

      // Tie-break: among equally sensible bids, throw away the weakest cards.
      const discardCost = combo.reduce((sum, card) => {
        return sum + card.value + (trump && card.suit === trump ? 6 : 0);
      }, 0);

      const cost = Math.abs(bid - estimate) + discardCost * 0.004;
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
    threeCardCombos: threeCardCombos,
    chooseBidCards: chooseBidCards,
    chooseCard: chooseCard,
    isTopOutstanding: isTopOutstanding
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
