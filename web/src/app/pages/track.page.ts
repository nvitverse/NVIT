import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../core/seo.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { SITE } from '../site.config';

interface Result { bookingId: string; status: string; serviceLabel: string; pickup: string; drop: string; stops: string[]; dateText: string; timeText: string; returnText: string; vehicle: string; total: string; kmPolicy: string }

@Component({
  selector: 'app-track',
  imports: [FormsModule, CrumbsComponent],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec narrow"><h1>Track your booking</h1>
    <p class="lead dark">Enter your booking ID and the last 4 digits of the mobile number used for the booking.</p>
    <form class="card" (ngSubmit)="find()" novalidate>
      <div class="grid2"><div class="field"><label for="tk1">Booking ID</label><input id="tk1" name="id" [(ngModel)]="id" placeholder="DTN-B-261010-AB12" autocapitalize="characters" autocomplete="off"></div>
        <div class="field"><label for="tk2">Last 4 digits of mobile</label><input id="tk2" name="l4" [(ngModel)]="last4" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>
      @if (err()) { <p class="err" role="alert">{{ err() }}</p> }
      <button class="btn btn-lg" type="submit" [disabled]="busy()">{{ busy() ? 'Searching…' : 'Track booking' }}</button>
    </form>
    @if (res(); as r) {
      <div class="card sum" aria-live="polite"><h2>{{ r.bookingId }}</h2><p class="ok">{{ r.status }}</p>
        <table><tr><td>Service</td><td>{{ r.serviceLabel }}</td></tr><tr><td>Pickup</td><td>{{ r.pickup }}</td></tr>
          @for (x of r.stops; track $index) { <tr><td>Stop {{ $index + 1 }}</td><td>{{ x }}</td></tr> }
          @if (r.drop) { <tr><td>Drop</td><td>{{ r.drop }}</td></tr> }
          <tr><td>Pickup time</td><td>{{ r.dateText }} · {{ r.timeText }}</td></tr>@if (r.returnText) { <tr><td>Return</td><td>{{ r.returnText }}</td></tr> }
          <tr><td>Cab</td><td>{{ r.vehicle }}</td></tr><tr class="tot"><td>Estimated fare</td><td>{{ r.total }}</td></tr></table>
        <p class="small"><b>Km limit:</b> {{ r.kmPolicy }}</p>
        <p class="muted small">Need help? <a [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a> or <a [href]="'https://wa.me/' + site.whatsapp">WhatsApp us</a>.</p></div>
    }
  </section>`
})
export class TrackPage {
  site = SITE; crumbs = [{ name: 'Home', path: '/' }, { name: 'Track Booking', path: '/track-booking' }];
  id = ''; last4 = ''; busy = signal(false); err = signal(''); res = signal<Result | null>(null);
  constructor() { inject(SeoService).set({ title: `Track Booking | ${SITE.brand}`, description: 'Check the status of your taxi booking with your booking ID.', path: '/track-booking', noindex: true }); }
  async find(): Promise<void> {
    this.err.set(''); this.res.set(null); this.busy.set(true);
    try {
      const r = await fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: this.id, last4: this.last4 }) });
      const j = (await r.json().catch(() => ({}))) as Result & { error?: string };
      if (!r.ok) this.err.set(j.error || 'Could not find that booking.'); else this.res.set(j);
    } catch { this.err.set('The server is not reachable right now. Please call us.'); }
    this.busy.set(false);
  }
}
