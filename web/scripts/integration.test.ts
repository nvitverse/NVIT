import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { SMTPServer } from 'smtp-server';
import { buildQuote } from '../src/app/core/quote';
import { FARES } from '../src/app/core/fares';
import { estimateRoute } from '../src/app/core/estimate';
import { placeOfCity } from '../src/app/core/local-places';
import { CITY_MAP } from '../src/app/data';
import { QuoteRequest } from '../src/app/core/booking.model';
import { summarise } from '../src/app/core/summary';
import { customerBookingEmail, adminLeadEmail } from '../src/server/emails';
import { sendMail } from '../src/server/mail';
import { syncBooking, syncEnquiry } from '../src/server/admin-sync';

const req: QuoteRequest = { service: 'one_way', pickup: placeOfCity(CITY_MAP.get('chennai')!), drop: placeOfCity(CITY_MAP.get('madurai')!), stops: [], date: '2026-12-20', time: '09:00',
  passengers: 2, includeToll: false, contact: { name: 'Ravi', countryCode: '+91', phone: '9876543210', waCountryCode: '+91', whatsapp: '9876543210', email: 'ravi@example.com' } };
const quote = buildQuote(req, estimateRoute([req.pickup, req.drop!]), FARES);

test('SMTP: sends multipart email with correct From / To / Reply-To / subject', async () => {
  const received: string[] = [];
  const server = new SMTPServer({ authOptional: false, disabledCommands: ['STARTTLS'], allowInsecureAuth: true,
    onAuth: (_a, _s, cb) => cb(null, { user: 'u' }),
    onData(stream, _s, cb) { let d = ''; stream.on('data', (c) => (d += c)); stream.on('end', () => { received.push(d); cb(); }); } });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.server.address() as AddressInfo).port;
  Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port), SMTP_USER: 'u', SMTP_PASS: 'p', MAIL_FROM: 'bookings@droptaxinow.in', MAIL_FROM_NAME: 'Drop Taxi Now', MAIL_REPLY_TO: 'support@droptaxinow.in' });
  const s = summarise(quote, 'SEDAN');
  const r1 = await sendMail(['ravi@example.com'], customerBookingEmail(s), { tag: 't1' });
  const r2 = await sendMail(['owner@example.com', 'ops@example.com'], adminLeadEmail(s, quote, { kind: 'enquiry' }), { tag: 't2', replyTo: 'ravi@example.com' });
  server.close();
  assert.equal(r1.sent, true, r1.error); assert.equal(r2.sent, true, r2.error);
  assert.equal(received.length, 2);
  const [c, a] = received;
  assert.match(c, /From: Drop Taxi Now <bookings@droptaxinow\.in>/); assert.match(c, /To: ravi@example\.com/); assert.match(c, /Reply-To: support@droptaxinow\.in/);
  assert.match(c, /multipart\/alternative/); assert.match(c, /Subject: =\?UTF-8\?Q\?Booking_request_DTN-E-/);
  assert.match(a, /To: owner@example\.com, ops@example\.com/); assert.match(a, /Reply-To: ravi@example\.com/); assert.match(a, /Subject: =\?UTF-8\?Q\?=5BDrop_Taxi_Now=5D_NEW_ENQUIRY/);
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_FROM_NAME', 'MAIL_REPLY_TO']) delete process.env[k];
});

test('admin sync posts labelled payloads with auth header', async () => {
  const hits: { url: string; headers: http.IncomingHttpHeaders; body: Record<string, unknown> }[] = [];
  const srv = http.createServer((rq, rs) => { let d = ''; rq.on('data', (c) => (d += c)); rq.on('end', () => { hits.push({ url: rq.url!, headers: rq.headers, body: JSON.parse(d) }); rs.setHeader('content-type', 'application/json'); rs.end('{"success":true}'); }); });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  const port = (srv.address() as AddressInfo).port;
  Object.assign(process.env, { ADMIN_SYNC_ENQUIRY_URL: `http://127.0.0.1:${port}/api/send-enquiry.php`, ADMIN_SYNC_CONFIRM_URL: `http://127.0.0.1:${port}/api/confirm_booking.php`, ADMIN_SYNC_TOKEN: 'secret-token' });
  const booking = { bookingId: 'DTN-B-261010-ABCD', enquiryId: quote.enquiryId, confirmedAt: new Date().toISOString(), vehicle: 'INNOVA' as const, quote };
  await syncEnquiry(quote, 'SEDAN'); await syncBooking(quote, 'INNOVA', booking);
  srv.close();
  assert.equal(hits.length, 2);
  assert.equal(hits[0].url, '/api/send-enquiry.php'); assert.equal(hits[0].headers['x-dropcars-token'], 'secret-token');
  assert.equal(hits[0].body['source'], 'droptaxinow.in'); assert.equal(hits[0].body['brand'], 'Drop Taxi Now'); assert.match(String(hits[0].body['bookingId']), /^DTN-E-/);
  const bd = hits[1].body['booking_data'] as Record<string, unknown>;
  assert.equal(hits[1].url, '/api/confirm_booking.php'); assert.equal(bd['bookingType'], 'ONE_WAY'); assert.equal(bd['bookingId'], 'DTN-B-261010-ABCD'); assert.equal(bd['final_fare'], 9700);
  assert.equal(bd['invoiceBrand'], 'Drop Taxi Now'); assert.equal(bd['sourceSite'], 'droptaxinow.in');
  for (const k of ['ADMIN_SYNC_ENQUIRY_URL', 'ADMIN_SYNC_CONFIRM_URL', 'ADMIN_SYNC_TOKEN']) delete process.env[k];
});

test('admin sync is a no-op when not configured', async () => {
  await syncEnquiry(quote, 'SEDAN'); // must not throw or call the network
});
