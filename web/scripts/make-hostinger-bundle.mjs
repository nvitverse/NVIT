// Builds a slim, upload-ready package for Hostinger "Node.js web app" (no node_modules, no secrets, no precompressed duplicates).
// Usage: npm run build && node scripts/make-hostinger-bundle.mjs   ->  ../hostinger-bundle/  (zip it)
import { cpSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync, unlinkSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
const root = new URL('../', import.meta.url).pathname, out = join(root, '..', 'hostinger-bundle');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
cpSync(join(root, 'dist/taxi'), join(out, 'dist/taxi'), { recursive: true });
(function strip(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) strip(p); else if (['.br', '.gz'].includes(extname(n))) unlinkSync(p); } })(out);
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version || '1.0.0';
writeFileSync(join(out, 'package.json'), JSON.stringify({ name: 'droptaxinow', version, private: true, description: 'Drop Taxi Now - prebuilt server bundle (no dependencies)', engines: { node: '>=20' },
  scripts: { start: 'node dist/taxi/server/server.mjs', build: 'echo "prebuilt - nothing to build"' } }, null, 2));
cpSync(join(root, '.env.example'), join(out, '.env.example'));
cpSync(join(root, 'HOSTINGER.md'), join(out, 'HOSTINGER-DEPLOY.md'));
console.log('bundle ready:', out);
