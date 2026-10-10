import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingApi, BookingError } from '../core/booking-api.service';
import { Place } from '../core/geo';
import { Suggestion, popularLocal, suggestLocal } from '../core/local-places';

let uid = 0;

/** Location picker restricted to South India. Local city list + (when enabled on the server) Google Places. */
@Component({
  selector: 'app-place-input',
  imports: [FormsModule],
  template: `
  <div class="pi" (focusout)="onBlur($event)">
    <label [for]="id">{{ label }}</label>
    <div class="pi-box">
      <input #inp [id]="id" type="text" autocomplete="off" role="combobox" aria-autocomplete="list" [attr.aria-expanded]="open()" [attr.aria-controls]="id + '-list'"
        [placeholder]="placeholder" [(ngModel)]="text" (ngModelChange)="onType($event)" (focus)="onFocus()" (keydown)="onKey($event)" [class.bad]="invalid">
      @if (locate) { <button type="button" class="pi-btn" (click)="useMyLocation()" [disabled]="locating()" title="Use my current location" aria-label="Use my current location">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/></svg></button> }
      @if (text && !locating()) { <button type="button" class="pi-btn pi-clear" (click)="clear()" aria-label="Clear">×</button> }
    </div>
    @if (open() && items().length) {
      <ul class="pi-list" role="listbox" [id]="id + '-list'">
        @for (s of items(); track s.id; let i = $index) {
          <li role="option" [class.on]="i === active()" [attr.aria-selected]="i === active()" (mousedown)="pick(s, $event)">
            <b>{{ s.main }}</b><span>{{ s.secondary }}</span></li>
        }
      </ul>
    }
    @if (msg()) { <p class="pi-msg" role="alert">{{ msg() }}</p> }
  </div>`
})
export class PlaceInputComponent {
  @Input() label = ''; @Input() placeholder = 'Type a city or place'; @Input() locate = false; @Input() invalid = false;
  @Input() set place(p: Place | null) { this._place = p; if (p && p.text !== this.text) this.text = p.text; if (!p && this._clearedExternally) this.text = ''; }
  get place(): Place | null { return this._place; }
  @Output() placeChange = new EventEmitter<Place | null>();
  @ViewChild('inp') inp?: ElementRef<HTMLInputElement>;

  id = 'pi-' + ++uid;
  text = '';
  items = signal<Suggestion[]>([]); open = signal(false); active = signal(-1); msg = signal(''); locating = signal(false);
  private _place: Place | null = null; private _clearedExternally = false;
  private api = inject(BookingApi);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;

  onFocus(): void {
    // keep the field (and its suggestion list) clear of the sticky header / bottom bar
    setTimeout(() => this.inp?.nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    if (!this._place && !this.text) { this.items.set(popularLocal()); this.open.set(true); this.active.set(-1); }
    else if (this.text && !this._place) this.onType(this.text);
  }
  onType(q: string): void {
    this.msg.set('');
    if (this._place && q !== this._place.text) { this._place = null; this.placeChange.emit(null); }
    clearTimeout(this.timer);
    const my = ++this.seq;
    if (!q.trim()) { this.items.set([]); this.open.set(false); return; }
    this.items.set(suggestLocal(q, 6)); this.open.set(true); this.active.set(0);
    this.timer = setTimeout(async () => {
      const res = await this.api.suggest(q, (l) => { if (my === this.seq) this.items.set(l); });
      if (my === this.seq) { this.items.set(res); this.open.set(res.length > 0); }
    }, 220);
  }
  onKey(e: KeyboardEvent): void {
    const n = this.items().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.open.set(true); this.active.set((this.active() + 1) % Math.max(1, n)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.set((this.active() - 1 + n) % Math.max(1, n)); }
    else if (e.key === 'Enter' && this.open() && this.items()[this.active()]) { e.preventDefault(); this.pick(this.items()[this.active()]); }
    else if (e.key === 'Escape') this.open.set(false);
  }
  onBlur(e: FocusEvent): void {
    if ((e.relatedTarget as HTMLElement | null)?.closest('.pi')) return;
    setTimeout(() => {
      this.open.set(false);
      if (!this._place && this.text.trim()) {
        const exact = suggestLocal(this.text, 1)[0];
        if (exact && exact.main.toLowerCase() === this.text.trim().toLowerCase().split(',')[0]) void this.pick(exact);
        else this.msg.set('Please choose a location from the suggestions.');
      }
    }, 120);
  }
  async pick(s: Suggestion, ev?: Event): Promise<void> {
    ev?.preventDefault();
    clearTimeout(this.timer); this.seq++; // cancel any pending suggestion fetch so the list does not reopen
    this.open.set(false); this.msg.set('');
    try {
      const p = await this.api.details(s);
      this._place = p; this.text = p.text; this.placeChange.emit(p);
    } catch (e) { this.msg.set(e instanceof BookingError ? e.message : 'Could not load that place.'); this.text = ''; }
  }
  clear(): void { clearTimeout(this.timer); this.seq++; this._place = null; this.text = ''; this.msg.set(''); this.items.set([]); this.open.set(false); this.placeChange.emit(null); this.inp?.nativeElement.focus(); }

  useMyLocation(): void {
    if (!navigator.geolocation) { this.msg.set('Location is not supported on this device.'); return; }
    this.locating.set(true); this.msg.set('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try { const p = await this.api.reverse(pos.coords.latitude, pos.coords.longitude); this._place = p; this.text = p.text; this.placeChange.emit(p); }
      catch (e) { this.msg.set(e instanceof BookingError ? e.message : 'Could not detect your location.'); }
      this.locating.set(false);
    }, (err) => { this.locating.set(false); this.msg.set(err.code === 1 ? 'Location permission denied. Please type your pickup.' : 'Could not detect your location.'); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }
}
