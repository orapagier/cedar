import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Moon, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Calendar,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  ClipboardList
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { DeanAdvicePanel } from './DeanAdvicePanel';

interface OverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const { 
    currentUser, 
    canEdit, 
    isOccupant, 
    users, 
    rooms, 
    inspections, 
    attendance, 
    curfewRecords, 
    chores, 
    cellphones, 
    violations, 
    lightsOutLogs,
    updateViolationStatus
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const activeViolations = violations.filter(v => v.status === 'pending_settlement' || v.status === 'confirmed');
  const totalDemerits = occupants.reduce((acc, occ) => acc + (occ.demeritPoints || 0), 0);

  // Cleanliness calculations
  const avgCleanliness = inspections.length > 0 
    ? Math.round(inspections.reduce((acc, i) => acc + i.score, 0) / inspections.length)
    : 100;
  const passedInspections = inspections.filter(i => i.status === 'pass').length;

  // Worship calculations
  const worshipRecords = attendance.filter(a => a.type.includes('worship'));
  const worshipPresent = worshipRecords.filter(a => a.status === 'present').length;
  const worshipRate = worshipRecords.length > 0 ? Math.round((worshipPresent / worshipRecords.length) * 100) : 100;
  const biblesPresent = worshipRecords.filter(a => a.broughtBible).length;
  const bibleRate = worshipRecords.length > 0 ? Math.round((biblesPresent / worshipRecords.length) * 100) : 100;

  // Cellphone vault calculations
  const phonesInVault = cellphones.filter(c => c.custodyStatus === 'in_vault').length;
  const phonesConfiscated = cellphones.filter(c => c.custodyStatus === 'confiscated').length;

  // Occupant personal data if logged in as occupant
  const myOccupantRecord = occupants.find(o => o.id === currentUser.id);
  const myRoom = rooms.find(r => r.occupantIds.includes(currentUser.id));
  const myViolations = violations.filter(v => v.studentId === currentUser.id);
  const myChores = chores.filter(c => c.studentId === currentUser.id);
  const myPhone = cellphones.find(c => c.studentId === currentUser.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isOccupant ? `Welcome, Resident ${currentUser.name}` : `Dean Command Center`}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                currentUser.role === 'superadmin' ? 'bg-purple-900/60 text-purple-300 border border-purple-600/40' :
                currentUser.role === 'admin' ? 'bg-blue-900/60 text-blue-300 border border-blue-600/40' :
                'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
              }`}>
                {currentUser.role === 'superadmin' ? 'DEAN' : currentUser.role.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {isOccupant 
                ? `Assigned Room: ${myRoom ? `Room ${myRoom.roomNumber} (${myRoom.wing})` : 'Unassigned'} • Real-Time Personal Standing`
                : 'Real-time monitoring of all 12 dormitory policies, inspections, and discipline enforcement.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!canEdit && (
              <div className="bg-slate-800/90 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Occupant View-Only Mode</span>
              </div>
            )}
            <button
              onClick={() => {
                const el = document.getElementById('operational-registries');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3.5 py-2 min-h-touch rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Operational Registries</span>
            </button>
            <button
              onClick={() => onNavigate('violations')}
              className="bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/50 text-rose-300 px-3.5 py-2 min-h-touch rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Active Violations ({activeViolations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK DATA SETUP CARD FOR ACTUAL NAMES, ROOMS & ADMIN EMAILS */}
      {canEdit && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Entering Actual Dormitory Records
                </h2>
                <span className="text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                  Dean Setup Guide
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                To replace demo data with your real dormitory roster, use the buttons below to add <strong>actual student names</strong>, create your <strong>dorm rooms</strong>, or register <strong>assistant dean admin emails</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate('occupants')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <span>+ Enter Students & Rooms</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('rbac')}
                className="bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-600/50 font-semibold px-3.5 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-1.5 transition-all"
              >
                <span>+ Register Admin Emails</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If logged in as Occupant: Personal Compliance Card */}
      {isOccupant && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 text-slate-200">
          <div className="flex items-center justify-between border-b border-emerald-800/40 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-white">Your Resident Compliance Passport</h2>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              (myOccupantRecord?.demeritPoints || 0) === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              (myOccupantRecord?.demeritPoints || 0) < 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {myOccupantRecord?.demeritPoints || 0} Demerit Points
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Assigned Room</span>
              <span className="text-white font-bold text-base">Room {myRoom?.roomNumber || 'N/A'}</span>
              <span className="text-slate-400 text-[11px] block">{myRoom?.wing} • Captain: {myRoom?.captainName}</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Cellphone Vault Status</span>
              <span className="text-emerald-400 font-bold text-base flex items-center space-x-1">
                <Smartphone className="w-4 h-4" />
                <span>{myPhone?.custodyStatus === 'in_vault' ? 'Safely in Vault' : myPhone?.custodyStatus || 'Not Logged'}</span>
              </span>
              <span className="text-slate-400 text-[11px] block">Slot: {myPhone?.lockerVaultNumber || 'Unassigned'}</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Weekly Chore Duty</span>
              <span className="text-amber-300 font-bold text-sm block truncate">
                {myChores[0]?.dutyArea || 'No chore assigned'}
              </span>
              <span className="text-slate-400 text-[11px] block">Status: {myChores[0]?.status || 'Pending'}</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Disciplinary Standing</span>
              <span className={`font-bold text-base ${
                (myOccupantRecord?.demeritPoints || 0) === 0 ? 'text-emerald-400' :
                (myOccupantRecord?.demeritPoints || 0) < 5 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {(myOccupantRecord?.demeritPoints || 0) === 0 ? 'Good Standing' : 'Under Notice'}
              </span>
              <span className="text-slate-400 text-[11px] block">{myViolations.length} total infractions</span>
            </div>
          </div>
        </div>
      )}

      {/* Core Policy Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room Cleanliness Card */}
        <div 
          onClick={() => onNavigate('inspections')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md">
              {passedInspections}/{inspections.length} Rooms Clean
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">1. Room & CR Cleanliness</h3>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white">{avgCleanliness}%</span>
            <span className="text-xs text-slate-400">Daily Average</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Beds, Lockers, CR, Personal Items</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Worship & Church Attendance Card */}
        <div 
          onClick={() => onNavigate('worship')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-600/40 px-2 py-0.5 rounded-md">
              {bibleRate}% Bibles Brought
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">2 & 3. Worship & Bibles</h3>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white">{worshipRate}%</span>
            <span className="text-xs text-slate-400">Punctual Roll Call</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Morning & Evening + Midweek/Church</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Curfew & Lights-out Card */}
        <div 
          onClick={() => onNavigate('curfew')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Moon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-600/40 px-2 py-0.5 rounded-md">
              10:00 PM Policy
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">4 & 11. Curfew & Lights Out</h3>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white">
              {curfewRecords.filter(c => c.status === 'in_dorm').length}/{curfewRecords.length}
            </span>
            <span className="text-xs text-slate-400">In Dorm Before 9 PM</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Noise & unauthorized gadget checks</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Cellphone Custody Vault Card */}
        <div 
          onClick={() => onNavigate('cellphones')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            {phonesConfiscated > 0 ? (
              <span className="text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-600/40 px-2 py-0.5 rounded-md">
                {phonesConfiscated} Confiscated
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded-md">
                100% Secured
              </span>
            )}
          </div>
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">12. Cellphone Safe Vault</h3>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white">{phonesInVault} in Vault</span>
            <span className="text-xs text-slate-400">Sun PM ➔ Fri PM</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Mandatory custody lockbox</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Quick Action Bar for Dean / Admins */}
      {canEdit && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Fast Dean Action Triggers (Save Records)</span>
            </h3>
            <span className="text-[11px] text-slate-500">Only Super Admin & Admin can save records</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => onNavigate('inspections')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white p-3 min-h-touch rounded-xl text-xs font-medium text-left transition-all"
            >
              <div className="font-semibold text-amber-300">Room Inspection</div>
              <div className="text-[10px] text-slate-400">Score beds, lockers, CR</div>
            </button>

            <button
              onClick={() => onNavigate('worship')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white p-3 min-h-touch rounded-xl text-xs font-medium text-left transition-all"
            >
              <div className="font-semibold text-blue-300">Worship Roll Call</div>
              <div className="text-[10px] text-slate-400">Track Bible & tardiness</div>
            </button>

            <button
              onClick={() => onNavigate('uniform')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white p-3 min-h-touch rounded-xl text-xs font-medium text-left transition-all"
            >
              <div className="font-semibold text-emerald-300">Gate Uniform Log</div>
              <div className="text-[10px] text-slate-400">Check morning departure</div>
            </button>

            <button
              onClick={() => onNavigate('study')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white p-3 min-h-touch rounded-xl text-xs font-medium text-left transition-all"
            >
              <div className="font-semibold text-indigo-300">Study Hall & Library</div>
              <div className="text-[10px] text-slate-400">7:30 PM quiet focus</div>
            </button>

            <button
              onClick={() => onNavigate('curfew')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white p-3 min-h-touch rounded-xl text-xs font-medium text-left transition-all"
            >
              <div className="font-semibold text-purple-300">Curfew & Lights Out</div>
              <div className="text-[10px] text-slate-400">9 PM in / 10 PM dark</div>
            </button>

            <button
              onClick={() => onNavigate('cellphones')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white p-3 min-h-touch rounded-xl text-xs font-medium text-left transition-all"
            >
              <div className="font-semibold text-rose-300">Phone Custody Safe</div>
              <div className="text-[10px] text-slate-400">Sun turn-in / Fri release</div>
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Violation & Demerit Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Real-Time Rule Violation & Demerit Stream</h2>
              <p className="text-xs text-slate-400">Live incidents logged by Deans and Resident Assistants</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('violations')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1"
          >
            <span>Full Disciplinary Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {violations.slice(0, 5).map(violation => (
            <div 
              key={violation.id}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 p-1.5 rounded-lg border text-xs font-bold ${
                  violation.severity === 'major' ? 'bg-rose-950/70 border-rose-700 text-rose-300' :
                  violation.severity === 'moderate' ? 'bg-amber-950/70 border-amber-700 text-amber-300' :
                  'bg-blue-950/70 border-blue-700 text-blue-300'
                }`}>
                  +{violation.demeritPoints} Demerits
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm">{violation.studentName}</span>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Room {violation.roomNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">{violation.date} {violation.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{violation.description}</p>
                  {violation.actionRequired && (
                    <div className="text-[11px] text-amber-300/90 mt-1 flex items-center space-x-1">
                      <span className="font-medium">Mandated Action:</span>
                      <span>{violation.actionRequired}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                  violation.status === 'confirmed' ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50' :
                  violation.status === 'pending_settlement' ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' :
                  'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                }`}>
                  {violation.status.replace('_', ' ')}
                </span>

                {canEdit && violation.status !== 'cleared_service' && (
                  <button
                    onClick={() => updateViolationStatus(violation.id, 'cleared_service', 'Completed dorm maintenance service')}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 min-h-touch rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                  >
                    Clear via Service
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dean's Operational Checklist & Specialized Registries Integrated into Main Dashboard */}
      <div id="operational-registries" className="pt-2">
        <DeanAdvicePanel onNavigate={onNavigate} />
      </div>
    </div>
  );
};
