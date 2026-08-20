# Ian's Game

A four-player, trick-taking card game for the browser. You play one seat; three computer
opponents play the rest. No build step, no dependencies, no data storage — open the file and play.

## Playing it

Open `index.html` in a browser. That's it.

If your browser is strict about `file://` pages, serve it instead:

```bash
npm start
```

Then visit <http://localhost:8080>.

## The rules

A standard 52-card deck. Aces are high. Thirteen cards are dealt to each player, and the deal
rotates one seat to the left after every hand. First player past **50 points** wins.

### Bidding

Before play, each player chooses **three cards** and places them face down. The **suits** of those
cards add up to the number of tricks that player is bidding — the ranks are ignored entirely:

| Suit | Tricks |
| --- | --- |
| ♠ Spades | 3 |
| ♥ Hearts | 2 |
| ♦ Diamonds | 1 |
| ♣ Clubs | 0 |

The bid cards stay face down until the hand is over. That keeps the bid secret *and* hides which
cards left play. Because those three cards are gone for the hand, each hand is **ten tricks** long
and the highest reachable bid is nine.

The catch: the cards that set your bid are cards you no longer get to play. Bidding high means
spending spades; bidding nothing is cheap only if your clubs were worthless anyway.

### Playing a hand

* The player to the dealer's left leads the first trick; afterwards the winner of a trick leads
  the next one.
* Any card may be led, trump included.
* Play proceeds clockwise. You **must** follow the suit that was led if you can. If you cannot,
  you may play anything, including trump.
* The highest card of the led suit wins the trick — unless someone played trump, in which case the
  highest trump wins.

### Scoring

| Result | Points |
| --- | --- |
| Bid exactly right (and bid above zero) | 2 per trick won |
| Bid wrong | 1 per trick won, minus 2 for every trick off the bid |
| Bid zero, took no tricks | +5 |
| Bid zero, took any tricks | −5 |

Bid 5 and win 4 → 4 − 2 = **2**. Bid 3 and win 6 → 6 − 6 = **0**.

### Trump

The first hand of a game is always **No Trump**. After that, trump is set by how many of the four
players made their bid *exactly* in the hand before:

| Players who made their bid | Trump next hand |
| --- | --- |
| 0 | ♣ Clubs |
| 1 | ♦ Diamonds |
| 2 | ♥ Hearts |
| 3 | ♠ Spades |
| 4 | No Trump |

## The code

Plain scripts, loaded in order, each attaching one object to `globalThis`. Nothing needs a bundler
and the logic files also load under Node, which is how the tests run.

| File | What is in it |
| --- | --- |
| [`js/cards.js`](js/cards.js) | Deck, card, shuffling and sorting |
| [`js/rules.js`](js/rules.js) | Pure rules: legal plays, trick winner, scoring, trump ladder |
| [`js/ai.js`](js/ai.js) | Hand valuation, bid-card selection, card play |
| [`js/engine.js`](js/engine.js) | Game state and the transitions between phases |
| [`js/ui.js`](js/ui.js) | Rendering and input |
| [`serve.js`](serve.js) | Optional local static server |

The three computer players share one brain with different nerve: Ada plays it straight, Bram bids
bold, Cleo bids cautious. None of them look at hidden cards — they bid by valuing their own hand
and play by tracking what has already been seen.

## Tests

```bash
npm test
```

Around 3,000 assertions: the scoring table, trick resolution under trump and no trump, following
suit, the trump ladder, plus twenty complete games played end to end against invariants (every
hand is ten tricks, every deal is 52 cards, every score matches the rules).

## License

MIT
