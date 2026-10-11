# drop1taxi.com: SEO recovery prompt (paste into the LOCAL Claude session that has the drop1taxi PHP source)

---

Reply to me in Tanglish, expert level. Mark what is confirmed (from files/data) vs your suggestion.

## Situation (confirmed from Google Search Console, export dated 2026-10-11)
drop1taxi.com (PHP on Hostinger) has ~3,020 pages indexed and 3,304 not indexed, but impressions collapsed: July ~130/day, August ~27/day, September ~2/day. Total ~38 clicks in 3 months; searching the brand shows nothing. No manual action, no security issue. Review-snippets structured-data errors since Jul 17. Not-indexed reasons (pages):
- Alternate page with proper canonical tag: 1,245
- Discovered - currently not indexed: 1,056
- Duplicate, Google chose different canonical than user: 698
- Crawled - currently not indexed: 199
- Page with redirect: 78
- Not found (404): 20
- Redirect error: 4
- Server error (5xx): 2
- Excluded by noindex: 1, Blocked by robots.txt: 1

My earlier crawl of the live site (confirmed): any slug returns a priced indexable route page (`/drop-taxi/chennai-nowhereville` = 200, `/drop-taxi/chennai-chennai` = 200), unknown root URLs return 200 with homepage content (soft 404), ~5,000 internal `/drop-taxi/a-b` links are not in the sitemap, route pages are ~58% boilerplate, `AggregateRating` JSON-LD (5.0 from 3 reviews) is on all ~505 route pages while the page says 4.8, `/`, `/drop-taxi`, `/intercity-taxi` share the same title/description/body, every sitemap URL has lastmod=today and changefreq=daily, HTML is `no-store` with PHPSESSID cookie on every page, some short-route distances are wrong (e.g. Cuddalore-Pondicherry 240 km), schema address is Tiruvannamalai while titles say Chennai.

## Backup first
Copy the project to `_backup_YYYYMMDD` (or git baseline commit) before any edit. Never put secrets in chat/git. DB changes only as additive migration files I run myself.

## Do this (auto mode, then report)
1. **Audit the code**: find where routes, canonical, sitemap, schema and 404 are generated. List every URL pattern the site can output and how many real pages exist (curate from the DB/data, not from any slug).
2. **Whitelist routes**: only real route/city pages return 200; every other slug returns a real HTTP 404 page (not the homepage, not a priced page). `from == to` is 404. Remove all internal links to non-existing combinations (the ~5,000 unsitemapped links). Keep the ~505 good route pages and ~91 cities.
3. **One URL per page**: pick one canonical form (decide trailing slash vs none, www vs non-www, http vs https) and 301 everything else to it; remove query-string/`.php`/session-id duplicates (`/pages/*.php` -> clean URLs with 301); make canonical tags match the served URL exactly; stop emitting `PHPSESSID` for anonymous visitors on public pages.
4. **Kill duplicates**: merge or differentiate `/`, `/drop-taxi`, `/intercity-taxi`, `/one-way-taxi`, `/outstation-taxi` (unique title/description/H1/body each, or 301 / noindex the redundant ones). Reduce boilerplate on route pages: add genuinely unique per-route data (verified distance, toll estimate, travel time, main stops, best time, return-route link, nearby airport/station, fare table) so each page is at least ~60% unique. Pages that cannot be made unique: noindex or remove from sitemap.
5. **Structured data**: delete the site-wide fake `AggregateRating`/`Review` markup; keep only true markup (Organization/LocalBusiness with the real address, BreadcrumbList, FAQPage where the FAQ is visible, Service/Offer with prices that match the page). Fix the Review-snippets errors.
6. **Sitemap**: only canonical 200 pages that are indexable; real `lastmod` (changes only when content changes); no `changefreq` spam; split into sitemap index (routes / cities / static) if large.
7. **Fix the technical errors**: 20 x 404 (find source links), 78 redirecting URLs still linked internally (link directly to the final URL), 4 redirect errors (loops/chains), 2 x 5xx (read the PHP/Apache error logs, find the cause), 1 noindex and 1 robots-blocked URL (confirm they are intended).
8. **Distances**: verify short/regional route distances against the Google Routes data we already use elsewhere or a corrected table; wrong distances = wrong fares in schema.
9. **Performance**: public HTML cacheable (remove `no-store` for public pages, e.g. `Cache-Control: public, max-age=0, s-maxage=...` or short max-age with ETag), gzip/brotli, long-cache static assets, merge/defer the 16 CSS + 16 JS files where safe, lazy images.
10. **Brand/entity**: title/H1/footer use one spelling "Drop1Taxi" with "(Drop One Taxi)" mentioned naturally on home and about; same business name/address/phone everywhere; address in schema must match the real one (ask me which is real: Tiruvannamalai or Chennai); add `Organization` + `sameAs` (Google Business Profile, socials) once I give the links.
11. **Admin and connections**: do not change the admin panel, DB tables or the Drop-Cars connection except to fix security bugs; keep lead sources/labels as they are.
12. Produce `drop1taxi-seo-fixes/` with the changed files, `UPLOAD.md` (exact Hostinger steps and rollback), a `redirects` list, and `FINAL-REPORT.md` with before/after counts of URL types, and a "MANUAL STEPS FOR NAVEEN" list (upload, Search Console actions below).

## Search Console steps I will do after you finish (include in the report)
- Submit the new sitemap, remove the old one; use URL Inspection > Request indexing for home + top 20 routes; Pages report > Validate fix for "Not found", "Redirect error", "Server error", "Alternate page with proper canonical" after the fixes are live; check the "Duplicate, Google chose different canonical" example URLs weekly; Review snippets > Validate fix.
- Create/verify the Google Business Profile and get real reviews (never fake).
- Expect recovery to take weeks to months after Google recrawls; do not promise rankings.

---
