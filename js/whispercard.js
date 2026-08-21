/*
 * whispercard.js - the face of a Whisper card, drawn once.
 *
 * The card the player is handed at the table and the card that comes off a
 * printer are the same object, so both the app and print/ render from here and
 * share css/whisper-card.css. A burden is framed in oxblood rather than gold
 * and signed as a burden, because a player should be able to tell at a glance
 * that the monarch has not done them a favour.
 *
 * The BACK is deliberately not part of this: every Whisper must look identical
 * face down, or a burden could be spotted in a rival's hand.
 */
(function (global) {
  'use strict';

  /** The court's seal: a coronet in a beaded ring. */
  function seal(extraClass) {
    let beads = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      beads += '<circle cx="' + (50 + 44 * Math.cos(angle)).toFixed(2) +
        '" cy="' + (50 + 44 * Math.sin(angle)).toFixed(2) + '" r="1.7"/>';
    }
    return '<svg class="wseal ' + (extraClass || '') + '" viewBox="0 0 100 100" ' +
      'aria-hidden="true" fill="currentColor">' +
      '<circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      beads +
      '<path d="M31 62 L31 39 L40 47 L50 33 L60 47 L69 39 L69 62 Z"/>' +
      '<rect x="31" y="65" width="38" height="4.5" rx="2"/>' +
      '<circle cx="31" cy="36" r="3.4"/><circle cx="50" cy="30" r="3.4"/>' +
      '<circle cx="69" cy="36" r="3.4"/>' +
      '</svg>';
  }

  /**
   * A seal broken across the middle. The same coronet, snapped -- so a burden
   * reads as the court's word gone wrong rather than as a different game.
   */
  function brokenSeal(extraClass) {
    let beads = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x = 50 + 44 * Math.cos(angle);
      const y = 50 + 44 * Math.sin(angle);
      if (Math.abs(x - 50) < 7) continue; // the crack runs down the middle
      beads += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="1.7"/>';
    }
    return '<svg class="wseal ' + (extraClass || '') + '" viewBox="0 0 100 100" ' +
      'aria-hidden="true" fill="currentColor">' +
      '<path d="M46 13 A37 37 0 0 0 46 87" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M54 13 A37 37 0 0 1 54 87" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      beads +
      '<path d="M31 62 L31 39 L40 47 L46 38 L46 62 Z"/>' +
      '<path d="M69 62 L69 39 L60 47 L54 38 L54 62 Z"/>' +
      '<rect x="31" y="65" width="15" height="4.5" rx="2"/>' +
      '<rect x="54" y="65" width="15" height="4.5" rx="2"/>' +
      '<circle cx="31" cy="36" r="3.4"/><circle cx="69" cy="36" r="3.4"/>' +
      '<path d="M50 8 L50 92" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-dasharray="5 4" fill="none"/>' +
      '</svg>';
  }

  function flourish() {
    return '<div class="wflourish"><i></i></div>';
  }

  /**
   * The whole face of one Whisper. `size` is a modifier class -- the app uses
   * 'wcard-sm' at the table, print uses none.
   */
  function html(whisper, size) {
    if (!whisper) return '';
    const burden = !!whisper.burden;
    return '<div class="wcard' + (burden ? ' wcard-burden' : '') +
      (size ? ' ' + size : '') + '">' +
      '<div class="wcard-frame">' +
        '<div class="wcard-top">' + (burden ? brokenSeal() : seal()) + '</div>' +
        '<h3 class="wcard-title">' + whisper.name + '</h3>' +
        flourish() +
        '<p class="wcard-rule">' + whisper.line + '</p>' +
        flourish() +
        '<p class="wcard-flavour">' + whisper.detail + '</p>' +
        '<div class="wcard-foot"><span class="wcard-mark">' +
          (burden ? 'A Burden' : 'A Whisper') + '</span></div>' +
      '</div>' +
    '</div>';
  }

  global.WhisperCard = {
    seal: seal,
    brokenSeal: brokenSeal,
    flourish: flourish,
    html: html
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
