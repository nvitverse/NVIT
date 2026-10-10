export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-12-20" -> "Sun, 20 Dec 2026" (timezone-independent). */
export function dateLabel(iso?: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${DAYS[d.getUTCDay()]}, ${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}
/** "09:30" -> "09:30 AM", "21:05" -> "09:05 PM" */
export function timeLabel(t?: string): string {
  if (!t) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  let h = +m[1]; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m[2]} ${ap}`;
}
export const cleanDigits = (s: string) => (s || '').replace(/\D/g, '');
/** Full international digits, e.g. ("+91","9876543210") -> "919876543210" */
export const intlDigits = (cc: string, national: string) => cleanDigits(cc) + cleanDigits(national).replace(/^0+/, '');
