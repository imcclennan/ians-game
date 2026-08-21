/*
 * print.js - builds the printed edition from the game's own data.
 *
 * The Whisper cards, the rules sheet and the quick reference card are all
 * generated from js/whispers.js, js/rules.js and js/rulebook.js, so a change to
 * the game reaches the printer without anyone retyping it.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Rules = global.Rules;
  const Whispers = global.Whispers;
  const Rulebook = global.Rulebook;
  const WhisperCard = global.WhisperCard;

  const CARDS_PER_SHEET = 9;

  /* --- ornaments ---------------------------------------------------------- */

  /** A rule broken by a lozenge. The spine of the whole printed edition. */
  function flourish() {
    return '<div class="flourish"><i></i></div>';
  }

  /**
   * The court's seal: a coronet inside a beaded ring. It marks anything the
   * monarch is responsible for, which is to say every Whisper.
   */
  function seal(extraClass) {
    let beads = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      beads += '<circle cx="' + (50 + 44 * Math.cos(angle)).toFixed(2) +
        '" cy="' + (50 + 44 * Math.sin(angle)).toFixed(2) + '" r="1.7"/>';
    }
    return '<svg class="seal ' + (extraClass || '') + '" viewBox="0 0 100 100" ' +
      'aria-hidden="true" fill="currentColor">' +
      '<circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      beads +
      '<path d="M31 62 L31 39 L40 47 L50 33 L60 47 L69 39 L69 62 Z"/>' +
      '<rect x="31" y="65" width="38" height="4.5" rx="2"/>' +
      '<circle cx="31" cy="36" r="3.4"/><circle cx="50" cy="30" r="3.4"/>' +
      '<circle cx="69" cy="36" r="3.4"/>' +
      '</svg>';
  }

  /** The four marks in a row, used as a footer device. */
  function agentRow(size) {
    return '<span class="agent-row" style="font-size:' + size + '">' +
      Rulebook.AGENT_ORDER
        .map((suit) => '<span class="agent-' + suit + '">' + Cards.emblem(suit) + '</span>')
        .join('') +
      '</span>';
  }

  /* --- the Whisper cards --------------------------------------------------- */

  // The card face is shared with the app -- see js/whispercard.js -- so the
  // card on the table and the card off the printer cannot drift apart.
  function whisperCard(whisper) {
    return WhisperCard.html(whisper);
  }

  function whisperBack() {
    return '<div class="pcard whisper-back">' +
      '<div class="pcard-back-frame">' +
        seal('lg') +
        '<div class="back-title">The Fool’s Court</div>' +
        '<div class="back-sub">A word from the monarch</div>' +
        agentRow('5.5mm') +
      '</div>' +
    '</div>';
  }

  /** Fronts laid nine to a sheet, then a matching sheet of backs. */
  function buildWhisperSheets(host) {
    const all = Whispers.ALL;
    let html = '';

    for (let start = 0; start < all.length; start += CARDS_PER_SHEET) {
      const page = all.slice(start, start + CARDS_PER_SHEET);
      html += '<div class="sheet cards"><div class="card-grid">' +
        page.map(whisperCard).join('') +
        '</div></div>';
    }

    let backs = '';
    for (let i = 0; i < CARDS_PER_SHEET; i++) backs += whisperBack();
    html += '<div class="sheet cards"><div class="card-grid">' + backs + '</div></div>';

    host.innerHTML = html;
  }

  /* --- the rules sheet ----------------------------------------------------- */

  function rulesMasthead() {
    return '<header class="masthead">' +
      seal('lg') +
      '<h1>The Fool\u2019s Court</h1>' +
      '<p class="masthead-sub">A trick-taking game of promises, for four players</p>' +
      flourish() +
      '<p class="masthead-line">Sixty cards &middot; ' + Rules.HAND_SIZE + ' dealt each &middot; ' +
        Rules.BID_CARDS + ' sent out &middot; ' + Rules.TRICKS_PER_HAND + ' audiences &middot; ' +
        Rules.SEASON_LENGTH + ' nights</p>' +
    '</header>';
  }

  function sectionHtml(section) {
    return '<section class="rule-section" id="' + section.id + '">' +
      '<h2><span class="rule-number">' + section.number + '</span>' + section.title +
      (section.optional ? '<span class="rule-optional">optional</span>' : '') + '</h2>' +
      section.html +
    '</section>';
  }

  /**
   * Set the rules two columns to a sheet, packing sections onto a sheet until
   * the next one would not fit and then starting a fresh one. The sheets are a
   * fixed A4 height, so this is measured against the real thing rather than
   * guessed at -- which is the only way to be sure a printed page does not lose
   * its last paragraph off the bottom.
   */
  function buildRulesSheets(host) {
    const sections = Rulebook.sections();
    host.innerHTML = '';

    let sheet = null;
    let columns = null;

    function startSheet(withMasthead) {
      sheet = document.createElement('div');
      sheet.className = 'sheet rules-sheet';
      if (withMasthead) sheet.innerHTML = rulesMasthead();

      columns = document.createElement('div');
      columns.className = 'rules-columns';
      sheet.appendChild(columns);

      const foot = document.createElement('footer');
      foot.className = 'sheet-foot';
      foot.innerHTML = agentRow('4mm') +
        '<span class="smallcaps">The Fool\u2019s Court</span>';
      sheet.appendChild(foot);

      host.appendChild(sheet);
      columns.style.height = room() + 'px';
    }

    /** Room left for type on this sheet, once masthead and footer are paid for. */
    function room() {
      const box = getComputedStyle(sheet);
      const masthead = sheet.querySelector('.masthead');
      return sheet.clientHeight
        - parseFloat(box.paddingTop) - parseFloat(box.paddingBottom)
        - (masthead ? masthead.offsetHeight : 0)
        - 42; // the footer and its rule
    }

    /**
     * A fixed-height column box that has run out of room overflows sideways,
     * into a third column, so width is what tells us the sheet is full.
     */
    function overflows() {
      return columns.scrollWidth > columns.clientWidth + 1;
    }

    startSheet(true);

    for (const section of sections) {
      // The list of Whispers is a reference in its own right and gets a sheet
      // to itself rather than being wrapped around a column break.
      if (section.id === 'rule-whisperlist' && columns.childElementCount) startSheet(false);

      columns.insertAdjacentHTML('beforeend', sectionHtml(section));

      if (overflows() && columns.childElementCount > 1) {
        columns.removeChild(columns.lastElementChild);
        startSheet(false);
        columns.insertAdjacentHTML('beforeend', sectionHtml(section));
      }
    }
  }

  /* --- the quick reference card -------------------------------------------- */

  function referenceFront() {
    const rows = Rulebook.AGENT_ORDER.map((suit) =>
      '<tr>' +
        '<td class="mark"><span class="agent-' + suit + '">' + Cards.emblem(suit) + '</span></td>' +
        '<td class="name agent-' + suit + '">' + Cards.SUIT_ROLE[suit] + '</td>' +
        '<td class="val">' + Cards.BID_VALUE[suit] + '</td>' +
      '</tr>').join('');

    return '<div class="refcard">' +
      '<div class="refcard-frame">' +
        '<div class="ref-head">' + seal('sm') +
          '<h3>Making a Pledge</h3>' +
          '<p class="smallcaps">side one</p>' +
        '</div>' +
        flourish() +
        '<p class="ref-lede">Send <b>' + Rules.BID_CARDS + ' agents</b> out face down. Their ' +
          '<b>kinds</b> add up to the audiences you promise. <b>Rank is ignored.</b></p>' +
        '<table class="ref-table pledge-table">' + rows + '</table>' +
        flourish() +
        '<ul class="ref-list">' +
          '<li>Errands are <b>out of play</b> — ' + Rules.TRICKS_PER_HAND +
            ' cards remain, so ' + Rules.TRICKS_PER_HAND + ' audiences are contested.</li>' +
          '<li>Revealed only when the session <b>ends</b>.</li>' +
          '<li>Four Assassins pledge <b>12</b>, which cannot be kept. Nothing forbids it.</li>' +
          '<li>The agents that make your promise are the ones you no longer get to play.</li>' +
        '</ul>' +
        '<div class="ref-foot">' + agentRow('3.6mm') + '</div>' +
      '</div>' +
    '</div>';
  }

  function referenceBack() {
    const sway = Rules.SWAY_LADDER.map((suit, made) =>
      '<tr>' +
        '<td class="count">' + made + '</td>' +
        '<td class="arrow">&rarr;</td>' +
        '<td class="name' + (suit ? ' agent-' + suit : '') + '">' +
          (suit ? Cards.emblem(suit) + ' ' + Cards.SUIT_ROLE_PLURAL[suit] : 'No Sway') +
        '</td>' +
      '</tr>').join('');

    return '<div class="refcard">' +
      '<div class="refcard-frame">' +
        '<div class="ref-head">' + seal('sm') +
          '<h3>Sway &amp; Favour</h3>' +
          '<p class="smallcaps">side two</p>' +
        '</div>' +
        flourish() +
        '<p class="ref-sub smallcaps">Who holds sway</p>' +
        '<p class="ref-lede tight">Nobles who kept their pledge <b>exactly</b> last session:</p>' +
        '<table class="ref-table sway-table">' + sway + '</table>' +
        '<p class="ref-fine">The first session of a season is always No Sway.</p>' +
        flourish() +
        '<p class="ref-sub smallcaps">Winning favour</p>' +
        '<table class="ref-table favour-table">' +
          '<tr><td class="left">Pledge kept exactly</td><td class="score">2 each</td></tr>' +
          '<tr><td class="left">Pledge missed</td><td class="score">1 each, &minus;2 per off</td></tr>' +
          '<tr><td class="left">Pledged 0, won 0</td><td class="score">+10</td></tr>' +
          '<tr><td class="left">Pledged 0, won any</td><td class="score">&minus;10</td></tr>' +
        '</table>' +
        '<p class="ref-fine">Pledged 5, won 4 &rarr; <b>2</b>. Pledged 3, won 6 &rarr; <b>0</b>. ' +
          'Most favour after ' + Rules.SEASON_LENGTH + ' nights wins.</p>' +
        '<div class="ref-foot">' + agentRow('3.6mm') + '</div>' +
      '</div>' +
    '</div>';
  }

  /** Front and back on separate sheets, so they can be printed double-sided. */
  function buildReferenceSheets(host) {
    host.innerHTML =
      '<div class="sheet ref-sheet"><div class="ref-slot">' + referenceFront() +
        '</div><p class="cut-note smallcaps">Side one &middot; print double-sided, ' +
        'flip on the short edge</p></div>' +
      '<div class="sheet ref-sheet"><div class="ref-slot">' + referenceBack() +
        '</div><p class="cut-note smallcaps">Side two</p></div>';
  }

  global.PrintEdition = {
    seal: seal,
    flourish: flourish,
    agentRow: agentRow,
    buildWhisperSheets: buildWhisperSheets,
    buildRulesSheets: buildRulesSheets,
    buildReferenceSheets: buildReferenceSheets
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
