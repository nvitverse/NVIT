import { Component, Input } from '@angular/core';
import { VEHICLE_META } from '../core/vehicles-meta';
import { VehicleId } from '../core/fare';

const FILE: Record<string, string> = { SEDAN: 'sedan', SUV: 'suv', INNOVA: 'innova', CRYSTA: 'crysta' };

/** Optimised cab photo: WebP in 3 sizes (160/320/640 px), fixed 5:3 box (no layout shift), lazy-loaded unless `eager`. */
@Component({
  selector: 'app-vehicle-img',
  template: `<img class="vimg" [src]="base + '-320.webp'" [attr.srcset]="srcset" [attr.sizes]="sizes" width="320" height="192" [alt]="alt"
    [attr.loading]="eager ? 'eager' : 'lazy'" [attr.fetchpriority]="eager ? 'high' : null" decoding="async">`
})
export class VehicleImgComponent {
  @Input() set type(t: string) { this.id = t; }
  @Input() sizes = '(max-width: 600px) 45vw, 260px';
  @Input() eager = false;
  id = 'SEDAN';
  get base(): string { return '/img/vehicles/' + (FILE[this.id] ?? 'sedan'); }
  get srcset(): string { return `${this.base}-160.webp 160w, ${this.base}-320.webp 320w, ${this.base}-640.webp 640w`; }
  get alt(): string { const m = VEHICLE_META[this.id as VehicleId]; return m ? `${m.name} taxi – ${m.models}` : 'Taxi'; }
}
