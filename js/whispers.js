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
 *   adjust(favour, row, table)- the last word on favour
 *
 * A row carries: seat, bid, tricksWon, counted, made, takenWith, wonCards,
 * trueNil, base.
 */
(function (global) {
  'use strict';

  const audiences = () => global.Rules.TRICKS_PER_HAND;
  const errands = () => global.Rules.BID_CARDS;
  const suitOf = (cards, suit) => cards.filter((card) => card.suit === suit);
  const kept = (row) => row.made;

  /**
   * The rules in force. Four of the twenty-two words below read differently
   * under Ruleset B, and each of them branches inside its own definition rather
   * than being listed twice -- the id, name, frame and place in the order are
   * written once and cannot drift apart.
   */
  const rules = () => global.Ruleset.current();

  function rightOf(table, row) {
    return table[global.Rules.rightOf(row.seat)];
  }

  const WHISPERS = [

    // --- what you may send --------------------------------------------------

    {
      id: 'blackmailed',
      name: 'Blackmailed',
      line: 'At least one Assassin must go out. Keep your pledge for +6.',
      detail: 'Someone at court holds a letter in your hand. A blade goes out tonight, or it ' +
        'reaches the monarch by morning.',
      demand: 'at least one Assassin must go out',
      permits: (cards) => cards.some((card) => card.suit === 'S'),
      satisfiable: (hand) => hand.some((card) => card.suit === 'S'),
      adjust: (favour, row) => (kept(row) ? favour + 6 : favour)
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
      detail: 'You will not send them away. Not this night, not for the monarch, not for ' +
        'anything.',
      demand: 'no Lover may go out',
      allows: (card) => card.suit !== 'H',
      satisfiable: (hand) => hand.length - suitOf(hand, 'H').length >= errands(),
      adjust: (favour, row) => (kept(row) ? favour + 3 : favour)
    },
    {
      id: 'audited',
      name: 'The Audited',
      // The mix is chosen to come to a pledge of exactly 2 under whichever
      // rules are in force. Two Merchants and two Fools comes to 2 where a Fool
      // promises nothing, but to nothing at all where a Fool costs one -- which
      // would be a nil at eight favour either way rather than the modest,
      // easily landed promise this word is meant to hand out.
      get line() {
        const r = rules();
        return 'Send ' + (r.auditedMerchants === 3 ? 'three Merchants and one Fool' :
          'two Merchants and two Fools') + ', which pledges exactly 2. Keep it for +4.';
      },
      get detail() {
        const r = rules();
        return 'The treasury has been through your books and found them wanting. ' +
          (r.auditedMerchants === 3
            ? 'Three purses go out to be counted, and a Fool goes with them to see that the ' +
              'counting is honest. '
            : 'Two purses go out to be counted, and two Fools go with them to see that the ' +
              'counting is honest. ') +
          'What you promise the court this night was never really your choice.';
      },
      get demand() {
        const r = rules();
        return (r.auditedExact ? 'exactly ' : '') +
          (r.auditedMerchants === 3 ? 'three Merchants and one Fool' :
            'two Merchants and two Fools') + ' must go out';
      },
      permits: (cards) => {
        const r = rules();
        const merchants = suitOf(cards, 'D').length;
        const fools = suitOf(cards, 'C').length;
        return r.auditedExact
          ? merchants === r.auditedMerchants && fools === r.auditedFools
          : merchants >= r.auditedMerchants && fools >= r.auditedFools;
      },
      satisfiable: (hand) => {
        const r = rules();
        return suitOf(hand, 'D').length >= r.auditedMerchants &&
          suitOf(hand, 'C').length >= r.auditedFools;
      },
      // A pledge of two is an easy one to land, so the reward for being handed
      // it is modest.
      adjust: (favour, row) => (kept(row) ? favour + 4 : favour)
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
      line: 'Keep your pledge for double favour. Break it and lose 3, whatever else you did.',
      detail: 'You have staked your name on this. Either the court remembers it, or it costs ' +
        'you to have been here at all.',
      adjust: (favour, row) => (kept(row) ? favour * 2 : -3)
    },
    {
      id: 'clerk',
      name: 'The Cautious Clerk',
      get line() {
        return 'You cannot lose favour this night, nor gain more than ' + rules().clerkCap + '.';
      },
      detail: 'You have learned that the way to survive a court is to be impossible to blame.',
      adjust: (favour) => Math.min(rules().clerkCap, Math.max(0, favour))
    },

    // --- how you compare to the table ---------------------------------------

    {
      id: 'bold',
      name: 'The Bold',
      line: '+6 if your pledge is the highest at the table, outright.',
      detail: 'Promise more than any of them. The monarch has no memory for the second-most ' +
        'ambitious noble in the room.',
      adjust: (favour, row, table) => {
        const highest = Math.max.apply(null, table.map((other) => other.bid));
        const alone = table.filter((other) => other.bid === highest).length === 1;
        return alone && row.bid === highest ? favour + 6 : favour;
      },
      pledgeCost: (bid) => -bid * 0.12
    },
    {
      id: 'meek',
      name: 'The Meek',
      // Every other word that measures a noble against the table says outright.
      // With four seats and a narrow range of sensible pledges, a shared lowest
      // is common enough that counting it fires the penalty almost every night.
      get line() {
        return '-3 if your pledge is the lowest at the table' +
          (rules().meekOutright ? ', outright' : ' or tied for lowest') + '. Keep it for +4.';
      },
      detail: 'The court has no use for a noble who promises least. Nor, it turns out, does ' +
        'the monarch.',
      adjust: (favour, row, table) => {
        const lowest = Math.min.apply(null, table.map((other) => other.bid));
        const alone = table.filter((other) => other.bid === lowest).length === 1;
        const lowestHere = rules().meekOutright
          ? row.bid === lowest && alone
          : row.bid === lowest;
        const floored = lowestHere ? favour - 3 : favour;
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
      // Two quite different cards. Under A it counts the audiences this noble
      // took *with* a Fool and adds that to a pledge scored as normal. Under B
      // the pledge is set aside entirely and what is counted is every Fool
      // *inside* the audiences won, whoever played it -- which comes up around
      // four times as often, and is why the pledge can be given up for it.
      get line() {
        return rules().swornCountsInAudiences
          ? 'Your pledge is not scored. +3 for every Fool in the audiences you win, ' +
            'after the first.'
          : '+3 favour for every audience you take with a Fool.';
      },
      detail: 'The jester knows what the monarch actually thinks. You have decided to find out.',
      favouredSuit: 'C',
      // With nothing to keep, every audience is worth having.
      aimFor: (bid) => (rules().swornCountsInAudiences ? audiences() : bid),
      adjust: (favour, row) => {
        if (!rules().swornCountsInAudiences) {
          return favour + 3 * suitOf(row.takenWith, 'C').length;
        }
        const fools = suitOf(row.wonCards || [], 'C').length;
        return 3 * Math.max(0, fools - 1);
      }
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
        // The number being scored is the complement of the pledge, not the
        // pledge, so a nought here is never the four Fools that make a true nil.
        const scored = global.Rules.scoreHand(audiences() - row.bid, row.tricksWon, false);
        return kept(row) ? scored + 2 : scored;
      }
    },
    {
      id: 'understudy',
      name: 'The Understudy',
      line: 'You are scored against the pledge of the noble on your right, not your own. ' +
        'Take +3 for the trouble, and +5 more if you match it.',
      detail: 'You have been studying them for years -- the one who plays into your hand, ' +
        'never after it. Tonight you find out how well. Their promise is sealed too, so you are ' +
        'aiming at a number nobody has shown you.',
      keptTest: (row, table) => row.counted === rightOf(table, row).bid,
      adjust: (favour, row, table) => {
        // Scored against the neighbour's promise, so it is the neighbour's
        // errand that decides whether a nought there was meant or merely added up.
        const neighbour = rightOf(table, row);
        const scored = global.Rules.scoreHand(neighbour.bid, row.counted, neighbour.trueNil) + 3;
        return kept(row) ? scored + 5 : scored;
      }
    },

    // --- burdens ------------------------------------------------------------
    // Not every word from the monarch is a favour. These cost, and because a
    // Whisper is taken unread, they are the risk that makes taking one a
    // decision rather than a formality.

    {
      id: 'condemned',
      name: 'The Condemned',
      burden: true,
      line: 'Break your pledge and lose a further 3.',
      detail: 'You are one failure from the block, and the court is watching to see which way ' +
        'you fall.',
      adjust: (favour, row) => (kept(row) ? favour : favour - 3)
    },
    {
      id: 'scapegoat',
      name: 'The Scapegoat',
      burden: true,
      // Under B the pledge is not scored at all and the night is worth +7 less
      // 3 a head, running from +7 down to -2. The pledge is still kept or
      // broken as a matter of fact: the sway ladder counts it, and so does any
      // other word that reads the table.
      get line() {
        return rules().scapegoatScoresPledge
          ? '-2 for every other noble who keeps their pledge, to a limit of 4.'
          : 'Your pledge is not scored. +7, less 3 for every other noble who keeps theirs.';
      },
      detail: 'Someone must answer for last season. It has been decided that it will be you.',
      adjust: (favour, row, table) => {
        const keepers = table.filter((other) => other !== row && other.made).length;
        return rules().scapegoatScoresPledge
          ? favour - Math.min(4, 2 * keepers)
          : 7 - 3 * keepers;
      }
    },
    {
      id: 'disgrace',
      name: 'In Disgrace',
      burden: true,
      line: 'Favour you gain tonight is halved. Favour you lose is not.',
      detail: 'You are still at court. You are no longer quite of it.',
      adjust: (favour) => (favour > 0 ? Math.floor(favour / 2) : favour)
    },
    {
      id: 'watched',
      name: 'The Watched',
      burden: true,
      line: 'Your errands are laid face up as soon as they are sent.',
      detail: 'A clerk has been assigned to your correspondence. Everything you send, the room ' +
        'sees -- your pledge, and which four agents have left your hand. They will play ' +
        'accordingly, and there is nothing you can do about it.',
      revealsErrands: true
    },
    {
      id: 'marked',
      name: 'Marked for the Blade',
      burden: true,
      line: '-2 for every audience you take with an Assassin.',
      detail: 'You have made an enemy of someone who kills for a living. Draw a blade tonight ' +
        'and it will be noticed.',
      shunnedSuit: 'S',
      adjust: (favour, row) => favour - 2 * suitOf(row.takenWith, 'S').length
    },
    {
      id: 'outOfFavour',
      name: 'Out of Favour',
      burden: true,
      line: 'A kept pledge of 4 or more earns you nothing.',
      detail: 'Whatever you did last season, the monarch has not forgotten it. Succeed quietly ' +
        'tonight or do not bother succeeding at all.',
      adjust: (favour, row) => (kept(row) && row.bid >= 4 ? 0 : favour),
      pledgeCost: (bid) => (bid >= 4 ? 1.4 : 0)
    },
    {
      id: 'duellist',
      name: 'Called Out',
      burden: true,
      line: '-5 if you win more audiences than the noble on your right.',
      detail: 'A matter of honour is outstanding, and the whole court has agreed to keep score ' +
        'of it. Whoever plays into your hand tonight had better outshine you.',
      adjust: (favour, row, table) => {
        const rival = table[global.Rules.rightOf(row.seat)];
        return row.tricksWon > rival.tricksWon ? favour - 5 : favour;
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
