import { SITE } from '../site.config';
import { TripSummary } from './summary';
import { cleanDigits } from './format';

/** Standard WhatsApp link (opens WhatsApp Messenger, or whichever app owns wa.me on the device). */
export const waLink = (phoneIntl: string, text = '') =>
  `https://wa.me/${cleanDigits(phoneIntl)}${text ? '?text=' + encodeURIComponent(text) : ''}`;

/** Android intent that opens WhatsApp Business specifically, with a wa.me fallback. Best-effort; test on device. */
export const waBusinessAndroid = (phoneIntl: string, text = '') =>
  `intent://send/?phone=${cleanDigits(phoneIntl)}&text=${encodeURIComponent(text)}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;` +
  `S.browser_fallback_url=${encodeURIComponent(waLink(phoneIntl, text))};end`;

/** iOS custom scheme for WhatsApp Business (only opens if the app is installed). */
export const waBusinessIos = (phoneIntl: string, text = '') =>
  `whatsapp-business://send?phone=${cleanDigits(phoneIntl)}&text=${encodeURIComponent(text)}`;

/**
 * Link to our own chooser page. Works in email clients (plain https link) and lets the person pick
 * WhatsApp or WhatsApp Business. `to` = destination number (intl digits), `text` = prefilled message.
 */
export function chooserUrl(toIntl: string, text: string, base = SITE.url): string {
  const q = new URLSearchParams({ to: cleanDigits(toIntl), t: text });
  return `${base}/whatsapp?${q.toString()}`;
}

const E = { taxi: '🚖', pin: '📍', flag: '🏁', cal: '📅', car: '🚗', money: '💰', map: '🗺️', link: '🔗', doc: '📄', user: '👤', warn: 'ℹ️' };

function tripBlock(s: TripSummary): string[] {
  const l: string[] = [];
  l.push(`*Trip:* ${s.serviceLabel}`);
  l.push(`${E.pin} *From:* ${s.pickup}`);
  s.stops.forEach((x, i) => l.push(`   ↳ *Stop ${i + 1}:* ${x}`));
  if (s.drop) l.push(`${E.flag} *To:* ${s.drop}`);
  l.push(`${E.cal} *Pickup:* ${s.dateText}${s.timeText ? ' · ' + s.timeText : ''}`);
  if (s.returnText) l.push(`${E.cal} *Return:* ${s.returnText}`);
  l.push(`*Distance:* ${s.distanceText}${s.durationText && !s.distanceText.includes('package') ? ' · ' + s.durationText : ''}`);
  return l;
}
function fareBlock(s: TripSummary): string[] {
  const l: string[] = [];
  l.push(`${E.car} *Cab:* ${s.vehicleName} (${s.vehicleModels})${s.passengers ? ' · ' + s.passengers + ' passengers' : ''}`);
  l.push(`${E.money} *Estimated fare: ${s.totalText}*`);
  s.lines.forEach((x) => l.push(`   • ${x.label}: ${x.value}`));
  l.push(`*Km limit:* ${s.kmPolicy}`);
  l.push(`${E.warn} ${s.extrasNote}`);
  return l;
}
function linksBlock(s: TripSummary): string[] {
  const l: string[] = [];
  if (s.mapsUrl) l.push(`${E.map} Route map: ${s.mapsUrl}`);
  l.push(`${E.link} Route & fares: ${s.routeUrl}`);
  l.push(`${E.doc} Tariff: ${s.tariffUrl}`);
  l.push(`${E.doc} Terms: ${s.termsUrl}`);
  l.push(`${E.doc} Cancellation: ${s.cancelUrl}`);
  return l;
}

/** Customer -> business: sent from the website after the customer confirms the booking request. */
export function messageToBusiness(s: TripSummary): string {
  const head = s.kind === 'booking' ? 'Booking Request' : 'Fare Enquiry';
  return [
    `${E.taxi} *${s.brand} – ${head}*`,
    `Ref: *${s.ref}*`,
    '',
    ...tripBlock(s), '',
    ...fareBlock(s), '',
    `${E.user} *Passenger:* ${s.customer.name} · ${s.customer.phoneDisplay}`,
    '',
    ...linksBlock(s), '',
    s.kind === 'booking' ? '_Please confirm my booking and share the driver & cab details._' : '_Please confirm availability and the final fare._',
    `_Booked via ${s.source}_`
  ].join('\n');
}

/** Business -> customer: used by the admin/dispatcher (email button) to confirm on WhatsApp. */
export function messageToCustomer(s: TripSummary): string {
  return [
    `Hello ${s.customer.name} 👋`,
    `Thank you for choosing *${s.brand}*. We have received your ${s.kind === 'booking' ? 'booking' : 'enquiry'}.`,
    `Ref: *${s.ref}*`,
    '',
    ...tripBlock(s), '',
    ...fareBlock(s), '',
    `We will share your *driver name, mobile number and cab details* before pickup.`,
    `Fare terms: ${s.tariffUrl}`,
    `Cancellation: ${s.cancelUrl}`,
    '',
    `Reply here for any change. – *${s.brand}* (${SITE.phone})`
  ].join('\n');
}

/** Generic help message used by floating buttons. */
export const generalMessage = (pageUrl = '') =>
  `Hello ${SITE.brand}, I need a taxi.${pageUrl ? '\nPage: ' + pageUrl : ''}\n\nPickup:\nDrop:\nDate & time:\nPassengers:`;
