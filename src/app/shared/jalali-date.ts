// Persian/Jalali dates are UI-only; API exchanges ISO Gregorian dates.
// Conversion uses the platform's ICU Persian calendar, with UTC to avoid DST drift.
const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC'
});
const dayMs = 86_400_000;
export function normalizeDigits(input: string): string {
  return input.replace(/[۰-۹]/g, v => String(v.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, v => String(v.charCodeAt(0) - 1632));
}
export function toPersianDigits(input: string): string {
  return input.replace(/\d/g, d => String.fromCharCode(1776 + Number(d)));
}
function jalaliParts(epoch: number): [number, number, number] {
  const tokens = formatter.formatToParts(new Date(epoch));
  const get = (type: string) => Number(tokens.find(v => v.type === type)?.value ?? -1);
  return [get('year'), get('month'), get('day')];
}
function key(y: number, m: number, d: number): number { return y * 10000 + m * 100 + d; }
export function jalaliToIso(input: string): string | null {
  const raw = normalizeDigits(input.trim()).replace(/-/g, '/');
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw);
  if (!match) return null;
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
  if (y < 1250 || y > 1500 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const target = key(y,m,d);
  let lo = Math.floor(Date.UTC(y + 620, 0, 1) / dayMs);
  let hi = Math.floor(Date.UTC(y + 623, 0, 1) / dayMs);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const [jy, jm, jd] = jalaliParts(mid * dayMs);
    const value = key(jy,jm,jd);
    if (value === target) return new Date(mid * dayMs).toISOString().slice(0,10);
    if (value < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return null;
}
export function isoToJalali(input: string | null | undefined): string {
  if (!input) return '';
  const time = Date.parse(input.slice(0,10) + 'T00:00:00Z');
  if (!Number.isFinite(time)) return '';
  const [y, m, d] = jalaliParts(time);
  return toPersianDigits(`${y}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}`);
}
