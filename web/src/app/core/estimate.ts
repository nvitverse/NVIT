import distances from '../data/distances.json';
import { Place, haversineKm, ROAD_FACTOR, durationText } from './geo';
import { RouteInfo } from './booking.model';

const D = distances as Record<string, number>;
export function legEstimateKm(a: Place, b: Place): number {
  if (a.citySlug && b.citySlug) {
    const k = [a.citySlug, b.citySlug].sort().join('|');
    if (D[k] != null) return D[k];
  }
  return Math.round((haversineKm(a, b) * ROAD_FACTOR) / 5) * 5;
}
export function estimateRoute(points: Place[]): RouteInfo {
  let km = 0;
  for (let i = 0; i < points.length - 1; i++) km += legEstimateKm(points[i], points[i + 1]);
  return { km, durationText: durationText(km), toll: null, source: 'estimate' };
}
