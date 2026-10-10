import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { routeContent } from '../core/content';
import { BookingComponent } from '../components/booking.component';
import { FleetComponent } from '../components/fleet.component';
import { FaqComponent } from '../components/faq.component';
import { CrumbsComponent } from '../components/crumbs.component';
import { ROUTE_MAP, Route, VEHICLES, fareFor, inr, ROUTES } from '../data';
import { SITE } from '../site.config';
import { NotFoundPage } from './notfound.page';

@Component({
  selector: 'app-route',
  imports: [RouterLink, BookingComponent, FleetComponent, FaqComponent, CrumbsComponent, NotFoundPage],
  template: `
  @if (r) {
    <app-crumbs [items]="crumbs" />
    <section class="hero hero-sm"><div class="wrap hero-grid">
      <div>
        <h1>{{ r.from.name }} to {{ r.to.name }} Drop Taxi</h1>
        <p class="lead">{{ c.intro }}</p>
        <ul class="facts"><li><b>{{ r.km }} km</b> distance</li><li><b>~{{ c.dur }}</b> drive</li><li>from <b>{{ inr(c.s.total) }}</b></li></ul>
        <p><a class="btn btn-lg" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a></p>
      </div>
      <app-booking [from]="r.from.slug" [to]="r.to.slug" />
    </div></section>

    <section class="wrap sec"><h2>{{ r.from.name }} to {{ r.to.name }} taxi fare</h2>
      <div class="table-wrap"><table><thead><tr><th>Cab</th><th>Seats</th><th>One way fare</th></tr></thead><tbody>
        @for (v of vehicles; track v.id) { <tr><td>{{ v.name }}</td><td>{{ v.seats }}</td><td><b>{{ inr(fareFor(v, r.km).total) }}</b></td></tr> }
      </tbody></table></div>
      <p class="muted small">Based on {{ r.km }} km one-way distance and per-km rate plus driver allowance. Toll, state permit & parking extra at actuals.</p>
      <p>{{ c.tip }}</p>
      <p>{{ c.about }}</p></section>

    <section class="band"><div class="wrap sec"><h2>Choose a cab</h2><app-fleet [km]="r.km" /></div></section>

    <section class="wrap sec"><h2>Related routes</h2>
      <div class="links">
        @if (reverse) { <a [routerLink]="['/drop-taxi', reverse.slug]">{{ r.to.name }} to {{ r.from.name }}</a> }
        @for (x of c.related; track x.slug) { <a [routerLink]="['/drop-taxi', x.slug]">{{ x.from.name }} to {{ x.to.name }}</a> }
        <a [routerLink]="['/one-way-taxi', r.from.slug]">{{ r.from.name }} one way taxi</a>
        <a [routerLink]="['/one-way-taxi', r.to.slug]">{{ r.to.name }} one way taxi</a>
      </div></section>

    <section class="band"><div class="wrap sec"><h2>{{ r.from.name }} to {{ r.to.name }} FAQ</h2><app-faq [items]="c.faqs" /></div></section>
  } @else { <app-notfound /> }`
})
export class RoutePage {
  site = SITE; inr = inr; fareFor = fareFor; vehicles = VEHICLES;
  r?: Route; reverse?: Route; c!: ReturnType<typeof routeContent>;
  crumbs: { name: string; path: string }[] = [];

  constructor() {
    const slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
    this.r = ROUTE_MAP.get(slug);
    if (!this.r) return;
    const r = this.r;
    this.c = routeContent(r);
    this.reverse = ROUTES.find((x) => x.from === r.to && x.to === r.from);
    const path = `/drop-taxi/${r.slug}`;
    this.crumbs = [{ name: 'Home', path: '/' }, { name: 'Drop Taxi Routes', path: '/drop-taxi' }, { name: `${r.from.name} to ${r.to.name}`, path }];
    const offer = {
      '@context': 'https://schema.org', '@type': 'Service', name: `${r.from.name} to ${r.to.name} Drop Taxi`, provider: { '@id': SITE.url + '/#business' },
      areaServed: [r.from.name, r.to.name],
      offers: { '@type': 'Offer', priceCurrency: 'INR', price: this.c.s.total, url: SITE.url + path, description: `One way sedan, ${r.km} km, tolls extra` }
    };
    inject(SeoService).set({
      title: `${r.from.name} to ${r.to.name} Drop Taxi | ${r.km} km, from ${inr(this.c.s.total)} - ${SITE.brand}`,
      description: `${r.from.name} to ${r.to.name} one way taxi: ${r.km} km, about ${this.c.dur}. Sedan from ${inr(this.c.s.total)}, Innova from ${inr(this.c.i.total)}. Call ${SITE.phone}.`,
      path, jsonLd: [SeoService.breadcrumb(this.crumbs), SeoService.faq(this.c.faqs), offer]
    });
  }
}
