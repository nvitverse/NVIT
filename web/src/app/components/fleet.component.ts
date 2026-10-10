import { Component, Input } from '@angular/core';
import { VEHICLES, fareFor, inr, rateOf } from '../data';
import { VehicleIconComponent } from './vehicle-icon.component';

@Component({
  selector: 'app-fleet',
  imports: [VehicleIconComponent],
  template: `
  <div class="fleet">
    @for (v of vehicles; track v.id) {
      <article class="card vcard">
        <app-vehicle-icon [type]="v.id" />
        <span class="vtag">{{ v.tag }}</span>
        <h3>{{ v.name }}</h3>
        <p class="muted small">{{ v.models }}</p>
        <ul class="plain small"><li>{{ v.seatsLabel }} seats · {{ v.bags }} bags · AC</li><li>{{ v.blurb }}</li></ul>
        <p class="rate">₹{{ rateOf(v.id).oneway }}<small>/km one way</small></p>
        @if (km) { <p class="from">{{ km }} km trip: <b>{{ inr(fareFor(v.id, km).total) }}</b></p> }
      </article>
    }
  </div>`
})
export class FleetComponent {
  @Input() km = 0;
  vehicles = VEHICLES;
  inr = inr;
  fareFor = fareFor;
  rateOf = rateOf;
}
