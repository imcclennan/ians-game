---
title: The Fool's Court
subtitle: A trick-taking game of promises, for four players
meta: Four players &middot; 45 minutes<br>Twelve nights to a season
runner: The Fool's Court
side1-runner: Sections 1&ndash;4 &middot; pledging, play and scoring overleaf
side2-title: The Fool's Court
side2-subtitle: Play &middot; favour &middot; sway &middot; the season
side2-runner: Sections 5&ndash;8 &middot; the Whispers on their own sheet
---

::: contents

::: in-this-box

# 1. Overview

Four nobles compete for the ear of the monarch over a series of **nights**. At the start of each
night every player privately promises how many **audiences** they will win, then plays to reach
that number _exactly_: overshooting is punished as surely as falling short. A season is **twelve
nights**; whoever holds the most favour at the end wins.

> A hand is a **night**. A promise is a **pledge**. A trick is an **audience**. The trump suit is
> the **sway**. Points are **favour**. The dealer is the **steward**.

# 2. The deck

Sixty cards: four kinds of agent, **{{perKind}} of each kind**, ranked by their standing at court.
The highest rank is the most influential, rank 1 the least.

::: errand-values

The four kinds do not share a ranking ladder. Each holds fifteen cards, but each has its own set 
of ranks: the Assassins sit at the top and the Fools at the bottom, the Merchants alone run the 
whole range, and the Lovers exist in pairs.

::: composition

Rank decides an audience **only between agents of the same kind**, so the four ranges say nothing
about which kind beats which. Cards of one kind and rank are **identical in play**; the pips beside 
the rank say how many of that agent the deck holds.

An agent's **kind** decides what it promises on an errand (4); its **rank** decides whether it wins
an audience (5). The two never interact.

# 3. Seating, the deal, and the course of a night

Four players sit in a fixed order; play and the deal go **clockwise**. One player is the
**steward** for the night, and the stewardship passes one seat left after every night.

1. The steward deals **{{handSize}} cards** to each player.
2. Each player sends **{{bidCardsWord}} agents** out on errands, face down. Their kinds are that
   player's pledge (4).
3. The player to the steward's left opens the first of **{{tricks}} audiences**. Answer in kind
   where you can; the highest of the opening kind takes it, unless the ruling kind was played (5).
4. If more than one winning card of the same kind and rank is played, the last one takes it (5).
5. Errands are revealed; favour is scored (6).
6. The number of pledges kept sets the sway for the next night (7).

After twelve nights the season ends and the most favour wins (8).

# 4. Making a pledge

Before any card is played, each player selects **{{bidCardsWord}} cards** from their hand and places
them face down. These are that player's **errands**.

A player's **pledge** is the sum of the errand values of the {{bidCardsWord}} cards sent, by kind.
**Rank is disregarded entirely**: a Fool of 5 promises as little as a Fool of 1. Errands stay face
down and **out of play**, so {{tricksWord}} cards remain in each hand and **{{tricksWord}} audiences** are
contested.

All errands are revealed together when the night ends; until then no player knows another's pledge, 
nor what has left their hand.

--- side ---

# 5. Playing the night

The player to the steward's left **opens** the first audience with any card, including one of the
ruling kind.

Play goes clockwise. Each player must **answer in kind** -- play a card of the same kind as the one
that opened the audience -- if they hold one. A player holding none may play anything.

The audience is won by the **highest-ranked card of the opening kind**, unless a card of the
**ruling kind** (7) was played, in which case the highest of those wins instead. A card of neither
kind can never win, whatever its rank.

**Equal ranks.** Because the deck holds some ranks more than once (2), two agents of the same
kind can meet on the same rank. The audience then goes to **whichever was played last** -- the
later word is the one the court remembers. A card that cannot be beaten can still be matched, and a
player sitting after you needs only to equal it.

The winner opens the next. {{tricks}} audiences are played.

# 6. Winning favour

At the end of the night each player compares the audiences they won against the pledge they made.

::: favour-table

**Examples.**

::: examples

> Being wrong costs 2 favour per audience in _either_ direction, so there is no advantage in
> under-promising and overshooting. The only good outcome is the exact one. A Fool's errand is
> worth sending only when it can be made honestly: {{foolsErrandSize}} Fools pays
> {{foolsErrandPay}}, while a hollow promise pays {{flatBonus}} -- less than the smallest kept
> promise.

# 7. Who holds sway

One kind may **hold sway** for a night, outranking every other kind when audiences are decided (5).
No player chooses it: it follows from how the _previous_ night went. The first night of a season is
always **No Sway**. Counted from pledges kept **exactly**, and known to everyone before pledges are
made.

::: sway-table

# 8. Winning the season

A season is exactly **twelve nights**. There is no target score and no early finish: the court sits
twelve times and then rises. The twelfth is **Twelfth Night**, the feast of misrule; the
stewardship will have passed three full times round the table.

The player with the most favour after Twelfth Night wins. Level totals are decided, in order, by:
more favour won on Twelfth Night; then the higher pledge that night; then the higher combined rank
of the {{bidCardsWord}} errands sent that night.

::: box If you are in doubt
- **Two of a kind on the same rank?** The one played later takes the audience (5).
- **Sent {{foolsErrandSizeWord}} Fools and still won one?** The Fool's errand is broken: {{minus}}2 for
  every audience taken (6).
- **Everyone kept their pledge?** Nobody holds sway the next night (7).
:::
