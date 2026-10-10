# Drop Taxi Now – droptaxinow.in

Angular 19 (standalone, SSR build, **all pages prerendered**) + small Express server.
Phone/WhatsApp: 6383269989.

## Commands
```bash
npm install
npm run build        # prebuild regenerates distances, routes, routes.txt, sitemap.xml, robots.txt, then prerenders 655 pages
npm run serve        # node dist/taxi/server/server.mjs  (PORT=4000 default)
npm run test:fare    # fare engine unit tests (node >= 22)
```

## What is where
| Path | Purpose |
|---|---|
| `src/app/site.config.ts` | Brand, phone, domain, billing rules |
| `src/app/data/vehicles.json` | **Per-km rates and driver allowance (PLACEHOLDERS – set your real rates)** |
| `src/app/data/cities.json` | Cities, coordinates, hubs, airports |
| `src/app/core/fare.ts` | Pure fare formula (unit tested) |
| `scripts/gen-data.mjs` | Builds distances/routes/sitemap/robots (distance = known highway km, else straight-line × 1.28) |
| `src/server.ts` | Static serving, caching headers, www→apex 301, trailing-slash 301, real 404, `POST /api/lead` |

## URL structure
`/`, `/one-way-taxi/:city`, `/outstation-taxi/:city`, `/airport-taxi/:city`, `/drop-taxi/:from-to-:to`, `/services/:service`, `/tariff`, `/about`, `/contact`, `/faq`, policies.
Route pages: hub↔hub ≤ 650 km, hub↔other ≤ 350 km (avoids thin doorway pages).

## Environment variables (server only – never commit secrets)
| Var | Meaning |
|---|---|
| `PORT` | HTTP port |
| `LEADS_FILE` | Where leads are appended (JSON lines). Default `./data/leads.jsonl` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Optional instant lead alert |

## Before launch checklist
1. Replace placeholder rates in `vehicles.json` and review distances for key routes (swap in Google Routes data if you want exact km).
2. Review/finalise Terms, Privacy, Cancellation (marked DRAFT).
3. Add real reviews only (schema `aggregateRating` is intentionally omitted until real).
4. Point `droptaxinow.in` DNS to host; 301 `www` → apex is handled in `server.ts`; add `droptaxi4u`/other domains as 301s at DNS/host level.
5. Search Console: submit `https://droptaxinow.in/sitemap.xml`; add GA4; create Google Business Profile.
6. Add OG image and Tamil pages (next phase).
