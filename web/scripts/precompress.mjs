// Pre-compresses text assets (brotli + gzip) next to the originals so the server can serve them without CPU cost.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
const root = new URL('../dist/taxi/browser/', import.meta.url).pathname;
const EXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt', '.mjs', '.webmanifest']);
let files = 0, raw = 0, br = 0;
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n), s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (EXT.has(extname(n)) && s.size > 512) {
      const buf = readFileSync(p);
      const b = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 9, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
      writeFileSync(p + '.br', b); writeFileSync(p + '.gz', gzipSync(buf, { level: 9 }));
      files++; raw += buf.length; br += b.length;
    }
  }
})(root);
console.log(`precompressed ${files} files: ${(raw / 1048576).toFixed(1)} MB -> ${(br / 1048576).toFixed(1)} MB (brotli)`);
