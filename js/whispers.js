/*
 * whispers.js - the monarch's private word to each noble.
 *
 * At the start of every night each noble is handed one Whisper, face down.
 * It bends how their favour is counted, or what they are permitted to promise,
 * and nobody else learns of it until the night is over. Reading the table --
 * who pledged oddly, who is ducking audiences they could plainly win -- is the
 * whole point of them. They are an optional part of the game.
 *
 * Each Whisper may define any of:
 *   allows(card)              - which agents the word asks be kept back
 *   permits(cards, hand)      - whether a whole set of four errands obeys it
 *   satisfiable(hand)         - whether the demand can be met; if not it is waived
 *   demand                    - how to phrase that requirement to a player
 *   countedTricks(won)        - what number is measured against the pledge
 *   keptTest(row, table)      - whether the pledge counts as kept at all
 *   aimFor(bid)               - audiences a noble should actually try to win
 *   pledgeFor(estimate)       - the pledge a hand of this strength wants
 *   pledgeCost(bid)           - nudges the rival nobles toward or away from a pledge
 *   favouredSuit              - a kind this noble would rather win audiences with
 *   shunnedSuit               - a kind this noble would rather NOT win with
 *   revealsErrands            - the errands are laid face up before any pledge
 *   burden                    - a word that costs rather than pays
 *   signed                    - who it came from, printed on the card face
 *   adjust(favour, row, table)- the last word on favour
 *
 * A row carries: seat, bid, tricksWon, counted, made, takenWith, wonCards,
 * foolsErrand, base.
 *
 * A card carries a name, one rule line, and fiction. Every clarification lives
 * in the rulebook's Whispers section, which the printed sheet reproduces in
 * full -- so a player at the table has the terse card and a player settling an
 * argument has the sheet.
 *
 * Not every word is the monarch's. A Whisper is whatever reaches a noble before
 * the night begins, and each one is signed by whoever sent it.
 */
(function (global) {
  'use strict';

  const audiences = () => global.Rules.TRICKS_PER_HAND;
  const errands = () => global.Rules.BID_CARDS;
  const suitOf = (cards, suit) => cards.filter((card) => card.suit === suit);
  const kept = (row) => row.made;

  /** The rank at or below which an agent counts as a nobody, for The Modest. */
  const MODEST_RANK = 5;

  /** What a Saboteur's night is worth before the other nobles are counted. */
  const SABOTEUR_BASE = 5;

  /** Agents of the same kind and rank taken together in one audience. */
  function matchedPairs(audiences) {
    let pairs = 0;
    for (const audience of audiences) {
      const counts = {};
      for (const card of audience) {
        const key = card.suit + card.rank;
        counts[key] = (counts[key] || 0) + 1;
      }
      for (const key of Object.keys(counts)) pairs += Math.floor(counts[key] / 2);
    }
    return pairs;
  }

  function rightOf(table, row) {
    return table[global.Rules.rightOf(row.seat)];
  }

  const WHISPERS = [

    // --- what you may send --------------------------------------------------

    {
      id: 'blackmailed',
      name: 'Blackmailed',
      signed: 'A hand you do not know',
      line: 'At least two Assassins must go out. Keep your pledge for +6.',
      detail: 'Someone at court holds a letter in your handwriting. Two blades go out ' +
        'tonight, or it reaches the monarch by morning.',
      demand: 'at least two Assassins must go out',
      permits: (cards) => suitOf(cards, 'S').length >= 2,
      satisfiable: (hand) => suitOf(hand, 'S').length >= 2,
      adjust: (favour, row) => (kept(row) ? favour + 6 : favour)
    },
    {
      id: 'silenced',
      name: 'Sworn to Silence',
      signed: 'The Chapel',
      line: 'No Assassin may go out. Keep your pledge for +4.',
      detail: 'You knelt in the chapel at dawn and swore off blood for the night. The chapel ' +
        'has ears.',
      demand: 'no Assassin may go out',
      allows: (card) => card.suit !== 'S',
      satisfiable: (hand) => hand.length - suitOf(hand, 'S').length >= errands(),
      adjust: (favour, row) => (kept(row) ? favour + 4 : favour)
    },
    {
      id: 'smitten',
      name: 'The Smitten',
      signed: 'A Lover',
      line: 'No Lover may go out. Keep your pledge for +5.',
      detail: 'You will not send them away. Not this night, not for the monarch, not for ' +
        'anything.',
      demand: 'no Lover may go out',
      allows: (card) => card.suit !== 'H',
      satisfiable: (hand) => hand.length - suitOf(hand, 'H').length >= errands(),
      adjust: (favour, row) => (kept(row) ? favour + 5 : favour)
    },
    {
      id: 'ledger',
      name: 'Sworn to the Ledger',
      signed: 'The Treasury',
      line: 'No Merchant may go out. Keep your pledge for +5.',
      detail: 'The books must balance before the season turns, and not one purse of yours is ' +
        'leaving this room until they do.',
      demand: 'no Merchant may go out',
      allows: (card) => card.suit !== 'D',
      satisfiable: (hand) => hand.length - suitOf(hand, 'D').length >= errands(),
      // Holding the Merchants back leaves only Fools, Lovers and Assassins to
      // make a promise out of, and the Fools take a promise away, so this is a
      // harder demand to land than the other two of its kind.
      adjust: (favour, row) => (kept(row) ? favour + 5 : favour)
    },
    {
      id: 'audited',
      name: 'The Audited',
      signed: 'The Treasury',
      // Three purses and one Fool comes to 3 - 1 = 2, the modest, easily landed
      // promise this word is meant to hand out. Two and two would come to
      // nothing at all, which is a Fool's errand at eight favour and quite
      // another card.
      line: 'Send three Merchants and one Fool, which pledges exactly 2. Keep it for +6.',
      detail: 'The treasury has been through your books and found them wanting. Three purses ' +
        'go out to be counted, and a Fool goes with them to see that the counting is honest.',
      demand: 'exactly three Merchants and one Fool must go out',
      permits: (cards) =>
        suitOf(cards, 'D').length === 3 && suitOf(cards, 'C').length === 1,
      satisfiable: (hand) =>
        suitOf(hand, 'D').length >= 3 && suitOf(hand, 'C').length >= 1,
      adjust: (favour, row) => (kept(row) ? favour + 6 : favour)
    },

    // --- how your own result is scored --------------------------------------

    {
      id: 'debtor',
      name: 'The Debtor',
      signed: 'The Treasury',
      line: 'A kept pledge of 2 or fewer earns nothing; keep 3 or more for +5.',
      detail: 'You owe the treasury more than a quiet evening of work.',
      adjust: (favour, row) => {
        if (!kept(row)) return favour;
        return row.bid <= 2 ? 0 : favour + 5;
      },
      pledgeCost: (bid) => (bid <= 2 ? 1.6 : 0)
    },
    {
      id: 'allOrNothing',
      name: 'All or Nothing',
      signed: 'The Court',
      line: 'Keep your pledge for double favour. Break it and the night is worth -1 for ' +
        'every audience off it.',
      detail: 'You have staked your name on this. Either the court remembers it, or it costs ' +
        'you to have been here at all.',
      // A flat -3 priced a near miss the same as a disaster, on a card whose
      // whole idea is that the night rides on one number.
      adjust: (favour, row) =>
        (kept(row) ? favour * 2 : -Math.abs(row.bid - row.counted))
    },

    // --- how you compare to the table ---------------------------------------

    {
      id: 'bold',
      name: 'The Bold',
      signed: 'The Monarch',
      line: '+4 if no noble pledges more than you.',
      detail: 'Promise as much as any of them. We have no memory for the second-most ' +
        'ambitious noble in a room.',
      adjust: (favour, row, table) => {
        const highest = Math.max.apply(null, table.map((other) => other.bid));
        return row.bid === highest ? favour + 4 : favour;
      },
      pledgeCost: (bid) => -bid * 0.12
    },
    {
      id: 'kingmaker',
      name: 'Never in Doubt',
      signed: 'The Court',
      line: 'Keep your pledge and take +3 for every other noble who broke theirs.',
      detail: 'Your own word will be kept. That is not what you are here for -- how many ' +
        'of theirs are not is the only figure that interests you.',
      adjust: (favour, row, table) => {
        if (!kept(row)) return favour;
        return favour + 3 * table.filter((other) => other !== row && !other.made).length;
      }
    },
    {
      id: 'favourite',
      name: 'The Favourite',
      signed: 'The Monarch',
      line: '+6 if no noble wins more audiences than you.',
      detail: 'You have our ear this season. See that the room knows it.',
      adjust: (favour, row, table) => {
        const most = Math.max.apply(null, table.map((other) => other.tricksWon));
        return row.tricksWon === most ? favour + 6 : favour;
      }
    },
    {
      id: 'wallflower',
      name: 'The Wallflower',
      signed: 'A Friend at Court',
      line: '+5 if no noble wins fewer audiences than you.',
      detail: 'Be somewhere else. Be forgettable. It has kept better nobles than you alive.',
      adjust: (favour, row, table) => {
        const fewest = Math.min.apply(null, table.map((other) => other.tricksWon));
        return row.tricksWon === fewest ? favour + 5 : favour;
      }
    },

    // --- how you win audiences ----------------------------------------------

    {
      id: 'swornToFool',
      name: 'Sworn to the Fool',
      signed: 'The Fool',
      // What is counted is every Fool *inside* the audiences won, whoever played
      // it -- not the audiences taken *with* a Fool, which is a quarter as
      // common and quite another card. The pledge is given up for it.
      line: 'Your pledge is not scored. +2 for every Fool in the audiences you win.',
      detail: 'The jester knows what the monarch actually thinks. You have decided to find out.',
      favouredSuit: 'C',
      // With nothing to keep, every audience is worth having.
      aimFor: () => audiences(),
      adjust: (favour, row) => 2 * suitOf(row.wonCards || [], 'C').length
    },

    {
      id: 'twin',
      name: 'The Twin',
      signed: 'The Monarch',
      line: '+2 for every pair of agents of the same kind and rank you take in one audience.',
      detail: 'There is someone in this palace with your face. We have not said which of ' +
        'you was invited, and find the question very funny indeed.',
      // This word pays for the collision the tie rule creates. Two a pair
      // rather than three: on a deck that strikes a rank up to five times,
      // better than a third of the audiences won hold a matched pair, so the
      // word fires far too often to pay a premium for it.
      adjust: (favour, row) => favour + 2 * matchedPairs(row.wonAudiences || [])
    },
    {
      id: 'modest',
      name: 'The Modest',
      signed: 'The Monarch',
      line: '+3 for every audience you win with an agent of rank ' + MODEST_RANK + ' or lower.',
      detail: 'Anyone can carry a room with a blade at their back. We should like to see it ' +
        'done with a nobody.',
      adjust: (favour, row) =>
        favour + 3 * row.takenWith.filter((card) => card.value <= MODEST_RANK).length
    },

    // --- inversion and misdirection -----------------------------------------

    {
      id: 'understudy',
      name: 'The Understudy',
      signed: 'The Court',
      line: 'You are scored against the pledge of the noble on your right, not your own. ' +
        'Take +2 for the trouble, and +5 more if you match it.',
      detail: 'You have been studying them for years -- the one who plays into your hand, ' +
        'never after it. Tonight you find out how well. Their promise is sealed too, so you are ' +
        'aiming at a number nobody has shown you.',
      keptTest: (row, table) => row.counted === rightOf(table, row).bid,
      adjust: (favour, row, table) => {
        // Scored against the neighbour's promise, so it is the neighbour's
        // errand that decides whether a nought there was a Fool's errand or
        // a hollow promise.
        const neighbour = rightOf(table, row);
        const scored =
          global.Rules.scoreHand(neighbour.bid, row.counted, neighbour.foolsErrand) + 2;
        return kept(row) ? scored + 5 : scored;
      }
    },

    // --- burdens ------------------------------------------------------------
    // Not every word that reaches you is a favour. These cost, and because a
    // Whisper is taken unread, they are the risk that makes taking one a
    // decision rather than a formality.

    {
      id: 'saboteur',
      name: 'In Another\u2019s Pay',
      signed: 'A hand you do not know',
      burden: true,
      // The pledge is not scored at all and the night is worth a flat base less
      // 3 a head, running +5 to -4. The pledge is still kept or broken as a
      // matter of fact: the sway ladder counts it, and so does any other word
      // that reads the table. With nothing of their own to win, the holder's
      // only business is seeing that nobody else lands their number.
      line: 'Your pledge is not scored. +' + SABOTEUR_BASE +
        ', less 3 for every other noble who keeps theirs.',
      detail: 'You have been paid, by someone who did not give their name, to see that this ' +
        'court gets nothing it was promised. What you yourself came here to do no longer ' +
        'matters to anyone, least of all to you.',
      adjust: (favour, row, table) =>
        SABOTEUR_BASE - 3 * table.filter((other) => other !== row && other.made).length
    },
    {
      id: 'watched',
      name: 'The Watched',
      signed: 'The Chancery',
      burden: true,
      line: 'Your errands are laid face up as soon as they are sent.',
      detail: 'A clerk has been assigned to your correspondence. Whatever leaves your hand, ' +
        'the room sees.',
      // The only burden that takes no favour directly. What it costs is that
      // the table can see your pledge and play into it, and the rival nobles
      // press that far less than a human will -- so the figure this measures
      // at is a floor, and the card is left to charge nothing on paper.
      revealsErrands: true
    },
    {
      id: 'marked',
      name: 'Marked for the Blade',
      signed: 'One who kills for a living',
      burden: true,
      line: '-2 for every audience an Assassin takes for you.',
      detail: 'You have made an enemy of someone who kills for a living. Draw a blade ' +
        'tonight and it will be noticed.',
      shunnedSuit: 'S',
      adjust: (favour, row) => favour - 2 * suitOf(row.takenWith, 'S').length
    },
    {
      id: 'outOfFavour',
      name: 'Out of Favour',
      signed: 'The Monarch',
      burden: true,
      // The mirror of The Wallflower, which pays for the same thing. Being
      // quietest is not enough on its own: somebody has to be quietest, and if
      // it is not you the monarch notices.
      line: '-2 unless no noble wins fewer audiences than you.',
      detail: 'Whatever you did last season, we have not forgotten it. Be the smallest ' +
        'presence in the room tonight, or do not trouble coming at all.',
      adjust: (favour, row, table) => {
        const fewest = Math.min.apply(null, table.map((other) => other.tricksWon));
        return row.tricksWon === fewest ? favour : favour - 2;
      }
    },
    {
      id: 'optimist',
      name: 'More Was Expected',
      signed: 'The Court',
      burden: true,
      line: '-3 for every audience you take short of your pledge.',
      detail: 'You said what the night would come to, and the court took you at your word. ' +
        'It is the shortfall they remember, never the excess.',
      // Only falling short is counted. Overshooting is its own punishment
      // already, and this word has nothing to add to it.
      adjust: (favour, row) => favour - 3 * Math.max(0, row.bid - row.tricksWon)
    },
    {
      id: 'beggar',
      name: 'The Beggar’s Bargain',
      signed: 'A beggar on the steps',
      burden: true,
      line: 'Favour you gain is halved unless you win an audience with a Fool in it.',
      detail: 'You took coin from a man on the palace steps on your way up, and he asked only ' +
        'that you remember him once, in front of the whole court.',
      // A Fool anywhere in an audience you took will do -- yours or anyone
      // else's. Winning one with a Fool is the surest way to be certain of it,
      // which is what the rival nobles go looking for.
      //
      // Only favour gained is halved. Halving a loss as well would make this
      // burden a kindness on exactly the nights it is meant to punish.
      favouredSuit: 'C',
      adjust: (favour, row) => {
        const remembered = (row.wonCards || []).some((card) => card.suit === 'C');
        if (remembered || favour <= 0) return favour;
        return Math.floor(favour / 2);
      }
    },
    {
      id: 'duellist',
      name: 'Called Out',
      signed: 'A rival noble',
      burden: true,
      line: '-3 if you win more audiences than the noble on your right.',
      detail: 'A matter of honour is outstanding, and the whole court has agreed to keep score ' +
        'of it. Whoever plays into your hand tonight had better outshine you.',
      // Three rather than five: this fires on two nights in five, and unlike
      // every other burden there is no playing around it -- how many audiences
      // the noble on your right takes is not yours to decide.
      adjust: (favour, row, table) => {
        const rival = table[global.Rules.rightOf(row.seat)];
        return row.tricksWon > rival.tricksWon ? favour - 3 : favour;
      }
    }
  ];

  const BY_ID = {};
  for (const whisper of WHISPERS) BY_ID[whisper.id] = whisper;

  /** One Whisper per noble, drawn without replacement so no two share a word. */
  function deal(count, rng) {
    return global.Cards.shuffle(WHISPERS, rng).slice(0, count);
  }

  /** Can this agent be sent out at all under the given Whisper? */
  function allowsCard(whisper, card) {
    return !whisper || !whisper.allows || whisper.allows(card);
  }

  /**
   * Could this hand obey the Whisper at all? A noble holding no Assassin cannot
   * be made to send one, so an impossible demand is simply waived.
   */
  function canSatisfy(whisper, hand) {
    return !whisper || !whisper.satisfiable || whisper.satisfiable(hand);
  }

  /**
   * Does this set of errands obey the word? A demand is never binding -- a
   * noble may always pledge as they please -- but a word that was not obeyed
   * pays nothing. Pass the full hand as well and a demand the hand cannot meet
   * is treated as obeyed rather than held against its holder.
   */
  function permitsSet(whisper, cards, hand) {
    if (!whisper) return true;
    if (hand && !canSatisfy(whisper, hand)) return true;
    if (cards.some((card) => !allowsCard(whisper, card))) return false;
    return whisper.permits ? whisper.permits(cards, hand) : true;
  }

  /** What number is weighed against the pledge. */
  function countedTricks(whisper, tricksWon) {
    return whisper && whisper.countedTricks ? whisper.countedTricks(tricksWon) : tricksWon;
  }

  /** Whether the pledge counts as kept, once every noble's count is known. */
  function wasKept(whisper, row, table) {
    if (whisper && whisper.keptTest) return whisper.keptTest(row, table);
    return row.counted === row.bid;
  }

  /** How many audiences a noble should actually be trying to win. */
  function aimFor(whisper, bid) {
    return whisper && whisper.aimFor ? whisper.aimFor(bid) : bid;
  }

  /** The pledge a hand of this strength wants under the given Whisper. */
  function pledgeFor(whisper, estimate) {
    return whisper && whisper.pledgeFor ? whisper.pledgeFor(estimate) : estimate;
  }

  function pledgeCost(whisper, bid) {
    return whisper && whisper.pledgeCost ? whisper.pledgeCost(bid) : 0;
  }

  /** A kind this noble would rather take audiences with, if any. */
  function favouredSuit(whisper) {
    return whisper && whisper.favouredSuit ? whisper.favouredSuit : null;
  }

  /** A kind this noble would rather not be seen winning with, if any. */
  function shunnedSuit(whisper) {
    return whisper && whisper.shunnedSuit ? whisper.shunnedSuit : null;
  }

  /** Whether this noble's errands are public the moment they are sent. */
  function revealsErrands(whisper) {
    return !!(whisper && whisper.revealsErrands);
  }

  /** Does this word ask anything of the errands at all? */
  function restrictsErrands(whisper) {
    return !!(whisper && (whisper.allows || whisper.permits));
  }

  /** A word that costs rather than pays. */
  function isBurden(whisper) {
    return !!(whisper && whisper.burden);
  }

  /**
   * The last word on favour, once every noble's night has been totalled. A
   * demand that went unheeded is its own answer: the word grants nothing.
   */
  function adjust(whisper, favour, row, table) {
    if (!whisper || !whisper.adjust) return favour;
    if (restrictsErrands(whisper) && row && row.obeyed === false) return favour;
    return whisper.adjust(favour, row, table);
  }

  global.Whispers = {
    ALL: WHISPERS,
    BY_ID: BY_ID,
    deal: deal,
    allowsCard: allowsCard,
    canSatisfy: canSatisfy,
    permitsSet: permitsSet,
    countedTricks: countedTricks,
    wasKept: wasKept,
    aimFor: aimFor,
    pledgeFor: pledgeFor,
    pledgeCost: pledgeCost,
    favouredSuit: favouredSuit,
    shunnedSuit: shunnedSuit,
    revealsErrands: revealsErrands,
    restrictsErrands: restrictsErrands,
    isBurden: isBurden,
    adjust: adjust
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
