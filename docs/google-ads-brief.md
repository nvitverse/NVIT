You are my Google Ads specialist. Use ALL the Google Ads skills and learnings you have saved from my earlier work (especially: city-anchored vs generic keywords, exact match for generic terms, campaign status checks, policy-flag checks). Build the Google Ads setup for a NEW taxi website. Create everything as DRAFT/PAUSED. Do NOT enable any campaign, do NOT spend money, and show me the full plan for approval first.

# 1. BUSINESS (facts you may use)
- Brand: Drop Taxi Now  |  Website: https://droptaxinow.in (www redirects to the non-www; all HTTPS; no trailing slash)
- Phone / WhatsApp / WhatsApp Business: 6383269989 (call +91 6383269989). Open 24/7 for bookings.
- Service: one-way drop taxi, outstation, round trip, hourly local rental (5/8/10/12 hrs), multi-city trips (up to 10 stops), airport transfers.
- Area served: South India only: Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, Puducherry (107 cities, 18 airports).
- Pricing model (all shown on the site before booking): one way = max(km,130) x rate + driver batta. Round trip = max(2 x km, 250 km x days) x rate + batta x days. Toll, state permit/border, parking are EXTRA at actuals. Rates (one way / round trip per km, batta one way): Sedan 15 / 13, 400; SUV 20 / 18, 500; Innova 20 / 19, 500; Innova Crysta 24 / 22, 500. Hourly: Sedan 300, SUV 400, Innova 450, Crysta 600 per hour (10 km/hour included).
- Cabs: Sedan (Swift Dzire / Etios), SUV (Ertiga / Kia Carens), Innova, Innova Crysta.
- Booking flow: fare estimate appears instantly in 3 steps (Details > Estimate > Confirm), then a thank-you page; customer also gets email + WhatsApp message; no online payment on the site.
- NOT available / do NOT claim: ratings or reviews (none published yet), "verified/background-checked drivers", "best/#1/cheapest/lowest price", "instant confirmation", "free cancellation", "no hidden charges" (toll/permit are extra), a physical office address (no Google Business Profile yet), online payment, North-India service.
- Allowed claims: "Pay one way only / zero return fare", "fare shown before you book", "km limit and extra-km rate shown upfront", "24/7 booking", "call or WhatsApp", "toll and permit extra at actuals".
- Language: English now (Tamil pages are planned later, so use English keywords/ads only for now).

# 2. SITE STRUCTURE (1,167 clean, lowercase, hyphenated URLs; no .php, no query needed, canonical self-referencing; thin 404 returns a real HTTP 404)
| Pattern | Count | Example | Use as landing page for |
|---|---|---|---|
| `/` | 1 | https://droptaxinow.in/ | brand + generic "one way drop taxi south india" |
| `/drop-taxi/{from}-to-{to}` | 904 | /drop-taxi/chennai-to-madurai | route keywords "chennai to madurai drop taxi/cab/taxi fare" |
| `/one-way-taxi/{city}` | 107 | /one-way-taxi/chennai | "one way taxi {city}", "drop taxi {city}", "{city} outstation cab" |
| `/outstation-taxi/{city}` | 107 | /outstation-taxi/coimbatore | outstation / round trip / package intent |
| `/airport-taxi/{city}` | 18 | /airport-taxi/chennai | "{city} airport taxi / cab / pickup / drop" |
| `/services/{service}` | 6 | /services/local-rental, /services/round-trip-taxi, /services/airport-transfer, /services/one-way-taxi, /services/drop-taxi, /services/outstation-taxi | generic service intent, hourly rental |
| `/drop-taxi`, `/one-way-taxi`, `/outstation-taxi`, `/airport-taxi`, `/services` | 5 | | directory pages (do not use as ad destinations) |
| `/tariff` | 1 | | "taxi tariff / per km rate" intent, sitelink |
| `/about /contact /faq /attach-taxi /reviews /track-booking /sitemap` and policy pages (`/terms /privacy-policy /cancellation-policy /refund-policy /payment-policy /toll-permit /luggage-policy /pet-travel-policy`) | ~16 | | sitelinks only; `/attach-taxi` is for taxi owners/drivers (use as a NEGATIVE-keyword theme, not an ad destination) |
Notes: route pages exist for hub-to-city pairs within range (not every pair). Before using a route as an ad group, verify the URL returns 200. Every landing page has the booking form (pickup/drop prefilled on route and city pages), a fare table per cab with km limit, FAQ, a sticky Call and WhatsApp button on mobile. The sitemap is https://droptaxinow.in/sitemap.xml.
Compare with my other brand drop1taxi.com (`/drop-taxi/chennai-madurai`): the new site uses the clearer `/drop-taxi/chennai-to-madurai` pattern. Never mix the two brands' keywords or URLs.

# 3. TOP ROUTES (use these first; prices are website ESTIMATES from distance tables, so quote them as "from ₹X" and keep ad price = landing-page price)
Chennai>Bangalore 345 km sedan 5,580 SUV/Innova 7,400 /drop-taxi/chennai-to-bangalore
Bangalore>Chennai 345 km 5,580 / 7,400 /drop-taxi/bangalore-to-chennai
Chennai>Madurai 460 km 7,300 / 9,700 /drop-taxi/chennai-to-madurai
Madurai>Chennai 460 km 7,300 / 9,700 /drop-taxi/madurai-to-chennai
Chennai>Coimbatore 505 km 7,980 / 10,600 /drop-taxi/chennai-to-coimbatore
Coimbatore>Chennai 505 km 7,980 / 10,600 /drop-taxi/coimbatore-to-chennai
Chennai>Pondicherry 155 km 2,730 / 3,600 /drop-taxi/chennai-to-pondicherry
Chennai>Tirupati 135 km 2,430 / 3,200 /drop-taxi/chennai-to-tirupati
Chennai>Trichy 330 km 5,350 / 7,100 /drop-taxi/chennai-to-trichy
Trichy>Chennai 330 km 5,350 / 7,100 /drop-taxi/trichy-to-chennai
Chennai>Salem 340 km 5,500 / 7,300 /drop-taxi/chennai-to-salem
Chennai>Vellore 135 km 2,430 / 3,200 /drop-taxi/chennai-to-vellore
Chennai>Tiruvannamalai 195 km 3,330 / 4,400 /drop-taxi/chennai-to-tiruvannamalai
Coimbatore>Bangalore 365 km 5,880 / 7,800 /drop-taxi/coimbatore-to-bangalore
Bangalore>Mysore 145 km 2,580 / 3,400 /drop-taxi/bangalore-to-mysore
Coimbatore>Ooty 85 km 2,350 / 3,100 /drop-taxi/coimbatore-to-ooty
Salem>Bangalore 205 km 3,480 / 4,600 /drop-taxi/salem-to-bangalore
Madurai>Kanyakumari 245 km 4,080 / 5,400 /drop-taxi/madurai-to-kanyakumari
Kochi>Trivandrum 205 km 3,480 / 4,600 /drop-taxi/kochi-to-trivandrum
Chennai>Hyderabad 630 km 9,850 / 13,100 /drop-taxi/chennai-to-hyderabad
(Short trips are billed for a minimum of 130 km.) Hub cities with the most route pages: Chennai, Bangalore, Coimbatore, Madurai, Trichy, Salem, Pondicherry, Tirupati, Vellore, Tirunelveli, Kochi, Trivandrum, Mangalore, Hyderabad.

# 4. TRACKING (the site is already instrumented; I will paste the IDs into the server settings)
- Site events pushed to dataLayer and gtag: `fare_check` (secondary), `booking_confirmed` (PRIMARY, value = estimated fare in INR), `call_click` (any tel: link), `whatsapp_click` (any WhatsApp link / chooser button).
- Create these Ads conversion actions and give me each ID/label: Booking Confirmed (primary, use transaction value), Call click (primary or secondary: your recommendation), WhatsApp click (secondary), Fare check (secondary, not for bidding). Also set up GA4 import if useful.
- I will set these environment variables from your output: GA_MEASUREMENT_ID, GOOGLE_ADS_ID, GOOGLE_ADS_BOOKING_LABEL, GOOGLE_ADS_LEAD_LABEL, GOOGLE_ADS_CALL_LABEL, GOOGLE_ADS_WHATSAPP_LABEL. The tag loads after first interaction (or 6 s), so test with real clicks.
- Tracking template suggestion: `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}`; enable auto-tagging. The site stores utm_source/medium/campaign and gclid inside each lead (also in the admin email), so offline conversion import is possible later.

# 5. CAMPAIGN STRUCTURE I WANT (propose, then I approve)
1. Search - Top Routes (one ad group per route above, route landing page, Exact + Phrase, keywords like "chennai to madurai drop taxi", "chennai to madurai one way cab", "madurai drop taxi from chennai", "chennai to madurai taxi fare").
2. Search - City One-Way (ad group per hub city, city landing page: "one way taxi chennai", "drop taxi chennai", "chennai outstation cab").
3. Search - Airport (/airport-taxi/{city} for Chennai, Bangalore, Coimbatore, Madurai, Trichy, Kochi, Trivandrum, Hyderabad, Tirupati).
4. Search - Outstation / Round Trip / Local Rental (services pages, "outstation cab booking", "round trip taxi", "8 hour car rental {city}").
5. Search - Brand (low budget: "drop taxi now", "droptaxinow").
Rules: Search only, Exact and Phrase only (no Broad), city-anchored keywords, English, geo = the 6 South-Indian states (presence), 24/7 schedule, devices all (mobile-first ads with call asset). Start with a conservative daily budget per campaign - ASK ME for the budget, currency and Google Ads account/MCC before creating anything. Bidding: recommend a start strategy while there is no conversion history (e.g. Maximize clicks with a CPC cap, then Maximize conversions / tCPA once about 30 conversions) and explain why.
Negative keywords (shared list): jobs, driver job, vacancy, salary, franchise, attach, own car, lease, rent a car without driver, self drive, bike, bus, train, flight, ticket, free, cheap, sample, pdf, ola, uber, rapido, redbus, abhibus, and every North-India/foreign location; also competitor brand names (do not bid on them: drop1taxi, droptaxitour, others).

# 6. AD COPY RULES
- RSA: 15 headlines (max 30 chars), 4 descriptions (max 90 chars), pin the route/city headline in position 1 and a "Call 6383269989" style headline in position 3. Use only the allowed claims. Each route ad group gets its own route name + "from ₹X (sedan)" + "Pay One Way Only" + "Fare Before You Book" + "Toll & Permit Extra" + "Call/WhatsApp 24/7".
- Prices in ads must match the landing page and say "from" and "estimate"; add "Toll & permit extra at actuals" somewhere.
- Assets: sitelinks (Tariff, Routes, Airport Taxi, Outstation, Local Rental, Contact), callouts (Zero Return Fare, Fare Before You Book, 24/7 Booking, Call or WhatsApp, South India Coverage), structured snippets (Services: One Way, Round Trip, Airport, Local Rental, Multi City; Destinations: top cities), call asset 6383269989 with call reporting. No location asset, no review/rating assets.

# 7. DELIVERABLES (in this order, before creating anything)
1) Account/campaign plan table (campaign, ad groups, landing URL, budget proposal, bid strategy). 2) Keyword lists per ad group with match types + the negative lists. 3) Final RSA copy per ad group (character counts checked). 4) Assets list. 5) Conversion setup steps and the exact IDs/labels for me to paste into the website settings. 6) A pre-launch checklist: every final URL returns HTTP 200 on https://droptaxinow.in, the landing price equals the ad price, conversion tags fire on a test booking, policy/disapproval check, geo settings, no Broad match, nothing enabled. 7) The questions you still need answered. Only after I approve, create the campaigns in PAUSED state and report their status.
