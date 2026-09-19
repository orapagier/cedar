import React, { useEffect, useState } from 'react';
import {
  Footprints,
  DoorOpen,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Save,
  Lock,
  Users,
  PlusCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { useManilaToday } from '../hooks/useManilaToday';
import { manilaToday, manilaTimeValue, formatFullDate, formatTime12h } from '../utils/date';
import { ResidentSearch } from './ui/ResidentSearch';
import { listedResidents } from '../utils/residentSearch';
import { NEIGHBOR_DISCOVERY_LABELS } from '../utils/checkViolations';
import { NeighborRoomLog } from '../types/dorm';
import { RecordOverrideControls } from './RecordOverrideControls';
import { Modal } from './ui/Modal';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40';

const MODAL_FIELD = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white';

const DISCOVERY_ORDER: NeighborRoomLog['discoveredVia'][] = [
  'staff_rounds',
  'room_owner',
  'reported',
  'self_admitted',
];

const STATUS_META: Record<NeighborRoomLog['status'], { label: string; classes: string }> = {
  confirmed: { label: 'No Permission', classes: 'bg-rose-950 text-rose-300 border border-rose-700/50' },
  excused: { label: 'Permitted', classes: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' },
};

/**
 * The register of residents found in another resident's room — which the
 * dormitory does not allow without explicit permission. It is filed against
 * the visitor, room by room, and every visit without permission puts a demerit
 * on that resident's standing until the Dean excuses it. Every visit is kept
 * on file, permitted or not, so a lost or stolen item can be traced back
 * through who was in the room and when.
 */
export const NeighborRoomView: React.FC = () => {
  const {
    neighborRoomLogs,
    users,
    rooms,
    saveNeighborRoomLog,
    updateNeighborRoomLog,
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
  const [seenTime, setSeenTime] = useState(() => manilaTimeValue());
  const [visitedRoomNumber, setVisitedRoomNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [discoveredVia, setDiscoveredVia] = useState<NeighborRoomLog['discoveredVia']>('staff_rounds');
  const [hasPermission, setHasPermission] = useState(false);
  const [remarks, setRemarks] = useState('');

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  const searching = search.trim().length > 0;
  const listed = listedResidents(search, occupants, roomOccupants);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const namesInRoom = (roomNumber: string) => {
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (!room) return '';
    return room.occupantIds
      .map(id => users.find(u => u.id === id))
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map(u => u.name)
      .join(', ');
  };

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  // Visits are always logged from a resident's own row, so the form opens on
  // that resident with the clock already at the moment they were seen and the
  // first room that is not their own.
  const openLogFor = (student: typeof occupants[number]) => {
    setStudentId(student.id);
    setDate(manilaToday());
    setSeenTime(manilaTimeValue());
    setVisitedRoomNumber(roomNumbers.find(r => r !== student.roomNumber) || '');
    setPurpose('');
    setDiscoveredVia('staff_rounds');
    setHasPermission(false);
    setRemarks('');
    setShowLogModal(true);
  };

  const loggingStudent = occupants.find(o => o.id === studentId);
  const visitedRoomOccupants = loggingStudent ? namesInRoom(visitedRoomNumber) : '';

  const latestVisitFor = (sid: string) =>
    neighborRoomLogs
      .filter(l => l.studentId === sid)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

  const submitVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === studentId);
    if (!student || !visitedRoomNumber) return;
    const permitted = hasPermission;
    saveNeighborRoomLog({
      date,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      visitedRoomNumber,
      visitedRoomOccupants: visitedRoomOccupants || undefined,
      seenTime,
      purpose: purpose || undefined,
      discoveredVia,
      hasPermission: permitted,
      status: permitted ? 'excused' : 'confirmed',
      excuseReason: permitted ? 'Had explicit permission' : undefined,
      remarks: remarks || undefined,
      loggedBy: currentUser.name,
    });
    setShowLogModal(false);
    flash(
      `Logged ${student.name} in Room ${visitedRoomNumber} on ${formatFullDate(date)}` +
        (permitted ? ' — with permission.' : ' — a demerit is on file.')
    );
  };

  const confirmedVisits = neighborRoomLogs.filter(l => l.status === 'confirmed');
  const loggedToday = neighborRoomLogs.filter(l => l.date === today);

  const markPermitted = (log: NeighborRoomLog) => {
    updateNeighborRoomLog(log.id, {
      hasPermission: true,
      status: 'excused',
      excuseReason: log.excuseReason || 'Permission was on file after all',
    });
    flash(`${log.studentName}'s visit excused — the demerit is withdrawn.`);
  };

  const reconfirm = (log: NeighborRoomLog) => {
    updateNeighborRoomLog(log.id, { hasPermission: false, status: 'confirmed', excuseReason: undefined });
    flash(`${log.studentName}'s visit stands as unauthorized.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Neighboring Rooms</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              Room Visit Check
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Room by room, record a resident found in another resident's room — not allowed without explicit
            permission. Each unauthorized visit is 1 demerit; every visit stays on file so a lost or
            stolen item can be traced back to who was in the room.
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
          <p className={`text-2xl font-bold ${loggedToday.length ? 'text-amber-400' : 'text-slate-500'}`}>
            {loggedToday.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Unauthorized</p>
          <p className={`text-2xl font-bold ${confirmedVisits.length ? 'text-rose-400' : 'text-slate-500'}`}>
            {confirmedVisits.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Permitted</p>
          <p className="text-2xl font-bold text-emerald-400">
            {neighborRoomLogs.filter(l => l.status === 'excused').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Visits on File</p>
          <p className="text-2xl font-bold text-white">{neighborRoomLogs.length}</p>
        </div>
      </div>

      {/* By-room logging */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-amber-400" />
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
            const visit = latestVisitFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {searching ? `Room ${student.roomNumber || '—'}` : student.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {visit ? (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[visit.status].classes}`}>
                            {STATUS_META[visit.status].label}
                          </span>
                          <span className="text-slate-400">
                            last in Room {visit.visitedRoomNumber} · {formatFullDate(visit.date)}
                          </span>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                          No visits logged
                        </span>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => openLogFor(student)}
                      className="shrink-0 min-h-touch px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Log Visit
                    </button>
                  )}
                </div>

                {visit && (
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-400 space-y-0.5">
                    <p>
                      <span className="text-slate-500 font-medium">Seen:</span> {formatTime12h(visit.seenTime)} ·{' '}
                      {NEIGHBOR_DISCOVERY_LABELS[visit.discoveredVia]}
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">In:</span> Room {visit.visitedRoomNumber}
                      {visit.visitedRoomOccupants ? ` · ${visit.visitedRoomOccupants}` : ''}
                      {visit.purpose ? <><span className="mx-1.5 text-slate-600">·</span>{visit.purpose}</> : null}
                    </p>
                    {visit.remarks && <p className="italic text-slate-500">"{visit.remarks}"</p>}
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
            <Users className="w-4 h-4 text-amber-400" />
            Neighboring Room Register
          </h3>
          <span className="text-xs text-slate-400">{neighborRoomLogs.length} records</span>
        </div>
        {neighborRoomLogs.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">
            No room visits recorded — residents have only been in their own rooms.
          </p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {neighborRoomLogs.map(log => (
            <div key={log.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {log.studentName} <span className="text-slate-500 font-normal">· Room {log.roomNumber}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatFullDate(log.date)} · seen {formatTime12h(log.seenTime)} · into Room {log.visitedRoomNumber}
                    {log.visitedRoomOccupants ? ` · ${log.visitedRoomOccupants}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[log.status].classes}`}>
                    {STATUS_META[log.status].label}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                {NEIGHBOR_DISCOVERY_LABELS[log.discoveredVia]}
                {log.purpose ? ` · "${log.purpose}"` : ''}
              </p>
              {log.remarks && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{log.remarks}"</p>}
              {log.status === 'excused' && (
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  {log.hasPermission ? 'With permission' : 'Excused'}: {log.excuseReason || 'permission was on file'}
                </p>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {log.status === 'confirmed' ? (
                    <button
                      onClick={() => markPermitted(log)}
                      className="min-h-touch px-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Mark Permitted
                    </button>
                  ) : (
                    <button
                      onClick={() => reconfirm(log)}
                      className="min-h-touch px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Mark Unauthorized
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-[11px] text-slate-500 truncate">
                  Logged by {log.loggedBy}
                  {log.overriddenBy && <span className="text-amber-300/90"> · overridden by {log.overriddenBy}</span>}
                </p>
                <RecordOverrideControls kind="neighborRoom" record={log} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log modal */}
      {canEdit && showLogModal && (
        <Modal onClose={() => setShowLogModal(false)} label="Log a room visit">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  Log Room Visit{loggingStudent ? ` — ${loggingStudent.name}` : ''}
                </h3>
                <p className="text-xs text-slate-400">
                  Room {loggingStudent?.roomNumber || '—'} · found in another resident's room
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

            <form onSubmit={submitVisit} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date seen</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={MODAL_FIELD} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Seen at</label>
                  <input type="time" value={seenTime} onChange={e => setSeenTime(e.target.value)} className={MODAL_FIELD} />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Which room they were in</label>
                <select
                  value={visitedRoomNumber}
                  onChange={e => setVisitedRoomNumber(e.target.value)}
                  className={MODAL_FIELD}
                >
                  <option value="">Select a room</option>
                  {roomNumbers
                    .filter(room => room !== loggingStudent?.roomNumber)
                    .map(room => (
                      <option key={room} value={room}>
                        Room {room}
                        {namesInRoom(room) ? ` · ${namesInRoom(room)}` : ''}
                      </option>
                    ))}
                </select>
                {visitedRoomNumber && visitedRoomOccupants && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Home of {visitedRoomOccupants}.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Why they said they were there</label>
                <input
                  type="text"
                  placeholder="e.g. Charging his phone / borrowing a notebook"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className={MODAL_FIELD}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Helps a later inquiry — and tracing a lost item — know what the visit was for.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">How it came to light</label>
                <select
                  value={discoveredVia}
                  onChange={e => setDiscoveredVia(e.target.value as NeighborRoomLog['discoveredVia'])}
                  className={MODAL_FIELD}
                >
                  {DISCOVERY_ORDER.map(via => (
                    <option key={via} value={via}>{NEIGHBOR_DISCOVERY_LABELS[via]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Had explicit permission</label>
                <button
                  type="button"
                  aria-pressed={hasPermission}
                  onClick={() => setHasPermission(v => !v)}
                  className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between gap-2 font-semibold transition-colors ${
                    hasPermission
                      ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                  }`}
                >
                  <span>{hasPermission ? 'Yes — invited / allowed' : 'No — not allowed'}</span>
                  {hasPermission ? <CheckCircle2 className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />}
                </button>
                <p className="text-[11px] text-slate-500 mt-1">
                  The visit is still recorded either way, so the register holds the full trail.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Found alone in Room 204 during study hours"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className={MODAL_FIELD}
                />
              </div>

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {hasPermission
                  ? 'This visit is logged as permitted — no demerit. Excuse a confirmed visit later if permission turns out to have been given.'
                  : 'Filing this puts 1 demerit on the resident\'s standing and calls for a dean inquiry. Mark it permitted later if permission was on file.'}
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
                  disabled={!visitedRoomNumber}
                  className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 flex items-center gap-1.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Log Visit
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};