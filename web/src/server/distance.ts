import { Place, durationText } from '../app/core/geo';
import { estimateRoute } from '../app/core/estimate';
import { RouteInfo } from '../app/core/booking.model';
import { env } from './env';

const cache = new Map<string, { at: number; route: RouteInfo }>();
const key = (pts: Place[]) => pts.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('>');
const ll = (p: Place) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });

/** Real driving distance, duration and toll via Google Routes API. Falls back to the offline estimate. */
export async function routeFor(points: Place[]): Promise<RouteInfo> {
  const k = key(points), hit = cache.get(k);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.route;
  let route: RouteInfo | null = null;
  if (env.mapsKey && points.length >= 2) {
    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.mapsKey, Referer: env.mapsReferer,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo' },
        body: JSON.stringify({
          origin: ll(points[0]), destination: ll(points[points.length - 1]),
          intermediates: points.slice(1, -1).map(ll), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE',
          extraComputations: ['TOLLS'], regionCode: 'IN',
          routeModifiers: { vehicleInfo: { emissionType: 'DIESEL' }, tollPasses: ['IN_FASTAG'] }
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const j = (await res.json()) as { routes?: { distanceMeters?: number; duration?: string; travelAdvisory?: { tollInfo?: { estimatedPrice?: { currencyCode?: string; units?: string }[] } } }[] };
        const r = j.routes?.[0];
        if (r?.distanceMeters) {
          const km = Math.round((r.distanceMeters / 1000) * 10) / 10;
          const secs = parseInt((r.duration || '').replace('s', ''), 10);
          const tp = r.travelAdvisory?.tollInfo?.estimatedPrice?.find((p) => p.currencyCode === 'INR');
          route = { km, durationText: secs ? durationText(km, km / (secs / 3600)) : durationText(km), toll: tp?.units != null ? parseInt(tp.units, 10) : null, source: 'google' };
        }
      } else console.warn('[routes] HTTP', res.status);
    } catch (e) { console.warn('[routes] failed:', (e as Error).message); }
  }
  route ??= estimateRoute(points);
  cache.set(k, { at: Date.now(), route });
  if (cache.size > 2000) cache.delete(cache.keys().next().value as string);
  return route;
}
