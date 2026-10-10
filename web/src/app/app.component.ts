import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SITE } from './site.config';
import { HUBS, ROUTE_MAP } from './data';
import { WaChooseComponent } from './components/wa-choose.component';
import { generalMessage } from './core/whatsapp';
import { Analytics } from './core/analytics.service';

const FOOT_ROUTES = ['chennai-to-bangalore', 'chennai-to-pondicherry', 'chennai-to-coimbatore', 'chennai-to-tiruvannamalai', 'bangalore-to-chennai', 'coimbatore-to-ooty', 'madurai-to-kanyakumari', 'trichy-to-chennai', 'salem-to-bangalore', 'chennai-to-madurai', 'kochi-to-trivandrum'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, WaChooseComponent],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <div class="topbar"><div class="wrap topbar-in">
      <span>🚖 One way drop taxi across South India · 24/7 booking</span>
      <span class="topbar-links"><a [href]="'tel:' + site.phoneIntl">📞 {{ site.phone }}</a><a [href]="'https://wa.me/' + site.whatsapp">WhatsApp</a></span>
    </div></div>
    <header class="hdr">
      <div class="wrap hdr-in">
        <a routerLink="/" class="logo"><img class="logo-img" src="/favicon.svg" width="38" height="38" alt="" aria-hidden="true"><span class="logo-text">Drop Taxi <b>Now</b></span></a>
        <nav class="nav" aria-label="Main">
          <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/one-way-taxi" routerLinkActive="on">One Way Taxi</a>
          <a routerLink="/drop-taxi" routerLinkActive="on">Routes</a>
          <a routerLink="/outstation-taxi" routerLinkActive="on">Outstation</a>
          <a routerLink="/airport-taxi" routerLinkActive="on">Airport</a>
          <a routerLink="/tariff" routerLinkActive="on">Tariff</a>
          <a routerLink="/contact" routerLinkActive="on">Contact</a>
        </nav>
        <a class="btn btn-sm hide-sm" routerLink="/" fragment="book">Book a Taxi</a>
      </div>
    </header>
    <main id="main"><router-outlet /></main>

    <footer class="ftr">
      <div class="wrap ftr-grid">
        <div class="ftr-brand">
          <a routerLink="/" class="logo light"><img class="logo-img" src="/favicon.svg" width="38" height="38" alt="" aria-hidden="true"><span class="logo-text">Drop Taxi <b>Now</b></span></a>
          <p>{{ site.tagline }}. Fare shown before you book, with the km limit and extra-km rate.</p>
          <ul class="ftr-contact">
            <li><span aria-hidden="true">📞</span><a [href]="'tel:' + site.phoneIntl">{{ site.phone }}</a> <small>24/7</small></li>
            <li><span aria-hidden="true">💬</span><a [href]="'https://wa.me/' + site.whatsapp">WhatsApp / WhatsApp Business</a></li>
            @if (site.email) { <li><span aria-hidden="true">✉️</span><a [href]="'mailto:' + site.email">{{ site.email }}</a></li> }
            @if (site.address) { <li><span aria-hidden="true">📍</span>{{ site.address.street ? site.address.street + ', ' : '' }}{{ site.address.locality }}, {{ site.address.region }}</li> }
            <li><span aria-hidden="true">🗺️</span>Tamil Nadu · Kerala · Karnataka · Andhra Pradesh · Telangana · Puducherry</li>
          </ul>
        </div>
        <nav aria-label="Quick links"><h3>Quick Links</h3>
          <a routerLink="/">Home</a><a routerLink="/" fragment="book">Book a Taxi</a><a routerLink="/tariff">Tariff &amp; Rates</a><a routerLink="/drop-taxi">All Routes</a>
          <a routerLink="/reviews">Customer Reviews</a><a routerLink="/track-booking">Track Booking</a><a routerLink="/about">About Us</a><a routerLink="/faq">FAQs</a><a routerLink="/contact">Contact Us</a></nav>
        <nav aria-label="Services"><h3>Our Services</h3>
          <a routerLink="/services/one-way-taxi">One Way Drop Taxi</a><a routerLink="/services/round-trip-taxi">Round Trip</a><a routerLink="/services/outstation-taxi">Outstation &amp; Multi City</a>
          <a routerLink="/services/airport-transfer">Airport Transfers (24/7)</a><a routerLink="/services/local-rental">Hourly City Rentals</a><a routerLink="/attach-taxi">Attach Your Taxi / Driver Partner</a></nav>
        <nav aria-label="Popular routes"><h3>Popular Routes</h3>
          @for (r of routes; track r.slug) { <a [routerLink]="['/drop-taxi', r.slug]">{{ r.from.name }} → {{ r.to.name }}</a> }
          <a class="more" routerLink="/drop-taxi">View all {{ routeCount }} routes →</a></nav>
      </div>
      <div class="wrap ftr-cities"><h3>One way taxi by city</h3>
        <p>@for (c of hubs; track c.slug) { <a [routerLink]="['/one-way-taxi', c.slug]">{{ c.name }}</a> }<a class="more" routerLink="/one-way-taxi">All cities →</a></p></div>
      <div class="wrap ftr-policies" aria-label="Policies">
        <a routerLink="/privacy-policy">Privacy Policy</a><a routerLink="/terms">Terms &amp; Conditions</a><a routerLink="/cancellation-policy">Cancellation</a><a routerLink="/refund-policy">Refund Policy</a>
        <a routerLink="/payment-policy">Payment Policy</a><a routerLink="/toll-permit">Toll &amp; State Permit</a><a routerLink="/luggage-policy">Luggage Policy</a><a routerLink="/pet-travel-policy">Pet Travel Policy</a><a routerLink="/sitemap">Sitemap</a>
      </div>
      <div class="wrap ftr-bot"><span>© {{ year }} {{ site.brand }}. All rights reserved.</span><span>Designed &amp; Developed by <b>{{ site.developer.name }}</b></span></div>
    </footer>

    <div class="sticky">
      <a class="btn" [href]="'tel:' + site.phoneIntl">Call now</a>
      <button type="button" class="btn btn-wa" (click)="waOpen.set(!waOpen())" [attr.aria-expanded]="waOpen()" aria-controls="wa-panel">WhatsApp</button>
    </div>
    <button type="button" class="wa-fab" (click)="waOpen.set(!waOpen())" aria-label="Chat on WhatsApp" [attr.aria-expanded]="waOpen()" aria-controls="wa-panel">
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.7 1.9 6.7L4 29l7.5-1.9A13 13 0 0 0 16 27c6.6 0 12-5.4 12-12S22.6 3 16 3Zm6 15.1c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.3-.4.2-.7.1-2-.8-3.2-2.6-3.4-3-.2-.3 0-.4.2-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6c0-.2-.7-1.8-1-2.5-.2-.6-.5-.6-.7-.6h-.6c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3.1c.1.2 2 3.3 5 4.6.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.1-1.4Z"/></svg></button>
    @if (waOpen()) {
      <div class="wa-panel" id="wa-panel" role="dialog" aria-label="Chat with us">
        <div class="wa-panel-h"><b>Drop Taxi Now</b><span>Typically replies in minutes</span><button type="button" (click)="waOpen.set(false)" aria-label="Close">✕</button></div>
        <p>Hi 👋 How can we help? Pick the app you use:</p>
        <app-wa-choose [to]="site.whatsapp" [text]="msg" label="Chat" [stack]="true" />
        <a class="btn btn-ghost btn-block" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a>
      </div>
    }
  `
})
export class AppComponent implements OnInit {
  private analytics = inject(Analytics);
  ngOnInit(): void { this.analytics.start(); }
  site = SITE;
  hubs = HUBS;
  routes = FOOT_ROUTES.map((s) => ROUTE_MAP.get(s)).filter((r) => !!r) as NonNullable<ReturnType<typeof ROUTE_MAP.get>>[];
  routeCount = ROUTE_MAP.size;
  year = new Date().getFullYear();
  waOpen = signal(false);
  msg = generalMessage();
}
