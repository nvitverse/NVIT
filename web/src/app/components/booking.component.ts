import { Component, Input, OnInit, PLATFORM_ID, effect, inject, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIRPORT_CITIES, CITY_MAP, inr } from '../data';
import { BookingApi, BookingError } from '../core/booking-api.service';
import { Attribution, Quote, QuoteRequest } from '../core/booking.model';
import { FARES } from '../core/fares';
import { ServiceType, VehicleId } from '../core/fare';
import { Place } from '../core/geo';
import { placeOfCity } from '../core/local-places';
import { VEHICLES, VEHICLE_META } from '../core/vehicles-meta';
import { summarise } from '../core/summary';
import { messageToBusiness } from '../core/whatsapp';
import { WaChooseComponent } from './wa-choose.component';
import { SITE } from '../site.config';
import { VEHICLE_IDS } from '../core/quote';
import { Router } from '@angular/router';
import { BookingPrefill } from '../core/booking-prefill.service';
import { Analytics } from '../core/analytics.service';
import { PlaceInputComponent } from './place-input.component';
import { VehicleImgComponent } from './vehicle-img.component';

const COUNTRIES = [['+91', 'IN +91'], ['+971', 'UAE +971'], ['+966', 'KSA +966'], ['+974', 'QA +974'], ['+965', 'KW +965'], ['+968', 'OM +968'], ['+973', 'BH +973'], ['+65', 'SG +65'], ['+60', 'MY +60'], ['+94', 'LK +94'], ['+1', 'US +1'], ['+44', 'UK +44'], ['+61', 'AU +61']];
const TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: 'one_way', label: 'Drop Taxi', icon: '→' }, { id: 'round_trip', label: 'Round Trip', icon: '⇄' },
  { id: 'hourly_rental', label: 'Local Rental', icon: '⏱' }, { id: 'multi_city', label: 'Multi City', icon: '⛓' }, { id: 'airport', label: 'Airport', icon: '✈' }
];
const TIMES = Array.from({ length: 48 }, (_, i) => { const h = Math.floor(i / 2), m = i % 2 ? '30' : '00'; const v = `${String(h).padStart(2, '0')}:${m}`; const hh = h % 12 || 12; return { v, l: `${String(hh).padStart(2, '0')}:${m} ${h >= 12 ? 'PM' : 'AM'}` }; });

@Component({
  selector: 'app-booking',
  imports: [FormsModule, PlaceInputComponent, VehicleImgComponent, WaChooseComponent],
  template: `
  <section class="card book" aria-label="Book a taxi">
    @if (step() === 1) {
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
    }

    @if (step() > 1) {
      <ol class="stepper" aria-label="Booking progress">
        <li class="done"><span>✓</span> Details</li>
        <li [class.done]="step() > 2" [class.on]="step() === 2"><span>{{ step() > 2 ? '✓' : '2' }}</span> Estimate</li>
        <li [class.on]="step() === 3"><span>3</span> Confirm</li>
      </ol>
    }

    @if (step() === 2 && quote(); as q) {
      @if (summary(); as s) {
      <div class="est" id="fare-result" aria-live="polite">
        <div class="est-top">
          <div><span class="svc-pill">{{ s.serviceLabel }}</span><h3>Estimated Fare</h3></div>
          <button type="button" class="edit-btn" (click)="edit()">✎ Edit</button>
        </div>
        <p class="est-route"><b>{{ short(q.request.pickup.text) }}</b>@if (q.request.drop) { <span class="arrow"> → </span><b>{{ short(q.request.drop.text) }}</b> }</p>
        <div class="est-price" [class.shimmer]="refining()"><span class="cur">₹</span><span class="amt">{{ totalNum(s.fare.total) }}</span>
          <span class="per">{{ q.request.service === 'hourly_rental' ? s.fare.hours + ' hr package' : 'one trip, all cab charges' }}</span></div>
        @if (refining()) { <p class="live"><span class="dot"></span>Checking the live route and toll…</p> }
        @else if (live()) { <p class="live ok">✓ Live route applied · {{ q.route.source === 'google' ? 'Google Maps distance' : 'updated' }}</p> }
        @else if (offline()) { <p class="live note">Preview mode: offline distance table (bookings and emails need the server).</p> }
        @if (q.coupon && !q.coupon.applied) { <p class="err small">{{ q.coupon.message }}</p> }
        @if (q.coupon?.applied) { <p class="ok small">Promo {{ q.coupon!.code }} applied ({{ q.coupon!.label }})</p> }

        <div class="vtabs" role="radiogroup" aria-label="Choose a cab">
          @for (v of vehicles; track v.id) {
            <button type="button" role="radio" class="vtab" [class.on]="selected() === v.id" [attr.aria-checked]="selected() === v.id" (click)="selected.set(v.id)">
              <app-vehicle-img [type]="v.id" sizes="(max-width: 600px) 22vw, 90px" /><b>{{ v.name }}</b><span class="vt-price" [class.shimmer]="refining()">{{ inr(q.fares[v.id].total) }}</span></button>
          }
        </div>

        <dl class="rows">
          <div><dt>Route</dt><dd>{{ s.pickup }}@for (x of s.stops; track $index) { <br>↳ {{ x }} }@if (s.drop) { <br>→ {{ s.drop }} }</dd></div>
          <div><dt>Pickup</dt><dd>{{ s.dateText }} · {{ s.timeText }}</dd></div>
          @if (s.returnText) { <div><dt>Return</dt><dd>{{ s.returnText }}</dd></div> }
          <div><dt>Total distance</dt><dd>{{ s.distanceText }}@if (q.route.source !== 'package') { <span class="muted small"> · {{ q.route.source === 'google' ? 'Google route' : 'estimated' }}</span> }</dd></div>
          <div><dt>Drive time</dt><dd>{{ s.durationText }}</dd></div>
          <div><dt>Vehicle</dt><dd>{{ s.vehicleName }} <span class="muted small">({{ s.vehicleModels }}) · {{ vmeta().seatsLabel }} seats · {{ vmeta().bags }} bags · AC</span></dd></div>
          <div><dt>Rate</dt><dd>₹{{ s.fare.perKmRate }}/{{ q.request.service === 'hourly_rental' ? 'hr' : 'km' }}</dd></div>
          <div><dt>Billed distance</dt><dd>{{ q.request.service === 'hourly_rental' ? s.fare.includedKm + ' km included' : s.fare.billableKm + ' km (min. ' + s.fare.minimumKm + ' km)' }}</dd></div>
          <div class="hl"><dt>Km limit</dt><dd>{{ s.kmPolicy }}</dd></div>
          @if (s.fare.batta) { <div><dt>Driver allowance</dt><dd>{{ inr(s.fare.batta) }} <span class="tag ok">Included</span></dd></div> }
          @if (s.fare.stopCharge) { <div><dt>Extra stops</dt><dd>{{ inr(s.fare.stopCharge) }} <span class="tag ok">Included</span></dd></div> }
          <div><dt>Toll</dt><dd>@if (s.fare.toll) { {{ inr(s.fare.toll) }} <span class="tag ok">Included</span> } @else if (q.route.toll) { Est. {{ inr(q.route.toll) }} <span class="tag">Extra · pay at plazas</span> } @else { <span class="tag">Extra at actuals</span> }</dd></div>
          <div><dt>State permit / border</dt><dd><span class="tag">Extra at actuals</span></dd></div>
          <div><dt>Parking &amp; waiting</dt><dd><span class="tag">Extra at actuals</span></dd></div>
          @if (s.fare.discount) { <div><dt>Discount</dt><dd class="okc">-{{ inr(s.fare.discount) }}</dd></div> }
        </dl>

        <details class="bd"><summary>Fare breakdown</summary>
          <table>@for (l of s.lines; track l.label) { <tr><td>{{ l.label }}</td><td>{{ l.value }}</td></tr> }<tr class="tot"><td>Estimated fare</td><td>{{ s.totalText }}</td></tr></table>
          <p class="small muted">{{ s.extrasNote }}</p>
        </details>

        <button class="btn btn-dark btn-lg btn-block" type="button" (click)="go(3)" [disabled]="refining()">{{ refining() ? 'Confirming route…' : 'Book Now →' }}</button>
        <button type="button" class="link-btn center-btn" (click)="edit()">← Modify ride details</button>

        <div class="share">
          <span class="muted small">Share this quote:</span>
          <app-wa-choose [to]="bizWa" [text]="quoteMsg()" label="Send" />
          <button type="button" class="btn btn-ghost btn-sm" (click)="copyQuote()">{{ copied() ? 'Copied ✓' : 'Copy quote' }}</button>
        </div>
        <ul class="pills"><li>Pay only one way, zero return charges</li><li>24/7 doorstep pickup across South India</li><li>Fare confirmed before pickup</li></ul>
      </div>
      }
    }

    @if (step() === 3 && quote(); as q) {
      @if (summary(); as s) {
      <div class="est confirm" id="fare-result">
        <div class="est-top"><div><span class="svc-pill">{{ s.serviceLabel }}</span><h3>Confirm your booking</h3></div><button type="button" class="edit-btn" (click)="go(2)">← Back</button></div>
        <div class="est-price"><span class="cur">₹</span><span class="amt">{{ totalNum(s.fare.total) }}</span><span class="per">{{ s.vehicleName }} · estimated fare</span></div>
        <dl class="rows">
          <div><dt>Passenger</dt><dd>{{ s.customer.name }}<br><span class="muted small">Mobile {{ s.customer.phoneDisplay }} · WhatsApp +{{ s.customer.waIntl }}@if (s.customer.email) { · {{ s.customer.email }} }</span></dd></div>
          <div><dt>Route</dt><dd>{{ s.pickup }}@for (x of s.stops; track $index) { <br>↳ {{ x }} }@if (s.drop) { <br>→ {{ s.drop }} }</dd></div>
          <div><dt>Pickup</dt><dd>{{ s.dateText }} · {{ s.timeText }}</dd></div>
          @if (s.returnText) { <div><dt>Return</dt><dd>{{ s.returnText }}</dd></div> }
          <div><dt>Distance</dt><dd>{{ s.distanceText }} · {{ s.durationText }}</dd></div>
          <div><dt>Passengers</dt><dd>{{ s.passengers || 1 }}</dd></div>
          <div class="hl"><dt>Km limit</dt><dd>{{ s.kmPolicy }}</dd></div>
          <div><dt>Not included</dt><dd class="small">{{ s.extrasNote }}</dd></div>
        </dl>
        @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
        <button class="btn btn-wa btn-lg btn-block" type="button" (click)="book()" [disabled]="busy() || refining()">{{ busy() ? 'Booking…' : refining() ? 'Confirming route…' : 'Confirm booking · ' + s.totalText }}</button>
        <p class="muted small center">By confirming you agree to our <a href="/terms" target="_blank">Terms</a> and <a href="/cancellation-policy" target="_blank">Cancellation policy</a>. We confirm your driver &amp; cab on WhatsApp before pickup.</p>
      </div>
      }
    }
  </section>
`
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
  step = signal<1 | 2 | 3>(1); refining = signal(false); live = signal(false); copied = signal(false);
  offline = signal(false); selected = signal<VehicleId>('SEDAN');
  bizWa = SITE.whatsapp;
  private seq = 0;
  private api = inject(BookingApi); private router = inject(Router);
  private prefill = inject(BookingPrefill); private analytics = inject(Analytics);
  constructor() {
    effect(() => {
      const r = this.prefill.request();
      if (!r) return;
      untracked(() => {
        const f = CITY_MAP.get(r.from), t = CITY_MAP.get(r.to);
        if (!f || !t) return;
        this.seq++; this.refining.set(false); this.quote.set(null); this.token = undefined; this.error.set(''); this.submitted = false;
        this.service = 'one_way'; this.pickup = placeOfCity(f); this.drop = placeOfCity(t); this.step.set(1);
        if (r.vehicle) this.selected.set(r.vehicle);
        this.scrollTop();
        setTimeout(() => document.getElementById('nm')?.focus({ preventScroll: true }), 450);
      });
    });
  }
  private browser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    this.service = this.startService;
    if (this.browser) (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 300)))(() => this.api.prefetch());
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
  edit(): void { this.seq++; this.refining.set(false); this.step.set(1); this.error.set(''); this.quote.set(null); this.token = undefined; this.scrollTop(); }
  go(n: 2 | 3): void { this.step.set(n); this.error.set(''); this.scrollTop(); }
  private scrollTop(): void { if (this.browser) setTimeout(() => document.querySelector('app-booking .book')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); }

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
    const my = ++this.seq;
    try {
      // 1) Instant estimate from the offline table, so the estimate card appears immediately.
      const instant = await this.api.offlineQuote(req);
      this.quote.set(instant); this.token = undefined; this.offline.set(false); this.live.set(false); this.refining.set(true);
      this.selected.set(this.passengers > 6 ? 'INNOVA' : this.passengers > 4 ? 'SUV' : 'SEDAN');
      this.step.set(2); this.busy.set(false); this.scrollTop();
      try { localStorage.setItem('dtn:contact', JSON.stringify({ name: this.name, phone: this.phone, email: this.email, cc: this.cc })); } catch { /* ignore */ }
      this.push('fare_check', instant);
      // 2) Live route + toll + signed token from the server; numbers update in place.
      const r = await this.api.quote(req);
      if (my !== this.seq) return;
      const changed = Math.abs(r.quote.route.km - instant.route.km) >= 1 || r.quote.route.toll != null;
      this.quote.set(r.quote); this.token = r.token; this.offline.set(r.offline); this.live.set(!r.offline && changed); this.refining.set(false);
    } catch (e) {
      if (my !== this.seq) return;
      this.refining.set(false); this.busy.set(false);
      if (this.step() === 2 && this.quote()) { this.edit(); }
      this.error.set(e instanceof BookingError ? e.message : 'Something went wrong. Please try again or call us.');
      return;
    }
    this.busy.set(false);
  }

  vmeta = () => VEHICLE_META[this.selected()];
  summary = () => { const q = this.quote(); return q ? summarise(q, this.selected()) : null; };
  totalNum = (n: number) => Math.round(n).toLocaleString('en-IN');
  short = (t: string) => t.split(',').slice(0, 2).join(',').trim();
  quoteMsg = () => { const s = this.summary(); return s ? messageToBusiness(s) : ''; };
  copyQuote(): void { navigator.clipboard?.writeText(this.quoteMsg()).then(() => { this.copied.set(true); setTimeout(() => this.copied.set(false), 2000); }).catch(() => undefined); }
  async book(): Promise<void> {
    const q = this.quote(); if (!q) return;
    this.busy.set(true); this.error.set('');
    try {
      const r = await this.api.confirm(q, this.token, this.selected());
      this.push('booking_confirmed', q);
      try { sessionStorage.setItem('dtn:last', JSON.stringify({ summary: r.summary, bookingId: r.booking.bookingId, offline: r.offline, emailed: !!q.request.contact.email && !r.offline })); } catch { /* ignore */ }
      try { sessionStorage.setItem('dtn:last', JSON.stringify({ summary: r.summary, bookingId: r.booking.bookingId, offline: r.offline, emailed: !!q.request.contact.email && !r.offline })); } catch { /* ignore */ }
      await this.router.navigate(['/thank-you'], { queryParams: { ref: r.booking.bookingId } });
    } catch (e) { this.error.set(e instanceof BookingError ? e.message : 'Could not confirm. Please try again or call us.'); }
    this.busy.set(false);
  }
  private push(event: string, q: Quote): void { this.analytics.track(event, { service: q.request.service, value: q.fares[this.selected()].total, currency: 'INR' }); }
  protected readonly ids = VEHICLE_IDS;
}
