/** All configuration comes from environment variables (never committed). */
const num = (v: string | undefined, d: number) => (v && !isNaN(+v) ? +v : d);
export const env = {
  get port() { return num(process.env['PORT'], 4000); },
  get mapsKey() { return process.env['GOOGLE_MAPS_SERVER_KEY'] || ''; },
  /**
   * Sent as the HTTP Referer on server-side Google calls. Needed when the key is restricted by *website* (HTTP referrer);
   * ignored by keys restricted by IP address.
   */
  get mapsReferer() { return process.env['GOOGLE_MAPS_REFERER'] || 'https://droptaxinow.in/'; },
  get smtp() {
    return {
      host: process.env['SMTP_HOST'] || '', port: num(process.env['SMTP_PORT'], 587),
      secure: (process.env['SMTP_SECURE'] || '').toLowerCase() === 'true' || num(process.env['SMTP_PORT'], 587) === 465,
      user: process.env['SMTP_USER'] || '', pass: process.env['SMTP_PASS'] || ''
    };
  },
  get mailFrom() { return process.env['MAIL_FROM'] || process.env['SMTP_USER'] || ''; },
  get mailFromName() { return process.env['MAIL_FROM_NAME'] || 'Drop Taxi Now'; },
  get mailReplyTo() { return process.env['MAIL_REPLY_TO'] || ''; },
  get adminEmails() { return (process.env['ADMIN_EMAILS'] || '').split(',').map((s) => s.trim()).filter(Boolean); },
  /** If set, POST /api/mail-test with header x-test-token sends a test email to ADMIN_EMAILS. */
  get mailTestToken() { return process.env['MAIL_TEST_TOKEN'] || ''; },
  /** Analytics / ads (public IDs, injected into the browser at runtime). */
  get analytics() {
    const e = process.env;
    return { gaId: e['GA_MEASUREMENT_ID'] || '', adsId: e['GOOGLE_ADS_ID'] || '',
      labels: { booking: e['GOOGLE_ADS_BOOKING_LABEL'] || '', lead: e['GOOGLE_ADS_LEAD_LABEL'] || '', call: e['GOOGLE_ADS_CALL_LABEL'] || '', whatsapp: e['GOOGLE_ADS_WHATSAPP_LABEL'] || '' } };
  },
  /** Search Console HTML-file verification, e.g. GSC_VERIFICATION_FILE=google1234567890abcdef.html */
  get gscFile() { return (process.env['GSC_VERIFICATION_FILE'] || '').replace(/[^a-zA-Z0-9._-]/g, ''); },
  /** IndexNow key (Bing/Yandex/Seznam instant indexing). Served at /<key>.txt */
  get indexNowKey() { return (process.env['INDEXNOW_KEY'] || '').replace(/[^a-zA-Z0-9-]/g, ''); },
  get quoteSecret() { return process.env['QUOTE_SECRET'] || ''; },
  get dataDir() { return process.env['DATA_DIR'] || process.cwd() + '/data'; },
  get telegramToken() { return process.env['TELEGRAM_BOT_TOKEN'] || ''; },
  get telegramChat() { return process.env['TELEGRAM_CHAT_ID'] || ''; },
  /** Later: forward leads/bookings to the Drop1Taxi admin panel. Off unless ADMIN_SYNC_URL is set. */
  get adminSync() {
    return {
      enquiryUrl: process.env['ADMIN_SYNC_ENQUIRY_URL'] || '', confirmUrl: process.env['ADMIN_SYNC_CONFIRM_URL'] || '',
      token: process.env['ADMIN_SYNC_TOKEN'] || '', tokenHeader: process.env['ADMIN_SYNC_TOKEN_HEADER'] || 'X-DROPCARS-TOKEN'
    };
  }
};
