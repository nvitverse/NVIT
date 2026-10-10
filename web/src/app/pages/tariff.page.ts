import { Component, inject } from '@angular/core';
import { SeoService } from '../core/seo.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { BookingComponent } from '../components/booking.component';
import { VEHICLES, ROUTE_MAP, fareFor, inr } from '../data';
import { SITE } from '../site.config';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tariff',
  imports: [CrumbsComponent, BookingComponent, RouterLink],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec"><h1>Taxi tariff & fare calculation</h1>
    <p class="lead dark">Transparent per-km rates. One way trips are billed on one-way distance only.</p>
    <div class="table-wrap"><table><thead><tr><th>Cab</th><th>Seats</th><th>One way ₹/km</th><th>Round trip ₹/km</th><th>Driver allowance</th></tr></thead><tbody>
      @for (v of vehicles; track v.id) { <tr><td>{{ v.name }}</td><td>{{ v.seats }}</td><td>₹{{ v.onewayRate }}</td><td>₹{{ v.roundRate }}</td><td>₹{{ v.batta }}</td></tr> }
    </tbody></table></div>
    <h2>How fare is calculated</h2>
    <ul class="plain"><li><b>One way:</b> higher of actual km or {{ min }} km × per-km rate + driver allowance.</li>
      <li><b>Round trip:</b> higher of {{ rt }} km per day or 2 × one-way km, × round-trip rate + driver allowance per day.</li>
      <li><b>Extra at actuals:</b> toll, state permit, parking, hill-station charges.</li></ul>
    <h2>Sample fares (sedan, one way)</h2>
    <div class="table-wrap"><table><thead><tr><th>Route</th><th>Distance</th><th>Fare</th></tr></thead><tbody>
      @for (r of samples; track r.slug) { <tr><td><a [routerLink]="['/drop-taxi', r.slug]">{{ r.from.name }} → {{ r.to.name }}</a></td><td>{{ r.km }} km</td><td>{{ inr(fareFor(vehicles[0], r.km).total) }}</td></tr> }
    </tbody></table></div>
    <h2>Check your fare</h2><app-booking />
  </section>`
})
export class TariffPage {
  vehicles = VEHICLES; inr = inr; fareFor = fareFor; min = SITE.fare.minOneWayKm; rt = SITE.fare.roundMinKmPerDay;
  samples = ['chennai-to-bangalore', 'chennai-to-madurai', 'chennai-to-coimbatore', 'chennai-to-pondicherry', 'chennai-to-tirupati', 'chennai-to-trichy', 'chennai-to-vellore', 'bangalore-to-mysore'].map((s) => ROUTE_MAP.get(s)!).filter(Boolean);
  crumbs = [{ name: 'Home', path: '/' }, { name: 'Tariff', path: '/tariff' }];
  constructor() {
    inject(SeoService).set({ title: `Taxi Tariff & Per KM Rates | ${SITE.brand}`, description: `Per-km one way and round trip taxi rates with sample city-to-city fares. Call ${SITE.phone}.`, path: '/tariff', jsonLd: [SeoService.breadcrumb(this.crumbs)] });
  }
}
