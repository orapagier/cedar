import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Church,
  BookOpen,
  Moon,
  UserCheck,
  Brush,
  Smartphone,
  Luggage,
  Siren,
  MessageSquareWarning,
  HeartPulse,
  AlertTriangle,
  HandHeart,
  Activity,
  Phone,
  Mail,
  Users,
  ShieldAlert,
  BadgeCheck,
  Home,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { OccupantRecordsPanel, RecordGroup } from './OccupantRecordsPanel';
import { buildOccupantTimeline, EventKind, EventMark, EventTone } from '../utils/occupantTimeline';
import { formatFullDate, formatTime12h } from '../utils/date';
import { demeritLabel } from '../utils/checkViolations';

type Tab = 'overview' | RecordGroup;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'conduct', label: 'Conduct' },
  { id: 'daily', label: 'Daily' },
  { id: 'away', label: 'Away & Health' },
];

const EVENT_ICONS: Record<EventKind, React.ComponentType<{ className?: string }>> = {
  worship: Church,
  study: BookOpen,
  curfew: Moon,
  departure: UserCheck,
  cleaning: Brush,
  phone: Smartphone,
  gatepass: Luggage,
  offcampus: Siren,
  language: MessageSquareWarning,
  medical: HeartPulse,
  violation: AlertTriangle,
  redemption: HandHeart,
};

const TONE_CLASSES: Record<EventTone, string> = {
  good: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
  warn: 'bg-amber-950 text-amber-300 border-amber-800/60',
  bad: 'bg-rose-950 text-rose-300 border-rose-800/60',
  info: 'bg-sky-950 text-sky-300 border-sky-800/60',
};

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

interface OccupantRecordModalProps {
  studentId: string;
  onClose: () => void;
  /** Step to the resident before or after this one in the list behind the popup. */
  onStep?: (direction: -1 | 1) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  /** Where this resident sits in that list, e.g. "3 of 24". */
  position?: string;
}

/**
 * One resident's whole file, opened over the roster.
 *
 * The twelve record sections are too much to read in one column, so they sit
 * behind five tabs and the popup opens on an Overview: the numbers that decide
 * a standing, then every module's entries merged into one dated feed. The
 * arrows step through the room without going back to the list, which is how a
 * dean actually reads these — one room at a time, boy after boy.
 */
export const OccupantRecordModal: React.FC<OccupantRecordModalProps> = ({
  studentId,
  onClose,
  onStep,
  hasPrev = false,
  hasNext = false,
  position,
}) => {
  const dorm = useDorm();
  const {
    users, rooms, inspections, violations, attendance, cellphones,
  } = dorm;
  const [tab, setTab] = useState<Tab>('overview');

  const occupant = users.find(u => u.id === studentId);
  const room = rooms.find(r => r.roomNumber === occupant?.roomNumber);

  // A new resident is a new file: start it at the top tab rather than wherever
  // the last one was left.
  useEffect(() => setTab('overview'), [studentId]);

  // Left/right step through the list, the same as the arrow buttons. Escape is
  // the Modal shell's own business.
  useEffect(() => {
    if (!onStep) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) onStep(-1);
      if (e.key === 'ArrowRight' && hasNext) onStep(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStep, hasPrev, hasNext]);

  const timeline = useMemo(() => buildOccupantTimeline(studentId, dorm), [studentId, dorm]);

  if (!occupant) return null;

  const activeViolations = violations.filter(v => v.studentId === studentId && v.status !== 'cleared_service');
  const demerits = activeViolations.reduce((s, v) => s + v.demerits, 0);
  const roomInspections = inspections.filter(i => i.roomNumber === occupant.roomNumber);
  const cleanliness = roomInspections.length
    ? Math.round(roomInspections.reduce((s, i) => s + i.score, 0) / roomInspections.length)
    : null;
  const myWorship = attendance.filter(a => a.studentId === studentId);
  const worshipRate = myWorship.length
    ? Math.round((myWorship.filter(a => a.status === 'present').length / myWorship.length) * 100)
    : null;
  const phone = cellphones.find(c => c.studentId === studentId);
  const roommates = users.filter(
    u => u.role === 'occupant' && u.roomNumber === occupant.roomNumber && u.id !== occupant.id
  );

  const standing =
    demerits >= 8
      ? { label: 'Probation', classes: 'bg-rose-950 text-rose-300 border-rose-700/60' }
      : demerits > 0
        ? { label: 'Under Notice', classes: 'bg-amber-950 text-amber-300 border-amber-700/60' }
        : { label: 'Good Standing', classes: 'bg-emerald-950 text-emerald-300 border-emerald-700/60' };

  const stats: Array<{ label: string; value: string; tone?: string }> = [
    {
      label: 'Demerits',
      value: String(demerits),
      tone: demerits >= 8 ? 'text-rose-400' : demerits > 0 ? 'text-amber-300' : 'text-emerald-400',
    },
    { label: 'Open Violations', value: String(activeViolations.length) },
    { label: 'Worship Kept', value: worshipRate === null ? '—' : `${worshipRate}%` },
    { label: 'Room Cleanliness', value: cleanliness === null ? '—' : String(cleanliness) },
  ];

  return (
    <Modal onClose={onClose} padding="p-0 sm:p-4" label={`Records for ${occupant.name}`}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] text-slate-100">
        {/* Header — stays put while the record scrolls under it. */}
        <div className="shrink-0 border-b border-slate-800 px-4 pt-4 pb-3 sm:px-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 font-bold">
              {initials(occupant.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{occupant.name}</h2>
              <p className="text-[11px] text-slate-400 truncate">
                Room {occupant.roomNumber}
                {room ? ` · ${room.wing} · Floor ${room.floor}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onStep && (
                <>
                  <button
                    onClick={() => onStep(-1)}
                    disabled={!hasPrev}
                    aria-label="Previous resident"
                    className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {position && (
                    // The name needs every pixel on a phone; the count is a
                    // nicety, so it waits for a wider screen.
                    <span className="hidden sm:inline text-[10px] text-slate-500 tabular-nums whitespace-nowrap">
                      {position}
                    </span>
                  )}
                  <button
                    onClick={() => onStep(1)}
                    disabled={!hasNext}
                    aria-label="Next resident"
                    className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                aria-label="Close records"
                className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 transition -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${standing.classes}`}>
              {standing.label}
            </span>
            {demerits > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {demeritLabel(demerits)}
              </span>
            )}
            {occupant.status === 'excused_leave' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-950 text-sky-300 border border-sky-700/60">
                Excused Leave
              </span>
            )}
            {occupant.parentEmail && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-950 text-sky-300 border border-sky-700/60 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Parent Linked
              </span>
            )}
            {phone && phone.custodyStatus !== 'exempted' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> {phone.custodyStatus.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar -mx-1 px-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-transparent hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 pb-safe">
          {tab === 'overview' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                {stats.map(s => (
                  <div key={s.label} className="bg-slate-950/60 border border-slate-800 rounded-xl px-2 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</p>
                    <p className={`text-xl font-bold mt-1 ${s.tone || 'text-white'}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800/70 text-xs">
                <Fact icon={Mail} label="Email" value={occupant.email || 'Not on file'} />
                <Fact icon={Phone} label="Resident phone" value={occupant.phone || 'Not on file'} />
                <Fact
                  icon={Users}
                  label="Parent / guardian"
                  value={
                    occupant.parentName
                      ? `${occupant.parentName}${occupant.parentPhone ? ` · ${occupant.parentPhone}` : ''}`
                      : 'Not on file'
                  }
                />
                <Fact
                  icon={Home}
                  label="Roommates"
                  value={roommates.length ? roommates.map(r => r.name).join(', ') : 'Rooming alone'}
                />
                {room?.captainName && <Fact icon={BadgeCheck} label="Room captain" value={room.captainName} />}
              </div>

              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-white mb-2">
                  <Activity className="w-4 h-4 text-amber-400" /> Recent Activity
                </h3>
                {timeline.length === 0 ? (
                  <p className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-6 text-center text-xs text-slate-500">
                    Nothing on file yet — records appear here as staff log them.
                  </p>
                ) : (
                  <ol className="space-y-1.5">
                    {timeline.slice(0, 15).map(event => {
                      const Icon = EVENT_ICONS[event.kind];
                      return (
                        <li
                          key={event.id}
                          className="flex items-start gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5"
                        >
                          <span
                            className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center ${TONE_CLASSES[event.tone]}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white">{event.title}</p>
                            {event.detail && (
                              <p className="text-[11px] text-slate-400 line-clamp-2">{event.detail}</p>
                            )}
                            {event.marks && event.marks.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {event.marks.map((mark, i) => (
                                  <Mark key={i} mark={mark} />
                                ))}
                              </div>
                            )}
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatFullDate(event.date)}
                              {event.time ? ` · ${formatTime12h(event.time)}` : ''}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {timeline.length > 15 && (
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Showing the 15 most recent of {timeline.length} entries — open a tab for the full log.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <OccupantRecordsPanel studentId={studentId} group={tab} limit={12} showStats={false} />
          )}
        </div>
      </div>
    </Modal>
  );
};

/**
 * What one entry cost the resident, shown on the entry that cost it. A check
 * and the demerit it raised are one thing that happened, so they read as one
 * line rather than two.
 */
function Mark({ mark }: { mark: EventMark }) {
  const owed = `+${demeritLabel(mark.demerits)}`;
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
        mark.redeemed
          ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
          : 'bg-rose-950 text-rose-300 border-rose-800/60'
      }`}
    >
      {mark.label ? `${mark.label} · ` : ''}
      {owed}
      {mark.redeemed ? ' · redeemed' : ''}
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
      <span className="text-slate-500 shrink-0 w-28">{label}</span>
      <span className="text-slate-200 min-w-0 flex-1 break-words">{value}</span>
    </div>
  );
}
