import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Booking, Quote, QuoteRequest, makeRef } from './booking.model';
import { FARES } from './fares';
import { Place, SOUTH_INDIA_BOUNDS, inSouthIndiaBounds, isSouthIndiaState } from './geo';
import { Suggestion, nearestCity, suggestLocal } from './local-places';
import { buildQuote } from './quote';
import { summarise, TripSummary } from './summary';
import { VehicleId } from './fare';

export interface ApiError { error: string }
export class BookingError extends Error {}

/**
 * Talks to our Node API. If the API is not reachable (e.g. static preview) it falls back to an
 * offline engine using the same fare code so the page still works, flagged with `offline: true`.
 */
@Injectable({ providedIn: 'root' })
export class BookingApi {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private serverPlaces: boolean | null = null;

  private async call<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T & Partial<ApiError> } | null> {
    try {
      const res = await fetch('/api' + path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return null; // static host / preview: not our API
      return { ok: res.ok, status: res.status, data: (await res.json()) as T & Partial<ApiError> };
    } catch { return null; }
  }

  async placesEnabled(): Promise<boolean> {
    if (this.serverPlaces !== null) return this.serverPlaces;
    const r = await this.call<{ places: boolean }>('/config');
    this.serverPlaces = !!r?.data.places;
    return this.serverPlaces;
  }

  /** Instant local matches, plus Google suggestions from the server when available. */
  async suggest(q: string, onLocal?: (s: Suggestion[]) => void): Promise<Suggestion[]> {
    const local = suggestLocal(q, 6);
    onLocal?.(local);
    if (q.trim().length < 3 || !(await this.placesEnabled())) return local;
    const r = await this.call<{ items: Suggestion[] }>('/places/suggest?q=' + encodeURIComponent(q));
    return r?.ok ? r.data.items : local;
  }

  async details(s: Suggestion): Promise<Place> {
    if (s.local) return s.local;
    const r = await this.call<{ place: Place }>('/places/details?id=' + encodeURIComponent(s.id) + '&text=' + encodeURIComponent(s.text));
    if (r?.ok && r.data.place) return r.data.place;
    throw new BookingError(r?.data.error || 'Could not load that place. Please pick another.');
  }

  async reverse(lat: number, lng: number): Promise<Place> {
    if (!inSouthIndiaBounds(lat, lng)) throw new BookingError('We currently serve South India only.');
    const r = await this.call<{ place: Place }>(`/places/reverse?lat=${lat}&lng=${lng}`);
    if (r?.ok && r.data.place) return r.data.place;
    if (r && !r.ok) throw new BookingError(r.data.error || 'Could not detect your location.');
    const near = nearestCity(lat, lng);
    if (near) return near;
    throw new BookingError('Could not find a nearby city. Please type your pickup location.');
  }

  /** Instant, network-free estimate (offline distance table). Used to paint the estimate card immediately. */
  async offlineQuote(req: QuoteRequest): Promise<Quote> {
    this.checkRegion(req);
    const { estimateRoute } = await import('./estimate');
    const route = req.service === 'hourly_rental'
      ? { km: (req.hours ?? 8) * FARES.kmPerHour, durationText: `${req.hours} hrs`, toll: null, source: 'package' as const }
      : estimateRoute(req.service === 'multi_city' ? [req.pickup, ...req.stops, req.drop as Place] : [req.pickup, req.drop as Place]);
    return buildQuote(req, route, FARES);
  }

  /** Authoritative quote from the server (Google route + toll, signed token). Falls back to the offline estimate. */
  async quote(req: QuoteRequest): Promise<{ quote: Quote; token?: string; offline: boolean }> {
    this.checkRegion(req);
    const r = await this.call<{ quote: Quote; token: string }>('/quote', { method: 'POST', body: JSON.stringify(req) });
    if (r) {
      if (!r.ok) throw new BookingError(r.data.error || 'Could not calculate the fare.');
      return { quote: r.data.quote, token: r.data.token, offline: false };
    }
    return { quote: await this.offlineQuote(req), offline: true };
  }

  /** Warm up lazy chunks/config so the first fare check feels instant. */
  prefetch(): void { void import('./estimate'); void this.placesEnabled(); }

  async confirm(quote: Quote, token: string | undefined, vehicle: VehicleId): Promise<{ booking: Booking; summary: TripSummary; offline: boolean }> {
    if (token) {
      const r = await this.call<{ booking: Booking; summary: TripSummary }>('/confirm', { method: 'POST', body: JSON.stringify({ quote, token, vehicle }) });
      if (r) {
        if (!r.ok) throw new BookingError(r.data.error || 'Could not confirm the booking.');
        return { booking: r.data.booking, summary: r.data.summary, offline: false };
      }
    }
    const booking: Booking = { bookingId: makeRef('B'), enquiryId: quote.enquiryId, confirmedAt: new Date().toISOString(), vehicle, quote };
    return { booking, summary: summarise(quote, vehicle, { booking }), offline: true };
  }

  async attach(body: Record<string, string>): Promise<{ ref: string }> {
    const r = await this.call<{ ok: boolean; ref: string }>('/attach', { method: 'POST', body: JSON.stringify(body) });
    if (!r) throw new BookingError('The booking server is not reachable right now. Please call us.');
    if (!r.ok) throw new BookingError(r.data.error || 'Could not submit.');
    return { ref: r.data.ref };
  }

  /** Client-side mirror of the server's region rule so users get instant feedback. */
  private checkRegion(req: QuoteRequest): void {
    for (const p of [req.pickup, req.drop, ...req.stops]) {
      if (!p) continue;
      if (!inSouthIndiaBounds(p.lat, p.lng) || (p.state && !isSouthIndiaState(p.state)))
        throw new BookingError('We currently serve South India only (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, Puducherry).');
    }
    void SOUTH_INDIA_BOUNDS;
  }

  get isBrowser(): boolean { return this.browser; }
}
