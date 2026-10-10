import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from './env';

let generated = '';
const secret = () => {
  if (env.quoteSecret) return env.quoteSecret;
  if (!generated) {
    // Stable across restarts (shared hosts restart often): derived from other server-only secrets when available.
    const seed = `${env.smtp.pass}|${env.mapsKey}`;
    if (seed.length > 1) { generated = createHash('sha256').update('dtn-quote|' + seed).digest('hex'); console.warn('[token] QUOTE_SECRET not set; deriving a stable secret from other server secrets. Please set QUOTE_SECRET.'); }
    else { generated = randomBytes(32).toString('hex'); console.warn('[token] QUOTE_SECRET not set; using a random secret for this process (quotes expire on restart).'); }
  }
  return generated;
};
export function stable(o: unknown): string {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
  const r = o as Record<string, unknown>;
  return '{' + Object.keys(r).filter((k) => r[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + stable(r[k])).join(',') + '}';
}
export const signQuote = (quote: object): string => createHmac('sha256', secret()).update(stable(quote)).digest('hex');
export function verifyQuote(quote: object, token: string): boolean {
  const a = Buffer.from(signQuote(quote)), b = Buffer.from(String(token || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}
