/*
 * ui.js - draws the court and drives the engine from the player's input.
 */
(function () {
  'use strict';

  const Cards = globalThis.Cards;
  const Rules = globalThis.Rules;
  const Engine = globalThis.Engine;
  const Whispers = globalThis.Whispers;
  const Rulebook = globalThis.Rulebook;
  const WhisperCard = globalThis.WhisperCard;

  const byId = (id) => document.getElementById(id);

  /** What a kind promises, with a proper minus sign where it costs one. */
  const promised = (value) => (value < 0 ? '−' + Math.abs(value) : String(value));

  const dom = {
    meta: byId('topbar-meta'),
    felt: byId('felt'),
    trick: byId('trick'),
    trickNote: byId('trick-note'),
    medallion: byId('trump-medallion'),
    prompt: byId('prompt'),
    hand: byId('hand'),
    handActions: byId('hand-actions'),
    scoreboard: byId('scoreboard'),
    history: byId('history'),
    historyBox: byId('history-box'),
    trumpKey: byId('trump-key'),
    whisperBox: byId('whisper-box'),
    tableWhisper: byId('table-whisper'),
    whispersToggle: byId('whispers-toggle'),
    rulebook: byId('rulebook'),
    targetNote: byId('target-note'),
    overlay: byId('overlay'),
    modal: byId('modal'),
    toast: byId('toast'),
    speed: byId('speed'),
    newGame: byId('new-game')
  };

  const MADE_WORDS = ['No noble', 'One noble', 'Two nobles', 'Three nobles', 'All four nobles'];

  let state = null;
  let selection = [];       // ids of the agents the player is sending out
  let renderedTrick = [];   // card ids currently drawn in the middle of the table
  let timer = null;
  let toastTimer = null;
  let pace = 700;

  // --- small builders -------------------------------------------------------

  function suitClass(suit) {
    return ' suit-' + suit;
  }

  /**
   * How many of this agent the deck holds, shown as pips beside the rank: one
   * pip for the only one of it, up to five for the most crowded rank. Printed
   * only where the deck strikes some rank more than once -- on a deck of one
   * card per rank every pip would say the same thing and so say nothing.
   */
  function copyPips(card) {
    const copies = Cards.copiesOf(card.suit, card.rank);
    return '<span class="copies" aria-hidden="true">' +
      '<i></i>'.repeat(copies) + '</span>';
  }

  const COPY_WORD = ['no', 'one', 'two', 'three', 'four', 'five'];

  function cardEl(card, extra) {
    const node = document.createElement('div');
    // A card of the ruling kind is marked wherever it appears: it beats
    // anything outside its kind, and that is worth seeing at a glance.
    const ruling = state && state.trump === card.suit ? ' is-sway' : '';
    node.className = 'card' + suitClass(card.suit) + ruling + (extra ? ' ' + extra : '');
    node.dataset.id = card.id;
    const pips = copyPips(card);
    const corner = (pips
      ? '<span class="rank"><b>' + card.rank + '</b>' + pips + '</span>'
      : '<b>' + card.rank + '</b>') + Cards.emblem(card.suit, 'nib');
    node.innerHTML =
      '<span class="corner tl">' + corner + '</span>' +
      '<span class="face">' + Cards.emblem(card.suit) + '</span>' +
      '<span class="corner br">' + corner + '</span>';
    node.setAttribute('aria-label', Cards.SUIT_ROLE[card.suit] + ' ' + card.rank +
      (pips ? ', ' + COPY_WORD[Cards.copiesOf(card.suit, card.rank)] + ' in the deck' : ''));
    return node;
  }

  function backEl(extra) {
    const node = document.createElement('div');
    node.className = 'card back' + (extra ? ' ' + extra : '');
    node.setAttribute('aria-label', 'an agent away on an errand');
    return node;
  }

  /** An agent's mark and name, inline, in that agent's ink. */
  function suitSpan(suit) {
    if (suit === null) return '<b>No Sway</b>';
    return '<span class="agent agent-' + suit + '">' + Cards.emblem(suit) + ' <b>' +
      Cards.SUIT_ROLE_PLURAL[suit] + '</b></span>';
  }

  /** The twelfth is Twelfth Night, when the Fool presides and the books close. */
  function nightName(number) {
    return number === Rules.SEASON_LENGTH ? 'Twelfth Night' : 'Night';
  }

  /** "Night 4" or, for the last of them, "Twelfth Night". */
  function nightLabel(number) {
    return number === Rules.SEASON_LENGTH ? 'Twelfth Night' : 'Night ' + number;
  }

  /**
   * The human is addressed in the second person and the rivals in the third,
   * so a line about a seat needs both forms of its verb: "You take" against
   * "Ilka takes".
   */
  function says(seat, youForm, theyForm) {
    const player = state.players[seat];
    return player.isHuman
      ? '<b>You</b> ' + youForm
      : '<b>' + player.name + '</b> ' + theyForm;
  }

  /** The mark alone, for running text. */
  function mark(suit) {
    return '<span class="agent agent-' + suit + '">' + Cards.emblem(suit) + '</span>';
  }

  function chip(label, value, extra) {
    return '<span class="chip' + (extra ? ' ' + extra : '') + '">' + label +
      (value === undefined ? '' : ' <b>' + value + '</b>') + '</span>';
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  /** Errands stay face down until the night is over. */
  function bidsAreOpen() {
    return state.phase === 'handOver' || state.phase === 'gameOver';
  }

  /**
   * Whose errands may be looked at. Your own always, everyone's at the reveal,
   * and a noble under The Watched from the moment they send them.
   */
  function errandsOpen(player) {
    return player.isHuman || bidsAreOpen() || Whispers.revealsErrands(player.whisper);
  }

  // --- rendering ------------------------------------------------------------

  function render() {
    renderTopbar();
    for (let seat = 0; seat < Rules.PLAYER_COUNT; seat++) renderSeat(seat);
    renderTrick();
    renderHand();
    renderActions();
    renderPrompt();
    renderScoreboard();
    renderHistory();
    renderTrumpKey();
    renderWhisper();
    renderOverlay();
  }

  function renderTopbar() {
    const parts = [
      chip(nightName(state.handNumber), state.handNumber === state.seasonLength
        ? 'the last'
        : state.handNumber + ' of ' + state.seasonLength),
      chip('Steward', state.players[state.dealer].name),
      '<span class="chip chip-trump">' +
        (state.trump === null ? '<b>No Sway</b>' : 'Sway ' + suitSpan(state.trump)) + '</span>'
    ];
    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      parts.push(chip('Audience', state.trickNumber + ' of ' + Rules.TRICKS_PER_HAND));
    }
    dom.meta.innerHTML = parts.join('');
    dom.targetNote.textContent = 'over twelve nights';
  }

  function renderSeat(seat) {
    const player = state.players[seat];
    const node = byId('seat-' + seat);
    const isTurn = (state.phase === 'playing' && state.turn === seat) ||
      (player.isHuman && (state.phase === 'whisperOffer' ||
        (state.phase === 'bidding' && player.bid === null)));
    const showBid = errandsOpen(player);
    const made = showBid && player.bid !== null && player.bid === player.tricksWon;

    node.className = 'seat seat-' + player.position + (isTurn ? ' is-active' : '') +
      (bidsAreOpen() && made ? ' is-winner' : '');

    const head = '<div class="seat-head">' +
      '<span class="seat-name">' + player.name + '</span>' +
      (player.style ? '<span class="seat-style">' + player.style + '</span>' : '') +
      (state.dealer === seat ? '<span class="seat-dealer" title="Steward tonight">S</span>' : '') +
      '</div>';

    const bidText = player.bid === null ? '&mdash;' : (showBid ? player.bid : '?');
    const stats = '<div class="seat-stats">' +
      '<span>Pledge <b>' + bidText + '</b></span>' +
      '<span class="' + (made ? 'met' : '') + '">Won <b>' + player.tricksWon + '</b></span>' +
      '</div>';

    // Whether a noble took a word is there for anyone to see. What it says is
    // theirs alone until the night is over.
    const open = bidsAreOpen() || player.isHuman;
    let whisperLine = '';
    if (player.tookWhisper === true) {
      whisperLine = '<div class="seat-whisper' + (open ? ' open' : '') + '">' +
        (open ? player.whisper.name : 'sealed') + '</div>';
    } else if (player.tookWhisper === false && state.whispersOn) {
      whisperLine = '<div class="seat-whisper bare">went without</div>';
    }
    // A noble whose errands are on show cannot pretend otherwise.
    if (!open && Whispers.revealsErrands(player.whisper)) {
      whisperLine = '<div class="seat-whisper watched">' + player.whisper.name + '</div>';
    }

    node.innerHTML = head + stats + whisperLine + '<div class="seat-foot"></div>';
    const foot = node.querySelector('.seat-foot');

    const pile = document.createElement('div');
    pile.className = 'bid-pile';
    pile.title = showBid && player.bid !== null
      ? 'Errands pledging ' + plural(player.bid, 'audience')
      : Rules.BID_CARDS + ' agents away on errands, their kinds sealed';
    for (const card of player.bidCards) {
      pile.appendChild(errandsOpen(player) ? cardEl(card, 'sm') : backEl('sm'));
    }
    foot.appendChild(pile);

    if (!player.isHuman) {
      const count = document.createElement('span');
      count.className = 'hand-count';
      count.textContent = plural(player.hand.length, 'agent');
      foot.appendChild(count);
    }
  }

  function renderTrick() {
    const ids = state.trick.map((play) => play.card.id);
    const stillAPrefix = ids.length >= renderedTrick.length &&
      renderedTrick.every((id, i) => ids[i] === id);

    if (!stillAPrefix) {
      dom.trick.innerHTML = '';
      renderedTrick = [];
    }

    for (let i = renderedTrick.length; i < state.trick.length; i++) {
      const play = state.trick[i];
      const wrap = document.createElement('div');
      wrap.className = 'play play-' + state.players[play.player].position;
      wrap.dataset.seat = String(play.player);
      const label = document.createElement('span');
      label.className = 'play-label';
      label.textContent = state.players[play.player].name;
      wrap.appendChild(label);
      wrap.appendChild(cardEl(play.card));
      dom.trick.appendChild(wrap);
      renderedTrick.push(play.card.id);
    }

    for (const node of dom.trick.querySelectorAll('.play')) {
      const won = state.phase === 'trickComplete' &&
        Number(node.dataset.seat) === state.trickResult.winner;
      node.classList.toggle('won', won);
    }

    dom.felt.className = 'felt sway-' + (state.trump === null ? 'none' : state.trump);
    dom.medallion.className = 'trump-medallion' + (state.trump === null ? ' nt' : '');
    dom.medallion.innerHTML = state.trump === null ? 'NO SWAY' : Cards.emblem(state.trump);

    if (state.phase === 'trickComplete') {
      const took = state.trickResult.card;
      dom.trickNote.innerHTML =
        says(state.trickResult.winner, 'take', 'takes') + ' audience ' + state.trickNumber +
        ' with ' + mark(took.suit) + ' ' + Cards.SUIT_ROLE[took.suit] + ' ' + took.rank;
    } else if (state.phase === 'playing' && state.trick.length === 0) {
      dom.trickNote.innerHTML = says(state.leader, 'open', 'opens');
    } else {
      dom.trickNote.textContent = '';
    }
  }

  function renderHand() {
    const player = state.players[Engine.HUMAN];
    const bidding = state.phase === 'bidding' && player.bid === null;
    const myTurn = state.phase === 'playing' && state.turn === Engine.HUMAN;
    const legal = myTurn
      ? new Set(Engine.legalPlaysFor(state, Engine.HUMAN).map((card) => card.id))
      : null;

    const whisper = player.whisper;
    const bound = bidding && Whispers.canSatisfy(whisper, player.hand);

    dom.hand.innerHTML = '';
    for (const card of Cards.sortHand(player.hand, state.trump)) {
      let extra = '';
      if (bidding) {
        extra = 'playable' + (selection.includes(card.id) ? ' selected' : '');
        // Nothing is forbidden. An agent the word asked you to keep back is
        // marked, and sending it anyway simply costs you the word's reward.
        if (bound && !Whispers.allowsCard(whisper, card)) extra += ' against-word';
      } else if (myTurn) {
        extra = legal.has(card.id) ? 'playable' : 'illegal';
      }
      const node = cardEl(card, extra);
      if (bidding || (myTurn && extra !== 'illegal')) {
        node.tabIndex = 0;
        node.setAttribute('role', 'button');
      }
      dom.hand.appendChild(node);
    }
  }

  function renderActions() {
    const player = state.players[Engine.HUMAN];
    dom.handActions.innerHTML = '';

    if (state.phase === 'whisperOffer') {
      const allowed = Engine.mayTakeWhisper(state, Engine.HUMAN);

      const take = document.createElement('button');
      take.type = 'button';
      take.className = 'btn';
      take.id = 'take-whisper';
      take.textContent = 'Take a Whisper';
      take.disabled = !allowed;
      dom.handActions.appendChild(take);

      const refuse = document.createElement('button');
      refuse.type = 'button';
      refuse.className = 'btn btn-quiet';
      refuse.id = 'refuse-whisper';
      refuse.textContent = allowed ? 'Go without' : 'Continue';
      dom.handActions.appendChild(refuse);

      const note = document.createElement('span');
      note.className = 'bid-readout';
      note.innerHTML = allowed
        ? '<span class="sum">' + state.whisperPool.length +
          ' words sealed &middot; you will not know which you have until you take it</span>'
        : '<span class="sum">' + (state.handNumber === 1
            ? 'The court is level, so the monarch confides in no one tonight.'
            : 'The monarch does not confide in whoever is winning.') + '</span>';
      dom.handActions.appendChild(note);
      return;
    }

    if (state.phase === 'bidding' && player.bid === null) {
      const chosen = selection.map((id) => player.hand.find((card) => card.id === id));
      const total = Rules.bidFromCards(chosen);
      const breakdown = chosen.length
        ? chosen.map((card) => mark(card.suit) + promised(Cards.BID_VALUE[card.suit])).join(' + ')
        : '';

      const complete = selection.length === Rules.BID_CARDS;
      // A Fool costs a promise, so the parts can add up to less than the pledge
      // shows, and the two ways of promising nothing are worth very different
      // amounts. Say which is which rather than leaving the sum to look like an
      // arithmetic mistake.
      const nought = complete && total === 0
        ? (Rules.isFoolsErrand(chosen)
          ? ' <span class="sum">&middot; four Fools: a <b>Fool\u2019s errand</b></span>'
          : ' <span class="sum">&middot; promises nothing, but only by adding up: ' +
            'a <b>hollow promise</b></span>')
        : '';
      const heeded = Whispers.permitsSet(player.whisper, chosen, player.hand);
      const aim = Whispers.aimFor(player.whisper, total);

      const readout = document.createElement('div');
      readout.className = 'bid-readout';
      readout.innerHTML = 'Your pledge: <span class="total">' + total + '</span>' +
        (breakdown ? ' <span class="sum">(' + breakdown + ')</span>' : '') +
        (aim !== total ? ' <span class="sum">&middot; win exactly <b>' + aim + '</b></span>' : '') +
        ' <span class="sum">&middot; ' + selection.length + ' of ' + Rules.BID_CARDS + ' sent</span>' +
        nought +
        (complete && !heeded
          ? ' <span class="warn">&middot; against your Whisper (' + player.whisper.demand +
            ') &mdash; it will pay you nothing</span>'
          : '');
      dom.handActions.appendChild(readout);

      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn';
      confirm.textContent = 'Pledge ' + plural(total, 'audience');
      confirm.disabled = !complete;
      confirm.addEventListener('click', placeBid);
      dom.handActions.appendChild(confirm);

      if (selection.length) {
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'btn btn-quiet';
        clear.textContent = 'Recall all';
        clear.addEventListener('click', () => { selection = []; render(); });
        dom.handActions.appendChild(clear);
      }
      return;
    }

    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      const note = document.createElement('div');
      note.className = 'bid-readout';
      const aim = Whispers.aimFor(player.whisper, player.bid);
      note.innerHTML = 'You pledged <span class="total">' + player.bid + '</span>' +
        (aim !== player.bid ? ' <span class="sum">(win exactly ' + aim + ')</span>' : '') +
        ' <span class="sum">&middot; won ' + player.tricksWon +
        ' &middot; ' + plural(player.hand.length, 'agent') + ' in hand</span>';
      dom.handActions.appendChild(note);
    }
  }

  function renderPrompt() {
    const player = state.players[Engine.HUMAN];

    if (state.phase === 'whisperOffer') {
      if (!Engine.mayTakeWhisper(state, Engine.HUMAN)) {
        dom.prompt.innerHTML = 'No <b>Whisper</b> is offered to you tonight. ' +
          '<span class="hint">Only a noble who is behind on favour is confided in, and you ' +
          (state.handNumber === 1 ? 'are level with the table' : 'are not behind') + '.</span>';
        return;
      }
      dom.prompt.innerHTML = 'Look at your hand. Will you take a <b>Whisper</b>? ' +
        '<span class="hint">It costs nothing, but you take it unread &mdash; and a word from ' +
        'the monarch can bind you as easily as it can pay.</span>';
      return;
    }

    if (state.phase === 'bidding' && player.bid === null) {
      dom.prompt.innerHTML = 'Send out <b>four agents</b> to set your pledge. ' +
        '<span class="hint">' + mark('S') + ' 3, ' + mark('H') + ' 2, ' + mark('D') + ' 1, ' +
        mark('C') + ' 0 &mdash; and they are gone for the night.</span>';
      return;
    }

    if (state.phase === 'playing' && state.turn === Engine.HUMAN) {
      const led = Engine.ledSuit(state);
      const mustFollow = led && player.hand.some((card) => card.suit === led);
      dom.prompt.innerHTML = 'Your turn. ' + (mustFollow
        ? '<span class="hint">You must answer with ' + mark(led) + ' ' + Cards.SUIT_ROLE_PLURAL[led] + '.</span>'
        : '<span class="hint">' + (led
            ? 'No ' + Cards.SUIT_ROLE_PLURAL[led] + ' left &mdash; send anyone, sway included.'
            : 'You open the audience &mdash; send anyone, sway included.') + '</span>');
      return;
    }

    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      const waitingOn = state.phase === 'playing' ? state.players[state.turn].name : null;
      dom.prompt.innerHTML = waitingOn
        ? '<span class="hint">' + waitingOn + ' is weighing it up&hellip;</span>'
        : '<span class="hint">The audience is settled&hellip;</span>';
      return;
    }

    dom.prompt.innerHTML = '<span class="hint">The night is over.</span>';
  }

  function renderScoreboard() {
    let html = '<tr><th>Noble</th><th>Pledge</th><th>Won</th><th>Favour</th></tr>';
    state.players.forEach((player, seat) => {
      const showBid = errandsOpen(player);
      const bid = player.bid === null ? '&mdash;' : (showBid ? player.bid : '?');
      const met = showBid && player.bid === player.tricksWon;
      html += '<tr class="' + (player.isHuman ? 'me' : '') + '">' +
        '<td>' + player.name + (state.dealer === seat ? ' <span class="pip black">&bull;</span>' : '') + '</td>' +
        '<td>' + bid + '</td>' +
        '<td class="' + (met ? 'met' : '') + '">' + player.tricksWon + '</td>' +
        '<td class="total">' + player.score + '</td>' +
        '</tr>';
    });
    dom.scoreboard.innerHTML = html;
  }

  function renderHistory() {
    if (!state.history.length) {
      dom.history.innerHTML = '<p class="history-empty">The court has not yet sat.</p>';
      return;
    }
    let html = '';
    for (const summary of state.history.slice().reverse()) {
      html += '<div class="history-hand"><h3>' + nightLabel(summary.handNumber) + ' &middot; ' +
        Rules.trumpLabel(summary.trump) + '</h3>';
      for (const row of summary.rows) {
        const sign = row.points > 0 ? 'pos' : (row.points < 0 ? 'neg' : '');
        html += '<div class="history-row">' +
          '<span class="who">' + row.name + '</span>' +
          '<span>pledged ' + row.bid + ', won ' + row.tricksWon + '</span>' +
          '<span class="pts ' + sign + '">' + (row.points > 0 ? '+' : '') + row.points + '</span>' +
          '</div>';
      }
      html += '</div>';
    }
    dom.history.innerHTML = html;
  }

  function renderWhisper() {
    const player = state.players[Engine.HUMAN];
    const whisper = player.whisper;

    // The card as it exists in the deck, laid on the table in front of you.
    dom.tableWhisper.innerHTML = whisper ? WhisperCard.html(whisper, 'wcard-sm') : '';

    if (!whisper) {
      dom.whisperBox.hidden = true;
      dom.whisperBox.innerHTML = '';
      return;
    }
    dom.whisperBox.hidden = false;

    const bound = Whispers.canSatisfy(whisper, player.hand.concat(player.bidCards));
    const demand = whisper.demand && bound
      ? '<p class="whisper-demand">Tonight, ' + whisper.demand + '.</p>'
      : '';
    const waived = whisper.demand && !bound
      ? '<p class="whisper-demand waived">You hold none, so the demand is waived.</p>'
      : '';

    dom.whisperBox.innerHTML =
      '<h2>Your Whisper</h2>' +
      '<p class="whisper-name">' + whisper.name + '</p>' +
      '<p class="whisper-line">' + whisper.line + '</p>' +
      '<p class="fine">' + whisper.detail + '</p>' + demand + waived;
  }

  function renderTrumpKey() {
    const previous = state.history[state.handNumber - 2];
    const active = previous ? previous.madeCount : -1;
    for (const item of dom.trumpKey.children) {
      item.classList.toggle('is-now', Number(item.dataset.made) === active);
    }
  }

  // --- modals ---------------------------------------------------------------

  function resultTable(summary) {
    let html = '<table class="result-table"><tr>' +
      '<th class="left">Noble</th><th class="left">Errands</th>' +
      '<th>Pledge</th><th>Won</th><th>Favour</th><th>Total</th></tr>';
    summary.rows.forEach((row, seat) => {
      const sign = row.points > 0 ? 'pos' : (row.points < 0 ? 'neg' : '');
      const cards = row.bidCards
        .map((card) => '<span class="card sm' + suitClass(card.suit) + '">' +
          '<span class="corner tl"><b>' + card.rank + '</b>' +
          Cards.emblem(card.suit, 'nib') + '</span></span>')
        .join('');
      const mine = state.players[seat].isHuman ? ' me' : '';
      html += '<tr class="result-row' + mine + (row.whisper ? ' has-whisper' : '') + '">' +
        '<td>' + row.name +
        (row.whisper ? '<span class="row-whisper">' + row.whisper.name + '</span>' : '') + '</td>' +
        '<td class="left"><span class="bid-cards">' + cards + '</span></td>' +
        '<td>' + row.bid + '</td>' +
        '<td class="' + (row.made ? 'made' : 'missed') + '">' + row.tricksWon + '</td>' +
        '<td class="pts ' + sign + '">' + (row.points > 0 ? '+' : '') + row.points + '</td>' +
        '<td class="total">' + row.total + '</td>' +
        '</tr>';

      // What each of them had been told, so the favour column can be read
      // rather than merely believed.
      if (row.whisper) {
        html += '<tr class="whisper-row' + mine + '">' +
          '<td colspan="6"><span class="whisper-word">' + row.whisper.name + '</span>' +
          row.whisper.line + '</td></tr>';
      }
    });
    return html + '</table>';
  }

  function renderOverlay() {
    if (state.phase !== 'handOver' && state.phase !== 'gameOver') {
      dom.overlay.hidden = true;
      dom.modal.innerHTML = '';
      return;
    }

    const summary = state.handSummary;
    let html = '';

    const nextSteward = state.players[Rules.leftOf(state.dealer)];

    if (state.phase === 'handOver') {
      html += '<h2>' + nightLabel(summary.handNumber) + ' &middot; ' +
        Rules.trumpLabel(summary.trump) + '</h2>';
      html += '<p class="lede">' + MADE_WORDS[summary.madeCount] + ' kept their pledge exactly.</p>';
      html += resultTable(summary);
      html += '<div class="modal-note">' + MADE_WORDS[summary.madeCount] + ' kept their word, so ' +
        (summary.nextTrump === null
          ? 'the court sits at <b>No Sway</b> tomorrow night.'
          : 'the ' + suitSpan(summary.nextTrump) + ' hold sway tomorrow night.') +
        ' ' + (nextSteward.isHuman
          ? '<b>You</b> become steward.'
          : '<b>' + nextSteward.name + '</b> becomes steward.') + '</div>';
      html += '<div class="modal-actions"><button type="button" class="btn" id="deal-next">Open ' +
        nightLabel(summary.handNumber + 1).toLowerCase().replace('night', 'night') +
        '</button></div>';
    } else {
      const ranked = summary.rows.slice().sort(Rules.compareForWin);
      const won = state.winners.includes(state.players[Engine.HUMAN].name);
      html += '<h2>' + (won && state.winners.length === 1
        ? 'You win!'
        : state.winners.join(' and ') + (state.winners.length === 1 ? ' wins' : ' tie')) + '</h2>';
      html += '<p class="lede">The court has sat ' + plural(state.history.length, 'night') +
        ' and the books are closed.' +
        (state.winReason
          ? ' Level on favour, so it goes to <b>' + state.winReason + '</b>.'
          : '') + '</p>';
      html += '<ul class="podium">';
      ranked.forEach((row, index) => {
        html += '<li class="' + (index === 0 ? 'first' : '') + '">' +
          '<span class="rank">' + (index + 1) + '</span>' +
          '<span class="who">' + row.name + '</span>' +
          '<span class="pts">' + row.total + '</span></li>';
      });
      html += '</ul>';
      html += resultTable(summary);
      html += '<div class="modal-actions"><button type="button" class="btn" id="play-again">New season</button></div>';
    }

    dom.modal.innerHTML = html;
    dom.overlay.hidden = false;

    const next = byId('deal-next');
    if (next) next.addEventListener('click', dealNextHand);
    const again = byId('play-again');
    if (again) again.addEventListener('click', startNewGame);
  }

  // --- the rulebook ---------------------------------------------------------

  /**
   * Render the rulebook from js/rulebook.js, so the panel behind "Rules", the
   * printable sheet and the game itself all state the same rules.
   */
  function buildRulebook() {
    const sections = Rulebook.sections();

    byId('rulebook-nav').innerHTML = sections
      .map((section) => '<a href="#' + section.id + '">' + section.number + '. ' +
        section.title + '</a>')
      .join('');

    byId('rulebook-text').innerHTML = sections
      .map((section) => '<section id="' + section.id + '">' +
        '<h3>' + section.number + '. ' + section.title +
        (section.optional ? '<span class="rule-optional">optional</span>' : '') + '</h3>' +
        section.html + '</section>')
      .join('');

    for (const slot of document.querySelectorAll('#trump-key .slot')) {
      slot.innerHTML = suitSpan(slot.dataset.agent);
    }
  }

  function openRules() {
    dom.rulebook.hidden = false;
    document.body.classList.add('reading');
    byId('close-rules').focus();
  }

  function closeRules() {
    dom.rulebook.hidden = true;
    document.body.classList.remove('reading');
  }

  // --- player actions -------------------------------------------------------

  function toast(message) {
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2200);
  }

  function toggleSelection(id) {
    const player = state.players[Engine.HUMAN];
    const card = player.hand.find((one) => one.id === id);

    const index = selection.indexOf(id);
    if (index >= 0) {
      selection.splice(index, 1);
    } else if (selection.length >= Rules.BID_CARDS) {
      toast('Only ' + Rules.BID_CARDS + ' agents may go — call one back first.');
      return;
    } else {
      selection.push(id);
    }
    render();
  }

  /** The human decides, then the rivals decide, then everyone pledges. */
  function answerWhisper(take) {
    if (state.phase !== 'whisperOffer') return;
    if (take && Engine.mayTakeWhisper(state, Engine.HUMAN)) {
      Engine.takeWhisper(state, Engine.HUMAN);
    } else {
      Engine.refuseWhisper(state, Engine.HUMAN);
    }
    Engine.resolveComputerWhispers(state);
    Engine.beginBidding(state);
    render();
  }

  function placeBid() {
    const player = state.players[Engine.HUMAN];
    const chosen = selection.map((id) => player.hand.find((card) => card.id === id));
    if (chosen.length !== Rules.BID_CARDS || chosen.some((card) => !card)) return;

    Engine.submitBid(state, Engine.HUMAN, chosen);
    Engine.submitComputerBids(state);
    Engine.beginPlay(state);
    selection = [];
    renderedTrick = [];
    render();
    schedule();
  }

  function tryPlay(id) {
    const player = state.players[Engine.HUMAN];
    const card = player.hand.find((item) => item.id === id);
    if (!card) return;

    if (!Engine.isLegalPlay(state, Engine.HUMAN, card)) {
      const led = Engine.ledSuit(state);
      toast('You still hold ' + Cards.SUIT_ROLE_PLURAL[led] + ' and must answer with one.');
      return;
    }

    Engine.playCard(state, Engine.HUMAN, card);
    render();
    schedule();
  }

  function onHandActivate(event) {
    const node = event.target.closest('.card');
    if (!node || !dom.hand.contains(node)) return;
    const id = node.dataset.id;
    const player = state.players[Engine.HUMAN];

    if (state.phase === 'bidding' && player.bid === null) toggleSelection(id);
    else if (state.phase === 'playing' && state.turn === Engine.HUMAN) tryPlay(id);
  }

  function dealNextHand() {
    Engine.startHand(state);
    selection = [];
    renderedTrick = [];
    render();
  }

  function startNewGame() {
    clearTimeout(timer);
    timer = null;
    state = Engine.createGame({ whispers: dom.whispersToggle.checked });
    Engine.startHand(state);
    selection = [];
    renderedTrick = [];
    render();
  }


  // --- the clock ------------------------------------------------------------

  function schedule() {
    clearTimeout(timer);
    timer = null;

    if (state.phase === 'playing') {
      if (state.turn === Engine.HUMAN) return;
      timer = setTimeout(() => {
        Engine.playComputerCard(state);
        render();
        schedule();
      }, pace);
      return;
    }

    if (state.phase === 'trickComplete') {
      timer = setTimeout(() => {
        Engine.completeTrick(state);
        render();
        schedule();
      }, pace + 550);
    }
  }

  // --- wiring ---------------------------------------------------------------

  dom.hand.addEventListener('click', onHandActivate);
  dom.hand.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onHandActivate(event);
  });

  dom.handActions.addEventListener('click', (event) => {
    if (event.target.id === 'take-whisper') answerWhisper(true);
    else if (event.target.id === 'refuse-whisper') answerWhisper(false);
  });

  byId('open-rules').addEventListener('click', openRules);
  byId('close-rules').addEventListener('click', closeRules);
  dom.rulebook.addEventListener('click', (event) => {
    if (event.target === dom.rulebook) closeRules();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dom.rulebook.hidden) closeRules();
  });

  dom.whispersToggle.addEventListener('change', () => {
    const wanted = dom.whispersToggle.checked;
    state.whispersOn = wanted;
    // Whispers are offered with the deal, so a change lands on the next night
    // rather than rewriting one already in progress.
    const midSession = state.phase !== 'handOver' && state.phase !== 'gameOver';
    toast('Whispers ' + (wanted ? 'on' : 'off') +
      (midSession ? ' from the next night.' : ' from here.'));
    render();
  });


  dom.speed.addEventListener('change', () => { pace = Number(dom.speed.value); });
  pace = Number(dom.speed.value);

  dom.newGame.addEventListener('click', () => {
    const midGame = state && state.phase !== 'gameOver' &&
      (state.handNumber > 1 || state.players.some((player) => player.tricksWon > 0));
    if (midGame && !window.confirm('Begin a new season? The favour won so far is lost.')) return;
    startNewGame();
  });

  buildRulebook();
  startNewGame();
})();
