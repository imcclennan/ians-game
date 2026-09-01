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
  // The politics of each kind's ladder. Lives in js/cards.js beside COPIES,
  // so the printed sheet sets the same words.
  const BACKGROUND = Cards.KIND_NOTE;

  const AGENT_ORDER = ['S', 'H', 'D', 'C'];

  /** An agent's mark and name, in that agent's ink. */
  function agent(suit) {
    if (suit === null) return '<b>No Sway</b>';
    return '<span class="agent agent-' + suit + '">' + Cards.emblem(suit) +
      ' <b>' + Cards.SUIT_ROLE_PLURAL[suit] + '</b></span>';
  }

  /** What a kind promises, with a proper minus sign where it costs one. */
  function promised(value) {
    return value < 0 ? '−' + Math.abs(value) : String(value);
  }

  function agentTable() {
    return '<table class="rule-table">' +
      '<tr><th class="left">Agent</th><th>Mark</th><th>Promises</th>' +
      '<th class="left">Printed on</th></tr>' +
      AGENT_ORDER.map((suit) => '<tr>' +
        '<td class="left"><span class="agent agent-' + suit + '"><b>' +
          Cards.SUIT_ROLE[suit] + '</b></span></td>' +
        '<td><span class="agent agent-' + suit + ' big">' + Cards.emblem(suit) + '</span></td>' +
        '<td>' + promised(Cards.BID_VALUE[suit]) + '</td>' +
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

  /** What each kind holds: its ranks, and how many of each. */
  function compositionTable() {
    const composition = (suit) => Cards.ranksOf(suit).map((rank) => {
      const copies = Cards.copiesOf(suit, rank);
      return copies === 1 ? rank : '<b>' + copies + '&times;' + rank + '</b>';
    }).join(', ');
    return '<table class="rule-table">' +
      '<tr><th class="left">Agent</th><th class="left">How the kind is arranged</th>' +
      '<th>Cards</th></tr>' +
      AGENT_ORDER.map((suit) => '<tr>' +
        '<td class="left"><span class="agent agent-' + suit + '"><b>' +
          Cards.SUIT_ROLE_PLURAL[suit] + '</b></span></td>' +
        '<td class="left">' + composition(suit) + '</td>' +
        '<td>' + BACKGROUND[suit] + '</td>' +
        '</tr>').join('') +
      '</table>';
  }

  /** What each result is worth. */
  function favourTable() {
    const rows = [
      ['Pledge kept exactly', Rules.FLAT_BONUS + ', plus 2 for every audience won'],
      ['Pledge missed, high or low',
        'the pledge itself, less 2 for every audience off it'],
      ['A Fool\u2019s errand kept \u2014 four Fools sent, no audience taken',
        String(Rules.FOOLS_ERRAND_PAY)],
      ['A hollow promise kept \u2014 nothing pledged, but only by adding up',
        String(Rules.FLAT_BONUS)],
      ['Pledged nothing, won audiences', '−2 for every audience won']
    ];
    return '<table class="rule-table">' +
      '<tr><th class="left">Result</th><th class="left">Favour</th></tr>' +
      rows.map(([result, favour]) => '<tr><td class="left">' + result +
        '</td><td class="left">' + favour + '</td></tr>').join('') +
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

  /**
   * The rules as they stand tonight. Built afresh on every call rather than
   * once at load, so the prose and the code cannot drift apart.
   */
  function buildSections() {
  const T = Rules.TRICKS_PER_HAND;
  const SECTIONS = [
    {
      id: 'rule-overview',
      title: 'Overview',
      html:
        '<p>The court is a busy, hostile place, and four nobles are competing for the ear of ' +
        'the monarch over a series of <strong>nights</strong>. At the start of each night every ' +
        'noble privately promises how many <strong>audiences</strong> they will win, then plays ' +
        'to reach that number exactly.</p>' +
        '<p>Favour is awarded for precision, not ambition. Winning more audiences than you ' +
        'promised costs you as surely as winning fewer, so the game is in judging a hand and ' +
        'then steering it to land on the number.</p>' +
        '<p>A season is <strong>' + Rules.SEASON_LENGTH + ' nights</strong> of court, the last ' +
        'of them <strong>Twelfth Night</strong>. Whoever holds the most favour when it ends has ' +
        'the monarch\u2019s ear for the year.</p>' +
        '<p class="rule-note">A hand is a <em>night</em>. A promise is a <em>pledge</em>. A ' +
        'trick is an <em>audience</em>. The trump suit is the <em>sway</em>. Points are ' +
        '<em>favour</em>. The dealer is the <em>steward</em>.</p>'
    },
    {
      id: 'rule-deck',
      title: 'The deck',
      html:
        '<p>The game uses a deck of <strong>60 cards</strong>: four kinds of agent, ' +
        '<strong>15 of each kind</strong>, ranked from <strong>1 to ' + Cards.HIGHEST_VALUE +
        '</strong>. Rank ' + Cards.HIGHEST_VALUE + ' is the most influential and rank 1 the least.</p>' +
        agentTable() +
        '<p>The four kinds <strong>do not share a ranking ladder</strong>. Each holds fifteen ' +
        'cards, but each has its own set of ranks: the ' +
        'Assassins sit at the top and the Fools at the bottom, the Merchants alone run ' +
        'the whole range, and the Lovers exist in pairs.</p>' +
        compositionTable() +
        '<p>Cards of the same kind and rank are <strong>identical in play</strong>. They ' +
        'carry no distinguishing mark beyond a count of how many the deck holds. The only difference '+
        'is that audiences are decided by the order they were played rather than on the ' +
        'cards themselves (section {{rule-play}}).</p>' +
        '<p>An agent’s <em>kind</em> determines what it is worth when sent out on an errand ' +
        '(section {{rule-pledge}}). An agent’s <em>rank</em> determines whether it wins an audience ' +
        '(section {{rule-play}}). The two are used at different times and never interact.</p>'
    },
    {
      id: 'rule-deal',
      title: 'Seating, the deal, and the course of a night',
      html:
        '<p>Play and the deal both proceed <strong>clockwise</strong>. One noble is the ' +
        '<strong>steward</strong> for the night; the stewardship passes one seat to the left ' +
        'after every night.</p>' +
        '<p>A night runs as follows.</p>' +
        '<ol class="rule-summary">' +
        '<li>The steward deals <strong>' + Rules.HAND_SIZE + ' cards</strong> to each of the ' +
        'four nobles.</li>' +
        '<li>Each noble sends <strong>' + Rules.BID_CARDS + ' agents</strong> out on errands, ' +
        'face down. Their kinds are that noble\u2019s pledge; ' +
        'their ranks are irrelevant (section {{rule-pledge}}).</li>' +
        '<li>The noble to the steward\u2019s left opens the first of <strong>' + T +
        ' audiences</strong>.</li>' +
        'Nobles answer in kind where they can. The highest of the opening kind takes the ' +
        'audience, unless the ruling kind was played, in which case the highest of those does ' +
        '(section {{rule-play}}).</li>' +
        '<li>If more than one card of the same kind and rank is played, the latest one takes ' +
        'precedence (section {{rule-play}}).</li>' +
        '<li>The winner of each audience opens the next, until every hand is empty.</li>' +
        '<li>Errands are revealed. Favour is scored on the exactness of each ' +
        'pledge (section {{rule-favour}}).</li>' +
        '<li>The number of pledges kept sets the sway for the next night ' +
        '(section {{rule-sway}}).</li>' +
        '<li>The stewardship passes one seat to the left, and a new night begins.</li>' +
        '</ol>' +
        '<p>After <strong>' + Rules.SEASON_LENGTH + ' nights</strong> the season ends and the ' +
        'noble with the most favour wins, as set out in section {{rule-season}}.</p>'
    },
    {
      id: 'rule-pledge',
      title: 'Making a pledge',
      html:
        '<p>Before any card is played, each noble selects <strong>' +
        Rules.BID_CARDS + ' cards</strong> from their hand and places them face down in front of ' +
        'them. These are that noble <strong>errands</strong>.</p>' +
        '<p>A noble’s <strong>pledge</strong> is the sum of the errand ' +
        'values of the four cards sent, by kind. <strong>Rank is disregarded entirely</strong>: a ' +
        'Fool of ' + Cards.ranksOf('C').slice(-1)[0] + ' counts for exactly what a Fool of 1 ' +
        'does, and the highest Assassin in the deck promises no more than the lowest.</p>' +
        (Cards.BID_VALUE.C < 0
          ? '<p>A <strong>Fool is worth −1</strong>: sending one out does not merely promise ' +
            'nothing, it takes a promise back. A set of errands that comes to <strong>nothing ' +
            'or less pledges nothing</strong>: there is no promising the court a negative ' +
            'number of audiences — but how it came to nothing matters when favour is counted.</p>' +
            '<p>A pledge of nothing made by sending <strong>all four errands as Fools</strong> ' +
            'is a <strong>Fool\u2019s errand</strong>. A set that merely ' +
            'happens to add up to nought or below — two Fools and two Merchants, say — pledges ' +
            'nothing just the same, but is only a <strong>hollow promise</strong> ' +
            '(section {{rule-favour}}).</p>'
          : '') +
        '<p>Errands remain face down and <strong>out of play</strong> for the ' +
        'remainder of the night. ' + T + ' cards therefore remain in each hand, and <strong>' +
        T + ' audiences</strong> are contested.</p>' +
        '<p>All errands are revealed simultaneously when the night ends. ' +
        'Until then, no noble knows another’s pledge, nor which cards have left another’s ' +
        'hand.</p>' +
        '<p class="rule-note">The cards that make your promise are the cards you no longer get to ' +
        'play. Promising a great deal costs you Assassins; promising nothing is cheap only if your ' +
        'Fools were worthless to begin with.</p>'
    },
    {
      id: 'rule-play',
      title: 'Playing the night',
      html:
        '<p>The noble to the steward’s left <strong>opens</strong> the ' +
        'first audience by playing any card from their hand, including one of the ruling kind.</p>' +
        '<p>Play continues clockwise. Each noble in turn must <strong>answer ' +
        'in kind</strong> — that is, play a card of the same kind as the one that opened the ' +
        'audience — if they hold one. A noble holding none may play any card at all.</p>' +
        '<p>The audience is won by the <strong>highest-ranked card of the kind ' +
        'that opened it</strong>, unless one or more cards of the <strong>ruling kind</strong> ' +
        '(section {{rule-sway}}) were played, in which case the highest-ranked of those wins instead.</p>' +
        '<p>A card of neither the opening kind nor the ruling kind can never ' +
        'win an audience, whatever its rank.</p>' +
        '<p><strong>Equal ranks.</strong> Because the deck contains some ranks more than ' +
        'once (section {{rule-deck}}), two agents of the same kind can meet on the same ' +
        'rank. The audience then goes to <strong>whichever of them was played ' +
        'last</strong>. The later word is the one the court remembers.</p>' +
        '<p class="rule-note">A card that could not be beaten can still be matched, and ' +
        'a noble sitting after you needs only to equal it. Where a rank is struck ' +
        Cards.MOST_COPIES + ' times, holding one of them proves very little for a noble.</p>' +
        '<p>The winner of an audience opens the next until all ' + T + ' audiences are ' +
        'played.</p>'
    },
    {
      id: 'rule-favour',
      title: 'Winning favour',
      html:
        '<p>At the end of the night each noble compares the audiences they won against the ' +
        'pledge they made, and scores as follows.</p>' +
        favourTable() +
        '<p><strong>Examples.</strong></p>' +
        '<ul class="rule-examples">' +
        '<li>Pledged 2, won 2. The pledge is kept: 1 + 4 = <b>5 favour</b>.</li>' +
        '<li>Pledged 1, won 1. Kept: 1 + 2 = <b>3 favour</b>.</li>' +
        '<li>Pledged 4, won 3. One short: 4 − 2 = <b>2 favour</b>.</li>' +
        '<li>Pledged 2, won 4. Two over: 2 − 4 = <b>−2 favour</b>.</li>' +
        '<li>Sent four Fools, won nothing. A <strong>Fool\u2019s errand</strong> kept: <b>8 favour</b>.</li>' +
        '<li>Sent four Fools, won 2. The <strong>Fool\u2019s errand</strong> is broken: <b>−4 favour</b>.</li>' +
        '<li>Sent errands adding up to nothing some other way, won nothing. Nothing ' +
        'promised and nothing taken, but only a <strong>hollow promise</strong>: <b>1 favour</b>.</li>' +
        '</ul>' +
        '<p class="rule-note">Being wrong costs 2 favour per audience in <em>either</em> ' +
        'direction, so there is no advantage in deliberately under-promising and ' +
        'overshooting. The only good outcome is the exact one. Note too that a Fool\u2019s ' +
        'errand is worth sending only when it can be made honestly: four Fools pays eight, ' +
        'while a hollow promise pays less than the smallest kept promise.</p>'
    },
    {
      id: 'rule-sway',
      title: 'Who holds sway',
      html:
        '<p>One kind of agent may <strong>hold sway</strong> for a night, outranking every other ' +
        'kind when audiences are decided (rule {{rule-play}}). Sway is not chosen by any noble. It is ' +
        'determined by how the <em>previous</em> night went.</p>' +
        '<p>The first night of a season is always played at <strong>No Sway</strong>, where no ' +
        'kind outranks any other. After that, sway passes according to how many of the four nobles ' +
        'kept their pledge <strong>exactly</strong> on the night before.</p>' +
        swayTable() +
        '<p class="rule-note">The ladder runs from the humblest agent to the most dangerous. When ' +
        'the whole court fails, the Fool rules it; when the whole court succeeds, nobody does. ' +
        'Because sway is public knowledge before pledges are made, every noble knows which kind is ' +
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
        'by then, so every noble will have been steward exactly three nights.</p>' +
        '<p>The noble with the most favour after Twelfth Night wins.</p>' +
        '<p>Should two or more nobles finish level on favour, the season is ' +
        'decided in favour of whichever of them, in order:</p>' +
        '<ol>' +
        '<li>won more favour on Twelfth Night;</li>' +
        '<li>made the higher pledge on Twelfth Night;</li>' +
        '<li>sent out the four errands of the higher combined rank on Twelfth Night.</li>' +
        '</ol>' +
        '<p class="rule-note">Because the end is fixed and known, the last two or three nights ' +
        'are played differently from the first: a noble behind on favour must gamble, and a ' +
        'noble ahead can afford to promise nothing and simply survive.</p>'
    },
    {
      id: 'rule-whispers',
      title: 'The Whispers',
      optional: true,
      html:
        '<p>The Whispers are an optional component. A season played without them is a complete ' +
        'game.</p>' +
        '<p>A Whisper is whatever reaches you before the night begins — from the throne, from ' +
        'the treasury, from someone who has no business being at court at all. Each card is ' +
        '<strong>signed by whoever sent it</strong>.</p>' +
        '<p>The ' + Whispers.ALL.length + ' Whispers are shuffled face down ' +
        'at the start of each night. After the deal, and <strong>before any pledge is made</strong>, ' +
        'each eligible noble may look at their own hand and then choose to <strong>take one ' +
        'Whisper</strong> or to go without.</p>' +
        '<p><strong>The court does not confide in whoever is winning.</strong> Only a noble ' +
        'whose favour is <em>strictly less</em> than the highest at the table may take one. On ' +
        'the first night of a season the whole court is level, so nobody is offered a ' +
        'word at all.</p>' +
        '<p>Taking one <strong>costs nothing</strong>, but it is taken ' +
        '<strong>unread</strong>: a noble decides on the strength of their hand alone, not on ' +
        'the word they are about to receive.</p>' +
        '<p>Some words count <strong>the agent that took the audience for you</strong> — the ' +
        'one that beat the rest. Others count <strong>every agent in an audience you took</strong>, ' +
        'whoever played it. The card says which.</p>' +
        '<p>A Whisper alters how that noble\u2019s favour is counted, or ' +
        'restricts which agents they may send out on errands, or both. Its <strong>contents are ' +
        'private</strong> and are revealed only when the night ends, alongside the errands. That ' +
        'a noble took one is plain for the table to see; <em>which</em> one is not — unless the ' +
        'word itself says otherwise.</p>' +
        '<p>Not every word is a favour. ' + Whispers.ALL.filter((w) => w.burden).length +
        ' of the ' + Whispers.ALL.length + ' are <strong>burdens</strong>, which cost rather ' +
        'than pay. A burden is framed in oxblood under a broken seal and signed as a burden, so ' +
        'there is no mistaking one once it is in your hand — but every Whisper is identical ' +
        'face down, and a noble who has drawn one is under no obligation to say so.</p>' +
        '<p>Where a Whisper asks something of the errands, the demand is ' +
        '<strong>never binding</strong>. A noble may always pledge exactly as they please. But ' +
        'a Whisper that was not heeded <strong>pays nothing at all</strong>: its rewards are ' +
        'forfeit, and the noble scores the night as though they had gone without a word.</p>' +
        '<p>Every Whisper in the deck is set out in section {{rule-whisperlist}}.</p>' +
        '<p class="rule-note">Because burden are mixed in with favours, taking a word is a ' +
        'gamble rather than a formality: worth reaching for when a season is slipping away, and ' +
        'worth refusing when it is not. A rival who ' +
        'pledges strangely, or who ducks an audience they could plainly have won, is telling you ' +
        'something about the word they were given \u2014 and a rival who refused a free word is ' +
        'telling you their hand was already exactly what they wanted.</p>'
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
  return SECTIONS;
  }

  /**
   * The numbered sections, ready to drop into a document. Cross-references are
   * written as {{section-id}} and resolved here, so the sections can be
   * reordered without anyone having to chase the numbers through the prose.
   */
  function sections() {
    const SECTIONS = buildSections();
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
    compositionTable: compositionTable,
    favourTable: favourTable,
    INK: INK,
    FACE: FACE,
    MARK: MARK,
    AGENT_ORDER: AGENT_ORDER
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
