import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { AIRPORT_CITIES, CITIES, HUBS, routesFrom } from '../data';
import { PAGES, SERVICES } from '../data/pages';
import { SITE } from '../site.config';

@Component({
  selector: 'app-sitemap',
  imports: [RouterLink, CrumbsComponent],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec smap"><h1>Sitemap</h1>
    <p class="lead dark">Every page on {{ site.brand }}, organised in one place.</p>
    <div class="smap-grid">
      <div><h2>Main</h2><ul><li><a routerLink="/">Home</a></li><li><a routerLink="/" fragment="book">Book a Taxi</a></li><li><a routerLink="/tariff">Tariff &amp; Rates</a></li><li><a routerLink="/drop-taxi">All Routes</a></li><li><a routerLink="/one-way-taxi">One Way Taxi by City</a></li><li><a routerLink="/outstation-taxi">Outstation Taxi by City</a></li><li><a routerLink="/airport-taxi">Airport Taxi</a></li><li><a routerLink="/reviews">Customer Reviews</a></li><li><a routerLink="/track-booking">Track Booking</a></li><li><a routerLink="/attach-taxi">Attach Your Taxi</a></li></ul></div>
      <div><h2>Services</h2><ul>@for (s of services; track s.slug) { <li><a [routerLink]="['/services', s.slug]">{{ s.name }}</a></li> }</ul></div>
      <div><h2>Company &amp; Policies</h2><ul>@for (p of pages; track p.key) { <li><a [routerLink]="p.path">{{ p.h1 }}</a></li> }</ul></div>
    </div>
    <h2>Cities</h2>
    <div class="smap-grid">
      <div><h3>One way taxi</h3><ul class="cols">@for (c of cities; track c.slug) { <li><a [routerLink]="['/one-way-taxi', c.slug]">{{ c.name }}</a></li> }</ul></div>
      <div><h3>Outstation taxi</h3><ul class="cols">@for (c of cities; track c.slug) { <li><a [routerLink]="['/outstation-taxi', c.slug]">{{ c.name }}</a></li> }</ul></div>
      <div><h3>Airport taxi</h3><ul class="cols">@for (c of airports; track c.slug) { <li><a [routerLink]="['/airport-taxi', c.slug]">{{ c.name }}</a></li> }</ul></div>
    </div>
    <h2>Drop taxi routes</h2>
    @for (h of hubs; track h.slug) {
      <h3>From {{ h.name }}</h3>
      <p class="links">@for (r of routesFrom(h.slug); track r.slug) { <a [routerLink]="['/drop-taxi', r.slug]">{{ r.from.name }} to {{ r.to.name }}</a> }</p>
    }
  </section>`
})
export class SitemapPage {
  site = SITE; crumbs = [{ name: 'Home', path: '/' }, { name: 'Sitemap', path: '/sitemap' }];
  services = SERVICES; pages = PAGES; cities = CITIES; airports = AIRPORT_CITIES; hubs = HUBS; routesFrom = routesFrom;
  constructor() { inject(SeoService).set({ title: `Sitemap – All Pages | ${SITE.brand}`, description: `All ${SITE.brand} pages: services, cities, airports, routes and policies.`, path: '/sitemap', jsonLd: [SeoService.breadcrumb(this.crumbs)] }); }
}
