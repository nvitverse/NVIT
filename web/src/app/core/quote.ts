import { computeFare, FareBreakdown, FareConfig, VehicleId } from './fare';
import { CouponInfo, Quote, QuoteRequest, RouteInfo, makeRef } from './booking.model';

export const VEHICLE_IDS: VehicleId[] = ['SEDAN', 'SUV', 'INNOVA', 'CRYSTA'];

/** Number of calendar days of a round-trip/multi-city between two ISO dates (inclusive). */
export function tripDays(start?: string, end?: string): number {
  if (!start || !end) return 1;
  const a = Date.parse(start + 'T00:00:00Z'), b = Date.parse(end + 'T00:00:00Z');
  if (isNaN(a) || isNaN(b) || b < a) return 1;
  return Math.round((b - a) / 86400000) + 1;
}

export function applyCoupon(c: CouponInfo | undefined, subtotal: number): number {
  if (!c) return 0;
  return c.type === 'flat' ? Math.min(c.value, subtotal) : Math.round((subtotal * c.value) / 100);
}

export function buildFares(req: QuoteRequest, route: RouteInfo, cfg: FareConfig, coupon?: CouponInfo): Record<VehicleId, FareBreakdown> {
  const days = req.service === 'round_trip' || req.service === 'multi_city' ? tripDays(req.date, req.endDate) : 1;
  const out = {} as Record<VehicleId, FareBreakdown>;
  for (const v of VEHICLE_IDS) {
    const input = { service: req.service, vehicle: v, km: route.km, days, hours: req.hours, stops: req.stops.length,
      toll: route.toll ?? 0, includeToll: req.includeToll && route.toll != null };
    const before = computeFare(input, cfg);
    const discount = applyCoupon(coupon, before.total);
    out[v] = discount ? computeFare({ ...input, discount }, cfg) : before;
  }
  return out;
}

export function buildQuote(req: QuoteRequest, route: RouteInfo, cfg: FareConfig, coupon?: CouponInfo, now = new Date()): Quote {
  const days = req.service === 'round_trip' || req.service === 'multi_city' ? tripDays(req.date, req.endDate) : 1;
  return {
    enquiryId: makeRef('E', now), createdAt: now.toISOString(), request: req, route, days,
    fares: buildFares(req, route, cfg, coupon),
    coupon: coupon ? { ...coupon, applied: true } : undefined
  };
}
