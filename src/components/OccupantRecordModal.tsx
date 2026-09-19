import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Phone,
  Mail,
  Users,
  ShieldAlert,
  BadgeCheck,
  Home,
  PlusCircle,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { OccupantRecordsPanel, RecordGroup } from './OccupantRecordsPanel';
import { ViolationsPanel } from './ViolationsPanel';
import { LogViolationModal } from './LogViolationModal';
import { demeritLabel, demeritStanding } from '../utils/checkViolations';

type Tab = 'overview' | RecordGroup;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'conduct', label: 'Conduct' },
  { id: 'daily', label: 'Daily' },
  { id: 'away', label: 'Away & Health' },
];

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
 * a standing, then the boy's current violations. The
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
    users, rooms, inspections, violations, attendance, cellphones, canEdit,
  } = dorm;
  const [tab, setTab] = useState<Tab>('overview');
  const [logging, setLogging] = useState(false);

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

  const standing = demeritStanding(demerits);

  const stats: Array<{ label: string; value: string; tone?: string }> = [
    {
      label: 'Demerits',
      value: String(demerits),
      tone: standing.tone,
    },
    { label: 'Open Violations', value: String(activeViolations.length) },
    { label: 'Worship Kept', value: worshipRate === null ? '—' : `${worshipRate}%` },
    { label: 'Room Cleanliness', value: cleanliness === null ? '—' : String(cleanliness) },
  ];

  return (
    <>
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

          <div className="mt-3 flex flex-wrap items-center gap-1">
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
            {canEdit && (
              <button
                onClick={() => setLogging(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Log violation
              </button>
            )}
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

              <ViolationsPanel studentId={studentId} />
            </div>
          ) : (
            <OccupantRecordsPanel studentId={studentId} group={tab} limit={12} showStats={false} />
          )}
        </div>
      </div>
      </Modal>

      {logging && <LogViolationModal studentId={studentId} onClose={() => setLogging(false)} />}
    </>
  );
};

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
