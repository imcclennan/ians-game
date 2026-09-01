# Editing the rules

The two printed leaves are generated from two files you can edit:

| File | Becomes |
| --- | --- |
| `rules.md` | `fools-court-rules.pdf` — sections 1–8, the game itself |
| `whispers.md` | `fools-court-whispers.pdf` — section 9 and the Whisper rule |

Edit the text, send them back, and the sheets are regenerated and re-checked.

```bash
node rulesheet.js   # sources -> out/rulesheet.html, out/whispersheet.html
node fit.js         # does every side fit, and how full is it
node mksheets.js    # -> PDFs and a PNG proof of each side
```

---

## The shape of a file

Front matter between `---` lines sets the masthead and the runners. A line of
exactly `--- side ---` starts the second side. There are two sides to a leaf.

```
---
title: The Fool's Court
subtitle: A trick-taking game of promises, for four players
side1-runner: Sections 1–4 · pledging, play and scoring overleaf
---

# 1. Overview

Prose goes here.

--- side ---

# 5. Playing the night
```

## Marking up text

| Write | Get |
| --- | --- |
| `# 2. The deck` | A numbered section heading. The number drives the contents list. |
| `## Taking one` | An unnumbered subheading |
| A blank-line-separated block | A paragraph |
| `> text` | A small italic aside |
| `1.` … | A numbered list |
| `- ` … | A bulleted list |
| `**text**` | **bold** |
| `_text_` | *italic* |
| ` -- ` | An em dash |
| `don't` | A curly apostrophe |

Raw HTML and entities pass through untouched, so anything the markup does not
cover can be written directly. Lines wrap freely: a paragraph or a list item
runs until a blank line.

## Numbers

**Do not type a number that the game knows.** Write the token and it is filled
in from `js/rules.js`, `js/cards.js` or `whispers-data.js` at build time. A
figure typed into prose goes stale silently; this is how the Fool's errand
value stayed wrong on the cards for an entire edition.

Tokens ending `Word` spell the number out, for use inside a sentence —
"four Assassins pledge twelve" rather than "4 Assassins pledge 12".

| Token | Currently |
| --- | --- |
| `{{allAssassins}}` | 12 |
| `{{allAssassinsWord}}` | twelve |
| `{{bidCards}}` | 4 |
| `{{bidCardsWord}}` | four |
| `{{boons}}` | 15 |
| `{{burdens}}` | 7 |
| `{{burdensWord}}` | seven |
| `{{deckSize}}` | 60 |
| `{{flatBonus}}` | 1 |
| `{{foolsErrandPay}}` | 8 |
| `{{foolsErrandSize}}` | 4 |
| `{{foolsErrandSizeWord}}` | four |
| `{{handSize}}` | 15 |
| `{{handSizeWord}}` | fifteen |
| `{{minus}}` | − |
| `{{perKind}}` | 15 |
| `{{perKindWord}}` | fifteen |
| `{{players}}` | 4 |
| `{{pledgeAssassin}}` | 3 |
| `{{pledgeFool}}` | −1 |
| `{{pledgeLover}}` | 2 |
| `{{pledgeMerchant}}` | 1 |
| `{{season}}` | 12 |
| `{{seasonWord}}` | twelve |
| `{{tricks}}` | 11 |
| `{{tricksWord}}` | eleven |
| `{{whispers}}` | 22 |
| `{{whispersWord}}` | 22 |

An unknown token stops the build and names itself.

## Generated blocks

A line beginning `:::` inserts a block built from the game.

| Write | |
| --- | --- |
| `::: composition` |
| `::: errand-values` |
| `::: examples` |
| `::: favour-table` |
| `::: in-this-box` |
| `::: sway-table` |
| `::: contents` |
| `::: whispers <group>` |
| `::: whispers-rest` |

The contents list is assembled from the headings the two files actually carry,
so renaming, renumbering or moving a section updates it without anyone
remembering to.

### The Whisper groups

`::: whispers-rest` prints every group not already printed. If the two files
between them never print a group, **the build fails and names the missing
words** rather than quietly dropping them.

| Write | Words |
| --- | --- |
| `::: whispers What you may send` | 5 |
| `::: whispers How your result is scored` | 2 |
| `::: whispers How you compare to the table` | 5 |
| `::: whispers How you win audiences` | 3 |
| `::: whispers Burdens` | 7 |
| `::: whispers-rest` | whatever is left |

## Boxes

A fenced block, closed by a lone `:::`:

```
::: box If you are in doubt
- **Two of a kind on the same rank?** The one played later takes
  the audience (6).
- **Everyone kept their pledge?** Nobody holds sway the next night (8).
:::
```

---

## Fitting

Each side is three columns of fixed height. Text that does not fit is **not
shrunk to make it fit** — it spills and is clipped. `fit.js` is what catches
that, and it reports how full each side is as well as whether it fits:

```
ok    side 1: 751/751px across, 417/417px down  (100% full)
ok    side 2: 751/751px across, 414/444px down  (93% full)
```

The two leaves overflow differently and it checks both: the rules leaf fills
its columns in order and spills sideways into a clipped fourth column, while
the Whispers leaf balances its columns and spills off the bottom.

**Rules side 1 is full.** Anything added there needs something else cut, or a
section moved past `--- side ---`. Side 2 has about half a column spare.

**The Whispers leaf has room in the text but not in the type.** It is set from
one constant, `WSCALE` in `rulesheet.js`, currently 1.26; it fails at 1.28.
Adding words there means lowering the scale.

If an edit overflows, the report says which side and by how much, and the sheet
is regenerated with the type or the split adjusted.
