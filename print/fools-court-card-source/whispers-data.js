/*
 * whispers-data.js — the twenty-two Whispers, transcribed from js/whispers.js.
 * Name, the one line that explains it, the flavour, the section heading it sits
 * under in the source, and whether it is a burden.
 *
 * Seven of the twenty-two are burdens. A burden must be obvious face up and
 * invisible face down, so only the face treatment differs.
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
    line: 'At least two Assassins must go out. Keep your pledge for +6.',
    detail: 'Someone at court holds a letter in your hand. Two blades go out tonight, or it reaches the monarch by morning.'
  },
  {
    id: 'silenced', name: 'Sworn to Silence', group: 'What you may send',
    line: 'No Assassin may go out. Keep your pledge for +4.',
    detail: 'You knelt in the chapel at dawn and swore off blood for the season. The chapel has ears.'
  },
  {
    id: 'smitten', name: 'The Smitten', group: 'What you may send',
    line: 'No Lover may go out. Keep your pledge for +5.',
    detail: 'You will not send them away. Not this night, not for the monarch, not for anything.'
  },
  {
    id: 'ledger', name: 'Sworn to the Ledger', group: 'What you may send',
    line: 'No Merchant may go out. Keep your pledge for +5.',
    detail: 'The books must balance before the season turns, and not one purse of yours is leaving this room until they do.'
  },
  {
    id: 'audited', name: 'The Audited', group: 'What you may send',
    line: 'Send three Merchants and one Fool, which pledges exactly 2. Keep it for +6.',
    detail: 'The treasury has been through your books and found them wanting. Three purses go out to be counted, and a Fool goes with them to see that the counting is honest. What you promise the court this night was never really your choice.'
  },

  // --- how your own result is scored -----------------------------------------
  {
    id: 'debtor', name: 'The Debtor', group: 'How your result is scored',
    line: 'A kept pledge of 2 or fewer earns nothing; keep 3 or more for +5.',
    detail: 'You owe the treasury more than a quiet evening of work.'
  },
  {
    id: 'allOrNothing', name: 'All or Nothing', group: 'How your result is scored',
    line: 'Keep your pledge for double favour. Break it and the night is worth −1 for every audience off it.',
    detail: 'You have staked your name on this. Either the court remembers it, or it costs you to have been here at all.'
  },

  // --- how you compare to the table ------------------------------------------
  {
    id: 'bold', name: 'The Bold', group: 'How you compare to the table',
    line: '+4 if no noble pledges more than you.',
    detail: 'Promise as much as any of them. The monarch has no memory for the second-most ambitious noble in the room.'
  },
  {
    id: 'kingmaker', name: 'The Kingmaker', group: 'How you compare to the table',
    line: 'Keep your pledge and take +3 for every other noble who broke theirs.',
    detail: 'Your own word will be kept. That part was never in doubt, and it is not what you are here for — what you are counting is how many of theirs are not.'
  },
  {
    id: 'favourite', name: 'The Favourite', group: 'How you compare to the table',
    line: '+6 if no noble wins more audiences than you.',
    detail: 'You have the ear of the monarch this season. See that you are seen to have it.'
  },
  {
    id: 'wallflower', name: 'The Wallflower', group: 'How you compare to the table',
    line: '+5 if no noble wins fewer audiences than you.',
    detail: 'Be somewhere else. Be forgettable. It has kept better nobles than you alive.'
  },

  // --- how you win audiences -------------------------------------------------
  {
    id: 'swornToFool', name: 'Sworn to the Fool', group: 'How you win audiences',
    line: 'Your pledge is not scored. +2 for every Fool in the audiences you win.',
    detail: 'The jester knows what the monarch actually thinks. You have decided to find out.'
  },
  {
    id: 'twin', name: 'The Twin', group: 'How you win audiences',
    line: '+2 for every pair of agents of the same kind and rank you take in one audience.',
    detail: 'There is someone in this palace with your face. The monarch has not said which of you was invited, and finds the question very funny indeed.'
  },
  {
    id: 'modest', name: 'The Modest', group: 'How you win audiences',
    line: '+3 for every audience you win with an agent of rank 5 or lower.',
    detail: 'Anyone can carry a room with a blade at their back. The monarch would like to see it done with a nobody.'
  },

  // --- how you compare to the table, continued -------------------------------
  {
    id: 'understudy', name: 'The Understudy', group: 'How you compare to the table',
    line: 'You are scored against the pledge of the noble on your right, not your own. Take +2 for the trouble, and +5 more if you match it.',
    detail: 'You have been studying them for years — the one who plays into your hand, never after it. Tonight you find out how well. Their promise is sealed too, so you are aiming at a number nobody has shown you.'
  },

  // --- burdens ---------------------------------------------------------------
  {
    id: 'saboteur', name: 'The Saboteur', group: 'Burdens', burden: true,
    line: 'Your pledge is not scored. +5, less 3 for every other noble who keeps theirs.',
    detail: 'You have been paid, by someone who did not give their name, to see that this court gets nothing it was promised. What you yourself came here to do no longer matters to anyone, least of all to you.'
  },
  {
    id: 'watched', name: 'The Watched', group: 'Burdens', burden: true,
    line: 'Your errands are laid face up as soon as they are sent.',
    detail: 'A clerk has been assigned to your correspondence. Everything you send, the room sees — your pledge, and which four agents have left your hand. They will play accordingly, and there is nothing you can do about it.'
  },
  {
    id: 'marked', name: 'Marked for the Blade', group: 'Burdens', burden: true,
    line: '−2 for every audience you win with an Assassin.',
    detail: 'You have made an enemy of someone who kills for a living. Take an audience with a blade in your hand and it will be noticed. What the others throw in is their affair; it is the agent that wins the audience for you that counts.'
  },
  {
    id: 'outOfFavour', name: 'Out of Favour', group: 'Burdens', burden: true,
    line: '−2 unless no noble wins fewer audiences than you.',
    detail: 'Whatever you did last season, the monarch has not forgotten it. Be the smallest presence in the room tonight, or do not trouble coming at all.'
  },
  {
    id: 'optimist', name: 'The Optimist', group: 'Burdens', burden: true,
    line: '−3 for every audience you take short of your pledge.',
    detail: 'You have always believed the night would go better than it did. The court has stopped finding it charming.'
  },
  {
    id: 'beggar', name: 'The Beggar’s Bargain', group: 'Burdens', burden: true,
    line: 'Favour you gain is halved unless you win an audience with a Fool in it.',
    detail: 'You took coin from a man on the palace steps on your way up, and he asked only that you remember him once, in front of the whole court.'
  },
  {
    id: 'duellist', name: 'Called Out', group: 'Burdens', burden: true,
    line: '−3 if you win more audiences than the noble on your right.',
    detail: 'A matter of honour is outstanding, and the whole court has agreed to keep score of it. Whoever plays into your hand tonight had better outshine you.'
  }
];
