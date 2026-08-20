/*
 * ui.js - draws the court and drives the engine from the player's input.
 */
(function () {
  'use strict';

  const Cards = globalThis.Cards;
  const Rules = globalThis.Rules;
  const Engine = globalThis.Engine;
  const Whispers = globalThis.Whispers;

  const byId = (id) => document.getElementById(id);

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

  function cardEl(card, extra) {
    const node = document.createElement('div');
    node.className = 'card' + suitClass(card.suit) + (extra ? ' ' + extra : '');
    node.dataset.id = card.id;
    const corner = '<b>' + card.rank + '</b>' + Cards.emblem(card.suit, 'nib');
    node.innerHTML =
      '<span class="corner tl">' + corner + '</span>' +
      '<span class="face">' + Cards.emblem(card.suit) + '</span>' +
      '<span class="corner br">' + corner + '</span>';
    node.setAttribute('aria-label', Cards.SUIT_ROLE[card.suit] + ' ' + card.rank);
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

  /** Errands stay face down until the session is over. */
  function bidsAreOpen() {
    return state.phase === 'handOver' || state.phase === 'gameOver';
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
      chip('Session', state.handNumber),
      chip('Steward', state.players[state.dealer].name),
      '<span class="chip chip-trump">' +
        (state.trump === null ? '<b>No Sway</b>' : 'Sway ' + suitSpan(state.trump)) + '</span>'
    ];
    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      parts.push(chip('Audience', state.trickNumber + ' of ' + Rules.TRICKS_PER_HAND));
    }
    dom.meta.innerHTML = parts.join('');
    dom.targetNote.textContent = 'first to ' + state.target;
  }

  function renderSeat(seat) {
    const player = state.players[seat];
    const node = byId('seat-' + seat);
    const isTurn = (state.phase === 'playing' && state.turn === seat) ||
      (state.phase === 'bidding' && player.isHuman && player.bid === null);
    const showBid = player.isHuman || bidsAreOpen();
    const made = showBid && player.bid !== null && player.bid === player.tricksWon;

    node.className = 'seat seat-' + player.position + (isTurn ? ' is-active' : '') +
      (bidsAreOpen() && made ? ' is-winner' : '');

    const head = '<div class="seat-head">' +
      '<span class="seat-name">' + player.name + '</span>' +
      (player.style ? '<span class="seat-style">' + player.style + '</span>' : '') +
      (state.dealer === seat ? '<span class="seat-dealer" title="Steward this session">S</span>' : '') +
      '</div>';

    const bidText = player.bid === null ? '&mdash;' : (showBid ? player.bid : '?');
    const stats = '<div class="seat-stats">' +
      '<span>Pledge <b>' + bidText + '</b></span>' +
      '<span class="' + (made ? 'met' : '') + '">Won <b>' + player.tricksWon + '</b></span>' +
      '</div>';

    const whisper = player.whisper;
    const whisperLine = whisper
      ? '<div class="seat-whisper' + (bidsAreOpen() || player.isHuman ? ' open' : '') + '">' +
        (bidsAreOpen() || player.isHuman ? whisper.name : 'sealed') + '</div>'
      : '';

    node.innerHTML = head + stats + whisperLine + '<div class="seat-foot"></div>';
    const foot = node.querySelector('.seat-foot');

    const pile = document.createElement('div');
    pile.className = 'bid-pile';
    pile.title = showBid && player.bid !== null
      ? 'Errands pledging ' + plural(player.bid, 'audience')
      : Rules.BID_CARDS + ' agents away on errands';
    for (const card of player.bidCards) {
      pile.appendChild(bidsAreOpen() ? cardEl(card, 'sm') : backEl('sm'));
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
      const winner = state.players[state.trickResult.winner];
      const took = state.trickResult.card;
      dom.trickNote.innerHTML = '<b>' + winner.name + '</b> takes audience ' + state.trickNumber +
        ' with ' + mark(took.suit) + ' ' + Cards.SUIT_ROLE[took.suit] + ' ' + took.rank;
    } else if (state.phase === 'playing' && state.trick.length === 0) {
      dom.trickNote.textContent = state.players[state.leader].name + ' opens';
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
        extra = bound && !Whispers.allowsCard(whisper, card)
          ? 'forbidden'
          : 'playable' + (selection.includes(card.id) ? ' selected' : '');
      } else if (myTurn) {
        extra = legal.has(card.id) ? 'playable' : 'illegal';
      }
      const node = cardEl(card, extra);
      if ((bidding && extra !== 'forbidden') || (myTurn && extra !== 'illegal')) {
        node.tabIndex = 0;
        node.setAttribute('role', 'button');
      }
      dom.hand.appendChild(node);
    }
  }

  function renderActions() {
    const player = state.players[Engine.HUMAN];
    dom.handActions.innerHTML = '';

    if (state.phase === 'bidding' && player.bid === null) {
      const chosen = selection.map((id) => player.hand.find((card) => card.id === id));
      const total = Rules.bidFromCards(chosen);
      const breakdown = chosen.length
        ? chosen.map((card) => mark(card.suit) + Cards.BID_VALUE[card.suit]).join(' + ')
        : '';

      const complete = selection.length === Rules.BID_CARDS;
      const legal = Whispers.permitsSet(player.whisper, chosen, player.hand);
      const aim = Whispers.aimFor(player.whisper, total);

      const readout = document.createElement('div');
      readout.className = 'bid-readout';
      readout.innerHTML = 'Your pledge: <span class="total">' + total + '</span>' +
        (breakdown ? ' <span class="sum">(' + breakdown + ')</span>' : '') +
        (aim !== total ? ' <span class="sum">&middot; win exactly <b>' + aim + '</b></span>' : '') +
        ' <span class="sum">&middot; ' + selection.length + ' of ' + Rules.BID_CARDS + ' sent</span>' +
        (complete && !legal
          ? ' <span class="warn">&middot; your Whisper says ' + player.whisper.demand + '</span>'
          : '');
      dom.handActions.appendChild(readout);

      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn';
      confirm.textContent = 'Pledge ' + plural(total, 'audience');
      confirm.disabled = !complete || !legal;
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

    if (state.phase === 'bidding' && player.bid === null) {
      dom.prompt.innerHTML = 'Send out <b>four agents</b> to set your pledge. ' +
        '<span class="hint">' + mark('S') + ' 3, ' + mark('H') + ' 2, ' + mark('D') + ' 1, ' +
        mark('C') + ' 0 &mdash; and they are gone for the session.</span>';
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

    dom.prompt.innerHTML = '<span class="hint">The session is over.</span>';
  }

  function renderScoreboard() {
    let html = '<tr><th>Noble</th><th>Pledge</th><th>Won</th><th>Favour</th></tr>';
    state.players.forEach((player, seat) => {
      const showBid = player.isHuman || bidsAreOpen();
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
      html += '<div class="history-hand"><h3>Session ' + summary.handNumber + ' &middot; ' +
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

    if (!whisper) {
      dom.whisperBox.hidden = true;
      dom.whisperBox.innerHTML = '';
      return;
    }
    dom.whisperBox.hidden = false;

    const bound = Whispers.canSatisfy(whisper, player.hand.concat(player.bidCards));
    const demand = whisper.demand && bound
      ? '<p class="whisper-demand">This session, ' + whisper.demand + '.</p>'
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
      html += '<tr class="' + (state.players[seat].isHuman ? 'me' : '') + '">' +
        '<td>' + row.name +
        (row.whisper ? '<span class="row-whisper">' + row.whisper.name + '</span>' : '') + '</td>' +
        '<td class="left"><span class="bid-cards">' + cards + '</span></td>' +
        '<td>' + row.bid + '</td>' +
        '<td class="' + (row.made ? 'made' : 'missed') + '">' + row.tricksWon + '</td>' +
        '<td class="pts ' + sign + '">' + (row.points > 0 ? '+' : '') + row.points + '</td>' +
        '<td class="total">' + row.total + '</td>' +
        '</tr>';
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
      html += '<h2>Session ' + summary.handNumber + ' &middot; ' + Rules.trumpLabel(summary.trump) + '</h2>';
      html += '<p class="lede">' + MADE_WORDS[summary.madeCount] + ' kept their pledge exactly.</p>';
      html += resultTable(summary);
      html += '<div class="modal-note">' + MADE_WORDS[summary.madeCount] + ' kept their word, so ' +
        (summary.nextTrump === null
          ? 'the court sits at <b>No Sway</b> next session.'
          : 'the ' + suitSpan(summary.nextTrump) + ' hold sway next session.') +
        ' ' + (nextSteward.isHuman
          ? '<b>You</b> become steward.'
          : '<b>' + nextSteward.name + '</b> becomes steward.') + '</div>';
      html += '<div class="modal-actions"><button type="button" class="btn" id="deal-next">Open session ' +
        (summary.handNumber + 1) + '</button></div>';
    } else {
      const ranked = summary.rows.slice().sort(Rules.compareForWin);
      const won = state.winners.includes(state.players[Engine.HUMAN].name);
      html += '<h2>' + (won && state.winners.length === 1
        ? 'You win!'
        : state.winners.join(' and ') + (state.winners.length === 1 ? ' wins' : ' tie')) + '</h2>';
      html += '<p class="lede">First past ' + state.target + ' favour after ' +
        plural(state.history.length, 'session') + '.' +
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
   * Fill in the three tables the rulebook shares with the game itself, so the
   * written rules cannot drift from the code that enforces them.
   */
  function buildRulebook() {
    const inks = {
      S: 'graphite', H: 'crimson', D: 'antique gold', C: 'plum'
    };
    const agents = ['S', 'H', 'D', 'C'];

    byId('rule-agents').innerHTML +=
      agents.map((suit) => '<tr>' +
        '<td class="left"><span class="agent agent-' + suit + '"><b>' +
          Cards.SUIT_ROLE[suit] + '</b></span></td>' +
        '<td><span class="agent agent-' + suit + ' big">' + Cards.emblem(suit) + '</span></td>' +
        '<td>' + Cards.BID_VALUE[suit] + '</td>' +
        '<td class="left">' + inks[suit] + '</td>' +
        '</tr>').join('');

    byId('rule-sway-table').innerHTML +=
      Rules.SWAY_LADDER.map((suit, made) => '<tr>' +
        '<td class="left">' + (made === 1 ? '1 noble' : made + ' nobles') + '</td>' +
        '<td class="left">' + suitSpan(suit) + '</td>' +
        '</tr>').join('');

    byId('rule-whisper-table').innerHTML +=
      Whispers.ALL.map((whisper) => '<tr>' +
        '<td class="left"><b>' + whisper.name + '</b></td>' +
        '<td class="left">' + whisper.line +
          '<span class="whisper-flavour">' + whisper.detail + '</span></td>' +
        '</tr>').join('');

    byId('target-note');
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
    if (card && Whispers.canSatisfy(player.whisper, player.hand) &&
        !Whispers.allowsCard(player.whisper, card)) {
      toast('Your Whisper forbids it: ' + player.whisper.demand + '.');
      return;
    }

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
    // Whispers are dealt with the cards, so a change lands on the next session
    // rather than rewriting one already in progress.
    const midSession = state.phase !== 'handOver' && state.phase !== 'gameOver';
    toast('Whispers ' + (wanted ? 'on' : 'off') +
      (midSession ? ' from the next session.' : ' from here.'));
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
