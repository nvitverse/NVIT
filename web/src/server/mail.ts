import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env';
import { writeOutbox } from './store';
import { Mail } from './emails';

let transport: Transporter | null = null;
function getTransport(): Transporter | null {
  const s = env.smtp;
  if (!s.host || !s.user || !s.pass) return null;
  transport ??= nodemailer.createTransport({ host: s.host, port: s.port, secure: s.secure, auth: { user: s.user, pass: s.pass }, connectionTimeout: 10000, socketTimeout: 15000 });
  return transport;
}
export const mailConfigured = () => !!getTransport() && !!env.mailFrom;

/** Sends via SMTP. When SMTP is not configured the email is written to DATA_DIR/outbox (so nothing is lost in dev/preview). */
export async function sendMail(to: string[], mail: Mail, opts: { replyTo?: string; tag: string }): Promise<{ sent: boolean; error?: string }> {
  const recipients = to.filter(Boolean);
  if (!recipients.length) return { sent: false, error: 'no recipients' };
  const t = getTransport();
  if (!t || !env.mailFrom) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeOutbox(`${stamp}-${opts.tag}.html`, `<!-- to: ${recipients.join(', ')} | subject: ${mail.subject} -->\n${mail.html}`);
    writeOutbox(`${stamp}-${opts.tag}.txt`, `to: ${recipients.join(', ')}\nsubject: ${mail.subject}\n\n${mail.text}`);
    return { sent: false, error: 'SMTP not configured (saved to outbox)' };
  }
  try {
    await t.sendMail({ from: { name: env.mailFromName, address: env.mailFrom }, to: recipients, replyTo: opts.replyTo || env.mailReplyTo || undefined, subject: mail.subject, html: mail.html, text: mail.text });
    return { sent: true };
  } catch (e) {
    console.error('[mail] send failed:', (e as Error).message);
    return { sent: false, error: (e as Error).message };
  }
}
