import React from 'react';
import {
  Church,
  BookOpen,
  Moon,
  UserCheck,
  Brush,
  Smartphone,
  Luggage,
  Siren,
  HeartPulse,
  AlertTriangle,
  HandHeart,
  PenLine,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Violation } from '../types/dorm';
import { formatFullDate, formatTime12h } from '../utils/date';

const PASS_LABELS: Record<string, string> = {
  weekend_home: 'Weekend Home Leave',
  church_event: 'Church Event',
  medical_visit: 'Medical Visit',
  family_emergency: 'Family Emergency',
  academic: 'Academic / School Task',
};

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Icon className="w-4 h-4 text-amber-400" />
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-slate-800/70">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-4 text-center text-xs text-slate-500">{text}</p>;
}

/** "2 hrs · Library Duty" or "Reflection on curfew breach" — how one violation was paid off. */
const redemptionLabel = (v: Violation) => {
  const r = v.redemption;
  if (!r) return 'Cleared';
  if (r.kind === 'reflection') return `Reflection${r.reflectionTopic ? ` on ${r.reflectionTopic}` : ''}`;
  const hours = r.hoursRendered ?? 0;
  return `${hours} hr${hours === 1 ? '' : 's'} · ${r.serviceType ?? 'Work service'}`;
};

/** Read-only aggregate of every record tied to one occupant. Used by the
 *  Occupant Records drill and the parent self-serve view. */
export const OccupantRecordsPanel: React.FC<{ studentId: string; limit?: number }> = ({ studentId, limit = 5 }) => {
  const {
    users,
    rooms,
    inspections,
    attendance,
    studyLogs,
    curfewRecords,
    uniformLogs,
    cleaningDuties,
    phoneDeposits,
    cellphones,
    violations,
    gatePasses,
    unauthorizedExits,
    medicalSlips,
  } = useDorm();

  const occupant = users.find(u => u.id === studentId && u.role === 'occupant');
  const room = rooms.find(r => r.roomNumber === occupant?.roomNumber);
  const childInspections = inspections.filter(i => i.roomNumber === occupant?.roomNumber);
  const activeViolations = violations.filter(v => v.studentId === studentId && v.status !== 'cleared_service');
  const redeemedViolations = violations.filter(v => v.studentId === studentId && v.status === 'cleared_service');
  const demerits = activeViolations.reduce((s, v) => s + v.demeritPoints, 0);
  const lastInspection = childInspections[0];
  const phoneEntry = cellphones.find(c => c.studentId === studentId);
  const myDeposits = phoneDeposits.filter(d => d.studentId === studentId);
  // Cleaning duty is recorded per room-day; a resident appears in the days
  // their own room was the crew.
  const myCleaningDays = cleaningDuties
    .filter(d => d.helpers.some(h => h.studentId === studentId))
    .map(duty => ({ duty, helped: duty.helpers.find(h => h.studentId === studentId)?.helped ?? false }));

  const statusChip = (status: string) => {
    if (status === 'present' || status === 'cleared' || status === 'in_dorm' || status === 'official_pass' || status === 'returned_on_time' || status === 'inspected_approved' || status === 'recovered_cleared') return 'bg-emerald-950 text-emerald-300';
    if (status === 'late' || status === 'pending' || status === 'active_bedrest' || status === 'departed' || status === 'completed') return status === 'completed' ? 'bg-sky-950 text-sky-300' : 'bg-amber-950 text-amber-300';
    if (status === 'excused') return 'bg-sky-950 text-sky-300';
    return 'bg-rose-950 text-rose-300';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">Points (pts)</p>
          <p className={`text-xl font-bold mt-0.5 ${demerits >= 8 ? 'text-rose-400' : demerits > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
            {demerits}
          </p>
        </div>
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">Pending Violations</p>
          <p className="text-xl font-bold mt-0.5 text-white">{activeViolations.length}</p>
        </div>
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">Cleanliness Score</p>
          <p className="text-xl font-bold mt-0.5 text-white">
            {childInspections.length ? Math.round(childInspections.reduce((s, i) => s + i.score, 0) / childInspections.length) : '—'}
          </p>
        </div>
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">Room Standing</p>
          <p className="text-xl font-bold mt-0.5 text-white">{lastInspection ? lastInspection.score : '—'}</p>
        </div>
      </div>

      <Section icon={Church} title="Worship Attendance">
        {attendance.filter(a => a.studentId === studentId).slice(0, limit).map(a => (
          <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{a.type.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-slate-400">{formatFullDate(a.date)} · Bible {a.broughtBible ? '✓' : '✗'} · Attire {a.properAttire === false ? '✗' : '✓'}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(a.status)}`}>{a.status}</span>
          </div>
        ))}
        {attendance.filter(a => a.studentId === studentId).length === 0 && <Empty text="No worship records yet." />}
      </Section>

      <Section icon={BookOpen} title="Study Time">
        {studyLogs.filter(l => l.studentId === studentId).slice(0, limit).map(l => (
          <div key={l.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{l.location.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-slate-400">
                {formatFullDate(l.date)}
                {l.checkTime && ` · ${formatTime12h(l.checkTime)}`} · {l.quietness ?? 'quiet'}
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(l.status)}`}>{l.status}</span>
          </div>
        ))}
        {studyLogs.filter(l => l.studentId === studentId).length === 0 && <Empty text="No study records yet." />}
      </Section>

      <Section icon={Moon} title="Curfew & Lights Out">
        {curfewRecords.filter(c => c.studentId === studentId).slice(0, limit).map(c => (
          <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{formatFullDate(c.date)}</p>
              <p className="text-[11px] text-slate-400">Curfew {c.curfewTime}{c.actualCheckInTime ? ` · in at ${c.actualCheckInTime}` : ''}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(c.status)}`}>{c.status.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {curfewRecords.filter(c => c.studentId === studentId).length === 0 && <Empty text="No curfew records yet." />}
      </Section>

      <Section icon={UserCheck} title="Departure & Uniform">
        {uniformLogs.filter(u => u.studentId === studentId).slice(0, limit).map(u => (
          <div key={u.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">
                {formatFullDate(u.date)} · {formatTime12h(u.departureTime)}
                <span className="text-slate-500 font-normal"> · {u.session === 'afternoon' ? 'Afternoon' : 'Morning'}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Uniform {u.uniformCompliant ? '✓' : '✗'} · Hair {u.hairGroomingCompliant ? '✓' : '✗'} ·
                ID {u.idBadgeCompliant ? '✓' : '✗'} · Shoes {u.shoesCompliant ? '✓' : '✗'}
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(u.status)}`}>{u.status}</span>
          </div>
        ))}
        {uniformLogs.filter(u => u.studentId === studentId).length === 0 && <Empty text="No departure records yet." />}
      </Section>

      <Section icon={Brush} title="Cleaning Duty">
        {myCleaningDays.slice(0, limit).map(({ duty, helped }) => (
          <div key={duty.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Room {duty.roomNumber} cleaning day</p>
              <p className="text-[11px] text-slate-400">
                {formatFullDate(duty.date)} · rated {duty.rating}/5 · garbage {duty.garbageDisposed ? '✓' : '✗'}
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              helped ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}>
              {helped ? 'helped' : 'did not help'}
            </span>
          </div>
        ))}
        {myCleaningDays.length === 0 && <Empty text="No cleaning duty days yet." />}
      </Section>

      <Section icon={Smartphone} title="Phone Vault">
        {myDeposits.slice(0, limit).map(d => (
          <div key={d.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Deposit check</p>
              <p className="text-[11px] text-slate-400">{formatFullDate(d.date)} · {formatTime12h(d.depositTime)}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              d.status === 'deposited' ? 'bg-emerald-950 text-emerald-300' :
              d.status === 'late' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
            }`}>
              {d.status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
        {phoneEntry ? (
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{phoneEntry.deviceModel}</p>
              <p className="text-[11px] text-slate-400">Phone vault</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              phoneEntry.custodyStatus === 'in_vault' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
            }`}>{phoneEntry.custodyStatus.replace(/_/g, ' ')}</span>
          </div>
        ) : (
          <Empty text="No phone custody record." />
        )}
      </Section>

      <Section icon={Luggage} title="Gate Pass & Home Leave">
        {gatePasses.filter(p => p.studentId === studentId).slice(0, limit).map(p => (
          <div key={p.id} className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white">{PASS_LABELS[p.passType]}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(p.status)}`}>{p.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {p.destination} · Out {formatFullDate(p.departureDate)} · Back {formatFullDate(p.expectedReturnDate)}
            </p>
          </div>
        ))}
        {gatePasses.filter(p => p.studentId === studentId).length === 0 && <Empty text="No gate passes on file." />}
      </Section>

      <Section icon={Siren} title="Off-Campus Without Pass">
        {unauthorizedExits.filter(e => e.studentId === studentId).slice(0, limit).map(e => (
          <div key={e.id} className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white">{formatFullDate(e.date)}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                e.status === 'excused' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {e.status === 'excused' ? 'excused' : 'no pass'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {e.destination || 'Destination unknown'} · noticed {formatTime12h(e.noticedTime)} ·{' '}
              {e.returnedTime ? `back at ${formatTime12h(e.returnedTime)}` : 'not yet logged back in'}
            </p>
            {e.status === 'excused' && e.excuseReason && (
              <p className="text-[11px] text-emerald-400/90 mt-0.5">Excused: {e.excuseReason}</p>
            )}
          </div>
        ))}
        {unauthorizedExits.filter(e => e.studentId === studentId).length === 0 && (
          <Empty text="No unauthorized exits on file." />
        )}
      </Section>

      <Section icon={HeartPulse} title="Medical Notes">
        {medicalSlips.filter(m => m.studentId === studentId).slice(0, limit).map(m => (
          <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{m.diagnosis}</p>
              <p className="text-[11px] text-slate-400">
                {formatFullDate(m.startDate)} → {formatFullDate(m.endDate)} · {m.clinicStaffOrDoctor}
              </p>
              {m.excusedFrom.length > 0 && (
                <p className="text-[11px] text-amber-400/80 mt-0.5">Excused from {m.excusedFrom.join(', ')}</p>
              )}
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusChip(m.status)}`}>{m.status.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {medicalSlips.filter(m => m.studentId === studentId).length === 0 && <Empty text="No medical records." />}
      </Section>

      <Section icon={AlertTriangle} title="Violations & Standing">
        {activeViolations.length === 0 && <Empty text="No active violations — great standing!" />}
        {activeViolations.slice(0, limit).map(v => (
          <div key={v.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white capitalize">{v.category.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2">{v.description}</p>
              {v.actionRequired && (
                <p className="text-[10px] text-amber-300/90 mt-0.5">To redeem: {v.actionRequired}</p>
              )}
            </div>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300">
              +{v.demeritPoints} pts
            </span>
          </div>
        ))}
      </Section>

      <Section icon={HandHeart} title="Redeemed Violations">
        {redeemedViolations.length === 0 && <Empty text="Nothing redeemed yet." />}
        {redeemedViolations.slice(0, limit).map(v => (
          <div key={v.id} className="px-4 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  {v.redemption?.kind === 'reflection'
                    ? <PenLine className="w-3 h-3 shrink-0" />
                    : <HandHeart className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{redemptionLabel(v)}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                  {v.category.replace(/_/g, ' ')} · {formatFullDate(v.date)}
                </p>
                {v.redemption && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Signed off by {v.redemption.supervisorName} on {formatFullDate(v.redemption.completedDate)}
                  </p>
                )}
                {v.redemption?.reflectionText && (
                  <p className="text-[11px] text-slate-300 mt-1 italic line-clamp-3">"{v.redemption.reflectionText}"</p>
                )}
              </div>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300">
                −{v.demeritPoints} pts
              </span>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
};