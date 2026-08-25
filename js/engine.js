/*
 * engine.js - the state of the court and the transitions between phases.
 * The UI drives it step by step so it can animate between states.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Rules = global.Rules;
  const AI = global.AI;
  const Whispers = global.Whispers;

  // The four nobles, seated clockwise: you (bottom), then left, across, right.
  const SEATS = [
    { name: 'You', isHuman: true, position: 'south', style: '' },
    { name: 'Verane', isHuman: false, position: 'west', style: 'the patient', aggression: 1.0 },
    { name: 'Mors', isHuman: false, position: 'north', style: 'the reckless', aggression: 1.12 },
    { name: 'Ilka', isHuman: false, position: 'east', style: 'the careful', aggression: 0.9 }
  ];

  const HUMAN = 0;

  function createGame(options) {
    const settings = options || {};
    return {
      players: SEATS.map((seat) => ({
        name: seat.name,
        isHuman: seat.isHuman,
        position: seat.position,
        style: seat.style,
        aggression: seat.aggression || 1,
        hand: [],
        bidCards: [],
        bid: null,
        whisper: null,
        obeyed: true,
        tookWhisper: null,   // null until they decide; then true or false
        tricksWon: 0,
        takenWith: [],
        score: 0
      })),
      human: HUMAN,
      dealer: settings.dealer === undefined
        ? Math.floor(Math.random() * Rules.PLAYER_COUNT)
        : settings.dealer,
      handNumber: 0,
      trump: null,          // the first hand is always No Trump
      nextTrump: null,
      phase: 'ready',
      leader: 0,
      turn: 0,
      trick: [],
      trickNumber: 0,
      trickResult: null,
      lastTrick: null,
      playedCards: [],
      handSummary: null,
      history: [],
      winners: [],
      winReason: null,
      whispersOn: settings.whispers === undefined ? true : !!settings.whispers,
      whisperPool: [],
      seasonLength: settings.seasonLength || Rules.SEASON_LENGTH,
      rng: settings.rng || Math.random
    };
  }

  /** Shuffle, deal fifteen to each noble, and open the pledging. */
  function startHand(state) {
    const deck = Cards.shuffle(Cards.makeDeck(), state.rng);

    // The Whispers are shuffled but not handed out. A noble takes one only if
    // they ask for one, and they ask blind: the word is not read until it is
    // taken, so the choice is made on the strength of the hand alone.
    state.whisperPool = state.whispersOn
      ? Whispers.deal(Whispers.ALL.length, state.rng)
      : [];

    state.handNumber += 1;
    if (state.handNumber > 1) state.dealer = Rules.leftOf(state.dealer);
    state.trump = state.handNumber === 1 ? null : state.nextTrump;

    state.players.forEach((player, seat) => {
      player.hand = deck.slice(seat * Rules.HAND_SIZE, (seat + 1) * Rules.HAND_SIZE);
      player.bidCards = [];
      player.bid = null;
      player.whisper = null;
      player.tookWhisper = state.whispersOn ? null : false;
      player.tricksWon = 0;
      player.takenWith = [];
    });

    state.phase = state.whispersOn ? 'whisperOffer' : 'bidding';
    state.leader = Rules.leftOf(state.dealer);
    state.turn = state.leader;
    state.trick = [];
    state.trickNumber = 0;
    state.trickResult = null;
    state.lastTrick = null;
    state.playedCards = [];
    state.handSummary = null;
    return state;
  }

  /**
   * Whether a noble is entitled to a word at all. The monarch does not confide
   * in whoever is winning: only a noble who is behind on favour may take one,
   * and on the first night of a season, when everyone is level, nobody may.
   */
  function mayTakeWhisper(state, seat) {
    if (!state.whispersOn) return false;
    const best = Math.max.apply(null, state.players.map((player) => player.score));
    return state.players[seat].score < best;
  }

  /**
   * Take a Whisper, sight unseen. A noble may look at their own hand first but
   * not at the word they are about to be given, and taking one costs nothing.
   */
  function takeWhisper(state, seat) {
    const player = state.players[seat];
    if (player.tookWhisper !== null) throw new Error('That noble has already decided');
    if (!mayTakeWhisper(state, seat)) {
      throw new Error('Only a noble who is behind may be given a word');
    }
    player.whisper = state.whisperPool.pop() || null;
    player.tookWhisper = !!player.whisper;
    return player.whisper;
  }

  /** Hear nothing, owe nothing. */
  function refuseWhisper(state, seat) {
    const player = state.players[seat];
    if (player.tookWhisper !== null) throw new Error('That noble has already decided');
    player.whisper = null;
    player.tookWhisper = false;
    return null;
  }

  /** Each rival noble decides for itself, on its own hand and nothing else. */
  function resolveComputerWhispers(state) {
    state.players.forEach((player, seat) => {
      if (player.isHuman || player.tookWhisper !== null) return;
      if (mayTakeWhisper(state, seat) &&
          AI.wantsWhisper(player.hand, state.trump, player.aggression)) {
        takeWhisper(state, seat);
      } else {
        refuseWhisper(state, seat);
      }
    });
  }

  function whispersSettled(state) {
    return state.players.every((player) => player.tookWhisper !== null);
  }

  function beginBidding(state) {
    state.phase = 'bidding';
    return state;
  }

  /** Send a noble's agents out on their errands, taking them out of the hand. */
  function submitBid(state, seat, cards) {
    if (cards.length !== Rules.BID_CARDS) {
      throw new Error('A pledge must be exactly ' + Rules.BID_CARDS + ' agents');
    }
    const player = state.players[seat];
    // A word may ask something of the errands, but it cannot forbid a pledge.
    // Whether the noble heeded it is remembered and settled up at scoring.
    player.obeyed = Whispers.permitsSet(player.whisper, cards, player.hand);
    player.bidCards = cards.slice();
    player.bid = Rules.bidFromCards(cards);
    player.hand = Cards.removeCards(player.hand, cards);
    return player.bid;
  }

  /** Every rival noble commits their pledge. */
  function submitComputerBids(state) {
    state.players.forEach((player, seat) => {
      if (player.isHuman) return;
      submitBid(state, seat,
        AI.chooseBidCards(player.hand, state.trump, player.aggression, player.whisper));
    });
  }

  function biddingComplete(state) {
    return state.players.every((player) => player.bid !== null);
  }

  function beginPlay(state) {
    state.phase = 'playing';
    state.turn = state.leader;
    state.trickNumber = 1;
    return state;
  }

  function ledSuit(state) {
    return state.trick.length ? state.trick[0].card.suit : null;
  }

  function legalPlaysFor(state, seat) {
    return Rules.legalPlays(state.players[seat].hand, ledSuit(state));
  }

  function isLegalPlay(state, seat, card) {
    return legalPlaysFor(state, seat).some((legal) => legal.id === card.id);
  }

  /** Play one card for the seat whose turn it is. */
  function playCard(state, seat, card) {
    if (state.phase !== 'playing') throw new Error('Not in the playing phase');
    if (state.turn !== seat) throw new Error('It is not that seat to play');
    if (!isLegalPlay(state, seat, card)) throw new Error('You must follow the suit that was led');

    const player = state.players[seat];
    player.hand = Cards.removeCards(player.hand, [card]);
    state.trick.push({ player: seat, card: card });
    state.playedCards.push(card);

    if (state.trick.length === Rules.PLAYER_COUNT) {
      const winning = Rules.trickWinner(state.trick, state.trump);
      state.trickResult = { winner: winning.player, card: winning.card };
      state.phase = 'trickComplete';
    } else {
      state.turn = Rules.leftOf(seat);
    }
    return state;
  }

  /** Cards a seat knows are out of play: its own hand plus everything played. */
  function seenBy(state, seat) {
    const seen = new Set();
    for (const card of state.playedCards) seen.add(card.id);
    for (const card of state.players[seat].hand) seen.add(card.id);
    // A noble under The Watched has laid their errands face up. Those four
    // agents are out of the night, and everyone at the table gets to count
    // them as gone when working out what can still beat what.
    state.players.forEach((other, index) => {
      if (index === seat || !Whispers.revealsErrands(other.whisper)) return;
      for (const card of other.bidCards) seen.add(card.id);
    });
    return seen;
  }

  /**
   * Everything a noble is allowed to know when it plays: its own hand, its own
   * pledge, its own word, what is on the table, and what it has watched go by.
   * Nothing else crosses this line -- it is the whole of the AI's world, and
   * the test suite checks it for leaks.
   */
  function contextFor(state, seat) {
    const player = state.players[seat];
    return {
      hand: player.hand,
      trick: state.trick,
      trump: state.trump,
      bid: player.bid,
      tricksWon: player.tricksWon,
      seen: seenBy(state, seat),
      whisper: player.whisper,
      watched: watchedBy(state, seat)
    };
  }

  /**
   * The nobles whose pledges are on show. A noble under The Watched has laid
   * their errands face up, and how many audiences anyone has taken is public
   * anyway, so the whole table can work out exactly how many more they need.
   * Nothing secret crosses this line -- only what its holder chose to expose.
   */
  function watchedBy(state, seat) {
    const open = [];
    state.players.forEach((other, index) => {
      if (index === seat) return;
      if (!Whispers.revealsErrands(other.whisper)) return;
      if (other.bid === null) return;
      open.push({
        seat: index,
        bid: other.bid,
        tricksWon: other.tricksWon,
        needs: Whispers.aimFor(other.whisper, other.bid) - other.tricksWon
      });
    });
    return open;
  }

  /** Ask the AI for a card and play it. */
  function playComputerCard(state) {
    const seat = state.turn;
    const card = AI.chooseCard(contextFor(state, seat));
    playCard(state, seat, card);
    return card;
  }

  /** Award the finished trick and move on, or end the hand. */
  function completeTrick(state) {
    if (state.phase !== 'trickComplete') return state;
    const winner = state.trickResult.winner;
    state.players[winner].tricksWon += 1;
    state.players[winner].takenWith.push(state.trickResult.card);
    state.lastTrick = { plays: state.trick.slice(), winner: winner, number: state.trickNumber };
    state.trick = [];
    state.trickResult = null;

    if (state.players.every((player) => player.hand.length === 0)) {
      return finishHand(state);
    }

    state.leader = winner;
    state.turn = winner;
    state.trickNumber += 1;
    state.phase = 'playing';
    return state;
  }

  /** Score the night, work out who holds sway next, and check for a winner. */
  function finishHand(state) {
    // Pass one: what each noble's Whisper says their audiences came to.
    const rows = state.players.map((player, seat) => {
      const counted = Whispers.countedTricks(player.whisper, player.tricksWon);
      return {
        seat: seat,
        name: player.name,
        bid: player.bid,
        tricksWon: player.tricksWon,
        counted: counted,
        takenWith: player.takenWith.slice(),
        whisper: player.whisper,
        obeyed: player.obeyed,
        bidCards: player.bidCards.slice(),
        made: false,
        base: 0,
        points: 0,
        total: 0
      };
    });

    // Pass two: whether each pledge counts as kept. An Understudy is judged
    // against a promise that is not their own, so this needs the whole table.
    for (const row of rows) {
      row.made = Whispers.wasKept(row.whisper, row, rows);
      row.base = Rules.scoreHand(row.bid, row.counted);
    }

    // Pass three: Whispers that read the whole table can only settle up now.
    rows.forEach((row, seat) => {
      row.points = Whispers.adjust(row.whisper, row.base, row, rows);
      state.players[seat].score += row.points;
      row.total = state.players[seat].score;
    });

    const madeCount = rows.filter((row) => row.made).length;
    state.nextTrump = Rules.trumpForNextHand(madeCount);
    state.handSummary = {
      handNumber: state.handNumber,
      trump: state.trump,
      whispersOn: state.whispersOn,
      madeCount: madeCount,
      nextTrump: state.nextTrump,
      rows: rows
    };
    state.history.push(state.handSummary);

    if (state.handNumber >= state.seasonLength) {
      const decision = Rules.decideWinner(rows);
      state.winners = decision.winners;
      state.winReason = decision.wasTied ? decision.reason : null;
      state.phase = 'gameOver';
    } else {
      state.winners = [];
      state.winReason = null;
      state.phase = 'handOver';
    }
    return state;
  }

  global.Engine = {
    SEATS: SEATS,
    HUMAN: HUMAN,
    createGame: createGame,
    startHand: startHand,
    mayTakeWhisper: mayTakeWhisper,
    takeWhisper: takeWhisper,
    refuseWhisper: refuseWhisper,
    resolveComputerWhispers: resolveComputerWhispers,
    whispersSettled: whispersSettled,
    beginBidding: beginBidding,
    submitBid: submitBid,
    submitComputerBids: submitComputerBids,
    biddingComplete: biddingComplete,
    beginPlay: beginPlay,
    ledSuit: ledSuit,
    legalPlaysFor: legalPlaysFor,
    isLegalPlay: isLegalPlay,
    playCard: playCard,
    contextFor: contextFor,
    watchedBy: watchedBy,
    playComputerCard: playComputerCard,
    completeTrick: completeTrick,
    finishHand: finishHand,
    seenBy: seenBy
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
