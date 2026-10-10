import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuote, tripDays } from '../src/app/core/quote';
import { FARES } from '../src/app/core/fares';
import { estimateRoute } from '../src/app/core/estimate';
import { placeOfCity } from '../src/app/core/local-places';
import { CITY_MAP } from '../src/app/data';
import { QuoteRequest } from '../src/app/core/booking.model';
import { summarise } from '../src/app/core/summary';
import { chooserUrl, messageToBusiness, messageToCustomer, waBusinessAndroid, waLink } from '../src/app/core/whatsapp';
import { customerBookingEmail, adminLeadEmail } from '../src/server/emails';
import { toAdminPayload } from '../src/server/admin-sync';
import { validateQuoteRequest } from '../src/server/api';
import { signQuote, verifyQuote } from '../src/server/token';
import { dateLabel, timeLabel } from '../src/app/core/format';

const city = (s: string) => placeOfCity(CITY_MAP.get(s)!);
const base = (over: Partial<QuoteRequest> = {}): QuoteRequest => ({
  service: 'one_way', pickup: city('chennai'), drop: city('madurai'), stops: [], date: '2026-12-20', time: '09:00', passengers: 3, includeToll: false,
  contact: { name: 'Test User', countryCode: '+91', phone: '9876543210', waCountryCode: '+91', whatsapp: '9876543210', email: 'a@b.co' }, ...over
});
const mk = (over?: Partial<QuoteRequest>) => { const r = base(over); return buildQuote(r, estimateRoute([r.pickup, r.drop!]), FARES); };

test('trip days is inclusive', () => { assert.equal(tripDays('2026-12-20', '2026-12-22'), 3); assert.equal(tripDays('2026-12-20', '2026-12-20'), 1); assert.equal(tripDays('2026-12-22', '2026-12-20'), 1); });
test('quote has all four vehicles with matching totals', () => {
  const q = mk(); assert.deepEqual(Object.keys(q.fares), ['SEDAN', 'SUV', 'INNOVA', 'CRYSTA']);
  assert.equal(q.route.km, 460); assert.equal(q.fares.SEDAN.total, 7300); // 460*15+400
});
test('enquiry id format', () => { assert.match(mk().enquiryId, /^DTN-E-\d{6}-[A-Z2-9]{4}$/); });
test('date/time labels', () => { assert.equal(dateLabel('2026-12-20'), 'Sun, 20 Dec 2026'); assert.equal(timeLabel('21:05'), '09:05 PM'); assert.equal(timeLabel('00:30'), '12:30 AM'); });

test('WhatsApp message to business includes km limit, extras, route + policy links, ref', () => {
  const q = mk(), s = summarise(q, 'SEDAN'), m = messageToBusiness(s);
  for (const needle of ['Fare Enquiry', q.enquiryId, 'Km limit:', 'Extra km', 'extra at actuals', 'google.com/maps/dir', '/drop-taxi/chennai-to-madurai', '/tariff', '/terms', '/cancellation-policy', '*Estimated fare: ₹7,300*', 'Chennai', 'Madurai'])
    assert.ok(m.includes(needle), 'missing: ' + needle);
  assert.ok(m.length < 2500, 'message too long: ' + m.length);
});
test('booking message says Booking Request and uses booking id', () => {
  const q = mk(); const b = { bookingId: 'DTN-B-261010-ABCD', enquiryId: q.enquiryId, confirmedAt: new Date().toISOString(), vehicle: 'SEDAN' as const, quote: q };
  const m = messageToBusiness(summarise(q, 'SEDAN', { booking: b })); assert.ok(m.includes('Booking Request') && m.includes('DTN-B-261010-ABCD'));
});
test('customer message greets by name and promises driver details', () => {
  const m = messageToCustomer(summarise(mk(), 'SEDAN')); assert.ok(m.includes('Hello Test User') && m.includes('driver name'));
});
test('hourly km limit text', () => {
  const r = base({ service: 'hourly_rental', drop: undefined, hours: 8 }); const q = buildQuote(r, { km: 80, durationText: '8 hrs', toll: null, source: 'package' }, FARES);
  const s = summarise(q, 'SEDAN'); assert.ok(s.kmPolicy.includes('80 km') && s.kmPolicy.includes('extra hour'));
});
test('round trip km policy mentions daily minimum', () => {
  const r = base({ service: 'round_trip', endDate: '2026-12-21' }); const q = buildQuote(r, estimateRoute([r.pickup, r.drop!]), FARES);
  assert.ok(summarise(q, 'SEDAN').kmPolicy.includes('250 km')); assert.equal(q.days, 2);
});
test('whatsapp link builders', () => {
  assert.equal(waLink('+91 63839 69989', 'hi there'), 'https://wa.me/916383969989?text=hi%20there');
  assert.ok(waBusinessAndroid('916383269989', 'hi').includes('package=com.whatsapp.w4b'));
  const c = chooserUrl('916383269989', 'hello world'); assert.ok(c.startsWith('https://droptaxinow.in/whatsapp?to=916383269989&t=hello'));
});

test('customer email: both WhatsApp + WhatsApp Business buttons, km limit, branding', () => {
  const s = summarise(mk(), 'SEDAN'); const m = customerBookingEmail(s);
  assert.ok(m.html.includes('wa.me/916383269989') && m.html.includes('app=business') && m.html.includes('WhatsApp Business'));
  assert.ok(m.html.includes('Km limit') && m.html.includes('Drop Taxi') && m.subject.includes('DTN-'));
});
test('admin email labelled with source site and messages the CUSTOMER', () => {
  const q = mk(), m = adminLeadEmail(summarise(q, 'SEDAN'), q, { kind: 'enquiry' });
  assert.ok(m.html.includes('droptaxinow.in') && m.html.includes('NEW ENQUIRY') && m.html.includes('wa.me/919876543210'));
  assert.ok(m.subject.startsWith('[Drop Taxi Now]'));
});
test('email escapes HTML in customer-controlled fields', () => {
  const q = mk({ contact: { name: '<script>alert(1)</script>', countryCode: '+91', phone: '9876543210', waCountryCode: '+91', whatsapp: '9876543210' } });
  const m = adminLeadEmail(summarise(q, 'SEDAN'), q, { kind: 'booking' }); assert.ok(!m.html.includes('<script>alert(1)</script>') && m.html.includes('&lt;script&gt;'));
});
test('admin payload carries brand/source labels for invoices', () => {
  const q = mk(); const p = toAdminPayload(q, 'SEDAN') as Record<string, unknown>;
  assert.equal(p['source'], 'droptaxinow.in'); assert.equal(p['brand'], 'Drop Taxi Now'); assert.equal(p['invoicePrefix'], 'DTN');
  assert.equal(p['serviceType'], 'one_way'); assert.equal(p['fareEstimate'], 7300); assert.match(String(p['bookingId']), /^DTN-E-/);
});

const iso = (n: number) => new Date(Date.now() + (n + 0.5) * 86400000).toISOString().slice(0, 10);
const body = (o: Record<string, unknown> = {}) => ({ service: 'one_way', pickup: { text: 'Chennai', citySlug: 'chennai' }, drop: { text: 'Madurai', citySlug: 'madurai' },
  date: iso(30), time: '09:00', contact: { name: 'Test User', phone: '9876543210' }, ...o });
test('validate: accepts a good request and canonicalises known cities', () => {
  const v = validateQuoteRequest(body({ pickup: { text: 'x', citySlug: 'chennai', lat: 1, lng: 1 } })); assert.ok(v.req, v.error);
  assert.equal(v.req!.pickup.lat, CITY_MAP.get('chennai')!.lat);
});
test('validate: rejects non South India place', () => {
  const v = validateQuoteRequest(body({ drop: { text: 'Delhi', lat: 28.6, lng: 77.2 } })); assert.ok(v.error?.includes('South India'));
});
test('validate: rejects wrong-state place even inside bounding box', () => {
  const v = validateQuoteRequest(body({ drop: { text: 'Pune', lat: 18.5, lng: 73.9, state: 'Maharashtra' } })); assert.ok(v.error?.includes('South India'));
});
test('validate: bad phone, past date, same place, bad service', () => {
  assert.ok(validateQuoteRequest(body({ contact: { name: 'Test', phone: '12345' } })).error);
  assert.ok(validateQuoteRequest(body({ date: '2001-01-01' })).error);
  assert.ok(validateQuoteRequest(body({ drop: { text: 'Chennai', citySlug: 'chennai' } })).error);
  assert.ok(validateQuoteRequest(body({ service: 'bus' })).error);
});
test('validate: hourly needs a valid package; round trip needs return date', () => {
  assert.ok(validateQuoteRequest(body({ service: 'hourly_rental', hours: 7 })).error);
  assert.ok(validateQuoteRequest(body({ service: 'hourly_rental', hours: 8 })).req);
  assert.ok(validateQuoteRequest(body({ service: 'round_trip' })).error);
  assert.ok(validateQuoteRequest(body({ service: 'round_trip', endDate: iso(31) })).req);
});
test('validate: multi city keeps up to 10 stops', () => {
  const stops = Array.from({ length: 14 }, () => ({ text: 'Trichy', citySlug: 'trichy' }));
  assert.equal(validateQuoteRequest(body({ service: 'multi_city', stops, endDate: iso(31) })).req!.stops.length, 10);
});
test('quote token detects tampering', () => {
  const q = mk(), t = signQuote(q); assert.ok(verifyQuote(q, t));
  const evil = JSON.parse(JSON.stringify(q)); evil.fares.SEDAN.total = 1; assert.ok(!verifyQuote(evil, t));
  assert.ok(!verifyQuote(q, 'bogus'));
});
