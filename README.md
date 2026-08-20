# The Fool's Court

Four nobles compete for the monarch's ear. You play one seat; three rivals play the rest.
Runs in the browser with no build step, no dependencies and nothing stored anywhere.

> When every noble breaks their word, the Fool rules the court.
> When all four keep it, no one holds sway at all.

## Playing it

Open `index.html` in a browser. That's it.

If your browser is strict about `file://` pages, serve it instead:

```bash
npm start
```

Then visit <http://localhost:8080>.

## The court

Sixty cards. Four kinds of **agent**, each ranked **1 to 15** by their standing at court — 15 is
the most influential, 1 the least. The classic pips are kept because they already read as the four
agents: the blade, the heart, the coin, the jester's bauble.

| Agent | Pip | Audiences promised |
| --- | --- | --- |
| Assassin | ♠ | 3 |
| Lover | ♥ | 2 |
| Merchant | ♦ | 1 |
| Fool | ♣ | 0 |

Fifteen agents are dealt to each noble. The **steward** — the seat that deals — passes one place to
the left after every session. First noble past **40 favour** wins the season.

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
| Pledged nothing, took nothing | +5 |
| Pledged nothing, took audiences | −5 for the first, −2 for each one after |

Pledge 5, win 4 → 4 − 2 = **2**. Pledge 3, win 6 → 6 − 6 = **0**. Pledge 0, win 3 → **−9**.

### The Whispers

Before each session the monarch has a **private word** with every noble. One Whisper each, no two
alike, and nobody sees another's until the session is over. A Whisper bends how your favour is
counted or what you are permitted to promise — so a rival pledging strangely, or ducking audiences
they could plainly win, is telling you something.

| Whisper | The monarch's word |
| --- | --- |
| **The Contrarian** | Your pledge counts the audiences you will **not** win. Pledge eight and you have really promised three. |
| **The Ascetic** | Pledge nothing and keep it for **+12**; break it and lose only 3. |
| **The Debtor** | A kept pledge of 2 or fewer earns nothing; keep 3 or more for **+3**. |
| **Blackmailed** | At least one Assassin must go out. Keep your pledge for **+5**. |
| **Sworn to Silence** | No Assassin may go out. Keep your pledge for **+3**. |
| **The Bold** | **+5** if your pledge is the highest at the table, outright. |
| **The Meek** | **−4** if your pledge is the lowest or tied for lowest. Keep it for **+4**. |
| **The Kingmaker** | Keep your pledge and take **+2** for every other noble who broke theirs. |

A demand that cannot be met is waived: a noble holding no Assassin cannot be made to send one.

The Contrarian is the one to watch. It scores exactly as a noble who had openly promised the
complement, so it costs nothing on average — its whole value is that the table sees a bold pledge
of eight where the real promise was three.

### Who holds sway

The opening session of a season is always **No Sway**. After that, sway passes according to how
many of the four nobles kept their pledge *exactly* in the session before:

| Nobles who kept their word | Sway next session |
| --- | --- |
| 0 | ♣ Fools |
| 1 | ♦ Merchants |
| 2 | ♥ Lovers |
| 3 | ♠ Assassins |
| 4 | No Sway |

### Winning the season

The season ends the moment a noble reaches 40 favour, and the highest total wins — 41 beats 40. If
two nobles finish level, the win goes to whoever:

1. won more favour that session, failing which
2. made the bolder pledge that session, failing which
3. sent out the higher-ranked four agents that session.

## The code

Plain scripts, loaded in order, each attaching one object to `globalThis`. Nothing needs a bundler
and the logic files also load under Node, which is how the tests run.

| File | What is in it |
| --- | --- |
| [`js/cards.js`](js/cards.js) | The sixty-card deck, the four agents, shuffling and sorting |
| [`js/rules.js`](js/rules.js) | Pure rules: legal plays, who takes the audience, favour, the sway ladder |
| [`js/whispers.js`](js/whispers.js) | The eight Whispers, declared in one table |
| [`js/ai.js`](js/ai.js) | Valuing a hand, choosing which agents to send out, playing them |
| [`js/engine.js`](js/engine.js) | The state of the court and the transitions between phases |
| [`js/ui.js`](js/ui.js) | Rendering and input |
| [`serve.js`](serve.js) | Optional local static server |

The three rivals share one brain with different nerve: **Verane the patient** plays it straight,
**Mors the reckless** pledges bold, **Ilka the careful** pledges shy. None of them look at hidden
cards — they pledge by valuing their own hand and play by tracking what has already been seen.

## Tests

```bash
npm test
```

Around 3,400 assertions: the favour table, who takes an audience under every sway, answering in
kind, the sway ladder, the tie-breakers, every Whisper in isolation, plus twenty complete seasons
played end to end against invariants (every session is eleven audiences and four different
Whispers, every deal is sixty agents, every pledge obeys the Whisper that was given, every favour
follows pledge → counted → base → Whisper).

The computer nobles are checked for calibration too. Across roughly 24,000 simulated player
sessions the eight Whispers land between **1.9 and 3.4** average favour against a table average of
**2.7**, and what the four nobles are really aiming at adds up to about the eleven audiences on
offer.

## A note on adding your own Whisper

`js/whispers.js` is one declarative table. A Whisper may define any of `allows(card)`,
`permits(cards)`, `satisfiable(hand)`, `countedTricks(won)`, `aimFor(bid)`, `pledgeFor(estimate)`,
`pledgeCost(bid)` and `adjust(favour, row, table)` — the rival nobles read the same hooks, so a new
Whisper is played correctly by the computer without touching the AI.

## License

MIT
