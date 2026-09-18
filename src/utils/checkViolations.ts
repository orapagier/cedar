import {
  AttendanceRecord,
  BadLanguageLog,
  CleaningDutyRecord,
  CurfewRecord,
  LightsOutLog,
  PhoneDepositLog,
  RoomInspection,
  SchoolUniformLog,
  StudyHoursLog,
  UnauthorizedExitLog,
  Violation,
} from '../types/dorm';
import { WORSHIP_SESSIONS, worshipLabel } from '../data/dormSeed';
import { formatTime12h } from './date';

// Every infraction is worth the same single demerit, whatever its severity, so
// a resident's total reads as "how many rules were broken" and nothing else. A
// demerit is not a score a resident holds; it is work owed until it is redeemed.

export const VIOLATION_DEMERITS = 1;

/** "1 demerit" / "3 demerits" — never "pts": these are owed, not scored. */
export const demeritLabel = (n: number) => `${n} demerit${n === 1 ? '' : 's'}`;

/** A violation a check record implies, before it is given an id and filed. */
export type ViolationDraft = Omit<Violation, 'id' | 'createdAt' | 'sourceId'>;

/** The residents a room-wide check falls on. */
export interface RoomMember {
  id: string;
  name: string;
}

/**
 * Every kind of record that carries a verdict a resident can be marked down
 * for, and that the Super Admin can therefore correct after the fact.
 */
export type CheckKind =
  | 'inspection'
  | 'attendance'
  | 'curfew'
  | 'uniform'
  | 'study'
  | 'cleaning'
  | 'lightsOut'
  | 'phoneDeposit'
  | 'unauthorizedExit'
  | 'badLanguage';

export const CHECK_LABELS: Record<CheckKind, string> = {
  inspection: 'Room inspection',
  attendance: 'Worship attendance',
  curfew: 'Curfew check-in',
  uniform: 'Departure & uniform',
  study: 'Study hours',
  cleaning: 'Cleaning duty',
  lightsOut: 'Lights-out round',
  phoneDeposit: 'Phone deposit',
  unauthorizedExit: 'Off-campus without pass',
  badLanguage: 'Foul language report',
};

/**
 * The tag every violation a record raised is filed under. Re-deriving a record
 * finds its own violations by this, and nothing else's. Phone deposits keep the
 * tag they have always used so records already on file stay matched.
 */
export const violationSourceId = (kind: CheckKind, record: { id: string; studentId?: string; cycleDate?: string; date?: string }) =>
  kind === 'phoneDeposit'
    ? `phone-${record.studentId}-${record.cycleDate ?? record.date}`
    : record.id;

// ---------------------------------------------------------------------------
// Reading in what is already on file. The store holds violations written under
// older rules, and they have to read as today's do before anything totals them
// or puts them on screen.
// ---------------------------------------------------------------------------

/** How a violation read before the field names and the wording settled. */
export type LegacyViolation = Violation & { demeritPoints?: number; actionRequired?: string };

/**
 * The earliest roll calls named the worship session straight off the record
 * type, so their violations read "to morning worship" where today's read "to
 * Morning Worship". Same infraction, two spellings in one list, which is how
 * the Conduct tab came to look like two different rules.
 */
export const canonicalWorshipCase = (description: string) =>
  WORSHIP_SESSIONS.reduce(
    (text, session) => text.replace(new RegExp(session.label, 'gi'), session.label),
    description ?? ''
  );

/**
 * Every violation coming off a device or off the server is re-read through
 * this, because the store still holds records filed under older rules:
 *
 *  - Demerits were once called `demeritPoints`; reading one straight totals to
 *    NaN.
 *  - Checks used to prescribe their own redemption ("Ensure Bible is in hand
 *    for next worship"), which was never the check's to say. Those belonged to
 *    a source record, so anything a record raised has its prescription dropped;
 *    a violation the Dean wrote by hand has no source, and his own words are
 *    kept as the redemption he assigned.
 *  - Worship sessions were spelled in lower case.
 */
export const normalizeViolations = (rows: Violation[]): Violation[] =>
  rows.map(row => {
    const v = row as LegacyViolation;
    const { actionRequired, demeritPoints, ...rest } = v;
    return {
      ...rest,
      demerits: typeof v.demerits === 'number'
        ? v.demerits
        : typeof demeritPoints === 'number' ? demeritPoints : VIOLATION_DEMERITS,
      description: canonicalWorshipCase(v.description),
      assignedRedemption: v.assignedRedemption ?? (v.sourceId ? undefined : actionRequired),
    };
  });

// ---------------------------------------------------------------------------
// Per-kind derivation. Each is a pure function of the record, so correcting a
// record and re-deriving gives exactly what filing it afresh would have.
//
// A draft says what was broken and what it cost — never what the resident must
// do about it. Redemption is the Dean's to hand out, boy by boy, as work or as
// a written reflection, so `assignedRedemption` is left for him to fill in.
// ---------------------------------------------------------------------------

export const inspectionDrafts = (insp: RoomInspection, occupants: RoomMember[]): ViolationDraft[] => {
  if (insp.status !== 'fail') return [];
  const members: RoomMember[] = insp.occupantChecks?.length
    ? insp.occupantChecks.map(c => ({ id: c.studentId, name: c.studentName }))
    : occupants;
  return members.map(m => ({
    date: insp.date,
    studentId: m.id,
    studentName: m.name,
    roomNumber: insp.roomNumber,
    category: 'cleanliness',
    severity: 'moderate',
    description: `Room ${insp.roomNumber} failed daily inspection score (${insp.score}/100): ${insp.remarks || 'Sanitation issues'}`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: insp.inspectorName,
    status: 'pending_settlement',
  }));
};

export const attendanceDrafts = (rec: AttendanceRecord): ViolationDraft[] => {
  const session = worshipLabel(rec.type);
  const base = {
    date: rec.date,
    studentId: rec.studentId,
    studentName: rec.studentName,
    roomNumber: rec.roomNumber,
    demerits: VIOLATION_DEMERITS,
    reportedBy: rec.recordedBy,
    status: 'pending_settlement' as const,
  };

  if (rec.status === 'absent') {
    return [{
      ...base,
      category: 'worship_absence',
      severity: 'moderate',
      description: `Unexcused absence from ${session}.`,
    }];
  }
  if (rec.status !== 'present' && rec.status !== 'late') return [];

  const drafts: ViolationDraft[] = [];
  if (!rec.broughtBible) {
    drafts.push({
      ...base,
      category: 'no_bible',
      severity: 'minor',
      description: `Failed to bring personal physical Bible to ${session}.`,
    });
  }
  if (rec.properAttire === false) {
    drafts.push({
      ...base,
      category: 'improper_worship_attire',
      severity: 'minor',
      description: `Improper worship attire at ${session}.`,
    });
  }
  return drafts;
};

export const curfewDrafts = (rec: CurfewRecord): ViolationDraft[] => {
  if (rec.status !== 'late' && rec.status !== 'missing') return [];
  return [{
    date: rec.date,
    studentId: rec.studentId,
    studentName: rec.studentName,
    roomNumber: rec.roomNumber,
    category: 'curfew_breach',
    severity: rec.status === 'missing' ? 'major' : 'moderate',
    description: rec.status === 'missing'
      ? 'Missing from dormitory past curfew without authorization.'
      : `Late curfew arrival (${rec.actualCheckInTime || 'unrecorded'}). ${rec.remarks || ''}`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: rec.loggedBy,
    status: 'pending_settlement',
  }];
};

export const uniformDrafts = (log: SchoolUniformLog): ViolationDraft[] => {
  if (log.status !== 'flagged') return [];
  return [{
    date: log.date,
    studentId: log.studentId,
    studentName: log.studentName,
    roomNumber: log.roomNumber,
    category: !log.isDepartureOnSchedule ? 'irregular_school_departure' : 'uniform_violation',
    severity: 'minor',
    description: `School departure gate inspection issue: ${log.remarks || 'Uniform/Grooming non-compliant or departed off-schedule'}.`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: log.inspectedBy,
    status: 'pending_settlement',
  }];
};

export const studyDrafts = (log: StudyHoursLog): ViolationDraft[] => {
  if (log.status !== 'absent' && log.quietness !== 'noisy') return [];
  return [{
    date: log.date,
    studentId: log.studentId,
    studentName: log.studentName,
    roomNumber: log.roomNumber,
    category: 'study_hour_skipping',
    severity: 'minor',
    description: `Study hours infraction: ${log.status === 'absent' ? 'Absent from study period' : 'Noise during quiet study'}.`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: log.recordedBy,
    status: 'pending_settlement',
  }];
};

export const lightsOutDrafts = (log: LightsOutLog, occupants: RoomMember[]): ViolationDraft[] => {
  if (log.status !== 'violation') return [];
  return occupants.map(m => ({
    date: log.date,
    studentId: m.id,
    studentName: m.name,
    roomNumber: log.roomNumber,
    category: 'lights_out_violation',
    severity: 'moderate',
    description: `Room ${log.roomNumber} lights-out violation at ${formatTime12h(log.checkTime, log.checkTime)}: ${log.violatorRemarks || 'Lights on or noise disturbance'}`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: log.inspectedBy,
    status: 'pending_settlement',
  }));
};

export const cleaningDrafts = (duty: CleaningDutyRecord): ViolationDraft[] => {
  if (duty.status !== 'completed') return [];
  const reporter = duty.recordedBy || duty.assignedBy;
  const note = duty.remarks ? ` ${duty.remarks}` : '';

  // Missing your room's cleaning day is the resident's own infraction.
  const skipped: ViolationDraft[] = duty.helpers
    .filter(h => !h.helped)
    .map(h => ({
      date: duty.date,
      studentId: h.studentId,
      studentName: h.studentName,
      roomNumber: duty.roomNumber,
      category: 'chore_neglect',
      severity: 'minor',
      description: `Did not help with Room ${duty.roomNumber}'s dorm cleaning duty.${note}`,
      demerits: VIOLATION_DEMERITS,
      reportedBy: reporter,
      status: 'pending_settlement',
    }));

  // Poor work falls on the crew that actually showed up; the residents who
  // skipped are already answering for the same day above.
  if (duty.rating > 2 && duty.garbageDisposed) return skipped;
  const reason = !duty.garbageDisposed ? 'garbage not disposed' : `cleaning rated ${duty.rating}/5`;
  const poor: ViolationDraft[] = duty.helpers
    .filter(h => h.helped)
    .map(h => ({
      date: duty.date,
      studentId: h.studentId,
      studentName: h.studentName,
      roomNumber: duty.roomNumber,
      category: 'cleanliness',
      severity: 'minor',
      description: `Dorm cleaning duty below standard (${reason}).${note}`,
      demerits: VIOLATION_DEMERITS,
      reportedBy: reporter,
      status: 'pending_settlement',
    }));
  return [...skipped, ...poor];
};

/** How the exit came to light, as the record and the register both word it. */
export const EXIT_DISCOVERY_LABELS: Record<UnauthorizedExitLog['discoveredVia'], string> = {
  gate_guard: 'Reported by the gate guard',
  roll_call: 'Found missing at a roll call',
  staff_sighting: 'Seen off campus by staff',
  reported: 'Reported by someone else',
  self_admitted: 'Admitted by the resident',
};

/**
 * Walking off campus with no pass is the dormitory's most serious departure
 * infraction, so a confirmed record carries a major demerit. An exit the Dean
 * later excuses — the pass existed on paper after all — carries none.
 */
export const unauthorizedExitDrafts = (log: UnauthorizedExitLog): ViolationDraft[] => {
  if (log.status !== 'confirmed') return [];
  const where = log.destination ? ` to ${log.destination}` : '';
  const note = log.remarks ? ` ${log.remarks}` : '';
  return [{
    date: log.date,
    studentId: log.studentId,
    studentName: log.studentName,
    roomNumber: log.roomNumber,
    category: 'unauthorized_campus_exit',
    severity: 'major',
    description:
      `Left campus${where} without a gate pass, noticed at ${formatTime12h(log.noticedTime, log.noticedTime)} ` +
      `(${EXIT_DISCOVERY_LABELS[log.discoveredVia].toLowerCase()}).${note}`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: log.loggedBy,
    status: 'pending_settlement',
  }];
};

/** What kind of language it was, as the record and the register both word it. */
export const LANGUAGE_KIND_LABELS: Record<BadLanguageLog['kind'], string> = {
  cursing: 'Cursing / swearing',
  vulgar_talk: 'Vulgar or crude talk',
  blasphemy: "God's name taken in vain",
  name_calling: 'Name-calling / mockery',
  abusive: 'Abusive or threatening speech',
};

/** Where in dormitory life the words were heard. */
export const LANGUAGE_SETTING_LABELS: Record<BadLanguageLog['setting'], string> = {
  dorm_room: 'In a dorm room',
  hallway_grounds: 'Hallway or grounds',
  worship: 'During worship',
  study_hours: 'During study hours',
  dining_kitchen: 'Dining hall or kitchen',
  school_run: 'On the school run',
  online_chat: 'In a chat or group message',
  other: 'Elsewhere in the dormitory',
};

/** How the report came to the dormitory. */
export const LANGUAGE_DISCOVERY_LABELS: Record<BadLanguageLog['discoveredVia'], string> = {
  staff_heard: 'Heard by staff',
  reported: 'Reported by someone else',
  self_admitted: 'Admitted by the resident',
  written: 'Written down or posted',
};

/**
 * Speech is graded by what the words did, not by how loud they were: a cuss
 * word said in temper is a minor slip, God's name taken in vain or mockery of
 * another resident is moderate, and language meant to threaten or degrade is
 * major. Every one of them is still the same single demerit; the grade only says
 * how the dormitory reads it. An excused report carries nothing at all.
 */
const LANGUAGE_SEVERITY: Record<BadLanguageLog['kind'], ViolationDraft['severity']> = {
  cursing: 'minor',
  vulgar_talk: 'minor',
  blasphemy: 'moderate',
  name_calling: 'moderate',
  abusive: 'major',
};

export const badLanguageDrafts = (log: BadLanguageLog): ViolationDraft[] => {
  if (log.status !== 'confirmed') return [];
  const at = log.directedAt ? ` at ${log.directedAt}` : '';
  const said = log.quote ? ` Said: "${log.quote}".` : '';
  const note = log.remarks ? ` ${log.remarks}` : '';
  return [{
    date: log.date,
    studentId: log.studentId,
    studentName: log.studentName,
    roomNumber: log.roomNumber,
    category: 'foul_language',
    severity: LANGUAGE_SEVERITY[log.kind],
    description:
      `${LANGUAGE_KIND_LABELS[log.kind]}${at} — ${LANGUAGE_SETTING_LABELS[log.setting].toLowerCase()}, ` +
      `${formatTime12h(log.heardTime, log.heardTime)} ` +
      `(${LANGUAGE_DISCOVERY_LABELS[log.discoveredVia].toLowerCase()}).${said}${note}`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: log.loggedBy,
    status: 'pending_settlement',
  }];
};

export const phoneDepositDrafts = (rec: PhoneDepositLog, dueLabel: string): ViolationDraft[] => {
  if (rec.status === 'deposited' || rec.status === 'excused') return [];
  const note = rec.remarks ? ` ${rec.remarks}` : '';
  return [{
    date: rec.date,
    studentId: rec.studentId,
    studentName: rec.studentName,
    roomNumber: rec.roomNumber,
    category: 'cellphone_policy_breach',
    severity: rec.status === 'late' ? 'minor' : 'moderate',
    description: rec.status === 'late'
      ? `Late phone deposit at ${formatTime12h(rec.depositTime, rec.depositTime)} — due ${dueLabel}.${note}`
      : `Did not deposit phone for the cycle due ${dueLabel}.${note}`,
    demerits: VIOLATION_DEMERITS,
    reportedBy: rec.recordedBy,
    status: 'pending_settlement',
  }];
};

// ---------------------------------------------------------------------------
// Scores and verdicts a record works out for itself, so a corrected record
// grades the same way one filed fresh from the same checks would.
// ---------------------------------------------------------------------------

const inspectionStatus = (score: number): RoomInspection['status'] =>
  score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail';

/**
 * Re-score an inspection: every passed criterion counts equally — bed, locker
 * and personal things per resident, plus the CR and the floor for the room.
 * Inspections filed before the per-resident ratings existed only carry the five
 * room-level flags, so those are scored on their own terms.
 */
export const recomputeInspection = (insp: RoomInspection): RoomInspection => {
  const checks = insp.occupantChecks;
  if (!checks?.length) {
    const flags = [insp.bedsOk, insp.lockersOk, insp.personalThingsOk, insp.crCleanlinessOk, insp.overallFloorOk];
    const score = Math.round((flags.filter(Boolean).length / flags.length) * 100);
    return { ...insp, score, status: inspectionStatus(score) };
  }

  const passedPerResident = checks.reduce(
    (sum, c) => sum + Number(c.bedsOk) + Number(c.lockersOk) + Number(c.personalThingsOk),
    0
  );
  const passed = passedPerResident + Number(insp.crCleanlinessOk) + Number(insp.overallFloorOk);
  const score = Math.round((passed / (checks.length * 3 + 2)) * 100);
  return {
    ...insp,
    bedsOk: checks.every(c => c.bedsOk),
    lockersOk: checks.every(c => c.lockersOk),
    personalThingsOk: checks.every(c => c.personalThingsOk),
    score,
    status: inspectionStatus(score),
  };
};

/** A gate clearance holds only if every item passed and the run was on time. */
export const recomputeUniform = (log: SchoolUniformLog): SchoolUniformLog => ({
  ...log,
  status:
    log.uniformCompliant && log.hairGroomingCompliant && log.idBadgeCompliant &&
    log.shoesCompliant && log.isDepartureOnSchedule
      ? 'cleared'
      : 'flagged',
});

/** Lights, silence and no hidden devices — all three, or the round is a violation. */
export const recomputeLightsOut = (log: LightsOutLog): LightsOutLog => ({
  ...log,
  status: log.allLightsOff && log.noiseCompliant && log.noUnauthorizedGadgets ? 'compliant' : 'violation',
});
