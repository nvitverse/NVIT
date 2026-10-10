import { Injectable, signal } from '@angular/core';
import { VehicleId } from './fare';

/** Lets other sections (e.g. the routes & fares explorer) fill the booking form and scroll to it. */
@Injectable({ providedIn: 'root' })
export class BookingPrefill {
  request = signal<{ from: string; to: string; vehicle?: VehicleId; n: number } | null>(null);
  private n = 0;
  open(from: string, to: string, vehicle?: VehicleId): void { this.request.set({ from, to, vehicle, n: ++this.n }); }
}
