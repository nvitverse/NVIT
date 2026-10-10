import { FareBreakdown, ServiceType, VehicleId } from './fare';
import { Place } from './geo';

export const SERVICE_LABEL: Record<ServiceType, string> = {
  one_way: 'One Way Drop Taxi',
  round_trip: 'Round Trip',
  hourly_rental: 'Hourly Rental',
  multi_city: 'Multi City Trip',
  airport: 'Airport Transfer'
};

export interface Contact {
  name: string;
  countryCode: string;       // "+91"
  phone: string;             // national number
  waCountryCode: string;
  whatsapp: string;          // national number
  email?: string;
}

export interface Attribution {
  source?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; gclid?: string;
  page?: string; device?: 'mobile' | 'desktop';
}

export interface QuoteRequest {
  service: ServiceType;
  pickup: Place;
  drop?: Place;
  stops: Place[];
  date: string; time: string;
  endDate?: string; dropTime?: string;
  hours?: number;
  passengers?: number;
  includeToll: boolean;
  coupon?: string;
  contact: Contact;
  attribution?: Attribution;
}

export type DistanceSource = 'google' | 'estimate' | 'package';

export interface RouteInfo {
  km: number;
  durationText: string;
  toll: number | null;
  source: DistanceSource;
}

export interface CouponInfo { code: string; type: 'flat' | 'percent'; value: number; label: string }

export interface Quote {
  enquiryId: string;
  createdAt: string;
  request: QuoteRequest;
  route: RouteInfo;
  days: number;
  fares: Record<VehicleId, FareBreakdown>;
  coupon?: CouponInfo & { applied: boolean; message?: string };
  /** HMAC token issued by the server so /api/confirm can trust the numbers. Absent in offline preview mode. */
  token?: string;
}

export interface Booking {
  bookingId: string;
  enquiryId: string;
  confirmedAt: string;
  vehicle: VehicleId;
  quote: Quote;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeRef(kind: 'E' | 'B', now = new Date(), rnd: () => number = Math.random): string {
  const y = String(now.getUTCFullYear()).slice(2), m = String(now.getUTCMonth() + 1).padStart(2, '0'), d = String(now.getUTCDate()).padStart(2, '0');
  let s = ''; for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(rnd() * ALPHABET.length)];
  return `DTN-${kind}-${y}${m}${d}-${s}`;
}
