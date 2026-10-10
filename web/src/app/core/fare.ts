/** Pure fare engine. No framework imports so it runs in the browser, the SSR server and node tests. */
export interface FareVehicle {
  id: string;
  onewayRate: number;
  roundRate: number;
  batta: number;
}
export type TripType = 'oneway' | 'round';
export interface FareInput {
  km: number;
  trip: TripType;
  days?: number;
  vehicle: FareVehicle;
}
export interface FareResult {
  billableKm: number;
  rate: number;
  days: number;
  batta: number;
  base: number;
  total: number;
}
export const FARE_RULES = { minOneWayKm: 130, roundMinKmPerDay: 250 };

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * One way : max(km, 130) * onewayRate + batta
 * Round   : max(days * 250, 2 * km) * roundRate + batta * days
 * Tolls, state permit, parking and hill-station charges are extra, at actuals.
 */
export function computeFare({ km, trip, days = 1, vehicle }: FareInput): FareResult {
  const d = Math.max(1, Math.floor(days));
  if (trip === 'oneway') {
    const billableKm = Math.max(km, FARE_RULES.minOneWayKm);
    const base = billableKm * vehicle.onewayRate;
    return { billableKm, rate: vehicle.onewayRate, days: 1, batta: vehicle.batta, base, total: round10(base + vehicle.batta) };
  }
  const billableKm = Math.max(d * FARE_RULES.roundMinKmPerDay, km * 2);
  const base = billableKm * vehicle.roundRate;
  const batta = vehicle.batta * d;
  return { billableKm, rate: vehicle.roundRate, days: d, batta, base, total: round10(base + batta) };
}
