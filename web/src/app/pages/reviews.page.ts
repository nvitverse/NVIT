import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../core/seo.service';
import { CrumbsComponent } from '../components/crumbs.component';
import { SITE } from '../site.config';

interface Review { name: string; rating: number; text: string; route?: string; date?: string }

@Component({
  selector: 'app-reviews',
  imports: [FormsModule, CrumbsComponent],
  template: `
  <app-crumbs [items]="crumbs" />
  <section class="wrap sec narrow"><h1>Customer reviews</h1>
    <p class="lead dark">Travelled with {{ site.brand }}? Tell us how it went. Reviews are checked by our team before they appear here.</p>
    @if (loaded() && !items().length) { <div class="card"><p class="muted">No reviews published yet. Be the first to share your experience.</p></div> }
    @for (r of items(); track $index) {
      <article class="card review"><div class="stars" [attr.aria-label]="r.rating + ' out of 5'">{{ stars(r.rating) }}</div><p>{{ r.text }}</p><p class="muted small"><b>{{ r.name }}</b>@if (r.route) { · {{ r.route }} }@if (r.date) { · {{ r.date }} }</p></article>
    }
    <h2>Write a review</h2>
    @if (done()) { <div class="card"><p class="ok">Thank you! Your review has been received and will appear after our team checks it.</p></div> }
    @else {
      <form class="card" (ngSubmit)="submit()" novalidate>
        <div class="grid2"><div class="field"><label for="rv1">Your name</label><input id="rv1" name="name" [(ngModel)]="name" autocomplete="name"></div>
          <div class="field"><label for="rv2">Rating</label><select id="rv2" name="rating" [(ngModel)]="rating"><option [ngValue]="5">★★★★★ Excellent</option><option [ngValue]="4">★★★★ Good</option><option [ngValue]="3">★★★ Average</option><option [ngValue]="2">★★ Poor</option><option [ngValue]="1">★ Very poor</option></select></div></div>
        <div class="field"><label for="rv3">Trip (optional)</label><input id="rv3" name="route" [(ngModel)]="route" placeholder="e.g. Chennai to Madurai"></div>
        <div class="field"><label for="rv4">Your review</label><textarea id="rv4" name="text" rows="4" [(ngModel)]="text" maxlength="600"></textarea></div>
        @if (err()) { <p class="err" role="alert">{{ err() }}</p> }
        <button class="btn btn-lg" type="submit" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Submit review' }}</button>
      </form>
    }
  </section>`
})
export class ReviewsPage implements OnInit {
  site = SITE; crumbs = [{ name: 'Home', path: '/' }, { name: 'Customer Reviews', path: '/reviews' }];
  items = signal<Review[]>([]); loaded = signal(false); busy = signal(false); err = signal(''); done = signal(false);
  name = ''; rating = 5; route = ''; text = '';
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  constructor() { inject(SeoService).set({ title: `Customer Reviews | ${SITE.brand}`, description: `Read and share customer reviews of ${SITE.brand} one way drop taxi and outstation cab trips.`, path: '/reviews', jsonLd: [SeoService.breadcrumb(this.crumbs)] }); }
  stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
  async ngOnInit(): Promise<void> {
    if (!this.browser) return;
    try { const r = await fetch('/api/reviews'); if ((r.headers.get('content-type') || '').includes('json')) this.items.set(((await r.json()) as { items: Review[] }).items); } catch { /* ignore */ }
    this.loaded.set(true);
  }
  async submit(): Promise<void> {
    this.err.set(''); this.busy.set(true);
    try {
      const r = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: this.name, rating: this.rating, route: this.route, text: this.text }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) this.err.set(j.error || 'Could not submit your review. Please try again.'); else this.done.set(true);
    } catch { this.err.set('The server is not reachable right now. Please try again later.'); }
    this.busy.set(false);
  }
}
