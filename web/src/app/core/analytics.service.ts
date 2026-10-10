import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

interface Cfg { gaId?: string; adsId?: string; labels?: { booking?: string; lead?: string; call?: string; whatsapp?: string } }
type Gtag = (...a: unknown[]) => void;
declare global { interface Window { dataLayer?: unknown[]; gtag?: Gtag } }

/**
 * Loads GA4 + Google Ads only when the server provides IDs (GA_MEASUREMENT_ID / GOOGLE_ADS_ID), after the page is idle.
 * Every event is also pushed to window.dataLayer so Google Tag Manager can be used instead.
 */
@Injectable({ providedIn: 'root' })
export class Analytics {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private router = inject(Router);
  private cfg: Cfg = {};
  private started = false;

  start(): void {
    if (!this.browser || this.started) return;
    this.started = true;
    window.dataLayer = window.dataLayer || [];
    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      if (a.href.startsWith('tel:')) this.track('call_click', { href: a.getAttribute('href') });
      else if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(a.href)) this.track('whatsapp_click', { channel: 'link' });
    }, { capture: true });
    // Load the tag on the first interaction (or after 6 s) so it never competes with first paint.
    let go = false;
    const run = () => { if (go) return; go = true; ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((t) => window.removeEventListener(t, run)); void this.load(); };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((t) => window.addEventListener(t, run, { passive: true, once: true }));
    setTimeout(run, 6000);
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch('/api/config');
      if (!(res.headers.get('content-type') || '').includes('json')) return;
      this.cfg = (await res.json()) as Cfg;
    } catch { return; }
    const id = this.cfg.gaId || this.cfg.adsId;
    if (!id) return;
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`; document.head.appendChild(s);
    window.gtag = function () { (window.dataLayer = window.dataLayer || []).push(arguments); } as Gtag;
    window.gtag('js', new Date());
    if (this.cfg.gaId) window.gtag('config', this.cfg.gaId, { send_page_view: false });
    if (this.cfg.adsId) window.gtag('config', this.cfg.adsId);
    this.pageView();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.pageView());
  }
  private pageView(): void { window.gtag?.('event', 'page_view', { page_path: location.pathname + location.search, page_title: document.title }); }

  /** Records an event (dataLayer + gtag) and fires the matching Google Ads conversion when a label is configured. */
  track(event: string, params: Record<string, unknown> = {}): void {
    if (!this.browser) return;
    (window.dataLayer = window.dataLayer || []).push({ event, ...params });
    window.gtag?.('event', event, params);
    const l = this.cfg.labels, ads = this.cfg.adsId;
    const label = event === 'booking_confirmed' ? l?.booking : event === 'fare_check' ? l?.lead : event === 'call_click' ? l?.call : event === 'whatsapp_click' ? l?.whatsapp : undefined;
    if (ads && label) window.gtag?.('event', 'conversion', { send_to: `${ads}/${label}`, value: params['value'] ?? undefined, currency: params['value'] ? 'INR' : undefined });
  }
}
