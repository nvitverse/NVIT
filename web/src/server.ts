import { isMainModule } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './server/api';
import { env } from './server/env';
import { mailConfigured } from './server/mail';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const CANONICAL_HOST = 'droptaxinow.in';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Security headers + canonical host (www -> apex)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  if (req.hostname === `www.${CANONICAL_HOST}`) { res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`); return; }
  next();
});

app.use('/api', apiRouter());

// Search-engine verification files (configured by env, so no rebuild is needed)
app.get('/:file', (req, res, next) => {
  const f = req.params['file'];
  if (env.gscFile && f === env.gscFile) { res.type('text/html').send(`google-site-verification: ${env.gscFile}`); return; }
  if (env.indexNowKey && f === `${env.indexNowKey}.txt`) { res.type('text/plain').send(env.indexNowKey); return; }
  next();
});

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
/** Serves file.br / file.gz (made by scripts/precompress.mjs) when the browser accepts it. Returns false if not handled. */
function sendEncoded(req: express.Request, res: express.Response, file: string): boolean {
  const type = MIME[extname(file)];
  if (!type) return false;
  const accept = String(req.headers['accept-encoding'] || '');
  const enc = /\bbr\b/.test(accept) && existsSync(file + '.br') ? 'br' : /\bgzip\b/.test(accept) && existsSync(file + '.gz') ? 'gzip' : '';
  res.setHeader('Vary', 'Accept-Encoding');
  if (!enc) {
    // No precompressed copy shipped (e.g. slim upload bundle): gzip once, keep in memory.
    if (/\bgzip\b/.test(accept)) {
      try {
        let buf = gzCache.get(file);
        if (!buf && statSync(file).size < 3_000_000) { buf = gzipSync(readFileSync(file), { level: 6 }); if (gzCache.size > 400) gzCache.delete(gzCache.keys().next().value as string); gzCache.set(file, buf); }
        if (buf) { res.setHeader('Content-Encoding', 'gzip'); res.setHeader('Content-Type', type); res.send(buf); return true; }
      } catch { /* fall through to plain */ }
    }
    return false;
  }
  res.setHeader('Content-Encoding', enc);
  res.setHeader('Content-Type', type);
  res.sendFile(file + (enc === 'br' ? '.br' : '.gz'));
  return true;
}

const gzCache = new Map<string, Buffer>();
const cacheHeaders = (res: express.Response, path: string) => {
  if (/\.(html)$/.test(path)) res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  else if (/-[A-Z0-9]{8}\.(js|css)$/.test(path)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else res.setHeader('Cache-Control', 'public, max-age=86400');
};

// Compressed static assets first (brotli/gzip), then plain files. No automatic directory redirect so canonical URLs stay without trailing slash.
app.get('**', (req, res, next) => {
  const file = join(browserDistFolder, decodeURIComponent(req.path));
  if (!file.startsWith(browserDistFolder) || !extname(file) || !existsSync(file)) { next(); return; }
  cacheHeaders(res, file);
  if (!sendEncoded(req, res, file)) next();
});
app.get('**', express.static(browserDistFolder, { index: false, redirect: false, setHeaders: (res, p) => cacheHeaders(res, p) }));

// Prerendered pages: /path -> /path/index.html. Trailing slash -> 301 to canonical.
app.get('**', (req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) { res.redirect(301, req.path.slice(0, -1) + (req.url.slice(req.path.length) || '')); return; }
  if (req.path === '/404') { next(); return; }
  const file = join(browserDistFolder, req.path === '/' ? '' : req.path, 'index.html');
  if (file.startsWith(browserDistFolder) && existsSync(file)) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    if (!sendEncoded(req, res, file)) res.sendFile(file);
    return;
  }
  next();
});

// Anything else: real HTTP 404 with the prerendered not-found page (no soft-404s).
app.get('**', (_req, res) => {
  res.status(404).setHeader('Cache-Control', 'no-store');
  const nf = join(browserDistFolder, '404', 'index.html');
  if (!sendEncoded(_req, res, nf)) res.sendFile(nf);
});

// Start when run directly, or when a host/wrapper (PORT / Passenger) loads this file as a module.
const viaHost = !!process.env['PORT'] || !!process.env['PASSENGER_APP_ENV'];
if (isMainModule(import.meta.url) || viaHost) {
  const onListen = () => console.log(`[startup] Drop Taxi Now server up | mail:${mailConfigured()} maps:${!!env.mapsKey} adminSync:${!!(env.adminSync.enquiryUrl || env.adminSync.confirmUrl)} data:${env.dataDir}`);
  if (process.env['PASSENGER_APP_ENV'] && !process.env['PORT']) app.listen('passenger' as unknown as number, onListen);
  else app.listen(env.port, onListen);
}

export default app;
