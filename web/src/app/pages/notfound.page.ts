import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-notfound',
  imports: [RouterLink],
  template: `<section class="wrap sec nf" data-not-found="true"><h1>Page not found</h1>
    <p>That page does not exist or may have moved.</p>
    <div class="nf-actions"><a class="btn btn-lg" routerLink="/">Go to home</a><a class="btn btn-ghost-dark btn-lg" routerLink="/drop-taxi">Browse routes</a><a class="btn btn-ghost-dark btn-lg" routerLink="/contact">Contact us</a></div></section>`
})
export class NotFoundPage {
  constructor() { inject(SeoService).set({ title: 'Page not found | Drop Taxi Now', description: 'Page not found.', path: '/404', noindex: true }); }
}
