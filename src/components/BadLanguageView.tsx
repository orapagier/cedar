import React, { useEffect, useState } from 'react';
import {
  MessageSquareWarning,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
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
import {
  LANGUAGE_KIND_LABELS,
  LANGUAGE_SETTING_LABELS,
  LANGUAGE_DISCOVERY_LABELS,
} from '../utils/checkViolations';
import { BadLanguageLog } from '../types/dorm';
import { RecordOverrideControls } from './RecordOverrideControls';
import { Modal } from './ui/Modal';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40';

const MODAL_FIELD = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white';

const KIND_ORDER: BadLanguageLog['kind'][] = [
  'cursing',
  'vulgar_talk',
  'blasphemy',
  'name_calling',
  'abusive',
];

const SETTING_ORDER: BadLanguageLog['setting'][] = [
  'dorm_room',
  'hallway_grounds',
  'worship',
  'study_hours',
  'dining_kitchen',
  'school_run',
  'online_chat',
  'other',
];

const DISCOVERY_ORDER: BadLanguageLog['discoveredVia'][] = [
  'staff_heard',
  'reported',
  'self_admitted',
  'written',
];

const STATUS_META: Record<BadLanguageLog['status'], { label: string; classes: string }> = {
  confirmed: { label: 'Confirmed', classes: 'bg-orange-950 text-orange-300 border border-orange-700/50' },
  excused: { label: 'Excused', classes: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' },
};

/** How long a resident's speech record reaches back when counting repeats. */
const REPEAT_WINDOW_DAYS = 30;

const daysAgo = (days: number) => {
  const d = new Date(`${manilaToday()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

/**
 * The register of residents heard cursing, swearing or otherwise speaking foul
 * language. It is filed room by room from the resident's own row, the way every
 * other check is taken, and each confirmed report puts a demerit on that
 * resident's standing until the Dean excuses it.
 */
export const BadLanguageView: React.FC = () => {
  const {
    badLanguageLogs,
    users,
    rooms,
    saveBadLanguageLog,
    updateBadLanguageLog,
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

  // Report form
  const [studentId, setStudentId] = useState(occupants[0]?.id || '');
  const [date, setDate] = useState(() => manilaToday());
  const [heardTime, setHeardTime] = useState(() => manilaTimeValue());
  const [kind, setKind] = useState<BadLanguageLog['kind']>('cursing');
  const [setting, setSetting] = useState<BadLanguageLog['setting']>('dorm_room');
  const [quote, setQuote] = useState('');
  const [directedAt, setDirectedAt] = useState('');
  const [discoveredVia, setDiscoveredVia] = useState<BadLanguageLog['discoveredVia']>('staff_heard');
  const [apologyMade, setApologyMade] = useState(false);
  const [parentNotified, setParentNotified] = useState(false);
  const [remarks, setRemarks] = useState('');

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  // A report names a boy, and the room picker was only ever a way of finding
  // him. A search across the whole dormitory is the shorter road.
  const searching = search.trim().length > 0;
  const listed = listedResidents(search, occupants, roomOccupants);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  // Reports are always filed from a resident's own row, so the form opens on
  // that resident with the clock already at the moment it was heard.
  const openLogFor = (student: typeof occupants[number]) => {
    setStudentId(student.id);
    setDate(manilaToday());
    setHeardTime(manilaTimeValue());
    setKind('cursing');
    setSetting('dorm_room');
    setQuote('');
    setDirectedAt('');
    setDiscoveredVia('staff_heard');
    setApologyMade(false);
    setParentNotified(false);
    setRemarks('');
    setShowLogModal(true);
  };

  const loggingStudent = occupants.find(o => o.id === studentId);

  const reportsFor = (sid: string) =>
    badLanguageLogs
      .filter(l => l.studentId === sid)
      .sort((a, b) => b.date.localeCompare(a.date));

  // A first slip and a standing habit are different conversations, so a
  // resident's row says how often this has come up lately.
  const windowStart = daysAgo(REPEAT_WINDOW_DAYS);
  const recentCountFor = (sid: string) =>
    badLanguageLogs.filter(l => l.studentId === sid && l.status === 'confirmed' && l.date >= windowStart).length;

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === studentId);
    if (!student) return;
    saveBadLanguageLog({
      date,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      heardTime,
      kind,
      setting,
      quote: quote || undefined,
      directedAt: directedAt || undefined,
      discoveredVia,
      apologyMade,
      parentNotified,
      status: 'confirmed',
      remarks: remarks || undefined,
      loggedBy: currentUser.name,
    });
    setShowLogModal(false);
    flash(`Logged ${student.name} for ${LANGUAGE_KIND_LABELS[kind].toLowerCase()} on ${formatFullDate(date)}.`);
  };

  const confirmedReports = badLanguageLogs.filter(l => l.status === 'confirmed');
  const loggedToday = badLanguageLogs.filter(l => l.date === today);
  const awaitingApology = confirmedReports.filter(l => l.directedAt && !l.apologyMade);

  const excuse = (log: BadLanguageLog) => {
    const reason = window.prompt(
      `Why is ${log.studentName}'s report excused?\n\nThe demerit it carries is withdrawn.`,
      log.excuseReason || 'Misheard — the words were not his',
    );
    if (reason === null) return;
    updateBadLanguageLog(log.id, { status: 'excused', excuseReason: reason || undefined });
    flash(`${log.studentName}'s report excused — the demerit is withdrawn.`);
  };

  const reconfirm = (log: BadLanguageLog) => {
    updateBadLanguageLog(log.id, { status: 'confirmed', excuseReason: undefined });
    flash(`${log.studentName}'s report stands.`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Foul Language</h2>
            <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              Speech Register
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Room by room, record a resident heard cursing, swearing or speaking foul language. Each confirmed
            report is 1 demerit — 2 for abusive or threatening words — and a reflection on clean speech; excuse it and the demerit is withdrawn.
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
          <p className={`text-2xl font-bold ${loggedToday.length ? 'text-orange-400' : 'text-slate-500'}`}>
            {loggedToday.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <HeartHandshake className="w-3 h-3" /> Apology Owed
          </p>
          <p className={`text-2xl font-bold ${awaitingApology.length ? 'text-amber-400' : 'text-slate-500'}`}>
            {awaitingApology.length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Confirmed</p>
          <p className="text-2xl font-bold text-orange-400">{confirmedReports.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Excused</p>
          <p className="text-2xl font-bold text-emerald-400">
            {badLanguageLogs.filter(l => l.status === 'excused').length}
          </p>
        </div>
      </div>

      {/* By-room logging */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-orange-400" />
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
            const report = reportsFor(student.id)[0];
            const recent = recentCountFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {searching ? `Room ${student.roomNumber || '—'}` : student.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {recent > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          recent >= 3
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                        }`}>
                          {recent} in {REPEAT_WINDOW_DAYS} days
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                          Clean speech record
                        </span>
                      )}
                      {report && (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[report.status].classes}`}>
                            {STATUS_META[report.status].label}
                          </span>
                          <span className="text-slate-400">last {formatFullDate(report.date)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => openLogFor(student)}
                      className="shrink-0 min-h-touch px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Log Report
                    </button>
                  )}
                </div>

                {report && (
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-400 space-y-0.5">
                    <p>
                      <span className="text-slate-500 font-medium">Heard:</span> {formatTime12h(report.heardTime)} ·{' '}
                      {LANGUAGE_KIND_LABELS[report.kind]}
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Where:</span>{' '}
                      {LANGUAGE_SETTING_LABELS[report.setting]}
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-slate-500 font-medium">Said to:</span>{' '}
                      {report.directedAt || 'No one in particular'}
                    </p>
                    {report.quote && <p className="italic text-slate-500">"{report.quote}"</p>}
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
            <Users className="w-4 h-4 text-orange-400" />
            Foul Language Register
          </h3>
          <span className="text-xs text-slate-400">{badLanguageLogs.length} records</span>
        </div>
        {badLanguageLogs.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">
            No reports on file — speech in the dormitory has been clean.
          </p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {badLanguageLogs.map(log => (
            <div key={log.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {log.studentName} <span className="text-slate-500 font-normal">· Room {log.roomNumber}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatFullDate(log.date)} · heard {formatTime12h(log.heardTime)} ·{' '}
                    {LANGUAGE_KIND_LABELS[log.kind]}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {log.status === 'confirmed' && log.directedAt && !log.apologyMade && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/50">
                      Apology Owed
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[log.status].classes}`}>
                    {STATUS_META[log.status].label}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                {LANGUAGE_SETTING_LABELS[log.setting]} · {LANGUAGE_DISCOVERY_LABELS[log.discoveredVia].toLowerCase()} ·{' '}
                {log.directedAt ? `said to ${log.directedAt}` : 'not aimed at anyone'} · parents{' '}
                {log.parentNotified ? 'notified' : 'not notified'}
              </p>
              {log.quote && <p className="text-[11px] text-slate-300 mt-0.5 italic">"{log.quote}"</p>}
              {log.remarks && <p className="text-[11px] text-slate-400 mt-0.5 italic">{log.remarks}</p>}
              {log.apologyMade && (
                <p className="text-[11px] text-emerald-400 mt-0.5">Apology made.</p>
              )}
              {log.status === 'excused' && (
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  Excused: {log.excuseReason || 'not as reported'}
                </p>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {!log.apologyMade && (
                    <button
                      onClick={() => {
                        updateBadLanguageLog(log.id, { apologyMade: true });
                        flash(`Noted that ${log.studentName} apologized.`);
                      }}
                      className="min-h-touch px-2.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" /> Apology Made
                    </button>
                  )}
                  {!log.parentNotified && (
                    <button
                      onClick={() => {
                        updateBadLanguageLog(log.id, { parentNotified: true });
                        flash(`Noted that ${log.studentName}'s parents were told.`);
                      }}
                      className="min-h-touch px-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Parents Told
                    </button>
                  )}
                  {log.status === 'confirmed' ? (
                    <button
                      onClick={() => excuse(log)}
                      className="min-h-touch px-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Excuse
                    </button>
                  ) : (
                    <button
                      onClick={() => reconfirm(log)}
                      className="min-h-touch px-2.5 bg-orange-950 hover:bg-orange-900 text-orange-300 border border-orange-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <MessageSquareWarning className="w-3.5 h-3.5" /> Reinstate
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-[11px] text-slate-500 truncate">
                  Logged by {log.loggedBy}
                  {log.overriddenBy && <span className="text-amber-300/90"> · overridden by {log.overriddenBy}</span>}
                </p>
                <RecordOverrideControls kind="badLanguage" record={log} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log modal */}
      {canEdit && showLogModal && (
        <Modal onClose={() => setShowLogModal(false)} label="Log a foul language report">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  Log Foul Language{loggingStudent ? ` — ${loggingStudent.name}` : ''}
                </h3>
                <p className="text-xs text-slate-400">
                  Room {loggingStudent?.roomNumber || '—'} · Cursing, swearing or foul speech
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

            <form onSubmit={submitReport} className="p-4 sm:p-6 space-y-3.5 text-xs">
              {loggingStudent && recentCountFor(loggingStudent.id) > 0 && (
                <div className="p-3 bg-amber-950/60 border border-amber-700/50 text-amber-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {recentCountFor(loggingStudent.id)} confirmed report
                    {recentCountFor(loggingStudent.id) === 1 ? '' : 's'} against this resident in the last{' '}
                    {REPEAT_WINDOW_DAYS} days — a habit, not a slip.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date heard</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={MODAL_FIELD} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Heard at</label>
                  <input type="time" value={heardTime} onChange={e => setHeardTime(e.target.value)} className={MODAL_FIELD} />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">What kind of language</label>
                <select
                  value={kind}
                  onChange={e => setKind(e.target.value as BadLanguageLog['kind'])}
                  className={MODAL_FIELD}
                >
                  {KIND_ORDER.map(k => (
                    <option key={k} value={k}>{LANGUAGE_KIND_LABELS[k]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Where it happened</label>
                <select
                  value={setting}
                  onChange={e => setSetting(e.target.value as BadLanguageLog['setting'])}
                  className={MODAL_FIELD}
                >
                  {SETTING_ORDER.map(st => (
                    <option key={st} value={st}>{LANGUAGE_SETTING_LABELS[st]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">What was said</label>
                <input
                  type="text"
                  placeholder="The words, as near as they were heard"
                  value={quote}
                  onChange={e => setQuote(e.target.value)}
                  className={MODAL_FIELD}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Kept verbatim on the record so a dean inquiry is not working from memory. Leave blank if you
                  would rather not write the words down.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Who it was said to</label>
                <input
                  type="text"
                  placeholder="e.g. A roommate, the RA — blank if aimed at no one"
                  value={directedAt}
                  onChange={e => setDirectedAt(e.target.value)}
                  className={MODAL_FIELD}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Naming someone here asks the resident for an apology as well as a reflection.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">How it came to light</label>
                <select
                  value={discoveredVia}
                  onChange={e => setDiscoveredVia(e.target.value as BadLanguageLog['discoveredVia'])}
                  className={MODAL_FIELD}
                >
                  {DISCOVERY_ORDER.map(via => (
                    <option key={via} value={via}>{LANGUAGE_DISCOVERY_LABELS[via]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Same label-over-control shape and height as the fields around it */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Apology made</label>
                  <button
                    type="button"
                    aria-pressed={apologyMade}
                    onClick={() => setApologyMade(v => !v)}
                    className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between gap-2 font-semibold transition-colors ${
                      apologyMade
                        ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{apologyMade ? 'Apologized' : 'Not yet'}</span>
                    {apologyMade ? <HeartHandshake className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
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
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Said in temper during a game, stopped when called out"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className={MODAL_FIELD}
                />
              </div>

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Filing this puts 1 demerit on the resident's standing (2 for abusive or threatening words) and calls for a reflection on clean speech.
                Excuse the record later if the words turn out not to have been his.
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
                  className="px-4 py-2 min-h-touch rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-500 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Log Report
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
