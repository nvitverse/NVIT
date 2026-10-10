// Renders design/og.html -> public/og-default.png (1200x630) with Chromium (Playwright), then optimises it with sharp.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url).pathname;
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file://' + root + 'design/og.html'); await p.waitForTimeout(800);
const png = await p.screenshot(); await b.close();
writeFileSync(root + 'public/og-default.png', await sharp(png).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer());
writeFileSync(root + 'public/og-default.jpg', await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
console.log('og image done');
