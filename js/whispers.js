/*
 * whispers.js - the monarch's private word to each noble.
 *
 * At the start of every session each noble is handed one Whisper, face down.
 * It bends how their favour is counted, or what they are permitted to promise,
 * and nobody else learns of it until the session is over. Reading the table --
 * who pledged oddly, who is ducking audiences they could plainly win -- is the
 * whole point of them. They are an optional part of the game.
 *
 * Each Whisper may define any of:
 *   allows(card)              - which agents may be sent out at all
 *   permits(cards, hand)      - whether a whole set of four errands is legal
 *   satisfiable(hand)         - whether the demand can be met; if not it is waived
 *   demand                    - how to phrase that requirement to a player
 *   countedTricks(won)        - what number is measured against the pledge
 *   keptTest(row, table)      - whether the pledge counts as kept at all
 *   aimFor(bid)               - audiences a noble should actually try to win
 *   pledgeFor(estimate)       - the pledge a hand of this strength wants
 *   pledgeCost(bid)           - nudges the rival nobles toward or away from a pledge
 *   favouredSuit              - a kind this noble would rather win audiences with
 *   adjust(favour, row, table)- the last word on favour
 *
 * A row carries: seat, bid, tricksWon, counted, made, takenWith, base.
 */
(function (global) {
  'use strict';

  const audiences = () => global.Rules.TRICKS_PER_HAND;
  const errands = () => global.Rules.BID_CARDS;
  const suitOf = (cards, suit) => cards.filter((card) => card.suit === suit);
  const kept = (row) => row.made;

  function leftOf(table, row) {
    return table[global.Rules.leftOf(row.seat)];
  }

  const WHISPERS = [

    // --- what you may send --------------------------------------------------

    {
      id: 'blackmailed',
      name: 'Blackmailed',
      line: 'At least one Assassin must go out. Keep your pledge for +5.',
      detail: 'Someone at court holds a letter in your hand. A blade goes out tonight, or it ' +
        'reaches the monarch by morning.',
      demand: 'at least one Assassin must go out',
      permits: (cards) => cards.some((card) => card.suit === 'S'),
      satisfiable: (hand) => hand.some((card) => card.suit === 'S'),
      adjust: (favour, row) => (kept(row) ? favour + 5 : favour)
    },
    {
      id: 'silenced',
      name: 'Sworn to Silence',
      line: 'No Assassin may go out. Keep your pledge for +3.',
      detail: 'You knelt in the chapel at dawn and swore off blood for the season. The chapel ' +
        'has ears.',
      demand: 'no Assassin may go out',
      allows: (card) => card.suit !== 'S',
      satisfiable: (hand) => hand.length - suitOf(hand, 'S').length >= errands(),
      adjust: (favour, row) => (kept(row) ? favour + 3 : favour)
    },
    {
      id: 'smitten',
      name: 'The Smitten',
      line: 'No Lover may go out. Keep your pledge for +3.',
      detail: 'You will not send them away. Not this session, not for the monarch, not for ' +
        'anything.',
      demand: 'no Lover may go out',
      allows: (card) => card.suit !== 'H',
      satisfiable: (hand) => hand.length - suitOf(hand, 'H').length >= errands(),
      adjust: (favour, row) => (kept(row) ? favour + 3 : favour)
    },
    {
      id: 'audited',
      name: 'The Audited',
      line: 'Send four Merchants, or every Merchant you hold if that is fewer. ' +
        'Keep your pledge for +8.',
      detail: 'The treasury has been through your books. Every purse you own is walking out ' +
        'that door tonight.',
      demand: 'every Merchant you hold must go out, up to four',
      permits: (cards, hand) => {
        const owed = Math.min(hand ? suitOf(hand, 'D').length : errands(), errands());
        return suitOf(cards, 'D').length >= owed;
      },
      // Emptying a whole kind out of the hand costs more than it looks, and the
      // pledge it leaves you with was never really your choice.
      adjust: (favour, row) => (kept(row) ? favour + 8 : favour)
    },

    // --- how your own result is scored --------------------------------------

    {
      id: 'debtor',
      name: 'The Debtor',
      line: 'A kept pledge of 2 or fewer earns nothing; keep 3 or more for +3.',
      detail: 'You owe the treasury more than a quiet evening of work.',
      adjust: (favour, row) => {
        if (!kept(row)) return favour;
        return row.bid <= 2 ? 0 : favour + 3;
      },
      pledgeCost: (bid) => (bid <= 2 ? 1.6 : 0)
    },
    {
      id: 'allOrNothing',
      name: 'All or Nothing',
      line: 'Keep your pledge for double favour. Break it and score nothing at all.',
      detail: 'You have staked your name on this. Either the court remembers it, or you were ' +
        'never here.',
      adjust: (favour, row) => (kept(row) ? favour * 2 : 0)
    },
    {
      id: 'clerk',
      name: 'The Cautious Clerk',
      line: 'You cannot lose favour this session, nor gain more than 6.',
      detail: 'You have learned that the way to survive a court is to be impossible to blame.',
      adjust: (favour) => Math.min(6, Math.max(0, favour))
    },

    // --- how you compare to the table ---------------------------------------

    {
      id: 'bold',
      name: 'The Bold',
      line: '+5 if your pledge is the highest at the table, outright.',
      detail: 'Promise more than any of them. The monarch has no memory for the second-most ' +
        'ambitious noble in the room.',
      adjust: (favour, row, table) => {
        const highest = Math.max.apply(null, table.map((other) => other.bid));
        const alone = table.filter((other) => other.bid === highest).length === 1;
        return alone && row.bid === highest ? favour + 5 : favour;
      },
      pledgeCost: (bid) => -bid * 0.12
    },
    {
      id: 'meek',
      name: 'The Meek',
      line: '-4 if your pledge is the lowest or tied for lowest. Keep it for +4.',
      detail: 'The court has no use for a noble who promises least. Nor, it turns out, does ' +
        'the monarch.',
      adjust: (favour, row, table) => {
        const lowest = Math.min.apply(null, table.map((other) => other.bid));
        const floored = row.bid === lowest ? favour - 4 : favour;
        return kept(row) ? floored + 4 : floored;
      },
      pledgeCost: (bid) => (bid <= 2 ? 1.3 : 0)
    },
    {
      id: 'kingmaker',
      name: 'The Kingmaker',
      line: 'Keep your pledge and take +2 for every other noble who broke theirs.',
      detail: 'You have never needed to win. You have only ever needed the others to lose.',
      adjust: (favour, row, table) => {
        if (!kept(row)) return favour;
        return favour + 2 * table.filter((other) => other !== row && !other.made).length;
      }
    },
    {
      id: 'favourite',
      name: 'The Favourite',
      line: '+6 if you win more audiences than any other noble, outright.',
      detail: 'You have the ear of the monarch this season. See that you are seen to have it.',
      adjust: (favour, row, table) => {
        const most = Math.max.apply(null, table.map((other) => other.tricksWon));
        const alone = table.filter((other) => other.tricksWon === most).length === 1;
        return alone && row.tricksWon === most ? favour + 6 : favour;
      }
    },
    {
      id: 'wallflower',
      name: 'The Wallflower',
      line: '+6 if you win fewer audiences than any other noble, outright.',
      detail: 'Be somewhere else. Be forgettable. It has kept better nobles than you alive.',
      adjust: (favour, row, table) => {
        const fewest = Math.min.apply(null, table.map((other) => other.tricksWon));
        const alone = table.filter((other) => other.tricksWon === fewest).length === 1;
        return alone && row.tricksWon === fewest ? favour + 6 : favour;
      }
    },

    // --- how you win audiences ----------------------------------------------

    {
      id: 'swornToFool',
      name: 'Sworn to the Fool',
      line: '+3 favour for every audience you take with a Fool.',
      detail: 'The jester knows what the monarch actually thinks. You have decided to find out.',
      favouredSuit: 'C',
      adjust: (favour, row) => favour + 3 * suitOf(row.takenWith, 'C').length
    },

    // --- inversion and misdirection -----------------------------------------

    {
      id: 'contrarian',
      name: 'The Contrarian',
      line: 'Your pledge counts the audiences you will NOT win. Keep it for +2.',
      detail: 'Pledge eight and you have really promised three. You told the monarch what you ' +
        'would refuse, and it amused them enough to allow it.',
      countedTricks: (won) => audiences() - won,
      aimFor: (bid) => audiences() - bid,
      pledgeFor: (estimate) => audiences() - estimate,
      // Scored exactly as a noble who had openly promised the complement, so the
      // inversion itself is free; the small bonus pays for the misdirection.
      adjust: (favour, row) => {
        const scored = global.Rules.scoreHand(audiences() - row.bid, row.tricksWon);
        return kept(row) ? scored + 2 : scored;
      }
    },
    {
      id: 'understudy',
      name: 'The Understudy',
      line: 'You are scored against the pledge of the noble on your left, not your own. ' +
        'Take +3 for the trouble, and +5 more if you match it.',
      detail: 'You have been studying them for years. Tonight you find out how well. Their ' +
        'promise is sealed too, so you are aiming at a number nobody has shown you.',
      keptTest: (row, table) => row.counted === leftOf(table, row).bid,
      adjust: (favour, row, table) => {
        const scored = global.Rules.scoreHand(leftOf(table, row).bid, row.counted) + 3;
        return kept(row) ? scored + 5 : scored;
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
   * Is this whole set of errands legal? Pass the full hand as well and an
   * impossible demand is forgiven rather than enforced.
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

  /** The last word on favour, once every noble's session has been totalled. */
  function adjust(whisper, favour, row, table) {
    return whisper && whisper.adjust ? whisper.adjust(favour, row, table) : favour;
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
    adjust: adjust
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
