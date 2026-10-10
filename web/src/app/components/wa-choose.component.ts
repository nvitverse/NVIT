import { Component, Input, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { waBusinessAndroid, waBusinessIos, waLink } from '../core/whatsapp';

/** Two buttons: WhatsApp and WhatsApp Business. On Android/iOS the Business button targets the Business app directly. */
@Component({
  selector: 'app-wa-choose',
  template: `
  <div class="wa-choose" [class.stack]="stack">
    <a class="btn btn-wa" [href]="std()" target="_blank" rel="noopener" (click)="track('whatsapp')"><svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.7 1.9 6.7L4 29l7.5-1.9A13 13 0 0 0 16 27c6.6 0 12-5.4 12-12S22.6 3 16 3Zm6 15.1c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.3-.4.2-.7.1-2-.8-3.2-2.6-3.4-3-.2-.3 0-.4.2-.6l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6c0-.2-.7-1.8-1-2.5-.2-.6-.5-.6-.7-.6h-.6c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3.1c.1.2 2 3.3 5 4.6.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.1-1.4Z"/></svg> {{ label }} on WhatsApp</a>
    <a class="btn btn-wab" [href]="biz()" (click)="track('whatsapp_business')"><svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.7 1.9 6.7L4 29l7.5-1.9A13 13 0 0 0 16 27c6.6 0 12-5.4 12-12S22.6 3 16 3Z" opacity=".35"/><path d="M11 10h6.2a3 3 0 0 1 1.4 5.6 3.2 3.2 0 0 1-1.4 6H11V10Zm2.4 2.2v2.4h3.5a1.2 1.2 0 0 0 0-2.4h-3.5Zm0 4.6v2.6h3.8a1.3 1.3 0 0 0 0-2.6h-3.8Z"/></svg> {{ label }} on WhatsApp Business</a>
  </div>`
})
export class WaChooseComponent implements OnInit {
  @Input() to = ''; @Input() text = ''; @Input() label = 'Chat'; @Input() stack = false;
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private os = signal<'android' | 'ios' | 'other'>('other');
  ngOnInit(): void {
    if (!this.browser) return;
    const ua = navigator.userAgent;
    this.os.set(/Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'other');
  }
  std = () => waLink(this.to, this.text);
  biz = () => this.os() === 'android' ? waBusinessAndroid(this.to, this.text) : this.os() === 'ios' ? waBusinessIos(this.to, this.text) : waLink(this.to, this.text);
  track(kind: string): void {
    if (!this.browser) return;
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: 'whatsapp_click', channel: kind });
  }
}
