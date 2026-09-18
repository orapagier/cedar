import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Shirt,
  Scissors,
  IdCard,
  Footprints,
  Save,
  Lock,
  Users,
  Sunrise,
  Sun,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { RecordOverrideControls } from './RecordOverrideControls';
import { DepartureSession } from '../types/dorm';
import { manilaHour, formatFullDate, formatTime12h } from '../utils/date';
import { ResidentSearch } from './ui/ResidentSearch';
import { listedResidents } from '../utils/residentSearch';
import { useManilaToday } from '../hooks/useManilaToday';
import { Segmented } from './ui/Segmented';

const SESSIONS: { id: DepartureSession; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'morning', label: 'Morning', icon: Sunrise },
  { id: 'afternoon', label: 'Afternoon', icon: Sun },
];

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40';

/** The check taken standing at the gate rather than room by room. */
const ALL_ROOMS = '__all__';

export const SchoolDepartureUniformView: React.FC = () => {
  const { uniformLogs, users, rooms, saveUniformLog, canEdit, isSuperAdmin, currentUser, settings } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const today = useManilaToday();
  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [search, setSearch] = useState('');
  // Opens on whichever run is current: the afternoon one from noon onwards.
  const [session, setSession] = useState<DepartureSession>(() => (manilaHour() < 12 ? 'morning' : 'afternoon'));
  const [departureTime, setDepartureTime] = useState(
    () => (manilaHour() < 12 ? settings.departureStart : settings.departureAfternoonStart) || '07:00'
  );
  const [remarks, setRemarks] = useState('');
  const [compliance, setCompliance] = useState<Record<string, { uniform: boolean; hair: boolean; idBadge: boolean; shoes: boolean }>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const allRooms = selectedRoom === ALL_ROOMS;
  // Boys leave for school as they are ready, so the whole dormitory can stand
  // as one queue at the gate and each be cleared as he goes through.
  const roomOccupants = allRooms
    ? [...occupants].sort(
        (a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || '') || a.name.localeCompare(b.name)
      )
    : occupants.filter(o => o.roomNumber === selectedRoom);

  // Boys go through the gate in whatever order they are ready, so a name is
  // the quickest way to the right row. A search runs across every room and the
  // run below clears whoever it turns up.
  const searching = search.trim().length > 0;
  const listed = listedResidents(search, occupants, roomOccupants);
  const scopeLabel = searching
    ? `Matching "${search.trim()}"`
    : allRooms ? 'All rooms' : `Room ${selectedRoom || '—'}`;

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const start = (session === 'morning' ? settings.departureStart : settings.departureAfternoonStart)
    || (session === 'morning' ? '07:00' : '13:00');
  const end = (session === 'morning' ? settings.departureEnd : settings.departureAfternoonEnd)
    || (session === 'morning' ? '07:35' : '13:35');
  const isTimeOnSchedule = departureTime >= start && departureTime <= end;

  // Switching runs re-arms the clock with that run's scheduled start time, and
  // reads the new run off the register rather than carrying marks across.
  const switchSession = (next: DepartureSession) => {
    setSession(next);
    setCompliance({});
    setDepartureTime(
      (next === 'morning' ? settings.departureStart : settings.departureAfternoonStart)
        || (next === 'morning' ? '07:00' : '13:00')
    );
  };

  /** What was already logged for this resident on this date and run. */
  const loggedFor = (studentId: string) =>
    uniformLogs.find(
      l => l.studentId === studentId && l.date === today && (l.session ?? 'morning') === session
    );

  const setFlag = (id: string, key: keyof (typeof compliance)[string], value: boolean) => {
    setCompliance(prev => ({
      ...prev,
      [id]: { uniform: true, hair: true, idBadge: true, shoes: true, ...prev[id], [key]: value },
    }));
  };

  // A row reads from the draft first, then from whatever was already cleared
  // for this run, so a gate half-checked earlier opens showing what it holds.
  const flagsFor = (id: string) => {
    const filed = loggedFor(id);
    return {
      uniform: filed?.uniformCompliant ?? true,
      hair: filed?.hairGroomingCompliant ?? true,
      idBadge: filed?.idBadgeCompliant ?? true,
      shoes: filed?.shoesCompliant ?? true,
      ...compliance[id],
    };
  };

  const buildLog = (student: (typeof occupants)[number]) => {
    const flags = flagsFor(student.id);
    const fullyCompliant = flags.uniform && flags.hair && flags.idBadge && flags.shoes && isTimeOnSchedule;
    return {
      date: today,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      session,
      departureTime,
      uniformCompliant: flags.uniform,
      hairGroomingCompliant: flags.hair,
      idBadgeCompliant: flags.idBadge,
      shoesCompliant: flags.shoes,
      isDepartureOnSchedule: isTimeOnSchedule,
      status: (fullyCompliant ? 'cleared' : 'flagged') as 'cleared' | 'flagged',
      remarks: remarks || (!isTimeOnSchedule
        ? `Departed outside the ${session} window ${formatTime12h(start)}-${formatTime12h(end)} (${formatTime12h(departureTime)})`
        : undefined),
      inspectedBy: currentUser.name,
    };
  };

  /** Residents this run has no gate clearance for yet. */
  const stillToTake = () => listed.filter(o => !loggedFor(o.id));

  const submitRoom = () => {
    if (!canEdit || !listed.length) return;
    const total = stillToTake().reduce(
      (acc, student) => {
        const r = saveUniformLog(buildLog(student));
        return { filed: acc.filed + r.filed, kept: acc.kept + r.kept };
      },
      { filed: 0, kept: 0 }
    );
    setRemarks('');
    flash(
      total.filed === 0
        ? `${scopeLabel} is already cleared for the ${session} run — nothing changed.`
        : `Saved ${session} gate clearance for ${total.filed} ${total.filed === 1 ? 'resident' : 'residents'} · ${scopeLabel}.`
    );
  };

  /** One resident cleared on his own, at the moment he goes through the gate. */
  const submitStudent = (student: (typeof occupants)[number]) => {
    if (!canEdit) return;
    const { filed } = saveUniformLog(buildLog(student));
    flash(
      filed
        ? `${student.name} cleared for the ${session} run at ${formatTime12h(departureTime)}.`
        : `${student.name} is already cleared for the ${session} run — how he went out the gate stands.${
            isSuperAdmin ? ' Use the pencil on his row to correct it.' : ' Ask the Dean to correct it.'
          }`
    );
  };

  const clearedCount = listed.filter(o => loggedFor(o.id)).length;
  const remaining = listed.length - clearedCount;

  const checklist = [
    { key: 'uniform' as const, label: 'Uniform', desc: 'Ironed & tucked in', icon: Shirt },
    { key: 'hair' as const, label: 'Haircut', desc: 'Above collar', icon: Scissors },
    { key: 'idBadge' as const, label: 'ID Badge', desc: 'Worn & visible', icon: IdCard },
    { key: 'shoes' as const, label: 'Shoes', desc: 'Black leather', icon: Footprints },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Departure & Uniform Check</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              School Gate Check
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Two school runs a day — morning <span className="whitespace-nowrap">{formatTime12h(settings.departureStart)}</span> and afternoon{' '}
            <span className="whitespace-nowrap">{formatTime12h(settings.departureAfternoonStart)}</span> (set under Schedule Settings) — plus uniform, ID badge,
            haircut, and shoe compliance.
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

      {/* By-room gate check */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                {session === 'morning' ? 'Morning' : 'Afternoon'} Departure Roll Call
              </h3>
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

          <Segmented<DepartureSession>
            ariaLabel="Departure run"
            value={session}
            onChange={switchSession}
            options={SESSIONS.map(o => ({
              value: o.id,
              label: `${o.label} · ${formatTime12h(o.id === 'morning' ? settings.departureStart : settings.departureAfternoonStart)}`,
              icon: o.icon,
              activeClass: 'bg-emerald-600 text-white shadow-sm',
            }))}
          />
        </div>

        <div className="p-3 sm:p-4 border-b border-slate-800/70 flex flex-col sm:flex-row gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Departure time</span>
            </label>
            <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} disabled={!canEdit} className={`${FIELD} sm:max-w-[200px] disabled:opacity-40`} />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Gate remarks</label>
            <input
              type="text"
              placeholder="e.g. Untucked shirt, long hair"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={!canEdit}
              className={`${FIELD} disabled:opacity-40`}
            />
          </div>
        </div>

        {!isTimeOnSchedule && (
          <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Warning: Outside the {session} departure window ({formatTime12h(start)} - {formatTime12h(end)}).
          </div>
        )}

        <div className="px-4 py-3 border-b border-slate-800/70">
          <ResidentSearch value={search} onChange={setSearch} matches={listed.length} />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">{scopeLabel}</span> · {listed.length} residents
          </p>
          <p className="text-xs text-slate-400">
            {clearedCount}/{listed.length} logged this run
          </p>
        </div>

        <div className="divide-y divide-slate-800/70">
          {listed.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">
              {searching
                ? 'Nobody in the dormitory by that name.'
                : allRooms ? 'No residents on file.' : 'No residents assigned to this room.'}
            </p>
          )}
          {listed.map(student => {
            const flags = flagsFor(student.id);
            const logged = loggedFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {searching || allRooms ? `Room ${student.roomNumber || '—'}` : student.email}
                  </p>
                  {logged && (
                    <span className={`mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      logged.status === 'cleared' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {logged.status === 'cleared' ? 'Cleared' : 'Flagged'} · {formatTime12h(logged.departureTime)}
                    </span>
                  )}
                </div>

                {logged ? (
                  // This run already holds his clearance; the Dean's pencil is
                  // what changes it.
                  <div className="flex flex-wrap items-center gap-1.5">
                    {checklist.map(item => (
                      <span key={item.key} className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        flags[item.key] ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                      }`}>
                        {flags[item.key] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.label}
                      </span>
                    ))}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-1">
                      <Lock className="w-3.5 h-3.5" />
                      On file
                    </span>
                    <RecordOverrideControls kind="uniform" record={logged} />
                  </div>
                ) : canEdit ? (
                  <div className="flex flex-wrap gap-1.5">
                    {checklist.map(item => {
                      const Icon = item.icon;
                      const ok = flags[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          title={`${item.label} — ${item.desc}`}
                          aria-pressed={ok}
                          onClick={() => setFlag(student.id, item.key, !ok)}
                          className={`min-h-touch rounded-xl px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border transition-all active:scale-95 ${
                            ok
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.label}
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      title={`Clear ${student.name} on his own`}
                      aria-label={`Save ${student.name}`}
                      onClick={() => submitStudent(student)}
                      className={`min-h-touch rounded-xl px-2.5 flex items-center gap-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                        logged
                          ? 'bg-slate-800 text-emerald-300 border border-emerald-800/60 hover:bg-slate-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {logged ? 'Update' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {checklist.map(item => (
                      <span key={item.key} className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        flags[item.key] ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                      }`}>
                        {flags[item.key] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canEdit && listed.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
            <button
              onClick={submitRoom}
              disabled={remaining === 0}
              className="w-full min-h-touch bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:active:scale-100"
            >
              <Save className="w-4 h-4" />
              <span>
                {remaining === 0
                  ? `${scopeLabel} — ${session === 'morning' ? 'Morning' : 'Afternoon'} Run Cleared`
                  : `Clear the Remaining ${remaining} · ${scopeLabel}`}
              </span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Clear each resident at the gate as he leaves, or sweep whoever is left. This run holds one
              clearance per resident — how he actually went out the gate stands.
            </p>
          </div>
        )}
      </div>

      {/* Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Gate Departure Register
          </h3>
          <span className="text-xs text-slate-400">{uniformLogs.length} logged departures</span>
        </div>
        {uniformLogs.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No departure logs recorded yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {uniformLogs.map(log => (
            <div key={log.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{log.studentName}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.status === 'cleared' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`font-mono font-bold text-xs ${log.isDepartureOnSchedule ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatTime12h(log.departureTime)}
                  </span>
                  <RecordOverrideControls kind="uniform" record={log} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room {log.roomNumber} · {log.session === 'afternoon' ? 'Afternoon' : 'Morning'} run ·{' '}
                {formatFullDate(log.date)} · by {log.inspectedBy}
                {log.overriddenBy && <span className="text-amber-300/90"> · overridden by {log.overriddenBy}</span>}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: 'Uniform', ok: log.uniformCompliant },
                  { label: 'Haircut', ok: log.hairGroomingCompliant },
                  { label: 'ID Badge', ok: log.idBadgeCompliant },
                  { label: 'Shoes', ok: log.shoesCompliant },
                ].map(c => (
                  <span key={c.label} className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                    c.ok ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                  }`}>
                    {c.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {c.label}
                  </span>
                ))}
              </div>
              {log.remarks && <p className="text-[11px] text-slate-400 mt-1.5">{log.remarks}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};