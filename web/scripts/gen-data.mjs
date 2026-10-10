// Generates derived data: distances.json, routes.json, routes.txt (prerender), sitemap.xml, robots.txt
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src/app/data');
const cities = JSON.parse(readFileSync(join(dataDir, 'cities.json'), 'utf8'));
const SITE_URL = 'https://droptaxinow.in';
const ROAD_FACTOR = 1.28; // straight-line -> road distance estimate

// Known highway distances (km) override the estimate. Replace/extend with Google Routes data later.
const KNOWN = {
  'bangalore|chennai': 345, 'chennai|madurai': 460, 'chennai|coimbatore': 505, 'chennai|trichy': 330,
  'chennai|pondicherry': 155, 'chennai|tirupati': 135, 'chennai|vellore': 135, 'chennai|salem': 340,
  'bangalore|coimbatore': 365, 'bangalore|mysore': 145, 'madurai|trichy': 135, 'kanyakumari|madurai': 245,
  'chennai|tiruvannamalai': 195, 'coimbatore|ooty': 85, 'chennai|kanchipuram': 72, 'chennai|thanjavur': 340,
  'chennai|rameswaram': 565, 'chennai|kodaikanal': 520, 'bangalore|salem': 205, 'bangalore|vellore': 215,
  'bangalore|tirupati': 250, 'madurai|rameswaram': 175, 'coimbatore|madurai': 215, 'coimbatore|salem': 165,
  'salem|trichy': 140, 'pondicherry|trichy': 195, 'tirupati|tirumala': 25, 'madurai|tirunelveli': 155,
  'kanyakumari|tirunelveli': 85, 'bangalore|hosur': 40, 'bangalore|ooty': 280
};

const rad = (d) => (d * Math.PI) / 180;
function hav(a, b) {
  const R = 6371, dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const key = (a, b) => [a, b].sort().join('|');

const distances = {};
for (let i = 0; i < cities.length; i++)
  for (let j = i + 1; j < cities.length; j++) {
    const k = key(cities[i].slug, cities[j].slug);
    distances[k] = KNOWN[k] ?? Math.round((hav(cities[i], cities[j]) * ROAD_FACTOR) / 5) * 5;
  }

const routes = [];
for (const a of cities)
  for (const b of cities) {
    if (a.slug === b.slug || !(a.hub || b.hub)) continue;
    const km = distances[key(a.slug, b.slug)];
    // Quality over quantity: avoid thin doorway-style pages. Hub<->hub up to 650 km, hub<->other up to 350 km.
    if (km < 60 || km > (a.hub && b.hub ? 650 : 350)) continue;
    routes.push({ from: a.slug, to: b.slug, km });
  }

const airports = cities.filter((c) => c.airport && !c.airport.startsWith('Nearest')).map((c) => c.slug);

writeFileSync(join(dataDir, 'distances.json'), JSON.stringify(distances));
writeFileSync(join(dataDir, 'routes.json'), JSON.stringify(routes));

const staticPaths = ['/', '/one-way-taxi', '/drop-taxi', '/outstation-taxi', '/airport-taxi', '/services', '/tariff', '/about',
  '/contact', '/faq', '/terms', '/privacy-policy', '/cancellation-policy', '/sitemap'];
const services = ['one-way-taxi', 'drop-taxi', 'outstation-taxi', 'round-trip-taxi', 'airport-transfer', 'local-rental'];
const paths = [
  ...staticPaths,
  ...services.map((s) => `/services/${s}`),
  ...cities.map((c) => `/one-way-taxi/${c.slug}`),
  ...cities.map((c) => `/outstation-taxi/${c.slug}`),
  ...airports.map((s) => `/airport-taxi/${s}`),
  ...routes.map((r) => `/drop-taxi/${r.from}-to-${r.to}`)
];

writeFileSync(join(root, 'routes.txt'), [...paths, '/404'].join('\n') + '\n'); // /404 is prerendered for the server's real-404 response
const today = new Date().toISOString().slice(0, 10);
const prio = (p) => (p === '/' ? '1.0' : p.startsWith('/drop-taxi/') ? '0.6' : p.split('/').length === 2 ? '0.8' : '0.7');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><priority>${prio(p)}</priority></url>`).join('\n') +
  `\n</urlset>\n`;
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public/sitemap.xml'), xml);
writeFileSync(join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`cities=${cities.length} routes=${routes.length} airports=${airports.length} urls=${paths.length}`);
