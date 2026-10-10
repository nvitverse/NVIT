# Deploying droptaxinow.in

The site is one Node process (`dist/taxi/server/server.mjs`): it serves the 1,160 prerendered pages and the `/api/*` endpoints
(`quote`, `confirm`, `places/*`, `attach`, `health`). It needs **a Node host** (not plain static hosting) for bookings, emails and
Google lookups. Static hosting still serves all pages, but the booking API/emails will not work there.

## Option A – Docker (any VPS, Render, Railway, Fly.io, Coolify…)
```bash
docker build -t droptaxinow .
docker run -d --name droptaxinow -p 4000:4000 -v dtn-data:/data --env-file .env droptaxinow
curl http://localhost:4000/api/health      # {"ok":true,"mail":true,"maps":true,...}
```
Put it behind HTTPS (Caddy / Nginx / the platform's TLS). Example Caddy: `droptaxinow.in { reverse_proxy 127.0.0.1:4000 }`.

## Option B – plain Node / PM2
```bash
cd web && npm ci && npm run build
PORT=4000 DATA_DIR=/var/lib/dtn pm2 start dist/taxi/server/server.mjs --name droptaxinow
```

## DNS / redirects
* `droptaxinow.in` → host. `www.droptaxinow.in` is 301-redirected to the apex by the server itself.
* Trailing-slash URLs are 301-redirected; unknown URLs return a real HTTP 404.

## Go-live checklist
1. Fill `.env` (see `.env.example`). Confirm `/api/health` shows `"mail":true` and `"maps":true`.
2. Send a test booking on the live site → check customer + admin emails, the WhatsApp / WhatsApp Business buttons, and `DATA_DIR/bookings.jsonl`.
3. Google Search Console: add property, submit `https://droptaxinow.in/sitemap.xml`; GA4 (`dataLayer` events `fare_check`, `booking_confirmed`, `whatsapp_click` are already pushed).
4. Google Business Profile, then add the real address to `src/app/site.config.ts` (`SITE.address`) so schema includes it.
5. Review the DRAFT policy pages (Terms, Privacy, Cancellation).
6. Run the Google Routes pass (see below) if you want exact km/tolls instead of estimates.

## Google Maps key
Set `GOOGLE_MAPS_SERVER_KEY` in the server environment (never commit it). The site calls Google **from the server**, so the key is never sent to browsers.

* **Key restricted by website (HTTP referrer)** – this is what Drop1Taxi uses. It works from our server because the server sends
  `Referer: https://droptaxinow.in/` (`GOOGLE_MAPS_REFERER`, default already correct). `https://droptaxinow.in/*` must be in the key's allowed websites.
* **Recommended for production:** create a *second* key restricted **by server IP address** and use that instead (a referrer-restricted key can be abused by anyone who copies it).
* APIs the key must allow (Cloud Console → Credentials → API restrictions): **Places API (New)**, **Routes API** – verified working – and **Geocoding API**
  (currently *not enabled* on the Drop1Taxi project; without it "use my current location" falls back to the nearest known city instead of an exact address).
* Set a budget alert + daily quota in Google Cloud so a traffic spike cannot run up cost. Each fare check = 1 Routes call (cached 6 h per route); each suggestion keystroke batch = 1 Places call.

## Data you can change without redeploy
* `DATA_DIR/coupons.json` – promo codes: `[{"code":"WELCOME100","type":"flat","value":100,"active":true,"expires":"2027-03-31"}]`
* Rates: edit `src/app/data/fares.json` (rebuild/redeploy).
