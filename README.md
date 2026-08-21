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

Sixty cards. Four kinds of **agent**, each ranked **1 to 15** by their standing at court — 15 is
the most influential, 1 the least. The familiar pips are gone: each kind is known by its own mark,
printed on its own face, in its own ink.

| Agent | Mark | Audiences promised | Face | Ink |
| --- | --- | --- | --- | --- |
| Assassin | a dagger | 3 | pale slate | graphite |
| Lover | a rose | 2 | pale rose | crimson |
| Merchant | a balance | 1 | pale gold | antique gold |
| Fool | a cap and bells | 0 | pale lilac | plum |

A hand is fanned by what each kind promises — Assassins, then Lovers, Merchants and Fools, high to
low within each — with whichever kind holds sway pulled to the front of all of them, wearing gold.

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

Nobody sees a pledge until the session ends, which keeps it secret *and* hides which agents left
the room. Those four are gone for the session, so **eleven audiences** remain to be won.

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
| Pledge kept exactly | 2 per audience won |
| Pledge broken | 1 per audience won, less 2 for every audience off the pledge |
| Pledged nothing, took nothing | **+8** |
| Pledged nothing, took audiences | **−8**, however many |

Pledge 5, win 4 → 4 − 2 = **2**. Pledge 3, win 6 → 6 − 6 = **0**. Pledge 0, win 3 → **−8**.

Promising the court nothing is the biggest swing in the game — sixteen favour between keeping it
and breaking it — and it needs four Fools to reach.

### The Whispers — optional

After the deal and before any pledge, each noble may look at their own hand and then **choose** to
take a Whisper or go without. Taking one costs nothing, but it is taken **unread** — you decide on
the strength of your hand, not on the word you are about to get, and a Whisper can bind as readily
as it can pay.

*That* a noble took one is plain for the table to see. *Which* one is not, until the night ends. No
two nobles hold the same Whisper on the same night.

They are also an **optional part of the game**: the switch in the top bar turns them off entirely,
and a season without them is a complete game of its own.

Twenty of them, and **five are burdens** that cost rather than pay. A burden is framed in oxblood
under a broken seal, but every Whisper is identical face down, so one cannot be spotted in a
rival's hand.

| Whisper | The monarch's word |
| --- | --- |
| **Blackmailed** | At least one Assassin must go out. Keep your pledge for **+5**. |
| **Sworn to Silence** | No Assassin may go out. Keep your pledge for **+3**. |
| **The Smitten** | No Lover may go out. Keep your pledge for **+3**. |
| **The Audited** | Send **two Merchants and two Fools**, which pledges exactly 2. Keep it for **+4**. |
| **The Debtor** | A kept pledge of 2 or fewer earns nothing; keep 3 or more for **+3**. |
| **All or Nothing** | Keep your pledge for **double favour**. Break it and lose **3**, whatever else you did. |
| **The Cautious Clerk** | You cannot lose favour this session, nor gain more than **6**. |
| **The Bold** | **+5** if your pledge is the highest at the table, outright. |
| **The Meek** | **−4** if your pledge is the lowest or tied for lowest. Keep it for **+4**. |
| **The Kingmaker** | Keep your pledge and take **+2** for every other noble who broke theirs. |
| **The Favourite** | **+6** if you win more audiences than any other noble, outright. |
| **The Wallflower** | **+6** if you win fewer audiences than any other noble, outright. |
| **Sworn to the Fool** | **+3** favour for every audience you take with a Fool. |
| **The Contrarian** | Your pledge counts the audiences you will **not** win. Keep it for **+2**. |
| **The Understudy** | You are scored against the pledge of the noble **on your left**. **+3** for the trouble, **+5** more if you match it. |
| ⚠ **The Condemned** | Break your pledge and lose a further **4**. |
| ⚠ **The Scapegoat** | **−2** for every other noble who keeps their pledge. |
| ⚠ **In Disgrace** | Favour you gain tonight is halved. Favour you lose is not. |
| ⚠ **The Watched** | Your errands are laid **face up** as soon as they are sent. |
| ⚠ **Marked for the Blade** | **−2** for every audience you take with an Assassin. |

A demand that cannot be met is waived rather than enforced — a noble holding no Assassin cannot be
made to send one. Across simulated play that happens in about **0.7%** of player nights.

Two of them are worth understanding before you meet them. **The Contrarian** scores exactly as a
noble who had openly promised the complement, so the inversion itself is free; what it really buys
is a table that sees a bold pledge of eight where the real promise was three. **The Understudy** is
aiming at a number nobody has shown them, which is why it pays whether or not it lands.

### Who holds sway

The opening session of a season is always **No Sway**. After that, sway passes according to how
many of the four nobles kept their pledge *exactly* in the session before:

| Nobles who kept their word | Sway next session |
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
| [`js/whispers.js`](js/whispers.js) | The fifteen Whispers, declared in one table |
| [`js/rulebook.js`](js/rulebook.js) | The rules in prose, rendered by both the app and the printed edition |
| [`js/whispercard.js`](js/whispercard.js) | The face of a Whisper card, shared by the table and the printer |
| [`js/ai.js`](js/ai.js) | Valuing a hand, choosing which agents to send out, playing them |
| [`js/engine.js`](js/engine.js) | The state of the court and the transitions between phases |
| [`js/ui.js`](js/ui.js) | Rendering and input |
| [`serve.js`](serve.js) | Optional local static server |

The three rivals share one brain with different nerve: **Verane the patient** plays it straight,
**Mors the reckless** pledges bold, **Ilka the careful** pledges shy. None of them look at hidden
cards — they pledge by valuing their own hand and play by tracking what has already been seen.

## The printed edition

`print/` holds print-ready sheets for playing this on a table. Open
[`print/index.html`](print/index.html) and print at 100% scale with margins set to none.

| Sheet | What it is |
| --- | --- |
| [`print/rules.html`](print/rules.html) | The full rules, two columns to an A4 sheet, with a masthead and a summary of play |
| [`print/whispers.html`](print/whispers.html) | All fifteen Whispers at poker size (63.5 × 88.9 mm), nine to a sheet, plus a sheet of backs |
| [`print/reference.html`](print/reference.html) | A two-sided A6 reference card: making a pledge on one side, sway and favour on the other |

Everything is generated from the same rules files the game runs on, so the printed edition and the
app cannot disagree. The rules sheets measure themselves against a real A4 height and repack, so no
page loses its last paragraph off the bottom.

The design is one system across all three: cream stock and a gold double frame, the court's seal —
a coronet in a beaded ring — on anything the monarch is responsible for, a lozenge flourish
breaking each rule, and the four agent marks as a footer device. Card backs are plum with a woven
diagonal and a gold border.

Still to make: the sixty playing cards themselves.

## Tests

```bash
npm test
```

Around 5,000 assertions: the favour table, who takes an audience under every sway, answering in
kind, the sway ladder, the tie-breakers, all fifteen Whispers in isolation, a full season played
with Whispers switched off, plus twenty complete seasons played end to end against invariants
(every session is eleven audiences and four different Whispers, every deal is sixty agents, every
pledge obeys the Whisper that was given, every favour follows pledge → counted → kept → base →
Whisper).

The computer nobles are checked for calibration too. Across roughly 34,000 simulated player
sessions all fifteen Whispers land between **2.36 and 3.50** average favour against a table average
of **3.04** — a spread of 1.1 favour, with no outlier in either direction.

A season is always twelve nights, which runs about twenty minutes.

## A note on adding your own Whisper

`js/whispers.js` is one declarative table. A Whisper may define any of `allows(card)`,
`permits(cards)`, `satisfiable(hand)`, `countedTricks(won)`, `aimFor(bid)`, `pledgeFor(estimate)`,
`pledgeCost(bid)` and `adjust(favour, row, table)` — the rival nobles read the same hooks, so a new
Whisper is played correctly by the computer without touching the AI.

## License

MIT
