# Handoff prompt: multi-site analysis, fix and redesign (paste into a LOCAL Claude session opened on the folder that holds all six sites)

---

You are working in my local folder that contains the source files of my six taxi/transport websites. I speak Tanglish (Tamil written in English letters): reply to me in the same style, expert level, no generic advice. Mark clearly what is a confirmed fact (read from files) and what is your suggestion or guess.

## 0. How to work (auto mode, but safe)
1. FIRST, back up: copy each site folder to `_backup_YYYYMMDD/<site>` (or `git init` + commit a baseline if it is not a repo). Never edit without a backup.
2. Then audit everything (section 2) and write ONE plan file `PLAN.md` (what you will do per site, in order, what is confirmed vs your suggestion). Show me the plan summary in chat, then continue in auto mode without waiting, unless something is destructive or you are missing information that changes the result (then ask, with your best suggestion).
3. Execute the whole plan completely and correctly. Do not leave anything half-done. Test what you change (run, lint, open pages, check PHP syntax with `php -l` if PHP is installed).
4. Never put secrets (DB passwords, SMTP passwords, API keys, tokens) into git, docs, or chat. Read them if needed, keep them where they are, and mention only the variable names. If a secret must change, list it under "manual steps for me".
5. Never delete or overwrite live database data. Database work = schema-compatible changes only, written as a migration `.sql` file I run myself. Do not touch customer/booking data.
6. Finish with `FINAL-REPORT.md` and the same report in chat: what you changed per site (files), what you tested, what you could not do, and a last section "MANUAL STEPS FOR NAVEEN" (only the things I must do myself, e.g. upload to Hostinger, run SQL, rotate keys, DNS, Search Console).

## 1. The sites (all mine; files are in this folder, find each by name)
| Site | What I told you |
|---|---|
| tatacalltaxi.in | Has some problems: find and fix them. Has an **admin panel** that is **connected to the Drop-Cars system** (my repo `nvitverse/Drop-Cars`: Android app + Node backend + admin panel). KEEP that connection working exactly (same endpoints, tokens, fields, DB tables). |
| southerndroptaxi.com | Has some needs/gaps: find and fix them. |
| onetheway.in | Half-built; I worked on it partly. Check which files were modified most recently (file modified dates / git log) and finish the work. |
| droptaxi24.in | Same as onetheway.in: half-built, finish it. |
| yellowboard.in | Same kind of site, but it also books **all commercial vehicles (trucks, etc.)**. Add proper commercial-vehicle booking features, and create a **separate taxi page/section** inside it with the taxi features listed in section 4. |
| dropcars.in | Analyse it and modernise it. (Live site is public.) |

Reference sites that are already finished and good (use as the feature and SEO benchmark, never copy their text): `droptaxinow.in` (my new Angular site, repo `nvitverse/NVIT`, folder `web/`, docs in `docs/`) and drop1taxi.com (Hostinger PHP, live).

## 2. Audit (do this per site, write findings into PLAN.md)
- Stack and structure (PHP / static / Node / WordPress?), entry points, includes, config files, DB usage (list tables from the code or from any `.sql` file in the folder), admin panel, API calls, third-party keys (names only).
- What was modified most recently (dates / git log) = the work-in-progress I want finished. List it explicitly.
- Bugs: broken links, PHP warnings, console errors, mobile overflow/overlap, slow assets, missing alt text, missing meta, duplicate titles, mixed content, security issues (SQL injection, XSS, exposed admin/login, hard-coded secrets, no CSRF), accessibility.
- SEO: titles, descriptions, canonical, schema (never fake AggregateRating), sitemap, robots, clean URLs, 404 behaviour (real 404, no soft-404), internal links, page speed (compression, caching, image sizes, lazy loading).
- Conversion: booking form, fare estimate, WhatsApp and WhatsApp Business buttons, call button, thank-you page, email notifications.

## 3. Design rules
- **Each site already has its own colour theme. KEEP every site's existing colour theme** (read it from its CSS: primary, accent, background, text colours and fonts) and build the new attractive design on top of exactly those colours. Do not change a site's brand colours. Put the colours into CSS variables (design tokens) so they are easy to change later.
- "Attractive" = modern, clean, fast, mobile-first, nothing overlapping or hidden at 320 px / 360 px / 768 px / 1280 px, good contrast, consistent spacing, real car/vehicle photos (WebP, compressed, `srcset`, lazy), clear CTAs (Call, WhatsApp, Book), sticky mobile bar, no layout shift.
- Each site must look different from the others (different layout and hero), but share the same quality bar.
- Do not copy text or images from competitor sites. Unique, readable copy only; do not make claims I cannot prove (no fake reviews, no "#1", no fake counts).

## 4. Feature checklist for the taxi sites (and the taxi section of yellowboard.in)
Take these from my droptaxinow.in build and drop1taxi.com, adapted to each site's stack:
- Booking categories: One-way, Round trip, Hourly rental (5/8/10/12 h), Multi-city (up to 10 stops, reorderable), Airport.
- South-India-only Google Places pickers (current location, swap), instant offline estimate then live Google route + toll, km limit and extra-km rate shown everywhere.
- Fare rules (drop1taxi live config): one way `max(km,130) x rate + batta`; round trip `max(2 x km, 250 x days) x rate + batta x days`; hourly `rate x hours` (10 km/h included); multi-city = round-trip rules + Rs 100 per stop. Rates (one-way / round per km, batta one-way / round, hourly): SEDAN 15/13, 400/400, 300; SUV 20/18, 500/400, 400; INNOVA 20/19, 500/500, 450; CRYSTA 24/22, 500/600, 600. Check each site's existing rates first and keep the site's own rates if they differ; tell me about differences.
- WhatsApp AND WhatsApp Business chooser everywhere (web, thank-you page, emails), detailed WhatsApp message template (route, map links, fare, km limit, policies).
- SMTP emails (customer + admin) using the SMTP settings already in my drop1taxi/Drop-Cars setup (read from existing config, do not copy secrets elsewhere), thank-you page after confirmation.
- Pages: tariff, routes and fares explorer, FAQ, about, contact, terms, privacy, cancellation, refund, payment, toll and permit, luggage, pet policy, reviews (only real, moderated), track booking, HTML sitemap page, clean URLs, XML sitemap.
- Technical: compression, caching headers, WebP images, favicons/manifest/OG image, structured data (LocalBusiness/Service/FAQ only where true), Google Search Console verification file support, GA4 and Google Ads conversion events (`booking_confirmed`, `call_click`, `whatsapp_click`, `fare_check`) loaded after first interaction.
- Footer organised like drop1taxi, plus "Designed & Developed by Naveen Rajendran".

## 5. Admin panel and database rules
- **tatacalltaxi.in**: keep the admin panel and its Drop-Cars connection exactly as they are (same API contract). Fix only bugs and security issues there. If you change a DB table, make it additive (new nullable columns/tables) with a migration `.sql`, never destructive.
- **Sites that have a database**: keep using it; map every form to its existing tables; add what is missing via migration files.
- **Sites without a database**: do not invent a heavy DB. Prefer storing leads by email + WhatsApp, and (optionally) a small append-only JSON/CSV file or a lightweight SQLite file outside the web root. Tell me what you chose and why.
- Leads from each brand should carry a source label (brand code and site name) so the Drop-Cars admin can tell them apart (droptaxinow uses `DTN` / `droptaxinow.in`). Propose codes for the other sites in PLAN.md.

## 6. yellowboard.in specifics
- Commercial vehicle booking: trucks (mini truck / pickup, 14ft-17ft, 6/10/12-wheel, container, tipper, tanker, etc. - base the list on what the site already has, then add what is clearly missing), load/goods type, weight, pickup/drop, loading/unloading help, return load, GST invoice option, quote request flow (price on request where fixed fares are impossible), WhatsApp quote message.
- A clearly separate **Taxi** page/section (own URL, own booking form) with the full taxi feature list from section 4.
- Keep the site's existing colour theme.

## 7. Hosting facts
- All sites are on Hostinger (Business plan). PHP sites stay PHP unless a rewrite is clearly better and safe; do not move a working site to a new stack without telling me why in PLAN.md.
- Produce, per site, a ready-to-upload zip (`dist/<site>.zip`) and a short `UPLOAD.md` (exact hPanel steps, which folder, what to delete first, how to test, how to roll back using the backup).

## 8. Output
- `PLAN.md` (start), `FINAL-REPORT.md` (end), per-site `UPLOAD.md`, SQL migration files, and the zips.
- In the final chat message: a table of sites (before / after / status), then the list "MANUAL STEPS FOR NAVEEN" in the order I should do them. Be honest about anything not tested or not finished.

---
