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

## Booking flow (mirrors drop1taxi service categories)
Tabs: **Drop Taxi (one way)**, **Round Trip**, **Local Rental (5/8/10/12 h)**, **Multi City (up to 10 stops, reorder)**, **Airport**.
1. `POST /api/quote` – validates (South India only), computes distance (Google Routes if key set, else offline table), returns fares for all four cabs + an HMAC-signed quote, and records the *enquiry* (`DTN-E-…`) + emails the admin.
2. `POST /api/confirm` – verifies the signature (prices cannot be edited in the browser), creates the *booking* (`DTN-B-…`), emails customer + admin, notifies Telegram, and (if configured) syncs to the Drop1Taxi admin.
3. `/thank-you` shows the summary + WhatsApp / WhatsApp Business buttons. Email buttons go to `/whatsapp?to=…&t=…` (chooser page).

Fare rules (same as drop1taxi): one way `max(km,130)×rate + batta`; round trip `max(2×km, 250×days)×rate + batta×days`; hourly `rate×hours` (10 km/h included); multi-city = round-trip rules on the full route + ₹100/extra stop. Km limit, extra-km rate, minimum billing, and "toll/permit/parking extra" are shown in the UI, WhatsApp text and emails.

## Admin panel connection (later)
`src/server/admin-sync.ts` maps every enquiry/booking to the payload shape of `drop1taxi.com/api/send-enquiry.php` and `confirm_booking.php`
and adds explicit labels so the admin can separate and invoice these leads: `source=droptaxinow.in`, `brand=Drop Taxi Now`, `brandCode=DTN`,
`invoiceBrand=Drop Taxi Now`, `invoicePrefix=DTN`, booking IDs prefixed `DTN-`. It is **off** until `ADMIN_SYNC_*_URL` is set.
The Drop1Taxi PHP endpoint must be updated to read these fields (it does not know them yet) and to accept the `X-DROPCARS-TOKEN` header.

## Environment variables
See `.env.example` (SMTP, Google key, quote secret, Telegram, admin sync) and `DEPLOY.md`.

## Before launch checklist
1. Replace placeholder rates in `vehicles.json` and review distances for key routes (swap in Google Routes data if you want exact km).
2. Review/finalise Terms, Privacy, Cancellation (marked DRAFT).
3. Add real reviews only (schema `aggregateRating` is intentionally omitted until real).
4. Point `droptaxinow.in` DNS to host; 301 `www` → apex is handled in `server.ts`; add `droptaxi4u`/other domains as 301s at DNS/host level.
5. Search Console: submit `https://droptaxinow.in/sitemap.xml`; add GA4; create Google Business Profile.
6. Add OG image and Tamil pages (next phase).
