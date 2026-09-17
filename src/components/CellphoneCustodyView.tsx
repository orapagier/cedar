import React, { useState } from 'react';
import { 
  Smartphone, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Search,
  Calendar
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

export const CellphoneCustodyView: React.FC = () => {
  const { cellphones, updateCellphoneStatus, canEdit, currentUser, saveViolation } = useDorm();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = cellphones.filter(c => 
    c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.roomNumber.includes(searchTerm) ||
    c.lockerVaultNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inVaultCount = cellphones.filter(c => c.custodyStatus === 'in_vault').length;
  const confiscatedCount = cellphones.filter(c => c.custodyStatus === 'confiscated').length;
  const withStudentCount = cellphones.filter(c => c.custodyStatus === 'with_student').length;

  const handleTurnInSunday = (id: string, name: string, room: string) => {
    if (!canEdit) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateCellphoneStatus(id, {
      turnedOverSunday: true,
      turnOverTime: `Sun ${timeStr}`,
      returnedFriday: false,
      custodyStatus: 'in_vault',
    });
  };

  const handleReleaseFriday = (id: string) => {
    if (!canEdit) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateCellphoneStatus(id, {
      returnedFriday: true,
      returnTime: `Fri ${timeStr}`,
      custodyStatus: 'with_student',
    });
  };

  const handleConfiscate = (c: typeof cellphones[0]) => {
    if (!canEdit) return;
    const reason = prompt('Reason for device confiscation (e.g. Secret backup phone detected during lights-out):');
    if (!reason) return;

    updateCellphoneStatus(c.id, {
      custodyStatus: 'confiscated',
      remarks: `CONFISCATED: ${reason}`,
    });

    saveViolation({
      date: new Date().toISOString().split('T')[0],
      studentId: c.studentId,
      studentName: c.studentName,
      roomNumber: c.roomNumber,
      category: 'cellphone_policy_breach',
      severity: 'major',
      description: `Device confiscation (${c.deviceModel}): ${reason}`,
      demeritPoints: 5,
      reportedBy: currentUser.name,
      status: 'confirmed',
      actionRequired: 'Confiscated until end of term + Dean interview with parent.',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">12. Cellphone Vault Custody & Weekend Return</h2>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
              Digital Well-Being Policy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory turnover of all cellphones every Sunday evening (locked in safe vault), released every Friday afternoon.
          </p>
        </div>

        {canEdit ? (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5" />
            <span>Vault Master Key Custodian</span>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {/* Custody Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Locked in Safe Vault</span>
            <div className="text-2xl font-bold text-emerald-400">{inVaultCount} Phones</div>
            <span className="text-[10px] text-slate-500">Sunday evening lockup</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Released to Students</span>
            <div className="text-2xl font-bold text-blue-400">{withStudentCount} Phones</div>
            <span className="text-[10px] text-slate-500">Friday afternoon weekend release</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Unlock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Confiscated Devices</span>
            <div className="text-2xl font-bold text-rose-400">{confiscatedCount} Devices</div>
            <span className="text-[10px] text-slate-500">Undeclared secondary phones</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Locker Vault Grid & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-rose-400" />
            <span>Digital Vault Lockers & Roster</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resident, room or vault #..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 min-h-touch text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => {
            const isVault = item.custodyStatus === 'in_vault';
            const isConfiscated = item.custodyStatus === 'confiscated';
            return (
              <div 
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isConfiscated ? 'bg-rose-950/20 border-rose-600/50' :
                  isVault ? 'bg-slate-950/70 border-emerald-600/40' :
                  'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                    {item.lockerVaultNumber}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isConfiscated ? 'bg-rose-900 text-rose-300' :
                    isVault ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                    'bg-blue-950 text-blue-300 border border-blue-700'
                  }`}>
                    {item.custodyStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm font-bold text-white">{item.studentName}</div>
                <div className="text-xs text-slate-400">Room {item.roomNumber} • {item.deviceModel}</div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Sunday Turnover:</span>
                    <span className={item.turnedOverSunday ? 'text-emerald-400 font-medium' : 'text-rose-400 font-bold'}>
                      {item.turnOverTime || (item.turnedOverSunday ? 'Logged' : 'Missing Turn-in')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friday Return:</span>
                    <span className={item.returnedFriday ? 'text-blue-300' : 'text-slate-500'}>
                      {item.returnTime || (item.returnedFriday ? 'Released' : 'Pending Friday')}
                    </span>
                  </div>
                  {item.remarks && (
                    <div className="text-amber-300/80 text-[10px] italic pt-1">
                      "{item.remarks}"
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleTurnInSunday(item.id, item.studentName, item.roomNumber)}
                      className="flex-1 min-h-touch bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      Sun Turn-in (Lock)
                    </button>
                    <button
                      onClick={() => handleReleaseFriday(item.id)}
                      className="flex-1 min-h-touch bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      Fri Return
                    </button>
                    <button
                      onClick={() => handleConfiscate(item)}
                      className="min-h-touch bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors"
                      title="Confiscate unauthorized secondary phone"
                    >
                      Confiscate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
