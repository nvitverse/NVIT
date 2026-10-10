import { Booking, Quote } from '../app/core/booking.model';
import { summarise } from '../app/core/summary';
import { env } from './env';
import { SITE } from '../app/site.config';

/**
 * Maps our quote/booking onto the payload shape used by the Drop1Taxi website
 * (/api/send-enquiry.php and /api/confirm_booking.php), plus explicit source/brand fields so the
 * admin panel can label, filter and invoice these leads as "Drop Taxi Now".
 * Disabled unless ADMIN_SYNC_ENQUIRY_URL / ADMIN_SYNC_CONFIRM_URL are set.
 */
const SERVICE = { one_way: 'one_way', airport: 'one_way', round_trip: 'round_trip', hourly_rental: 'hourly_rental', multi_city: 'multi_city' } as const;
const BOOKING_TYPE = { one_way: 'ONE_WAY', airport: 'ONE_WAY', round_trip: 'ROUND_TRIP', hourly_rental: 'LOCAL_PACKAGE', multi_city: 'ONE_WAY' } as const;

export function toAdminPayload(q: Quote, vehicle: keyof Quote['fares'], booking?: Booking) {
  const r = q.request, s = summarise(q, vehicle, { booking }), f = q.fares[vehicle], a = r.attribution ?? {};
  const base = {
    bookingId: booking?.bookingId ?? q.enquiryId,
    pickup: r.pickup.text, drop: s.drop, travelDate: r.date, travelTime: r.time, endDate: r.endDate ?? null, dropTime: r.dropTime ?? null,
    passengers: r.passengers ?? 0, serviceType: SERVICE[r.service], customerName: r.contact.name,
    contactMode: 'phone', contactValue: s.customer.phoneDisplay, contactPhone: s.customer.phoneDisplay,
    countryCode: r.contact.countryCode, waCountryCode: r.contact.waCountryCode, whatsappPhone: `${r.contact.waCountryCode} ${r.contact.whatsapp}`,
    contactEmail: r.contact.email ?? '', stops: r.stops.map((x) => x.text),
    hourlyPackage: r.service === 'hourly_rental' ? `${f.hours} Hours / ${f.includedKm} KM` : null,
    fareEstimate: f.total, distanceHint: q.route.km, durationHint: q.route.durationText, fareType: r.includeToll ? 'include_toll' : 'base',
    vehicleType: vehicle, selectedVehicle: vehicle,
    vehicleEstimates: Object.fromEntries(Object.entries(q.fares).map(([k, v]) => [k, v.total])),
    fareBreakdown: f, multiCityStopCharge: f.stopCharge, pageUrl: a.page ? SITE.url + a.page : SITE.url, device: a.device ?? 'desktop',
    utmSource: a.utmSource, utmMedium: a.utmMedium, utmCampaign: a.utmCampaign, gclid: a.gclid,
    // ---- explicit labelling so the admin panel never mixes these with Drop1Taxi leads ----
    source: SITE.domain, brand: SITE.brand, brandCode: 'DTN', sourceSite: SITE.domain, siteUrl: SITE.url,
    invoiceBrand: SITE.brand, invoiceBrandPhone: SITE.phone, invoicePrefix: 'DTN'
  };
  if (!booking) return base;
  return { booking_data: { ...base, enquiryBookingId: booking.enquiryId, bookingType: BOOKING_TYPE[r.service], pickupLocation: base.pickup, dropLocation: base.drop,
    pickupDate: r.date, pickupTime: r.time, final_fare: f.total, coupon_code: q.coupon?.applied ? q.coupon.code : null, discount_amount: f.discount } , ...base };
}

async function post(url: string, body: unknown): Promise<void> {
  const { token, tokenHeader } = env.adminSync;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers[tokenHeader] = token;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`admin sync HTTP ${res.status}`);
}
export async function syncEnquiry(q: Quote, vehicle: keyof Quote['fares']): Promise<void> {
  if (env.adminSync.enquiryUrl) await post(env.adminSync.enquiryUrl, toAdminPayload(q, vehicle));
}
export async function syncBooking(q: Quote, vehicle: keyof Quote['fares'], b: Booking): Promise<void> {
  if (env.adminSync.confirmUrl) await post(env.adminSync.confirmUrl, toAdminPayload(q, vehicle, b));
}
