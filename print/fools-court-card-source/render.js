const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || '/home/claude/.npm-global/lib/node_modules/playwright');

/** items: [{ name, html }] -> PNG at 900x1500 (rendered 2x then downsampled) */
async function renderAll(items, dir, scale = 2) {
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 1500 }, deviceScaleFactor: scale });
  for (const it of items) {
    const tmp = path.join('/tmp', 'card.html');
    fs.writeFileSync(tmp, it.html);
    await p.goto('file://' + tmp);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(dir, it.name + '.png') });
  }
  await b.close();
}
module.exports = { renderAll };
