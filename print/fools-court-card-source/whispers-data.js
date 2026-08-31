/*
 * whispers-data.js — the twenty-two Whispers, transcribed from js/whispers.js.
 * Name, who it is signed by, the one line that explains it, the flavour, the
 * section heading it sits under in the source, and whether it is a burden.
 *
 * Seven of the twenty-two are burdens. A burden must be obvious face up and
 * invisible face down, so only the face treatment differs.
 *
 * A card carries a name, one rule line, and fiction. Every clarification lives
 * in the rulebook's Whispers section, which the printed sheet reproduces in
 * full — so a player at the table has the terse card and a player settling an
 * argument has the sheet.
 *
 * Not every word is the monarch's. A Whisper is whatever reaches a noble before
 * the night begins, and each one is signed by whoever sent it.
 *
 * The source writes its em dashes as `--`; they are set as real dashes here,
 * and a leading minus is set as U+2212 rather than a hyphen.
 *
 * Card order follows the WHISPERS array in js/whispers.js, so the "n of 22"
 * footer on each face agrees with the order the app deals them in.
 */
module.exports = [
  // --- what you may send -----------------------------------------------------
  {
    id: 'blackmailed', name: 'Blackmailed', group: 'What you may send',
    signed: 'A hand you do not know',
    line: 'At least two Assassins must go out. Keep your pledge for +6.',
    detail: 'Someone at court holds a letter in your handwriting. Two blades go out tonight, or it reaches the monarch by morning.'
  },
  {
    id: 'silenced', name: 'Sworn to Silence', group: 'What you may send',
    signed: 'The Chapel',
    line: 'No Assassin may go out. Keep your pledge for +4.',
    detail: 'You knelt in the chapel at dawn and swore off blood for the night. The chapel has ears.'
  },
  {
    id: 'smitten', name: 'The Smitten', group: 'What you may send',
    signed: 'A Lover',
    line: 'No Lover may go out. Keep your pledge for +5.',
    detail: 'You will not send them away. Not this night, not for the monarch, not for anything.'
  },
  {
    id: 'ledger', name: 'Sworn to the Ledger', group: 'What you may send',
    signed: 'The Treasury',
    line: 'No Merchant may go out. Keep your pledge for +5.',
    detail: 'The books must balance before the season turns, and not one purse of yours is leaving this room until they do.'
  },
  {
    id: 'audited', name: 'The Audited', group: 'What you may send',
    signed: 'The Treasury',
    line: 'Send three Merchants and one Fool, which pledges exactly 2. Keep it for +6.',
    detail: 'The treasury has been through your books and found them wanting. Three purses go out to be counted, and a Fool goes with them to see that the counting is honest.'
  },

  // --- how your own result is scored -----------------------------------------
  {
    id: 'debtor', name: 'The Debtor', group: 'How your result is scored',
    signed: 'The Treasury',
    line: 'A kept pledge of 2 or fewer earns nothing; keep 3 or more for +5.',
    detail: 'You owe the treasury more than a quiet evening of work.'
  },
  {
    id: 'allOrNothing', name: 'All or Nothing', group: 'How your result is scored',
    signed: 'The Court',
    line: 'Keep your pledge for double favour. Break it and the night is worth −1 for every audience off it.',
    detail: 'You have staked your name on this. Either the court remembers it, or it costs you to have been here at all.'
  },

  // --- how you compare to the table ------------------------------------------
  {
    id: 'bold', name: 'The Bold', group: 'How you compare to the table',
    signed: 'The Monarch',
    line: '+4 if no noble pledges more than you.',
    detail: 'Promise as much as any of them. We have no memory for the second-most ambitious noble in a room.'
  },
  {
    id: 'kingmaker', name: 'Never in Doubt', group: 'How you compare to the table',
    signed: 'The Court',
    line: 'Keep your pledge and take +3 for every other noble who broke theirs.',
    detail: 'Your own word will be kept. That is not what you are here for — how many of theirs are not is the only figure that interests you.'
  },
  {
    id: 'favourite', name: 'The Favourite', group: 'How you compare to the table',
    signed: 'The Monarch',
    line: '+6 if no noble wins more audiences than you.',
    detail: 'You have our ear this season. See that the room knows it.'
  },
  {
    id: 'wallflower', name: 'The Wallflower', group: 'How you compare to the table',
    signed: 'A Friend at Court',
    line: '+5 if no noble wins fewer audiences than you.',
    detail: 'Be somewhere else. Be forgettable. It has kept better nobles than you alive.'
  },

  // --- how you win audiences -------------------------------------------------
  {
    id: 'swornToFool', name: 'Sworn to the Fool', group: 'How you win audiences',
    signed: 'The Fool',
    line: 'Your pledge is not scored. +2 for every Fool in the audiences you win.',
    detail: 'The jester knows what the monarch actually thinks. You have decided to find out.'
  },
  {
    id: 'twin', name: 'The Twin', group: 'How you win audiences',
    signed: 'The Monarch',
    line: '+2 for every pair of agents of the same kind and rank you take in one audience.',
    detail: 'There is someone in this palace with your face. We have not said which of you was invited, and find the question very funny indeed.'
  },
  {
    id: 'modest', name: 'The Modest', group: 'How you win audiences',
    signed: 'The Monarch',
    line: '+3 for every audience you win with an agent of rank 5 or lower.',
    detail: 'Anyone can carry a room with a blade at their back. We should like to see it done with a nobody.'
  },

  // --- how you compare to the table, continued -------------------------------
  {
    id: 'understudy', name: 'The Understudy', group: 'How you compare to the table',
    signed: 'The Court',
    line: 'You are scored against the pledge of the noble on your right, not your own. Take +2 for the trouble, and +5 more if you match it.',
    detail: 'You have been studying them for years — the one who plays into your hand, never after it. Tonight you find out how well. Their promise is sealed too, so you are aiming at a number nobody has shown you.'
  },

  // --- burdens ---------------------------------------------------------------
  {
    id: 'saboteur', name: 'In Another’s Pay', group: 'Burdens', burden: true,
    signed: 'A hand you do not know',
    line: 'Your pledge is not scored. +5, less 3 for every other noble who keeps theirs.',
    detail: 'You have been paid, by someone who did not give their name, to see that this court gets nothing it was promised. What you yourself came here to do no longer matters to anyone, least of all to you.'
  },
  {
    id: 'watched', name: 'The Watched', group: 'Burdens', burden: true,
    signed: 'The Chancery',
    line: 'Your errands are laid face up as soon as they are sent.',
    detail: 'A clerk has been assigned to your correspondence. Whatever leaves your hand, the room sees.'
  },
  {
    id: 'marked', name: 'Marked for the Blade', group: 'Burdens', burden: true,
    signed: 'One who kills for a living',
    line: '−2 for every audience an Assassin takes for you.',
    detail: 'You have made an enemy of someone who kills for a living. Draw a blade tonight and it will be noticed.'
  },
  {
    id: 'outOfFavour', name: 'Out of Favour', group: 'Burdens', burden: true,
    signed: 'The Monarch',
    line: '−2 unless no noble wins fewer audiences than you.',
    detail: 'Whatever you did last season, we have not forgotten it. Be the smallest presence in the room tonight, or do not trouble coming at all.'
  },
  {
    id: 'optimist', name: 'More Was Expected', group: 'Burdens', burden: true,
    signed: 'The Court',
    line: '−3 for every audience you take short of your pledge.',
    detail: 'You said what the night would come to, and the court took you at your word. It is the shortfall they remember, never the excess.'
  },
  {
    id: 'beggar', name: 'The Beggar’s Bargain', group: 'Burdens', burden: true,
    signed: 'A beggar on the steps',
    line: 'Favour you gain is halved unless you win an audience with a Fool in it.',
    detail: 'You took coin from a man on the palace steps on your way up, and he asked only that you remember him once, in front of the whole court.'
  },
  {
    id: 'duellist', name: 'Called Out', group: 'Burdens', burden: true,
    signed: 'A rival noble',
    line: '−3 if you win more audiences than the noble on your right.',
    detail: 'A matter of honour is outstanding, and the whole court has agreed to keep score of it. Whoever plays into your hand tonight had better outshine you.'
  }
];
