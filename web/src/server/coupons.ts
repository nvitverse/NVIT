import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env';
import { CouponInfo } from '../app/core/booking.model';

interface CouponDef { code: string; type: 'flat' | 'percent'; value: number; label: string; active: boolean; expires?: string; minFare?: number; maxDiscount?: number }

/** Coupons live in DATA_DIR/coupons.json (editable without redeploy). Empty by default. */
function load(): CouponDef[] {
  try { return JSON.parse(readFileSync(join(env.dataDir, 'coupons.json'), 'utf8')) as CouponDef[]; } catch { return []; }
}
export function findCoupon(code?: string): { coupon?: CouponInfo; error?: string } {
  const c = (code || '').trim().toUpperCase();
  if (!c) return {};
  const d = load().find((x) => x.code.toUpperCase() === c && x.active);
  if (!d) return { error: 'Invalid or expired promo code' };
  if (d.expires && Date.parse(d.expires) < Date.now()) return { error: 'This promo code has expired' };
  return { coupon: { code: d.code.toUpperCase(), type: d.type, value: d.value, label: d.type === 'flat' ? `₹${d.value} off` : `${d.value}% off` } };
}
