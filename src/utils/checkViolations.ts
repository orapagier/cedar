import {
  AttendanceRecord,
  CleaningDutyRecord,
  CurfewRecord,
  LightsOutLog,
  PhoneDepositLog,
  RoomInspection,
  SchoolUniformLog,
  StudyHoursLog,
  Violation,
} from '../types/dorm';
import { worshipLabel } from '../data/dormSeed';
import { formatTime12h } from './date';

// Every infraction is worth the same single point, whatever its severity, so a
// resident's total reads as "how many rules were broken" and nothing else.
export const VIOLATION_POINTS = 1;

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
  | 'phoneDeposit';

export const CHECK_LABELS: Record<CheckKind, string> = {
  inspection: 'Room inspection',
  attendance: 'Worship attendance',
  curfew: 'Curfew check-in',
  uniform: 'Departure & uniform',
  study: 'Study hours',
  cleaning: 'Cleaning duty',
  lightsOut: 'Lights-out round',
  phoneDeposit: 'Phone deposit',
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
// Per-kind derivation. Each is a pure function of the record, so correcting a
// record and re-deriving gives exactly what filing it afresh would have.
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
    demeritPoints: VIOLATION_POINTS,
    reportedBy: insp.inspectorName,
    status: 'pending_settlement',
    actionRequired: 'Re-inspection by 5:00 PM required.',
  }));
};

export const attendanceDrafts = (rec: AttendanceRecord): ViolationDraft[] => {
  const session = worshipLabel(rec.type);
  const base = {
    date: rec.date,
    studentId: rec.studentId,
    studentName: rec.studentName,
    roomNumber: rec.roomNumber,
    demeritPoints: VIOLATION_POINTS,
    reportedBy: rec.recordedBy,
    status: 'pending_settlement' as const,
  };

  if (rec.status === 'absent') {
    return [{
      ...base,
      category: 'worship_absence',
      severity: 'moderate',
      description: `Unexcused absence from ${session}.`,
      actionRequired: 'Submit dean excuse slip or make-up devotional session.',
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
      actionRequired: 'Ensure Bible is in hand for next worship.',
    });
  }
  if (rec.properAttire === false) {
    drafts.push({
      ...base,
      category: 'improper_worship_attire',
      severity: 'minor',
      description: `Improper worship attire at ${session}.`,
      actionRequired: 'Come in proper worship attire for the next service.',
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
    demeritPoints: VIOLATION_POINTS,
    reportedBy: rec.loggedBy,
    status: 'pending_settlement',
    actionRequired: 'Dean inquiry interview.',
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
    demeritPoints: VIOLATION_POINTS,
    reportedBy: log.inspectedBy,
    status: 'pending_settlement',
    actionRequired: 'Correction before school gate pass clearance.',
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
    demeritPoints: VIOLATION_POINTS,
    reportedBy: log.recordedBy,
    status: 'pending_settlement',
    actionRequired: 'Silent study monitoring assigned.',
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
    demeritPoints: VIOLATION_POINTS,
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
      demeritPoints: VIOLATION_POINTS,
      reportedBy: reporter,
      status: 'pending_settlement',
      actionRequired: 'Serve the next cleaning rotation under monitor sign-off.',
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
      demeritPoints: VIOLATION_POINTS,
      reportedBy: reporter,
      status: 'pending_settlement',
      actionRequired: 'Redo the assigned area before the next inspection.',
    }));
  return [...skipped, ...poor];
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
    demeritPoints: VIOLATION_POINTS,
    reportedBy: rec.recordedBy,
    status: 'pending_settlement',
    actionRequired: rec.status === 'late'
      ? 'Deposit on time at the next vault run.'
      : 'Surrender the device to the Dean immediately.',
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
