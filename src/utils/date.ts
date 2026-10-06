export const MANILA_TIME_ZONE = 'Asia/Manila';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

type Field = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

// Built from parts rather than a locale string: locales resolve their own
// ordering/separators, so only the parts are reliable across browsers.
const manilaParts = (date: Date): Record<Field, string> => {
  const parts = {} as Record<Field, string>;
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type as Field] = part.value;
  }
  return parts;
};

/** Today's date in Asia/Manila as YYYY-MM-DD, regardless of device timezone. */
export const manilaToday = (date: Date = new Date()) => {
  const { year, month, day } = manilaParts(date);
  return `${year}-${month}-${day}`;
};

/** Clock time in Asia/Manila as hh:mm AM/PM. */
export const manilaTime = (date: Date = new Date()) => timeFormatter.format(date);

/**
 * Clock time in Asia/Manila as a 24-hour "HH:MM" value — the same shape the
 * schedule settings store, so the two compare directly as strings.
 */
export const manilaTimeValue = (date: Date = new Date()) => {
  const { hour, minute } = manilaParts(date);
  return `${String(Number(hour) % 24).padStart(2, '0')}:${minute}`;
};

/** Hour of day (0-23) in Asia/Manila. */
export const manilaHour = (date: Date = new Date()) => Number(manilaParts(date).hour) % 24;

/** Milliseconds until the next Manila midnight, so views can roll over on their own. */
export const msUntilNextManilaDay = (date: Date = new Date()) => {
  const { hour, minute, second } = manilaParts(date);
  const elapsed =
    ((Number(hour) % 24) * 3600 + Number(minute) * 60 + Number(second)) * 1000 + date.getMilliseconds();
  return 86_400_000 - elapsed;
};

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  weekday: 'long',
});

// A "YYYY-MM-DD" is a calendar day, not an instant: anchoring it at noon UTC
// keeps it on the same day once the formatters shift it into Manila (+08:00).
const asDate = (value: string | Date) => (typeof value === 'string' ? new Date(`${value}T12:00:00Z`) : value);

/**
 * The one way dates are shown to users: "September 18, 2026 Friday".
 * Accepts a stored "YYYY-MM-DD" or a Date; unparseable input is passed through.
 */
export const formatFullDate = (value: string | Date = new Date()) => {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return `${longDateFormatter.format(date)} ${weekdayFormatter.format(date)}`;
};

/**
 * The clock time inside a stored time, as the 24-hour "HH:MM" the schedules
 * keep — whichever way it was written. Records save their times in 24h so they
 * sort and compare as strings, but the ones logged before that carried an
 * already-formatted "07:45 PM"; both read the same here, so a check filed by an
 * older build still orders correctly beside the rest.
 */
const clock24h = (value?: string): string | null => {
  if (!value) return null;
  const meridiem = value.match(/([AP])\.?M\.?$/i)?.[1]?.toUpperCase();
  const [h, m] = value.replace(/\s*[AP]\.?M\.?$/i, '').split(':');
  const hour = Number(h);
  if (m === undefined || Number.isNaN(hour)) return null;
  const on24 = meridiem ? (hour % 12) + (meridiem === 'P' ? 12 : 0) : hour;
  return `${String(on24 % 24).padStart(2, '0')}:${m}`;
};

/**
 * The 24-hour clock time a record carries, or undefined when it carries none —
 * what the record feed sorts a day's entries by.
 */
export const recordTime = (value?: string) => clock24h(value) ?? undefined;

/**
 * A stored "HH:mm" as a 12-hour clock label: "21:45" → "9:45 PM".
 * Times live in 24h so they sort and compare as strings; this is the
 * one way they are shown to users.
 */
export const formatTime12h = (value?: string, fallback = '—') => {
  const clock = clock24h(value);
  if (!clock) return value ? value : fallback;
  const [h, m] = clock.split(':');
  const hour = Number(h);
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

/**
 * The calendar date with no weekday: "September 18, 2026". For the places that
 * name the day and then say something about it, where the day of the week is
 * not the point.
 */
export const formatDateOnly = (value: string | Date = new Date()) => {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
  return longDateFormatter.format(date);
};

/**
 * The next occurrence of a weekday (0 = Sunday) on or after a stored date —
 * so a pass issued on the Sunday itself still returns that same Sunday.
 */
export const nextWeekdayOnOrAfter = (date: string, weekday: number) => {
  const start = asDate(date);
  if (Number.isNaN(start.getTime())) return date;
  const ahead = (weekday - start.getUTCDay() + 7) % 7;
  return manilaToday(new Date(start.getTime() + ahead * 86_400_000));
};
