import React, { useEffect, useState } from 'react';
import {
  Clock,
  Library,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Save,
  Lock,
  Users,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { RecordOverrideControls } from './RecordOverrideControls';
import { formatFullDate, formatTime12h } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';

type StudyStatus = 'present' | 'absent';
type Quietness = 'quiet' | 'noisy';

const STATUS_META: Record<StudyStatus, { label: string; icon: React.ComponentType<{ className?: string }>; active: string; chip: string }> = {
  present: { label: 'Present', icon: CheckCircle2, active: 'bg-emerald-600 text-white', chip: 'bg-emerald-950 text-emerald-300' },
  absent: { label: 'Absent', icon: XCircle, active: 'bg-rose-600 text-white', chip: 'bg-rose-950 text-rose-300' },
};

const QUIET_META: Record<Quietness, { label: string; icon: React.ComponentType<{ className?: string }>; active: string; chip: string }> = {
  quiet: { label: 'Quiet', icon: VolumeX, active: 'bg-emerald-600 text-white', chip: 'bg-emerald-950 text-emerald-300' },
  noisy: { label: 'Noisy', icon: Volume2, active: 'bg-rose-600 text-white', chip: 'bg-rose-950 text-rose-300' },
};

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40';

/** The check taken at the hall itself rather than room by room. */
const ALL_ROOMS = '__all__';

export const StudyHoursLibraryView: React.FC = () => {
  const { studyLogs, users, rooms, saveStudyLog, canEdit, currentUser, settings } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');
  const today = useManilaToday();

  const studyWindow =
    settings.studyStart && settings.studyEnd
      ? `${formatTime12h(settings.studyStart)} - ${formatTime12h(settings.studyEnd)}`
      : 'not yet set';

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [checkTime, setCheckTime] = useState(settings.studyStart || '19:30');
  const [location, setLocation] = useState<'study_hall' | 'library' | 'approved_room'>('library');
  const [remarks, setRemarks] = useState('');
  const [statuses, setStatuses] = useState<Record<string, StudyStatus>>({});
  const [quietness, setQuietness] = useState<Record<string, Quietness>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const allRooms = selectedRoom === ALL_ROOMS;
  // The hall fills from every room at once, so the dormitory can be listed as
  // one queue and each resident marked off as he arrives.
  const roomOccupants = allRooms
    ? [...occupants].sort(
        (a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || '') || a.name.localeCompare(b.name)
      )
    : occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  /** Tonight's study check for this resident, if one is already on file. */
  const filedFor = (id: string) => studyLogs.find(l => l.studentId === id && l.date === today);

  const statusFor = (id: string): StudyStatus => statuses[id] ?? filedFor(id)?.status ?? 'present';
  const quietFor = (id: string): Quietness => quietness[id] ?? filedFor(id)?.quietness ?? 'quiet';

  const setStatus = (id: string, status: StudyStatus) => setStatuses(prev => ({ ...prev, [id]: status }));
  const setQuiet = (id: string, quiet: Quietness) => setQuietness(prev => ({ ...prev, [id]: quiet }));

  const buildLog = (student: (typeof occupants)[number]) => ({
    date: today,
    studentId: student.id,
    studentName: student.name,
    roomNumber: student.roomNumber || '—',
    location,
    checkTime,
    status: statusFor(student.id),
    quietness: quietFor(student.id),
    remarks: remarks || undefined,
    recordedBy: currentUser.name,
  });

  const submitRoom = () => {
    if (!canEdit || !roomOccupants.length) return;
    roomOccupants.forEach(student => saveStudyLog(buildLog(student)));
    setRemarks('');
    flash(`Saved study hours for ${roomOccupants.length} residents in Room ${selectedRoom}.`);
  };

  /** One resident logged on his own, as he turns up at the hall. */
  const submitStudent = (student: (typeof occupants)[number]) => {
    if (!canEdit) return;
    saveStudyLog(buildLog(student));
    flash(
      `${student.name} logged at ${formatTime12h(checkTime)}. Saving the name again corrects tonight's record rather than filing a second one.`
    );
  };

  const loggedCount = roomOccupants.filter(o => filedFor(o.id)).length;

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
            Mandatory evening study period ({studyWindow}) in the dorm study hall or campus library.
            Set the hours under Schedule Settings.
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
            <h3 className="font-bold text-white text-sm">{allRooms ? 'Hall Roll Call' : 'Study Roll Call'}</h3>
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

        <div className="p-3 sm:p-4 border-b border-slate-800/70 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Check time
            </label>
            <input
              type="time"
              value={checkTime}
              onChange={e => setCheckTime(e.target.value)}
              disabled={!canEdit}
              className={`${FIELD} disabled:opacity-40`}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Library className="w-3.5 h-3.5" />
              Study location
            </label>
            <select value={location} onChange={e => setLocation(e.target.value as any)} className={FIELD}>
              <option value="library">Campus Library</option>
              <option value="study_hall">Dorm Study Hall</option>
              <option value="approved_room">Approved Quiet Room</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Session notes</label>
            <input
              type="text"
              placeholder="e.g. Thesis draft work"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={!canEdit}
              className={`${FIELD} disabled:opacity-40`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">{allRooms ? 'All rooms' : `Room ${selectedRoom || '—'}`}</span> · {roomOccupants.length} residents
            {roomOccupants.length > 0 && (
              <span className={loggedCount === roomOccupants.length ? ' text-emerald-400' : ''}>
                {' '}· {loggedCount}/{roomOccupants.length} logged
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400">{formatTime12h(checkTime)}</p>
        </div>

        <div className="divide-y divide-slate-800/70">
          {roomOccupants.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">
              {allRooms ? 'No residents on file.' : 'No residents assigned to this room.'}
            </p>
          )}
          {roomOccupants.map(student => {
            const status = statusFor(student.id);
            const quiet = quietFor(student.id);
            const filed = filedFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {allRooms ? `Room ${student.roomNumber || '—'}` : student.email}
                  </p>
                  {filed && (
                    <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_META[filed.status].chip}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {STATUS_META[filed.status].label} · {formatTime12h(filed.checkTime)}
                    </span>
                  )}
                </div>

                {canEdit ? (
                  <div className="flex flex-wrap gap-1.5 sm:justify-end">
                    {(Object.keys(STATUS_META) as StudyStatus[]).map(s => {
                      const meta = STATUS_META[s];
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
                    <span className="w-px bg-slate-800 mx-0.5 self-stretch" aria-hidden="true" />
                    {(Object.keys(QUIET_META) as Quietness[]).map(q => {
                      const meta = QUIET_META[q];
                      const Icon = meta.icon;
                      const selected = quiet === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          aria-label={`${student.name}: ${meta.label}`}
                          aria-pressed={selected}
                          onClick={() => setQuiet(student.id, q)}
                          className={`min-h-touch px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                            selected ? meta.active : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      title={`Save ${student.name} on his own`}
                      aria-label={`Save ${student.name}`}
                      onClick={() => submitStudent(student)}
                      className={`min-h-touch px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${
                        filed
                          ? 'bg-slate-800 text-indigo-300 border border-indigo-800/60 hover:bg-slate-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{filed ? 'Update' : 'Save'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${STATUS_META[status].chip}`}>
                      {STATUS_META[status].label}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${QUIET_META[quiet].chip}`}>
                      {QUIET_META[quiet].label}
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
              <span>Save All · {allRooms ? 'Whole Dormitory' : `Room ${selectedRoom}`} Study Hours</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Or save each resident as he turns up — the hall does not fill by room.
            </p>
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
                    log.status === 'present' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.quietness === 'noisy' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {(log.quietness ?? 'quiet').toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 text-right">{formatFullDate(log.date)}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {log.checkTime && `${formatTime12h(log.checkTime)} · `}Room {log.roomNumber} ·{' '}
                <span className="capitalize text-indigo-300 font-medium">{log.location.replace('_', ' ')}</span>
              </p>
              {log.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{log.remarks}</p>}
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-[11px] text-slate-500 truncate">
                  Proctor: {log.recordedBy}
                  {log.overriddenBy && <span className="text-amber-300/90"> · overridden by {log.overriddenBy}</span>}
                </p>
                <RecordOverrideControls kind="study" record={log} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
