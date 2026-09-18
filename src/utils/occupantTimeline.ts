/**
 * One resident's records, every module at once, in the order they happened.
 *
 * Each module keeps its own log — worship roll calls, curfew checks, gate
 * passes — and each answers a different question. A dean sitting down with one
 * resident is asking a single question instead: what has this boy's week looked
 * like? This flattens every log that names him into one dated feed so that
 * question has one answer to read.
 *
 * One thing that happened is one entry. A roll call that cost a resident a
 * demerit is still the one roll call, so the demerit is folded into it rather
 * than filed again underneath — reading it twice is how a single missing Bible
 * came to look like two. Only a violation whose record is not itself in the
 * feed — a room inspection, a lights-out round, something the Dean wrote by
 * hand — stands on its own line.
 */
import {
  AttendanceRecord,
  BadLanguageLog,
  CleaningDutyRecord,
  CurfewRecord,
  GatePassRecord,
  MedicalExcuseSlip,
  PhoneDepositLog,
  SchoolUniformLog,
  StudyHoursLog,
  UnauthorizedExitLog,
  Violation,
} from '../types/dorm';
import { LANGUAGE_KIND_LABELS, violationSourceId, violationTitle } from './checkViolations';
import { formatTime12h } from './date';

/** How an entry reads at a glance: kept, slipped, broken, or just noted. */
export type EventTone = 'good' | 'warn' | 'bad' | 'info';

/** Which module filed the entry — the component maps this to an icon. */
export type EventKind =
  | 'worship'
  | 'study'
  | 'curfew'
  | 'departure'
  | 'cleaning'
  | 'phone'
  | 'gatepass'
  | 'offcampus'
  | 'language'
  | 'medical'
  | 'violation'
  | 'redemption';

/** A demerit the entry's own record raised, shown on the entry that raised it. */
export interface EventMark {
  /** The rule that was broken, e.g. "No Bible". Left off when the entry itself
   *  is the violation and already carries its name. */
  label?: string;
  demerits: number;
  /** True once the resident has worked this one off. */
  redeemed: boolean;
}

export interface RecordEvent {
  id: string;
  kind: EventKind;
  /** YYYY-MM-DD. */
  date: string;
  /** "HH:MM", when the record carries a clock time. */
  time?: string;
  title: string;
  detail?: string;
  tone: EventTone;
  /** What this record cost the resident, if anything. */
  marks?: EventMark[];
}

/** The slices of the shared store this feed is built from. */
export interface TimelineSource {
  attendance: AttendanceRecord[];
  studyLogs: StudyHoursLog[];
  curfewRecords: CurfewRecord[];
  uniformLogs: SchoolUniformLog[];
  cleaningDuties: CleaningDutyRecord[];
  phoneDeposits: PhoneDepositLog[];
  gatePasses: GatePassRecord[];
  unauthorizedExits: UnauthorizedExitLog[];
  badLanguageLogs: BadLanguageLog[];
  medicalSlips: MedicalExcuseSlip[];
  violations: Violation[];
}

const titleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/** "✓"/"✗" strings for the four departure checks, joined for the detail line. */
const checkList = (checks: Array<[string, boolean]>) =>
  checks.map(([label, ok]) => `${label} ${ok ? '✓' : '✗'}`).join(' · ');

/** " · " between the parts of a detail line, skipping the ones with nothing to say. */
const line = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' · ');

/** A record that raised a demerit cannot read as a day kept. */
const tonedBy = (tone: EventTone, marks: EventMark[]): EventTone =>
  marks.length && tone === 'good' ? 'warn' : tone;

/** How each check's verdict reads in the feed, in the dormitory's own words. */
const WORSHIP_STATUS: Record<AttendanceRecord['status'], string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  excused: 'Excused',
};

const CURFEW_STATUS: Record<CurfewRecord['status'], string> = {
  in_dorm: 'In the dorm',
  late: 'Back late',
  missing: 'Missing at curfew',
  official_pass: 'Out on an official pass',
};

const PHONE_STATUS: Record<PhoneDepositLog['status'], string> = {
  deposited: 'Deposited',
  late: 'Deposited late',
  not_deposited: 'Not deposited',
  excused: 'Excused',
};

export function buildOccupantTimeline(studentId: string, src: TimelineSource): RecordEvent[] {
  const events: RecordEvent[] = [];
  const mine = <T extends { studentId: string }>(list: T[]) => list.filter(r => r.studentId === studentId);

  // Every demerit this resident carries, filed under the record that raised it.
  // Each check below claims its own; whatever is still here at the end came
  // from a record this feed does not carry, and gets a line to itself.
  const myViolations = mine(src.violations);
  const raisedBy = new Map<string, Violation[]>();
  myViolations.forEach(v => {
    if (!v.sourceId) return;
    raisedBy.set(v.sourceId, [...(raisedBy.get(v.sourceId) ?? []), v]);
  });

  const claim = (sourceId: string): EventMark[] => {
    const raised = raisedBy.get(sourceId);
    if (!raised) return [];
    raisedBy.delete(sourceId);
    return raised.map(v => ({
      label: titleCase(v.category),
      demerits: v.demerits,
      redeemed: v.status === 'cleared_service',
    }));
  };

  mine(src.attendance).forEach(a => {
    const marks = claim(a.id);
    // Bible and attire are only looked at on a boy who was actually there. On
    // an absence the two toggles keep whatever they were left at and mean
    // nothing, so the entry says he was absent and stops.
    const attended = a.status === 'present' || a.status === 'late';
    events.push({
      id: `worship-${a.id}`,
      kind: 'worship',
      date: a.date,
      title: titleCase(a.type),
      detail: line(
        WORSHIP_STATUS[a.status],
        attended && `Bible ${a.broughtBible ? '✓' : '✗'}`,
        attended && `Attire ${a.properAttire === false ? '✗' : '✓'}`
      ),
      tone: tonedBy(
        a.status === 'present' ? 'good' : a.status === 'absent' ? 'bad' : a.status === 'late' ? 'warn' : 'info',
        marks
      ),
      marks,
    });
  });

  mine(src.studyLogs).forEach(l => {
    const marks = claim(l.id);
    events.push({
      id: `study-${l.id}`,
      kind: 'study',
      date: l.date,
      time: l.checkTime,
      title: `Study hours — ${titleCase(l.location)}`,
      detail: l.status === 'absent'
        ? 'Absent from the study period'
        : line('Present', l.quietness === 'noisy' ? 'noisy at the check' : 'quiet'),
      tone: tonedBy(l.status === 'present' ? (l.quietness === 'noisy' ? 'warn' : 'good') : 'bad', marks),
      marks,
    });
  });

  mine(src.curfewRecords).forEach(c => {
    const marks = claim(c.id);
    events.push({
      id: `curfew-${c.id}`,
      kind: 'curfew',
      date: c.date,
      time: c.actualCheckInTime,
      title: 'Curfew check',
      detail: line(
        CURFEW_STATUS[c.status],
        `curfew ${formatTime12h(c.curfewTime, c.curfewTime)}`,
        c.actualCheckInTime && `in at ${formatTime12h(c.actualCheckInTime, c.actualCheckInTime)}`
      ),
      tone: tonedBy(
        c.status === 'in_dorm' || c.status === 'official_pass' ? 'good' : c.status === 'late' ? 'warn' : 'bad',
        marks
      ),
      marks,
    });
  });

  mine(src.uniformLogs).forEach(u => {
    const marks = claim(u.id);
    events.push({
      id: `departure-${u.id}`,
      kind: 'departure',
      date: u.date,
      time: u.departureTime,
      title: `${u.session === 'afternoon' ? 'Afternoon' : 'Morning'} departure`,
      detail: line(
        u.status === 'cleared' ? 'Cleared at the gate' : 'Flagged at the gate',
        checkList([
          ['Uniform', u.uniformCompliant],
          ['Hair', u.hairGroomingCompliant],
          ['ID', u.idBadgeCompliant],
          ['Shoes', u.shoesCompliant],
        ])
      ),
      tone: tonedBy(u.status === 'cleared' ? 'good' : 'warn', marks),
      marks,
    });
  });

  src.cleaningDuties.forEach(duty => {
    const helper = duty.helpers.find(h => h.studentId === studentId);
    if (!helper) return;
    const marks = claim(duty.id);
    events.push({
      id: `cleaning-${duty.id}`,
      kind: 'cleaning',
      date: duty.date,
      title: `Room ${duty.roomNumber} cleaning day`,
      detail: line(
        helper.helped ? 'Helped' : 'Did not help',
        `rated ${duty.rating}/5`,
        `garbage ${duty.garbageDisposed ? '✓' : '✗'}`
      ),
      tone: tonedBy(helper.helped ? 'good' : 'bad', marks),
      marks,
    });
  });

  mine(src.phoneDeposits).forEach(d => {
    const marks = claim(violationSourceId('phoneDeposit', d));
    events.push({
      id: `phone-${d.id}`,
      kind: 'phone',
      date: d.date,
      time: d.depositTime,
      title: 'Phone vault deposit',
      detail: PHONE_STATUS[d.status],
      tone: tonedBy(
        d.status === 'deposited' ? 'good' : d.status === 'late' ? 'warn' : d.status === 'excused' ? 'info' : 'bad',
        marks
      ),
      marks,
    });
  });

  mine(src.gatePasses).forEach(p => {
    events.push({
      id: `gatepass-${p.id}`,
      kind: 'gatepass',
      date: p.departureDate,
      title: `${titleCase(p.passType)} pass`,
      detail: line(titleCase(p.status), p.destination, `back ${p.expectedReturnDate}`),
      tone: p.status === 'overdue' ? 'bad' : p.status === 'returned_on_time' ? 'good' : 'info',
    });
  });

  mine(src.unauthorizedExits).forEach(e => {
    const marks = claim(e.id);
    events.push({
      id: `offcampus-${e.id}`,
      kind: 'offcampus',
      date: e.date,
      time: e.noticedTime,
      title: 'Off campus without a pass',
      detail: line(
        e.status === 'excused' ? 'Excused afterwards' : 'Confirmed',
        e.destination || 'destination unknown'
      ),
      tone: tonedBy(e.status === 'excused' ? 'info' : 'bad', marks),
      marks,
    });
  });

  mine(src.badLanguageLogs).forEach(l => {
    const marks = claim(l.id);
    events.push({
      id: `language-${l.id}`,
      kind: 'language',
      date: l.date,
      time: l.heardTime,
      title: LANGUAGE_KIND_LABELS[l.kind],
      detail: line(
        l.status === 'excused' ? 'Excused' : 'Confirmed',
        l.directedAt && `said to ${l.directedAt}`
      ),
      tone: tonedBy(l.status === 'excused' ? 'info' : 'bad', marks),
      marks,
    });
  });

  mine(src.medicalSlips).forEach(m => {
    events.push({
      id: `medical-${m.id}`,
      kind: 'medical',
      date: m.startDate,
      title: m.diagnosis,
      detail: `${m.clinicStaffOrDoctor}${m.bedRestRequired ? ' · bed rest' : ''}`,
      tone: m.status === 'recovered_cleared' ? 'good' : 'warn',
    });
  });

  // The day a violation was worked off is a day of its own, whichever entry
  // the violation itself is shown on.
  myViolations.forEach(v => {
    if (v.status !== 'cleared_service' || !v.redemption) return;
    events.push({
      id: `redemption-${v.id}`,
      kind: 'redemption',
      date: v.redemption.completedDate,
      title: `Redeemed — ${violationTitle(v)}`,
      detail:
        v.redemption.kind === 'reflection'
          ? `Reflection${v.redemption.reflectionTopic ? ` on ${v.redemption.reflectionTopic}` : ''} · signed off by ${v.redemption.supervisorName}`
          : `${v.redemption.hoursRendered ?? 0} hr · ${v.redemption.serviceType ?? 'Work service'} · signed off by ${v.redemption.supervisorName}`,
      tone: 'good',
    });
  });

  // What no check claimed: a room inspection, a lights-out round, or a
  // violation the Dean wrote by hand. Its own line is the only one it gets —
  // unless it was redeemed and logged as such, in which case the entry above is
  // the news. One cleared with no redemption on file still shows, marked, so
  // that nothing drops out of a resident's record unseen.
  myViolations.forEach(v => {
    if (v.sourceId && !raisedBy.has(v.sourceId)) return;
    if (v.status === 'cleared_service' && v.redemption) return;
    events.push({
      id: `violation-${v.id}`,
      kind: 'violation',
      date: v.date,
      title: violationTitle(v),
      detail: v.description,
      tone: v.status === 'cleared_service' ? 'good' : 'bad',
      marks: [{ demerits: v.demerits, redeemed: v.status === 'cleared_service' }],
    });
  });

  // Newest first. Undated or untimed records sort to the start of their day
  // rather than dropping out of the feed.
  return events.sort((a, b) => `${b.date} ${b.time ?? ''}`.localeCompare(`${a.date} ${a.time ?? ''}`));
}
