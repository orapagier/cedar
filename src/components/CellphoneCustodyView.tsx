import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Users,
  ChevronDown,
  PhoneOutgoing,
  PhoneIncoming,
  CalendarClock,
  Ban,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { RecordOverrideControls } from './RecordOverrideControls';
import { PhoneDepositLog } from '../types/dorm';
import { manilaToday, manilaTime, manilaTimeValue, formatFullDate, formatTime12h } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';
import { vaultCycle, describeCyclePoint, vaultCustodyExemption, cycleExcuseReason } from '../utils/phoneVault';

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
  excused: {
    label: 'Excused',
    short: 'Excused',
    icon: ShieldCheck,
    active: 'bg-sky-600 text-white',
    chip: 'bg-sky-950 text-sky-300',
  },
};

const STATUS_ORDER: DepositStatus[] = ['deposited', 'late', 'not_deposited', 'excused'];

export const CellphoneCustodyView: React.FC = () => {
  const {
    cellphones,
    phoneDeposits,
    phoneBorrows,
    users,
    rooms,
    settings,
    medicalSlips,
    gatePasses,
    updateCellphoneStatus,
    setPhoneExemption,
    savePhoneDepositBatch,
    savePhoneBorrow,
    returnPhoneBorrow,
    releaseAllPhones,
    canEdit,
    isSuperAdmin,
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
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Borrow slip
  const [borrowStudentId, setBorrowStudentId] = useState('');
  const [borrowReason, setBorrowReason] = useState('');
  const [borrowOut, setBorrowOut] = useState(() => manilaTimeValue());
  const [borrowBack, setBorrowBack] = useState('');

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  // The cycle the check being logged belongs to — the deadline it is measured
  // against, and whether that deadline has already gone by.
  const cycle = vaultCycle(today, depositTime, settings);
  const dueLabel = describeCyclePoint(settings.phoneDepositDay, settings.phoneDepositTime);
  const releaseLabel = describeCyclePoint(settings.phoneReleaseDay, settings.phoneReleaseTime);

  const inVaultCount = cellphones.filter(c => c.custodyStatus === 'in_vault').length;
  const borrowedCount = cellphones.filter(c => c.custodyStatus === 'borrowed').length;
  const withStudentCount = cellphones.filter(c => c.custodyStatus === 'with_student').length;
  const confiscatedCount = cellphones.filter(c => c.custodyStatus === 'confiscated').length;

  /** This cycle's deposit records, whichever day they were taken. */
  const cycleDeposits = phoneDeposits.filter(d => (d.cycleDate ?? d.date) === cycle.deadlineDate);
  const depositFor = (studentId: string) => cycleDeposits.find(d => d.studentId === studentId);

  /**
   * Why a resident is out of this room's roll call: their device is exempt or
   * confiscated, or they are excused for the cycle. A resident whose phone was
   * simply never registered is still checked — the first deposit registers it.
   */
  const rollCallExcuse = (studentId: string) => {
    const student = occupants.find(o => o.id === studentId);
    if (!student) return null;
    const custody = vaultCustodyExemption(studentId, cellphones);
    if (custody && custody !== 'No phone on file') return custody;
    return cycleExcuseReason(student, cycle.deadlineDate, { medicalSlips, gatePasses });
  };

  const statusFor = (studentId: string): DepositStatus =>
    statuses[studentId] ?? depositFor(studentId)?.status ?? 'deposited';

  const setStatus = (studentId: string, status: DepositStatus) =>
    setStatuses(prev => ({ ...prev, [studentId]: status }));

  // Residents to roll call: anyone in the room the vault still expects a phone from.
  const checkable = roomOccupants.filter(o => !rollCallExcuse(o.id));
  const checkedThisCycle = checkable.filter(o => depositFor(o.id)).length;
  // A record the deadline logged on its own is a guess at a silent resident, so
  // a phone turning up late is still worth taking; a person's check is not.
  const settled = (studentId: string) => {
    const d = depositFor(studentId);
    return d && !d.autoLogged ? d : undefined;
  };
  const stillToTake = () => checkable.filter(o => !settled(o.id));
  const remaining = stillToTake().length;

  const submitRoom = () => {
    if (!canEdit || !checkable.length) return;
    const { filed } = savePhoneDepositBatch(
      checkable.map(student => ({
        date: today,
        cycleDate: cycle.deadlineDate,
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
    flash(
      filed === 0
        ? `Room ${selectedRoom} is already checked for this cycle — nothing changed.`
        : `Logged ${filed} phone ${filed === 1 ? 'deposit' : 'deposits'} for Room ${selectedRoom}` +
            (cycle.deadlinePassed ? ' — past the deadline, so deposits saved as late.' : '.')
    );
  };

  /** One resident's phone logged on its own, as he hands it over. */
  const submitStudent = (student: (typeof occupants)[number]) => {
    if (!canEdit) return;
    const { filed } = savePhoneDepositBatch([{
      date: today,
      cycleDate: cycle.deadlineDate,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      status: statusFor(student.id),
      depositTime,
      remarks: remarks || undefined,
      recordedBy: currentUser.name,
    }]);
    flash(
      filed
        ? `${student.name}'s phone logged at ${formatTime12h(depositTime)}` +
            (cycle.deadlinePassed ? ' — past the deadline, so it saved as late.' : '.')
        : `${student.name} is already checked for this cycle — the hand-over on file stands.${
            isSuperAdmin ? ' Use the pencil on his row to correct it.' : ' Ask the Dean to correct it.'
          }`
    );
  };

  const markAll = (status: DepositStatus) =>
    setStatuses(prev => ({ ...prev, ...Object.fromEntries(checkable.map(o => [o.id, status])) }));

  /** Excuse one resident for this cycle, clearing any flag already raised. */
  const excuseResident = (studentId: string) => {
    const student = occupants.find(o => o.id === studentId);
    if (!canEdit || !student) return;
    savePhoneDepositBatch([{
      date: today,
      cycleDate: cycle.deadlineDate,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      status: 'excused',
      depositTime,
      remarks: 'Excused from this vault cycle.',
      recordedBy: currentUser.name,
    }], { replace: true });
    flash(`${student.name} excused from the cycle due ${dueLabel}.`);
  };

  const handleRelease = (id: string) => {
    if (!canEdit) return;
    updateCellphoneStatus(id, {
      returnedFriday: true,
      returnTime: manilaTime(),
      custodyStatus: 'with_student',
    });
  };

  const handleReleaseAll = () => {
    if (!canEdit) return;
    if (!window.confirm(`Release all ${inVaultCount + borrowedCount} phones back to their owners?`)) return;
    releaseAllPhones();
    flash('All vaulted phones released to their owners.');
  };

  const toggleExempt = (studentId: string) => {
    const phone = cellphones.find(c => c.studentId === studentId);
    setPhoneExemption(studentId, phone?.custodyStatus !== 'exempted');
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
      demerits: 1,
      reportedBy: currentUser.name,
      status: 'confirmed',
    });
  };

  // ---- Borrowing ----
  const openBorrows = phoneBorrows.filter(b => b.status === 'out');

  /**
   * Residents whose phone can be signed out: everyone the vault holds a phone
   * for, plus those whose device was never registered — the borrow slip
   * registers it, the way the roll call does. Exempt, confiscated and
   * already-borrowed devices are out.
   */
  const borrowable = occupants.filter(o => {
    const phone = cellphones.find(c => c.studentId === o.id);
    if (phone && (phone.custodyStatus === 'exempted' || phone.custodyStatus === 'confiscated')) return false;
    return !openBorrows.some(b => b.studentId === o.id);
  });

  /** Where a resident's phone sits right now, for the borrow list. */
  const custodyNote = (studentId: string) => {
    const phone = cellphones.find(c => c.studentId === studentId);
    if (!phone) return 'not yet registered';
    if (phone.custodyStatus === 'in_vault') return 'in vault';
    return phone.custodyStatus.replace(/_/g, ' ');
  };

  const isOverdue = (borrowedDate: string, expectedReturnTime: string) =>
    borrowedDate < today || (borrowedDate === today && manilaTimeValue() > expectedReturnTime);

  const startBorrow = () => {
    const student = occupants.find(o => o.id === borrowStudentId);
    if (!canEdit || !student || !borrowReason.trim()) return;
    savePhoneBorrow({
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      reason: borrowReason.trim(),
      borrowedDate: today,
      borrowedTime: borrowOut,
      expectedReturnTime: borrowBack || borrowOut,
      approvedBy: currentUser.name,
    });
    setBorrowStudentId('');
    setBorrowReason('');
    setBorrowBack('');
    flash(`${student.name}'s phone signed out of the vault.`);
  };

  // Residents the deadline flagged for handing in nothing at all.
  const missedThisCycle = cycleDeposits.filter(d => d.status === 'not_deposited');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Phone Vault Custody</h2>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
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

      {/* This week's cycle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
              <CalendarClock className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm">This Week's Cycle</h3>
              <p className="text-[11px] text-slate-400">
                Due <span className="text-white font-semibold">{dueLabel}</span>
                {' · '}back out <span className="text-white font-semibold">{releaseLabel}</span>
              </p>
              <p className="text-[11px] text-slate-500 truncate">Deadline: {formatFullDate(cycle.deadlineDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg ${
              cycle.deadlinePassed ? 'bg-amber-950 text-amber-300 border border-amber-700/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
            }`}>
              {cycle.deadlinePassed ? 'Deadline passed' : 'Before deadline'}
            </span>
            {canEdit && (inVaultCount > 0 || borrowedCount > 0) && (
              <button
                onClick={handleReleaseAll}
                className="min-h-touch bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" /> Release all
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-800 pt-2.5 leading-relaxed">
          Deposits logged after {dueLabel} save as <span className="text-amber-300 font-semibold">late</span>. Once the
          deadline passes, a resident with no record is flagged for{' '}
          <span className="text-rose-300 font-semibold">not depositing</span> — unless they are excused or have no phone
          on file. Change these times under Schedule Settings.
        </p>
      </div>

      {/* Custody metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            <span className="text-xs text-slate-400">Borrowed</span>
            <div className="text-2xl font-bold text-violet-400">{borrowedCount}</div>
            <span className="text-[10px] text-slate-500">Signed out now</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <PhoneOutgoing className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">With Residents</span>
            <div className="text-2xl font-bold text-blue-400">{withStudentCount}</div>
            <span className="text-[10px] text-slate-500">Out of the vault</span>
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

        {cycle.deadlinePassed && canEdit && (
          <p className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-900/50 text-[11px] text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
            <span>{formatTime12h(depositTime)} is past the {dueLabel} deadline — anything marked deposited is saved as a late deposit.</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400 min-w-0 truncate">
            <span className="font-semibold text-white">Room {selectedRoom || '—'}</span> · {checkedThisCycle}/{checkable.length} checked
          </p>
          {canEdit && checkable.length > 0 && (
            <button
              onClick={() => markAll('deposited')}
              className="shrink-0 min-h-touch px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              All in
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800/70">
          {roomOccupants.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
          )}
          {roomOccupants.map(student => {
            const item = cellphones.find(c => c.studentId === student.id);
            const logged = depositFor(student.id);
            const status = statusFor(student.id);
            const excuse = rollCallExcuse(student.id);
            const open = openRow === student.id;

            return (
              <div key={student.id} className={item?.custodyStatus === 'confiscated' ? 'bg-rose-950/10' : ''}>
                {/* Name on the left, the call on the right, one line. */}
                <div className="p-3 sm:p-4 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : student.id)}
                    aria-expanded={open}
                    className="min-w-0 flex-1 flex items-center gap-1.5 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate" title={student.name}>{student.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item ? item.deviceModel : 'Smartphone (not yet registered)'}
                        {logged ? ` · ${DEPOSIT_META[logged.status].short} ${formatTime12h(logged.depositTime)}` : ''}
                      </p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {excuse ? (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-1.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-800/60 max-w-[45%] truncate">
                      {excuse}
                    </span>
                  ) : settled(student.id) ? (
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${DEPOSIT_META[logged!.status].chip}`}>
                        {DEPOSIT_META[logged!.status].short}
                      </span>
                      <RecordOverrideControls kind="phoneDeposit" record={logged!} />
                    </div>
                  ) : canEdit ? (
                    <div className="shrink-0 flex flex-wrap items-center justify-end gap-1">
                      {STATUS_ORDER.map(s => {
                        const meta = DEPOSIT_META[s];
                        const Icon = meta.icon;
                        const selected = status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            title={meta.label}
                            aria-label={`${student.name}: ${meta.label}`}
                            aria-pressed={selected}
                            onClick={() => setStatus(student.id, s)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                              selected ? meta.active : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        title={`Save ${student.name} on his own`}
                        aria-label={`Save ${student.name}`}
                        onClick={() => submitStudent(student)}
                        className={`h-10 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                          logged
                            ? 'bg-slate-800 text-rose-300 border border-rose-800/60 hover:bg-slate-700'
                            : 'bg-rose-600 text-white hover:bg-rose-500'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">{logged ? 'Update' : 'Save'}</span>
                      </button>
                    </div>
                  ) : (
                    <span className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-bold ${DEPOSIT_META[status].chip}`}>
                      {DEPOSIT_META[status].short}
                    </span>
                  )}
                </div>

                {open && (
                  <div className="px-3 sm:px-4 pb-3 space-y-2">
                    {item && (
                      <p className="text-[11px] text-slate-400">
                        Custody: <span className="text-white font-semibold">{item.custodyStatus.replace(/_/g, ' ')}</span>
                        {item.turnOverTime ? ` · in at ${formatTime12h(item.turnOverTime)}` : ''}
                      </p>
                    )}
                    {item?.remarks && <p className="text-[10px] text-amber-300/80 italic">"{item.remarks}"</p>}
                    {canEdit && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => { setBorrowStudentId(student.id); setOpenRow(null); }}
                          disabled={!borrowable.some(o => o.id === student.id)}
                          className="min-h-touch bg-violet-950 hover:bg-violet-900 text-violet-300 border border-violet-700/50 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40"
                        >
                          <PhoneOutgoing className="w-3.5 h-3.5" /> Lend phone
                        </button>
                        {item && (
                          <button
                            onClick={() => handleRelease(item.id)}
                            className="min-h-touch bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Release
                          </button>
                        )}
                        <button
                          onClick={() => toggleExempt(student.id)}
                          className="min-h-touch bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1"
                          title="Resident keeps no phone in the dorm"
                        >
                          <Ban className="w-3.5 h-3.5" /> {item?.custodyStatus === 'exempted' ? 'Un-exempt' : 'No phone'}
                        </button>
                        {item && (
                          <button
                            onClick={() => handleConfiscate(item)}
                            className="min-h-touch bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 px-2.5 rounded-xl text-[11px] font-semibold"
                            title="Confiscate unauthorized secondary phone"
                          >
                            Confiscate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canEdit && checkable.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
            <button
              onClick={submitRoom}
              disabled={remaining === 0}
              className="w-full min-h-touch bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:active:scale-100"
            >
              <Save className="w-4 h-4" />
              <span>
                {remaining === 0
                  ? `Room ${selectedRoom} Checked This Cycle`
                  : `Log the Remaining ${remaining} · Room ${selectedRoom}`}
              </span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Log each phone as it is handed in, or sweep whoever is left. This cycle holds one check per
              resident — when he actually handed it over stands.
            </p>
          </div>
        )}
      </div>

      {/* Non-deposits this cycle */}
      {missedThisCycle.length > 0 && (
        <div className="bg-slate-900 border border-rose-900/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              No Phone Deposited
            </h3>
            <span className="text-xs text-slate-400">{missedThisCycle.length} flagged</span>
          </div>
          <div className="divide-y divide-slate-800/70">
            {missedThisCycle.map(d => (
              <div key={d.id} className="p-3 sm:p-4 flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{d.studentName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Room {d.roomNumber} · {d.autoLogged ? `flagged automatically at the ${dueLabel} deadline` : `logged by ${d.recordedBy}`}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => excuseResident(d.studentId)}
                    className="shrink-0 min-h-touch bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/50 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Excuse
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Borrowed phones */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <PhoneOutgoing className="w-4 h-4 text-violet-400" />
            Borrowed From the Vault
          </h3>
          <span className="text-xs text-slate-400">{openBorrows.length} out now</span>
        </div>

        {canEdit && (
          <div className="p-3 sm:p-4 border-b border-slate-800/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Resident</label>
              <select value={borrowStudentId} onChange={e => setBorrowStudentId(e.target.value)} className={FIELD}>
                <option value="">Select a resident</option>
                {borrowable.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} · Room {o.roomNumber} · {custodyNote(o.id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Reason</label>
              <input
                type="text"
                placeholder="e.g. Calling parents about weekend pass"
                value={borrowReason}
                onChange={e => setBorrowReason(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Taken out</label>
              <input type="time" value={borrowOut} onChange={e => setBorrowOut(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Due back</label>
              <input type="time" value={borrowBack} onChange={e => setBorrowBack(e.target.value)} className={FIELD} />
            </div>
            <button
              onClick={startBorrow}
              disabled={!borrowStudentId || !borrowReason.trim()}
              className="sm:col-span-2 min-h-touch bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <PhoneOutgoing className="w-4 h-4" />
              Sign the phone out
            </button>
          </div>
        )}

        {openBorrows.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">No phones are signed out right now.</p>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {openBorrows.map(b => {
              const overdue = isOverdue(b.borrowedDate, b.expectedReturnTime);
              return (
                <div key={b.id} className="p-3 sm:p-4 flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{b.studentName}</p>
                      {overdue && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300">OVERDUE</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Room {b.roomNumber} · out {formatTime12h(b.borrowedTime)} · due {formatTime12h(b.expectedReturnTime)}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{b.reason}</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => returnPhoneBorrow(b.id)}
                      className="shrink-0 min-h-touch bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <PhoneIncoming className="w-3.5 h-3.5" /> Back in
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {phoneBorrows.some(b => b.status === 'returned') && (
          <div className="border-t border-slate-800 divide-y divide-slate-800/70 max-h-[240px] overflow-y-auto">
            {phoneBorrows.filter(b => b.status === 'returned').slice(0, 25).map(b => (
              <div key={b.id} className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400 truncate">
                  <span className="text-slate-300 font-semibold">{b.studentName}</span> · {b.reason}
                </p>
                <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                  {formatTime12h(b.borrowedTime)} → {formatTime12h(b.returnedTime)}
                </span>
              </div>
            ))}
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
                  {d.autoLogged && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 bg-slate-800 text-slate-400">AUTO</span>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-300">{formatTime12h(d.depositTime)}</span>
                  <RecordOverrideControls kind="phoneDeposit" record={d} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room {d.roomNumber} · {formatFullDate(d.date)} · by {d.recordedBy}
                {d.overriddenBy && <span className="text-amber-300/90"> · overridden by {d.overriddenBy}</span>}
              </p>
              {d.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{d.remarks}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
