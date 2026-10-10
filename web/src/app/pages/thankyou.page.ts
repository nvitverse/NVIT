import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { TripSummary } from '../core/summary';
import { messageToBusiness } from '../core/whatsapp';
import { WaChooseComponent } from '../components/wa-choose.component';
import { SITE } from '../site.config';

@Component({
  selector: 'app-thankyou',
  imports: [RouterLink, WaChooseComponent],
  template: `
  <section class="wrap sec narrow thanks">
    <ol class="stepper stepper-done" aria-label="Booking progress"><li class="done"><span>✓</span> Details</li><li class="done"><span>✓</span> Estimate</li><li class="done"><span>✓</span> Confirm</li></ol>
    <div class="tick" aria-hidden="true">✓</div>
    <h1>Booking Confirmed!</h1>
    <p class="muted">Your booking has been placed. We will contact you shortly to confirm your driver and cab.</p>
    @if (s(); as s) {
      <p class="lead dark">Thank you, <b>{{ s.customer.name }}</b>. Your reference is <b class="ref">{{ s.ref }}</b>.</p>
      @if (emailed()) { <p class="ok">We have emailed your booking summary to {{ s.customer.email }}.</p> }
      @if (offline()) { <p class="note small">Preview mode: no email or lead was sent because the booking server is not running.</p> }
      <div class="card sum">
        <table>
          <tr><td>Service</td><td>{{ s.serviceLabel }}</td></tr>
          <tr><td>Pickup</td><td>{{ s.pickup }}</td></tr>
          @for (x of s.stops; track $index) { <tr><td>Stop {{ $index + 1 }}</td><td>{{ x }}</td></tr> }
          @if (s.drop) { <tr><td>Drop</td><td>{{ s.drop }}</td></tr> }
          <tr><td>Pickup</td><td>{{ s.dateText }} · {{ s.timeText }}</td></tr>
          @if (s.returnText) { <tr><td>Return</td><td>{{ s.returnText }}</td></tr> }
          <tr><td>Cab</td><td>{{ s.vehicleName }} ({{ s.vehicleModels }})</td></tr>
          <tr><td>Distance</td><td>{{ s.distanceText }}</td></tr>
          <tr class="tot"><td>Estimated fare</td><td>{{ s.totalText }}</td></tr>
        </table>
        <p class="small"><b>Km limit:</b> {{ s.kmPolicy }}</p>
        <p class="small muted">{{ s.extrasNote }}</p>
      </div>
      <h2>Message us on WhatsApp</h2>
      <p class="muted">Send your booking details so our team can confirm your driver and cab. Choose the app you use:</p>
      <app-wa-choose [to]="wa" [text]="msg()" label="Send booking" [stack]="true" />
      <p class="links-row"><a class="btn btn-lg" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a>
        @if (s.mapsUrl) { <a class="btn btn-ghost btn-lg" [href]="s.mapsUrl" target="_blank" rel="noopener">View route map</a> }</p>
    } @else {
      <p class="lead dark">@if (ref()) { Your reference is <b class="ref">{{ ref() }}</b>. } Our team will contact you shortly to confirm the cab and driver details.</p>
      <p><a class="btn btn-lg" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a></p>
    }
    <p class="muted small">Need to change something? <a routerLink="/contact">Contact us</a> · <a routerLink="/cancellation-policy">Cancellation policy</a> · <a routerLink="/">Book another trip</a></p>
  </section>`
})
export class ThankYouPage implements OnInit {
  site = SITE; wa = SITE.whatsapp;
  s = signal<TripSummary | null>(null); ref = signal(''); offline = signal(false); emailed = signal(false);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private route = inject(ActivatedRoute);
  constructor() { inject(SeoService).set({ title: `Booking confirmed | ${SITE.brand}`, description: 'Your taxi booking has been placed.', path: '/thank-you', noindex: true }); }
  msg = () => { const s = this.s(); return s ? messageToBusiness(s) : ''; };
  ngOnInit(): void {
    this.ref.set(this.route.snapshot.queryParamMap.get('ref') ?? '');
    if (!this.browser) return;
    try {
      const d = JSON.parse(sessionStorage.getItem('dtn:last') || 'null');
      if (d?.summary && (!this.ref() || d.bookingId === this.ref())) { this.s.set(d.summary); this.offline.set(!!d.offline); this.emailed.set(!!d.emailed); }
    } catch { /* ignore */ }
  }
}
