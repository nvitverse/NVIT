import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { waBusinessAndroid } from '../core/whatsapp';
import { cleanDigits } from '../core/format';
import { WaChooseComponent } from '../components/wa-choose.component';
import { SITE } from '../site.config';

/** /whatsapp?to=<intl digits>&t=<message>&app=business — a landing page used by email buttons. */
@Component({
  selector: 'app-whatsapp-page',
  imports: [WaChooseComponent],
  template: `
  <section class="wrap sec narrow">
    <h1>Open WhatsApp</h1>
    <p class="lead dark">Choose the app you use. Your message is already filled in.</p>
    @if (to()) {
      <app-wa-choose [to]="to()" [text]="text()" label="Open chat" [stack]="true" />
      <h2>Message preview</h2>
      <pre class="msg">{{ text() }}</pre>
      <button type="button" class="btn btn-ghost" (click)="copy()">{{ copied() ? 'Copied ✓' : 'Copy message' }}</button>
      <p class="muted small">On a computer this opens WhatsApp Web / Desktop. On Android, the Business button opens WhatsApp Business directly (falls back to WhatsApp if it is not installed).</p>
    } @else { <p>This link is incomplete. Please call <a [href]="'tel:' + site.phoneIntl">{{ site.phone }}</a>.</p> }
  </section>`
})
export class WhatsappPage implements OnInit {
  site = SITE; to = signal(''); text = signal(''); copied = signal(false);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private q = inject(ActivatedRoute).snapshot.queryParamMap;
  constructor() { inject(SeoService).set({ title: `Open WhatsApp | ${SITE.brand}`, description: 'Open this chat in WhatsApp or WhatsApp Business.', path: '/whatsapp', noindex: true }); }
  ngOnInit(): void {
    const to = cleanDigits(this.q.get('to') ?? '').slice(0, 15);
    this.to.set(to.length >= 8 ? to : ''); this.text.set((this.q.get('t') ?? '').slice(0, 3500));
    if (this.browser && this.to() && this.q.get('app') === 'business' && /Android/i.test(navigator.userAgent)) setTimeout(() => (location.href = waBusinessAndroid(this.to(), this.text())), 500);
  }
  copy(): void { navigator.clipboard?.writeText(this.text()).then(() => this.copied.set(true)).catch(() => undefined); }
}
