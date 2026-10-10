import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { BookingComponent } from '../components/booking.component';
import { FleetComponent } from '../components/fleet.component';
import { FaqComponent } from '../components/faq.component';
import { CITIES, ROUTE_MAP, inr, fareFor } from '../data';
import { GENERAL_FAQ } from '../data/pages';
import { SITE } from '../site.config';

const POPULAR = ['chennai-to-bangalore', 'bangalore-to-chennai', 'chennai-to-madurai', 'chennai-to-coimbatore', 'chennai-to-pondicherry', 'chennai-to-tirupati', 'coimbatore-to-bangalore', 'madurai-to-chennai', 'chennai-to-trichy', 'chennai-to-salem', 'bangalore-to-mysore', 'chennai-to-vellore'];

@Component({
  selector: 'app-home',
  imports: [RouterLink, BookingComponent, FleetComponent, FaqComponent],
  template: `
  <section class="hero"><div class="wrap hero-grid">
    <div>
      <p class="eyebrow">One way · Outstation · Airport</p>
      <h1>One way drop taxi across South India</h1>
      <p class="lead">Pay only for the distance you travel. See the fare first, then confirm on call or WhatsApp.</p>
      <ul class="ticks"><li>No return fare on one-way trips</li><li>Fare shown before you book</li><li>Km limit and extra-km rate shown upfront</li><li>24/7 booking support on call and WhatsApp</li></ul>
      <p class="hero-cta"><a class="btn btn-lg" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a><a class="btn btn-ghost-light btn-lg" routerLink="/tariff">View tariff</a></p>
      <p class="coverage"><b>We serve:</b> Tamil Nadu · Kerala · Karnataka · Andhra Pradesh · Telangana · Puducherry</p>
    </div>
    <app-booking />
  </div></section>

  <section class="wrap sec"><h2>Pick the service that fits your trip</h2>
    <div class="svc-grid">
      @for (c of cats; track c.slug) { <a class="card svc" [routerLink]="['/services', c.slug]"><span class="svc-ico" aria-hidden="true">{{ c.icon }}</span><b>{{ c.name }}</b><span class="muted small">{{ c.text }}</span></a> }
    </div></section>

  <section class="wrap sec"><h2>Popular drop taxi routes</h2>
    <div class="chips">@for (r of popular; track r.slug) {
      <a class="card chip" [routerLink]="['/drop-taxi', r.slug]"><b>{{ r.from.name }} → {{ r.to.name }}</b><span class="muted">{{ r.km }} km</span><span class="price-sm">from {{ inr(r.price) }}</span></a> }</div>
    <p><a routerLink="/drop-taxi">See all routes →</a></p></section>

  <section class="band"><div class="wrap sec"><h2>Choose your cab</h2><app-fleet /></div></section>

  <section class="wrap sec"><h2>Why book with {{ site.brand }}</h2>
    <div class="why-grid">
      @for (w of why; track w.t) { <div class="why"><b>{{ w.t }}</b><p class="muted">{{ w.d }}</p></div> }
    </div></section>

  <section class="wrap sec"><h2>How it works</h2>
    <ol class="steps"><li><b>Enter trip</b> pickup, drop and date.</li><li><b>See fare</b> for every car instantly.</li><li><b>Confirm</b> on WhatsApp or call; get driver details before pickup.</li></ol></section>

  <section class="band"><div class="wrap sec"><h2>One way taxi by city</h2>
    <div class="links">@for (c of cities; track c.slug) { <a [routerLink]="['/one-way-taxi', c.slug]">{{ c.name }}</a> }</div></div></section>

  <section class="wrap sec"><h2>Frequently asked questions</h2><app-faq [items]="faqs" /></section>`
})
export class HomePage {
  site = SITE; cities = CITIES; inr = inr; faqs = GENERAL_FAQ;
  cats = [
    { slug: 'one-way-taxi', icon: '→', name: 'One way drop taxi', text: 'Pay only the one-way distance. No return fare.' },
    { slug: 'round-trip-taxi', icon: '⇄', name: 'Round trip', text: 'Same cab and driver for your whole trip.' },
    { slug: 'local-rental', icon: '⏱', name: 'Local rental', text: '5, 8, 10 or 12 hour city packages.' },
    { slug: 'outstation-taxi', icon: '⛓', name: 'Multi city / outstation', text: 'Add up to 10 stops on one trip.' },
    { slug: 'airport-transfer', icon: '✈', name: 'Airport transfer', text: 'On-time pickup and drop at major airports.' }
  ];
  why = [
    { t: 'Transparent per-km fares', d: 'See the fare for every cab before you book, with the km limit and extra-km rate shown clearly.' },
    { t: 'Driver and cab details in advance', d: 'We share your driver name, number and vehicle details on WhatsApp before pickup.' },
    { t: 'WhatsApp or WhatsApp Business', d: 'Chat with us on whichever app you use. Your trip details are filled in for you.' },
    { t: 'South India coverage', d: 'Drops across Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana and Puducherry.' }
  ];
  popular = POPULAR.map((s) => ROUTE_MAP.get(s)).filter((r) => !!r).map((r) => ({ ...r!, price: fareFor('SEDAN', r!.km).total }));
  constructor() {
    inject(SeoService).set({
      title: `One Way Drop Taxi in South India – Tamil Nadu, Kerala, Karnataka | ${SITE.brand}`,
      description: `Book one way drop taxi and outstation cabs from ${SITE.brand}. Pay only one-way fare, see the price instantly, 24/7 booking. Call ${SITE.phone}.`,
      path: '/', jsonLd: [SeoService.faq(GENERAL_FAQ)]
    });
  }
}
