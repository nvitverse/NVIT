import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { BookingComponent } from '../components/booking.component';
import { CrumbsComponent } from '../components/crumbs.component';
import { SERVICES, ServiceInfo } from '../data/pages';
import { SITE } from '../site.config';
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
      <p><a routerLink="/drop-taxi">Browse popular routes</a> · <a routerLink="/tariff">View tariff</a></p></section>
  } @else { <app-notfound /> }`
})
export class ServicePage {
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
