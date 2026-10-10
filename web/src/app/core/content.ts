import { City, Route, VEHICLES, durationText, fareFor, inr, routesFrom } from '../data';
import { SITE } from '../site.config';

export interface QA { q: string; a: string }
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = <T>(arr: T[], seed: string) => arr[hash(seed) % arr.length];
const sedan = VEHICLES[0];
const innova = VEHICLES.find((v) => v.id === 'innova')!;

export function routeContent(r: Route) {
  const { from, to, km } = r;
  const dur = durationText(km);
  const s = fareFor(sedan, km), i = fareFor(innova, km);
  const long = km > 300;
  const intro = pick([
    `Need a one-way cab from ${from.name} to ${to.name}? ${SITE.brand} drops you the ${km} km distance in about ${dur}, and you pay only for the one-way trip, not the empty return.`,
    `Planning to travel from ${from.name} to ${to.name}? Our ${from.name} to ${to.name} drop taxi covers roughly ${km} km (${dur}) with a clear per-km fare and a driver confirmed before pickup.`,
    `${from.name} to ${to.name} is about ${km} km by road, around ${dur} of driving. Book a drop taxi and pay one-way fare only, starting from ${inr(s.total)} in a ${sedan.short.toLowerCase()}.`
  ], r.slug);
  const tip = long
    ? `Because this is a long ${km} km drive, an early-morning start helps you avoid city traffic, and we recommend a short break at a highway restaurant around the halfway mark.`
    : `At ${km} km this is an easy same-day drive, so you can leave at your convenient time and reach ${to.name} comfortably within about ${dur}.`;
  const about = `${to.name}${to.known ? ` is known for ${to.known}.` : '.'} ${to.airport && !to.airport.startsWith('Nearest') ? `The nearest airport is ${to.airport}.` : ''}`.trim();
  const faqs: QA[] = [
    { q: `What is the taxi fare from ${from.name} to ${to.name}?`, a: `A one-way drop taxi from ${from.name} to ${to.name} (${km} km) starts at about ${inr(s.total)} in a sedan and ${inr(i.total)} in an Innova. Tolls, state permit and parking are extra at actuals. Final fare is confirmed before the trip.` },
    { q: `How long does the ${from.name} to ${to.name} drive take?`, a: `Approximately ${dur} for ${km} km, depending on traffic, weather and breaks.` },
    { q: `Do I pay for the return trip?`, a: `No. With a one-way drop taxi you pay only for the one-way distance${km < SITE.fare.minOneWayKm ? ` (minimum ${SITE.fare.minOneWayKm} km billing applies)` : ''}.` },
    { q: `Can I book a round trip from ${from.name} to ${to.name}?`, a: `Yes. Round trips are billed on the higher of ${SITE.fare.roundMinKmPerDay} km per day or the actual round-trip distance, plus driver allowance per day.` }
  ];
  const related = routesFrom(from.slug).filter((x) => x.to.slug !== to.slug).sort((a, b) => Math.abs(a.km - km) - Math.abs(b.km - km)).slice(0, 6);
  return { dur, s, i, intro, tip, about, faqs, related };
}

export function cityContent(c: City, mode: 'oneway' | 'outstation' | 'airport') {
  const routes = routesFrom(c.slug).sort((a, b) => a.km - b.km);
  const nearest = routes[0];
  const faqs: QA[] = [
    { q: `How do I book a ${mode === 'airport' ? 'airport' : mode === 'outstation' ? 'outstation' : 'one way'} taxi in ${c.name}?`, a: `Fill the booking form or call ${SITE.phone}. Share pickup, drop, date and time and we confirm the cab and fare.` },
    { q: `Is a one-way drop from ${c.name} cheaper than a round trip?`, a: `Usually yes, when you do not need the cab for the return. You pay only the one-way distance instead of a full round trip.` },
    { q: `Which cars are available in ${c.name}?`, a: `${VEHICLES.map((v) => v.short).join(', ')}.` },
    { q: `Are tolls included in the fare?`, a: `No. Toll, state permit, parking and hill-station charges are extra at actuals.` }
  ];
  return { routes, nearest, faqs };
}
