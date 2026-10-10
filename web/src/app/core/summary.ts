import { Booking, Quote, SERVICE_LABEL } from './booking.model';
import { FareBreakdown, VehicleId } from './fare';
import { SITE } from '../site.config';
import { dateLabel, inr, intlDigits, timeLabel } from './format';
import { VEHICLE_META } from './vehicles-meta';

/** Everything a message/email/invoice needs about one trip, in display-ready form. */
export interface TripSummary {
  ref: string;
  kind: 'enquiry' | 'booking';
  brand: string;
  siteUrl: string;
  serviceLabel: string;
  pickup: string; drop: string; stops: string[];
  dateText: string; timeText: string; returnText: string;
  distanceText: string; durationText: string;
  vehicleName: string; vehicleModels: string; vehicleId: VehicleId;
  passengers: number;
  customer: { name: string; phoneIntl: string; phoneDisplay: string; waIntl: string; email: string };
  fare: FareBreakdown;
  lines: { label: string; value: string }[];
  kmPolicy: string;
  extrasNote: string;
  couponText: string;
  routeUrl: string; mapsUrl: string; tariffUrl: string; termsUrl: string; cancelUrl: string;
  source: string;
  totalText: string;
}

export function routePageUrl(pickupSlug?: string, dropSlug?: string): string {
  return pickupSlug && dropSlug ? `${SITE.url}/drop-taxi/${pickupSlug}-to-${dropSlug}` : `${SITE.url}/drop-taxi`;
}
export function mapsDirUrl(pickup: string, drop: string, stops: string[]): string {
  const q = new URLSearchParams({ api: '1', origin: pickup, destination: drop, travelmode: 'driving' });
  if (stops.length) q.set('waypoints', stops.join('|'));
  return 'https://www.google.com/maps/dir/?' + q.toString();
}

export function kmPolicyText(f: FareBreakdown): string {
  if (f.service === 'hourly_rental')
    return `${f.hours}-hour package includes ${f.includedKm} km (${f.hours} hrs x 10 km). Extra km ${inr(f.extraKmRate)}/km, extra hour ${inr(f.extraHourRate)}/hr.`;
  if (f.service === 'round_trip' || f.service === 'multi_city')
    return `Billed on ${f.billableKm} km (minimum ${f.minimumKm} km = ${f.days} day${f.days > 1 ? 's' : ''} x 250 km). Km beyond that are charged at ${inr(f.extraKmRate)}/km.`;
  return `Fare covers up to ${f.billableKm} km (minimum ${f.minimumKm} km billing). Extra km beyond that are charged at ${inr(f.extraKmRate)}/km.`;
}

export function fareLines(f: FareBreakdown): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (f.service === 'hourly_rental') out.push({ label: `${f.hours} hrs package x ${inr(f.perKmRate)}/hr`, value: inr(f.kmCharge) });
  else out.push({ label: `${f.billableKm} km x ${inr(f.perKmRate)}/km`, value: inr(f.kmCharge) });
  if (f.batta) out.push({ label: f.days > 1 ? `Driver batta (${f.days} days)` : 'Driver batta', value: inr(f.batta) });
  if (f.stopCharge) out.push({ label: 'Extra stops', value: inr(f.stopCharge) });
  if (f.toll) out.push({ label: 'Estimated toll (included)', value: inr(f.toll) });
  if (f.discount) out.push({ label: 'Coupon discount', value: '-' + inr(f.discount) });
  return out;
}

export function summarise(q: Quote, vehicle: VehicleId, opts: { booking?: Booking } = {}): TripSummary {
  const r = q.request, f = q.fares[vehicle], meta = VEHICLE_META[vehicle];
  const c = r.contact;
  const drop = r.service === 'hourly_rental' ? 'Local hourly rental' : (r.drop?.text ?? '');
  const phoneIntl = intlDigits(c.countryCode, c.phone);
  const stops = r.stops.map((s) => s.text);
  const ref = opts.booking?.bookingId ?? q.enquiryId;
  const toll = q.route.toll;
  const extras = f.toll
    ? 'State permit / border charges and parking are extra at actuals.'
    : toll
      ? `Toll (est. ${inr(toll)}), state permit / border charges and parking are extra at actuals.`
      : 'Toll, state permit / border charges and parking are extra at actuals.';
  return {
    ref, kind: opts.booking ? 'booking' : 'enquiry', brand: SITE.brand, siteUrl: SITE.url,
    serviceLabel: SERVICE_LABEL[r.service], pickup: r.pickup.text, drop, stops,
    dateText: dateLabel(r.date), timeText: timeLabel(r.time),
    returnText: r.endDate ? `${dateLabel(r.endDate)}${r.dropTime ? ' · ' + timeLabel(r.dropTime) : ''}` : '',
    distanceText: r.service === 'hourly_rental' ? `${f.hours} hrs / ${f.includedKm} km package` : `~${Math.round(q.route.km)} km one way`,
    durationText: r.service === 'hourly_rental' ? `${f.hours} hrs` : q.route.durationText,
    vehicleName: meta.name, vehicleModels: meta.models, vehicleId: vehicle,
    passengers: r.passengers ?? 0,
    customer: { name: c.name, phoneIntl, phoneDisplay: `${c.countryCode} ${c.phone}`, waIntl: intlDigits(c.waCountryCode, c.whatsapp), email: c.email ?? '' },
    fare: f, lines: fareLines(f), kmPolicy: kmPolicyText(f), extrasNote: extras,
    couponText: q.coupon?.applied ? `${q.coupon.code} (${q.coupon.label})` : '',
    routeUrl: routePageUrl(r.pickup.citySlug, r.drop?.citySlug),
    mapsUrl: r.service === 'hourly_rental' ? '' : mapsDirUrl(r.pickup.text, drop, stops),
    tariffUrl: SITE.url + '/tariff', termsUrl: SITE.url + '/terms', cancelUrl: SITE.url + '/cancellation-policy',
    source: SITE.domain, totalText: inr(f.total)
  };
}
