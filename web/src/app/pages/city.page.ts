import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { cityContent, QA } from '../core/content';
import { BookingComponent } from '../components/booking.component';
import { FleetComponent } from '../components/fleet.component';
import { FaqComponent } from '../components/faq.component';
import { RouteExplorerComponent } from '../components/route-explorer.component';
import { CrumbsComponent } from '../components/crumbs.component';
import { CITY_MAP, City, Route, inr, fareFor } from '../data';
import { SITE } from '../site.config';
import { NotFoundPage } from './notfound.page';

type Mode = 'oneway' | 'outstation' | 'airport';
const META: Record<Mode, { base: string; label: string }> = {
  oneway: { base: '/one-way-taxi', label: 'One Way Taxi' },
  outstation: { base: '/outstation-taxi', label: 'Outstation Taxi' },
  airport: { base: '/airport-taxi', label: 'Airport Taxi' }
};

@Component({
  selector: 'app-city',
  imports: [RouterLink, BookingComponent, FleetComponent, FaqComponent, CrumbsComponent, NotFoundPage, RouteExplorerComponent],
  template: `
  @if (city) {
    <app-crumbs [items]="crumbs" />
    <section class="hero hero-sm"><div class="wrap hero-grid">
      <div>
        <h1>{{ h1 }}</h1>
        <p class="lead">{{ intro }}</p>
        <p><a class="btn btn-lg" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a></p>
      </div>
      <app-booking [from]="city.slug" />
    </div></section>

    @if (hasRoutes) { <section class="band rx-band"><div class="wrap sec"><app-route-explorer [initialCity]="city.slug" [tabs]="false" /></div></section> }
    <section class="wrap sec"><h2>Popular routes from {{ city.name }}</h2>
      <div class="chips">@for (r of top; track r.slug) {
        <a class="card chip" [routerLink]="['/drop-taxi', r.slug]"><b>{{ r.from.name }} → {{ r.to.name }}</b><span class="muted">{{ r.km }} km</span><span class="price-sm">from {{ inr(fareFor('SEDAN', r.km).total) }}</span></a> }</div></section>

    <section class="band"><div class="wrap sec"><h2>Cabs available in {{ city.name }}</h2><app-fleet /></div></section>

    <section class="wrap sec"><h2>About {{ city.name }} travel</h2>
      <p>{{ city.name }}, {{ city.state }}{{ city.known ? ' is known for ' + city.known + '.' : '.' }}
      {{ city.airport.startsWith('Nearest') ? 'Airport access: ' + city.airport + '.' : 'Airport: ' + city.airport + '.' }}</p>
      <p>Our {{ modeLabel.toLowerCase() }} service in {{ city.name }} offers doorstep pickup, a fare shown before you book and booking support 24/7.</p>
    </section>
    <section class="band"><div class="wrap sec"><h2>{{ city.name }} taxi FAQ</h2><app-faq [items]="faqs" /></div></section>
  } @else { <app-notfound /> }`
})
export class CityPage {
  site = SITE; inr = inr; fareFor = fareFor;
  hasRoutes = false;
  city?: City; h1 = ''; intro = ''; modeLabel = ''; top: Route[] = []; faqs: QA[] = [];
  crumbs: { name: string; path: string }[] = [];
  private seo = inject(SeoService);

  constructor() {
    const route = inject(ActivatedRoute);
    const mode = route.snapshot.data['mode'] as Mode;
    const slug = route.snapshot.paramMap.get('slug') ?? '';
    const m = META[mode];
    this.modeLabel = m.label;
    this.city = CITY_MAP.get(slug);
    if (!this.city || (mode === 'airport' && this.city.airport.startsWith('Nearest'))) { this.city = undefined; return; }
    const c = this.city;
    const content = cityContent(c, mode);
    this.top = content.routes.slice(0, 12);
    this.hasRoutes = c.hub && content.routes.length > 0;
    this.faqs = content.faqs;
    this.h1 = mode === 'airport' ? `${c.name} Airport Taxi` : `${c.name} ${m.label}`;
    this.intro = mode === 'airport'
      ? `On-time pickup and drop at ${c.airport}. Share your flight time and we schedule the cab around it.`
      : `Book a ${mode === 'oneway' ? 'one way drop taxi' : 'outstation cab'} from ${c.name}. ${content.nearest ? `Nearest popular drop: ${content.nearest.to.name} (${content.nearest.km} km).` : ''} Pay only for the trip you take.`;
    const path = `${m.base}/${c.slug}`;
    this.crumbs = [{ name: 'Home', path: '/' }, { name: m.label, path: m.base }, { name: c.name, path }];
    this.seo.set({
      title: `${this.h1} | ${mode === 'airport' ? 'Pickup & Drop' : 'Drop Taxi Fare & Booking'} - ${SITE.brand}`,
      description: `${this.h1}: doorstep pickup, fare shown before booking, 24/7 support. Sedan, SUV, Innova & Tempo Traveller. Call ${SITE.phone}.`,
      path, jsonLd: [SeoService.breadcrumb(this.crumbs), SeoService.faq(this.faqs)]
    });
  }
}
