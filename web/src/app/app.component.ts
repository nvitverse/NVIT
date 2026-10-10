import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SITE } from './site.config';
import { HUBS } from './data';
import { WaChooseComponent } from './components/wa-choose.component';
import { generalMessage } from './core/whatsapp';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, WaChooseComponent],
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
          <a routerLink="/attach-taxi" routerLinkActive="on">Attach Taxi</a>
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
          <p class="ftr-contact"><a [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a> <a [href]="'https://wa.me/' + site.whatsapp">WhatsApp us</a></p>
        </div>
        <div><h3>Services</h3>
          <a routerLink="/services/one-way-taxi">One way taxi</a><a routerLink="/services/drop-taxi">Drop taxi</a>
          <a routerLink="/services/outstation-taxi">Outstation</a><a routerLink="/services/round-trip-taxi">Round trip</a>
          <a routerLink="/services/airport-transfer">Airport transfer</a><a routerLink="/services/local-rental">Local rental</a></div>
        <div><h3>Cities</h3>
          @for (c of hubs; track c.slug) { <a [routerLink]="['/one-way-taxi', c.slug]">{{ c.name }} one way taxi</a> }</div>
        <div><h3>Company</h3>
          <a routerLink="/about">About</a><a routerLink="/tariff">Tariff</a><a routerLink="/attach-taxi">Attach your taxi</a><a routerLink="/faq">FAQ</a><a routerLink="/contact">Contact</a>
          <a routerLink="/terms">Terms</a><a routerLink="/privacy-policy">Privacy</a><a routerLink="/cancellation-policy">Cancellation</a><a routerLink="/sitemap">Sitemap</a></div>
      </div>
      <div class="wrap ftr-bot">© {{ year }} {{ site.brand }} · Toll, permit & parking extra at actuals.</div>
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
export class AppComponent {
  site = SITE;
  hubs = HUBS;
  year = new Date().getFullYear();
  waOpen = signal(false);
  msg = generalMessage();
}
