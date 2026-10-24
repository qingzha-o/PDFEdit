import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await page.emulateMedia({ media: 'print' });
for (const [html, pdf] of [['tools/sample.html','sample.pdf'], ['tools/sample-replacement.html','sample-replacement.pdf']]) {
  await page.goto('file:///' + path.resolve(html).replace(/\\/g,'/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  const size = fs.statSync(pdf).size;
  console.log(pdf, (size/1024/1024).toFixed(2)+' MB');
}
await browser.close();
