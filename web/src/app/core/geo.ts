export interface Place {
  /** Display text, e.g. "Madurai, Tamil Nadu" */
  text: string;
  lat: number;
  lng: number;
  /** Set when the place is one of our known cities (enables the offline distance table). */
  citySlug?: string;
  /** Administrative state, used to restrict bookings to South India. */
  state?: string;
}

export const SOUTH_INDIA_STATES = ['tamil nadu', 'kerala', 'karnataka', 'andhra pradesh', 'telangana', 'puducherry', 'pondicherry'];
/** Rough bounding box of South India (used by Places restriction). */
export const SOUTH_INDIA_BOUNDS = { south: 6.5, west: 73.5, north: 19.95, east: 84.9 };

export const isSouthIndiaState = (s?: string) => !!s && SOUTH_INDIA_STATES.includes(s.trim().toLowerCase());
export const inSouthIndiaBounds = (lat: number, lng: number) =>
  lat >= SOUTH_INDIA_BOUNDS.south && lat <= SOUTH_INDIA_BOUNDS.north && lng >= SOUTH_INDIA_BOUNDS.west && lng <= SOUTH_INDIA_BOUNDS.east;

const rad = (d: number) => (d * Math.PI) / 180;
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export const ROAD_FACTOR = 1.28;

export function durationText(km: number, avgKmph = 55): string {
  const mins = Math.max(5, Math.round(((km / avgKmph) * 60) / 5) * 5);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? (m ? `${h} hr ${m} min` : `${h} hr`) : `${m} min`;
}
