# Prompt for Antigravity: extract the theme and URL system of the Drop Cars PHP website

---

You have the source code of my PHP website (the one I run locally at http://localhost:8001/ and that is live at https://dropcars.in). Another AI will plan the SEO and content growth of this site, but cannot see the code. Read the code and write ONE report file `THEME-URL-SYSTEM-REPORT.md` in the project root. Do not change any code. Do not include passwords, tokens, API keys or SMTP settings (names of settings only). Mark each statement as FACT (read in a file, give the file path and line) or GUESS.

## 1. Project map
- Folder tree two levels deep, the entry file(s), the router/front controller, `.htaccess` files, the `engine/`, `core/`, `includes/`, `helpers/`, `data/`, `pages/`, `assets/` folders and what each is for (one line each).
- How a request is handled from `.htaccess` to the final HTML (list the files in order).

## 2. Themes (the most important part)
- How many themes exist, their names/slugs, where they are defined (file and line), and how a theme is selected for a request (by URL prefix, by domain, by config constant, by cookie?).
- For EACH theme: the URL prefix(es) it uses (example: `/drop-taxi/`, `/one-way-taxi/`, `/outstation-taxi/`, `/drop-cars/`, `/intercity-cabs/`, `/one-drop-cab/` ...), the exact URL patterns for a city page and a route page, the title/H1/meta-description templates, the keyword set, the colours/fonts/logo/favicon, the template files, and which of them are active on this site.
- Which themes belong to which website/brand (Drop Cars, Drop1Taxi, Southern Droptaxi, others) and how one codebase serves several brands (domain detection, config per brand, `brand` or `site` constants).
- Every rewrite rule in `.htaccess` and in the PHP router that maps a URL to a theme, with the regex and the target. List all legacy/redirect rules (301/302) and what they redirect to.
- For a sample city (Chennai) and a sample route (Chennai to Madurai): list every URL that returns 200 for it across all themes and patterns, and for each one: its canonical URL, whether it is in the sitemap, the title and the word count of the main content.

## 3. Pages, data and registry
- How city pages and route pages are generated: from which function(s) (`getCityBySlug`, route builders), which data files/tables (`data/cities.json`, `distance_cache.json`, DB tables), and what happens for an unknown slug (does it return 404, or invent a page with a price?). Show the exact code path.
- How fares and distances are computed and cached (formula, minimums, where distance comes from, how bad cache entries could arise).
- The list of cities and routes the site can currently output (counts, and the first 30 of each), plus how many have verified distance/toll.
- Which content blocks on a city/route page are static boilerplate and which are different per city/route (give the template file and a rough percentage of unique text).
- Where the SEO fields come from: title, description, canonical, robots meta, og tags, JSON-LD (types), FAQ source, breadcrumbs, `AggregateRating` source, sitemap generator (files, rules, lastmod source).

## 4. Headers, sessions, caching, performance
- Where `Cache-Control`, `Set-Cookie`/`session_start` are set and for which routes; why public pages are `no-store`; why `/tariff` sets `dropcars_admin_session`.
- List of CSS and JS files loaded on the home page and a city page, which are inline, and the total size; any lazy-loading and image formats.

## 5. Admin panel and integrations
- How the website connects to the Drop Cars admin panel and the Android app (endpoints, header names such as `X-DROPCARS-TOKEN`, payload fields, lead source/brand fields). Names only, no secrets.
- Which URL paths or rewrite rules the admin/API depends on (so that URL changes do not break them).
- DB tables used by the website (names and purpose; schema only).

## 6. Recent work and known bugs
- Files modified most recently (by modified date or git log): list the last 30 with one line on what changed.
- Anything half-finished, TODO/FIXME comments, and bugs you noticed (broken links, PHP warnings, duplicate H1, mixed URL patterns, redirect chains, internal links that point to redirecting URLs).

## 7. Output format
`THEME-URL-SYSTEM-REPORT.md` with the 6 sections above, tables where useful, file paths for every fact, and a final "URL behaviour table" with columns: URL pattern | theme | status code | canonical | in sitemap (yes/no) | notes. Keep it complete but plain. Do not edit any project file other than creating this report.

---
