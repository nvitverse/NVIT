import { Component, Input, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AIRPORT_CITIES, CITY_MAP, inr } from '../data';
import { BookingApi, BookingError } from '../core/booking-api.service';
import { Attribution, Quote, QuoteRequest } from '../core/booking.model';
import { FARES } from '../core/fares';
import { ServiceType, VehicleId } from '../core/fare';
import { Place } from '../core/geo';
import { placeOfCity } from '../core/local-places';
import { VEHICLES } from '../core/vehicles-meta';
import { summarise } from '../core/summary';
import { fareLines, kmPolicyText } from '../core/summary';
import { VEHICLE_IDS } from '../core/quote';
import { PlaceInputComponent } from './place-input.component';
import { VehicleIconComponent } from './vehicle-icon.component';

const COUNTRIES = [['+91', 'IN +91'], ['+971', 'UAE +971'], ['+966', 'KSA +966'], ['+974', 'QA +974'], ['+965', 'KW +965'], ['+968', 'OM +968'], ['+973', 'BH +973'], ['+65', 'SG +65'], ['+60', 'MY +60'], ['+94', 'LK +94'], ['+1', 'US +1'], ['+44', 'UK +44'], ['+61', 'AU +61']];
const TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: 'one_way', label: 'Drop Taxi', icon: '→' }, { id: 'round_trip', label: 'Round Trip', icon: '⇄' },
  { id: 'hourly_rental', label: 'Local Rental', icon: '⏱' }, { id: 'multi_city', label: 'Multi City', icon: '⛓' }, { id: 'airport', label: 'Airport', icon: '✈' }
];
const TIMES = Array.from({ length: 48 }, (_, i) => { const h = Math.floor(i / 2), m = i % 2 ? '30' : '00'; const v = `${String(h).padStart(2, '0')}:${m}`; const hh = h % 12 || 12; return { v, l: `${String(hh).padStart(2, '0')}:${m} ${h >= 12 ? 'PM' : 'AM'}` }; });

@Component({
  selector: 'app-booking',
  imports: [FormsModule, PlaceInputComponent, VehicleIconComponent],
  template: `
  <section class="card book" aria-label="Book a taxi">
    <div class="tabs" role="tablist" aria-label="Service type">
      @for (t of tabs; track t.id) { <button type="button" role="tab" [attr.aria-selected]="service === t.id" [class.on]="service === t.id" (click)="setService(t.id)"><span aria-hidden="true">{{ t.icon }}</span> {{ t.label }}</button> }
    </div>

    <form (ngSubmit)="check()" novalidate>
      <div class="loc-grid">
        <app-place-input label="Pickup location" [locate]="true" placeholder="City, area or landmark" [(place)]="pickup" [invalid]="submitted && !pickup" />
        @if (service !== 'hourly_rental') {
          <button type="button" class="swap" (click)="swap()" aria-label="Swap pickup and drop" title="Swap">⇅</button>
          <app-place-input label="Drop location" placeholder="City, area or landmark" [(place)]="drop" [invalid]="submitted && !drop" />
        } @else {
          <div class="field"><label for="pkg">Rental package</label>
            <select id="pkg" name="hours" [(ngModel)]="hours">@for (h of packages; track h) { <option [ngValue]="h">{{ h }} hours · {{ h * kmPerHour }} km</option> }</select></div>
        }
      </div>

      @if (service === 'airport') {
        <div class="chips-mini" aria-label="Airports"><span class="muted small">Airports:</span>
          @for (c of airports; track c.slug) { <button type="button" (click)="useAirport(c.slug)">{{ c.name }}</button> }</div>
      }

      @if (service === 'multi_city') {
        <div class="stops">
          @for (s of stops; track $index) {
            <div class="stop"><app-place-input [label]="'Stop ' + ($index + 1)" placeholder="Via city or place" [place]="s" (placeChange)="stops[$index] = $event" />
              <div class="stop-act"><button type="button" (click)="moveStop($index, -1)" [disabled]="$index === 0" aria-label="Move up">▲</button>
                <button type="button" (click)="moveStop($index, 1)" [disabled]="$index === stops.length - 1" aria-label="Move down">▼</button>
                <button type="button" (click)="stops.splice($index, 1)" aria-label="Remove stop">✕</button></div></div>
          }
          @if (stops.length < 10) { <button type="button" class="link-btn" (click)="stops.push(null)">+ Add stop <span class="muted small">(₹{{ stopCharge }} each, up to 10)</span></button> }
        </div>
      }

      <div class="grid3">
        <div class="field"><label for="d1">{{ service === 'hourly_rental' ? 'Date' : 'Pickup date' }}</label><input id="d1" type="date" name="date" [(ngModel)]="date" [min]="today()"></div>
        <div class="field"><label for="t1">Pickup time</label><select id="t1" name="time" [(ngModel)]="time">@for (t of times; track t.v) { <option [value]="t.v">{{ t.l }}</option> }</select></div>
        <div class="field"><label for="pax">Passengers</label><select id="pax" name="pax" [(ngModel)]="passengers">@for (n of paxList; track n) { <option [ngValue]="n">{{ n }}{{ n === 8 ? '+' : '' }}</option> }</select></div>
      </div>
      @if (service === 'round_trip' || service === 'multi_city') {
        <div class="grid3">
          <div class="field"><label for="d2">Return date</label><input id="d2" type="date" name="endDate" [(ngModel)]="endDate" [min]="date || today()"></div>
          <div class="field"><label for="t2">Return time</label><select id="t2" name="dropTime" [(ngModel)]="dropTime">@for (t of times; track t.v) { <option [value]="t.v">{{ t.l }}</option> }</select></div>
          <div class="field days"><label>Trip length</label><div class="daybadge">{{ days() }} day{{ days() > 1 ? 's' : '' }}</div></div>
        </div>
      }

      <fieldset class="contact"><legend>Your details</legend>
        <div class="grid2">
          <div class="field"><label for="nm">Full name</label><input id="nm" name="name" [(ngModel)]="name" autocomplete="name" placeholder="Your name" [class.bad]="submitted && name.trim().length < 2"></div>
          <div class="field"><label for="ph">Mobile number</label>
            <div class="phone"><select name="cc" [(ngModel)]="cc" aria-label="Country code">@for (c of countries; track c[0]) { <option [value]="c[0]">{{ c[1] }}</option> }</select>
              <input id="ph" name="phone" [(ngModel)]="phone" inputmode="numeric" autocomplete="tel-national" maxlength="15" placeholder="10-digit mobile" [class.bad]="submitted && !phoneOk()"></div></div>
        </div>
        <label class="check"><input type="checkbox" name="waSame" [(ngModel)]="waSame"> WhatsApp number is same as mobile</label>
        @if (!waSame) {
          <div class="field"><label for="wa">WhatsApp number</label>
            <div class="phone"><select name="waCc" [(ngModel)]="waCc" aria-label="WhatsApp country code">@for (c of countries; track c[0]) { <option [value]="c[0]">{{ c[1] }}</option> }</select>
              <input id="wa" name="wa" [(ngModel)]="wa" inputmode="numeric" maxlength="15" placeholder="WhatsApp number"></div></div>
        }
        <div class="field"><label for="em">Email <span class="muted">(optional – we email your booking summary)</span></label><input id="em" type="email" name="email" [(ngModel)]="email" autocomplete="email" placeholder="you@example.com"></div>
      </fieldset>

      <div class="opts">
        <div class="seg" role="radiogroup" aria-label="Toll"><button type="button" role="radio" [attr.aria-checked]="!includeToll" [class.on]="!includeToll" (click)="includeToll = false">Excludes toll</button>
          <button type="button" role="radio" [attr.aria-checked]="includeToll" [class.on]="includeToll" (click)="includeToll = true">Includes toll</button></div>
        <div class="promo"><input name="coupon" [(ngModel)]="coupon" placeholder="Promo code (optional)" maxlength="24" aria-label="Promo code"></div>
      </div>

      @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
      <button class="btn btn-lg btn-block" type="submit" [disabled]="busy()">{{ busy() ? 'Calculating…' : 'Check Fare Now' }}</button>
      <p class="muted small center">No payment now · Final fare confirmed before pickup</p>
    </form>

    @if (quote(); as q) {
      <div class="result" id="fare-result" aria-live="polite">
        <div class="r-head">
          <div class="r-title"><b>{{ short(q.request.pickup.text) }}</b>@if (q.request.drop) { <span class="arrow"> → </span><b>{{ short(q.request.drop.text) }}</b> }
            <div class="muted small">@if (q.request.service === 'hourly_rental') { {{ q.request.hours }} hrs · {{ q.request.hours! * kmPerHour }} km package } @else { ~{{ q.route.km }} km · ~{{ q.route.durationText }} }
              @if (q.days > 1) { · {{ q.days }} days } @if (q.route.source !== 'package') { · {{ q.route.source === 'google' ? 'Google route distance' : 'Estimated distance' }} }@if (q.route.toll) { · est. toll {{ inr(q.route.toll) }} }</div></div>
          <button type="button" class="link-btn" (click)="edit()">Edit trip</button>
        </div>
        @if (q.coupon && !q.coupon.applied) { <p class="err small">{{ q.coupon.message }}</p> }
        @if (q.coupon?.applied) { <p class="ok small">Promo {{ q.coupon!.code }} applied ({{ q.coupon!.label }})</p> }
        @if (offline()) { <p class="note small">Preview mode: fare uses the offline distance table. Booking emails are sent only when the server is running.</p> }
        <div class="vlist" role="radiogroup" aria-label="Choose a cab">
          @for (v of vehicles; track v.id) {
            <button type="button" role="radio" class="vopt" [class.on]="selected() === v.id" [attr.aria-checked]="selected() === v.id" (click)="selected.set(v.id)">
              <app-vehicle-icon [type]="v.id" />
              <span class="vinfo"><b>{{ v.name }}</b><span class="muted small">{{ v.models }} · {{ v.seatsLabel }} seats · {{ v.bags }} bags</span></span>
              <span class="vprice"><b>{{ inr(q.fares[v.id].total) }}</b><span class="muted small">₹{{ q.fares[v.id].perKmRate }}/{{ q.request.service === 'hourly_rental' ? 'hr' : 'km' }}</span></span>
            </button>
          }
        </div>
        @if (detail(); as d) {
          <div class="breakdown">
            <h4>Fare details · {{ d.vehicleName }}</h4>
            <table>@for (l of d.lines; track l.label) { <tr><td>{{ l.label }}</td><td>{{ l.value }}</td></tr> }<tr class="tot"><td>Estimated fare</td><td>{{ d.total }}</td></tr></table>
            <p class="small"><b>Km limit:</b> {{ d.kmPolicy }}</p>
            <p class="small muted">{{ d.extras }}</p>
          </div>
        }
        <button class="btn btn-wa btn-lg btn-block" type="button" (click)="book()" [disabled]="busy()">{{ busy() ? 'Booking…' : 'Book ' + selectedName() + ' · ' + inr(q.fares[selected()].total) }}</button>
        <p class="muted small center">We confirm your driver &amp; cab details on WhatsApp before pickup.</p>
      </div>
    }
  </section>`
})
export class BookingComponent implements OnInit {
  @Input() from = ''; @Input() to = ''; @Input() startService: ServiceType = 'one_way';
  tabs = TABS; times = TIMES; countries = COUNTRIES; vehicles = VEHICLES; inr = inr;
  packages = FARES.hourlyPackages; kmPerHour = FARES.kmPerHour; stopCharge = FARES.multiCityStopCharge;
  paxList = [1, 2, 3, 4, 5, 6, 7, 8];
  airports = AIRPORT_CITIES.slice(0, 10);

  service: ServiceType = 'one_way';
  pickup: Place | null = null; drop: Place | null = null; stops: (Place | null)[] = [];
  date = ''; time = '09:00'; endDate = ''; dropTime = '09:00'; hours = 8; passengers = 2;
  name = ''; cc = '+91'; phone = ''; waSame = true; waCc = '+91'; wa = ''; email = '';
  includeToll = false; coupon = '';
  submitted = false;

  today = signal(''); busy = signal(false); error = signal('');
  quote = signal<Quote | null>(null); private token: string | undefined;
  offline = signal(false); selected = signal<VehicleId>('SEDAN');
  private api = inject(BookingApi); private router = inject(Router);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    this.service = this.startService;
    const f = CITY_MAP.get(this.from), t = CITY_MAP.get(this.to);
    if (f) this.pickup = placeOfCity(f);
    if (t) this.drop = placeOfCity(t);
    if (this.browser) {
      const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const iso = d.toISOString().slice(0, 10); this.today.set(iso); this.date = iso;
      d.setDate(d.getDate() + 1); this.endDate = d.toISOString().slice(0, 10);
      try { const saved = JSON.parse(localStorage.getItem('dtn:contact') || 'null'); if (saved) { this.name = saved.name || ''; this.phone = saved.phone || ''; this.email = saved.email || ''; this.cc = saved.cc || '+91'; } } catch { /* ignore */ }
    }
  }

  setService(s: ServiceType): void { this.service = s; this.error.set(''); this.quote.set(null); this.submitted = false; if (s === 'multi_city' && !this.stops.length) this.stops = [null]; }
  swap(): void { const p = this.pickup; this.pickup = this.drop; this.drop = p; }
  moveStop(i: number, d: number): void { const j = i + d; if (j < 0 || j >= this.stops.length) return; [this.stops[i], this.stops[j]] = [this.stops[j], this.stops[i]]; }
  useAirport(slug: string): void { const c = CITY_MAP.get(slug); if (!c) return; const p: Place = { ...placeOfCity(c), text: `${c.name} Airport, ${c.state}` }; if (!this.pickup) this.pickup = p; else this.drop = p; }
  days = () => { if (!this.date || !this.endDate) return 1; const d = Math.round((Date.parse(this.endDate) - Date.parse(this.date)) / 86400000) + 1; return d > 0 ? d : 1; };
  phoneOk = () => (this.cc === '+91' ? /^[6-9]\d{9}$/.test(this.phone.replace(/\D/g, '')) : /^\d{6,15}$/.test(this.phone.replace(/\D/g, '')));
  edit(): void { this.quote.set(null); }

  private attribution(): Attribution {
    let a: Attribution = {};
    try {
      const q = new URLSearchParams(location.search), saved = JSON.parse(sessionStorage.getItem('dtn:utm') || '{}');
      a = { utmSource: q.get('utm_source') || saved.utmSource, utmMedium: q.get('utm_medium') || saved.utmMedium, utmCampaign: q.get('utm_campaign') || saved.utmCampaign, gclid: q.get('gclid') || saved.gclid };
      sessionStorage.setItem('dtn:utm', JSON.stringify(a));
    } catch { /* ignore */ }
    return { ...a, source: a.utmSource || 'direct', page: location.pathname, device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop' };
  }

  async check(): Promise<void> {
    this.submitted = true; this.error.set('');
    if (!this.pickup) return this.error.set('Please choose your pickup location from the suggestions.');
    if (this.service !== 'hourly_rental' && !this.drop) return this.error.set('Please choose your drop location from the suggestions.');
    if (this.service === 'multi_city' && this.stops.some((s) => !s)) return this.error.set('Choose a location for every stop or remove the empty stop.');
    if (!this.date) return this.error.set('Please choose the pickup date.');
    if ((this.service === 'round_trip' || this.service === 'multi_city') && (!this.endDate || this.endDate < this.date)) return this.error.set('Return date must be on or after the pickup date.');
    if (this.name.trim().length < 2) return this.error.set('Please enter your name.');
    if (!this.phoneOk()) return this.error.set('Please enter a valid mobile number.');
    if (!this.waSame && !/^\d{6,15}$/.test(this.wa.replace(/\D/g, ''))) return this.error.set('Please enter a valid WhatsApp number.');
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email)) return this.error.set('Please enter a valid email address.');
    const req: QuoteRequest = {
      service: this.service, pickup: this.pickup, drop: this.service === 'hourly_rental' ? undefined : this.drop ?? undefined,
      stops: this.service === 'multi_city' ? (this.stops.filter(Boolean) as Place[]) : [], date: this.date, time: this.time,
      endDate: this.service === 'round_trip' || this.service === 'multi_city' ? this.endDate : undefined,
      dropTime: this.service === 'round_trip' || this.service === 'multi_city' ? this.dropTime : undefined,
      hours: this.service === 'hourly_rental' ? this.hours : undefined, passengers: this.passengers, includeToll: this.includeToll, coupon: this.coupon.trim() || undefined,
      contact: { name: this.name.trim(), countryCode: this.cc, phone: this.phone.replace(/\D/g, ''), waCountryCode: this.waSame ? this.cc : this.waCc,
        whatsapp: this.waSame ? this.phone.replace(/\D/g, '') : this.wa.replace(/\D/g, ''), email: this.email.trim() || undefined },
      attribution: this.attribution()
    };
    this.busy.set(true);
    try {
      const r = await this.api.quote(req);
      this.quote.set(r.quote); this.token = r.token; this.offline.set(r.offline);
      const best = this.passengers > 6 ? 'INNOVA' : this.passengers > 4 ? 'SUV' : 'SEDAN';
      this.selected.set(best);
      try { localStorage.setItem('dtn:contact', JSON.stringify({ name: this.name, phone: this.phone, email: this.email, cc: this.cc })); } catch { /* ignore */ }
      this.push('fare_check', r.quote);
      setTimeout(() => document.getElementById('fare-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (e) { this.error.set(e instanceof BookingError ? e.message : 'Something went wrong. Please try again or call us.'); }
    this.busy.set(false);
  }

  /** First two parts of an address, for compact headings (full text is kept in messages/emails). */
  short = (t: string) => t.split(',').slice(0, 2).join(',').trim();
  selectedName = () => VEHICLES.find((v) => v.id === this.selected())?.name ?? '';
  detail = () => {
    const q = this.quote(); if (!q) return null; const f = q.fares[this.selected()]; const s = summarise(q, this.selected());
    return { vehicleName: s.vehicleName, lines: fareLines(f), total: s.totalText, kmPolicy: kmPolicyText(f), extras: s.extrasNote };
  };

  async book(): Promise<void> {
    const q = this.quote(); if (!q) return;
    this.busy.set(true); this.error.set('');
    try {
      const r = await this.api.confirm(q, this.token, this.selected());
      this.push('booking_confirmed', q);
      try { sessionStorage.setItem('dtn:last', JSON.stringify({ summary: r.summary, bookingId: r.booking.bookingId, offline: r.offline, emailed: !!q.request.contact.email && !r.offline })); } catch { /* ignore */ }
      await this.router.navigate(['/thank-you'], { queryParams: { ref: r.booking.bookingId } });
    } catch (e) { this.error.set(e instanceof BookingError ? e.message : 'Could not confirm. Please try again or call us.'); }
    this.busy.set(false);
  }
  private push(event: string, q: Quote): void {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event, service: q.request.service, value: q.fares[this.selected()].total, currency: 'INR' });
  }
  protected readonly ids = VEHICLE_IDS;
}
