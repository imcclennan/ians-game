/*
 * fit.js — does every side of every leaf actually fit?
 *
 * Two ways to overflow, and the sheets use both kinds of column. With
 * `column-fill: auto` content spills sideways into a fourth column that the
 * side then clips, so the symptom is horizontal. With `column-fill: balance`
 * it spills downward past the bottom of the box, and the symptom is vertical.
 * A check that only measures one of them passes a broken sheet, which is how
 * a paragraph went missing off the bottom of side 1 once already.
 *
 * Also checks that nothing runs under the runner along the foot.
 */
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT ||
  '/home/claude/.npm-global/lib/node_modules/playwright');

const SHEETS = ['out/rulesheet.html', 'out/whispersheet.html'];
// Every block that carries text. `.w` is listed on its own rather than as
// `.wl > div`: the Whisper entries moved out of that wrapper, the selector was
// not updated with them, and the check went blind to the one kind of element
// that was actually overflowing.
const SEL = 'h2, h3, p, table, ol, ul, li, .toc, .kit, .ex, .ex > div, .w, .wgroup';

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const file of SHEETS) {
    const page = await browser.newPage({ viewport: { width: 816, height: 528 } });
    await page.goto('file://' + path.resolve(file));
    await page.evaluate(() => document.fonts.ready);
    const sides = await page.evaluate((sel) =>
      [...document.querySelectorAll('.side')].map((side, i) => {
        const cols = side.querySelector('.cols');
        const box = cols.getBoundingClientRect();
        const runner = side.querySelector('.runner');
        const runnerTop = runner ? runner.getBoundingClientRect().top : Infinity;
        let right = 0, bottom = 0, under = 0, last = '';
        for (const el of cols.querySelectorAll(sel)) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 && b.height === 0) continue;
          if (b.right - box.left > right) { right = b.right - box.left; }
          if (b.bottom - box.top > bottom) {
            bottom = b.bottom - box.top;
            last = el.textContent.trim().slice(0, 46).replace(/\s+/g, ' ');
          }
          if (b.bottom > runnerTop) under++;
        }
        // With column-fill:auto every full column reaches the bottom, so the
        // overall height saturates at 100% and says nothing about slack. What
        // slack there is lives in the last column, so measure that separately.
        const colW = box.width / 3;
        const deepest = [0, 0, 0];
        for (const el of cols.querySelectorAll(sel)) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 && b.height === 0) continue;
          const col = Math.min(2, Math.max(0, Math.floor((b.left - box.left + 2) / colW)));
          deepest[col] = Math.max(deepest[col], b.bottom - box.top);
        }
        return {
          side: i + 1,
          wide: Math.round(box.width), needWide: Math.round(right),
          tall: Math.round(box.height), needTall: Math.round(bottom),
          cols: deepest.map(Math.round),
          under, last
        };
      }), SEL);

    // The four rank lists must each hold one line. The Merchants run all
    // fifteen ranks and are within a couple of pixels of their column, so this
    // is the first thing an edit to the deck or the type size will break.
    const ranks = await page.evaluate(() =>
      [...document.querySelectorAll('.kind')].map((k) => {
        const span = k.querySelector('.kh .kranks');
        if (!span) return null;
        const cs = getComputedStyle(span);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const kind = k.querySelector('.kh').textContent.trim().split(/[\s0-9]/)[0];
        const row = k.querySelector('.kh');
        const lines = Math.round(span.getBoundingClientRect().height / lh);
        // Headroom is the row minus the name minus what the ranks actually
        // need. Measured by hiding the span to get the name's own width,
        // because while the span is in the flex row the two shrink together
        // and the difference always reads zero.
        // Headroom is the row, less the name and the flex gap, less what the
        // ranks actually need on one line. The name is measured from its own
        // element: .kh fills the column, so hiding the span tells you nothing.
        const need = span.scrollWidth;
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        const nameW = row.querySelector('.kname').scrollWidth;
        return { kind, lines, spare: Math.round(row.clientWidth - nameW - gap - need) };
      }).filter(Boolean));

    console.log(file);
    for (const r of ranks) {
      const ok = r.lines === 1;
      if (!ok) bad++;
      console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${r.kind} ranks: ${r.lines} line(s)` +
        `, ${r.spare}px spare`);
    }
    for (const s of sides) {
      const overW = s.needWide - s.wide, overH = s.needTall - s.tall;
      const problems = [];
      if (overW > 2) problems.push(`spills ${overW}px past the last column`);
      if (overH > 2) problems.push(`runs ${overH}px below the box (last: "${s.last}")`);
      if (s.under > 0) problems.push(`${s.under} block(s) under the runner`);
      if (problems.length) bad++;
      // Balanced columns can fit and still look wrong: a leaf that uses half
      // its box reads as unfinished, so the fill is reported alongside.
      const used = s.cols.reduce((a, b) => a + b, 0);
      const fill = Math.round(100 * used / (3 * s.tall));
      const sparse = fill < 85 && overH <= 2 && overW <= 2;
      console.log(`  ${problems.length ? 'FAIL' : 'ok  '}  side ${s.side}: ` +
        `columns ${s.cols.join(' / ')} of ${s.tall}px  (${fill}% full)` +
        `${sparse ? '  — sparse' : ''}` +
        (problems.length ? '\n          ' + problems.join('\n          ') : ''));
    }
    await page.close();
  }
  await browser.close();
  console.log(bad ? `\n${bad} side(s) do not fit` : '\nevery side fits');
  process.exit(bad ? 1 : 0);
})();
