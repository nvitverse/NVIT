import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../core/seo.service';
import { BookingApi, BookingError } from '../core/booking-api.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { SITE } from '../site.config';

@Component({
  selector: 'app-attach',
  imports: [FormsModule, CrumbsComponent],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec narrow"><h1>Attach your taxi with {{ site.brand }}</h1>
    <p class="lead dark">Own a taxi or drive one? Share your details and our team will call you about attaching your vehicle for outstation and drop trips.</p>
    @if (ref()) { <div class="card"><h2>Request received</h2><p>Reference <b>{{ ref() }}</b>. We will call you shortly on {{ phone }}.</p></div> }
    @else {
    <form class="card" (ngSubmit)="submit()" novalidate>
      <div class="grid2"><div class="field"><label for="a1">Your name</label><input id="a1" name="name" [(ngModel)]="name" autocomplete="name"></div>
        <div class="field"><label for="a2">Mobile number</label><input id="a2" name="phone" [(ngModel)]="phone" inputmode="numeric" maxlength="10" autocomplete="tel-national"></div>
        <div class="field"><label for="a3">City</label><input id="a3" name="city" [(ngModel)]="city"></div>
        <div class="field"><label for="a4">Vehicle</label><select id="a4" name="vehicle" [(ngModel)]="vehicle"><option value="" disabled>Select vehicle</option><option>Sedan</option><option>SUV (Ertiga etc.)</option><option>Innova</option><option>Innova Crysta</option><option>Tempo Traveller</option><option>Other</option></select></div>
        <div class="field"><label for="a5">Vehicle number (optional)</label><input id="a5" name="vno" [(ngModel)]="vno"></div></div>
      <div class="field"><label for="a6">Message (optional)</label><textarea id="a6" name="msg" rows="3" [(ngModel)]="msg"></textarea></div>
      @if (err()) { <p class="err" role="alert">{{ err() }}</p> }
      <button class="btn btn-lg" type="submit" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Submit request' }}</button>
    </form> }
  </section>`
})
export class AttachPage {
  site = SITE; crumbs = [{ name: 'Home', path: '/' }, { name: 'Attach Taxi', path: '/attach-taxi' }];
  name = ''; phone = ''; city = ''; vehicle = ''; vno = ''; msg = '';
  busy = signal(false); err = signal(''); ref = signal('');
  private api = inject(BookingApi);
  constructor() { inject(SeoService).set({ title: `Attach Your Taxi | ${SITE.brand}`, description: `Attach your taxi or join as a driver partner with ${SITE.brand}. Call ${SITE.phone}.`, path: '/attach-taxi', jsonLd: [SeoService.breadcrumb(this.crumbs)] }); }
  async submit(): Promise<void> {
    this.err.set(''); this.busy.set(true);
    try { const r = await this.api.attach({ name: this.name, phone: this.phone, city: this.city, vehicle: this.vehicle, vehicleNo: this.vno, message: this.msg }); this.ref.set(r.ref); }
    catch (e) { this.err.set(e instanceof BookingError ? e.message : 'Could not submit. Please call us.'); }
    this.busy.set(false);
  }
}
