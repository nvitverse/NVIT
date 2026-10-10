import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { CITIES, HUBS, routesFrom } from '../data';
import { SERVICES } from '../data/pages';
import { SITE } from '../site.config';

@Component({
  selector: 'app-sitemap',
  imports: [RouterLink],
  template: `<section class="wrap sec"><h1>Sitemap</h1>
    <h2>Services</h2><div class="links">@for (s of services; track s.slug) { <a [routerLink]="['/services', s.slug]">{{ s.name }}</a> }</div>
    <h2>One way taxi by city</h2><div class="links">@for (c of cities; track c.slug) { <a [routerLink]="['/one-way-taxi', c.slug]">{{ c.name }}</a> }</div>
    <h2>Popular routes</h2><div class="links">@for (h of hubs; track h.slug) { @for (r of routesFrom(h.slug).slice(0, 8); track r.slug) { <a [routerLink]="['/drop-taxi', r.slug]">{{ r.from.name }} to {{ r.to.name }}</a> } }</div>
  </section>`
})
export class SitemapPage {
  services = SERVICES; cities = CITIES; hubs = HUBS; routesFrom = routesFrom;
  constructor() { inject(SeoService).set({ title: `Sitemap | ${SITE.brand}`, description: 'All pages on Drop Taxi Now.', path: '/sitemap' }); }
}
