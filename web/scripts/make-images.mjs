// Builds optimised vehicle images: design/src/vehicles/*.png  ->  public/img/vehicles/<id>-<w>.webp (+ .png fallback at 320w)
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
const IN = new URL('../design/src/vehicles/', import.meta.url).pathname, OUT = new URL('../public/img/vehicles/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const W = [160, 320, 640], RATIO = 5 / 3; // every image is placed on a transparent 5:3 canvas so cards stay uniform
for (const f of readdirSync(IN).filter((x) => x.endsWith('.png'))) {
  const id = f.replace('.png', '');
  const trimmed = await sharp(IN + f).trim({ threshold: 8 }).toBuffer();
  for (const w of W) {
    const h = Math.round(w / RATIO);
    const img = sharp(trimmed).resize({ width: Math.round(w * 0.94), height: Math.round(h * 0.88), fit: 'inside' })
      .extend({ top: 0, bottom: 0, left: 0, right: 0 });
    const body = await img.png().toBuffer({ resolveWithObject: true });
    const canvas = sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: body.data, gravity: 'south' }]);
    await canvas.clone().webp({ quality: 82, effort: 6, alphaQuality: 90 }).toFile(`${OUT}${id}-${w}.webp`);
    if (w === 320) await canvas.clone().png({ compressionLevel: 9, palette: true, quality: 85 }).toFile(`${OUT}${id}-${w}.png`);
  }
}
console.log('vehicle images done');
