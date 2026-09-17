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
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { WorshipType, AttendanceRecord } from '../types/dorm';
import { WORSHIP_SESSIONS } from '../data/dormSeed';
import { Segmented } from './ui/Segmented';
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
  sabbath_morning: Church,
  sabbath_afternoon: Church,
};

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40';

export const WorshipAttendanceView: React.FC = () => {
  const { users, rooms, attendance, saveAttendanceBatch, canEdit, currentUser, settings } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const SESSIONS = WORSHIP_SESSIONS.map(session => {
    const time = settings[session.timeKey];
    return {
      id: session.id,
      label: `${session.label}${time ? ` (${formatTime12h(time)})` : ''}`,
      short: `${session.short}${time ? ` · ${formatTime12h(time)}` : ''}`,
      icon: SESSION_ICONS[session.id],
    };
  });

  const [sessionType, setSessionType] = useState<WorshipType>('morning_worship');
  const [selectedDate, setSelectedDate] = useState(() => manilaToday());

  const [roster, setRoster] = useState<Record<string, { status: AttendanceStatus; broughtBible: boolean; properAttire: boolean; notes: string }>>({});
  const [selectedRoom, setSelectedRoom] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if ((!selectedRoom || !roomNumbers.includes(selectedRoom)) && roomNumbers.length) {
      setSelectedRoom(roomNumbers[0]);
    }
  }, [roomNumbers, selectedRoom]);

  const getEntry = (id: string) => roster[id] ?? DEFAULT_ENTRY;

  const updateStudent = (id: string, field: 'status' | 'broughtBible' | 'properAttire' | 'notes', value: AttendanceStatus | boolean | string) => {
    setRoster(prev => ({ ...prev, [id]: { ...(prev[id] ?? DEFAULT_ENTRY), [field]: value } }));
  };

  const markRoomAllPresent = () => {
    setRoster(prev => {
      const next = { ...prev };
      roomOccupants.forEach(o => {
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

    saveAttendanceBatch(records);
    setSavedMessage(`Saved ${records.length} ${records.length === 1 ? 'record' : 'records'} for ${SESSIONS.find(s => s.id === sessionType)?.short}. Missing Bibles, improper attire and unexcused absences were each logged as 1 pt.`);
    setTimeout(() => setSavedMessage(null), 4000);
  };

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
              <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                Devotional Policy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              All five weekly services — Bible in hand, proper worship attire, and lates or absences on record.
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
          options={SESSIONS.map(s => ({ value: s.id, label: s.short, icon: s.icon, activeClass: 'bg-blue-600 text-white shadow-sm' }))}
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
              <h3 className="font-bold text-white text-sm">Room Roll Call</h3>
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

          <div className="p-3 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-800/70">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white">Room {selectedRoom || '—'}</span>
              {selectedWing ? ` · ${selectedWing}` : ''} · {roomOccupants.length} residents
            </div>
            {canEdit && roomOccupants.length > 0 && (
              <button
                onClick={markRoomAllPresent}
                className="min-h-touch px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                All present
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800/70">
            {roomOccupants.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
            )}
            {roomOccupants.map(occ => {
              const entry = getEntry(occ.id);
              return (
                <div key={occ.id} className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{occ.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{occ.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit ? (
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
                                className={`min-w-touch min-h-touch flex-1 sm:flex-none rounded-xl flex items-center justify-center transition-all active:scale-95 ${
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
                          className={`min-w-touch min-h-touch rounded-xl flex items-center justify-center transition-all active:scale-95 ${
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
                          className={`min-w-touch min-h-touch rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                            entry.properAttire ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          <Shirt className="w-4 h-4" />
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

          {canEdit && roomOccupants.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
              <button
                onClick={() => saveAttendance(roomOccupants.map(o => o.id))}
                className="w-full min-h-touch bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                <Save className="w-4 h-4" />
                <span>Save Room {selectedRoom} Roll Call</span>
              </button>
            </div>
          )}
        </div>

      {/* History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full min-h-touch p-4 flex items-center justify-between"
        >
          <h3 className="font-bold text-white text-sm">Past {SESSIONS.find(s => s.id === sessionType)?.short} Logs</h3>
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
