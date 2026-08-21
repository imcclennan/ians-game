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
      '<th class="left">Sway next night</th></tr>' +
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
        '<p>Four nobles compete for the ear of the monarch over a series of <strong>nights</strong>. ' +
        'At the start of each night every player privately promises how many <strong>audiences</strong> ' +
        'they will win, and then plays to reach that number exactly.</p>' +
        '<p>Favour is awarded for precision rather than for ambition. Winning more audiences than ' +
        'you promised is penalised just as surely as winning fewer, so the difficulty of the game ' +
        'lies in judging a hand accurately and then steering it to land on the number.</p>' +
        '<p>A season is <strong>' + Rules.SEASON_LENGTH + ' nights</strong> of court, the last of ' +
        'them <strong>Twelfth Night</strong>. Whoever holds the most favour when it ends has the ' +
        'monarch\u2019s ear for the year.</p>' +
        '<p class="rule-note">A hand is called a <em>night</em>. A promise is called a ' +
        '<em>pledge</em>. A trick is called an <em>audience</em>. The trump suit is called the ' +
        '<em>sway</em>. Points are called <em>favour</em>. The dealer is called the ' +
        '<em>steward</em>.</p>'
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
        '(section {{rule-pledge}}). An agent’s <em>rank</em> determines whether it wins an audience ' +
        '(section {{rule-play}}). The two are used at different times and never interact.</p>'
    },
    {
      id: 'rule-deal',
      title: 'Seating, the deal, and the course of a night',
      html:
        '<p>Four players sit in a fixed order. Play and the deal both proceed ' +
        '<strong>clockwise</strong>, which is to say to the left. One player is the ' +
        '<strong>steward</strong> for the night; the stewardship passes one seat to the left ' +
        'after every night.</p>' +
        '<p>A night runs as follows.</p>' +
        '<ol class="rule-summary">' +
        '<li>The steward deals <strong>' + Rules.HAND_SIZE + ' cards</strong> to each of the ' +
        'four players, exhausting the deck.</li>' +
        '<li>If Whispers are in use, each player looks at their own hand and chooses whether to ' +
        'take one, unread and for nothing (section {{rule-whispers}}).</li>' +
        '<li>Each player sends <strong>' + Rules.BID_CARDS + ' agents</strong> out on errands, ' +
        'face down. Their kinds are that player\u2019s pledge; their ranks are irrelevant ' +
        '(section {{rule-pledge}}).</li>' +
        '<li>The player to the steward\u2019s left opens the first of <strong>' + T +
        ' audiences</strong>.</li>' +
        '<li>Players answer in kind where they can. The highest of the opening kind takes the ' +
        'audience, unless the ruling kind was played, in which case the highest of those does ' +
        '(section {{rule-play}}).</li>' +
        '<li>The winner of each audience opens the next, until every hand is empty.</li>' +
        '<li>Errands and Whispers are revealed. Favour is scored on the exactness of each ' +
        'pledge (section {{rule-favour}}).</li>' +
        '<li>The number of pledges kept sets the sway for the next night ' +
        '(section {{rule-sway}}).</li>' +
        '<li>The stewardship passes one seat to the left, and a new night begins.</li>' +
        '</ol>' +
        '<p>After <strong>' + Rules.SEASON_LENGTH + ' nights</strong> the season ends and the ' +
        'most favour wins, as set out in section {{rule-season}}.</p>'
    },
    {
      id: 'rule-whispers',
      title: 'The Whispers',
      optional: true,
      html:
        '<p>The Whispers are an optional component. A season played without them is a complete ' +
        'game.</p>' +
        '<p>The ' + Whispers.ALL.length + ' Whispers are shuffled face down ' +
        'at the start of each night. After the deal, and <strong>before any pledge is made</strong>, ' +
        'each eligible player may look at their own hand and then choose to <strong>take one ' +
        'Whisper</strong> or to go without.</p>' +
        '<p><strong>The monarch does not confide in whoever is winning.</strong> Only a player ' +
        'whose favour is <em>strictly less</em> than the highest at the table may take one. On ' +
        'the first night of a season the whole court is level on nothing, so nobody is offered a ' +
        'word at all.</p>' +
        '<p>Taking one <strong>costs nothing</strong>, but it is taken ' +
        '<strong>unread</strong>: a player decides on the strength of their hand alone, not on ' +
        'the word they are about to receive. Of the ' + Whispers.ALL.length + ' words, <strong>' +
        Whispers.ALL.filter((w) => w.burden).length + ' are burdens</strong> that cost rather ' +
        'than pay, so a word is a gamble taken by a player who needs one — which is the ' +
        'only sort of player who is offered it.</p>' +
        '<p>A Whisper alters how that player\u2019s favour is counted, or ' +
        'restricts which agents they may send out on errands, or both. Its <strong>contents are ' +
        'private</strong> and are revealed only when the night ends, alongside the errands. That ' +
        'a player took one is plain for the table to see; <em>which</em> one is not.</p>' +
        '<p>Not every word is a favour. ' + Whispers.ALL.filter((w) => w.burden).length +
        ' of the ' + Whispers.ALL.length + ' are <strong>burdens</strong>, which cost rather ' +
        'than pay. A burden is framed in oxblood under a broken seal and signed as a burden, so ' +
        'there is no mistaking one once it is in your hand — but every Whisper is identical ' +
        'face down, and a player who has drawn one is under no obligation to say so.</p>' +
        '<p>Where a Whisper restricts errands, the restriction is binding. If ' +
        'a player\u2019s hand makes the restriction <strong>impossible to obey</strong> \u2014 ' +
        'being required to send an Assassin while holding none, for instance \u2014 the demand is ' +
        '<strong>waived</strong> for that night and the player pledges freely.</p>' +
        '<p>No two players hold the same Whisper on the same night, and a ' +
        'Whisper never changes the rules of play in section {{rule-play}}.</p>' +
        '<p>Every Whisper in the deck is set out in section {{rule-whisperlist}}.</p>' +
        '<p class="rule-note">Because a burden is as likely as a favour, taking a word is a ' +
        'gamble rather than a formality: worth reaching for when a season is slipping away, and ' +
        'worth refusing when it is not. A rival who ' +
        'pledges strangely, or who ducks an audience they could plainly have won, is telling you ' +
        'something about the word they were given \u2014 and a rival who refused a free word is ' +
        'telling you their hand was already exactly what they wanted.</p>'
    },
    {
      id: 'rule-pledge',
      title: 'Making a pledge',
      html:
        '<p>Before any card is played, each player selects <strong>' +
        Rules.BID_CARDS + ' cards</strong> from their hand and places them face down in front of ' +
        'them. These are that player’s <strong>errands</strong>.</p>' +
        '<p>A player’s <strong>pledge</strong> is the sum of the errand ' +
        'values of the four cards sent, by kind. <strong>Rank is disregarded entirely</strong>: a ' +
        'Fool of ' + Cards.HIGHEST_VALUE + ' promises exactly as little as a Fool of 1.</p>' +
        '<p>Errands remain face down and <strong>out of play</strong> for the ' +
        'remainder of the night. ' + T + ' cards therefore remain in each hand, and <strong>' +
        T + ' audiences</strong> are contested.</p>' +
        '<p>A pledge is <strong>not capped</strong>. Four Assassins constitute ' +
        'a pledge of twelve, which exceeds the ' + T + ' audiences available and cannot be kept ' +
        'under any circumstances. Nothing in the rules forbids it.</p>' +
        '<p>All errands are revealed simultaneously when the night ends. ' +
        'Until then, no player knows another’s pledge, nor which cards have left another’s ' +
        'hand.</p>' +
        '<p class="rule-note">The cards that make your promise are the cards you no longer get to ' +
        'play. Promising a great deal costs you Assassins; promising nothing is cheap only if your ' +
        'Fools were worthless to begin with. This tension is the heart of the game.</p>'
    },
    {
      id: 'rule-play',
      title: 'Playing the night',
      html:
        '<p>The player to the steward’s left <strong>opens</strong> the ' +
        'first audience by playing any card from their hand, including one of the ruling kind.</p>' +
        '<p>Play continues clockwise. Each player in turn must <strong>answer ' +
        'in kind</strong> — that is, play a card of the same kind as the one that opened the ' +
        'audience — if they hold one. A player holding none may play any card at all.</p>' +
        '<p>The audience is won by the <strong>highest-ranked card of the kind ' +
        'that opened it</strong>, unless one or more cards of the <strong>ruling kind</strong> ' +
        '(section {{rule-sway}}) were played, in which case the highest-ranked of those wins instead.</p>' +
        '<p>A card of neither the opening kind nor the ruling kind can never ' +
        'win an audience, whatever its rank.</p>' +
        '<p>The winner of an audience opens the next. ' + T + ' audiences are ' +
        'played, exhausting every hand.</p>'
    },
    {
      id: 'rule-favour',
      title: 'Winning favour',
      html:
        '<p>At the end of the night each player compares the audiences they won against the ' +
        'pledge they made, and scores as follows.</p>' +
        '<table class="rule-table">' +
        '<tr><th class="left">Result</th><th class="left">Favour</th></tr>' +
        '<tr><td class="left">Pledge kept exactly</td><td class="left">2 for every audience won</td></tr>' +
        '<tr><td class="left">Pledge missed, high or low</td><td class="left">1 for every audience ' +
        'won, less 2 for every audience off the pledge</td></tr>' +
        '<tr><td class="left">Pledged nothing, won nothing</td><td class="left">8</td></tr>' +
        '<tr><td class="left">Pledged nothing, won audiences</td><td class="left">−8, however many</td></tr>' +
        '</table>' +
        '<p><strong>Examples.</strong></p>' +
        '<ul class="rule-examples">' +
        '<li>Pledged 4, won 4. The pledge is kept: <b>8 favour</b>.</li>' +
        '<li>Pledged 5, won 4. One short: 4 − 2 = <b>2 favour</b>.</li>' +
        '<li>Pledged 3, won 6. Three over: 6 − 6 = <b>0 favour</b>.</li>' +
        '<li>Pledged 2, won 0. Two short: 0 − 4 = <b>−4 favour</b>.</li>' +
        '<li>Pledged 0, won 0. The pledge is kept:<b>8 favour</b>.</li>' +
        '<li>Pledged 0, won 3. Broken, and the count does not matter: ' +
        '<b>−8 favour</b>.</li>' +
        '</ul>' +
        '<p class="rule-note">Because being wrong costs 2 favour per audience in <em>either</em> ' +
        'direction, there is no advantage in deliberately under-promising and overshooting. The ' +
        'only good outcome is the exact one.</p>'
    },
    {
      id: 'rule-sway',
      title: 'Who holds sway',
      html:
        '<p>One kind of agent may <strong>hold sway</strong> for a night, outranking every other ' +
        'kind when audiences are decided (rule {{rule-play}}). Sway is not chosen by any player. It is ' +
        'determined by how the <em>previous</em> night went.</p>' +
        '<p>The first night of a season is always played at <strong>No Sway</strong>, where no ' +
        'kind outranks any other. After that, sway passes according to how many of the four nobles ' +
        'kept their pledge <strong>exactly</strong> on the night before.</p>' +
        swayTable() +
        '<p class="rule-note">The ladder runs from the humblest agent to the most dangerous. When ' +
        'the whole court fails, the Fool rules it; when the whole court succeeds, nobody does. ' +
        'Because sway is public knowledge before pledges are made, every player knows which kind is ' +
        'dangerous while they are deciding what to promise.</p>'
    },
    {
      id: 'rule-season',
      title: 'Winning the season',
      html:
        '<p>A season is exactly <strong>' + Rules.SEASON_LENGTH +
        ' nights</strong> long. There is no target score and no early finish: the court sits ' +
        'twelve times and then rises.</p>' +
        '<p>The twelfth and final night is <strong>Twelfth Night</strong>, ' +
        'the feast of misrule. The stewardship will have passed three full times round the table ' +
        'by then, so every player deals exactly three nights.</p>' +
        '<p>The player with the most favour after Twelfth Night wins.</p>' +
        '<p>Should two or more players finish level on favour, the season is ' +
        'decided in favour of whichever of them, in order:</p>' +
        '<ol>' +
        '<li>won more favour on Twelfth Night;</li>' +
        '<li>made the higher pledge on Twelfth Night;</li>' +
        '<li>sent out the four errands of the higher combined rank on Twelfth Night.</li>' +
        '</ol>' +
        '<p class="rule-note">Because the end is fixed and known, the last two or three nights ' +
        'are played differently from the first: a player behind on favour must gamble, and a ' +
        'player ahead can afford to promise nothing and simply survive.</p>'
    },
    {
      id: 'rule-whisperlist',
      title: 'The Whispers in full',
      optional: true,
      html:
        '<p>All ' + Whispers.ALL.length + ' words the monarch may have for you, of which the ' +
        'last ' + Whispers.ALL.filter((w) => w.burden).length + ' are <strong>burdens</strong>. ' +
        'The rules governing them are in section {{rule-whispers}}.</p>' +
        whisperTable()
    }
  ];

  /**
   * The numbered sections, ready to drop into a document. Cross-references are
   * written as {{section-id}} and resolved here, so the sections can be
   * reordered without anyone having to chase the numbers through the prose.
   */
  function sections() {
    const numberOf = {};
    SECTIONS.forEach((section, index) => { numberOf[section.id] = index + 1; });

    return SECTIONS.map((section, index) => ({
      id: section.id,
      number: index + 1,
      title: section.title,
      optional: !!section.optional,
      html: section.html.replace(/\{\{([a-z-]+)\}\}/g, (whole, id) => numberOf[id] || whole)
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
