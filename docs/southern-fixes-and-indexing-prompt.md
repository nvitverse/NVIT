# Prompt for Antigravity: fix Southern Droptaxi first, then index it with Chrome (browser sub-agent)

---

You are working on my website **Southern Drop Taxi** (`https://southerndroptaxi.com`, source on this PC, PHP on Hostinger). Reply to me in Tanglish, expert level. Mark each statement FACT (you verified it yourself) or GUESS. **Re-verify every finding below yourself before changing anything; do not take my word for it.** Back up the project first (copy to `_backup_YYYYMMDD` or a git baseline commit). Never put secrets in chat, git or reports. Do not touch the admin panel, the DB data or the Drop-Cars connection except to fix a bug you can prove.

The job has two parts. **Do Part B only after Part A is deployed to the live site and the Part A tests pass.**

## PART A: fixes before we ask Google to index (findings from my live audit on 2026-10-17)

### What is already good (do not break it)
Live home and 70 of 70 sampled sitemap URLs return 200; canonical equals the URL on all 70; exactly one H1 on all 70; no duplicate titles; no `AggregateRating`; FAQPage and BreadcrumbList present; no Set-Cookie on public pages; `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` with ETag; unknown route `/drop-taxi/chennai-to-nowhereville` => 404; `/drop-taxi/chennai-to-chennai` => 404; `/chennai` => 404; robots.txt and sitemap exist; sitemap has 789 URLs (761 under `/drop-taxi/`, 14 `/pages/`, 9 `/airport-taxi/`, blog, tariff, home).

### A1. Redirects leak internal parameters (real bug, fix first)
- `GET /drop-taxi/chennai-to-madurai` => 301 `Location: /drop-taxi/chennai-madurai?__theme=drop-taxi&__path=chennai-to-madurai`
- `GET /drop-taxi/chennai/` => 301 `Location: /drop-taxi/chennai?__theme=drop-taxi&__path=chennai/`
These internal rewrite parameters must never appear in a public URL. Make every redirect `Location` a clean absolute path (`/drop-taxi/chennai-madurai`), one hop, no query string. Also test that `/drop-taxi/chennai?__theme=x&__path=y` does not create a second crawlable URL (strip or 404 unknown parameters, canonical stays clean). Search the whole code for other places that build URLs with `__theme` or `__path`.

### A2. Legacy theme paths still answer 200
- `/one-way-taxi/chennai` and `/outstation-taxi/chennai` return 200 with canonical `/drop-taxi/chennai` (same page content under another URL). Make them a single-hop 301 to `/drop-taxi/chennai` (same for every city and route under those prefixes that exists in the registry; 404/410 if it does not).
- `/intercity-cabs` returns 200 with the homepage content and canonical = home. Return 301 to the right page or 404. Test the other legacy theme prefixes inherited from the Drop Cars codebase (`/intercity-cabs`, `/city-to-city-taxi`, `/one-drop-cab`, `/drop-cars`, `/{city}`, `/{a}/{b}`): none may answer 200 with duplicated or homepage content.
- `/drop-taxi/{a}-to-{b}` currently 301s (with the leak above): keep the 301 to the canonical `/drop-taxi/{a}-{b}` only if the pair exists in the registry, otherwise 404. The canonical route pattern on this site is `/drop-taxi/{from}-{to}` (it is what the sitemap lists); keep it consistent everywhere (links, canonical, og:url, schema, sitemap).

### A3. Route pages are mostly boilerplate (biggest ranking risk, same pattern that sank drop1taxi)
My sample of 9 pages (6-word shingles, header/footer removed): average 55% of text is shared between page pairs (max 82%); share of a page's text that appears on no other sampled page: `/drop-taxi/chennai-madurai` 10%, `/drop-taxi/chennai-pondicherry` 17%, `/drop-taxi/theni-kodaikanal` 28%, `/drop-taxi/namakkal-erode` 30%, `/drop-taxi/coimbatore-tirupati` 38%, `/drop-taxi/bangalore-vellore` 38%. Word counts 1,088-2,177 per page. A brand-new domain with 761 near-duplicate programmatic pages is exactly what Google demoted on drop1taxi.com (3,020 pages indexed, 3,304 not, impressions fell from 130 to 2 per day).
Do this:
1. Write `tools/uniqueness-report` (PHP or Node script, runs locally against the rendered pages) that prints, per page, the unique share versus sibling pages and the word count of the main content, and the global average. Save the output as `UNIQUENESS-BEFORE.txt`.
2. Build a **registry with tiers** (table or JSON): `route_slug, from, to, verified_km, duration, toll_est, tier, status`. Tier 1 = top ~60-100 routes by demand (hub to hub, hub to major town, plus the 20 routes in `docs/google-ads-brief.md` list), Tier 2 = the rest.
3. For Tier 1 pages add genuinely unique content built from data, not word swaps: verified distance and duration range, toll plazas and estimate, states/permit note, 5-8 real stops (food, fuel, rest) specific to that road, best time to travel, night-driving note, nearest airport/rail at both ends, pickup areas, reverse-route link, 5 route-specific FAQs (toll amount, duration, permit, night travel, fare). Target at least 60% unique versus sibling pages. Mark everything you cannot verify as `needs_owner_review` and do not invent facts (ask me for local knowledge).
4. **Quality gate:** a page is `index,follow` and listed in the sitemap only if it passes (registry status published, verified distance, minimum unique-share and unique data blocks). Pages that do not pass: `noindex,follow` and not in the sitemap until they pass. Expect that at launch only Tier 1 + hubs + city pages go in.
5. Fix distance accuracy: use curated coordinates (or place IDs), a sanity check (road km / straight-line km between 1.0 and 1.8), store source and date. No public request may trigger a paid API call.

### A4. Sitemaps
- 787 of 789 URLs have `lastmod` = today (2026-10-17): replace with the real last-change date from the data (route data/registry updated_at, blog post date), never "today" by default.
- Split into a sitemap index: `sitemap-pages.xml`, `sitemap-cities.xml`, `sitemap-routes.xml` (only gate-passing routes), `sitemap-airports.xml`, `sitemap-blog.xml`. Only canonical, indexable, 200 URLs. Drop `changefreq`/`priority`. Re-submit later in Part B.

### A5. Brand and entity (so that the query "southern drop taxi" resolves to this site)
- Keep Title/og:site_name "Southern Drop Taxi" (three words); add `Organization` JSON-LD with `name`, `alternateName` ["Southern Drop Taxi", "southerndroptaxi"], `url`, `logo`, `telephone`, `sameAs` (leave an array I will fill with the Google Business Profile and social links), real address when I give it; keep `WebSite` JSON-LD (it exists). No rating markup without real visible reviews.
- Brand page: make `/about` explain who Southern Drop Taxi is (real facts only; ask me).
- Note the similar brand "SS Drop Taxi" (ssdroptaxi.com): never imitate its name, text or logo.

### A6. Performance
Pages weigh 99-148 KB of HTML (fine) but load 19-20 JS files and 16-19 CSS files. Merge/minify/defer where safe (keep behavior), load Maps/Places only on interaction, lazy-load below-the-fold images, WebP + srcset, preload the main font. Target mobile Lighthouse performance >= 90, SEO 100. Report before/after.

### A6b. Tracking IDs (verify with me, change nothing without my answer)
- Southern's pages load the Google Ads tag `AW-18316947510` on page load (with Consent Mode v2); the same tag id is on drop1taxi.com (`AW-18316947510`, plus GA4 `G-P6D2M8X8Q1` and conversion labels). dropcars.in uses a different Ads id (`AW-17389722138`). No GA4 id was found on Southern's home page.
- Ask me: does Southern Drop Taxi have its own Google Ads account/conversion actions, or should it share Drop1Taxi's? If it should have its own, tell me which IDs and labels to create; do not paste drop1taxi's labels into Southern. If shared, make sure Southern events carry the brand/site name so reports can separate them.
- Add GA4 for Southern only when I give you the measurement id. Load tags after first interaction (or after 6 s) instead of on page load, keep Consent Mode, and send the events `fare_check`, `booking_confirmed`, `call_click`, `whatsapp_click`.
- The only phone number of Southern Drop Taxi is +91 75988 99579. The digits 8316947510 you may see in the page source are part of the Ads tag id, not a phone number; do not treat them as one.

### A7. Part A acceptance tests (script them in `tools/seo-tests.sh` or `.mjs`, run against production, save `SEO-TESTS-AFTER.txt`)
- Every sitemap URL: status 200 with no redirect, canonical equals the URL, exactly one H1, unique title and description, valid JSON-LD, `index,follow`, no Set-Cookie, no `__theme`/`__path` anywhere in HTML or links.
- Legacy and variant URLs (list in A2, trailing slash, uppercase, `/a-to-b`): one 301 hop to a clean 200, or 404.
- No sitemap URL with `noindex`; no internal link pointing to a redirect or a 404; unknown slugs 404; `from==to` 404.
- Quality gate: print how many pages pass and how many are noindex.
- Show me the numbers. If any test fails, fix and rerun before Part B.

## PART B: indexing, done by you with Chrome and a browser sub-agent (only after Part A is live and green)
Use your browser tools: launch Chrome with my signed-in profile (I am already logged in to Google Search Console and Hostinger on this PC) and drive it with a browser sub-agent that clicks and types for you. Work step by step, take a screenshot after each important step, and save a log `INDEXING-LOG.md` (date, action, result, screenshot file name).

Rules: act only on my own properties (`southerndroptaxi.com`). If you meet a login page, 2FA, captcha, "verify it is you" or payment prompt, stop and tell me; never type my passwords. Do not change any setting except what is listed; never use Removals, never add/remove users or owners, never touch DNS records other than adding the single Google TXT verification record described below (show me the value and wait for my "ok" before saving it). Respect Search Console quotas: "Request indexing" allows only a small number per day per property (roughly a dozen); stop when Google says the quota is exceeded and continue the next day. Do not spam.

B1. Open `https://search.google.com/search-console`. Check the property list. If a **Domain property** `southerndroptaxi.com` exists and is verified, use it; if only a URL-prefix property exists, note it. If none exists: Add property -> Domain -> `southerndroptaxi.com` -> copy the TXT value Google shows. Open Hostinger hPanel -> Domains -> `southerndroptaxi.com` -> DNS / Nameservers -> DNS records -> add one TXT record (name `@`, value = the Google value, TTL default) after I approve it. Return to Search Console, click Verify (DNS can take a few minutes; retry a few times, up to 15 minutes, then report).
B2. Sitemaps: Indexing -> Sitemaps -> remove nothing; add the new sitemap index URL (`sitemap.xml` or the index file from A4). Check the status becomes Success and note "Discovered URLs".
B3. URL Inspection -> Request indexing, in this order (each URL must be the final canonical URL and return 200): day 1: home `/`, `/drop-taxi` (hub), `/tariff`, `/blog`, `/about`, `/contact`, `/airport-taxi` hub (if it exists), `/drop-taxi/chennai`, `/drop-taxi/bangalore`, `/drop-taxi/coimbatore`. Day 2 onward: other hub cities, then the top Tier-1 routes (start with chennai-madurai, madurai-chennai, chennai-coimbatore, chennai-bangalore, bangalore-chennai, chennai-pondicherry, chennai-trichy, chennai-salem, chennai-tirupati, chennai-vellore). Note for each URL whether Google says "URL is not on Google" or "URL is on Google", the last crawl, and the canonical Google chose.
B4. Optional (ask me first): Bing Webmaster Tools -> import from Google Search Console; run the IndexNow script if the project has one.
B5. After 24-72 h (I will start you again): open Search Console -> Indexing -> Pages and Performance; write the numbers (Indexed, Not indexed and each reason, impressions, clicks) in `INDEXING-LOG.md`. Then Google search checks in Chrome: `site:southerndroptaxi.com`, `"southern drop taxi"`, `southerndroptaxi.com`: screenshot and report what appears.
B6. Final report in chat: what you changed in Part A (files), test results before/after, what you did in Part B, anything blocked, and a short "MANUAL STEPS FOR NAVEEN" list (Google Business Profile, social profiles, citations, real reviews, address).

---
