import { Component, Input } from '@angular/core';

/** Simple inline SVG silhouettes (no image requests). */
@Component({
  selector: 'app-vehicle-icon',
  template: `
  <svg class="vicon" viewBox="0 0 120 56" role="img" [attr.aria-label]="type + ' car'" fill="none">
    @switch (type) {
      @case ('SEDAN') { <path d="M8 38c0-6 4-8 9-9l14-12c3-3 6-4 10-4h26c5 0 9 2 12 5l9 11c7 1 12 3 12 9v4H8v-4Z" fill="currentColor" opacity=".16"/><path d="M8 38c0-6 4-8 9-9l14-12c3-3 6-4 10-4h26c5 0 9 2 12 5l9 11c7 1 12 3 12 9v4H8v-4Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M36 29l8-9h22l9 9H36Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/> }
      @case ('SUV') { <path d="M8 40V30c0-4 3-6 7-7l8-11c2-2 4-3 7-3h42c4 0 7 2 9 5l7 9h9c4 0 7 3 7 7v10H8Z" fill="currentColor" opacity=".16"/><path d="M8 40V30c0-4 3-6 7-7l8-11c2-2 4-3 7-3h42c4 0 7 2 9 5l7 9h9c4 0 7 3 7 7v10H8Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 23l6-9h22v9H28ZM60 14h14l7 9H60V14Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/> }
      @default { <path d="M6 41V28c0-4 3-7 7-8l10-9c3-2 5-3 8-3h46c4 0 7 2 9 5l8 10c6 1 10 4 10 9v9H6Z" fill="currentColor" opacity=".16"/><path d="M6 41V28c0-4 3-7 7-8l10-9c3-2 5-3 8-3h46c4 0 7 2 9 5l8 10c6 1 10 4 10 9v9H6Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 20l5-7h18v7H30ZM57 13h14l7 7H57v-7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/> }
    }
    <circle cx="30" cy="42" r="7" fill="#fff" stroke="currentColor" stroke-width="2.4"/><circle cx="92" cy="42" r="7" fill="#fff" stroke="currentColor" stroke-width="2.4"/>
  </svg>`
})
export class VehicleIconComponent { @Input() type = 'SEDAN'; }
