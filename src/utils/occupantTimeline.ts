/**
 * One resident's records, every module at once, in the order they happened.
 *
 * Each module keeps its own log — worship roll calls, curfew checks, gate
 * passes — and each answers a different question. A dean sitting down with one
 * resident is asking a single question instead: what has this boy's week looked
 * like? This flattens every log that names him into one dated feed so that
 * question has one answer to read.
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
import { LANGUAGE_KIND_LABELS, demeritLabel } from './checkViolations';

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

export function buildOccupantTimeline(studentId: string, src: TimelineSource): RecordEvent[] {
  const events: RecordEvent[] = [];
  const mine = <T extends { studentId: string }>(list: T[]) => list.filter(r => r.studentId === studentId);

  mine(src.attendance).forEach(a => {
    events.push({
      id: `worship-${a.id}`,
      kind: 'worship',
      date: a.date,
      title: titleCase(a.type),
      detail: `Bible ${a.broughtBible ? '✓' : '✗'} · Attire ${a.properAttire === false ? '✗' : '✓'}`,
      tone: a.status === 'present' ? 'good' : a.status === 'absent' ? 'bad' : a.status === 'late' ? 'warn' : 'info',
    });
  });

  mine(src.studyLogs).forEach(l => {
    events.push({
      id: `study-${l.id}`,
      kind: 'study',
      date: l.date,
      time: l.checkTime,
      title: `Study hours — ${titleCase(l.location)}`,
      detail: l.quietness === 'noisy' ? 'Noisy during the check' : 'Quiet',
      tone: l.status === 'present' ? (l.quietness === 'noisy' ? 'warn' : 'good') : 'bad',
    });
  });

  mine(src.curfewRecords).forEach(c => {
    events.push({
      id: `curfew-${c.id}`,
      kind: 'curfew',
      date: c.date,
      time: c.actualCheckInTime,
      title: 'Curfew check',
      detail: c.actualCheckInTime ? `Curfew ${c.curfewTime} · in at ${c.actualCheckInTime}` : `Curfew ${c.curfewTime}`,
      tone: c.status === 'in_dorm' || c.status === 'official_pass' ? 'good' : c.status === 'late' ? 'warn' : 'bad',
    });
  });

  mine(src.uniformLogs).forEach(u => {
    events.push({
      id: `departure-${u.id}`,
      kind: 'departure',
      date: u.date,
      time: u.departureTime,
      title: `${u.session === 'afternoon' ? 'Afternoon' : 'Morning'} departure`,
      detail: checkList([
        ['Uniform', u.uniformCompliant],
        ['Hair', u.hairGroomingCompliant],
        ['ID', u.idBadgeCompliant],
        ['Shoes', u.shoesCompliant],
      ]),
      tone: u.status === 'cleared' ? 'good' : 'warn',
    });
  });

  src.cleaningDuties.forEach(duty => {
    const helper = duty.helpers.find(h => h.studentId === studentId);
    if (!helper) return;
    events.push({
      id: `cleaning-${duty.id}`,
      kind: 'cleaning',
      date: duty.date,
      title: `Room ${duty.roomNumber} cleaning day`,
      detail: `Rated ${duty.rating}/5 · garbage ${duty.garbageDisposed ? '✓' : '✗'}`,
      tone: helper.helped ? 'good' : 'bad',
    });
  });

  mine(src.phoneDeposits).forEach(d => {
    events.push({
      id: `phone-${d.id}`,
      kind: 'phone',
      date: d.date,
      time: d.depositTime,
      title: 'Phone vault deposit',
      detail: titleCase(d.status),
      tone: d.status === 'deposited' ? 'good' : d.status === 'late' ? 'warn' : d.status === 'excused' ? 'info' : 'bad',
    });
  });

  mine(src.gatePasses).forEach(p => {
    events.push({
      id: `gatepass-${p.id}`,
      kind: 'gatepass',
      date: p.departureDate,
      title: `${titleCase(p.passType)} pass`,
      detail: `${p.destination} · back ${p.expectedReturnDate}`,
      tone: p.status === 'overdue' ? 'bad' : p.status === 'returned_on_time' ? 'good' : 'info',
    });
  });

  mine(src.unauthorizedExits).forEach(e => {
    events.push({
      id: `offcampus-${e.id}`,
      kind: 'offcampus',
      date: e.date,
      time: e.noticedTime,
      title: 'Off campus without a pass',
      detail: e.destination || 'Destination unknown',
      tone: e.status === 'excused' ? 'info' : 'bad',
    });
  });

  mine(src.badLanguageLogs).forEach(l => {
    events.push({
      id: `language-${l.id}`,
      kind: 'language',
      date: l.date,
      time: l.heardTime,
      title: LANGUAGE_KIND_LABELS[l.kind],
      detail: l.directedAt ? `Said to ${l.directedAt}` : undefined,
      tone: l.status === 'excused' ? 'info' : 'bad',
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

  mine(src.violations).forEach(v => {
    if (v.status === 'cleared_service' && v.redemption) {
      events.push({
        id: `redemption-${v.id}`,
        kind: 'redemption',
        date: v.redemption.completedDate,
        title: `Redeemed — ${titleCase(v.category)}`,
        detail:
          v.redemption.kind === 'reflection'
            ? `Reflection${v.redemption.reflectionTopic ? ` on ${v.redemption.reflectionTopic}` : ''} · signed off by ${v.redemption.supervisorName}`
            : `${v.redemption.hoursRendered ?? 0} hr · ${v.redemption.serviceType ?? 'Work service'} · signed off by ${v.redemption.supervisorName}`,
        tone: 'good',
      });
      return;
    }
    events.push({
      id: `violation-${v.id}`,
      kind: 'violation',
      date: v.date,
      title: `${titleCase(v.category)} — +${demeritLabel(v.demerits)}`,
      detail: v.description,
      tone: 'bad',
    });
  });

  // Newest first. Undated or untimed records sort to the start of their day
  // rather than dropping out of the feed.
  return events.sort((a, b) => `${b.date} ${b.time ?? ''}`.localeCompare(`${a.date} ${a.time ?? ''}`));
}
