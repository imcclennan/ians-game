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

Four Assassins would come to twelve, but no noble may promise the court more than it has: **a
pledge stops at eleven**.

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
| Pledged nothing, took nothing | +3 |
| Pledged nothing, took audiences | −5 for the first, −2 for each one after |

Pledge 5, win 4 → 4 − 2 = **2**. Pledge 3, win 6 → 6 − 6 = **0**. Pledge 0, win 3 → **−9**.

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

Around 2,200 assertions: the favour table, who takes an audience under every sway, answering in
kind, the pledge cap, the sway ladder, the tie-breakers, plus twenty complete seasons played end to
end against invariants (every session is eleven audiences, every deal is sixty agents, every score
matches the rules).

The computer nobles are also checked for calibration: across simulated play the four pledges add up
to about 11.2 against the 11 audiences actually available.

## License

MIT
