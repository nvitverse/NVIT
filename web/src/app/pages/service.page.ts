import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { BookingComponent } from '../components/booking.component';
import { CrumbsComponent } from '../components/crumbs.component';
import { SERVICES, ServiceInfo } from '../data/pages';
import { SITE } from '../site.config';
import { FARES } from '../core/fares';
import { VEHICLES, inr } from '../data';
import { rateOf } from '../data';
import { NotFoundPage } from './notfound.page';

@Component({
  selector: 'app-service',
  imports: [RouterLink, BookingComponent, CrumbsComponent, NotFoundPage],
  template: `
  @if (s) {
    <app-crumbs [items]="crumbs" />
    <section class="hero hero-sm"><div class="wrap hero-grid">
      <div><h1>{{ s.h1 }}</h1><p class="lead">{{ s.desc }}</p>
        <ul class="ticks">@for (p of s.points; track p) { <li>{{ p }}</li> }</ul></div>
      <app-booking /></div></section>
    <section class="wrap sec">@for (p of s.body; track p) { <p>{{ p }}</p> }
      @if (s.slug === 'local-rental') {
        <h2>Local rental packages</h2>
        <div class="table-wrap"><table><thead><tr><th>Cab</th>@for (h of hours; track h) { <th>{{ h }} hrs / {{ h * kmh }} km</th> }<th>Extra</th></tr></thead><tbody>
          @for (v of vehicles; track v.id) { <tr><td>{{ v.name }}</td>@for (h of hours; track h) { <td><b>{{ inr(rateOf(v.id).hourly * h) }}</b></td> }<td class="small muted">{{ inr(rateOf(v.id).hourly) }}/hr · {{ inr(rateOf(v.id).oneway) }}/km</td></tr> }
        </tbody></table></div>
        <p class="muted small">Each package includes {{ kmh }} km per hour. Extra hours and extra km are charged as shown. Toll, parking and permits extra at actuals.</p>
      }
      <p><a routerLink="/drop-taxi">Browse popular routes</a> · <a routerLink="/tariff">View tariff</a></p></section>
  } @else { <app-notfound /> }`
})
export class ServicePage {
  hours = FARES.hourlyPackages; kmh = FARES.kmPerHour; vehicles = VEHICLES; inr = inr; rateOf = rateOf;
  s?: ServiceInfo; crumbs: { name: string; path: string }[] = [];
  constructor() {
    const slug = inject(ActivatedRoute).snapshot.paramMap.get('slug');
    this.s = SERVICES.find((x) => x.slug === slug);
    if (!this.s) return;
    const path = `/services/${this.s.slug}`;
    this.crumbs = [{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: this.s.name, path }];
    inject(SeoService).set({ title: `${this.s.name} | ${SITE.brand}`, description: `${this.s.desc} Call ${SITE.phone}.`, path, jsonLd: [SeoService.breadcrumb(this.crumbs)] });
  }
}
