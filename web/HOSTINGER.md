# Deploy droptaxinow.in on Hostinger (Business / Cloud plan) – Node.js web app

Hostinger supports Node.js web apps on **Business Web Hosting** and **Cloud** plans (Node 18/20/22/24, upload a ZIP or connect GitHub).
This bundle is **pre-built**: no `npm install` and no build step is needed (`package.json` has no dependencies).

## 1. Upload
1. hPanel → **Websites → Add Website → Node.js Web App → Upload your website files**.
2. Upload `droptaxinow-hostinger.zip` (the ZIP of this folder).
3. Settings shown by Hostinger:
   * **Framework preset:** Other
   * **Node.js version:** 22.x
   * **Build command:** leave empty (or `npm run build` – it only prints "prebuilt")
   * **Entry file:** `dist/taxi/server/server.mjs`
4. Do **not** click Deploy yet – first add the environment variables (step 2) if Hostinger shows that screen; otherwise add them afterwards and **Redeploy**.

## 2. Environment variables (hPanel → the app → Environment variables)
| Variable | Value |
|---|---|
| `DATA_DIR` | A folder that survives redeploys, e.g. `/home/<your-hostinger-username>/dtn-data` (find the username under *Advanced → SSH access*). Files inside the app folder are overwritten on every deploy. |
| `GOOGLE_MAPS_SERVER_KEY` | Your Google key (Places API (New), Routes API, Geocoding API enabled) |
| `GOOGLE_MAPS_REFERER` | `https://droptaxinow.in/` (needed while the key is restricted by website) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Gmail: `smtp.gmail.com` / `465` / `true`  (Hostinger mailbox: `smtp.hostinger.com` / `465` / `true`) |
| `SMTP_USER` / `SMTP_PASS` | Sending mailbox and its **app password** |
| `MAIL_FROM` | Same address as `SMTP_USER` (Gmail rewrites other addresses) |
| `MAIL_FROM_NAME` | `Drop Taxi Now` |
| `MAIL_REPLY_TO` | Address customers should reply to |
| `ADMIN_EMAILS` | Comma separated list that receives NEW ENQUIRY / NEW BOOKING emails |
| `QUOTE_SECRET` | Any long random string (signs fare quotes) |
| `MAIL_TEST_TOKEN` | Any random word – lets you send one test email (step 4) |
| `GA_MEASUREMENT_ID`, `GOOGLE_ADS_ID`, `GOOGLE_ADS_BOOKING_LABEL`, `GOOGLE_ADS_CALL_LABEL`, `GOOGLE_ADS_WHATSAPP_LABEL` | Optional – analytics and Google Ads conversions |
| `GSC_VERIFICATION_FILE` | Optional – Search Console HTML file name, e.g. `google1234567890abcdef.html` |
| `INDEXNOW_KEY` | Optional – Bing/Yandex instant indexing key |

Never put these values in files that you upload or commit.

## 3. Domain
* Add `droptaxinow.in` to the website (hPanel → Domains). If the domain is registered elsewhere, point its nameservers (or A record) to Hostinger.
* Enable the free SSL certificate. `www.droptaxinow.in` is redirected to `droptaxinow.in` by the app.
* If Hostinger says the domain is already attached to another website, remove that placeholder website first.

## 4. Verify (5 minutes)
1. **Runtime logs** should show: `[startup] Drop Taxi Now server up | mail:true maps:true ...`
2. `https://droptaxinow.in/api/health` → `{"ok":true,"mail":true,"maps":true,...}`
3. Send a test email: `curl -X POST https://droptaxinow.in/api/mail-test -H "x-test-token: <MAIL_TEST_TOKEN>"` → `{"sent":true}` and check the admin inbox.
4. Make a real test booking on the site (use your own phone/email). You should get: the thank-you page, a customer email, an admin email, and a line in `DATA_DIR/bookings.jsonl`.
5. Test both WhatsApp buttons from the emails on your phone (WhatsApp and WhatsApp Business).

## 5. After it is live
* Google Search Console: add `https://droptaxinow.in`, verify, submit `https://droptaxinow.in/sitemap.xml`, then use **URL inspection → Request indexing** for the home page and the top routes.
* Google Business Profile for the business (same name, phone `6383269989`, website `https://droptaxinow.in`).
* Google Ads: create the conversion actions and put their labels in the env variables above, then Redeploy.
* To change fares or content later, edit the source repo, rebuild (`npm run build`), run `node scripts/make-hostinger-bundle.mjs`, upload the new ZIP and Redeploy. Data in `DATA_DIR` is kept.

## Troubleshooting
* Build is green but the site shows an error → open **Runtime logs**; usually a missing/incorrect environment variable or the entry file path.
* 403 after redeploy → redeploy again (Hostinger regenerates `.htaccess`).
* "mail:false" in `/api/health` → `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` or `MAIL_FROM` is empty.
* "Fare quote is invalid" for customers → `QUOTE_SECRET` changed between the fare check and booking (do not change it casually).
