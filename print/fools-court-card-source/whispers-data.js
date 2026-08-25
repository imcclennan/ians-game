/*
 * whispers-data.js — the twenty-two Whispers, transcribed from js/whispers.js.
 * Name, the one line that explains it, the flavour, the section heading it sits
 * under in the source, and whether it is a burden.
 *
 * Seven of the twenty-two are burdens. A burden must be obvious face up and
 * invisible face down, so only the face treatment differs.
 *
 * The source writes its em dashes as `--`; they are set as real dashes here.
 */
module.exports = [
  // --- what you may send -----------------------------------------------------
  {
    id: 'blackmailed', name: 'Blackmailed', group: 'What you may send',
    line: 'At least one Assassin must go out. Keep your pledge for +6.',
    detail: 'Someone at court holds a letter in your hand. A blade goes out tonight, or it reaches the monarch by morning.'
  },
  {
    id: 'silenced', name: 'Sworn to Silence', group: 'What you may send',
    line: 'No Assassin may go out. Keep your pledge for +3.',
    detail: 'You knelt in the chapel at dawn and swore off blood for the season. The chapel has ears.'
  },
  {
    id: 'smitten', name: 'The Smitten', group: 'What you may send',
    line: 'No Lover may go out. Keep your pledge for +3.',
    detail: 'You will not send them away. Not this night, not for the monarch, not for anything.'
  },
  {
    id: 'audited', name: 'The Audited', group: 'What you may send',
    line: 'Send two Merchants and two Fools, which pledges exactly 2. Keep it for +4.',
    detail: 'The treasury has been through your books and found them wanting. Two purses go out to be counted, and two Fools go with them to see that the counting is honest. What you promise the court this night was never really your choice.'
  },

  // --- how your own result is scored -----------------------------------------
  {
    id: 'debtor', name: 'The Debtor', group: 'How your result is scored',
    line: 'A kept pledge of 2 or fewer earns nothing; keep 3 or more for +3.',
    detail: 'You owe the treasury more than a quiet evening of work.'
  },
  {
    id: 'allOrNothing', name: 'All or Nothing', group: 'How your result is scored',
    line: 'Keep your pledge for double favour. Break it and lose 3, whatever else you did.',
    detail: 'You have staked your name on this. Either the court remembers it, or it costs you to have been here at all.'
  },
  {
    id: 'clerk', name: 'The Cautious Clerk', group: 'How your result is scored',
    line: 'You cannot lose favour this night, nor gain more than 7.',
    detail: 'You have learned that the way to survive a court is to be impossible to blame.'
  },

  // --- how you compare to the table ------------------------------------------
  {
    id: 'bold', name: 'The Bold', group: 'How you compare to the table',
    line: '+6 if your pledge is the highest at the table, outright.',
    detail: 'Promise more than any of them. The monarch has no memory for the second-most ambitious noble in the room.'
  },
  {
    id: 'meek', name: 'The Meek', group: 'How you compare to the table',
    line: '−3 if your pledge is the lowest or tied for lowest. Keep it for +4.',
    detail: 'The court has no use for a noble who promises least. Nor, it turns out, does the monarch.'
  },
  {
    id: 'kingmaker', name: 'The Kingmaker', group: 'How you compare to the table',
    line: 'Keep your pledge and take +2 for every other noble who broke theirs.',
    detail: 'You have never needed to win. You have only ever needed the others to lose.'
  },
  {
    id: 'favourite', name: 'The Favourite', group: 'How you compare to the table',
    line: '+6 if you win more audiences than any other noble, outright.',
    detail: 'You have the ear of the monarch this season. See that you are seen to have it.'
  },
  {
    id: 'wallflower', name: 'The Wallflower', group: 'How you compare to the table',
    line: '+6 if you win fewer audiences than any other noble, outright.',
    detail: 'Be somewhere else. Be forgettable. It has kept better nobles than you alive.'
  },

  // --- how you win audiences -------------------------------------------------
  {
    id: 'swornToFool', name: 'Sworn to the Fool', group: 'How you win audiences',
    line: '+3 favour for every audience you take with a Fool.',
    detail: 'The jester knows what the monarch actually thinks. You have decided to find out.'
  },

  // --- inversion and misdirection --------------------------------------------
  {
    id: 'contrarian', name: 'The Contrarian', group: 'Inversion and misdirection',
    line: 'Your pledge counts the audiences you will NOT win. Keep it for +2.',
    detail: 'Pledge eight and you have really promised three. You told the monarch what you would refuse, and it amused them enough to allow it.'
  },
  {
    id: 'understudy', name: 'The Understudy', group: 'Inversion and misdirection',
    line: 'You are scored against the pledge of the noble on your right, not your own. Take +3 for the trouble, and +5 more if you match it.',
    detail: 'You have been studying them for years — the one who plays into your hand, never after it. Tonight you find out how well. Their promise is sealed too, so you are aiming at a number nobody has shown you.'
  },

  // --- burdens ---------------------------------------------------------------
  {
    id: 'condemned', name: 'The Condemned', group: 'Burdens', burden: true,
    line: 'Break your pledge and lose a further 3.',
    detail: 'You are one failure from the block, and the court is watching to see which way you fall.'
  },
  {
    id: 'scapegoat', name: 'The Scapegoat', group: 'Burdens', burden: true,
    line: '−2 for every other noble who keeps their pledge, to a limit of 4.',
    detail: 'Someone must answer for last season. It has been decided that it will be you.'
  },
  {
    id: 'disgrace', name: 'In Disgrace', group: 'Burdens', burden: true,
    line: 'Favour you gain tonight is halved. Favour you lose is not.',
    detail: 'You are still at court. You are no longer quite of it.'
  },
  {
    id: 'watched', name: 'The Watched', group: 'Burdens', burden: true,
    line: 'Your errands are laid face up as soon as they are sent.',
    detail: 'A clerk has been assigned to your correspondence. Everything you send, the room sees — your pledge, and which four agents have left your hand. They will play accordingly, and there is nothing you can do about it.'
  },
  {
    id: 'marked', name: 'Marked for the Blade', group: 'Burdens', burden: true,
    line: '−2 for every audience you take with an Assassin.',
    detail: 'You have made an enemy of someone who kills for a living. Draw a blade tonight and it will be noticed.'
  },
  {
    id: 'outOfFavour', name: 'Out of Favour', group: 'Burdens', burden: true,
    line: 'A kept pledge of 4 or more earns you nothing.',
    detail: 'Whatever you did last season, the monarch has not forgotten it. Succeed quietly tonight or do not bother succeeding at all.'
  },
  {
    id: 'duellist', name: 'Called Out', group: 'Burdens', burden: true,
    line: '−5 if you win more audiences than the noble on your right.',
    detail: 'A matter of honour is outstanding, and the whole court has agreed to keep score of it. Whoever plays into your hand tonight had better outshine you.'
  }
];
