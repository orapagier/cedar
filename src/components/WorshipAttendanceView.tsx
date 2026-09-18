import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Save,
  Users,
  Check,
  Lock,
  Church,
  ChevronDown,
  CalendarDays,
  Shirt,
  Sunset,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { RecordOverrideControls } from './RecordOverrideControls';
import { WorshipType, AttendanceRecord } from '../types/dorm';
import { WORSHIP_SESSIONS } from '../data/dormSeed';
import { Segmented } from './ui/Segmented';
import { ResidentSearch } from './ui/ResidentSearch';
import { listedResidents } from '../utils/residentSearch';
import { manilaToday, formatFullDate, formatTime12h } from '../utils/date';

type AttendanceStatus = AttendanceRecord['status'];

const DEFAULT_ENTRY = { status: 'present' as AttendanceStatus, broughtBible: true, properAttire: true, notes: '' };

const STATUS_META: Record<AttendanceStatus, { label: string; icon: React.ComponentType<{ className?: string }>; active: string; chip: string }> = {
  present: { label: 'Present', icon: CheckCircle2, active: 'bg-emerald-600 text-white', chip: 'bg-emerald-950 text-emerald-300' },
  late: { label: 'Late', icon: Clock, active: 'bg-amber-600 text-white', chip: 'bg-amber-950 text-amber-300' },
  absent: { label: 'Absent', icon: XCircle, active: 'bg-rose-600 text-white', chip: 'bg-rose-950 text-rose-300' },
  excused: { label: 'Excused', icon: AlertTriangle, active: 'bg-sky-600 text-white', chip: 'bg-sky-950 text-sky-300' },
};

const SESSION_ICONS: Record<WorshipType, React.ComponentType<{ className?: string }>> = {
  morning_worship: Clock,
  evening_worship: Clock,
  midweek_worship: Church,
  vesper_worship: Sunset,
  sabbath_morning: Church,
  sabbath_afternoon: Church,
};

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40';

/** The roll call taken at the church door rather than room by room. */
const ALL_ROOMS = '__all__';

export const WorshipAttendanceView: React.FC = () => {
  const { users, rooms, attendance, saveAttendanceBatch, canEdit, isSuperAdmin, currentUser, settings } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const SESSIONS = WORSHIP_SESSIONS.map(session => {
    const time = settings[session.timeKey];
    const formatted = time ? formatTime12h(time) : '';
    return {
      id: session.id,
      label: session.label,
      short: session.short,
      time: formatted,
      full: `${session.short}${formatted ? ` · ${formatted}` : ''}`,
      icon: SESSION_ICONS[session.id],
    };
  });

  const [sessionType, setSessionType] = useState<WorshipType>('morning_worship');
  const [selectedDate, setSelectedDate] = useState(() => manilaToday());

  const [roster, setRoster] = useState<Record<string, { status: AttendanceStatus; broughtBible: boolean; properAttire: boolean; notes: string }>>({});
  const [selectedRoom, setSelectedRoom] = useState('');
  const [search, setSearch] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const allRooms = selectedRoom === ALL_ROOMS;
  // Residents trickle to church from every room at once, so the whole dormitory
  // can be listed as one queue and marked off as each boy arrives.
  const roomOccupants = allRooms
    ? [...occupants].sort(
        (a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || '') || a.name.localeCompare(b.name)
      )
    : occupants.filter(o => o.roomNumber === selectedRoom);

  // A name in hand beats a room number: while the search has something in it,
  // the roll call lists whoever answers to it from anywhere in the dormitory,
  // and everything below — the count, the sweep, the save — works on that list.
  const searching = search.trim().length > 0;
  const listed = listedResidents(search, occupants, roomOccupants);
  const scopeLabel = searching
    ? `Matching "${search.trim()}"`
    : allRooms ? 'All rooms' : `Room ${selectedRoom || '—'}`;

  useEffect(() => {
    if ((!selectedRoom || !(selectedRoom === ALL_ROOMS || roomNumbers.includes(selectedRoom))) && roomNumbers.length) {
      setSelectedRoom(roomNumbers[0]);
    }
  }, [roomNumbers, selectedRoom]);

  /** What is already on file for this resident at this service, if anything. */
  const filedFor = (id: string) =>
    attendance.find(a => a.studentId === id && a.date === selectedDate && a.type === sessionType);

  // A row reads from the draft first, then from whatever was already saved for
  // this service, so a room half-logged earlier opens showing what it holds.
  const getEntry = (id: string) => {
    if (roster[id]) return roster[id];
    const filed = filedFor(id);
    if (!filed) return DEFAULT_ENTRY;
    return {
      status: filed.status,
      broughtBible: filed.broughtBible,
      properAttire: filed.properAttire !== false,
      notes: filed.notes ?? '',
    };
  };

  // Drafts belong to the service and date they were taken for; switching either
  // reads the new one off the register rather than carrying marks across.
  useEffect(() => {
    setRoster({});
  }, [selectedDate, sessionType]);

  const updateStudent = (id: string, field: 'status' | 'broughtBible' | 'properAttire' | 'notes', value: AttendanceStatus | boolean | string) => {
    setRoster(prev => ({ ...prev, [id]: { ...(prev[id] ?? getEntry(id)), [field]: value } }));
  };

  /** Residents this service has no record for yet — all that a sweep can file. */
  const stillToTake = () => listed.filter(o => !filedFor(o.id));

  const markRoomAllPresent = () => {
    setRoster(prev => {
      const next = { ...prev };
      stillToTake().forEach(o => {
        next[o.id] = { ...DEFAULT_ENTRY };
      });
      return next;
    });
  };

  const saveAttendance = (ids: string[]) => {
    if (!canEdit || !ids.length) return;

    const records = ids
      .map(id => {
        const occ = occupants.find(o => o.id === id);
        if (!occ) return null;
        const entry = getEntry(id);
        return {
          date: selectedDate,
          type: sessionType,
          studentId: occ.id,
          studentName: occ.name,
          roomNumber: occ.roomNumber || '—',
          status: entry.status,
          broughtBible: entry.broughtBible,
          properAttire: entry.properAttire,
          notes: entry.notes || undefined,
          recordedBy: currentUser.name,
        };
      })
      .filter(Boolean) as Parameters<typeof saveAttendanceBatch>[0];

    const { filed, kept } = saveAttendanceBatch(records);
    const service = SESSIONS.find(s => s.id === sessionType)?.full;
    const already = kept
      ? ` ${kept} ${kept === 1 ? 'was' : 'were'} already on file for this service and ${kept === 1 ? 'was' : 'were'} left as taken.`
      : '';
    setSavedMessage(
      filed === 0
        ? `Already on file for ${service} — nothing changed.${
            isSuperAdmin ? ' Use the pencil on the row to correct a record.' : ' Ask the Dean to correct a record.'
          }`
        : filed === 1 && records.length === 1
          ? `${records[0].studentName} logged for ${service}.`
          : `Filed ${filed} ${filed === 1 ? 'record' : 'records'} for ${service}.${already} Missing Bibles, improper attire and unexcused absences were each logged as 1 demerit.`
    );
    setTimeout(() => setSavedMessage(null), 5000);
  };

  const loggedCount = listed.filter(o => filedFor(o.id)).length;
  const remaining = listed.length - loggedCount;

  const historyForSession = attendance.filter(a => a.type === sessionType);
  const selectedWing = rooms.find(r => r.roomNumber === selectedRoom)?.wing;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Worship, Bibles & Church</h2>
              <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
                Devotional Policy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              All six weekly services — Bible in hand, proper worship attire, and lates or absences on record.
            </p>
          </div>

          {!canEdit && (
            <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 self-start">
              <Lock className="w-3.5 h-3.5" />
              <span>View-only access</span>
            </div>
          )}
        </div>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Session, Date & Mode */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <Segmented<WorshipType>
          ariaLabel="Worship session"
          value={sessionType}
          onChange={setSessionType}
          options={SESSIONS.map(s => ({ value: s.id, label: s.short, sub: s.time || undefined, icon: s.icon, activeClass: 'bg-blue-600 text-white shadow-sm' }))}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <span>Date</span>
          </label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={`${FIELD} sm:max-w-[200px]`} />
          <span className="text-sm font-semibold text-white">{formatFullDate(selectedDate)}</span>
        </div>
      </div>

      {/* Room roll call */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">{allRooms ? 'Church Door Roll Call' : 'Room Roll Call'}</h3>
            </div>
            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className={`${FIELD} sm:max-w-[220px]`}>
              {roomNumbers.length === 0 ? (
                <option value="">No residents on file</option>
              ) : (
                <>
                  <option value={ALL_ROOMS}>All rooms · {occupants.length} residents</option>
                  {roomNumbers.map(room => (
                    <option key={room} value={room}>
                      Room {room}
                      {rooms.find(r => r.roomNumber === room)?.wing ? ` · ${rooms.find(r => r.roomNumber === room)?.wing}` : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="p-3 sm:p-4 border-b border-slate-800/70">
            <ResidentSearch value={search} onChange={setSearch} matches={listed.length} />
          </div>

          <div className="p-3 sm:p-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 border-b border-slate-800/70">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white">{scopeLabel}</span>
              {!searching && !allRooms && selectedWing ? ` · ${selectedWing}` : ''} · {listed.length} residents
              {listed.length > 0 && (
                <span className={loggedCount === listed.length ? ' text-emerald-400' : ''}>
                  {' '}· {loggedCount}/{listed.length} logged
                </span>
              )}
            </div>
            {canEdit && listed.length > 0 && (
              <button
                onClick={markRoomAllPresent}
                className="shrink-0 min-h-touch px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Mark all present
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800/70">
            {listed.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-500">
                {searching
                  ? 'Nobody in the dormitory by that name.'
                  : allRooms ? 'No residents on file.' : 'No residents assigned to this room.'}
              </p>
            )}
            {listed.map(occ => {
              const entry = getEntry(occ.id);
              const filed = filedFor(occ.id);
              return (
                <div key={occ.id} className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{occ.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {searching || allRooms ? `Room ${occ.roomNumber || '—'}` : occ.email}
                    </p>
                    {filed && (
                      <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_META[filed.status].chip}`}>
                        <Check className="w-3 h-3" />
                        {STATUS_META[filed.status].label} · {filed.timestamp}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    {filed ? (
                      // The service already holds this resident's check. It reads
                      // as taken, and only the Dean's pencil changes it.
                      <>
                        <span title="Bible in hand" className={`w-9 h-9 rounded-lg flex items-center justify-center ${filed.broughtBible ? 'bg-blue-950 text-blue-300' : 'bg-rose-950 text-rose-300'}`}>
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <span title="Proper worship attire" className={`w-9 h-9 rounded-lg flex items-center justify-center ${filed.properAttire === false ? 'bg-rose-950 text-rose-300' : 'bg-violet-950 text-violet-300'}`}>
                          <Shirt className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          On file
                        </span>
                        <RecordOverrideControls kind="attendance" record={filed} />
                      </>
                    ) : canEdit ? (
                      <>
                        <div className="flex gap-1.5 flex-1 sm:flex-none">
                          {(Object.keys(STATUS_META) as AttendanceStatus[]).map(status => {
                            const meta = STATUS_META[status];
                            const Icon = meta.icon;
                            const selected = entry.status === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                title={meta.label}
                                aria-label={`${occ.name}: ${meta.label}`}
                                aria-pressed={selected}
                                onClick={() => updateStudent(occ.id, 'status', status)}
                                className={`w-9 h-9 sm:w-auto sm:h-auto sm:min-w-touch sm:min-h-touch flex-1 sm:flex-none rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                                  selected ? meta.active : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          title="Bible in hand"
                          aria-label={`${occ.name}: Bible in hand`}
                          aria-pressed={entry.broughtBible}
                          onClick={() => updateStudent(occ.id, 'broughtBible', !entry.broughtBible)}
                          className={`w-9 h-9 sm:w-auto sm:h-auto sm:min-w-touch sm:min-h-touch rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                            entry.broughtBible ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Proper worship attire"
                          aria-label={`${occ.name}: Proper worship attire`}
                          aria-pressed={entry.properAttire}
                          onClick={() => updateStudent(occ.id, 'properAttire', !entry.properAttire)}
                          className={`w-9 h-9 sm:w-auto sm:h-auto sm:min-w-touch sm:min-h-touch rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                            entry.properAttire ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          <Shirt className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title={`Save ${occ.name} on their own`}
                          aria-label={`Save ${occ.name}`}
                          onClick={() => saveAttendance([occ.id])}
                          className={`h-9 sm:h-auto sm:min-h-touch px-2.5 sm:px-3 rounded-xl flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                            filed
                              ? 'bg-slate-800 text-blue-300 border border-blue-800/60 hover:bg-slate-700'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          <Save className="w-4 h-4" />
                          <span>{filed ? 'Update' : 'Save'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${STATUS_META[entry.status].chip}`}>
                          {STATUS_META[entry.status].label}
                        </span>
                        <span title="Bible in hand" className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.broughtBible ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <span title="Proper worship attire" className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.properAttire ? 'bg-violet-950 text-violet-300' : 'bg-slate-800 text-slate-500'}`}>
                          <Shirt className="w-4 h-4" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canEdit && listed.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
              <button
                onClick={() => saveAttendance(stillToTake().map(o => o.id))}
                disabled={remaining === 0}
                className="w-full min-h-touch bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:active:scale-100"
              >
                <Save className="w-4 h-4" />
                <span>
                  {remaining === 0
                    ? `${scopeLabel} — Roll Call Complete`
                    : `Save the Remaining ${remaining} · ${scopeLabel}`}
                </span>
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Save each resident as they leave for church, or sweep whoever is left. This service holds one
                record per resident — a name already taken keeps the check it was given.
              </p>
            </div>
          )}
        </div>

      {/* History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full min-h-touch p-4 flex items-center justify-between"
        >
          <h3 className="font-bold text-white text-sm">Past {SESSIONS.find(s => s.id === sessionType)?.full} Logs</h3>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            {historyForSession.length} entries
            <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {showHistory && (
          <div className="border-t border-slate-800 divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
            {historyForSession.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-500">No records yet for this session.</p>
            )}
            {historyForSession.map(item => {
              const meta = STATUS_META[item.status];
              return (
                <div key={item.id} className="p-3 sm:p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-sm truncate">{item.studentName}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.chip}`}>{meta.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Room {item.roomNumber} · {formatFullDate(item.date)} {item.timestamp} · by {item.recordedBy}
                      {item.overriddenBy && (
                        <span className="text-amber-300/90"> · overridden by {item.overriddenBy}</span>
                      )}
                    </p>
                    {item.notes && <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.broughtBible ? 'bg-blue-950 text-blue-300' : 'bg-rose-950 text-rose-300'}`} title={item.broughtBible ? 'Bible in hand' : 'No Bible'}>
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.properAttire === false ? 'bg-rose-950 text-rose-300' : 'bg-violet-950 text-violet-300'}`} title={item.properAttire === false ? 'Improper worship attire' : 'Proper worship attire'}>
                      <Shirt className="w-4 h-4" />
                    </span>
                    <RecordOverrideControls kind="attendance" record={item} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
