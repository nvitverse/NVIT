// Notify Bing / Yandex / Seznam (IndexNow) about every URL in the sitemap. Google does NOT use IndexNow (use Search Console).
// Usage: INDEXNOW_KEY=<key> node scripts/indexnow.mjs   (the key must also be set on the server so https://droptaxinow.in/<key>.txt is live)
import { readFileSync } from 'node:fs';
const key = process.env.INDEXNOW_KEY, host = 'droptaxinow.in';
if (!key) { console.error('Set INDEXNOW_KEY'); process.exit(1); }
const urls = [...readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
for (let i = 0; i < urls.length; i += 9000) {
  const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls.slice(i, i + 9000) }) });
  console.log(`submitted ${Math.min(9000, urls.length - i)} urls -> HTTP ${res.status}`);
}
