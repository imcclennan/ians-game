/*
 * ui.js - draws the table and drives the engine from player input.
 */
(function () {
  'use strict';

  const Cards = globalThis.Cards;
  const Rules = globalThis.Rules;
  const Engine = globalThis.Engine;

  const byId = (id) => document.getElementById(id);

  const dom = {
    meta: byId('topbar-meta'),
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
    targetNote: byId('target-note'),
    overlay: byId('overlay'),
    modal: byId('modal'),
    toast: byId('toast'),
    speed: byId('speed'),
    newGame: byId('new-game')
  };

  const MADE_WORDS = ['Nobody', 'One player', 'Two players', 'Three players', 'All four players'];

  let state = null;
  let selection = [];       // card ids the human has set aside for the bid
  let renderedTrick = [];   // card ids currently drawn in the middle of the table
  let timer = null;
  let toastTimer = null;
  let pace = 700;

  // --- small builders -------------------------------------------------------

  function suitClass(suit) {
    return Cards.SUIT_COLOR[suit] === 'red' ? ' red' : '';
  }

  function cardEl(card, extra) {
    const node = document.createElement('div');
    node.className = 'card' + suitClass(card.suit) + (extra ? ' ' + extra : '');
    node.dataset.id = card.id;
    const symbol = Cards.SUIT_SYMBOL[card.suit];
    const corner = '<b>' + card.rank + '</b><i>' + symbol + '</i>';
    node.innerHTML =
      '<span class="corner tl">' + corner + '</span>' +
      '<span class="face">' + symbol + '</span>' +
      '<span class="corner br">' + corner + '</span>';
    node.setAttribute('aria-label', card.rank + ' of ' + Cards.SUIT_NAME[card.suit]);
    return node;
  }

  function backEl(extra) {
    const node = document.createElement('div');
    node.className = 'card back' + (extra ? ' ' + extra : '');
    node.setAttribute('aria-label', 'face-down card');
    return node;
  }

  function suitSpan(suit) {
    if (suit === null) return '<b>No Trump</b>';
    return '<span class="pip ' + (Cards.SUIT_COLOR[suit] === 'red' ? 'red' : 'black') + '">' +
      Cards.SUIT_SYMBOL[suit] + '</span> <b>' + Cards.SUIT_NAME[suit] + '</b>';
  }

  function chip(label, value, extra) {
    return '<span class="chip' + (extra ? ' ' + extra : '') + '">' + label +
      (value === undefined ? '' : ' <b>' + value + '</b>') + '</span>';
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

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
    renderOverlay();
  }

  function renderTopbar() {
    const parts = [
      chip('Hand', state.handNumber),
      chip('Dealer', state.players[state.dealer].name),
      '<span class="chip chip-trump">Trump ' + suitSpan(state.trump) + '</span>'
    ];
    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      parts.push(chip('Trick', state.trickNumber + ' of ' + Rules.TRICKS_PER_HAND));
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
      (state.dealer === seat ? '<span class="seat-dealer" title="Dealer">D</span>' : '') +
      '</div>';

    const bidText = player.bid === null ? '&mdash;' : (showBid ? player.bid : '?');
    const stats = '<div class="seat-stats">' +
      '<span>Bid <b>' + bidText + '</b></span>' +
      '<span class="' + (made ? 'met' : '') + '">Won <b>' + player.tricksWon + '</b></span>' +
      '</div>';

    node.innerHTML = head + stats + '<div class="seat-foot"></div>';
    const foot = node.querySelector('.seat-foot');

    const pile = document.createElement('div');
    pile.className = 'bid-pile';
    pile.title = showBid && player.bid !== null
      ? 'Bid cards worth ' + plural(player.bid, 'trick')
      : 'Three face-down bid cards';
    for (const card of player.bidCards) {
      pile.appendChild(bidsAreOpen() ? cardEl(card, 'sm') : backEl('sm'));
    }
    foot.appendChild(pile);

    if (!player.isHuman) {
      const count = document.createElement('span');
      count.className = 'hand-count';
      count.textContent = plural(player.hand.length, 'card');
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

    dom.medallion.className = 'trump-medallion' + (state.trump === null ? ' nt' : '');
    dom.medallion.textContent = state.trump === null ? 'NT' : Cards.SUIT_SYMBOL[state.trump];

    if (state.phase === 'trickComplete') {
      const winner = state.players[state.trickResult.winner];
      dom.trickNote.innerHTML = '<b>' + winner.name + '</b> takes trick ' + state.trickNumber +
        ' with the ' + Cards.describe(state.trickResult.card);
    } else if (state.phase === 'playing' && state.trick.length === 0) {
      dom.trickNote.textContent = state.players[state.leader].name + ' leads';
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

    dom.hand.innerHTML = '';
    for (const card of Cards.sortHand(player.hand, state.trump)) {
      let extra = '';
      if (bidding) {
        extra = 'playable' + (selection.includes(card.id) ? ' selected' : '');
      } else if (myTurn) {
        extra = legal.has(card.id) ? 'playable' : 'illegal';
      }
      const node = cardEl(card, extra);
      if (bidding || myTurn) {
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
        ? chosen.map((card) => Cards.SUIT_SYMBOL[card.suit] + Cards.BID_VALUE[card.suit]).join(' + ')
        : '';

      const readout = document.createElement('div');
      readout.className = 'bid-readout';
      readout.innerHTML = 'Your bid: <span class="total">' + total + '</span>' +
        (breakdown ? ' <span class="sum">(' + breakdown + ')</span>' : '') +
        ' <span class="sum">&middot; ' + selection.length + ' of ' + Rules.BID_CARDS + ' chosen</span>';
      dom.handActions.appendChild(readout);

      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn';
      confirm.textContent = 'Place bid of ' + total;
      confirm.disabled = selection.length !== Rules.BID_CARDS;
      confirm.addEventListener('click', placeBid);
      dom.handActions.appendChild(confirm);

      if (selection.length) {
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'btn btn-quiet';
        clear.textContent = 'Clear';
        clear.addEventListener('click', () => { selection = []; render(); });
        dom.handActions.appendChild(clear);
      }
      return;
    }

    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      const note = document.createElement('div');
      note.className = 'bid-readout';
      note.innerHTML = 'You bid <span class="total">' + player.bid + '</span>' +
        ' <span class="sum">&middot; won ' + player.tricksWon +
        ' &middot; ' + plural(player.hand.length, 'card') + ' left</span>';
      dom.handActions.appendChild(note);
    }
  }

  function renderPrompt() {
    const player = state.players[Engine.HUMAN];

    if (state.phase === 'bidding' && player.bid === null) {
      dom.prompt.innerHTML = 'Set aside <b>three cards</b> as your bid. ' +
        '<span class="hint">Spades 3, hearts 2, diamonds 1, clubs 0 &mdash; and they are out of play for the hand.</span>';
      return;
    }

    if (state.phase === 'playing' && state.turn === Engine.HUMAN) {
      const led = Engine.ledSuit(state);
      const mustFollow = led && player.hand.some((card) => card.suit === led);
      dom.prompt.innerHTML = 'Your turn. ' + (mustFollow
        ? '<span class="hint">You must follow ' + Cards.SUIT_SYMBOL[led] + ' ' + Cards.SUIT_NAME[led] + '.</span>'
        : '<span class="hint">' + (led ? 'You are void &mdash; play anything, trump included.' : 'You lead &mdash; play anything, trump included.') + '</span>');
      return;
    }

    if (state.phase === 'playing' || state.phase === 'trickComplete') {
      const waitingOn = state.phase === 'playing' ? state.players[state.turn].name : null;
      dom.prompt.innerHTML = waitingOn
        ? '<span class="hint">' + waitingOn + ' is thinking&hellip;</span>'
        : '<span class="hint">Collecting the trick&hellip;</span>';
      return;
    }

    dom.prompt.innerHTML = '<span class="hint">Hand over.</span>';
  }

  function renderScoreboard() {
    let html = '<tr><th>Player</th><th>Bid</th><th>Won</th><th>Score</th></tr>';
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
      dom.history.innerHTML = '<p class="history-empty">No hands finished yet.</p>';
      return;
    }
    let html = '';
    for (const summary of state.history.slice().reverse()) {
      html += '<div class="history-hand"><h3>Hand ' + summary.handNumber + ' &middot; ' +
        Rules.trumpLabel(summary.trump) + '</h3>';
      for (const row of summary.rows) {
        const sign = row.points > 0 ? 'pos' : (row.points < 0 ? 'neg' : '');
        html += '<div class="history-row">' +
          '<span class="who">' + row.name + '</span>' +
          '<span>bid ' + row.bid + ', won ' + row.tricksWon + '</span>' +
          '<span class="pts ' + sign + '">' + (row.points > 0 ? '+' : '') + row.points + '</span>' +
          '</div>';
      }
      html += '</div>';
    }
    dom.history.innerHTML = html;
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
      '<th class="left">Player</th><th class="left">Bid cards</th>' +
      '<th>Bid</th><th>Won</th><th>Points</th><th>Total</th></tr>';
    summary.rows.forEach((row, seat) => {
      const sign = row.points > 0 ? 'pos' : (row.points < 0 ? 'neg' : '');
      const cards = row.bidCards
        .map((card) => '<span class="card sm' + suitClass(card.suit) + '" style="width:22px;height:31px">' +
          '<span class="corner tl"><b>' + card.rank + '</b><i>' + Cards.SUIT_SYMBOL[card.suit] + '</i></span></span>')
        .join('');
      html += '<tr class="' + (state.players[seat].isHuman ? 'me' : '') + '">' +
        '<td>' + row.name + '</td>' +
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

    if (state.phase === 'handOver') {
      html += '<h2>Hand ' + summary.handNumber + ' &middot; ' + Rules.trumpLabel(summary.trump) + '</h2>';
      html += '<p class="lede">' + MADE_WORDS[summary.madeCount] + ' made their bid exactly.</p>';
      html += resultTable(summary);
      html += '<div class="modal-note">' + MADE_WORDS[summary.madeCount] + ' made the bid, so hand ' +
        (summary.handNumber + 1) + ' is played ' +
        (summary.nextTrump === null ? 'at <b>No Trump</b>.' : 'with <b>' + Cards.SUIT_NAME[summary.nextTrump] +
          '</b> ' + Cards.SUIT_SYMBOL[summary.nextTrump] + ' as trump.') +
        ' The deal passes to <b>' + state.players[Rules.leftOf(state.dealer)].name + '</b>.</div>';
      html += '<div class="modal-actions"><button type="button" class="btn" id="deal-next">Deal hand ' +
        (summary.handNumber + 1) + '</button></div>';
    } else {
      const ranked = state.players.slice().sort((a, b) => b.score - a.score);
      const won = state.winners.includes(state.players[Engine.HUMAN].name);
      html += '<h2>' + (won && state.winners.length === 1 ? 'You win!' : state.winners.join(' and ') + ' wins') + '</h2>';
      html += '<p class="lede">First past ' + state.target + ' points after ' +
        plural(state.history.length, 'hand') + '.</p>';
      html += '<ul class="podium">';
      ranked.forEach((player, index) => {
        html += '<li class="' + (index === 0 ? 'first' : '') + '">' +
          '<span class="rank">' + (index + 1) + '</span>' +
          '<span class="who">' + player.name + '</span>' +
          '<span class="pts">' + player.score + '</span></li>';
      });
      html += '</ul>';
      html += resultTable(summary);
      html += '<div class="modal-actions"><button type="button" class="btn" id="play-again">Play again</button></div>';
    }

    dom.modal.innerHTML = html;
    dom.overlay.hidden = false;

    const next = byId('deal-next');
    if (next) next.addEventListener('click', dealNextHand);
    const again = byId('play-again');
    if (again) again.addEventListener('click', startNewGame);
  }

  // --- player actions -------------------------------------------------------

  function toast(message) {
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2200);
  }

  function toggleSelection(id) {
    const index = selection.indexOf(id);
    if (index >= 0) {
      selection.splice(index, 1);
    } else if (selection.length >= Rules.BID_CARDS) {
      toast('Three cards make a bid — deselect one first.');
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
      toast('You have to follow ' + Cards.SUIT_NAME[led] + ' ' + Cards.SUIT_SYMBOL[led] + '.');
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
    state = Engine.createGame();
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

  dom.speed.addEventListener('change', () => { pace = Number(dom.speed.value); });
  pace = Number(dom.speed.value);

  dom.newGame.addEventListener('click', () => {
    const midGame = state && state.phase !== 'gameOver' &&
      (state.handNumber > 1 || state.players.some((player) => player.tricksWon > 0));
    if (midGame && !window.confirm('Start a new game? The current scores are lost.')) return;
    startNewGame();
  });

  startNewGame();
})();
