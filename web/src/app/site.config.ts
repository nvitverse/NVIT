export const SITE = {
  brand: 'Drop Taxi Now',
  domain: 'droptaxinow.in',
  url: 'https://droptaxinow.in',
  phone: '6383269989',
  phoneIntl: '+916383269989',
  /** International digits, used for wa.me links. */
  whatsapp: '916383269989',
  /** Public support email shown in emails/footers. Set via MAIL_REPLY_TO on the server too. */
  email: '',
  /** Optional postal address for schema. Leave empty until the real business address is confirmed. */
  address: null as null | { street?: string; locality: string; region: string; postalCode?: string },
  developer: { name: 'Naveen Rajendran' },
  tagline: 'One way drop taxi across South India',
  fare: { minOneWayKm: 130, roundMinKmPerDay: 250, avgSpeedKmph: 55 }
};
