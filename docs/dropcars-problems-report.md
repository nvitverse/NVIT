# dropcars.in: problems report (deep audit of the live site)

Date: 2026-10-17. Method: read the sitemap index (2 sitemaps, 581 URLs), fetched a random sample of 80 sitemap URLs without following redirects (status, canonical, H1, title, schema, headers, size, assets), compared text of 8 pages (6-word shingles, header/footer removed), and tested URL behaviour. Tags: **[CONFIRMED]** measured, **[INFERENCE]**, **[VERIFY]**. Limit: this is the live site, not the newer `localhost:8001` copy, so some items may already be fixed locally (re-check with the section 5 tests). Companion: `dropcars-seo-growth-plan.md`.

Context [CONFIRMED]: dropcars.in is the same PHP engine as drop1taxi.com, whose Search Console data shows the outcome of these exact problems (impressions 130/day -> 2/day, 3,304 of ~6,324 known URLs not indexed, reasons: Alternate canonical 1,245, Discovered-not-indexed 1,056, Duplicate-Google-chose-different-canonical 698). Expect Drop Cars to follow the same path.

## Severity-ranked problems
| # | Sev | Problem | Evidence | Why it hurts | Fix |
|---|---|---|---|---|---|
| 1 | P0 | **Sitemap lists duplicate URL forms for the same page** | Of 459 route URLs, 266 are `/a-to-b` and 193 are `/a-b`. In the sample, **39 of 39** `/a-to-b` pages canonicalise to `/a-b` (e.g. `/coimbatore-to-salem` -> canonical `/coimbatore-salem`). 7 duplicate titles in the sample are exactly these pairs. **39 of 79 sampled sitemap URLs (49%) are non-canonical.** | Sitemap must list only canonical URLs; this creates "Alternate page with proper canonical" and dilutes crawl. | One pattern only, 301 the other (registry map, single hop), sitemap lists only canonical. |
| 2 | P0 | **Theme URL sprawl: same page under 4+ URLs, all 200** | `/chennai`, `/drop-taxi/chennai`, `/one-way-taxi/chennai`, `/outstation-taxi/chennai` all 200, each self-canonical, ~2,971-3,023 words; also 200: `/intercity-cabs`, `/one-drop-cab`, `/chennai/madurai`; `/drop-taxi/chennai-to-madurai` 200 | Google clusters near-identical pages and picks its own canonical ("Duplicate, Google chose different canonical" on drop1taxi) | One primary theme per site (`/drop-cars/...`), all others one-hop 301 or 404/410. |
| 3 | P0 | **Open URL space** | `/chennai-to-nowhereville` => 200 with "From Rs 2,350"; `/chennai-to-chennai` => 200 homepage content; unknown root slug timed out twice (30 s) [VERIFY, could be rate limiting of my IP] | Infinite junk URLs, fake prices, soft 404s | Registry whitelist, real 404/410, `from == to` 404. |
| 4 | P0 | **Sitemap contains junk and a 404** | `/vinayaka-mission-kirubananadah-variyar-medical-college-hospital-salem-tamil-nadu` (404 in the sample), `/trends-chennai-tamil-nadu`, `/pages/payment-policy.html`, `/pages/refund-policy.html`; no `lastmod` anywhere | Wastes crawl, signals low quality | Rebuild sitemaps from the registry; real `lastmod`; index only 200 canonical URLs. |
| 5 | P0 | **5-6 H1 per page** | 71 pages with 5 H1, 8 with 6 (79 of 79 sampled) | Weak page-topic signal | One H1; demote others to H2/H3. |
| 6 | P0 | **Fake rating markup** | `AggregateRating` on 71 of 79 sampled pages plus home (route pages and home) | Same issue that Search Console flagged as invalid review snippets on drop1taxi; spam signal | Remove until real, visible reviews exist. |
| 7 | P1 | **No caching + session cookie on every page** | `Cache-Control: no-store, no-cache` and `Set-Cookie` on 79 of 79 sampled pages; `/tariff` also issues a `dropcars_admin_session` cookie to anonymous visitors | No CDN/browser caching, slower TTFB (0.44-1.0 s), privacy/security smell | Public pages: no cookie, `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` + ETag; CSRF token via XHR; investigate the admin cookie. |
| 8 | P1 | **Very heavy pages** | HTML 546-634 KB (median 628 KB) uncompressed; 22-24 JS files, 19-20 CSS files, ~360 KB inline JS on every page | Poor mobile LCP/INP; Ads Quality Score | Target < 150 KB HTML; move inline JS to cached files, merge/defer, lazy images, WebP. |
| 9 | P1 | **Boilerplate content** | Pages 2,516-3,628 words (median 3,398). Avg 37% of 6-word shingles shared between page pairs (max 62%); a page's text that is not found on any other sampled page: 26-47% (e.g. `/chennai-madurai` 26%, `/vellore` 34%, `/madurai` 33%) | Thin/duplicate programmatic pages are what Google drops | Quality gate + unique data blocks (see growth plan section 4/5). |
| 10 | P1 | **Internal links to redirecting URLs** | Home links `/drop-cars/{city}`; `/drop-cars/chennai` 301 -> `/chennai`; `/city-to-city-taxi` 301 -> `/drop-cars/city-city` -> second hop | Wastes crawl, "Page with redirect" | Link straight to final URLs; remove chains. |
| 11 | P1 | **Distance/fare accuracy not verified** [INFERENCE from the shared engine] | drop1taxi's cache had 182 km for Ranipet-Vellore; Drop Cars shares the engine and cache design | Wrong fares in titles and schema | Verified coordinates, sanity check, sources. |
| 12 | P2 | Titles are good but price-led titles repeat per pair | "Chennai to Madurai Drop Taxi \| Rs 7,300 onwards" (none over 65 chars: 0 of 79) | Good; keep only if the price is true and equal on page and schema | Keep, generate from registry. |
| 13 | P2 | Content/blog structure | `/blog` 301; home has a "Smart Guides" block; no real blog sitemap | Missed informational traffic | Build blog (growth plan section 6). |
| 14 | P2 | Brand/entity signals not visible in the audit | No GBP/sameAs check possible from here | Brand search will not win without them | GBP, social, citations, backlinks. |

## What is good (keep)
HTTPS + HSTS, CSP, favicons per theme, robots.txt (Google/Bing policy), sitemap index structure (cities + routes), price-led unique titles (no title over 65 chars), FAQPage + BreadcrumbList on all sampled pages, robots meta with `max-image-preview`, 78 of 80 sampled URLs clean 200 (the sample's only failure was the junk slug).

## Counts [CONFIRMED]
- Sitemap: 581 URLs (122 in `sitemap-cities.xml`, 459 in `sitemap-routes.xml`); route URLs: 266 `-to-` + 193 plain; junk entries: at least 4 (list above).
- Sample (80): 79 x 200, 1 x 404; canonical != URL on 39 of 79; H1 per page 5 (71 pages) or 6 (8 pages); AggregateRating on 71; Set-Cookie and no-store on 79; HTML median 628 KB.

## Expected outcome if left unfixed [INFERENCE]
Same trajectory as drop1taxi: a burst of impressions after Google first discovers the 581 URLs, then a decline as duplicates are clustered and the site is judged low value. The fix order is the same as in `drop1taxi-blueprint-review.md`: registry + one URL per page + sitemap cleanup (P0), then quality gate, performance and caching (P1), then content and brand (P2).

## 5. Verification tests for the local copy (`localhost:8001`) before deploying
1. Sitemap URLs: 100% return 200 with no redirect; canonical == URL; no duplicates of the same pair; no junk slugs.
2. Legacy and variant URLs (`/chennai`, `/drop-taxi/x`, `/one-way-taxi/x`, `/outstation-taxi/x`, `/intercity-cabs`, `/one-drop-cab`, `/a/b`, `/a-to-b`, `/a-b`, trailing slash): one 301 hop to the single canonical URL, or 404/410. No `?__theme=`-style parameters in any `Location`.
3. `/x-to-nowhereville` => 404; `/chennai-to-chennai` => 404.
4. One H1; no `AggregateRating`; JSON-LD valid.
5. No `Set-Cookie` and no `no-store` on public pages; same bytes for different cookies.
6. HTML < 150 KB; Lighthouse mobile >= 90 performance, 100 SEO.
7. Home links point straight to final URLs; admin panel and Android API still work.

## Next step
Run the Antigravity theme-extraction prompt (`dropcars-antigravity-extraction-prompt.md`), bring back `THEME-URL-SYSTEM-REPORT.md`, and I will turn this report into an exact fix-and-index prompt for Drop Cars (same structure as `southern-fixes-and-indexing-prompt.md`, including the Chrome/browser sub-agent indexing part).
