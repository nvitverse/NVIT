import { Component, Input } from '@angular/core';
import { VEHICLES, fareFor, inr } from '../data';

@Component({
  selector: 'app-fleet',
  template: `
  <div class="fleet">
    @for (v of vehicles; track v.id) {
      <article class="card vcard">
        <h3>{{ v.name }}</h3>
        <p class="muted">{{ v.minNote }}</p>
        <ul class="plain"><li>{{ v.seats }} seats · {{ v.bags }} bags</li><li>{{ v.examples }}</li></ul>
        <p class="rate">₹{{ v.onewayRate }}<small>/km one way</small></p>
        @if (km) { <p class="from">{{ km }} km trip: <b>{{ inr(fareFor(v, km).total) }}</b></p> }
      </article>
    }
  </div>`
})
export class FleetComponent {
  @Input() km = 0;
  vehicles = VEHICLES;
  inr = inr;
  fareFor = fareFor;
}
