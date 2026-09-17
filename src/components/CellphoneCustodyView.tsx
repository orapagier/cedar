import React, { useState } from 'react';
import {
  Smartphone,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { manilaToday, manilaTime } from '../utils/date';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40';

export const CellphoneCustodyView: React.FC = () => {
  const { cellphones, users, updateCellphoneStatus, canEdit, currentUser, saveViolation } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const roomNumbers = Array.from(new Set(cellphones.map(c => c.roomNumber).filter(Boolean))).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');

  const roomItems = cellphones.filter(c => c.roomNumber === selectedRoom);
  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  const inVaultCount = cellphones.filter(c => c.custodyStatus === 'in_vault').length;
  const confiscatedCount = cellphones.filter(c => c.custodyStatus === 'confiscated').length;
  const withStudentCount = cellphones.filter(c => c.custodyStatus === 'with_student').length;

  const handleTurnInSunday = (id: string) => {
    if (!canEdit) return;
    const timeStr = manilaTime();
    updateCellphoneStatus(id, {
      turnedOverSunday: true,
      turnOverTime: `Sun ${timeStr}`,
      returnedFriday: false,
      custodyStatus: 'in_vault',
    });
  };

  const handleReleaseFriday = (id: string) => {
    if (!canEdit) return;
    const timeStr = manilaTime();
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
      date: manilaToday(),
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
            <h2 className="text-base sm:text-lg font-bold text-white">Phone Vault Custody</h2>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
              Digital Well-Being
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory turnover of all cellphones every Sunday evening (vault lockup), released every Friday afternoon.
          </p>
        </div>

        {!canEdit && (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 self-start">
            <Lock className="w-3.5 h-3.5" />
            <span>View-only access</span>
          </div>
        )}
      </div>

      {/* Custody metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">In Safe Vault</span>
            <div className="text-2xl font-bold text-emerald-400">{inVaultCount}</div>
            <span className="text-[10px] text-slate-500">Sunday lockup</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Released</span>
            <div className="text-2xl font-bold text-blue-400">{withStudentCount}</div>
            <span className="text-[10px] text-slate-500">Friday return</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Unlock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Confiscated</span>
            <div className="text-2xl font-bold text-rose-400">{confiscatedCount}</div>
            <span className="text-[10px] text-slate-500">Undeclared phones</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* By-room custody */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Vault Custody by Room</h3>
          </div>
          <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className={`${FIELD} sm:max-w-[220px]`}>
            {roomNumbers.length === 0 ? (
              <option value="">No phone records</option>
            ) : (
              roomNumbers.map(room => (
                <option key={room} value={room}>Room {room}</option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">Room {selectedRoom || '—'}</span> · {roomOccupants.length} residents
          </p>
        </div>

        <div className="divide-y divide-slate-800/70">
          {roomOccupants.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
          )}
          {roomOccupants.map(student => {
            const item = roomItems.find(c => c.studentId === student.id);
            if (!item) {
              return (
                <div key={student.id} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-800 text-slate-500">
                    No phone on file
                  </span>
                </div>
              );
            }
            const isVault = item.custodyStatus === 'in_vault';
            const isConfiscated = item.custodyStatus === 'confiscated';
            return (
              <div key={item.id} className={`p-3 sm:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${isConfiscated ? 'bg-rose-950/10' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm truncate">{item.studentName}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isConfiscated ? 'bg-rose-900 text-rose-300' :
                      isVault ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                      'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {item.custodyStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {item.deviceModel} · Locker {item.lockerVaultNumber}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-4">
                    <span className={item.turnedOverSunday ? 'text-emerald-400' : 'text-rose-400 font-medium'}>
                      Sun turn-in: {item.turnOverTime || (item.turnedOverSunday ? 'Logged' : 'Missing')}
                    </span>
                    <span className={item.returnedFriday ? 'text-blue-300' : 'text-slate-500'}>
                      Fri return: {item.returnTime || (item.returnedFriday ? 'Released' : 'Pending')}
                    </span>
                  </div>
                  {item.remarks && (
                    <p className="text-[10px] text-amber-300/80 italic mt-0.5">"{item.remarks}"</p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleTurnInSunday(item.id)}
                      className="min-h-touch bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Lock className="w-3.5 h-3.5" /> Turn-in
                    </button>
                    <button
                      onClick={() => handleReleaseFriday(item.id)}
                      className="min-h-touch bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Return
                    </button>
                    <button
                      onClick={() => handleConfiscate(item)}
                      className="min-h-touch bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
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