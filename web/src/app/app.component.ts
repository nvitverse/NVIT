import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SITE } from './site.config';
import { HUBS } from './data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <header class="hdr">
      <div class="wrap hdr-in">
        <a routerLink="/" class="logo" [attr.aria-label]="site.brand + ' home'"><span class="logo-mark">DT</span><span>Drop Taxi <b>Now</b></span></a>
        <nav class="nav" aria-label="Main">
          <a routerLink="/one-way-taxi" routerLinkActive="on">One Way Taxi</a>
          <a routerLink="/drop-taxi" routerLinkActive="on">Routes</a>
          <a routerLink="/outstation-taxi" routerLinkActive="on">Outstation</a>
          <a routerLink="/airport-taxi" routerLinkActive="on">Airport</a>
          <a routerLink="/tariff" routerLinkActive="on">Tariff</a>
          <a routerLink="/contact" routerLinkActive="on">Contact</a>
        </nav>
        <a class="btn btn-sm hide-sm" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a>
      </div>
    </header>
    <main id="main"><router-outlet /></main>
    <footer class="ftr">
      <div class="wrap ftr-grid">
        <div>
          <p class="logo light"><span class="logo-mark">DT</span><span>Drop Taxi <b>Now</b></span></p>
          <p>{{ site.tagline }}.</p>
          <p><a [href]="'tel:' + site.phoneIntl">{{ site.phone }}</a> · <a [href]="'https://wa.me/' + site.whatsapp">WhatsApp</a></p>
        </div>
        <div><h3>Services</h3>
          <a routerLink="/services/one-way-taxi">One way taxi</a><a routerLink="/services/drop-taxi">Drop taxi</a>
          <a routerLink="/services/outstation-taxi">Outstation</a><a routerLink="/services/round-trip-taxi">Round trip</a>
          <a routerLink="/services/airport-transfer">Airport transfer</a><a routerLink="/services/local-rental">Local rental</a></div>
        <div><h3>Cities</h3>
          @for (c of hubs; track c.slug) { <a [routerLink]="['/one-way-taxi', c.slug]">{{ c.name }} one way taxi</a> }</div>
        <div><h3>Company</h3>
          <a routerLink="/about">About</a><a routerLink="/tariff">Tariff</a><a routerLink="/faq">FAQ</a><a routerLink="/contact">Contact</a>
          <a routerLink="/terms">Terms</a><a routerLink="/privacy-policy">Privacy</a><a routerLink="/cancellation-policy">Cancellation</a><a routerLink="/sitemap">Sitemap</a></div>
      </div>
      <div class="wrap ftr-bot">© {{ year }} {{ site.brand }} · Toll, permit & parking extra at actuals.</div>
    </footer>
    <div class="sticky">
      <a class="btn" [href]="'tel:' + site.phoneIntl">Call now</a>
      <a class="btn btn-wa" [href]="'https://wa.me/' + site.whatsapp + '?text=' + wa" rel="noopener">WhatsApp</a>
    </div>
  `
})
export class AppComponent {
  site = SITE;
  hubs = HUBS;
  year = new Date().getFullYear();
  wa = encodeURIComponent('Hi, I need a drop taxi.');
}
