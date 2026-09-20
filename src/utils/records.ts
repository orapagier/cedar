/**
 * The shape of the shared record store, described once so the same list can
 * drive the sync payload, the size meter and the end-of-term archive.
 *
 * Everything the dormitory saves is pushed to `/api/state` as one JSON blob and
 * pulled back by every device, so the store has to stay small enough to send
 * over a phone connection. The dated log collections below are the ones that
 * grow without limit — a school year of roll calls — and so the ones the
 * archive tool trims. Roster-style collections (residents, rooms, the phone
 * vault register, medical sheets, settings) describe the dormitory as it stands
 * today; they do not grow with time and are never trimmed.
 */

/** A dated log collection: it grows every day the dormitory runs. */
export interface LogCollection {
  key: string;
  label: string;
  /** The field that dates a record, used for archiving and for the oldest-record read. */
  dateField: string;
}

export const LOG_COLLECTIONS: LogCollection[] = [
  { key: 'inspections', label: 'Room inspections', dateField: 'date' },
  { key: 'individualInspections', label: 'Individual inspection ratings', dateField: 'date' },
  { key: 'attendance', label: 'Worship roll calls', dateField: 'date' },
  { key: 'curfewRecords', label: 'Curfew checks', dateField: 'date' },
  { key: 'uniformLogs', label: 'Departure & uniform checks', dateField: 'date' },
  { key: 'studyLogs', label: 'Study hour checks', dateField: 'date' },
  { key: 'cleaningDuties', label: 'Cleaning duty days', dateField: 'date' },
  { key: 'lightsOutLogs', label: 'Lights-out checks', dateField: 'date' },
  { key: 'phoneDeposits', label: 'Phone deposit checks', dateField: 'date' },
  { key: 'phoneBorrows', label: 'Phone borrow slips', dateField: 'borrowedDate' },
  { key: 'violations', label: 'Violations', dateField: 'date' },
  { key: 'medicalSlips', label: 'Medical excuse slips', dateField: 'startDate' },
  { key: 'gatePasses', label: 'Gate passes', dateField: 'departureDate' },
  { key: 'unauthorizedExits', label: 'Off-campus without pass', dateField: 'date' },
  { key: 'badLanguageLogs', label: 'Foul language reports', dateField: 'date' },
  { key: 'neighborRoomLogs', label: 'Neighboring room visits', dateField: 'date' },
  { key: 'demeritClearances', label: 'Redemption records', dateField: 'completionDate' },
  { key: 'confiscatedItems', label: 'Confiscated items', dateField: 'confiscatedDate' },
];

/** Collections that describe the dormitory now, not what happened on a date. */
export const ROSTER_COLLECTIONS: LogCollection[] = [
  { key: 'users', label: 'Residents & staff', dateField: '' },
  { key: 'rooms', label: 'Rooms', dateField: '' },
  { key: 'cellphones', label: 'Phone vault register', dateField: '' },
  { key: 'studentMedicals', label: 'Medical sheets', dateField: '' },
];

const dateOf = (record: unknown, field: string): string => {
  const value = (record as Record<string, unknown>)?.[field];
  return typeof value === 'string' ? value : '';
};

/** Bytes a value takes on the wire, once serialised as JSON. */
export const byteSize = (value: unknown): number => {
  try {
    return new TextEncoder().encode(JSON.stringify(value) ?? '').length;
  } catch {
    return 0;
  }
};

/** "812 KB" — a byte count written the way the storage meter shows it. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export interface CollectionUsage {
  key: string;
  label: string;
  count: number;
  bytes: number;
  oldestDate: string | null;
  /** Records dated before the archive cutoff currently in view. */
  archivableCount: number;
}

export interface StoreUsage {
  totalBytes: number;
  totalRecords: number;
  /** The whole store measured against the budget one sync payload should stay under. */
  budgetBytes: number;
  oldestDate: string | null;
  /** Average bytes added per day since the oldest record, or null if too new to tell. */
  bytesPerDay: number | null;
  collections: CollectionUsage[];
  rosterBytes: number;
}

/**
 * How large one sync payload may get. The free Upstash/Vercel KV REST tier
 * rejects a request body over 1 MB, and every save sends the whole store in one
 * body — so 1 MB, not the 256 MB of free storage, is the wall this app hits.
 * The budget sits just under it, leaving room to notice and archive first.
 */
export const PAYLOAD_BUDGET_BYTES = 900 * 1024;

const daysBetween = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T12:00:00Z`).getTime();
  const to = new Date(`${toDate}T12:00:00Z`).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.round((to - from) / 86_400_000));
};

/** Measure the store: what it holds, how big it is, and how fast it is filling. */
export const measureStore = (
  state: Record<string, unknown>,
  today: string,
  cutoff: string,
): StoreUsage => {
  const collections = LOG_COLLECTIONS.map(({ key, label, dateField }) => {
    const records = Array.isArray(state[key]) ? (state[key] as unknown[]) : [];
    const dates = records.map(r => dateOf(r, dateField)).filter(Boolean).sort();
    return {
      key,
      label,
      count: records.length,
      bytes: byteSize(records),
      oldestDate: dates[0] ?? null,
      archivableCount: records.filter(r => {
        const d = dateOf(r, dateField);
        return d !== '' && d < cutoff;
      }).length,
    };
  });

  const rosterBytes = ROSTER_COLLECTIONS.reduce((sum, c) => sum + byteSize(state[c.key] ?? []), 0);
  const oldestDates = collections.map(c => c.oldestDate).filter((d): d is string => !!d).sort();
  const oldestDate = oldestDates[0] ?? null;
  const totalBytes = byteSize(state);
  const span = oldestDate ? daysBetween(oldestDate, today) : 0;

  return {
    totalBytes,
    totalRecords: collections.reduce((sum, c) => sum + c.count, 0),
    budgetBytes: PAYLOAD_BUDGET_BYTES,
    oldestDate,
    // Under a week of records is too short a run to project anything from.
    bytesPerDay: span >= 7 ? Math.round(totalBytes / span) : null,
    collections,
    rosterBytes,
  };
};

/**
 * Split a store's dated logs at a cutoff: everything dated before it is the
 * archive, everything on or after it stays live. Records with no usable date
 * always stay live — an archive should never quietly swallow them.
 */
export const splitAtCutoff = (
  state: Record<string, unknown>,
  cutoff: string,
): { archived: Record<string, unknown[]>; kept: Record<string, unknown[]>; archivedCount: number } => {
  const archived: Record<string, unknown[]> = {};
  const kept: Record<string, unknown[]> = {};
  let archivedCount = 0;

  LOG_COLLECTIONS.forEach(({ key, dateField }) => {
    const records = Array.isArray(state[key]) ? (state[key] as unknown[]) : [];
    const old: unknown[] = [];
    const current: unknown[] = [];
    records.forEach(record => {
      const date = dateOf(record, dateField);
      if (date !== '' && date < cutoff) old.push(record);
      else current.push(record);
    });
    archived[key] = old;
    kept[key] = current;
    archivedCount += old.length;
  });

  return { archived, kept, archivedCount };
};

/** Hand the browser a JSON file to save. */
export const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
