import { isMainModule } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './server/api';

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
