import {
  CellphoneCustody,
  DormSettings,
  GatePassRecord,
  MedicalExcuseSlip,
  User,
} from '../types/dorm';

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// A stored "YYYY-MM-DD" is a calendar day, not an instant. Anchoring it at noon
// UTC keeps the weekday and any day arithmetic on that same calendar day.
const asUtcNoon = (date: string) => new Date(`${date}T12:00:00Z`);

/** Weekday of a stored date, 0 (Sunday) to 6 (Saturday). */
export const weekdayOf = (date: string) => asUtcNoon(date).getUTCDay();

/** A stored date shifted by whole days, returned in the same "YYYY-MM-DD" shape. */
export const shiftDate = (date: string, days: number) => {
  const shifted = new Date(asUtcNoon(date).getTime() + days * 86_400_000);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${month}-${day}`;
};

/**
 * The day the phones currently out were released — the start of the vault cycle
 * this moment belongs to. On release day itself the cycle only turns over once
 * the release time has passed.
 */
export const cycleStartDate = (date: string, time: string, settings: DormSettings) => {
  const sinceRelease = (weekdayOf(date) - settings.phoneReleaseDay + 7) % 7;
  const back = sinceRelease === 0 && time < settings.phoneReleaseTime ? 7 : sinceRelease;
  return shiftDate(date, -back);
};

/** The deposit deadline date of the cycle that started on `startDate`. */
export const cycleDeadlineDate = (startDate: string, settings: DormSettings) =>
  shiftDate(startDate, (settings.phoneDepositDay - weekdayOf(startDate) + 7) % 7 || 7);

/**
 * The cycle a moment belongs to: when its phones went out, when they are due
 * back, and whether that deadline has already passed.
 */
export const vaultCycle = (date: string, time: string, settings: DormSettings) => {
  const start = cycleStartDate(date, time, settings);
  const deadlineDate = cycleDeadlineDate(start, settings);
  const releaseDate = shiftDate(start, 7);
  return {
    startDate: start,
    deadlineDate,
    deadlineTime: settings.phoneDepositTime,
    releaseDate,
    releaseTime: settings.phoneReleaseTime,
    deadlinePassed: date > deadlineDate || (date === deadlineDate && time > settings.phoneDepositTime),
  };
};

/**
 * Whether a deposit taken at this moment lands after the cycle's deadline.
 * Anything past it is late until the phones go back out; a phone handed in
 * early, after the release, starts the next cycle clean.
 */
export const isLateDeposit = (date: string, time: string, settings: DormSettings) =>
  vaultCycle(date, time, settings).deadlinePassed;

/** The deadline a deposit check belongs to — the key a cycle's records share. */
export const depositCycleKey = (date: string, time: string, settings: DormSettings) =>
  vaultCycle(date, time, settings).deadlineDate;

/** "Sunday 8:00 PM" — how a cycle boundary is written for users. */
export const describeCyclePoint = (day: number, time: string) => {
  const [h, m] = time.split(':');
  const hour = Number(h);
  const clock = Number.isNaN(hour) ? time : `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  return `${WEEKDAY_NAMES[day] ?? ''} ${clock}`.trim();
};

/**
 * Why the vault holds no phone for this resident: the device is exempt, sits
 * in the dean's custody already, or was never registered. Residents without a
 * registered device are not swept up by the deadline — the vault has nothing
 * to expect from them until a phone is logged.
 */
export const vaultCustodyExemption = (studentId: string, cellphones: CellphoneCustody[]): string | null => {
  const phone = cellphones.find(c => c.studentId === studentId);
  if (!phone) return 'No phone on file';
  if (phone.custodyStatus === 'exempted') return 'No phone — exempt';
  if (phone.custodyStatus === 'confiscated') return 'Device confiscated';
  return null;
};

/**
 * Why a resident is excused from this one cycle: on leave, on bed rest, or off
 * campus on a gate pass over the deadline.
 */
export const cycleExcuseReason = (
  student: User,
  onDate: string,
  ctx: { medicalSlips: MedicalExcuseSlip[]; gatePasses: GatePassRecord[] },
): string | null => {
  if (student.status === 'excused_leave') return 'On excused leave';
  if (
    ctx.medicalSlips.some(
      m => m.studentId === student.id && m.status === 'active_bedrest' && m.startDate <= onDate && m.endDate >= onDate,
    )
  ) {
    return 'On medical bed rest';
  }
  if (
    ctx.gatePasses.some(
      g =>
        g.studentId === student.id &&
        g.status !== 'returned_on_time' &&
        g.departureDate <= onDate &&
        g.expectedReturnDate >= onDate,
    )
  ) {
    return 'Away on gate pass';
  }
  return null;
};

/** Every reason the deadline should leave a resident alone, custody or cycle. */
export const vaultExemptionReason = (
  student: User,
  onDate: string,
  ctx: {
    cellphones: CellphoneCustody[];
    medicalSlips: MedicalExcuseSlip[];
    gatePasses: GatePassRecord[];
  },
): string | null =>
  vaultCustodyExemption(student.id, ctx.cellphones) ?? cycleExcuseReason(student, onDate, ctx);
