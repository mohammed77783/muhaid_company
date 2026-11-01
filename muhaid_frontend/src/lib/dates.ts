import type { CalendarDate, IsoDateTime } from '../types/api';
import { localeFor, type Lang } from './i18n/types';

// Two formats, never interchangeable (API.md › Dates and times):
// - Calendar dates ("YYYY-MM-DD") stay strings. new Date('2026-10-31') is UTC midnight
//   and shows as the previous day west of UTC, so they are compared as strings and only
//   ever turned into a Date from their numeric parts.
// - Date-times are sent with toISOString() and shown in the device's timezone.

const pad = (n: number): string => String(n).padStart(2, '0');

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function calendarParts(date: CalendarDate): [number, number, number] | null {
  const m = CALENDAR_DATE.exec(date);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** The local calendar date of a Date, e.g. "2026-10-31". */
export function toCalendarDate(d: Date): CalendarDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayCalendarDate(): CalendarDate {
  return toCalendarDate(new Date());
}

/** "YYYY-MM-DD" and a real day (rejects 2026-02-30). */
export function isCalendarDate(value: string): boolean {
  const parts = calendarParts(value);
  if (!parts) return false;
  const [y, m, d] = parts;
  const check = new Date(Date.UTC(y, m - 1, d));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === m - 1 &&
    check.getUTCDate() === d
  );
}

/** A calendar date written out for prose: «٣١ أكتوبر ٢٠٢٦» / "31 Oct 2026". */
export function formatDateLong(date: CalendarDate, lang: Lang): string {
  const parts = calendarParts(date);
  if (!parts) return date;
  const [y, m, d] = parts;
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** A server timestamp for a field, table or comparison: local "2026-10-31 12:15". */
export function formatDateTime(iso: IsoDateTime): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${toCalendarDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local midnight at the start of a calendar date, as an ISO string ending in Z. */
export function startOfDayIso(date: CalendarDate): IsoDateTime {
  const [y, m, d] = calendarParts(date) ?? [1970, 1, 1];
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

/** The last millisecond of a calendar date, local time, as an ISO string. */
export function endOfDayIso(date: CalendarDate): IsoDateTime {
  const [y, m, d] = calendarParts(date) ?? [1970, 1, 1];
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/** The calendar day before, e.g. "2026-03-01" → "2026-02-28". */
export function previousDay(date: CalendarDate): CalendarDate {
  const [y, m, d] = calendarParts(date) ?? [1970, 1, 2];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/**
 * Today in UTC. The server dates a submit by filledAt in the database's timezone (UTC unless
 * configured otherwise), so this is the day to check validity against. Near local midnight
 * it can differ from the day the inspector sees, so the check is a hint: the server decides.
 */
export function utcCalendarDate(): CalendarDate {
  return new Date().toISOString().slice(0, 10);
}

/** Same rule as the server: validFrom <= day <= validTo, and a null validTo has no end. */
export function isValidOn(
  template: { validFrom: CalendarDate; validTo: CalendarDate | null },
  day: CalendarDate,
): boolean {
  return (
    template.validFrom <= day &&
    (template.validTo === null || template.validTo >= day)
  );
}

export type TemplateStatus = 'upcoming' | 'active' | 'ended';

/** Valid from validFrom to validTo inclusive; a null validTo has no end. */
export function templateStatus(
  validFrom: CalendarDate,
  validTo: CalendarDate | null,
  today: CalendarDate = todayCalendarDate(),
): TemplateStatus {
  if (today < validFrom) return 'upcoming';
  if (validTo !== null && today > validTo) return 'ended';
  return 'active';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A span in its largest whole unit: «٣ ساعات» / "3 hours". Under a minute is 0 minutes. */
export function formatDuration(ms: number, lang: Lang): string {
  const abs = Math.abs(ms);
  const [value, unit] =
    abs >= DAY
      ? [Math.floor(abs / DAY), 'day']
      : abs >= HOUR
        ? [Math.floor(abs / HOUR), 'hour']
        : [Math.floor(abs / MINUTE), 'minute'];
  return new Intl.NumberFormat(localeFor(lang), {
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(value);
}

/** "2 hours ago" / «قبل ساعتين», for "forms last updated …". */
export function formatRelativeTime(
  timestamp: number,
  lang: Lang,
  now: number = Date.now(),
): string {
  const diff = timestamp - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: 'auto' });
  if (abs < MINUTE) return rtf.format(0, 'minute');
  if (abs < HOUR) return rtf.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), 'hour');
  return rtf.format(Math.round(diff / DAY), 'day');
}
