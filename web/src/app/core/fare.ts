/** Pure fare engine. No framework imports so it runs in the browser, the SSR server and node tests. */
export type VehicleId = 'SEDAN' | 'SUV' | 'INNOVA' | 'CRYSTA';
export type ServiceType = 'one_way' | 'round_trip' | 'hourly_rental' | 'multi_city' | 'airport';

export interface VehicleRates { oneway: number; round: number; bataOne: number; bataRound: number; hourly: number }
export interface FareConfig {
  minOneWayKm: number;
  minRoundKmPerDay: number;
  multiCityStopCharge: number;
  kmPerHour: number;
  hourlyPackages: number[];
  vehicles: Record<string, VehicleRates>;
}

export interface FareInput {
  service: ServiceType;
  vehicle: VehicleId;
  /** One-way route distance in km (pickup -> stops -> drop). Not used for hourly. */
  km: number;
  /** Round trip / multi city: number of calendar days (>=1). */
  days?: number;
  /** Hourly rental package hours. */
  hours?: number;
  /** Number of intermediate stops (multi city). */
  stops?: number;
  /** Flat discount in rupees (coupon). */
  discount?: number;
  /** Estimated toll in rupees (optional, added only when includeToll is true). */
  toll?: number;
  includeToll?: boolean;
}

export interface FareBreakdown {
  service: ServiceType;
  vehicle: VehicleId;
  actualKm: number;
  /** Distance the fare is based on (>= minimum). */
  billableKm: number;
  /** Minimum billing distance that applied. */
  minimumKm: number;
  /** Kilometres included in the fare. Extra kilometres beyond this are charged at extraKmRate. */
  includedKm: number;
  perKmRate: number;
  extraKmRate: number;
  /** Hourly rental only. */
  hours: number;
  extraHourRate: number;
  days: number;
  kmCharge: number;
  batta: number;
  stopCharge: number;
  toll: number;
  discount: number;
  total: number;
}

const round10 = (n: number) => Math.round(n / 10) * 10;

export function computeFare(i: FareInput, cfg: FareConfig): FareBreakdown {
  const r = cfg.vehicles[i.vehicle];
  if (!r) throw new Error(`Unknown vehicle ${i.vehicle}`);
  const days = Math.max(1, Math.floor(i.days ?? 1));
  const actualKm = Math.max(0, i.km || 0);
  const discount = Math.max(0, Math.round(i.discount ?? 0));
  const toll = i.includeToll ? Math.max(0, Math.round(i.toll ?? 0)) : 0;
  const base = {
    service: i.service, vehicle: i.vehicle, actualKm, hours: 0, extraHourRate: 0, days, stopCharge: 0, toll, discount
  };

  if (i.service === 'hourly_rental') {
    const hours = cfg.hourlyPackages.includes(i.hours ?? 0) ? (i.hours as number) : cfg.hourlyPackages[0];
    const includedKm = hours * cfg.kmPerHour;
    const kmCharge = r.hourly * hours;
    return { ...base, hours, billableKm: includedKm, minimumKm: includedKm, includedKm, perKmRate: r.hourly, extraKmRate: r.oneway,
      extraHourRate: r.hourly, kmCharge, batta: 0, total: Math.max(0, round10(kmCharge + toll - discount)) };
  }

  if (i.service === 'round_trip' || i.service === 'multi_city') {
    // `km` is the ONE-WAY distance; a round trip drives it twice. Multi-city is billed on the full route km given.
    const totalKm = i.service === 'round_trip' ? actualKm * 2 : actualKm;
    const minimumKm = days * cfg.minRoundKmPerDay;
    const billableKm = Math.max(totalKm, minimumKm);
    const kmCharge = billableKm * r.round;
    const batta = r.bataRound * days;
    const stopCharge = i.service === 'multi_city' ? Math.max(0, Math.floor(i.stops ?? 0)) * cfg.multiCityStopCharge : 0;
    return { ...base, actualKm: totalKm, billableKm, minimumKm, includedKm: billableKm, perKmRate: r.round, extraKmRate: r.round,
      kmCharge, batta, stopCharge, total: Math.max(0, round10(kmCharge + batta + stopCharge + toll - discount)) };
  }

  // one_way and airport
  const minimumKm = cfg.minOneWayKm;
  const billableKm = Math.max(actualKm, minimumKm);
  const kmCharge = billableKm * r.oneway;
  return { ...base, billableKm, minimumKm, includedKm: billableKm, perKmRate: r.oneway, extraKmRate: r.oneway,
    kmCharge, batta: r.bataOne, total: Math.max(0, round10(kmCharge + r.bataOne + toll - discount)) };
}
