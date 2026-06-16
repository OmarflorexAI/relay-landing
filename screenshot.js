// Dual-viewport screenshot tool. Usage: node screenshot.js
const puppeteer = require('puppeteer');
const path = require('path');

const fileUrl = 'file:///' + path
  .resolve(__dirname, 'index.html')
  .replace(/\\/g, '/')
  .replace(/ /g, '%20');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function revealAll(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        y += window.innerHeight * 0.8;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 110);
        else { window.scrollTo(0, 0); setTimeout(resolve, 400); }
      };
      step();
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await revealAll(page);
    await new Promise((r) => setTimeout(r, 1200));
    const out = path.resolve(__dirname, `screenshot-${vp.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log('saved', out);
    await page.close();
  }
  await browser.close();
})();
