import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Lock,
  Unlock,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Users,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { PhoneDepositLog } from '../types/dorm';
import { manilaToday, manilaTime, manilaTimeValue, formatFullDate, formatTime12h } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40';

type DepositStatus = PhoneDepositLog['status'];

const DEPOSIT_META: Record<DepositStatus, {
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
  chip: string;
}> = {
  deposited: {
    label: 'Deposited',
    short: 'Deposited',
    icon: CheckCircle2,
    active: 'bg-emerald-600 text-white',
    chip: 'bg-emerald-950 text-emerald-300',
  },
  late: {
    label: 'Late',
    short: 'Late deposit',
    icon: AlertTriangle,
    active: 'bg-amber-500 text-slate-950',
    chip: 'bg-amber-950 text-amber-300',
  },
  not_deposited: {
    label: 'Not deposited',
    short: 'Not deposited',
    icon: XCircle,
    active: 'bg-rose-600 text-white',
    chip: 'bg-rose-950 text-rose-300',
  },
};

export const CellphoneCustodyView: React.FC = () => {
  const {
    cellphones,
    phoneDeposits,
    users,
    rooms,
    updateCellphoneStatus,
    savePhoneDepositBatch,
    canEdit,
    currentUser,
    saveViolation,
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const today = useManilaToday();

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [depositTime, setDepositTime] = useState(() => manilaTimeValue());
  const [remarks, setRemarks] = useState('');
  const [statuses, setStatuses] = useState<Record<string, DepositStatus>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const inVaultCount = cellphones.filter(c => c.custodyStatus === 'in_vault').length;
  const confiscatedCount = cellphones.filter(c => c.custodyStatus === 'confiscated').length;
  const withStudentCount = cellphones.filter(c => c.custodyStatus === 'with_student').length;

  /** Today's logged deposit for a resident, if the roll call already ran. */
  const todayDeposit = (studentId: string) =>
    phoneDeposits.find(d => d.studentId === studentId && d.date === today);

  const statusFor = (studentId: string): DepositStatus =>
    statuses[studentId] ?? todayDeposit(studentId)?.status ?? 'deposited';

  const setStatus = (studentId: string, status: DepositStatus) =>
    setStatuses(prev => ({ ...prev, [studentId]: status }));

  const submitRoom = () => {
    if (!canEdit || !roomOccupants.length) return;
    savePhoneDepositBatch(
      roomOccupants.map(student => ({
        date: today,
        studentId: student.id,
        studentName: student.name,
        roomNumber: student.roomNumber || '—',
        status: statusFor(student.id),
        depositTime,
        remarks: remarks || undefined,
        recordedBy: currentUser.name,
      }))
    );
    setRemarks('');
    flash(`Logged phone deposits for ${roomOccupants.length} residents in Room ${selectedRoom}.`);
  };

  const handleReleaseFriday = (id: string) => {
    if (!canEdit) return;
    updateCellphoneStatus(id, {
      returnedFriday: true,
      returnTime: `Fri ${manilaTime()}`,
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
      demeritPoints: 1,
      reportedBy: currentUser.name,
      status: 'confirmed',
      actionRequired: 'Confiscated until end of term + Dean interview with parent.',
    });
  };

  const checkedToday = roomOccupants.filter(o => todayDeposit(o.id)).length;

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
            Room by room, check each resident individually — phone deposited, deposited late, or not handed in at all.
          </p>
        </div>

        {!canEdit && (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 self-start">
            <Lock className="w-3.5 h-3.5" />
            <span>View-only access</span>
          </div>
        )}
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Custody metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">In Safe Vault</span>
            <div className="text-2xl font-bold text-emerald-400">{inVaultCount}</div>
            <span className="text-[10px] text-slate-500">Deposited</span>
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

      {/* By-room deposit roll call */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Deposit Check by Room</h3>
          </div>
          <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className={`${FIELD} sm:max-w-[220px]`}>
            {roomNumbers.length === 0 ? (
              <option value="">No residents on file</option>
            ) : (
              roomNumbers.map(room => (
                <option key={room} value={room}>
                  Room {room}
                  {rooms.find(r => r.roomNumber === room)?.wing ? ` · ${rooms.find(r => r.roomNumber === room)?.wing}` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="p-3 sm:p-4 border-b border-slate-800/70 flex flex-col sm:flex-row gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Deposit time
            </label>
            <input
              type="time"
              value={depositTime}
              onChange={e => setDepositTime(e.target.value)}
              disabled={!canEdit}
              className={`${FIELD} sm:max-w-[200px] disabled:opacity-40`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Vault remarks</label>
            <input
              type="text"
              placeholder="e.g. Came in after lights-out"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={!canEdit}
              className={`${FIELD} disabled:opacity-40`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">Room {selectedRoom || '—'}</span> · {roomOccupants.length} residents
          </p>
          <p className="text-xs text-slate-400">{checkedToday}/{roomOccupants.length} checked today</p>
        </div>

        <div className="divide-y divide-slate-800/70">
          {roomOccupants.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
          )}
          {roomOccupants.map(student => {
            const item = cellphones.find(c => c.studentId === student.id);
            const logged = todayDeposit(student.id);
            const status = statusFor(student.id);
            const isConfiscated = item?.custodyStatus === 'confiscated';

            return (
              <div key={student.id} className={`p-3 sm:p-4 space-y-2.5 ${isConfiscated ? 'bg-rose-950/10' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item ? `${item.deviceModel} · Locker ${item.lockerVaultNumber}` : 'No phone on file'}
                    </p>
                    {logged && (
                      <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${DEPOSIT_META[logged.status].chip}`}>
                        {DEPOSIT_META[logged.status].short} · {formatTime12h(logged.depositTime)}
                      </span>
                    )}
                  </div>
                  {item && (
                    <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isConfiscated ? 'bg-rose-900 text-rose-300' :
                      item.custodyStatus === 'in_vault' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                      'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {item.custodyStatus.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {canEdit ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(DEPOSIT_META) as DepositStatus[]).map(s => {
                      const meta = DEPOSIT_META[s];
                      const Icon = meta.icon;
                      const selected = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-label={`${student.name}: ${meta.label}`}
                          aria-pressed={selected}
                          onClick={() => setStatus(student.id, s)}
                          className={`min-h-touch px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                            selected ? meta.active : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                    {item && (
                      <>
                        <span className="w-px bg-slate-800 mx-0.5 self-stretch" aria-hidden="true" />
                        <button
                          onClick={() => handleReleaseFriday(item.id)}
                          className="min-h-touch bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Release
                        </button>
                        <button
                          onClick={() => handleConfiscate(item)}
                          className="min-h-touch bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 px-2.5 rounded-xl text-[11px] font-semibold"
                          title="Confiscate unauthorized secondary phone"
                        >
                          Confiscate
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold ${DEPOSIT_META[status].chip}`}>
                    {DEPOSIT_META[status].short}
                  </span>
                )}

                {item?.remarks && (
                  <p className="text-[10px] text-amber-300/80 italic">"{item.remarks}"</p>
                )}
              </div>
            );
          })}
        </div>

        {canEdit && roomOccupants.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
            <button
              onClick={submitRoom}
              className="w-full min-h-touch bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>Save Room {selectedRoom} Deposit Check</span>
            </button>
          </div>
        )}
      </div>

      {/* Deposit log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            Phone Deposit Log
          </h3>
          <span className="text-xs text-slate-400">{phoneDeposits.length} entries</span>
        </div>
        {phoneDeposits.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No deposit checks recorded yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {phoneDeposits.map(d => (
            <div key={d.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{d.studentName}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${DEPOSIT_META[d.status].chip}`}>
                    {DEPOSIT_META[d.status].short.toUpperCase()}
                  </span>
                </div>
                <span className="shrink-0 font-mono font-bold text-xs text-slate-300">{formatTime12h(d.depositTime)}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room {d.roomNumber} · {formatFullDate(d.date)} · by {d.recordedBy}
              </p>
              {d.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{d.remarks}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
