import { CITIES } from '../data';
import { Place } from './geo';

export interface Suggestion { id: string; main: string; secondary: string; text: string; local?: Place }
type City = (typeof CITIES)[number];

export const placeOfCity = (c: City): Place => ({ text: `${c.name}, ${c.state}`, lat: c.lat, lng: c.lng, citySlug: c.slug, state: c.state });

export function suggestLocal(q: string, limit = 8): Suggestion[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return CITIES.filter((c) => c.name.toLowerCase().includes(s))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(s)) - Number(a.name.toLowerCase().startsWith(s)) || Number(b.hub) - Number(a.hub) || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((c) => ({ id: 'city:' + c.slug, main: c.name, secondary: c.state, text: `${c.name}, ${c.state}`, local: placeOfCity(c) }));
}

/** Nearest known city within `maxKm` (straight-line approximation). */
export function nearestCity(lat: number, lng: number, maxKm = 60): Place | null {
  let best: { c: City; d: number } | null = null;
  for (const c of CITIES) { const d = Math.hypot((c.lat - lat) * 111, (c.lng - lng) * 108); if (!best || d < best.d) best = { c, d }; }
  return best && best.d < maxKm ? placeOfCity(best.c) : null;
}

/** Popular hub cities shown when a location field is focused while empty. */
export const popularLocal = (limit = 8): Suggestion[] =>
  CITIES.filter((c) => c.hub).slice(0, limit).map((c) => ({ id: 'city:' + c.slug, main: c.name, secondary: c.state, text: `${c.name}, ${c.state}`, local: placeOfCity(c) }));
