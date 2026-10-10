import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { FaqComponent } from '../components/faq.component';
import { GENERAL_FAQ, PAGES, StaticPage } from '../data/pages';
import { SITE } from '../site.config';

@Component({
  selector: 'app-static',
  imports: [CrumbsComponent, FaqComponent],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec narrow"><h1>{{ p.h1 }}</h1>
    @for (s of p.sections; track s.h) { <h2>{{ s.h }}</h2><p>{{ s.p }}</p> }
    @if (p.key === 'faq') { <app-faq [items]="faqs" /> }
    @if (p.key === 'contact') { <p><a class="btn btn-lg" [href]="'tel:' + site.phoneIntl">Call {{ site.phone }}</a> <a class="btn btn-wa btn-lg" [href]="'https://wa.me/' + site.whatsapp">WhatsApp</a></p> }
  </section>`
})
export class StaticPageComponent {
  site = SITE; faqs = GENERAL_FAQ; p: StaticPage; crumbs: { name: string; path: string }[];
  constructor() {
    const key = inject(ActivatedRoute).snapshot.data['key'];
    this.p = PAGES.find((x) => x.key === key)!;
    this.crumbs = [{ name: 'Home', path: '/' }, { name: this.p.h1, path: this.p.path }];
    inject(SeoService).set({ title: this.p.title, description: this.p.desc, path: this.p.path,
      jsonLd: [SeoService.breadcrumb(this.crumbs), ...(key === 'faq' ? [SeoService.faq(GENERAL_FAQ)] : [])] });
  }
}
