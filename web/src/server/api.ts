import { Router, Request, Response, json } from 'express';
import { randomBytes } from 'node:crypto';
import { Booking, Contact, Quote, QuoteRequest, makeRef } from '../app/core/booking.model';
import { FARES } from '../app/core/fares';
import { ServiceType, VehicleId } from '../app/core/fare';
import { Place } from '../app/core/geo';
import { buildQuote } from '../app/core/quote';
import { summarise } from '../app/core/summary';
import { CITY_MAP } from '../app/data';
import { SITE } from '../app/site.config';
import { findCoupon } from './coupons';
import { routeFor } from './distance';
import { adminLeadEmail, customerBookingEmail, vendorLeadEmail } from './emails';
import { env } from './env';
import { mailConfigured, sendMail } from './mail';
import { details, reverse, suggest, checkRegion } from './places';
import { syncBooking, syncEnquiry } from './admin-sync';
import { appendJsonl } from './store';
import { signQuote, verifyQuote } from './token';

const SERVICES: ServiceType[] = ['one_way', 'round_trip', 'hourly_rental', 'multi_city', 'airport'];
const VEHICLES: VehicleId[] = ['SEDAN', 'SUV', 'INNOVA', 'CRYSTA'];
const QUOTE_TTL_MS = 48 * 3600_000;

const hits = new Map<string, number[]>();
function limited(req: Request, bucket: string, max: number): boolean {
  const k = `${bucket}:${req.ip}`, now = Date.now();
  const arr = (hits.get(k) ?? []).filter((t) => now - t < 60_000);
  arr.push(now); hits.set(k, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** Normalises a client-supplied place. Known cities are canonicalised so coordinates/slug cannot be spoofed. */
function cleanPlace(p: unknown): { place?: Place; error?: string } {
  const o = (p ?? {}) as Record<string, unknown>;
  const text = str(o['text'], 200);
  if (!text) return { error: 'Please choose a pickup and drop location.' };
  const slug = str(o['citySlug'], 40);
  const city = slug ? CITY_MAP.get(slug) : undefined;
  if (city) return { place: { text: str(o['text'], 200) || `${city.name}, ${city.state}`, lat: city.lat, lng: city.lng, citySlug: city.slug, state: city.state } };
  const lat = Number(o['lat']), lng = Number(o['lng']);
  if (!isFinite(lat) || !isFinite(lng)) return { error: 'Please pick a location from the suggestions.' };
  const r = checkRegion({ text, lat, lng, state: str(o['state'], 60) || undefined });
  return r.place ? { place: r.place } : { error: r.error };
}

function cleanContact(c: unknown): { contact?: Contact; error?: string } {
  const o = (c ?? {}) as Record<string, unknown>;
  const name = str(o['name'], 80);
  const cc = str(o['countryCode'], 6) || '+91', phone = str(o['phone'], 20).replace(/\D/g, '');
  const waCc = str(o['waCountryCode'], 6) || cc, wa = (str(o['whatsapp'], 20).replace(/\D/g, '')) || phone;
  const email = str(o['email'], 120);
  if (name.length < 2) return { error: 'Please enter your name.' };
  if (cc === '+91' ? !/^[6-9]\d{9}$/.test(phone) : !/^\d{6,15}$/.test(phone)) return { error: 'Please enter a valid mobile number.' };
  if (waCc === '+91' ? !/^[6-9]\d{9}$/.test(wa) : !/^\d{6,15}$/.test(wa)) return { error: 'Please enter a valid WhatsApp number.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'Please enter a valid email address.' };
  return { contact: { name, countryCode: cc, phone, waCountryCode: waCc, whatsapp: wa, email: email || undefined } };
}

export function validateQuoteRequest(b: Record<string, unknown>): { req?: QuoteRequest; error?: string } {
  const service = str(b['service'], 20) as ServiceType;
  if (!SERVICES.includes(service)) return { error: 'Invalid service type.' };
  const pu = cleanPlace(b['pickup']); if (!pu.place) return { error: pu.error };
  let drop: Place | undefined;
  if (service !== 'hourly_rental') { const d = cleanPlace(b['drop']); if (!d.place) return { error: d.error }; drop = d.place; }
  if (drop && drop.lat === pu.place.lat && drop.lng === pu.place.lng) return { error: 'Pickup and drop cannot be the same place.' };
  const stopsIn = Array.isArray(b['stops']) ? (b['stops'] as unknown[]).slice(0, 10) : [];
  const stops: Place[] = [];
  if (service === 'multi_city') for (const s of stopsIn) { if (!s || !str((s as Record<string, unknown>)['text'], 5)) continue; const r = cleanPlace(s); if (!r.place) return { error: r.error }; stops.push(r.place); }
  const date = str(b['date'], 10), time = str(b['time'], 5);
  if (!isDate(date) || date < todayIST()) return { error: 'Please choose a valid pickup date (today or later).' };
  if (date > new Date(Date.now() + 366 * 86400_000).toISOString().slice(0, 10)) return { error: 'Pickup date is too far ahead.' };
  if (!isTime(time)) return { error: 'Please choose a pickup time.' };
  let endDate: string | undefined, dropTime: string | undefined;
  if (service === 'round_trip' || service === 'multi_city') {
    endDate = str(b['endDate'], 10); dropTime = str(b['dropTime'], 5) || undefined;
    if (!isDate(endDate) || endDate < date) return { error: 'Return date must be on or after the pickup date.' };
    if (dropTime && !isTime(dropTime)) return { error: 'Invalid return time.' };
  }
  const hours = service === 'hourly_rental' ? Number(b['hours']) : undefined;
  if (service === 'hourly_rental' && !FARES.hourlyPackages.includes(hours as number)) return { error: 'Please choose a rental package.' };
  const ct = cleanContact(b['contact']); if (!ct.contact) return { error: ct.error };
  const at = (b['attribution'] ?? {}) as Record<string, unknown>;
  return { req: {
    service, pickup: pu.place, drop, stops, date, time, endDate, dropTime, hours,
    passengers: Math.max(0, Math.min(60, Math.floor(Number(b['passengers']) || 0))), includeToll: b['includeToll'] === true,
    coupon: str(b['coupon'], 24) || undefined, contact: ct.contact,
    attribution: { source: str(at['source'], 40) || undefined, utmSource: str(at['utmSource'], 60) || undefined, utmMedium: str(at['utmMedium'], 60) || undefined,
      utmCampaign: str(at['utmCampaign'], 80) || undefined, gclid: str(at['gclid'], 120) || undefined, page: str(at['page'], 160) || undefined,
      device: at['device'] === 'mobile' ? 'mobile' : 'desktop' }
  } };
}

async function notifyTelegram(text: string): Promise<void> {
  if (!env.telegramToken || !env.telegramChat) return;
  await fetch(`https://api.telegram.org/bot${env.telegramToken}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.telegramChat, text }), signal: AbortSignal.timeout(8000) });
}
const bg = (p: Promise<unknown>, label: string) => p.catch((e) => console.error(`[${label}]`, (e as Error).message));

const confirmed = new Map<string, Booking>();

export function apiRouter(): Router {
  const r = Router();
  r.use(json({ limit: '20kb' }));

  r.get('/health', (_q, res) => { res.json({ ok: true, mail: mailConfigured(), maps: !!env.mapsKey, adminSync: !!(env.adminSync.enquiryUrl || env.adminSync.confirmUrl) }); });
  r.get('/config', (_q, res) => { res.setHeader('Cache-Control', 'public, max-age=300'); res.json({ places: !!env.mapsKey, brand: SITE.brand }); });

  r.get('/places/suggest', async (req, res) => {
    if (limited(req, 'places', 60)) { res.status(429).json({ error: 'Too many requests' }); return; }
    res.json({ items: await suggest(str(req.query['q'], 80)) });
  });
  r.get('/places/details', async (req, res) => {
    if (limited(req, 'places', 60)) { res.status(429).json({ error: 'Too many requests' }); return; }
    const d = await details(str(req.query['id'], 200), str(req.query['text'], 200));
    if (d.place) res.json({ place: d.place }); else res.status(422).json({ error: d.error });
  });
  r.get('/places/reverse', async (req, res) => {
    if (limited(req, 'places', 30)) { res.status(429).json({ error: 'Too many requests' }); return; }
    const d = await reverse(Number(req.query['lat']), Number(req.query['lng']));
    if (d.place) res.json({ place: d.place }); else res.status(422).json({ error: d.error });
  });

  /** Step 1: fare check. Captures the enquiry and returns a signed quote for every cab. */
  r.post('/quote', async (req, res) => {
    if (limited(req, 'quote', 20)) { res.status(429).json({ error: 'Too many requests. Please try again in a minute.' }); return; }
    const v = validateQuoteRequest((req.body ?? {}) as Record<string, unknown>);
    if (!v.req) { res.status(400).json({ error: v.error }); return; }
    const q = v.req;
    const route = q.service === 'hourly_rental'
      ? { km: (q.hours as number) * FARES.kmPerHour, durationText: `${q.hours} hrs`, toll: null, source: 'package' as const }
      : await routeFor(q.service === 'round_trip' || q.service === 'one_way' || q.service === 'airport' ? [q.pickup, q.drop as Place] : [q.pickup, ...q.stops, q.drop as Place]);
    const cp = findCoupon(q.coupon);
    const quote: Quote = buildQuote(q, route, FARES, cp.coupon);
    if (q.coupon && !cp.coupon) quote.coupon = { code: q.coupon.toUpperCase(), type: 'flat', value: 0, label: '', applied: false, message: cp.error };
    const token = signQuote(quote);
    appendJsonl('enquiries.jsonl', { ...quote, ip: req.ip });
    const s = summarise(quote, 'SEDAN');
    bg(sendMail(env.adminEmails, adminLeadEmail(s, quote, { kind: 'enquiry', ip: req.ip }), { tag: 'admin-enquiry', replyTo: q.contact.email }), 'mail');
    bg(syncEnquiry(quote, 'SEDAN'), 'admin-sync');
    bg(notifyTelegram(`[${SITE.brand}] New enquiry ${quote.enquiryId}\n${q.contact.name} ${s.customer.phoneDisplay}\n${s.pickup} → ${s.drop}\n${s.distanceText} | Sedan ${quote.fares.SEDAN.total}`), 'telegram');
    res.json({ quote, token });
  });

  /** Step 2: customer confirms a cab. Verifies the signed quote, then emails customer + admin. */
  r.post('/confirm', async (req, res) => {
    if (limited(req, 'confirm', 10)) { res.status(429).json({ error: 'Too many requests. Please try again in a minute.' }); return; }
    const b = (req.body ?? {}) as { quote?: Quote; token?: string; vehicle?: string };
    const vehicle = b.vehicle as VehicleId;
    if (!b.quote || !b.token || !VEHICLES.includes(vehicle) || !verifyQuote(b.quote, b.token)) { res.status(400).json({ error: 'This fare quote is invalid. Please check the fare again.' }); return; }
    if (Date.now() - Date.parse(b.quote.createdAt) > QUOTE_TTL_MS) { res.status(410).json({ error: 'This fare quote has expired. Please check the fare again.' }); return; }
    const quote = b.quote;
    let booking = confirmed.get(quote.enquiryId);
    const fresh = !booking;
    if (!booking) {
      booking = { bookingId: makeRef('B'), enquiryId: quote.enquiryId, confirmedAt: new Date().toISOString(), vehicle, quote };
      confirmed.set(quote.enquiryId, booking);
      if (confirmed.size > 5000) confirmed.delete(confirmed.keys().next().value as string);
      appendJsonl('bookings.jsonl', { ...booking, ip: req.ip });
    }
    const s = summarise(quote, booking.vehicle, { booking });
    if (fresh) {
      const email = quote.request.contact.email;
      if (email) bg(sendMail([email], customerBookingEmail(s), { tag: 'customer-booking' }), 'mail');
      bg(sendMail(env.adminEmails, adminLeadEmail(s, quote, { kind: 'booking', ip: req.ip }), { tag: 'admin-booking', replyTo: email }), 'mail');
      bg(syncBooking(quote, booking.vehicle, booking), 'admin-sync');
      bg(notifyTelegram(`[${SITE.brand}] NEW BOOKING ${booking.bookingId}\n${s.customer.name} ${s.customer.phoneDisplay}\n${s.pickup} → ${s.drop}\n${s.vehicleName} ${s.totalText}`), 'telegram');
    }
    res.json({ booking, summary: s, emailed: !!quote.request.contact.email });
  });

  r.post('/attach', async (req, res) => {
    if (limited(req, 'attach', 5)) { res.status(429).json({ error: 'Too many requests.' }); return; }
    const b = (req.body ?? {}) as Record<string, unknown>;
    const v = { name: str(b['name'], 80), phone: str(b['phone'], 20).replace(/\D/g, '').slice(-10), city: str(b['city'], 60), vehicle: str(b['vehicle'], 60), vehicleNo: str(b['vehicleNo'], 20), message: str(b['message'], 500) };
    if (v.name.length < 2 || !/^[6-9]\d{9}$/.test(v.phone) || !v.city || !v.vehicle) { res.status(400).json({ error: 'Please fill name, a valid mobile number, city and vehicle.' }); return; }
    const ref = 'DTN-V-' + randomBytes(3).toString('hex').toUpperCase();
    appendJsonl('attach-requests.jsonl', { ref, at: new Date().toISOString(), ...v });
    bg(sendMail(env.adminEmails, vendorLeadEmail({ ...v, ref }), { tag: 'admin-attach' }), 'mail');
    res.json({ ok: true, ref });
  });

  r.use((_q, res) => { res.status(404).json({ error: 'Not found' }); });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  r.use((err: Error & { status?: number }, _q: Request, res: Response, _n: unknown) => { res.status(err.status === 400 || err.status === 413 ? err.status : 500).json({ error: err.status === 413 ? 'Request too large' : 'Invalid request' }); });
  return r;
}
