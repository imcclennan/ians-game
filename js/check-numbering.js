/*
 * check-numbering.js — do the printed sheets and the app agree?
 *
 * The sheets carry cross-references by number ("the ruling kind (7)"), and so
 * does the app's Rules panel. If the two disagree, a player reading one and a
 * player reading the other are sent to different sections. This compares them
 * section for section, and also checks that every (n) reference printed on a
 * sheet points at a section that exists.
 */
const fs = require('fs');
const path = require('path');
const { build } = require('./content');

require('../../js/cards.js');
require('../../js/rules.js');
require('../../js/whispers.js');
require('../../js/rulebook.js');
const app = globalThis.Rulebook.sections();

// the printed sections, read back out of the two sources
const printed = [];
for (const file of ['rules.md', 'whispers.md']) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  for (const m of src.matchAll(/^#\s+(\d+)\.\s+(.+?)\s*(\{optional\})?\s*$/gm)) {
    printed.push({ n: Number(m[1]), title: m[2], file });
  }
  for (const suffix of ['', '2', '3']) {
    const n = src.match(new RegExp(`^section${suffix}:\\s*(\\d+)`, 'm'));
    const t = src.match(new RegExp(`^section${suffix}-title:\\s*(.+)$`, 'm'));
    if (n) printed.push({ n: Number(n[1]), title: t ? t[1].trim() : '(untitled)', file });
  }
}
printed.sort((a, b) => a.n - b.n);

let bad = 0;
const say = (ok, text) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${text}`); if (!ok) bad++; };

console.log('printed sheets against js/rulebook.js');
const most = Math.max(printed.length, app.length);
for (let i = 0; i < most; i++) {
  const p = printed[i], a = app[i];
  if (!p) { say(false, `${a.number} "${a.title}" is in the app but on no sheet`); continue; }
  if (!a) { say(false, `${p.n} "${p.title}" is printed but not in the app`); continue; }
  say(p.n === a.number && p.title === a.title,
    `${p.n} ${p.title}` + (p.n === a.number && p.title === a.title
      ? '' : `  <>  app has ${a.number} ${a.title}`));
}

// every (n) printed on a sheet must land on a section that exists
const numbers = new Set(printed.map((p) => p.n));
console.log('\ncross-references');
for (const file of ['rules.md', 'whispers.md']) {
  const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const refs = [...new Set([...src.matchAll(/\((\d+)\)/g)].map((m) => Number(m[1])))]
    .sort((a, b) => a - b);
  const dead = refs.filter((n) => !numbers.has(n));
  say(dead.length === 0, `${file}: ${refs.join(', ') || 'none'}` +
    (dead.length ? `  — ${dead.join(', ')} point at nothing` : ''));
}

// the Whispers must be an add-on: nothing in sections 1-8 may depend on them
console.log('\nthe Whispers as an add-on');
const gameText = fs.readFileSync(path.join(__dirname, 'rules.md'), 'utf8')
  .split('--- side ---').join('\n');
const body = gameText.slice(gameText.indexOf('# 1.'));
const mentions = [...body.matchAll(/^.*\b[Ww]hisper.*$/gm)].map((m) => m[0].trim());
say(mentions.length === 0,
  mentions.length ? `the game sections mention the Whispers:\n          ` +
    mentions.map((l) => l.slice(0, 70)).join('\n          ')
  : 'sections 1-8 stand on their own');

build();   // and the sources still parse
console.log(bad ? `\n${bad} problem(s)` : '\neverything agrees');
process.exit(bad ? 1 : 0);
