import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { AIRPORT_CITIES, CITIES, HUBS, routesFrom } from '../data';
import { SERVICES } from '../data/pages';
import { SITE } from '../site.config';

@Component({
  selector: 'app-list',
  imports: [RouterLink, CrumbsComponent],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec"><h1>{{ h1 }}</h1><p class="lead dark">{{ intro }}</p>
    @switch (kind) {
      @case ('routes') { @for (h of hubs; track h.slug) { <h2>{{ h.name }} drop taxi routes</h2>
        <div class="links">@for (r of routesFrom(h.slug); track r.slug) { <a [routerLink]="['/drop-taxi', r.slug]">{{ r.from.name }} to {{ r.to.name }}</a> }</div> } }
      @case ('services') { <div class="chips">@for (s of services; track s.slug) { <a class="card chip" [routerLink]="['/services', s.slug]"><b>{{ s.name }}</b><span class="muted">{{ s.desc }}</span></a> }</div> }
      @default { <div class="links">@for (c of items; track c.slug) { <a [routerLink]="[base, c.slug]">{{ c.name }}</a> }</div> }
    }
  </section>`
})
export class ListPage {
  hubs = HUBS; services = SERVICES; routesFrom = routesFrom;
  kind: string; h1: string; intro: string; base: string; items = CITIES;
  crumbs: { name: string; path: string }[];

  constructor() {
    const d = inject(ActivatedRoute).snapshot.data;
    this.kind = d['kind']; this.base = d['base'];
    const cfg: Record<string, [string, string]> = {
      '/one-way-taxi': ['One way taxi by city', 'Choose your pickup city for one way drop taxi fares and booking.'],
      '/drop-taxi': ['Drop taxi routes', 'Browse city-to-city drop taxi routes with distance and fare.'],
      '/outstation-taxi': ['Outstation taxi by city', 'Outstation cabs for family trips, temples and business travel.'],
      '/airport-taxi': ['Airport taxi by city', 'Airport pickup and drop in major cities.'],
      '/services': ['Our taxi services', 'One way, drop, outstation, round trip, airport and local rental cabs.']
    };
    [this.h1, this.intro] = cfg[this.base];
    if (this.base === '/airport-taxi') this.items = AIRPORT_CITIES;
    this.crumbs = [{ name: 'Home', path: '/' }, { name: this.h1, path: this.base }];
    inject(SeoService).set({
      title: `${this.h1} | ${SITE.brand}`, description: `${this.intro} Call ${SITE.phone}.`, path: this.base,
      jsonLd: [SeoService.breadcrumb(this.crumbs)]
    });
  }
}
