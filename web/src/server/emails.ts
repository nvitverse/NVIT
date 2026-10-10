import { TripSummary } from '../app/core/summary';
import { Quote } from '../app/core/booking.model';
import { VEHICLE_IDS } from '../app/core/quote';
import { VEHICLE_META } from '../app/core/vehicles-meta';
import { chooserUrl, messageToBusiness, messageToCustomer, waLink } from '../app/core/whatsapp';
import { inr } from '../app/core/format';
import { SITE } from '../app/site.config';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const BRAND = '#0b3d3a', AMBER = '#f5a524', INK = '#14201e', MUTED = '#5b6a67', LINE = '#e6e1d6', BG = '#faf7f2', WA = '#1faa59', WAB = '#0e8f5a';

const btn = (href: string, label: string, bg: string, fg = '#ffffff') =>
  `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:999px;margin:4px 6px 4px 0;font-family:Arial,Helvetica,sans-serif">${esc(label)}</a>`;
const row = (k: string, v: string, strong = false) =>
  `<tr><td style="padding:7px 0;color:${MUTED};font-size:14px;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;color:${INK};font-size:14px;${strong ? 'font-weight:700;' : ''}">${v}</td></tr>`;
const card = (title: string, body: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid ${LINE};border-radius:12px;margin:0 0 14px"><tr><td style="padding:16px 18px"><div style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};font-weight:700;margin-bottom:8px">${esc(title)}</div>${body}</td></tr></table>`;

function shell(preheader: string, badge: string, title: string, intro: string, inner: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:Arial,Helvetica,sans-serif;color:${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG}"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px">
<tr><td style="background:${BRAND};border-radius:14px 14px 0 0;padding:18px 22px">
 <table role="presentation" width="100%"><tr><td style="color:#fff;font-size:20px;font-weight:700">Drop Taxi <span style="color:${AMBER}">Now</span></td>
 <td align="right" style="color:#cfe3e0;font-size:12px">${esc(badge)}</td></tr></table></td></tr>
<tr><td style="background:${BG};padding:22px 4px 6px"><h1 style="margin:0 0 6px;font-size:22px;line-height:1.25;color:${INK}">${esc(title)}</h1><p style="margin:0 0 16px;color:${MUTED};font-size:15px;line-height:1.5">${intro}</p>${inner}</td></tr>
<tr><td style="padding:14px 4px 26px;color:${MUTED};font-size:12px;line-height:1.6;border-top:1px solid ${LINE}">
 <b>${esc(SITE.brand)}</b> · <a href="${SITE.url}" style="color:${MUTED}">${SITE.domain}</a> · ${SITE.phone}<br>
 <a href="${SITE.url}/tariff" style="color:${MUTED}">Tariff</a> · <a href="${SITE.url}/terms" style="color:${MUTED}">Terms</a> · <a href="${SITE.url}/cancellation-policy" style="color:${MUTED}">Cancellation</a> · <a href="${SITE.url}/privacy-policy" style="color:${MUTED}">Privacy</a><br>
 You received this email because a taxi request was made on ${SITE.domain}.</td></tr>
</table></td></tr></table></body></html>`;
}

function tripCard(s: TripSummary): string {
  let r = row('Reference', `<b>${esc(s.ref)}</b>`) + row('Service', esc(s.serviceLabel)) + row('Pickup', esc(s.pickup), true);
  s.stops.forEach((x, i) => (r += row(`Stop ${i + 1}`, esc(x))));
  if (s.drop) r += row('Drop', esc(s.drop), true);
  r += row('Pickup date & time', `${esc(s.dateText)}${s.timeText ? ' · ' + esc(s.timeText) : ''}`);
  if (s.returnText) r += row('Return', esc(s.returnText));
  r += row('Distance', esc(s.distanceText) + (s.durationText && !s.distanceText.includes('package') ? ` · ${esc(s.durationText)}` : ''));
  r += row('Cab', `${esc(s.vehicleName)} <span style="color:${MUTED}">(${esc(s.vehicleModels)})</span>${s.passengers ? ' · ' + s.passengers + ' passengers' : ''}`);
  return card('Trip details', `<table width="100%" cellpadding="0" cellspacing="0">${r}</table>`);
}
function fareCard(s: TripSummary): string {
  const lines = s.lines.map((l) => `<tr><td style="padding:5px 0;font-size:14px;color:${INK}">${esc(l.label)}</td><td align="right" style="padding:5px 0;font-size:14px;color:${INK}">${esc(l.value)}</td></tr>`).join('');
  return card('Fare', `<table width="100%" cellpadding="0" cellspacing="0">${lines}
   <tr><td style="padding:10px 0 4px;border-top:1px solid ${LINE};font-size:16px;font-weight:700">Estimated fare</td><td align="right" style="padding:10px 0 4px;border-top:1px solid ${LINE};font-size:20px;font-weight:700;color:${BRAND}">${esc(s.totalText)}</td></tr></table>
   <p style="margin:10px 0 4px;font-size:13px;color:${INK};line-height:1.5"><b>Km limit:</b> ${esc(s.kmPolicy)}</p>
   <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5">${esc(s.extrasNote)}${s.couponText ? ' Coupon applied: ' + esc(s.couponText) + '.' : ''}</p>`);
}
function linksCard(s: TripSummary): string {
  const a = (h: string, t: string) => `<a href="${esc(h)}" style="color:${BRAND}">${esc(t)}</a>`;
  return `<p style="margin:6px 0 0;font-size:13px;line-height:1.9;color:${MUTED}">${[s.mapsUrl && a(s.mapsUrl, 'Route map'), a(s.routeUrl, 'Route & fares'), a(s.tariffUrl, 'Tariff'), a(s.termsUrl, 'Terms'), a(s.cancelUrl, 'Cancellation policy')].filter(Boolean).join(' &nbsp;·&nbsp; ')}</p>`;
}
function waButtons(toIntl: string, text: string, label: string): string {
  return btn(waLink(toIntl, text), `${label} · WhatsApp`, WA) + btn(chooserUrl(toIntl, text) + '&app=business', `${label} · WhatsApp Business`, WAB);
}

export interface Mail { subject: string; html: string; text: string }

/** Email to the CUSTOMER after booking is requested. Buttons open WhatsApp / WhatsApp Business to the business number. */
export function customerBookingEmail(s: TripSummary): Mail {
  const toBiz = messageToBusiness(s);
  const inner = tripCard(s) + fareCard(s) +
    card('Next steps', `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${INK}">Our team will confirm your cab and share the <b>driver name, mobile number and vehicle details</b> before pickup. For quick help, message us on WhatsApp or call.</p>` +
      waButtons(SITE.whatsapp, toBiz, 'Chat with us') + btn('tel:' + SITE.phoneIntl, 'Call ' + SITE.phone, BRAND) + linksCard(s));
  const html = shell(`Booking ${s.ref}: ${s.pickup} to ${s.drop} – ${s.totalText}`, 'Booking request received', `Thank you, ${s.customer.name}!`,
    `We have received your booking request <b>${esc(s.ref)}</b>. Here is your trip summary.`, inner);
  const text = [`Thank you ${s.customer.name}! Booking request ${s.ref} received.`, '', toBiz, '', `Chat on WhatsApp: ${waLink(SITE.whatsapp, toBiz)}`, `WhatsApp Business / chooser: ${chooserUrl(SITE.whatsapp, toBiz)}&app=business`, `Call: ${SITE.phone}`].join('\n');
  return { subject: `Booking request ${s.ref} – ${s.pickup.split(',')[0]} to ${(s.drop || 'Rental').split(',')[0]} | ${SITE.brand}`, html, text };
}

/** Email to the ADMIN. Clearly labelled with the source site; WhatsApp buttons message the CUSTOMER. */
export function adminLeadEmail(s: TripSummary, q: Quote, meta: { kind: 'enquiry' | 'booking'; ip?: string }): Mail {
  const toCust = messageToCustomer(s);
  const c = s.customer;
  const contact = card('Customer', `<table width="100%" cellpadding="0" cellspacing="0">${row('Name', esc(c.name), true)}${row('Mobile', `<a href="tel:+${c.phoneIntl}" style="color:${BRAND}">${esc(c.phoneDisplay)}</a>`)}${row('WhatsApp', '+' + esc(c.waIntl))}${row('Email', c.email ? esc(c.email) : '<span style="color:' + MUTED + '">not provided</span>')}</table>` +
    `<div style="margin-top:8px">${btn('tel:+' + c.phoneIntl, 'Call customer', BRAND)}${waButtons(c.waIntl || c.phoneIntl, toCust, 'Message customer')}</div>`);
  const fares = VEHICLE_IDS.map((v) => {
    const f = q.fares[v], sel = v === s.vehicleId;
    return `<tr style="${sel ? `background:#fff7e6;` : ''}"><td style="padding:6px 8px;font-size:14px">${sel ? '✔ ' : ''}${esc(VEHICLE_META[v].name)}</td><td style="padding:6px 8px;font-size:13px;color:${MUTED}">${esc(`${f.billableKm} km @ ₹${f.perKmRate}`)}</td><td align="right" style="padding:6px 8px;font-size:14px;font-weight:${sel ? 700 : 400}">${esc(inr(f.total))}</td></tr>`;
  }).join('');
  const allFares = card('Quoted fares (all cabs)', `<table width="100%" cellpadding="0" cellspacing="0">${fares}</table>`);
  const a = q.request.attribution ?? {};
  const meta2 = card('Lead source', `<table width="100%" cellpadding="0" cellspacing="0">${row('Website', `<b>${esc(SITE.brand)}</b> (${esc(SITE.domain)})`)}${row('Page', esc(a.page || '-'))}${row('Device', esc(a.device || '-'))}${row('UTM', esc([a.utmSource, a.utmMedium, a.utmCampaign].filter(Boolean).join(' / ') || '-'))}${row('Distance source', esc(q.route.source))}${meta.ip ? row('IP', esc(meta.ip)) : ''}</table>`);
  const label = meta.kind === 'booking' ? 'NEW BOOKING' : 'NEW ENQUIRY';
  const html = shell(`${label} ${s.ref} · ${c.name} · ${s.totalText}`, `${SITE.domain} · ${label}`, `${label}: ${s.pickup.split(',')[0]} → ${(s.drop || 'Rental').split(',')[0]} · ${s.totalText}`,
    `Received from <b>${esc(SITE.brand)}</b> (<b>${esc(SITE.domain)}</b>). Reference <b>${esc(s.ref)}</b>.`, contact + tripCard(s) + fareCard(s) + allFares + meta2);
  const text = [`${label} from ${SITE.brand} (${SITE.domain})`, '', toCust, '', `Customer: ${c.name} ${c.phoneDisplay} ${c.email}`, `WhatsApp customer: ${waLink(c.waIntl || c.phoneIntl, toCust)}`, `WhatsApp Business chooser: ${chooserUrl(c.waIntl || c.phoneIntl, toCust)}&app=business`].join('\n');
  return { subject: `[${SITE.brand}] ${label} ${s.ref} – ${s.pickup.split(',')[0]} → ${(s.drop || 'Rental').split(',')[0]} – ${s.totalText}`, html, text };
}

export function vendorLeadEmail(v: { name: string; phone: string; city: string; vehicle: string; vehicleNo?: string; message?: string; ref: string }): Mail {
  const inner = card('Taxi / driver partner', `<table width="100%" cellpadding="0" cellspacing="0">${row('Name', esc(v.name), true)}${row('Mobile', esc(v.phone))}${row('City', esc(v.city))}${row('Vehicle', esc(v.vehicle))}${row('Vehicle no.', esc(v.vehicleNo || '-'))}${row('Message', esc(v.message || '-'))}</table>` + btn('tel:' + v.phone.replace(/\D/g, ''), 'Call', BRAND) + btn(waLink('91' + v.phone.replace(/\D/g, '').slice(-10), `Hello ${v.name}, this is ${SITE.brand} regarding your taxi attach request ${v.ref}.`), 'WhatsApp', WA));
  return { subject: `[${SITE.brand}] Attach taxi request ${v.ref} – ${v.name} (${v.city})`, html: shell('Attach taxi request', `${SITE.domain} · ATTACH TAXI`, 'New attach-taxi request', `Reference <b>${esc(v.ref)}</b> from ${SITE.domain}.`, inner), text: `Attach taxi request ${v.ref}\n${v.name} ${v.phone}\n${v.city} ${v.vehicle} ${v.vehicleNo || ''}\n${v.message || ''}` };
}
