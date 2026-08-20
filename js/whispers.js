/*
 * whispers.js - the monarch's private word to each noble.
 *
 * At the start of every session each noble is handed one Whisper, face down.
 * It bends how their favour is counted, or what they are permitted to promise,
 * and nobody else learns of it until the session is over. Reading the table --
 * who pledged oddly, who is ducking audiences they could win -- is the point.
 *
 * Each Whisper may define any of:
 *   allows(card)              - which agents may be sent out at all
 *   permits(cards)            - whether a whole set of four errands is legal
 *   demand                    - how to phrase that requirement to a player
 *   countedTricks(won)        - what number is measured against the pledge
 *   aimFor(bid)               - audiences a noble should actually try to win
 *   pledgeFor(estimate)       - the pledge a hand of this strength wants
 *   pledgeCost(bid)           - nudges the rival nobles toward or away from a pledge
 *   adjust(favour, row, table)- the last word on favour
 */
(function (global) {
  'use strict';

  const audiences = () => global.Rules.TRICKS_PER_HAND;
  const kept = (row) => row.counted === row.bid;

  const WHISPERS = [
    {
      id: 'contrarian',
      name: 'The Contrarian',
      line: 'Your pledge counts the audiences you will NOT win.',
      detail: 'Pledge eight and you have really promised three. The table sees a bold noble ' +
        'and watches you duck audience after audience.',
      countedTricks: (won) => audiences() - won,
      aimFor: (bid) => audiences() - bid,
      pledgeFor: (estimate) => audiences() - estimate,
      // Favour is still earned on the audiences actually won, so a Contrarian
      // scores exactly as a noble who had openly promised the complement.
      adjust: (favour, row) => global.Rules.scoreHand(audiences() - row.bid, row.tricksWon)
    },
    {
      id: 'ascetic',
      name: 'The Ascetic',
      line: 'Pledge nothing and keep it for +12; break it and lose only 3.',
      detail: 'Four Fools sent out is a pledge of nothing. The monarch rewards restraint ' +
        'and forgives it cheaply.',
      adjust: (favour, row) => {
        if (row.bid !== 0) return favour;
        return row.counted === 0 ? 12 : -3;
      },
      pledgeCost: (bid) => (bid === 0 ? -1.6 : 0)
    },
    {
      id: 'debtor',
      name: 'The Debtor',
      line: 'A kept pledge of 2 or fewer earns nothing; keep 3 or more for +3.',
      detail: 'You owe the court more than a quiet session. A small promise, however neatly ' +
        'kept, buys you nothing at all.',
      adjust: (favour, row) => {
        if (!kept(row)) return favour;
        return row.bid <= 2 ? 0 : favour + 3;
      },
      pledgeCost: (bid) => (bid <= 2 ? 1.6 : 0)
    },
    {
      id: 'blackmailed',
      name: 'Blackmailed',
      line: 'At least one Assassin must go out. Keep your pledge for +5.',
      detail: 'Someone holds a letter of yours, so your errands must include a blade — ' +
        'which puts a floor of three under your pledge.',
      permits: (cards) => cards.some((card) => card.suit === 'S'),
      satisfiable: (hand) => hand.some((card) => card.suit === 'S'),
      demand: 'at least one Assassin must go out',
      adjust: (favour, row) => (kept(row) ? favour + 5 : favour)
    },
    {
      id: 'silenced',
      name: 'Sworn to Silence',
      line: 'No Assassin may go out. Keep your pledge for +3.',
      detail: 'You have sworn off blades this session, so eight is the most you can promise.',
      allows: (card) => card.suit !== 'S',
      satisfiable: (hand) =>
        hand.filter((card) => card.suit !== 'S').length >= global.Rules.BID_CARDS,
      demand: 'no Assassin may go out',
      adjust: (favour, row) => (kept(row) ? favour + 3 : favour)
    },
    {
      id: 'bold',
      name: 'The Bold',
      line: '+5 if your pledge is the highest at the table, outright.',
      detail: 'Promise more than every rival -- ties do not count -- and the monarch marks it.',
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
      detail: 'The court has no use for a noble who promises least, so stay off the floor -- ' +
        'and be good for whatever you do promise.',
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
      detail: 'You profit from the failure of others, but only from a position of standing: ' +
        'break your own word and their failures earn you nothing.',
      adjust: (favour, row, table) => {
        if (!kept(row)) return favour;
        return favour + 2 * table.filter((other) => other !== row && !other.made).length;
      }
    }
  ];

  const BY_ID = {};
  for (const whisper of WHISPERS) BY_ID[whisper.id] = whisper;

  /** One Whisper per noble, drawn without replacement so no two share a word. */
  function deal(count, rng) {
    const pool = global.Cards.shuffle(WHISPERS, rng);
    return pool.slice(0, count);
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
    return whisper.permits ? whisper.permits(cards) : true;
  }

  /** What number is weighed against the pledge. */
  function countedTricks(whisper, tricksWon) {
    return whisper && whisper.countedTricks ? whisper.countedTricks(tricksWon) : tricksWon;
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
    aimFor: aimFor,
    pledgeFor: pledgeFor,
    pledgeCost: pledgeCost,
    adjust: adjust
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
