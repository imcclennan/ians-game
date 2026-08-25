const fs = require('fs');
const T = JSON.parse(fs.readFileSync('out/thumbs.json', 'utf8'));
const WH = require('./whispers-data');
const { ROLE } = require('./art');

const deckList = [];
let n = 0;
for (const s of ['C','D','H','S']) for (let r=1;r<=15;r++){ n++;
  deckList.push(`deck-${String(n).padStart(2,'0')}_${ROLE[s]}-${String(r).padStart(2,'0')}.jpg`); }
const whList = WH.map((w,i)=>`whisper-${String(i+1).padStart(2,'0')}_${w.name.replace(/[^A-Za-z]+/g,'-').replace(/^-|-$/g,'')}.jpg`);

const html = `<title>Fool&rsquo;s Court Print Kit</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Karla:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{
  --oxblood:#4a1524; --gold:#a87b28; --indigo:#1a2050;
  --ground:#f6efe2; --panel:#fffaf0; --line:#ddcdb4;
  --ink:#2a1118; --ink-2:#6a5347; --ink-3:#93796a;
  --shadow:0 1px 2px rgba(74,21,36,.06), 0 10px 30px rgba(74,21,36,.09);
}
:root:not([data-theme="light"]) { }
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --oxblood:#e0a4b4; --gold:#d9ad52; --indigo:#a9b3e8;
    --ground:#17100f; --panel:#211917; --line:#3b2c28;
    --ink:#f2e6d8; --ink-2:#c2ab99; --ink-3:#93796a;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 34px rgba(0,0,0,.45);
  }
}
:root[data-theme="dark"]{
  --oxblood:#e0a4b4; --gold:#d9ad52; --indigo:#a9b3e8;
  --ground:#17100f; --panel:#211917; --line:#3b2c28;
  --ink:#f2e6d8; --ink-2:#c2ab99; --ink-3:#93796a;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 12px 34px rgba(0,0,0,.45);
}
*{box-sizing:border-box;}
body{margin:0;background:var(--ground);color:var(--ink);
  font-family:'Karla',ui-sans-serif,system-ui,sans-serif;font-size:16.5px;line-height:1.62;}
.wrap{max-width:920px;margin:0 auto;padding:56px 26px 100px;}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;text-wrap:balance;margin:0;}
h1{font-size:clamp(38px,6vw,58px);font-weight:600;line-height:1.06;letter-spacing:.005em;}
h2{font-size:clamp(25px,3.4vw,32px);font-weight:600;line-height:1.15;}
h3{font-size:20px;font-weight:700;line-height:1.25;}
p{margin:0;}
a{color:var(--oxblood);}
.eyebrow{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.19em;
  text-transform:uppercase;color:var(--gold);font-weight:500;}
.lede{font-size:19px;color:var(--ink-2);max-width:64ch;}
header{display:flex;flex-direction:column;gap:14px;padding-bottom:34px;
  border-bottom:2px solid var(--oxblood);}
main{display:flex;flex-direction:column;gap:56px;padding-top:44px;}
section{display:flex;flex-direction:column;gap:18px;}
.sechead{display:flex;flex-direction:column;gap:6px;}
.prose{max-width:66ch;color:var(--ink-2);display:flex;flex-direction:column;gap:12px;}
.prose strong{color:var(--ink);font-weight:700;}
mono,.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.88em;}
code{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.86em;background:var(--panel);
  border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--ink);}

/* three orders */
.orders{display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:18px;}
.order{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:20px 20px 22px;
  box-shadow:var(--shadow);display:flex;flex-direction:column;gap:12px;
  border-top:3px solid var(--oxblood);}
.order .qty{font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;line-height:1;
  font-weight:600;color:var(--oxblood);font-variant-numeric:tabular-nums;}
.order .qty small{font-size:15px;font-family:'Karla',sans-serif;color:var(--ink-3);
  letter-spacing:.02em;margin-left:6px;font-weight:500;}
.order dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:5px 14px;font-size:14.5px;}
.order dt{color:var(--ink-3);}
.order dd{margin:0;color:var(--ink);font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12.6px;
  word-break:break-word;}
.thumbrow{display:flex;gap:10px;min-width:0;}
.thumbrow img{flex:1 1 0;min-width:0;width:100%;height:auto;border-radius:2px;
  border:1px solid var(--line);display:block;}

/* spec table */
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:3px;background:var(--panel);}
table{border-collapse:collapse;width:100%;font-size:15px;}
th,td{text-align:left;padding:11px 16px;border-bottom:1px solid var(--line);}
th{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-3);font-weight:500;}
tr:last-child td{border-bottom:0;}
td.v{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13.4px;font-variant-numeric:tabular-nums;}

/* steps */
ol.steps{margin:0;padding:0;list-style:none;counter-reset:s;display:flex;flex-direction:column;gap:14px;}
ol.steps li{counter-increment:s;display:grid;grid-template-columns:30px 1fr;gap:14px;align-items:start;}
ol.steps li::before{content:counter(s);font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;
  color:var(--gold);border:1px solid var(--line);border-radius:50%;width:28px;height:28px;
  display:grid;place-items:center;margin-top:2px;}
ol.steps li > div{color:var(--ink-2);}
ol.steps strong{color:var(--ink);}

.sheet{border:1px solid var(--line);border-radius:3px;overflow:hidden;background:var(--panel);}
.sheet img{width:100%;display:block;}
figcaption{font-size:13.5px;color:var(--ink-3);padding:10px 14px;border-top:1px solid var(--line);}

details{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:0;}
summary{cursor:pointer;padding:13px 18px;font-weight:700;font-size:15px;}
summary:focus-visible{outline:2px solid var(--gold);outline-offset:-2px;}
.filelist{padding:2px 18px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));
  gap:2px 18px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12.2px;color:var(--ink-2);}

.callout{border-left:3px solid var(--gold);background:var(--panel);padding:16px 20px;
  display:flex;flex-direction:column;gap:8px;color:var(--ink-2);border-radius:0 3px 3px 0;}
.callout b{color:var(--ink);}
footer{margin-top:70px;padding-top:22px;border-top:1px solid var(--line);color:var(--ink-3);font-size:14px;}
</style>

<div class="wrap">
<header>
  <div class="eyebrow">Print files &middot; 86 images &middot; tarot 70 &times; 120 mm</div>
  <h1>The Fool&rsquo;s Court<br>print kit</h1>
  <p class="lede">Everything for PrinterStudio, cut into the three separate orders the job actually
  needs &mdash; because a deck can only carry one back, and this game has three.</p>
</header>

<main>

<section>
  <div class="sechead"><div class="eyebrow">Start here</div><h2>Three orders, not one</h2></div>
  <div class="prose">
    <p>PrinterStudio prints one back image across a whole deck. The 60 numbered agents, the 15
    Whispers and the reference cards each carry a different back, so they are ordered separately and
    shuffled together at home. Pick the smallest deck-size tier that fits each count.</p>
  </div>
  <div class="orders">
    <div class="order">
      <div class="qty">60<small>cards</small></div>
      <h3>The agents</h3>
      <div class="thumbrow"><img src="${T['th-back-deck']}" alt="Deck back: oxblood and gold, crowned medallion"></div>
      <dl>
        <dt>Tier</dt><dd>up to 78</dd>
        <dt>Folder</dt><dd>1-deck-60/</dd>
        <dt>Back</dt><dd>back-deck.jpg</dd>
        <dt>Faces</dt><dd>faces/deck-01 &hellip; deck-60</dd>
      </dl>
    </div>
    <div class="order">
      <div class="qty">22<small>cards</small></div>
      <h3>The Whispers</h3>
      <div class="thumbrow"><img src="${T['th-back-whisper']}" alt="Whisper back: indigo night with a sealed letter"></div>
      <dl>
        <dt>Tier</dt><dd>up to 27</dd>
        <dt>Folder</dt><dd>2-whispers-22/</dd>
        <dt>Back</dt><dd>back-whisper.jpg</dd>
        <dt>Faces</dt><dd>faces/whisper-01 &hellip; whisper-22</dd>
      </dl>
    </div>
    <div class="order">
      <div class="qty">4<small>cards</small></div>
      <h3>Quick reference</h3>
      <div class="thumbrow">
        <img src="${T['th-ref-f']}" alt="Reference card front: sequence of play">
        <img src="${T['th-ref-b']}" alt="Reference card back: favour and sway">
      </div>
      <dl>
        <dt>Tier</dt><dd>up to 10</dd>
        <dt>Folder</dt><dd>3-reference/</dd>
        <dt>Back</dt><dd>reference-back.jpg</dd>
        <dt>Face</dt><dd>reference-front.jpg &times;4</dd>
      </dl>
    </div>
  </div>
  <div class="callout">
    <p><b>Why four identical reference cards.</b> One per player, so nobody passes anything around.
    Upload the same front image four times; the back is the deck back for that order, which is the
    scoring side.</p>
    <p><b>The Whisper order grew.</b> There are 22 Whispers now, not 15, so that order moves up to
    the 27-card tier. Nothing else about it changes &mdash; the back image is the same file as
    before.</p>
  </div>
</section>

<section>
  <div class="sechead"><div class="eyebrow">The numbers</div><h2>What every file is</h2></div>
  <div class="tablewrap">
    <table>
      <tr><th>Property</th><th>Value</th><th>Why</th></tr>
      <tr><td>Pixel size</td><td class="v">900 &times; 1500</td><td>Above the 897 &times; 1497 minimum</td></tr>
      <tr><td>Resolution</td><td class="v">300 DPI</td><td>3.00&Prime; &times; 5.00&Prime; at that pixel size</td></tr>
      <tr><td>Finished card</td><td class="v">2.75&Prime; &times; 4.75&Prime;</td><td>70 &times; 120 mm tarot</td></tr>
      <tr><td>Bleed</td><td class="v">1/8&Prime; each edge</td><td>Art runs past the cut on all four sides</td></tr>
      <tr><td>Safe zone</td><td class="v">1/8&Prime; inside the cut</td><td>No text or rule crosses it</td></tr>
      <tr><td>Format</td><td class="v">JPEG, quality 96</td><td>4:4:4 chroma, no colour smearing on the gold</td></tr>
      <tr><td>Colour</td><td class="v">sRGB</td><td>Converted to CMYK by the printer</td></tr>
      <tr><td>Largest file</td><td class="v">545 KB</td><td>Limit is 32 MB</td></tr>
    </table>
  </div>
</section>

<section>
  <div class="sechead"><div class="eyebrow">At the site</div><h2>Uploading</h2></div>
  <ol class="steps">
    <li><div>Open <strong>Tarot size custom cards &mdash; blank cards</strong> and choose the deck-size
    tier from the order above. Card stock is your call; <strong>smooth</strong> shows the fine gold
    rules better than linen.</div></li>
    <li><div>Set the back first. Choose <strong>same image on all card backs</strong> and upload the
    single <code>back-*.jpg</code> for that order.</div></li>
    <li><div>Upload the faces from the <code>faces/</code> folder. They are numbered in dealing
    order, so a multi-select upload lands them in sequence: Fools 1&ndash;15, Merchants, Lovers,
    Assassins.</div></li>
    <li><div>Do not scale, rotate or nudge anything in their editor. Each image already carries its
    own bleed &mdash; drop it in at 100% and leave it.</div></li>
    <li><div>Check the on-screen proof for the <strong>rounded corners</strong>. Nothing important
    sits within 3 mm of the cut, so the corners should clip only background.</div></li>
  </ol>
  <div class="callout">
    <p><b>Order one sample deck first.</b> Deep oxblood and indigo shift more in CMYK than pale
    colours do, and the gold is the first thing to go muddy on the wrong stock. A single 15-card
    Whisper deck is the cheapest way to see how the ink actually lands before committing to 60.</p>
  </div>
</section>

<section>
  <div class="sechead"><div class="eyebrow">Proof</div><h2>Every card, at a glance</h2></div>
  <figure class="sheet" style="margin:0">
    <img src="${T['th-deck']}" alt="Contact sheet of all sixty numbered agent faces">
    <figcaption>The 60 agents, unchanged this round. Rank at both corners, the kind&rsquo;s mark, and
    what that kind promises on an errand &mdash; Fool 0, Merchant 1, Lover 2, Assassin 3.</figcaption>
  </figure>
  <figure class="sheet" style="margin:0">
    <img src="${T['th-whisper']}" alt="Contact sheet of all twenty-two Whisper faces, the last seven in oxblood">
    <figcaption>All 22 Whispers. The seven <strong>burdens</strong> are framed in oxblood under a
    broken seal and signed &ldquo;A Burden&rdquo;, so they read at a glance face up &mdash; and they
    share the one Whisper back, so they are invisible face down. Wording is verbatim from
    <code>js/whispers.js</code>.</figcaption>
  </figure>
</section>

<section>
  <div class="sechead"><div class="eyebrow">Index</div><h2>File list</h2></div>
  <details>
    <summary>1-deck-60 &mdash; 60 faces + 1 back</summary>
    <div class="filelist"><span>back-deck.jpg</span>${deckList.map(f=>`<span>${f}</span>`).join('')}</div>
  </details>
  <details>
    <summary>2-whispers-22 &mdash; 22 faces + 1 back</summary>
    <div class="filelist"><span>back-whisper.jpg</span>${whList.map(f=>`<span>${f}</span>`).join('')}</div>
  </details>
  <details>
    <summary>3-reference &mdash; 2 sides</summary>
    <div class="filelist"><span>reference-front.jpg</span><span>reference-back.jpg</span></div>
  </details>
</section>

<section>
  <div class="sechead"><div class="eyebrow">Also in the box</div><h2>The rulesheet</h2></div>
  <div class="prose">
    <p>The full rules on one 8.5&Prime; &times; 5.5&Prime; leaf, printed both sides, three columns a
    side &mdash; a boxed-game insert rather than a document. Sections are numbered to match the
    app&rsquo;s own Rules panel, so &ldquo;see 8&rdquo; means the same thing in both. It opens with a
    Contents list and an <em>In this box</em> panel, and closes with all 22 Whispers in full.</p>
  </div>
  <figure class="sheet" style="margin:0">
    <img src="${T['th-rules']}" alt="Both sides of the rulesheet, three columns each">
    <figcaption>Both sides at actual proportions. Delivered as <code>fools-court-rules.pdf</code>
    with fonts embedded and the text selectable.</figcaption>
  </figure>
</section>

<section>
  <div class="sechead"><div class="eyebrow">Read this before printing</div><h2>One thing the repo
  disagrees with itself about</h2></div>
  <div class="callout">
    <p><b>Pledging nothing.</b> <code>js/rules.js</code> scores a pledge of nothing as
    <b>+8 for taking no audiences and &minus;8 for taking any</b>, however many &mdash; and
    <code>test/rules.test.js</code> asserts exactly that. The prose in <code>js/rulebook.js</code>
    still describes the older ladder (+5, then &minus;5 for the first and &minus;2 for each after).
    The cards and the rulesheet follow the <b>code</b>, since that is what the game actually does.
    If the prose is the version you want, say so and it is a two-line change here.</p>
  </div>
  <div class="prose">
    <p>Two smaller staleness notes, for when you next touch the repo:
    <code>print/whispers.html</code> still says &ldquo;Fifteen Whisper cards&rdquo;, and
    <code>bidCardValue</code> in <code>rules.js</code> is commented as summing
    &ldquo;three&rdquo; bid cards when it sums four.</p>
  </div>
</section>

<section>
  <div class="sechead"><div class="eyebrow">Changed this round</div><h2>What moved</h2></div>
  <div class="tablewrap">
    <table>
      <tr><th>What</th><th>Was</th><th>Now</th></tr>
      <tr><td>Whisper cards</td><td class="v">15</td><td class="v">22, seven of them burdens</td></tr>
      <tr><td>A hand is called</td><td class="v">a session</td><td class="v">a night</td></tr>
      <tr><td>Season ends</td><td class="v">first past 50 favour</td><td class="v">after 12 nights, on Twelfth Night</td></tr>
      <tr><td>Pledged nothing</td><td class="v">+5 / &minus;5 then &minus;2 each</td><td class="v">+8 / &minus;8 flat</td></tr>
      <tr><td>Taking a Whisper</td><td class="v">dealt to everyone</td><td class="v">optional, unread, only if behind</td></tr>
      <tr><td>Blackmailed</td><td class="v">+5</td><td class="v">+6</td></tr>
      <tr><td>The Bold</td><td class="v">+5</td><td class="v">+6</td></tr>
      <tr><td>The Meek</td><td class="v">&minus;4</td><td class="v">&minus;3</td></tr>
      <tr><td>The Cautious Clerk</td><td class="v">caps at 6</td><td class="v">caps at 7</td></tr>
      <tr><td>The Understudy</td><td class="v">the noble on your left</td><td class="v">the noble on your right</td></tr>
    </table>
  </div>
  <div class="prose">
    <p>The 60 agent faces and both card backs are untouched &mdash; nothing in the rules changed what
    is printed on them. Everything is still vector until the last step, so colour, rule weights, type
    sizes and wording are one edit and one re-render.</p>
  </div>
</section>

</main>

<footer>Built from <code>imcclennan/ians-game</code> as synced on 21 August 2026 &mdash;
<code>js/whispers.js</code>, <code>js/rules.js</code> and <code>js/rulebook.js</code>.</footer>
</div>`;
fs.writeFileSync('out/print-kit.html', html);
console.log('wrote', (html.length/1024).toFixed(0)+'KB');
