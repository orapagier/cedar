import React from 'react';
import {
  Church,
  BookOpen,
  Moon,
  UserCheck,
  Brush,
  Smartphone,
  Luggage,
  HeartPulse,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

const PASS_LABELS: Record<string, string> = {
  weekend_home: 'Weekend Home Leave',
  church_event: 'Church Event',
  medical_visit: 'Medical Visit',
  family_emergency: 'Family Emergency',
  academic: 'Academic / School Task',
};

const WING = {
  North: 'bg-sky-950 text-sky-300 border border-sky-700/50',
  South: 'bg-rose-950 text-rose-300 border border-rose-700/50',
  East: 'bg-amber-950 text-amber-300 border border-amber-700/50',
  West: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50',
} as const;

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

export const ParentView: React.FC = () => {
  const {
    currentUser,
    users,
    rooms,
    inspections,
    attendance,
    studyLogs,
    curfewRecords,
    uniformLogs,
    chores,
    cellphones,
    violations,
    gatePasses,
    medicalSlips,
  } = useDorm();

  const child = users.find(u => u.id === currentUser.relatedStudentId);
  const childId = child?.id;
  const room = rooms.find(r => r.roomNumber === child?.roomNumber);

  if (!child || !childId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
        No linked student record found. Please contact the dormitory administrator.
      </div>
    );
  }

  const childInspections = inspections.filter(i => i.roomNumber === child.roomNumber);
  const lastInspection = childInspections[0];
  const activeViolations = violations.filter(v => v.studentId === childId && v.status !== 'cleared_service');
  const demerits = activeViolations.reduce((s, v) => s + v.demeritPoints, 0);
  const phoneEntry = cellphones.find(c => c.studentId === childId);
  const childPasses = gatePasses.filter(p => p.studentId === childId).slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Child identity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 font-bold text-lg">
              {child.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-white">{child.name}</p>
              <p className="text-xs text-slate-400">
                {child.email} · Room {child.roomNumber}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {room && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${WING[room.wing.split(' ')[0] as keyof typeof WING] || ''}`}>
                {room.wing}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              child.status === 'probation' ? 'bg-rose-950 text-rose-300 border border-rose-700/50' :
              child.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' :
              'bg-sky-950 text-sky-300 border border-sky-700/50'
            }`}>
              {child.status === 'probation' ? 'On Notice' : child.status === 'active' ? 'Good Standing' : 'Excused Leave'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400">Demerit Points</p>
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
      </div>

      {/* Worship */}
      <Section icon={Church} title="Worship Attendance">
        {attendance.filter(a => a.studentId === childId).slice(0, 5).map(a => (
          <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{a.type.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-slate-400">{a.date} · Bible {a.broughtBible ? '✓' : '✗'}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              a.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
              a.status === 'late' ? 'bg-amber-950 text-amber-300' :
              a.status === 'excused' ? 'bg-sky-950 text-sky-300' : 'bg-rose-950 text-rose-300'
            }`}>{a.status}</span>
          </div>
        ))}
        {attendance.filter(a => a.studentId === childId).length === 0 && <Empty text="No worship records yet." />}
      </Section>

      {/* Study */}
      <Section icon={BookOpen} title="Study Time">
        {studyLogs.filter(l => l.studentId === childId).slice(0, 5).map(l => (
          <div key={l.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{l.location.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-slate-400">{l.date} · Focus: {l.focusRating}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              l.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
              l.status === 'excused' ? 'bg-sky-950 text-sky-300' :
              l.status === 'late' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
            }`}>{l.status}</span>
          </div>
        ))}
        {studyLogs.filter(l => l.studentId === childId).length === 0 && <Empty text="No study records yet." />}
      </Section>

      {/* Curfew */}
      <Section icon={Moon} title="Curfew & Lights Out">
        {curfewRecords.filter(c => c.studentId === childId).slice(0, 5).map(c => (
          <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{c.date}</p>
              <p className="text-[11px] text-slate-400">Curfew {c.curfewTime}{c.actualCheckInTime ? ` · in at ${c.actualCheckInTime}` : ''}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              c.status === 'in_dorm' || c.status === 'official_pass' ? 'bg-emerald-950 text-emerald-300' :
              c.status === 'late' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
            }`}>{c.status.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {curfewRecords.filter(c => c.studentId === childId).length === 0 && <Empty text="No curfew records yet." />}
      </Section>

      {/* Departure & Uniform */}
      <Section icon={UserCheck} title="Departure & Uniform">
        {uniformLogs.filter(u => u.studentId === childId).slice(0, 5).map(u => (
          <div key={u.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{u.date} · {u.departureTime}</p>
              <p className="text-[11px] text-slate-400">
                Uniform {u.uniformCompliant ? '✓' : '✗'} · Hair {u.hairGroomingCompliant ? '✓' : '✗'} ·
                ID {u.idBadgeCompliant ? '✓' : '✗'} · Shoes {u.shoesCompliant ? '✓' : '✗'}
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              u.status === 'cleared' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}>{u.status}</span>
          </div>
        ))}
        {uniformLogs.filter(u => u.studentId === childId).length === 0 && <Empty text="No departure records yet." />}
      </Section>

      {/* Chores */}
      <Section icon={Brush} title="Weekly Chores">
        {chores.filter(c => c.studentId === childId).slice(0, 5).map(c => (
          <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{c.dutyArea}</p>
              <p className="text-[11px] text-slate-400">Week {c.weekRange} · {c.daySchedule}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              c.status === 'inspected_approved' ? 'bg-emerald-950 text-emerald-300' :
              c.status === 'completed' ? 'bg-sky-950 text-sky-300' :
              c.status === 'failed' ? 'bg-rose-950 text-rose-300' : 'bg-slate-700 text-slate-300'
            }`}>{c.status.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {chores.filter(c => c.studentId === childId).length === 0 && <Empty text="No chore assignments yet." />}
      </Section>

      {/* Phone vault */}
      <Section icon={Smartphone} title="Phone Vault">
        {phoneEntry ? (
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{phoneEntry.deviceModel}</p>
              <p className="text-[11px] text-slate-400">Locker {phoneEntry.lockerVaultNumber}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              phoneEntry.custodyStatus === 'in_vault' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
            }`}>{phoneEntry.custodyStatus.replace(/_/g, ' ')}</span>
          </div>
        ) : (
          <Empty text="No phone custody record." />
        )}
      </Section>

      {/* Gate pass */}
      <Section icon={Luggage} title="Gate Pass & Home Leave">
        {childPasses.length === 0 && <Empty text="No gate passes on file." />}
        {childPasses.map(p => (
          <div key={p.id} className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white">{PASS_LABELS[p.passType]}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                p.status === 'returned_on_time' ? 'bg-emerald-950 text-emerald-300' :
                p.status === 'overdue' ? 'bg-rose-950 text-rose-300' :
                p.status === 'departed' ? 'bg-blue-950 text-blue-300' : 'bg-sky-950 text-sky-300'
              }`}>{p.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {p.destination} · Out {p.departureDate} · Back {p.expectedReturnDate}
            </p>
          </div>
        ))}
      </Section>

      {/* Medical */}
      <Section icon={HeartPulse} title="Medical Notes">
        {medicalSlips.filter(m => m.studentId === childId).slice(0, 5).map(m => (
          <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{m.diagnosis}</p>
              <p className="text-[11px] text-slate-400">
                {m.startDate} → {m.endDate} · {m.clinicStaffOrDoctor}
              </p>
              {m.excusedFrom.length > 0 && (
                <p className="text-[11px] text-amber-400/80 mt-0.5">Excused from {m.excusedFrom.join(', ')}</p>
              )}
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              m.status === 'active_bedrest' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
            }`}>{m.status.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {medicalSlips.filter(m => m.studentId === childId).length === 0 && <Empty text="No medical records." />}
      </Section>

      {/* Violations */}
      <Section icon={AlertTriangle} title="Violations & Standing">
        {activeViolations.length === 0 && <Empty text="No active violations — great standing!" />}
        {activeViolations.slice(0, 5).map(v => (
          <div key={v.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{v.category}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2">{v.description}</p>
            </div>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300">
              +{v.demeritPoints}
            </span>
          </div>
        ))}
      </Section>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <GraduationCap className="w-4 h-4" />
        Parent read-only access — entries made by the dormitory staff appear here automatically.
      </p>
    </div>
  );
};