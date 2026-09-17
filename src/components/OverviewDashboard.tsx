import React from 'react';
import { manilaHour, formatFullDate, formatTime12h } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';
import {
  AlertTriangle,
  DoorOpen,
  Church,
  BookOpen,
  Moon,
  UserCheck,
  Brush,
  Smartphone,
  Luggage,
  ChevronRight,
  Users,
  Shield,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

interface OverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

const CHECKS: { id: string; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inspections', label: 'Room Check', sub: 'Bed, locker, CR cleanliness', icon: DoorOpen },
  { id: 'worship', label: 'Worship Roll Call', sub: 'Bibles, lates, absences', icon: Church },
  { id: 'study', label: 'Study Time', sub: 'Evening study & library', icon: BookOpen },
  { id: 'curfew', label: 'Curfew & Lights Out', sub: 'Night check-in & lights out', icon: Moon },
  { id: 'uniform', label: 'Departure & Uniform', sub: 'School gate check', icon: UserCheck },
  { id: 'cleaning', label: 'Daily Cleaning', sub: 'Room rotation & garbage', icon: Brush },
  { id: 'cellphones', label: 'Phone Vault', sub: 'Per-resident deposit check', icon: Smartphone },
  { id: 'gatepass', label: 'Gate Pass & Home Leave', sub: 'Campus exits & weekend leave', icon: Luggage },
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const {
    currentUser,
    isOccupant,
    canEdit,
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
    gatePasses,
    violations,
    settings,
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const today = useManilaToday();
  const todayViolations = violations.filter(v => v.date === today);
  const activeViolations = violations.filter(
    v => v.status === 'pending_settlement' || v.status === 'confirmed'
  );

  const hour = manilaHour();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const avgCleanliness =
    inspections.length > 0
      ? Math.round(inspections.reduce((acc, i) => acc + i.score, 0) / inspections.length)
      : null;

  const todayDuty = cleaningDuties.find(d => d.date === today);

  const todayStats: Record<string, string> = {
    inspections: `${inspections.filter(i => i.date === today).length}/${rooms.length} scored`,
    worship: `${attendance.filter(a => a.date === today).length} logged`,
    study: `${studyLogs.filter(l => l.date === today).length} logged`,
    curfew: `${curfewRecords.filter(c => c.date === today).length} checked in`,
    uniform: `${uniformLogs.filter(u => u.date === today).length} cleared`,
    cleaning: todayDuty
      ? `Room ${todayDuty.roomNumber}${todayDuty.status === 'completed' ? ' ✓' : ''}`
      : 'No crew set',
    cellphones: `${phoneDeposits.filter(d => d.date === today).length} checked`,
    gatepass: `${gatePasses.filter(p => p.status === 'approved' || p.status === 'departed').length} active`,
  };

  // Subtitles that quote a configurable hour are built from settings, so the
  // dashboard never advertises a time the schedule no longer uses.
  const checkSubs: Record<string, string> = {
    curfew: `${formatTime12h(settings.curfewTime || '21:00')} in, ${formatTime12h(settings.lightsOutTime || '22:00')} dark`,
    study: `Evening study ${formatTime12h(settings.studyStart || '19:30')} - ${formatTime12h(settings.studyEnd || '21:30')}`,
    uniform: `Morning ${formatTime12h(settings.departureStart || '07:00')} · Afternoon ${formatTime12h(settings.departureAfternoonStart || '13:00')}`,
  };

  const myRecord = occupants.find(o => o.id === currentUser.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Cedar Hall · Boys Dormitory</p>
            <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {greeting}, {currentUser.name}
            </h1>
            <p className="text-sm font-semibold text-amber-300 mt-1">{formatFullDate(today)}</p>
            <p className="text-sm text-slate-400 mt-1">
              {isOccupant
                ? `Room ${myRecord?.roomNumber || '—'} · Your standing and today's checks.`
                : 'Overview of today\'s checks and disciplinary standing.'}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold w-fit ${
            currentUser.role === 'superadmin' ? 'bg-purple-900/60 text-purple-300 border border-purple-600/40' :
            currentUser.role === 'admin' ? 'bg-blue-900/60 text-blue-300 border border-blue-600/40' :
            'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
          }`}>
            {currentUser.role === 'superadmin' ? 'DEAN' : currentUser.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Residents
          </div>
          <div className="text-2xl font-bold text-white mt-1">{occupants.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5" />
            Rooms
          </div>
          <div className="text-2xl font-bold text-white mt-1">{rooms.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Room Cleanliness
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {avgCleanliness !== null ? `${avgCleanliness}%` : '—'}
          </div>
        </div>
        <button
          onClick={() => onNavigate('performance')}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 text-left transition-colors"
        >
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Pending Violations
          </div>
          <div className={`text-2xl font-bold mt-1 ${activeViolations.length ? 'text-rose-400' : 'text-emerald-400'}`}>
            {activeViolations.length}
          </div>
        </button>
      </div>

      {/* Today's checks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm">Today's Checks</h2>
          <span className="text-xs text-slate-400">Tap to open</span>
        </div>
        <div className="divide-y divide-slate-800/70">
          {CHECKS.map(check => {
            const Icon = check.icon;
            return (
              <button
                key={check.id}
                onClick={() => onNavigate(check.id)}
                className="w-full min-h-touch flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-white">{check.label}</span>
                  <span className="block text-[11px] text-slate-400">{checkSubs[check.id] ?? check.sub}</span>
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  todayStats[check.id] && !todayStats[check.id].includes('0/')
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {todayStats[check.id]}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {canEdit && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm">Recent Violations</h2>
            <button
              onClick={() => onNavigate('performance')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Resident Performance <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {todayViolations.length === 0 ? (
            <p className="p-4 text-xs text-slate-500">No violations logged today.</p>
          ) : (
            <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-800/70">
              {todayViolations.map(v => (
                <div key={v.id} className="flex items-start gap-2.5 bg-slate-950/50 border-b border-slate-800/60 px-4 py-2.5">
                  <span className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    v.severity === 'major' ? 'bg-rose-950 text-rose-300' :
                    v.severity === 'moderate' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                  }`}>
                    +{v.demeritPoints} pts
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {v.studentName} <span className="text-slate-500 font-normal">· Room {v.roomNumber}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{v.description}</p>
                  </div>
                  <span className={`ml-auto shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    v.status === 'confirmed' ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50' :
                    v.status === 'pending_settlement' ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' :
                    'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                  }`}>
                    {v.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};