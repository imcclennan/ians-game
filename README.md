# The Fool's Court

A trick-taking game of promises kept and broken, for four players. You take one seat; three rival
nobles play the rest. Runs in the browser with no build step, no dependencies and nothing stored
anywhere.

> When every noble breaks their word, the Fool rules the court.
> When all four keep it, no one holds sway at all.

## Playing it

Open `index.html` in a browser. That's it. The full rules are in the app itself, behind
**Rules** in the top bar.

If your browser is strict about `file://` pages, serve it instead:

```bash
npm start
```

Then visit <http://localhost:8080>.

## The court

Four nobles compete for the ear of the monarch over a series of **nights**. At the start of each
night every noble privately promises how many **audiences** they will win, then plays to reach that
number exactly.

Favour is awarded for precision, not ambition. Winning more audiences than you promised costs you
as surely as winning fewer, so the game is in judging a hand and then steering it to land on the
number.

A season is **twelve nights** of court, the last of them **Twelfth Night**. Whoever holds the most
favour when it ends has the monarch's ear for the year.

| The game says | Where a card player would say |
| --- | --- |
| a **night** | a hand |
| a **pledge** | a bid |
| an **audience** | a trick |
| the **sway** | the trump suit |
| **favour** | points |
| the **steward** | the dealer |

### How a night runs

1. The steward deals **15 cards** to each of the four nobles.
2. If Whispers are in use, each eligible noble may take one, unread.
3. Each noble sends **four agents** out on errands, face down. Their kinds are that noble's pledge.
4. The noble to the steward's left opens the first of **eleven audiences**.
5. The winner of each audience opens the next.
6. Errands are revealed and favour is scored on the exactness of each pledge.
7. The number of pledges kept sets the sway for the next night.
8. The stewardship passes one seat to the left, and a new night begins.

## The deck

Sixty cards: four kinds of **agent**, fifteen of each, ranked 1 to 15. The familiar pips are gone —
each kind is known by its own mark, printed on its own face, in its own ink.

| Agent | Mark | Promises | Printed on |
| --- | --- | ---: | --- |
| **Assassin** | a dagger | 3 | pale slate, in graphite |
| **Lover** | crossed hearts | 2 | pale rose, in crimson |
| **Merchant** | a balance | 1 | pale gold, in antique gold |
| **Fool** | a cap and bells | −1 | pale lilac, in plum |

**The four kinds do not share a ranking ladder.** Each holds fifteen cards, but each has its own
set of ranks, and its own crowding:

| Agent | How the kind is arranged | Why |
| --- | --- | --- |
| **Assassins** | 11, 2×12, 3×13, 4×14, 5×15 | The trade admits nobody without a name already made. Above that, standing is reputation, and reputation is shared. |
| **Lovers** | 1, then 2× every even rank to 14 | They arrive in pairs. Only one comes to court unattached, and stands at the bottom alone. |
| **Merchants** | 1 to 15, one of each | The ledger settles it. Nobody shares a rung, and each knows to the penny who stands above them. |
| **Fools** | 5×1, 4×2, 3×3, 2×4, 5 | Anyone may call themselves a fool, so the low rungs are packed and the ladder is short. At the top there is one. |

Rank only ever decides an audience **inside** a kind, so an Assassin's 11 and a Fool's 1 are each
simply the lowest card of their own kind. Cards of the same kind and rank are **identical in play**
and carry only a count of how many the deck holds, printed beside the rank.

An agent's **kind** is what it promises on an errand. An agent's **rank** is whether it wins an
audience. The two are used at different times and never interact.

## Making a pledge

Before any card is played, each noble picks **four cards** from their hand and lays them face down.
These are their **errands**.

Your **pledge** is the sum of what those four promise, by kind. **Rank is disregarded entirely** — a
Fool of 5 counts for exactly what a Fool of 1 does, and the highest Assassin in the deck promises no
more than the lowest.

A Fool is worth **−1**: sending one out does not merely promise nothing, it takes a promise back. A
set of errands coming to nothing or less pledges **nothing** — there is no promising the court a
negative number of audiences — but *how* it came to nothing decides what it pays:

- All four errands sent as Fools is a **Fool's errand**.
- Any other set that happens to add up to nought or below is a **hollow promise**.

Errands stay face down and **out of play** for the night. Eleven cards therefore remain in each
hand, and **eleven audiences** are contested. All errands are revealed together when the night ends.

A pledge is **not capped**. Four Assassins come to twelve, which exceeds the eleven audiences
available and cannot be kept. Nothing forbids it.

> The cards that make your promise are the cards you no longer get to play. Promising a great deal
> costs you Assassins; promising nothing is cheap only if your Fools were worthless to begin with.

## Winning audiences

- The noble to the steward's left opens, playing any card.
- Play goes clockwise. You **must answer in kind** if you hold one. Holding none, play anything.
- The **highest of the opening kind** takes the audience — unless a card of the **ruling kind** was
  played, in which case the highest of those does.
- A card of neither kind can never win, whatever its rank.
- **Equal ranks:** two agents of the same kind can meet on the same rank. The audience goes to
  **whichever was played last** — the later word is the one the court remembers.
- The winner opens the next audience.

The tie rule settles about **one audience in five**. It also means a card that cannot be beaten can
still be *matched*: where a rank is struck five times, holding one of them proves very little.

## Winning favour

| Result | Favour |
| --- | --- |
| Pledge kept exactly | **+1**, plus 2 for every audience won |
| Pledge missed, high or low | the pledge itself, less 2 for every audience off it |
| A **Fool's errand** kept — four Fools sent, no audience taken | **+8** |
| A **hollow promise** kept — nothing pledged, but only by adding up | **+1** |
| Pledged nothing, won audiences | **−2** for every audience won |

Pledged 2, won 2 → 1 + 4 = **5**. Pledged 4, won 3 → 4 − 2 = **2**. Pledged 2, won 4 → 2 − 4 =
**−2**. Four Fools out, won nothing → **8**. Four Fools out, won 2 → **−4**.

Being wrong costs **2 favour per audience in either direction**, so there is nothing to be had by
under-promising and overshooting. The only good outcome is the exact one.

A **Fool's errand** is the biggest swing in the game — eight for keeping it, two an audience against
you for breaking it — and it needs all four errands to be Fools. A **hollow promise** pays **+1**,
less than the smallest kept promise, so it is never worth sending on purpose.

## Who holds sway

One kind may **hold sway** for a night, outranking every other kind when audiences are decided. No
noble chooses it: it follows from how the *previous* night went. The first night of a season is
always **No Sway**.

| Nobles who kept their pledge | Sway next night |
| --- | --- |
| 0 | Fools |
| 1 | Merchants |
| 2 | Lovers |
| 3 | Assassins |
| 4 | No Sway |

The ladder runs from the humblest agent to the most dangerous. When the whole court fails, the Fool
rules it; when the whole court succeeds, nobody does. Sway is public before pledges are made, so
every noble knows which kind is dangerous while deciding what to promise.

## Winning the season

A season is exactly **twelve nights**. There is no target score and no early finish: the court sits
twelve times and then rises. The twelfth is **Twelfth Night**, the feast of misrule — the
stewardship will have passed three full times round the table by then.

Level totals break on Twelfth Night, in order: more favour that night, then the higher pledge, then
the higher combined rank of the four errands.

> Because the end is fixed and known, the last two or three nights are played differently from the
> first: a noble behind on favour must gamble, and a noble ahead can afford to promise nothing and
> simply survive.

## The Whispers — optional

A season played without them is a complete game.

A Whisper is **whatever reaches you before the night begins** — from the throne, from the treasury,
from someone who has no business being at court at all. Each card is **signed by whoever sent it**.

The twenty-two Whispers are shuffled face down each night. After the deal and **before any pledge**,
each eligible noble may look at their own hand and choose to take one or go without.

**The court does not confide in whoever is winning.** Only a noble whose favour is *strictly less*
than the highest at the table may take one. On the first night everyone is level, so nobody is
offered a word at all.

Taking one **costs nothing**, but it is taken **unread** — you decide on the strength of your hand,
not on the word you are about to get. Its contents stay **private** until the night ends. *That* a
noble took one is plain to see; *which* one is not, unless the word itself says otherwise.

The deck counts agents in two different ways, and the card always says which:

- some words count **the agent that took the audience for you** — the one that beat the rest;
- others count **every agent in an audience you took**, whoever played it.

**A demand is a request, not a rule.** Five Whispers ask something of your errands. You may always
pledge exactly as you please — but a Whisper that was not heeded **pays nothing at all**, and you
score the night as though you had gone without one. A demand your hand cannot meet is waived.

### The words

| Whisper | What it does | Signed |
| --- | --- | --- |
| **Blackmailed** | At least two Assassins must go out. Keep your pledge for **+6**. | A hand you do not know |
| **Sworn to Silence** | No Assassin may go out. Keep your pledge for **+4**. | The Chapel |
| **The Smitten** | No Lover may go out. Keep your pledge for **+5**. | A Lover |
| **Sworn to the Ledger** | No Merchant may go out. Keep your pledge for **+5**. | The Treasury |
| **The Audited** | Send three Merchants and one Fool, which pledges exactly 2. Keep it for **+6**. | The Treasury |
| **The Debtor** | A kept pledge of 2 or fewer earns nothing; keep 3 or more for **+5**. | The Treasury |
| **All or Nothing** | Keep your pledge for **double favour**. Break it and the night is worth **−1** for every audience off it. | The Court |
| **The Bold** | **+4** if no noble pledges more than you. | The Monarch |
| **Never in Doubt** | Keep your pledge and take **+3** for every other noble who broke theirs. | The Court |
| **The Favourite** | **+6** if no noble wins more audiences than you. | The Monarch |
| **The Wallflower** | **+5** if no noble wins fewer audiences than you. | A Friend at Court |
| **Sworn to the Fool** | Your pledge is not scored. **+2** for every Fool in the audiences you win. | The Fool |
| **The Twin** | **+2** for every pair of agents of the same kind and rank you take in one audience. | The Monarch |
| **The Modest** | **+3** for every audience you win with an agent of rank 5 or lower. | The Monarch |
| **The Understudy** | You are scored against the pledge of the noble on your right, not your own. Take **+2** for the trouble, and **+5** more if you match it. | The Court |

### The burdens

Seven of the twenty-two **cost** rather than pay. A burden is framed in oxblood under a broken seal
and signed as one, so there is no mistaking it once it is in your hand — but every Whisper is
identical face down, and a noble who has drawn one is under no obligation to say so.

| Burden | What it does | Signed |
| --- | --- | --- |
| **In Another's Pay** | Your pledge is not scored. **+5**, less 3 for every other noble who keeps theirs. | A hand you do not know |
| **The Watched** | Your errands are laid face up as soon as they are sent. | The Chancery |
| **Marked for the Blade** | **−2** for every audience an Assassin takes for you. | One who kills for a living |
| **Out of Favour** | **−2** unless no noble wins fewer audiences than you. | The Monarch |
| **More Was Expected** | **−3** for every audience you take short of your pledge. | The Court |
| **The Beggar's Bargain** | Favour you gain is halved unless you win an audience with a Fool in it. | A beggar on the steps |
| **Called Out** | **−3** if you win more audiences than the noble on your right. | A rival noble |

Three of them set your own pledge aside altogether and score the night some other way. **Sworn to
the Fool** counts Fools inside the audiences you win, whoever played them. **In Another's Pay** is
paid for the promises the *rest* of the table breaks, which makes its holder the one noble with no
reason to want a quiet evening. **The Understudy** keeps a pledge, but not its own — it is aiming at
a number nobody has shown it, which is why it pays a little whether or not it lands.

> Because burdens are mixed in with favours, taking a word is a gamble rather than a formality. A
> rival who pledges strangely, or who ducks an audience they could plainly have won, is telling you
> something about the word they were given — and a rival who refused a free word is telling you
> their hand was already exactly what they wanted.

## The code

Plain scripts, loaded in order, each attaching one object to `globalThis`. Nothing needs a bundler,
and the logic files also load under Node, which is how the tests run.

| File | What is in it |
| --- | --- |
| [`js/cards.js`](js/cards.js) | The sixty-card deck, the four agents, shuffling and sorting |
| [`js/rules.js`](js/rules.js) | Pure rules: legal plays, who takes the audience, favour, the sway ladder |
| [`js/whispers.js`](js/whispers.js) | The twenty-two Whispers, declared in one table |
| [`js/rulebook.js`](js/rulebook.js) | The rules in prose, rendered by both the app and the printed edition |
| [`js/whispercard.js`](js/whispercard.js) | The face of a Whisper card, shared by the table and the printer |
| [`js/ai.js`](js/ai.js) | Valuing a hand, choosing which agents to send out, playing them |
| [`js/engine.js`](js/engine.js) | The state of the court and the transitions between phases |
| [`js/ui.js`](js/ui.js) | Rendering and input |
| [`js/art.js`](js/art.js) | Vector art for the card deck, in tenths of a millimetre |
| [`js/rulesheet.js`](js/rulesheet.js) | The rules laid out as boxed-game inserts |
| [`js/check-numbering.js`](js/check-numbering.js) | Checks the printed sheets and the app agree section for section |
| [`serve.js`](serve.js) | Optional local static server |
| [`test/selfplay.js`](test/selfplay.js) | Whole seasons played by four computer nobles, for measuring what assertions cannot see |

The three rivals share one brain with different nerve: **Verane the patient** plays it straight,
**Mors the reckless** pledges bold, **Ilka the careful** pledges shy. None of them look at hidden
cards — they pledge by valuing their own hand and play by tracking what has already been seen.

## The printed edition

`print/` holds print-ready sheets for playing this at a table. Open
[`print/index.html`](print/index.html) and print at 100% scale with margins set to none.

| Sheet | What it is |
| --- | --- |
| [`print/rules.html`](print/rules.html) | The full rules, with a masthead and a summary of play |
| [`print/whispers.html`](print/whispers.html) | All twenty-two Whispers at tarot size (70 × 120 mm), four to a sheet, plus a sheet of backs |
| [`print/reference.html`](print/reference.html) | A two-sided A6 reference card: making a pledge on one side, sway and favour on the other |

Everything is generated from the same rules files the game runs on, so the printed edition and the
app cannot disagree. The wording lives in [`print/rules.md`](print/rules.md) and
[`print/whispers.md`](print/whispers.md); the layout is [`js/rulesheet.js`](js/rulesheet.js).
Cross-references are checked both ways by [`js/check-numbering.js`](js/check-numbering.js), so a
player reading the sheet and a player reading the app are never sent to different sections.

Rendered card images live under `print/printing files/` — sixty agent faces and a back, twenty-two
Whisper faces and a back, and both reference sides, sized for a print house at 3″ × 5″ with bleed.

The design is one system throughout: cream stock and a gold double frame, the court's seal — a
coronet in a beaded ring — a lozenge flourish breaking each rule, and the four agent marks as a
footer device. Card backs are plum with a woven diagonal and a gold border, and read
**A word from the court** — because most of the deck is not the monarch speaking.

## Tests

```bash
npm test
```

**5,736 assertions**: the deck's shape and its unique card names, the favour table row by row, ties
to the last card played, the pledge clamp, the Fool's errand against the hollow promise, who takes
an audience under every sway, answering in kind, the sway ladder, the tie-breakers, all twenty-two
Whispers in isolation, the rulebook prose rendering with no unresolved cross-references, a full
season played with Whispers switched off, plus twenty complete seasons played end to end against
invariants (every night is eleven audiences and four different Whispers, every deal is sixty agents,
every pledge obeys the Whisper that was given, every favour follows pledge → counted → kept → base →
Whisper).

The suite also compares `js/whispers.js` against its print transcription in
`print/fools-court-card-source/whispers-data.js`, card for card, on name, signature, rule line,
flavour and burden frame. A stale transcription is twenty-two wrong cards at the printer, which is
not something a person should be relied on to catch.

The run ends with a list of **known issues**: expectations that are correct but that the game does
not meet yet, recorded rather than asserted so a real regression cannot hide behind a red suite.
There are none at present.

Whole seasons are measured separately, which is where the interaction bugs live:

```bash
node test/selfplay.js 300
```

Over 300 simulated seasons the nobles keep their pledge exactly **38.5%** of the time and pledge
**2.74** on average, against a fair share of 2.75. The tie rule settles **19.5%** of audiences.
Sway lands on Fools, Merchants, Lovers, Assassins and nobody in a **13 / 33 / 32 / 12 / 10** split.
A season's winner finishes on **50.0** favour against the last noble's **22.5**, with a final margin
of **8.09**.

Nobles take **86.6%** of the words offered them. A word is worth **+0.65 favour a night** against
the field, and carries a standard deviation of **4.78** against **3.63** — a modest edge in favour
and a large one in variance, which is what a noble who is behind actually needs. They ignore a
demand on about **5.5%** of the nights they are given one.

A season is always twelve nights, which runs about twenty minutes.

## A note on adding your own Whisper

`js/whispers.js` is one declarative table. A Whisper may define any of `allows(card)`,
`permits(cards, hand)`, `satisfiable(hand)`, `countedTricks(won)`, `keptTest(row, table)`,
`aimFor(bid)`, `pledgeFor(estimate)`, `pledgeCost(bid)` and `adjust(favour, row, table)` — the rival
nobles read the same hooks, so a new Whisper is played correctly by the computer without touching
the AI.

A card carries a name, one rule line, its fiction and a signature. Every clarification belongs in
the rulebook's Whispers section, which the printed sheet reproduces in full — so a player at the
table has the terse card, and a player settling an argument has the sheet.

## License

MIT
