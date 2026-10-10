import citiesJson from './cities.json';
import vehiclesJson from './vehicles.json';
import routesJson from './routes.json';
import distancesJson from './distances.json';
import { computeFare, FareResult, TripType } from '../core/fare';
import { SITE } from '../site.config';

export interface City {
  slug: string; name: string; state: string; lat: number; lng: number; hub: boolean; airport: string; known: string;
}
export interface Vehicle {
  id: string; name: string; short: string; seats: number; bags: number; onewayRate: number; roundRate: number;
  batta: number; minNote: string; examples: string;
}
export interface Route { from: City; to: City; km: number; slug: string; }

export const CITIES = citiesJson as City[];
export const VEHICLES = vehiclesJson as Vehicle[];
export const CITY_MAP = new Map(CITIES.map((c) => [c.slug, c]));
const DIST = distancesJson as Record<string, number>;

export const ROUTES: Route[] = (routesJson as { from: string; to: string; km: number }[]).map((r) => ({
  from: CITY_MAP.get(r.from)!, to: CITY_MAP.get(r.to)!, km: r.km, slug: `${r.from}-to-${r.to}`
}));
export const ROUTE_MAP = new Map(ROUTES.map((r) => [r.slug, r]));
export const HUBS = CITIES.filter((c) => c.hub);
export const AIRPORT_CITIES = CITIES.filter((c) => c.airport && !c.airport.startsWith('Nearest'));

export function distanceKm(a: string, b: string): number | null {
  if (a === b) return null;
  return DIST[[a, b].sort().join('|')] ?? null;
}
export const durationText = (km: number) => {
  const mins = Math.round((km / SITE.fare.avgSpeedKmph) * 60 / 5) * 5;
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
};
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function fareFor(vehicle: Vehicle, km: number, trip: TripType = 'oneway', days = 1): FareResult {
  return computeFare({ km, trip, days, vehicle });
}
export const routesFrom = (slug: string) => ROUTES.filter((r) => r.from.slug === slug);
export const routesTo = (slug: string) => ROUTES.filter((r) => r.to.slug === slug);
