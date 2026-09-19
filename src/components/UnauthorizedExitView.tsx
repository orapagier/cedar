import React, { useEffect, useState } from 'react';
import {
  Siren,
  MapPinOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  ShieldCheck,
  Save,
  Lock,
  Users,
  PlusCircle,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { useManilaToday } from '../hooks/useManilaToday';
import { manilaToday, manilaTimeValue, formatFullDate, formatTime12h } from '../utils/date';
import { ResidentSearch } from './ui/ResidentSearch';
import { listedResidents } from '../utils/residentSearch';
import { passCoveringDate } from '../utils/gatePass';
import { EXIT_DISCOVERY_LABELS } from '../utils/checkViolations';
import { UnauthorizedExitLog } from '../types/dorm';
import { RecordOverrideControls } from './RecordOverrideControls';
import { Modal } from './ui/Modal';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40';

const MODAL_FIELD = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white';

const DISCOVERY_ORDER: UnauthorizedExitLog['discoveredVia'][] = [
  'gate_guard',
  'roll_call',
  'staff_sighting',
  'reported',
  'self_admitted',
];

const STATUS_META: Record<UnauthorizedExitLog['status'], { label: string; classes: string }> = {
  confirmed: { label: 'No Pass', classes: 'bg-rose-950 text-rose-300 border border-rose-700/50' },
  excused: { label: 'Excused', classes: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' },
};

/**
 * The register of residents found off campus with no gate pass — the record
 * kept when someone simply walked out. It is filed room by room from the
 * resident's own row, the way a pass is issued, and every confirmed exit puts a
 * demerit on that resident's standing until the Dean excuses it.
 */
export const UnauthorizedExitView: React.FC = () => {
  const {
    unauthorizedExits,
    gatePasses,
    users,
    rooms,
    saveUnauthorizedExit,
    updateUnauthorizedExit,
    canEdit,
    currentUser,
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const today = useManilaToday();

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [search, setSearch] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Log form
  const [studentId, setStudentId] = useState(occupants[0]?.id || '');
  const [date, setDate] = useState(() => manilaToday());
  const [noticedTime, setNoticedTime] = useState(() => manilaTimeValue());
  const [destination, setDestination] = useState('');
  const [discoveredVia, setDiscoveredVia] = useState<UnauthorizedExitLog['discoveredVia']>('gate_guard');
  const [backAlready, setBackAlready] = useState(false);
  const [returnedTime, setReturnedTime] = useState(() => manilaTimeValue());
  const [parentNotified, setParentNotified] = useState(false);
  const [remarks, setRemarks] = useState('');

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  // The name comes in from the gate guard or a roll call, not the room number,
  // so a search across the whole dormitory is how the right row is found.
  const searching = search.trim().length > 0;
  const listed = listedResidents(search, occupants, roomOccupants);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  // Exits are always logged from a resident's own row, so the form opens on
  // that resident with the clock already at the moment they were noticed.
  const openLogFor = (student: typeof occupants[number]) => {
    setStudentId(student.id);
    setDate(manilaToday());
    setNoticedTime(manilaTimeValue());
    setDestination('');
    setDiscoveredVia('gate_guard');
    setBackAlready(false);
    setReturnedTime(manilaTimeValue());
    setParentNotified(false);
    setRemarks('');
    setShowLogModal(true);
  };

  const loggingStudent = occupants.find(o => o.id === studentId);
  // The whole point of this record is that no pass covered the day, so a pass
  // that does cover it is said plainly before anything is filed.
  const coveringPass = loggingStudent ? passCoveringDate(gatePasses, loggingStudent.id, date) : undefined;

  const latestExitFor = (sid: string) =>
    unauthorizedExits
      .filter(e => e.studentId === sid)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

  const submitExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === studentId);
    if (!student) return;
    saveUnauthorizedExit({
      date,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      noticedTime,
      destination: destination || undefined,
      discoveredVia,
      returnedTime: backAlready ? returnedTime : undefined,
      status: 'confirmed',
      parentNotified,
      remarks: remarks || undefined,
      loggedBy: currentUser.name,
    });
    setShowLogModal(false);
    flash(`Logged ${student.name} off campus without a pass on ${formatFullDate(date)}.`);
  };

  const confirmedExits = unauthorizedExits.filter(e => e.status === 'confirmed');
  const stillOut = confirmedExits.filter(e => !e.returnedTime);
  const loggedToday = unauthorizedExits.filter(e => e.date === today);

  const markBackIn = (exit: UnauthorizedExitLog) => {
    updateUnauthorizedExit(exit.id, { returnedTime: manilaTimeValue() });
    flash(`${exit.studentName} logged back in the dorm.`);
  };

  const excuse = (exit: UnauthorizedExitLog) => {
    const reason = window.prompt(
      `Why is ${exit.studentName}'s exit excused?\n\nThe demerit it carries is withdrawn.`,
      exit.excuseReason || 'Leave was on file after all',
    );
    if (reason === null) return;
    updateUnauthorizedExit(exit.id, { status: 'excused', excuseReason: reason || undefined });
    flash(`${exit.studentName}'s exit excused — the demerit is withdrawn.`);
  };

  const reconfirm = (exit: UnauthorizedExitLog) => {
    updateUnauthorizedExit(exit.id, { status: 'confirmed', excuseReason: undefined });
    flash(`${exit.studentName}'s exit stands as unauthorized.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Off-Campus Without Pass</h2>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              Unauthorized Exit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Room by room, record a resident who left campus with no gate pass on file. Each confirmed exit is
            2 demerits and a dean inquiry; excuse it and the demerits are withdrawn.
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

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Logged Today</p>
          <p className={`text-2xl font-bold ${loggedToday.length ? 'text-rose-400' : 'text-slate-500'}`}>
            {loggedToday.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 flex items-center gap-1"><Siren className="w-3 h-3" /> Still Out</p>
          <p className={`text-2xl font-bold ${stillOut.length ? 'text-amber-400' : 'text-slate-500'}`}>
            {stillOut.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Confirmed</p>
          <p className="text-2xl font-bold text-rose-400">{confirmedExits.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Excused</p>
          <p className="text-2xl font-bold text-emerald-400">
            {unauthorizedExits.filter(e => e.status === 'excused').length}
          </p>
        </div>
      </div>

      {/* By-room logging */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPinOff className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Residents by Room</h3>
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

        <div className="px-4 py-3 border-b border-slate-800/70">
          <ResidentSearch value={search} onChange={setSearch} matches={listed.length} />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">
              {searching ? `Matching "${search.trim()}"` : `Room ${selectedRoom || '—'}`}
            </span> · {listed.length} residents
          </p>
          <p className="text-xs text-slate-400">{formatFullDate(today)}</p>
        </div>

        <div className="divide-y divide-slate-800/70">
          {listed.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">
              {searching ? 'Nobody in the dormitory by that name.' : 'No residents assigned to this room.'}
            </p>
          )}
          {listed.map(student => {
            const exit = latestExitFor(student.id);
            const pass = passCoveringDate(gatePasses, student.id, today);
            return (
              <div key={student.id} className="p-3 sm:p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {searching ? `Room ${student.roomNumber || '—'}` : student.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {pass ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-700/50">
                          Pass covers today
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                          No pass today
                        </span>
                      )}
                      {exit && (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[exit.status].classes}`}>
                            {STATUS_META[exit.status].label}
                          </span>
                          <span className="text-slate-400">last {formatFullDate(exit.date)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => openLogFor(student)}
                      className="shrink-0 min-h-touch px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Log Exit
                    </button>
                  )}
                </div>

                {exit && (
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-400 space-y-0.5">
                    <p>
                      <span className="text-slate-500 font-medium">Noticed:</span> {formatTime12h(exit.noticedTime)} ·{' '}
                      {EXIT_DISCOVERY_LABELS[exit.discoveredVia]}
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Where:</span> {exit.destination || 'Unknown'}
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-slate-500 font-medium">Back:</span>{' '}
                      {exit.returnedTime ? formatTime12h(exit.returnedTime) : 'Not yet logged in'}
                    </p>
                    {exit.remarks && <p className="italic text-slate-500">"{exit.remarks}"</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            Unauthorized Exit Register
          </h3>
          <span className="text-xs text-slate-400">{unauthorizedExits.length} records</span>
        </div>
        {unauthorizedExits.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">
            No unauthorized exits recorded — every campus exit is on a pass.
          </p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {unauthorizedExits.map(exit => (
            <div key={exit.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {exit.studentName} <span className="text-slate-500 font-normal">· Room {exit.roomNumber}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatFullDate(exit.date)} · noticed {formatTime12h(exit.noticedTime)} ·{' '}
                    {exit.destination || 'destination unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!exit.returnedTime && exit.status === 'confirmed' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/50">
                      Still Out
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[exit.status].classes}`}>
                    {STATUS_META[exit.status].label}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                {EXIT_DISCOVERY_LABELS[exit.discoveredVia]} ·{' '}
                {exit.returnedTime ? `back in at ${formatTime12h(exit.returnedTime)}` : 'not yet logged back in'} ·{' '}
                parents {exit.parentNotified ? 'notified' : 'not notified'}
              </p>
              {exit.remarks && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{exit.remarks}"</p>}
              {exit.status === 'excused' && (
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  Excused: {exit.excuseReason || 'leave was on file'}
                </p>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {!exit.returnedTime && (
                    <button
                      onClick={() => markBackIn(exit)}
                      className="min-h-touch px-2.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <DoorOpen className="w-3.5 h-3.5" /> Back In Dorm
                    </button>
                  )}
                  {!exit.parentNotified && (
                    <button
                      onClick={() => {
                        updateUnauthorizedExit(exit.id, { parentNotified: true });
                        flash(`Noted that ${exit.studentName}'s parents were told.`);
                      }}
                      className="min-h-touch px-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Parents Told
                    </button>
                  )}
                  {exit.status === 'confirmed' ? (
                    <button
                      onClick={() => excuse(exit)}
                      className="min-h-touch px-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Excuse
                    </button>
                  ) : (
                    <button
                      onClick={() => reconfirm(exit)}
                      className="min-h-touch px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Siren className="w-3.5 h-3.5" /> Reinstate
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-[11px] text-slate-500 truncate">
                  Logged by {exit.loggedBy}
                  {exit.overriddenBy && <span className="text-amber-300/90"> · overridden by {exit.overriddenBy}</span>}
                </p>
                <RecordOverrideControls kind="unauthorizedExit" record={exit} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log modal */}
      {canEdit && showLogModal && (
        <Modal onClose={() => setShowLogModal(false)} label="Log an unauthorized exit">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  Log Unauthorized Exit{loggingStudent ? ` — ${loggingStudent.name}` : ''}
                </h3>
                <p className="text-xs text-slate-400">
                  Room {loggingStudent?.roomNumber || '—'} · Off campus with no gate pass
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitExit} className="p-4 sm:p-6 space-y-3.5 text-xs">
              {coveringPass && (
                <div className="p-3 bg-sky-950/60 border border-sky-700/50 text-sky-200 rounded-xl flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    A gate pass already covers this date — {coveringPass.destination}, back{' '}
                    {formatFullDate(coveringPass.expectedReturnDate)}. This exit may well be authorized.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date off campus</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={MODAL_FIELD} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Noticed at</label>
                  <input type="time" value={noticedTime} onChange={e => setNoticedTime(e.target.value)} className={MODAL_FIELD} />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Where they went</label>
                <input
                  type="text"
                  placeholder="e.g. Town market — left by the back gate"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className={MODAL_FIELD}
                />
                <p className="text-[11px] text-slate-500 mt-1">Leave blank if nobody knows where they went.</p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">How it came to light</label>
                <select
                  value={discoveredVia}
                  onChange={e => setDiscoveredVia(e.target.value as UnauthorizedExitLog['discoveredVia'])}
                  className={MODAL_FIELD}
                >
                  {DISCOVERY_ORDER.map(via => (
                    <option key={via} value={via}>{EXIT_DISCOVERY_LABELS[via]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Same label-over-control shape and height as the fields around it */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Back in the dorm?</label>
                  <button
                    type="button"
                    aria-pressed={backAlready}
                    onClick={() => setBackAlready(v => !v)}
                    className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between gap-2 font-semibold transition-colors ${
                      backAlready
                        ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                        : 'bg-amber-950/50 border-amber-700/60 text-amber-300'
                    }`}
                  >
                    <span>{backAlready ? 'Already back' : 'Still out'}</span>
                    {backAlready ? <DoorOpen className="w-4 h-4" /> : <Siren className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Back in at</label>
                  <input
                    type="time"
                    value={returnedTime}
                    onChange={e => setReturnedTime(e.target.value)}
                    disabled={!backAlready}
                    className={`${MODAL_FIELD} disabled:opacity-40`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Parents notified</label>
                <button
                  type="button"
                  aria-pressed={parentNotified}
                  onClick={() => setParentNotified(v => !v)}
                  className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between gap-2 font-semibold transition-colors ${
                    parentNotified
                      ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>{parentNotified ? 'Notified' : 'Not yet notified'}</span>
                  {parentNotified ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Seen returning through the fence line"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className={MODAL_FIELD}
                />
              </div>

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Filing this puts 2 demerits on the resident's standing and calls for a dean inquiry with the parents.
                Excuse the record later if leave turns out to have been on file.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Log Exit
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
