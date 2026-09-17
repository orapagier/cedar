import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Save,
  Users,
  User,
  DoorOpen,
  Check,
  Lock,
  Church,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { WorshipType, AttendanceRecord } from '../types/dorm';
import { Segmented } from './ui/Segmented';

type AttendanceStatus = AttendanceRecord['status'];
type CheckInMode = 'individual' | 'by_room';

const DEFAULT_ENTRY = { status: 'present' as AttendanceStatus, broughtBible: true, notes: '' };

const STATUS_META: Record<AttendanceStatus, { label: string; icon: React.ComponentType<{ className?: string }>; active: string; chip: string }> = {
  present: { label: 'Present', icon: CheckCircle2, active: 'bg-emerald-600 text-white', chip: 'bg-emerald-950 text-emerald-300' },
  late: { label: 'Late', icon: Clock, active: 'bg-amber-600 text-white', chip: 'bg-amber-950 text-amber-300' },
  absent: { label: 'Absent', icon: XCircle, active: 'bg-rose-600 text-white', chip: 'bg-rose-950 text-rose-300' },
  excused: { label: 'Excused', icon: AlertTriangle, active: 'bg-sky-600 text-white', chip: 'bg-sky-950 text-sky-300' },
};

const SESSIONS: { id: WorshipType; label: string; short: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'morning_worship', label: 'Morning Worship (05:30 AM)', short: 'Morning · 05:30', icon: Clock },
  { id: 'evening_worship', label: 'Evening Worship (06:30 PM)', short: 'Evening · 18:30', icon: Clock },
  { id: 'church_midweek', label: 'Midweek Church Prayer', short: 'Midweek Prayer', icon: Church },
  { id: 'church_sabbath', label: 'Weekend / Sabbath Church', short: 'Sabbath Church', icon: Church },
];

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40';

export const WorshipAttendanceView: React.FC = () => {
  const { users, rooms, attendance, saveAttendanceBatch, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [sessionType, setSessionType] = useState<WorshipType>('morning_worship');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<CheckInMode>('by_room');

  const [roster, setRoster] = useState<Record<string, { status: AttendanceStatus; broughtBible: boolean; notes: string }>>({});
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);
  const selectedStudent = occupants.find(o => o.id === selectedStudentId);

  useEffect(() => {
    if ((!selectedStudentId || !occupants.some(o => o.id === selectedStudentId)) && occupants.length) {
      setSelectedStudentId(occupants[0].id);
    }
  }, [occupants, selectedStudentId]);

  useEffect(() => {
    if ((!selectedRoom || !roomNumbers.includes(selectedRoom)) && roomNumbers.length) {
      setSelectedRoom(roomNumbers[0]);
    }
  }, [roomNumbers, selectedRoom]);

  const getEntry = (id: string) => roster[id] ?? DEFAULT_ENTRY;

  const updateStudent = (id: string, field: 'status' | 'broughtBible' | 'notes', value: AttendanceStatus | boolean | string) => {
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
          notes: entry.notes || undefined,
          recordedBy: currentUser.name,
        };
      })
      .filter(Boolean) as Parameters<typeof saveAttendanceBatch>[0];

    saveAttendanceBatch(records);
    setSavedMessage(`Saved ${records.length} ${records.length === 1 ? 'record' : 'records'} for ${SESSIONS.find(s => s.id === sessionType)?.short}. Missing Bibles and unexcused absences were pushed to the demerit stream.`);
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
              Morning & evening worship, physical Bibles in hand, and weekend church attendance with lates and absences.
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
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Check-in method</p>
          <Segmented<CheckInMode>
            ariaLabel="Check-in method"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'by_room', label: 'By Room', icon: DoorOpen, activeClass: 'bg-blue-600 text-white shadow-sm' },
              { value: 'individual', label: 'Individual', icon: User, activeClass: 'bg-blue-600 text-white shadow-sm' },
            ]}
          />
        </div>
      </div>

      {/* BY ROOM MODE */}
      {mode === 'by_room' && (
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
                          aria-label={`${occ.name}: Bible in hand`}
                          aria-pressed={entry.broughtBible}
                          onClick={() => updateStudent(occ.id, 'broughtBible', !entry.broughtBible)}
                          className={`min-w-touch min-h-touch rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                            entry.broughtBible ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${STATUS_META[entry.status].chip}`}>
                          {STATUS_META[entry.status].label}
                        </span>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.broughtBible ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                          <BookOpen className="w-4 h-4" />
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
      )}

      {/* INDIVIDUAL MODE */}
      {mode === 'individual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">Individual Check-In</h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className={`${FIELD} appearance-none pr-10`}
              >
                {occupants.length === 0 ? (
                  <option value="">No residents found</option>
                ) : (
                  occupants.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} · Room {o.roomNumber}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedStudent && (
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3">
                <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center text-amber-300 font-bold border border-slate-600 shrink-0">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{selectedStudent.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Room {selectedStudent.roomNumber} · {selectedStudent.email}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Attendance status</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_META) as AttendanceStatus[]).map(status => {
                  const meta = STATUS_META[status];
                  const Icon = meta.icon;
                  const selected = selectedStudent ? getEntry(selectedStudent.id).status === status : false;
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={!canEdit || !selectedStudent}
                      onClick={() => selectedStudent && updateStudent(selectedStudent.id, 'status', status)}
                      className={`min-h-touch rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                        selected ? meta.active : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={!canEdit || !selectedStudent}
              onClick={() => selectedStudent && updateStudent(selectedStudent.id, 'broughtBible', !getEntry(selectedStudent.id).broughtBible)}
              className={`w-full min-h-touch rounded-xl border flex items-center justify-between px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
                selectedStudent && getEntry(selectedStudent.id).broughtBible
                  ? 'bg-blue-950/50 border-blue-600/60 text-blue-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Brought physical Bible
              </span>
              <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${selectedStudent && getEntry(selectedStudent.id).broughtBible ? 'bg-blue-500' : 'bg-slate-600'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${selectedStudent && getEntry(selectedStudent.id).broughtBible ? 'translate-x-5' : 'translate-x-0'}`} />
              </span>
            </button>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes / excuse</label>
              <input
                type="text"
                placeholder="e.g. 10 mins late, or sick slip"
                disabled={!canEdit || !selectedStudent}
                value={selectedStudent ? getEntry(selectedStudent.id).notes : ''}
                onChange={e => selectedStudent && updateStudent(selectedStudent.id, 'notes', e.target.value)}
                className={`${FIELD} disabled:opacity-50`}
              />
            </div>
          </div>

          {canEdit && selectedStudent && (
            <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
              <button
                onClick={() => saveAttendance([selectedStudent.id])}
                className="w-full min-h-touch bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                <Save className="w-4 h-4" />
                <span>Save {selectedStudent.name.split(' ')[0]}'s Check-In</span>
              </button>
            </div>
          )}
        </div>
      )}

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
                      Room {item.roomNumber} · {item.date} {item.timestamp} · by {item.recordedBy}
                    </p>
                    {item.notes && <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>}
                  </div>
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${item.broughtBible ? 'bg-blue-950 text-blue-300' : 'bg-rose-950 text-rose-300'}`} title={item.broughtBible ? 'Bible in hand' : 'No Bible'}>
                    <BookOpen className="w-4 h-4" />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
