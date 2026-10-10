import { isMainModule } from '@angular/ssr/node';
import express from 'express';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeFare } from './app/core/fare';
import { CITY_MAP, VEHICLES, distanceKm } from './app/data';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const CANONICAL_HOST = 'droptaxinow.in';
const LEADS_FILE = process.env['LEADS_FILE'] || join(process.cwd(), 'data', 'leads.jsonl');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '10kb' }));

// Security headers + canonical host (www -> apex)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (req.hostname === `www.${CANONICAL_HOST}`) { res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`); return; }
  next();
});

// Basic in-memory rate limit for the lead endpoint
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}

/** Server-side authoritative quote. */
app.post('/api/lead', async (req, res): Promise<void> => {
  if (limited(req.ip ?? 'x')) { res.status(429).json({ error: 'Too many requests' }); return; }
  const b = req.body ?? {};
  const name = String(b.name ?? '').trim().slice(0, 80);
  const phone = String(b.phone ?? '').trim();
  const from = String(b.from ?? ''), to = String(b.to ?? '');
  const trip = b.trip === 'round' ? 'round' : 'oneway';
  const km = distanceKm(from, to);
  if (!name || !/^[6-9]\d{9}$/.test(phone) || !CITY_MAP.has(from) || !CITY_MAP.has(to) || !km) { res.status(400).json({ error: 'Invalid request' }); return; }
  const date = String(b.date ?? '').slice(0, 10), returnDate = String(b.returnDate ?? '').slice(0, 10);
  const days = trip === 'round' && date && returnDate ? Math.max(1, Math.round((Date.parse(returnDate) - Date.parse(date)) / 86400000) + 1) : 1;
  const quotes = VEHICLES.map((v) => ({ vehicle: v.id, total: computeFare({ km, trip, days, vehicle: v }).total }));
  const lead = { at: new Date().toISOString(), name, phone, from, to, trip, date, returnDate, time: String(b.time ?? '').slice(0, 5), km, days, quotes, page: String(b.page ?? '').slice(0, 120) };
  try {
    mkdirSync(dirname(LEADS_FILE), { recursive: true });
    appendFileSync(LEADS_FILE, JSON.stringify(lead) + '\n');
  } catch (e) { console.error('lead save failed', e); }
  notify(lead).catch((e) => console.error('notify failed', e));
  res.json({ ok: true });
});

/** Optional Telegram notification. Secrets come only from environment variables. */
async function notify(lead: Record<string, unknown>): Promise<void> {
  const token = process.env['TELEGRAM_BOT_TOKEN'], chat = process.env['TELEGRAM_CHAT_ID'];
  if (!token || !chat) return;
  const sedan = (lead['quotes'] as { vehicle: string; total: number }[])[0];
  const text = `New taxi lead\n${lead['name']} ${lead['phone']}\n${lead['from']} → ${lead['to']} (${lead['km']} km)\n${lead['trip']} ${lead['date']} ${lead['time']}\nSedan ₹${sedan?.total}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text }) });
}

const cacheHeaders = (res: express.Response, path: string) => {
  if (/\.(html)$/.test(path)) res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  else if (/-[A-Z0-9]{8}\.(js|css)$/.test(path)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else res.setHeader('Cache-Control', 'public, max-age=86400');
};

// Static assets (no automatic directory redirect so canonical URLs stay without trailing slash)
app.get('**', express.static(browserDistFolder, { index: false, redirect: false, setHeaders: (res, p) => cacheHeaders(res, p) }));

// Prerendered pages: /path -> /path/index.html. Trailing slash -> 301 to canonical.
app.get('**', (req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) { res.redirect(301, req.path.slice(0, -1) + (req.url.slice(req.path.length) || '')); return; }
  if (req.path === '/404') { next(); return; }
  const file = join(browserDistFolder, req.path === '/' ? '' : req.path, 'index.html');
  if (file.startsWith(browserDistFolder) && existsSync(file)) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.sendFile(file);
    return;
  }
  next();
});

// Anything else: real HTTP 404 with the prerendered not-found page (no soft-404s).
app.get('**', (_req, res) => {
  res.status(404).setHeader('Cache-Control', 'no-store');
  res.sendFile(join(browserDistFolder, '404', 'index.html'));
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

export default app;
