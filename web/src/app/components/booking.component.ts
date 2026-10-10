import { Component, Input, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CITIES, VEHICLES, City, distanceKm, durationText, fareFor, inr } from '../data';
import { SITE } from '../site.config';
import { FareResult, TripType } from '../core/fare';

interface Quote { id: string; name: string; seats: number; fare: FareResult; }

@Component({
  selector: 'app-booking',
  imports: [FormsModule],
  template: `
  <form class="card book" (ngSubmit)="estimate()" #f="ngForm" aria-label="Taxi fare estimate">
    <div class="tabs" role="tablist">
      <button type="button" role="tab" [class.on]="trip === 'oneway'" (click)="trip = 'oneway'">One way</button>
      <button type="button" role="tab" [class.on]="trip === 'round'" (click)="trip = 'round'">Round trip</button>
    </div>
    <div class="grid2">
      <label>Pickup city
        <select name="from" [(ngModel)]="from" required><option value="" disabled>Select pickup</option>
          @for (c of cities; track c.slug) { <option [value]="c.slug">{{ c.name }}</option> }</select></label>
      <label>Drop city
        <select name="to" [(ngModel)]="to" required><option value="" disabled>Select drop</option>
          @for (c of cities; track c.slug) { <option [value]="c.slug">{{ c.name }}</option> }</select></label>
      <label>Pickup date<input type="date" name="date" [(ngModel)]="date" [min]="today()" required></label>
      @if (trip === 'round') { <label>Return date<input type="date" name="ret" [(ngModel)]="returnDate" [min]="date || today()" required></label> }
      @else { <label>Pickup time<input type="time" name="time" [(ngModel)]="time"></label> }
      <label>Your name<input name="name" [(ngModel)]="name" autocomplete="name" placeholder="Full name" required></label>
      <label>Mobile<input name="phone" [(ngModel)]="phone" inputmode="numeric" autocomplete="tel" maxlength="10" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile" required></label>
    </div>
    @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
    <button class="btn btn-lg" type="submit">Get instant fare</button>

    @if (quotes().length) {
      <div class="quotes" aria-live="polite">
        <p class="muted">{{ fromName() }} → {{ toName() }} · {{ km() }} km · ~{{ dur() }}{{ trip === 'round' ? ' · ' + days() + ' day(s)' : '' }}</p>
        @for (q of quotes(); track q.id) {
          <div class="quote"><div><b>{{ q.name }}</b><span class="muted">{{ q.seats }} seats · {{ q.fare.billableKm }} km billed &#64; ₹{{ q.fare.rate }}/km + ₹{{ q.fare.batta }} driver</span></div>
            <div class="price">{{ inr(q.fare.total) }}</div></div>
        }
        <p class="muted small">Toll, state permit & parking extra at actuals. Final fare is confirmed by our team.</p>
        <a class="btn btn-wa btn-lg" [href]="waLink()" rel="noopener">Confirm on WhatsApp</a>
        @if (sent()) { <p class="ok">Request received. We will call you shortly on {{ phone }}.</p> }
      </div>
    }
  </form>`
})
export class BookingComponent implements OnInit {
  @Input() from = '';
  @Input() to = '';
  cities: City[] = CITIES;
  trip: TripType = 'oneway';
  date = ''; returnDate = ''; time = '09:00'; name = ''; phone = '';
  today = signal('');
  error = signal('');
  quotes = signal<Quote[]>([]);
  km = signal(0); days = signal(1); sent = signal(false);
  private platform = inject(PLATFORM_ID);
  inr = inr;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platform)) {
      const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      this.today.set(d.toISOString().slice(0, 10));
    }
  }
  fromName = () => CITIES.find((c) => c.slug === this.from)?.name ?? '';
  toName = () => CITIES.find((c) => c.slug === this.to)?.name ?? '';
  dur = () => durationText(this.km());

  estimate(): void {
    this.error.set(''); this.sent.set(false);
    if (!/^[6-9]\d{9}$/.test(this.phone)) return this.error.set('Enter a valid 10-digit mobile number.');
    if (!this.from || !this.to || this.from === this.to) return this.error.set('Choose two different cities.');
    const km = distanceKm(this.from, this.to);
    if (!km) return this.error.set('We could not find that route. Please call us for a quote.');
    let days = 1;
    if (this.trip === 'round') {
      if (!this.date || !this.returnDate || this.returnDate < this.date) return this.error.set('Return date must be on or after pickup date.');
      days = Math.round((Date.parse(this.returnDate) - Date.parse(this.date)) / 86400000) + 1;
    }
    this.km.set(km); this.days.set(days);
    this.quotes.set(VEHICLES.map((v) => ({ id: v.id, name: v.name, seats: v.seats, fare: fareFor(v, km, this.trip, days) })));
    if (isPlatformBrowser(this.platform)) {
      fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ name: this.name, phone: this.phone, from: this.from, to: this.to, trip: this.trip, date: this.date, returnDate: this.returnDate, time: this.time, page: location.pathname }) })
        .then((r) => this.sent.set(r.ok)).catch(() => undefined);
    }
  }
  waLink(): string {
    const t = `Hi, I need a ${this.trip === 'round' ? 'round trip' : 'one way'} taxi from ${this.fromName()} to ${this.toName()} on ${this.date}${this.trip === 'oneway' ? ' at ' + this.time : ' to ' + this.returnDate}. Name: ${this.name}, Mobile: ${this.phone}`;
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(t)}`;
  }
}
