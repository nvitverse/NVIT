import { CITIES } from '../app/data';
import { Suggestion, nearestCity, placeOfCity, suggestLocal } from '../app/core/local-places';
import { Place, SOUTH_INDIA_BOUNDS, inSouthIndiaBounds, isSouthIndiaState } from '../app/core/geo';
import { env } from './env';

export async function suggest(q: string): Promise<Suggestion[]> {
  const local = suggestLocal(q, 5);
  if (!env.mapsKey || q.trim().length < 3) return local;
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST', headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.mapsKey },
      body: JSON.stringify({
        input: q, includedRegionCodes: ['in'], languageCode: 'en',
        locationRestriction: { rectangle: { low: { latitude: SOUTH_INDIA_BOUNDS.south, longitude: SOUTH_INDIA_BOUNDS.west }, high: { latitude: SOUTH_INDIA_BOUNDS.north, longitude: SOUTH_INDIA_BOUNDS.east } } }
      }), signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return local;
    const j = (await res.json()) as { suggestions?: { placePrediction?: { placeId: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[] };
    const g: Suggestion[] = (j.suggestions || []).flatMap((x) => x.placePrediction ? [{
      id: 'g:' + x.placePrediction.placeId, main: x.placePrediction.structuredFormat?.mainText?.text || x.placePrediction.text?.text || '',
      secondary: x.placePrediction.structuredFormat?.secondaryText?.text || '', text: x.placePrediction.text?.text || ''
    }] : []);
    const seen = new Set(local.map((l) => l.main.toLowerCase()));
    return [...local, ...g.filter((x) => !seen.has(x.main.toLowerCase()))].slice(0, 8);
  } catch { return local; }
}

type Comp = { longText?: string; types?: string[] };
const stateOf = (comps: Comp[] = []) => comps.find((c) => c.types?.includes('administrative_area_level_1'))?.longText;
const cityMatch = (name: string) => CITIES.find((c) => name.toLowerCase().startsWith(c.name.toLowerCase()));

export async function details(id: string): Promise<{ place?: Place; error?: string }> {
  if (id.startsWith('city:')) {
    const c = CITIES.find((x) => x.slug === id.slice(5));
    return c ? { place: placeOfCity(c) } : { error: 'Unknown place' };
  }
  if (!env.mapsKey || !id.startsWith('g:')) return { error: 'Place lookup unavailable' };
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id.slice(2))}?fields=displayName,formattedAddress,location,addressComponents`, {
      headers: { 'X-Goog-Api-Key': env.mapsKey }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { error: 'Place lookup failed' };
    const j = (await res.json()) as { displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; addressComponents?: Comp[] };
    if (!j.location) return { error: 'Place lookup failed' };
    return checkRegion({ text: j.formattedAddress || j.displayName?.text || '', lat: j.location.latitude, lng: j.location.longitude,
      state: stateOf(j.addressComponents), citySlug: cityMatch(j.displayName?.text || '')?.slug });
  } catch { return { error: 'Place lookup failed' }; }
}

export async function reverse(lat: number, lng: number): Promise<{ place?: Place; error?: string }> {
  if (!inSouthIndiaBounds(lat, lng)) return { error: 'We currently serve South India only.' };
  if (env.mapsKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&region=in&key=${env.mapsKey}`, { signal: AbortSignal.timeout(5000) });
      const j = (await res.json()) as { results?: { formatted_address: string; address_components: { long_name: string; types: string[] }[] }[] };
      const r = j.results?.[0];
      if (r) return checkRegion({ text: r.formatted_address, lat, lng,
        state: r.address_components.find((c) => c.types.includes('administrative_area_level_1'))?.long_name });
    } catch { /* fall through to nearest city */ }
  }
  const near = nearestCity(lat, lng);
  return near ? { place: near } : { error: 'Could not find a nearby city. Please type your pickup location.' };
}

export function checkRegion(p: Place): { place?: Place; error?: string } {
  if (!inSouthIndiaBounds(p.lat, p.lng)) return { error: 'We currently serve South India only.' };
  if (p.state && !isSouthIndiaState(p.state)) return { error: 'We currently serve South India only (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, Puducherry).' };
  return { place: p };
}
