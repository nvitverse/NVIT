// Generates favicons, app icons, manifest assets from design/mark*.svg  (run: node scripts/make-brand.mjs)
import sharp from 'sharp';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
const D = new URL('../design/', import.meta.url).pathname, P = new URL('../public/', import.meta.url).pathname;
mkdirSync(P + 'img', { recursive: true });
const mark = readFileSync(D + 'mark.svg'), mask = readFileSync(D + 'mark-maskable.svg');
const png = (svg, size) => sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
copyFileSync(D + 'mark.svg', P + 'favicon.svg');
const sizes = { 'favicon-16x16.png': 16, 'favicon-32x32.png': 32, 'favicon-48x48.png': 48, 'apple-touch-icon.png': 180 };
for (const [n, s] of Object.entries(sizes)) writeFileSync(P + n, await png(mark, s));
writeFileSync(P + 'icon-192.png', await png(mark, 192)); writeFileSync(P + 'icon-512.png', await png(mark, 512));
writeFileSync(P + 'icon-maskable-512.png', await png(mask, 512));
// favicon.ico (PNG-compressed entries 16/32/48)
const ico = [16, 32, 48]; const imgs = await Promise.all(ico.map((s) => png(mark, s)));
const head = Buffer.alloc(6 + 16 * ico.length); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(ico.length, 4);
let off = head.length; imgs.forEach((b, i) => { const o = 6 + 16 * i; head[o] = ico[i]; head[o + 1] = ico[i]; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(b.length, o + 8); head.writeUInt32LE(off, o + 12); off += b.length; });
writeFileSync(P + 'favicon.ico', Buffer.concat([head, ...imgs]));
writeFileSync(P + 'img/logo-mark.png', await png(mark, 128));
writeFileSync(P + 'site.webmanifest', JSON.stringify({
  name: 'Drop Taxi Now', short_name: 'Drop Taxi Now', description: 'One way drop taxi across South India', start_url: '/', scope: '/', display: 'standalone',
  background_color: '#ffffff', theme_color: '#f5b800', lang: 'en-IN',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
}, null, 2));
console.log('brand assets done');
