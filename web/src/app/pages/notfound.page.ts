import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-notfound',
  imports: [RouterLink],
  template: `<section class="wrap sec nf" data-not-found="true"><h1>Page not found</h1>
    <p>That page does not exist. Try our <a routerLink="/drop-taxi">drop taxi routes</a> or <a routerLink="/">home page</a>.</p></section>`
})
export class NotFoundPage {
  constructor() { inject(SeoService).set({ title: 'Page not found | Drop Taxi Now', description: 'Page not found.', path: '/404', noindex: true }); }
}
