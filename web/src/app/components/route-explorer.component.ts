import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CITY_MAP, HUBS, ROUTES, Route, fareFor, inr, rateOf, routesFrom } from '../data';
import { durationText } from '../core/geo';
import { BookingPrefill } from '../core/booking-prefill.service';
import { VehicleId } from '../core/fare';
import { VEHICLES } from '../core/vehicles-meta';
import { messageToBusiness } from '../core/whatsapp';
import { summarise } from '../core/summary';
import { buildQuote } from '../core/quote';
import { FARES } from '../core/fares';
import { SITE } from '../site.config';
import { placeOfCity } from '../core/local-places';
import { VehicleImgComponent } from './vehicle-img.component';
import { WaChooseComponent } from './wa-choose.component';

@Component({
  selector: 'app-route-explorer',
  imports: [FormsModule, RouterLink, VehicleImgComponent, WaChooseComponent],
  template: `
  <div class="rx">
    <p class="eyebrow dark">₹ Transparent per-km fares</p>
    <h2 class="rx-h">Popular Outstation &amp; <span>Drop Taxi Routes</span></h2>
    <p class="muted rx-sub">Fixed one-way tariffs with zero return charges. Choose the pickup city and cab type to see the fare, <b>included km</b> and <b>extra-km rate</b> for every route.</p>

    @if (tabs) {
      <div class="rx-tabs" role="tablist" aria-label="Pickup city">
        @for (h of hubs; track h.slug) {
          <button type="button" role="tab" [attr.aria-selected]="city() === h.slug" [class.on]="city() === h.slug" (click)="setCity(h.slug)"><span aria-hidden="true">📍</span> {{ h.name }} Drop Taxi</button>
        }
      </div>
    }

    <div class="rx-bar">
      <div class="rx-types" role="radiogroup" aria-label="Cab type">
        @for (v of vehicles; track v.id) {
          <button type="button" role="radio" [attr.aria-checked]="vehicle() === v.id" [class.on]="vehicle() === v.id" (click)="vehicle.set(v.id)">
            <app-vehicle-img [type]="v.id" sizes="(max-width: 600px) 22vw, 90px" /><span><b>{{ v.name }}</b><small>₹{{ rate(v.id) }}/km · {{ v.seatsLabel }} seats</small></span></button>
        }
      </div>
      <div class="rx-tools">
        <label class="rx-search"><span class="sr">Search destination</span><input type="search" [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Search destination…" name="rxq"></label>
        <div class="rx-sort" role="group" aria-label="Sort"><span class="muted small">Sort:</span>
          <button type="button" [class.on]="sort() === 'km'" (click)="sort.set('km')">Distance</button>
          <button type="button" [class.on]="sort() === 'price'" (click)="sort.set('price')">Price</button>
          <button type="button" [class.on]="sort() === 'name'" (click)="sort.set('name')">A–Z</button></div>
      </div>
    </div>

    <div class="rx-table" role="table" [attr.aria-label]="'Drop taxi fares from ' + cityName()">
      <div class="rx-head" role="row"><span role="columnheader">Cabs from {{ cityName() }}</span><span role="columnheader">Included km &amp; extra fare</span><span role="columnheader">Cab price</span><span role="columnheader" class="rx-act-h"></span></div>
      @for (r of rows(); track r.slug; let i = $index) {
        <div class="rx-row" role="row">
          <div class="rx-route" role="cell"><a [routerLink]="['/drop-taxi', r.slug]"><b>{{ r.from.name }} to {{ r.to.name }}</b></a>
            <span class="muted small">{{ r.km }} kms · {{ dur(r.km) }}@if (r.to.state !== r.from.state) { · {{ r.to.state }} }</span>
            @if (i < 3 && !q()) { <span class="rx-badge">Popular</span> }</div>
          <div class="rx-inc" role="cell"><span class="inc"><i aria-hidden="true">✓</i> {{ billable(r.km) }} kms included</span>
            <span class="muted small">Extra fare ₹{{ rate(vehicle()) }}/km after {{ billable(r.km) }} km</span></div>
          <div class="rx-price" role="cell"><b>{{ inr(price(r.km)) }}</b><span class="muted small">+ toll &amp; permit</span></div>
          <div class="rx-act" role="cell">
            <button type="button" class="btn btn-sm" (click)="book(r)">Book</button>
            <button type="button" class="rx-wa" (click)="share(r)" [attr.aria-label]="'Send ' + r.from.name + ' to ' + r.to.name + ' quote on WhatsApp'" title="Send on WhatsApp">
              <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.7 1.9 6.7L4 29l7.5-1.9A13 13 0 0 0 16 27c6.6 0 12-5.4 12-12S22.6 3 16 3Zm6 15.1c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.3-.4.2-.7.1-2-.8-3.2-2.6-3.4-3-.2-.3 0-.4.2-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6c0-.2-.7-1.8-1-2.5-.2-.6-.5-.6-.7-.6h-.6c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3.1c.1.2 2 3.3 5 4.6.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.1-1.4Z"/></svg></button>
          </div>
        </div>
      } @empty { <p class="rx-empty">No routes match “{{ q() }}”. Try another name or <a routerLink="/drop-taxi">browse all routes</a>.</p> }
    </div>
    @if (hidden() > 0) { <div class="rx-more"><button type="button" class="btn btn-ghost-dark" (click)="showAll.set(true)">Show {{ hidden() }} more routes from {{ cityName() }}</button></div> }
    @if (shareFor(); as s) {
      <div class="rx-share"><b>Send quote: {{ s.name }}</b><app-wa-choose [to]="wa" [text]="s.text" label="Send" /><button type="button" class="link-btn" (click)="shareFor.set(null)">Close</button></div>
    }
    <p class="rx-foot muted small">Fares are one-way estimates for the selected cab (km × rate + driver batta, minimum 130 km billing). Toll, state permit/border charges and parking are extra at actuals.
      <a [routerLink]="['/one-way-taxi', city()]">All {{ cityName() }} drop taxi routes →</a></p>
  </div>`
})
export class RouteExplorerComponent implements OnInit {
  @Input() set initialCity(c: string) { if (CITY_MAP.has(c) && routesFrom(c).length) this.city.set(c); }
  @Input() tabs = true;
  hubs = HUBS.filter((h) => routesFrom(h.slug).length > 0);
  vehicles = VEHICLES; inr = inr; wa = SITE.whatsapp;
  city = signal('chennai'); vehicle = signal<VehicleId>('SEDAN'); q = signal(''); sort = signal<'km' | 'price' | 'name'>('km');
  shareFor = signal<{ name: string; text: string } | null>(null); showAll = signal(false);
  cityName = computed(() => CITY_MAP.get(this.city())?.name ?? '');
  private prefill = inject(BookingPrefill);

  rows = computed(() => {
    const q = this.q().trim().toLowerCase();
    const list = routesFrom(this.city()).filter((r) => !q || r.to.name.toLowerCase().includes(q));
    const s = this.sort(), v = this.vehicle();
    const sorted = [...list].sort((a, b) => s === 'name' ? a.to.name.localeCompare(b.to.name) : s === 'price' ? this.price(a.km) - this.price(b.km) || a.km - b.km : a.km - b.km);
    return this.showAll() || q ? sorted : sorted.slice(0, 10);
  });
  hidden = computed(() => { if (this.showAll() || this.q()) return 0; return Math.max(0, routesFrom(this.city()).length - 10); });
  ngOnInit(): void { if (!this.hubs.some((h) => h.slug === this.city())) this.city.set(this.hubs[0]?.slug ?? 'chennai'); void ROUTES; }
  setCity(s: string): void { this.city.set(s); this.q.set(''); this.showAll.set(false); this.shareFor.set(null); }
  rate = (v: VehicleId) => rateOf(v).oneway;
  billable = (km: number) => Math.max(km, FARES.minOneWayKm);
  price = (km: number) => fareFor(this.vehicle(), km).total;
  dur = (km: number) => durationText(km);
  book(r: Route): void { this.prefill.open(r.from.slug, r.to.slug, this.vehicle()); }
  share(r: Route): void {
    const req = { service: 'one_way' as const, pickup: placeOfCity(r.from), drop: placeOfCity(r.to), stops: [], date: new Date().toISOString().slice(0, 10), time: '09:00', passengers: 2, includeToll: false,
      contact: { name: 'Customer', countryCode: '+91', phone: '0000000000', waCountryCode: '+91', whatsapp: '0000000000' } };
    const q = buildQuote(req, { km: r.km, durationText: durationText(r.km), toll: null, source: 'estimate' }, FARES);
    const s = summarise(q, this.vehicle());
    const text = messageToBusiness({ ...s, kind: 'enquiry', customer: { ...s.customer, name: '(please add your name)', phoneDisplay: '' } }).replace(/\n👤 \*Passenger:\*.*\n/, '\n');
    this.shareFor.set({ name: `${r.from.name} → ${r.to.name}`, text });
  }
}
