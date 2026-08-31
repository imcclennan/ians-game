# The Fool's Court

Four nobles compete for the monarch's ear. You play one seat; three rivals play the rest.
Runs in the browser with no build step, no dependencies and nothing stored anywhere.

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

Sixty cards, fifteen to a kind. Agents are ranked **1 to 15** by their standing at court — 15 is
the most influential, 1 the least — but **the four kinds do not share a ladder**. Each keeps to its
own stretch of the ranks and crowds it in its own way. The familiar pips are gone: each kind is
known by its own mark, printed on its own face, in its own ink.

| Agent | Mark | Audiences promised | Face | Ink |
| --- | --- | --- | --- | --- |
| Assassin | a dagger | 3 | pale slate | graphite |
| Lover | a rose | 2 | pale rose | crimson |
| Merchant | a balance | 1 | pale gold | antique gold |
| Fool | a cap and bells | −1 | pale lilac | plum |

| Agent | Ranks held |
| --- | --- |
| Assassin | one 11, two 12s, three 13s, four 14s, five 15s |
| Lover | a single 1, then a pair at every even rank to 14 |
| Merchant | 1 to 15, one of each |
| Fool | five 1s, four 2s, three 3s, two 4s, one 5 |

The Assassins sit at the top of the ladder and the Fools at the bottom; the Merchants alone run the
whole range. Cards of the same kind and rank are **identical in play** and carry only a count of how
many the deck holds, printed beside the rank. Because a rank can be struck as many as five times,
two agents can meet on the same rank — and then the audience goes to **whichever was played later**,
which settles about one audience in five.

A **Fool costs you a promise** rather than making none, so a set of errands can come to nothing at
all. Four Fools is a **true nil**; anything else adding up to nought or less is merely an arithmetic
nought, and the two are paid very differently.

A hand is fanned by what each kind promises — Assassins, then Lovers, Merchants and Fools, high to
low within each — with whichever kind holds sway pulled to the front of all of them, wearing gold.

The deck is **tarot sized, 70 × 120 mm** — on screen, at the table, and off the printer. The
Whisper cards match it, four to an A4 sheet.

The playing mat carries the court itself: the monarch on the throne, four nobles petitioning,
blades in the near shadow and fools at the foot of the steps. It is the same scene whoever holds
sway — only the wash of colour over it changes, which it does by luminosity blending, so the
picture takes the ruling kind's hue without being repainted.

Four faces rather than the usual two colours means every kind is legible from the corner alone,
which matters in a fanned hand of fifteen overlapping cards. The marks are drawn as inline SVG, so
there is still nothing to fetch. The table itself takes the colour and mark of whichever kind holds
sway, so the room tells you what is dangerous before you have looked at anything else.

Fifteen agents are dealt to each noble. The **steward** — the seat that deals — passes one place to
the left after every night. A season is **twelve nights**, the last of them **Twelfth Night**, and
whoever holds the most favour when it ends wins. There is no target score and no early finish: the
stewardship goes three full times round the table, so everyone deals exactly three nights.

### Making a pledge

Before the court sits, each noble sends **four agents** out of the room on secret errands. Which
*kinds* they send is their pledge: how many audiences they promise to win. Standing counts for
nothing here — a Fool of 15 promises exactly as little as a Fool of 1.

Nobody sees a pledge until the night ends, which keeps it secret *and* hides which agents left
the room. Those four are gone for the night, so **eleven audiences** remain to be won.

Four Assassins come to **twelve**, one more than the court has to give. Nothing stops you
promising it — but a promise of twelve is broken the moment it is made, and the best it can ever
pay is 9 against the 22 for promising eleven and delivering. Overreaching at court is punished, not
forbidden.

The bite is that the agents who make your promise are the ones you no longer get to send. Promising
much means spending Assassins; promising nothing is cheap only if your Fools were useless anyway.

### Winning audiences

* Whoever sits left of the steward opens the first audience; after that, whoever took the last
  audience opens the next.
* Any agent may be sent to open, including one of the ruling kind.
* Play goes clockwise. You **must** answer with an agent of the kind that was sent, if you hold
  one. If you hold none, send anyone at all.
* The most influential agent of the kind that was sent wins the audience — unless someone sent an
  agent of the **ruling kind**, in which case the highest of those takes it.

### Winning favour

| Result | Favour |
| --- | --- |
| Pledge kept exactly | **+1**, plus 2 per audience won |
| Pledge missed, high or low | the pledge itself, less 2 for every audience off it |
| Pledged nothing by sending four Fools, took nothing | **+8** |
| Pledged nothing any other way, took nothing | **+1** |
| Pledged nothing, took audiences | **−2** per audience |

Pledge 2, win 2 → 1 + 4 = **5**. Pledge 4, win 3 → 4 − 2 = **2**. Pledge 2, win 4 → 2 − 4 = **−2**.

Being wrong costs **2 favour per audience in either direction**, so there is nothing to be had by
under-promising on purpose. The only good outcome is the exact one.

A true nil is the biggest swing in the game — eight for keeping it, and two an audience against you
for breaking it — and it needs all four errands to be Fools. A set that merely adds up to nothing
pays **+1**, less than the smallest kept promise, so it is never worth sending on purpose.

### The Whispers — optional

After the deal and before any pledge, each noble may look at their own hand and then **choose** to
take a Whisper or go without. Taking one costs nothing, but it is taken **unread** — you decide on
the strength of your hand, not on the word you are about to get, and a Whisper can bind as readily
as it can pay.

*That* a noble took one is plain for the table to see. *Which* one is not, until the night ends. No
two nobles hold the same Whisper on the same night.

They are also an **optional part of the game**: the switch in the top bar turns them off entirely,
and a season without them is a complete game of its own.

Twenty-two of them: **fifteen boons** that pay, and **seven burdens** that cost. A burden is framed in oxblood under a broken seal, but every Whisper is identical face down, so one cannot be spotted in a rival’s hand.

| Whisper | The monarch’s word |
| --- | --- |
| **Blackmailed** | At least two Assassins must go out. Keep your pledge for **+6**. |
| **Sworn to Silence** | No Assassin may go out. Keep your pledge for **+4**. |
| **The Smitten** | No Lover may go out. Keep your pledge for **+5**. |
| **Sworn to the Ledger** | No Merchant may go out. Keep your pledge for **+5**. |
| **The Audited** | Send three Merchants and one Fool, which pledges exactly 2. Keep it for **+6**. |
| **The Debtor** | A kept pledge of 2 or fewer earns nothing; keep 3 or more for **+5**. |
| **All or Nothing** | Keep your pledge for **double favour**. Break it and the night is worth **−1** for every audience off it. |
| **The Bold** | **+4** if no noble pledges more than you. |
| **The Kingmaker** | Keep your pledge and take **+3** for every other noble who broke theirs. |
| **The Favourite** | **+6** if no noble wins more audiences than you. |
| **The Wallflower** | **+5** if no noble wins fewer audiences than you. |
| **Sworn to the Fool** | Your pledge is not scored. **+2** for every Fool in the audiences you win. |
| **The Twin** | **+2** for every pair of agents of the same kind and rank you take in one audience. |
| **The Modest** | **+3** for every audience you win with an agent of rank 5 or lower. |
| **The Understudy** | You are scored against the pledge of the noble on your right, not your own. Take **+2** for the trouble, and **+5** more if you match it. |

### The burdens

| Burden | The monarch’s word |
| --- | --- |
| **The Saboteur** | Your pledge is not scored. **+5**, less 3 for every other noble who keeps theirs. |
| **The Watched** | Your errands are laid face up as soon as they are sent. |
| **Marked for the Blade** | **−2** for every audience you win with an Assassin. |
| **Out of Favour** | **−2** unless no noble wins fewer audiences than you. |
| **The Optimist** | **−3** for every audience you take short of your pledge. |
| **The Beggar’s Bargain** | Favour you gain is halved unless you win an audience with a Fool in it. |
| **Called Out** | **−3** if you win more audiences than the noble on your right. |

**A demand is a request, not a rule.** Five Whispers ask something of your errands — two Assassins
sent, a whole kind held back, or an exact count of Merchants and Fools. You may always pledge exactly as you please and
ignore the word entirely. But a Whisper that was not heeded **pays nothing at all**: its rewards are
forfeit and you score the night as though you had gone without one. Agents the word asked you to
keep back are marked in crimson while you choose, so the choice is never made by accident.

Three of them set your own pledge aside altogether and score the night some other way. **Sworn to
the Fool** counts Fools inside the audiences you win, whoever played them. **The Saboteur** is paid
for the promises the *rest* of the table breaks, which makes its holder the one noble at court with
no reason to want a quiet evening. **The Understudy** keeps a pledge, but not its own — it is aiming
at a number nobody has shown it, which is why it pays a little whether or not it lands.

### Who holds sway

The opening night of a season is always **No Sway**. After that, sway passes according to how
many of the four nobles kept their pledge *exactly* in the night before:

| Nobles who kept their word | Sway next night |
| --- | --- |
| 0 | Fools |
| 1 | Merchants |
| 2 | Lovers |
| 3 | Assassins |
| 4 | No Sway |

### Winning the season

Twelve nights, then the court rises. Most favour wins. If two nobles finish level, the win goes to
whoever:

1. won more favour on Twelfth Night, failing which
2. made the bolder pledge on Twelfth Night, failing which
3. sent out the higher-ranked four agents on Twelfth Night.

Because the end is fixed and known, the last nights play differently from the first: a noble behind
has to gamble, and a noble ahead can promise nothing and simply survive.

## The code

Plain scripts, loaded in order, each attaching one object to `globalThis`. Nothing needs a bundler
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
| [`serve.js`](serve.js) | Optional local static server |
| [`test/selfplay.js`](test/selfplay.js) | Whole seasons played by four computer nobles, for measuring what assertions cannot see |

The three rivals share one brain with different nerve: **Verane the patient** plays it straight,
**Mors the reckless** pledges bold, **Ilka the careful** pledges shy. None of them look at hidden
cards — they pledge by valuing their own hand and play by tracking what has already been seen.

## The printed edition

`print/` holds print-ready sheets for playing this on a table. Open
[`print/index.html`](print/index.html) and print at 100% scale with margins set to none.

| Sheet | What it is |
| --- | --- |
| [`print/rules.html`](print/rules.html) | The full rules, two columns to an A4 sheet, with a masthead and a summary of play |
| [`print/whispers.html`](print/whispers.html) | All twenty-two Whispers at tarot size (70 × 120 mm), four to a sheet, plus a sheet of backs |
| [`print/reference.html`](print/reference.html) | A two-sided A6 reference card: making a pledge on one side, sway and favour on the other |

Everything is generated from the same rules files the game runs on, so the printed edition and the
app cannot disagree. The rules sheets measure themselves against a real A4 height and repack, so no
page loses its last paragraph off the bottom.

The design is one system across all three: cream stock and a gold double frame, the court's seal —
a coronet in a beaded ring — on anything the monarch is responsible for, a lozenge flourish
breaking each rule, and the four agent marks as a footer device. Card backs are plum with a woven
diagonal and a gold border.

Still to make: the sixty playing cards themselves. The printed sheets under
`print/fools-court-card-source/` still carry the flat 1–15 deck the game was first written around,
and have not been redrawn for the deck below.

## The deck

The four kinds do not share a ladder. Each holds fifteen cards, but over its own stretch of the
ranks and with its own crowding:

| Agent | Ranks held | Cards |
| --- | --- | ---: |
| **Assassins** | 11, **2×**12, **3×**13, **4×**14, **5×**15 | 15 |
| **Lovers** | 1, then **2×** every even rank to 14 | 15 |
| **Merchants** | 1–15, one of each | 15 |
| **Fools** | **5×**1, **4×**2, **3×**3, **2×**4, 5 | 15 |

Every Assassin outranks every Fool, and a Fool is worth **−1** on an errand, so the cheapest kind to
promise with is also the one that wins nothing. The Merchants are the only kind that can meet any
other on its own ground.

Because a rank can be struck as many as five times, two agents of the same kind can meet on the same
rank. **The audience then goes to whoever played it second** — the later word is the one the court
remembers. That settles about one audience in five, and it makes a card nothing can beat much
rarer: holding an Assassin 15 proves nothing while four more of them are unaccounted for. Cards of
one rank and kind are identical in play, and carry a row of pips beside the rank saying how many of
them the deck holds.

Under B the four kinds do not share a ladder. Each still holds fifteen cards, but over its own
stretch of the ranks and with its own crowding:

| Agent | Ranks held | Cards |
| --- | --- | ---: |
| **Assassins** | 11, **2×**12, **3×**13, **4×**14, **5×**15 | 15 |
| **Lovers** | 1, then **2×** every even rank to 14 | 15 |
| **Merchants** | 1–15, one of each | 15 |
| **Fools** | **5×**1, **4×**2, **3×**3, **2×**4, 5 | 15 |

Every Assassin outranks every Fool, and a Fool is worth −1 on an errand, so the cheapest kind to
promise with is also the one that wins nothing. The Merchants are the only kind that can meet any
other on its own ground.

The tie rule is what the crowding buys: it settles about one audience in five, and it makes a card
that nothing can beat much rarer — a noble leads holding a provable winner on 47% of audiences under
A, and 27% under B. Holding an Assassin 15 proves nothing while four more of them are unaccounted
for.

## Tests

```bash
npm test
```

Around 5,600 assertions: the deck's shape and its unique card names, the favour table row by row,
ties to the second card, the pledge clamp and the two kinds of nought, who takes an audience under
every sway, answering in kind, the sway ladder, the tie-breakers, all twenty-two Whispers in
isolation, the rulebook prose rendering with no unresolved cross-references, a full season played
with Whispers switched off, plus twenty complete seasons played end to end against invariants
(every night is eleven audiences and four different Whispers, every deal is sixty agents, every
pledge obeys the Whisper that was given, every favour follows pledge → counted → kept → base →
Whisper).

The run ends with a list of **known issues**: expectations that are correct but that the game does
not meet yet, recorded rather than asserted so a real regression cannot hide behind a red suite.
There is one — the rival nobles collectively aim at about 16 audiences of the 11 on offer, because
`estimateTricks` reads an honour as "do you hold the kind's top rank", which is nearly free on a
deck that strikes a rank up to five times.

Whole seasons are measured separately, which is where the interaction bugs live:

```bash
node test/selfplay.js 300
```

The computer nobles are checked for calibration too, and the Whispers are measured over whole
seasons rather than guessed at. Across 300 simulated seasons a word is worth **−0.50 favour a
night** against going without — but carries a standard deviation of **4.57** against **3.80**.
It is a bad bet in favour and a good one in variance, which is exactly what a noble who is
behind needs. Refusing every word wins **16.8%** of seasons against a fair share of 25%; taking
one whenever the monarch offers wins **28.0%**.

The two groups do not overlap: the weakest boon costs **−0.49** against the no-word baseline
and the mildest burden **−0.80**, so a gold frame means what it says.

The rival nobles ignore a demand on about **3%** of the nights they are given one — rarely worth
the forfeited reward, but not never.

A season is always twelve nights, which runs about twenty minutes.

## A note on adding your own Whisper

`js/whispers.js` is one declarative table. A Whisper may define any of `allows(card)`,
`permits(cards)`, `satisfiable(hand)`, `countedTricks(won)`, `aimFor(bid)`, `pledgeFor(estimate)`,
`pledgeCost(bid)` and `adjust(favour, row, table)` — the rival nobles read the same hooks, so a new
Whisper is played correctly by the computer without touching the AI.

## License

MIT
