import { Component, Input } from '@angular/core';
import { QA } from '../core/content';

@Component({
  selector: 'app-faq',
  template: `<div class="faq">@for (x of items; track x.q) { <details><summary>{{ x.q }}</summary><p>{{ x.a }}</p></details> }</div>`
})
export class FaqComponent { @Input() items: QA[] = []; }
