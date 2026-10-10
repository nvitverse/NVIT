# droptaxinow.in vs drop1taxi.com vs droptaxitour.com (what we took, what is next)

| Area | droptaxitour.com | drop1taxi.com | **droptaxinow.in (this build)** |
|---|---|---|---|
| Stack / rendering | Angular SSG, ~245 of 307 pages not prerendered | PHP, all pages server-rendered | Angular 19, **all 1,167 pages prerendered**, real 404, brotli/gzip |
| Booking categories | one way, round, rental, local | one way, round, hourly, multi-city (10 stops), airport | **same as drop1taxi** + instant estimate, live Google route + toll, signed quotes |
| Fare shown | per-km, "driver included", permit extra | formula `max(km,130)×rate + batta` | same formula, plus **km limit, extra-km rate, toll, permit, parking** rows |
| Estimate UX | 3-step card swap | modal | **3-step wizard, instant offline estimate, then live route** |
| Routes section | city tabs + vehicle pills + table (included km, extra fare) | route pages | **explorer**: city tabs, cab pills with photos, search, sort, Book prefill, WhatsApp quote |
| Location picker | Google | Google Places (New) + geocode | Google via server, **South India only**, current location, swap |
| WhatsApp | one number | `wa.me` only, templates empty | **WhatsApp + WhatsApp Business chooser**, detailed templates with map/route/policy links |
| Email | – | admin + customer (PHP/Gmail SMTP) | customer + admin emails, buttons for both WhatsApp apps, source label `droptaxinow.in` |
| Admin panel | – | PHP admin | adapter ready (`ADMIN_SYNC_*`), labelled `DTN`, **OFF until you connect** |
| Footer | quick links, services, corridors, directory, sitemap | head office, quick links, services, popular routes, policies, developer credit | **drop1taxi-style footer** + cities directory, 9 policy links, sitemap, "Designed & Developed by Naveen Rajendran" |
| Pages | tariff, city, outstation, airport, policies, toll, luggage, pet | reviews, track booking, vendor partner, refund/payment policy | all of these (reviews are real-only/moderated, track needs ID + last 4 digits) |
| Schema / SEO | Organization, TaxiService, FAQ, Breadcrumb | + (self-serving AggregateRating) | TaxiService, Breadcrumb, FAQ, Offer; **no fake ratings**; sitemap 1,163 URLs; OG image |
| Speed | heavy bundle | no-store HTML, 32 requests | Lighthouse mobile **perf 90+, a11y/best-practices/SEO 100** |

## Not done yet (next update, none blocks the launch)
* Tamil pages (`/ta/...`) and Tamil search keywords.
* Unique per-route content (best time, stops, tips) – needs real local knowledge, so only after launch.
* Drop1Taxi-style URLs (`/drop-taxi/chennai-madurai`) – current URLs are `/drop-taxi/chennai-to-madurai` (keyword-rich); redirects can be added when `drop1taxi.com` is migrated.
* Blog / travel guides, corporate fleet rental page, Hindi/English-Telugu variants.
* Connect to the Drop1Taxi admin panel (needs the PHP side to accept the new `source/brand` fields).
* Real reviews, real business address (add to `src/app/site.config.ts` → schema + footer appear automatically).
