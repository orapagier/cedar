import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  Library,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Check,
  ShieldCheck,
  Save,
  Lock,
  Users,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

type StudyStatus = 'present' | 'late' | 'absent' | 'excused';
type FocusRating = 'focused' | 'distracted' | 'noise_violation';

const STATUS_META: Record<StudyStatus, { label: string; icon: React.ComponentType<{ className?: string }>; active: string }> = {
  present: { label: 'Present', icon: CheckCircle2, active: 'bg-emerald-600 text-white' },
  late: { label: 'Late', icon: Clock, active: 'bg-amber-600 text-white' },
  absent: { label: 'Absent', icon: XCircle, active: 'bg-rose-600 text-white' },
  excused: { label: 'Excused', icon: ShieldCheck, active: 'bg-sky-600 text-white' },
};

const FOCUS_META: Record<FocusRating, { label: string; icon: React.ComponentType<{ className?: string }>; active: string }> = {
  focused: { label: 'Focused & Silent', icon: Check, active: 'bg-emerald-600 text-white' },
  distracted: { label: 'Distracted', icon: AlertTriangle, active: 'bg-amber-600 text-white' },
  noise_violation: { label: 'Noise Disturbance', icon: VolumeX, active: 'bg-rose-600 text-white' },
};

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40';

export const StudyHoursLibraryView: React.FC = () => {
  const { studyLogs, users, rooms, saveStudyLog, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [location, setLocation] = useState<'study_hall' | 'library' | 'approved_room'>('library');
  const [remarks, setRemarks] = useState('');
  const [statuses, setStatuses] = useState<Record<string, StudyStatus>>({});
  const [focuses, setFocuses] = useState<Record<string, FocusRating>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const setStatus = (id: string, status: StudyStatus) => setStatuses(prev => ({ ...prev, [id]: status }));
  const setFocus = (id: string, focus: FocusRating) => setFocuses(prev => ({ ...prev, [id]: focus }));

  const submitRoom = () => {
    if (!canEdit || !roomOccupants.length) return;
    roomOccupants.forEach(student => {
      saveStudyLog({
        date: new Date().toISOString().split('T')[0],
        studentId: student.id,
        studentName: student.name,
        roomNumber: student.roomNumber || '—',
        location,
        status: statuses[student.id] ?? 'absent',
        focusRating: focuses[student.id] ?? 'focused',
        remarks: remarks || undefined,
        recordedBy: currentUser.name,
      });
    });
    setRemarks('');
    flash(`Saved study hours for ${roomOccupants.length} residents in Room ${selectedRoom}.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Study Hours & Library Time</h2>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
              Academic Focus
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory evening study period (07:30 PM - 09:30 PM) in the dorm study hall or campus library.
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

      {/* By-room roll call */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Study Roll Call</h3>
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
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 items-center gap-1.5 flex">
              <Library className="w-3.5 h-3.5" />
              Study location
            </label>
            <select value={location} onChange={e => setLocation(e.target.value as any)} className={FIELD}>
              <option value="library">Campus Library</option>
              <option value="study_hall">Dorm Study Hall</option>
              <option value="approved_room">Approved Quiet Room</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Session notes</label>
            <input
              type="text"
              placeholder="e.g. Thesis draft work, or noise warning issued"
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
        </div>

        <div className="divide-y divide-slate-800/70">
          {roomOccupants.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
          )}
          {roomOccupants.map(student => {
            const status = statuses[student.id] ?? 'absent';
            const focus = focuses[student.id] ?? 'focused';
            return (
              <div key={student.id} className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                </div>

                {canEdit ? (
                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="flex gap-1.5 flex-wrap">
                      {(Object.keys(STATUS_META) as StudyStatus[]).map(s => {
                        const meta = STATUS_META[s];
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
                            className={`min-w-touch min-h-touch rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                              selected ? meta.active : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(Object.keys(FOCUS_META) as FocusRating[]).map(f => {
                        const meta = FOCUS_META[f];
                        const Icon = meta.icon;
                        const selected = focus === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            title={meta.label}
                            aria-label={`${student.name}: ${meta.label}`}
                            aria-pressed={selected}
                            onClick={() => setFocus(student.id, f)}
                            className={`min-w-touch min-h-touch rounded-xl flex items-center justify-center px-2 gap-1 transition-all active:scale-95 ${
                              selected ? meta.active : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${STATUS_META[status].label === 'Present' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                      {STATUS_META[status].label}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${FOCUS_META[focus].label === 'Focused & Silent' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                      {FOCUS_META[focus].label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canEdit && roomOccupants.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
            <button
              onClick={submitRoom}
              className="w-full min-h-touch bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>Save Room {selectedRoom} Study Hours</span>
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Study & Library Logs
          </h3>
          <span className="text-xs text-slate-400">{studyLogs.length} entries</span>
        </div>
        {studyLogs.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No study logs recorded yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {studyLogs.map(log => (
            <div key={log.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{log.studentName}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
                    log.status === 'late' ? 'bg-amber-950 text-amber-300' :
                    log.status === 'absent' ? 'bg-rose-950 text-rose-300' :
                    'bg-sky-950 text-sky-300'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">{log.date}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room {log.roomNumber} · <span className="capitalize text-indigo-300 font-medium">{log.location.replace('_', ' ')}</span>
              </p>
              <p className={`text-[11px] mt-0.5 font-medium ${
                log.focusRating === 'focused' ? 'text-emerald-400' :
                log.focusRating === 'distracted' ? 'text-amber-400' : 'text-rose-400 font-bold'
              }`}>
                {log.focusRating.replace('_', ' ')}
              </p>
              {log.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{log.remarks}</p>}
              <p className="text-[11px] text-slate-500 mt-0.5">Proctor: {log.recordedBy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};