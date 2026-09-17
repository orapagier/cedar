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

/** Hour of day (0-23) in Asia/Manila. */
export const manilaHour = (date: Date = new Date()) => Number(manilaParts(date).hour) % 24;

/** Milliseconds until the next Manila midnight, so views can roll over on their own. */
export const msUntilNextManilaDay = (date: Date = new Date()) => {
  const { hour, minute, second } = manilaParts(date);
  const elapsed =
    ((Number(hour) % 24) * 3600 + Number(minute) * 60 + Number(second)) * 1000 + date.getMilliseconds();
  return 86_400_000 - elapsed;
};
