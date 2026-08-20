/*
 * rulebook.js - the rules of The Fool's Court, written once.
 *
 * Both the panel behind "Rules" in the app and the printable sheet in print/
 * render from this file, and the tables inside it are built from the game's
 * own data, so the written rules cannot drift from the code that enforces
 * them or from the edition that goes to a printer.
 */
(function (global) {
  'use strict';

  const Cards = global.Cards;
  const Rules = global.Rules;
  const Whispers = global.Whispers;

  const INK = { S: 'graphite', H: 'crimson', D: 'antique gold', C: 'plum' };
  const FACE = { S: 'pale slate', H: 'pale rose', D: 'pale gold', C: 'pale lilac' };
  const MARK = { S: 'a dagger', H: 'a rose', D: 'a balance', C: 'a cap and bells' };
  const AGENT_ORDER = ['S', 'H', 'D', 'C'];

  /** An agent's mark and name, in that agent's ink. */
  function agent(suit) {
    if (suit === null) return '<b>No Sway</b>';
    return '<span class="agent agent-' + suit + '">' + Cards.emblem(suit) +
      ' <b>' + Cards.SUIT_ROLE_PLURAL[suit] + '</b></span>';
  }

  function agentTable() {
    return '<table class="rule-table">' +
      '<tr><th class="left">Agent</th><th>Mark</th><th>Promises</th>' +
      '<th class="left">Printed on</th></tr>' +
      AGENT_ORDER.map((suit) => '<tr>' +
        '<td class="left"><span class="agent agent-' + suit + '"><b>' +
          Cards.SUIT_ROLE[suit] + '</b></span></td>' +
        '<td><span class="agent agent-' + suit + ' big">' + Cards.emblem(suit) + '</span></td>' +
        '<td>' + Cards.BID_VALUE[suit] + '</td>' +
        '<td class="left">' + FACE[suit] + ', in ' + INK[suit] + ' (' + MARK[suit] + ')</td>' +
        '</tr>').join('') +
      '</table>';
  }

  function swayTable() {
    return '<table class="rule-table">' +
      '<tr><th class="left">Nobles who kept their pledge</th>' +
      '<th class="left">Sway next session</th></tr>' +
      Rules.SWAY_LADDER.map((suit, made) => '<tr>' +
        '<td class="left">' + (made === 1 ? '1 noble' : made + ' nobles') + '</td>' +
        '<td class="left">' + agent(suit) + '</td>' +
        '</tr>').join('') +
      '</table>';
  }

  function whisperTable() {
    return '<table class="rule-table whisper-table">' +
      '<tr><th class="left">Whisper</th><th class="left">Effect</th></tr>' +
      Whispers.ALL.map((whisper) => '<tr>' +
        '<td class="left"><b>' + whisper.name + '</b></td>' +
        '<td class="left">' + whisper.line +
          '<span class="whisper-flavour">' + whisper.detail + '</span></td>' +
        '</tr>').join('') +
      '</table>';
  }

  const T = Rules.TRICKS_PER_HAND;
  const SECTIONS = [
    {
      id: 'rule-overview',
      title: 'Overview',
      html:
        '<p>Four nobles compete for the ear of the monarch over a series of <strong>sessions</strong>. ' +
        'At the start of each session every player privately promises how many <strong>audiences</strong> ' +
        'they will win, and then plays to reach that number exactly.</p>' +
        '<p>Favour is awarded for precision rather than for ambition. Winning more audiences than ' +
        'you promised is penalised just as surely as winning fewer, so the difficulty of the game ' +
        'lies in judging a hand accurately and then steering it to land on the number. The first ' +
        'player past <strong>' + Rules.TARGET_SCORE + ' favour</strong> wins the season.</p>' +
        '<p class="rule-note">A promise is called a <em>pledge</em>. A trick is called an ' +
        '<em>audience</em>. The trump suit is called the <em>sway</em>. Points are called ' +
        '<em>favour</em>. The dealer is called the <em>steward</em>.</p>'
    },
    {
      id: 'rule-deck',
      title: 'The deck',
      html:
        '<p>The game uses a deck of <strong>' + (Cards.RANKS.length * Cards.SUITS.length) +
        ' cards</strong>: four kinds of agent, each ranked <strong>1 to ' + Cards.HIGHEST_VALUE +
        '</strong>. Rank ' + Cards.HIGHEST_VALUE + ' is the most influential and rank 1 the least.</p>' +
        agentTable() +
        '<p>An agent’s <em>kind</em> determines what it is worth when sent out on an errand ' +
        '(section 4). An agent’s <em>rank</em> determines whether it wins an audience ' +
        '(section 5). The two are used at different times and never interact.</p>'
    },
    {
      id: 'rule-deal',
      title: 'Seating and the deal',
      html:
        '<p>Four players sit in a fixed order. Play and the deal both proceed ' +
        '<strong>clockwise</strong>, which is to say to the left.</p>' +
        '<ol>' +
        '<li>One player is the <strong>steward</strong> for the session and deals <strong>' +
        Rules.HAND_SIZE + ' cards</strong> to each player, exhausting the deck.</li>' +
        '<li>Each player makes a pledge (section 4).</li>' +
        '<li>' + T + ' audiences are played out (section 5).</li>' +
        '<li>Favour is scored, and the sway for the next session is determined (sections 6 and 7).</li>' +
        '<li>The stewardship passes one seat to the left, and a new session begins.</li>' +
        '</ol>'
    },
    {
      id: 'rule-pledge',
      title: 'Making a pledge',
      html:
        '<p><strong>4.1</strong> Before any card is played, each player selects <strong>' +
        Rules.BID_CARDS + ' cards</strong> from their hand and places them face down in front of ' +
        'them. These are that player’s <strong>errands</strong>.</p>' +
        '<p><strong>4.2</strong> A player’s <strong>pledge</strong> is the sum of the errand ' +
        'values of the four cards sent, by kind. <strong>Rank is disregarded entirely</strong>: a ' +
        'Fool of ' + Cards.HIGHEST_VALUE + ' promises exactly as little as a Fool of 1.</p>' +
        '<p><strong>4.3</strong> Errands remain face down and <strong>out of play</strong> for the ' +
        'remainder of the session. ' + T + ' cards therefore remain in each hand, and <strong>' +
        T + ' audiences</strong> are contested.</p>' +
        '<p><strong>4.4</strong> A pledge is <strong>not capped</strong>. Four Assassins constitute ' +
        'a pledge of twelve, which exceeds the ' + T + ' audiences available and cannot be kept ' +
        'under any circumstances. Nothing in the rules forbids it.</p>' +
        '<p><strong>4.5</strong> All errands are revealed simultaneously when the session ends. ' +
        'Until then, no player knows another’s pledge, nor which cards have left another’s ' +
        'hand.</p>' +
        '<p class="rule-note">The cards that make your promise are the cards you no longer get to ' +
        'play. Promising a great deal costs you Assassins; promising nothing is cheap only if your ' +
        'Fools were worthless to begin with. This tension is the heart of the game.</p>'
    },
    {
      id: 'rule-play',
      title: 'Playing the session',
      html:
        '<p><strong>5.1</strong> The player to the steward’s left <strong>opens</strong> the ' +
        'first audience by playing any card from their hand, including one of the ruling kind.</p>' +
        '<p><strong>5.2</strong> Play continues clockwise. Each player in turn must <strong>answer ' +
        'in kind</strong> — that is, play a card of the same kind as the one that opened the ' +
        'audience — if they hold one. A player holding none may play any card at all.</p>' +
        '<p><strong>5.3</strong> The audience is won by the <strong>highest-ranked card of the kind ' +
        'that opened it</strong>, unless one or more cards of the <strong>ruling kind</strong> ' +
        '(section 7) were played, in which case the highest-ranked of those wins instead.</p>' +
        '<p><strong>5.4</strong> A card of neither the opening kind nor the ruling kind can never ' +
        'win an audience, whatever its rank.</p>' +
        '<p><strong>5.5</strong> The winner of an audience opens the next. ' + T + ' audiences are ' +
        'played, exhausting every hand.</p>'
    },
    {
      id: 'rule-favour',
      title: 'Winning favour',
      html:
        '<p>At the end of the session each player compares the audiences they won against the ' +
        'pledge they made, and scores as follows.</p>' +
        '<table class="rule-table">' +
        '<tr><th class="left">Result</th><th class="left">Favour</th></tr>' +
        '<tr><td class="left">Pledge kept exactly</td><td class="left">2 for every audience won</td></tr>' +
        '<tr><td class="left">Pledge missed, high or low</td><td class="left">1 for every audience ' +
        'won, less 2 for every audience off the pledge</td></tr>' +
        '<tr><td class="left">Pledged nothing, won nothing</td><td class="left">5</td></tr>' +
        '<tr><td class="left">Pledged nothing, won audiences</td><td class="left">−5 for the ' +
        'first, and −2 for each one after it</td></tr>' +
        '</table>' +
        '<p><strong>Worked examples.</strong></p>' +
        '<ul class="rule-examples">' +
        '<li>Pledged 4, won 4. The pledge is kept: <b>8 favour</b>.</li>' +
        '<li>Pledged 5, won 4. One short: 4 − 2 = <b>2 favour</b>.</li>' +
        '<li>Pledged 3, won 6. Three over: 6 − 6 = <b>0 favour</b>.</li>' +
        '<li>Pledged 2, won 0. Two short: 0 − 4 = <b>−4 favour</b>.</li>' +
        '<li>Pledged 0, won 0. <b>5 favour</b>.</li>' +
        '<li>Pledged 0, won 3. −5 for the first, −2 each for the other two: ' +
        '<b>−9 favour</b>.</li>' +
        '<li>Pledged 12, won ' + T + '. A pledge of twelve cannot be kept: ' + T + ' − 2 = ' +
        '<b>9 favour</b>, against the ' + (2 * T) + ' that promising ' + T + ' and delivering would ' +
        'have paid.</li>' +
        '</ul>' +
        '<p class="rule-note">Because being wrong costs 2 favour per audience in <em>either</em> ' +
        'direction, there is no advantage in deliberately under-promising and overshooting. The ' +
        'only good outcome is the exact one.</p>'
    },
    {
      id: 'rule-sway',
      title: 'Who holds sway',
      html:
        '<p>One kind of agent may <strong>hold sway</strong> for a session, outranking every other ' +
        'kind when audiences are decided (rule 5.3). Sway is not chosen by any player. It is ' +
        'determined by how the <em>previous</em> session went.</p>' +
        '<p>The first session of a season is always played at <strong>No Sway</strong>, where no ' +
        'kind outranks any other. After that, sway passes according to how many of the four nobles ' +
        'kept their pledge <strong>exactly</strong> in the session before.</p>' +
        swayTable() +
        '<p class="rule-note">The ladder runs from the humblest agent to the most dangerous. When ' +
        'the whole court fails, the Fool rules it; when the whole court succeeds, nobody does. ' +
        'Because sway is public knowledge before pledges are made, every player knows which kind is ' +
        'dangerous while they are deciding what to promise.</p>'
    },
    {
      id: 'rule-whispers',
      title: 'The Whispers',
      optional: true,
      html:
        '<p>The Whispers are an optional component. A season played without them is a complete ' +
        'game.</p>' +
        '<p><strong>8.1</strong> Before each session the monarch has a private word with every ' +
        'noble. Each player receives one <strong>Whisper</strong>, dealt face down from the ' +
        Whispers.ALL.length + ' below. No two players receive the same Whisper in a session.</p>' +
        '<p><strong>8.2</strong> A Whisper alters how that player’s favour is counted, or ' +
        'restricts which agents they may send out on errands, or both. It is <strong>private</strong> ' +
        'and is revealed only when the session ends, alongside the errands.</p>' +
        '<p><strong>8.3</strong> Where a Whisper restricts errands, the restriction is binding. If a ' +
        'player’s hand makes the restriction <strong>impossible to obey</strong> — being ' +
        'required to send an Assassin while holding none, for instance — the demand is ' +
        '<strong>waived</strong> for that session and the player pledges freely.</p>' +
        '<p><strong>8.4</strong> A Whisper never changes the rules of play in section 5. Every ' +
        'player answers in kind, and audiences are won exactly as described, whatever their Whisper ' +
        'says.</p>' +
        whisperTable() +
        '<p class="rule-note">The Whispers are what make the table worth watching. A rival who ' +
        'pledges strangely, or who ducks an audience they could plainly have won, is telling you ' +
        'something about the word they were given.</p>'
    },
    {
      id: 'rule-season',
      title: 'Winning the season',
      html:
        '<p><strong>9.1</strong> The season ends at the conclusion of the session in which any ' +
        'player reaches <strong>' + Rules.TARGET_SCORE + ' favour</strong> or more.</p>' +
        '<p><strong>9.2</strong> The player with the highest total wins. A total of ' +
        (Rules.TARGET_SCORE + 1) + ' beats a total of ' + Rules.TARGET_SCORE + '; reaching the ' +
        'target first confers nothing by itself.</p>' +
        '<p><strong>9.3</strong> Should two or more players finish level on favour, the season is ' +
        'decided in favour of whichever of them, in order:</p>' +
        '<ol>' +
        '<li>won more favour in the final session;</li>' +
        '<li>made the higher pledge in the final session;</li>' +
        '<li>sent out the four errands of the higher combined rank in the final session.</li>' +
        '</ol>'
    },
    {
      id: 'rule-summary',
      title: 'Summary of play',
      html:
        '<ol class="rule-summary">' +
        '<li>The steward deals ' + Rules.HAND_SIZE + ' cards to each of the four players.</li>' +
        '<li>Each player sends four agents out on errands, face down. Their kinds are that ' +
        'player’s pledge; their ranks are irrelevant.</li>' +
        '<li>If Whispers are in use, each player has already been given one, face down.</li>' +
        '<li>The player to the steward’s left opens the first of ' + T + ' audiences.</li>' +
        '<li>Players answer in kind where they can. The highest of the opening kind takes the ' +
        'audience, unless the ruling kind was played, in which case the highest of those does.</li>' +
        '<li>The winner of each audience opens the next.</li>' +
        '<li>Errands and Whispers are revealed. Favour is scored on the exactness of each pledge.</li>' +
        '<li>The number of pledges kept sets the sway for the next session.</li>' +
        '<li>The stewardship passes one seat to the left.</li>' +
        '<li>Play continues until a player passes ' + Rules.TARGET_SCORE + ' favour.</li>' +
        '</ol>'
    }
  ];

  /** The numbered sections, ready to drop into a document. */
  function sections() {
    return SECTIONS.map((section, index) => ({
      id: section.id,
      number: index + 1,
      title: section.title,
      optional: !!section.optional,
      html: section.html
    }));
  }

  global.Rulebook = {
    sections: sections,
    agent: agent,
    agentTable: agentTable,
    swayTable: swayTable,
    whisperTable: whisperTable,
    INK: INK,
    FACE: FACE,
    MARK: MARK,
    AGENT_ORDER: AGENT_ORDER
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
