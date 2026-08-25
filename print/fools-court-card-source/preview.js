const fs = require('fs');
const path = require('path');
const { BUILD } = require('./cards');
const { STYLES } = require('./art');

const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

const order = ['heraldic', 'midnight', 'deco', 'woodcut'];
const sample = { suit: 'S', rank: '13' };

const LETTERS = ['A', 'B', 'C', 'D'];
let cards = '';
order.forEach((key, i) => {
  const S = STYLES[key];
  const b = BUILD[key];
  cards += `<section class="style">
    <h2><span class="tag">${LETTERS[i]}</span>${S.name}</h2>
    <p class="blurb">${S.blurb}</p>
    <div class="row">
      <figure><div class="card">${b.back('deck')}</div><figcaption>Deck back &times;60</figcaption></figure>
      <figure><div class="card">${b.back('whisper')}</div><figcaption>Whisper back &times;15</figcaption></figure>
      <figure><div class="card">${b.face(sample)}</div><figcaption>Face &mdash; Assassin 13</figcaption></figure>
      <figure><div class="card">${b.face({ suit: 'C', rank: '7' })}</div><figcaption>Face &mdash; Fool 7</figcaption></figure>
    </div>
  </section>`;
});

const html = `<!doctype html><html><head><meta charset="utf-8"><title>The Fool’s Court — card styles</title>
<style>
  body { margin:0; background:#15100e; color:#f2e8dc; font-family:'Lora',Georgia,serif; padding:36px 40px 60px; }
  h1 { font-size:30px; margin:0 0 6px; color:#d9a441; letter-spacing:.02em; }
  .lede { color:#b39c8a; margin:0 0 34px; font-size:15px; max-width:70ch; }
  .style { margin:0 0 42px; padding:24px; background:#211a17; border:1px solid #3d302a; border-radius:14px; }
  h2 { margin:0 0 4px; font-size:21px; color:#e8dcc8; display:flex; align-items:center; gap:12px; }
  .tag { display:inline-grid; place-items:center; width:30px; height:30px; border-radius:50%;
         background:#d9a441; color:#2b1d05; font-size:15px; font-weight:700; }
  .blurb { margin:0 0 18px; color:#a8917f; font-size:14px; }
  .row { display:flex; gap:22px; flex-wrap:wrap; }
  figure { margin:0; }
  .card { width:210px; height:360px; border-radius:12px; overflow:hidden; box-shadow:0 8px 22px rgba(0,0,0,.5); }
  .card svg { display:block; width:100%; height:100%; }
  figcaption { margin-top:8px; font-size:12.5px; color:#8d7a6b; text-align:center; }
</style></head><body>
<h1>The Fool’s Court — four candidate styles</h1>
<p class="lede">Tarot size, 70 &times; 120 mm. Each back is built with 180&deg; rotational symmetry, so it reads the same whichever way the card is dealt. Faces show the rank, the agent's mark, and what that kind promises when sent out on an errand.</p>
${cards}
<p class="lede">Everything here is vector, so colours, the weight of the rules, the emblems and the
type can all be adjusted after you pick a direction &mdash; nothing has to be redrawn.
Next: the four agents' marks and the whole 60-card face set, the 15 Whisper faces, and four
double-sided reference cards, all output as print-ready PDF at 70 &times; 120 mm plus 3 mm bleed.</p>
</body></html>`;

fs.writeFileSync(path.join(outDir, 'styles.html'), html);
console.log('wrote out/styles.html');
