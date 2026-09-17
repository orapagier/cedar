import React, { useEffect, useState } from 'react';
import {
  Brush,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Save,
  Lock,
  Trash2,
  Star,
  Users,
  RotateCcw,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { CleaningHelperCheck } from '../types/dorm';
import { formatFullDate } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs redo',
  3: 'Acceptable',
  4: 'Good',
  5: 'Excellent',
};

const ratingChip = (rating: number) =>
  rating >= 4 ? 'bg-emerald-950 text-emerald-300' :
  rating === 3 ? 'bg-amber-950 text-amber-300' :
  'bg-rose-950 text-rose-300';

export const CleaningDutyView: React.FC = () => {
  const { cleaningDuties, users, rooms, assignCleaningDuty, saveCleaningDuty, canEdit } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');
  const today = useManilaToday();

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();

  const [dutyDate, setDutyDate] = useState(today);
  const [roomDraft, setRoomDraft] = useState(roomNumbers[0] || '');
  const [helped, setHelped] = useState<Record<string, boolean>>({});
  const [rating, setRating] = useState(5);
  const [garbageDisposed, setGarbageDisposed] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // The rostered crew for the day being viewed, if one has been set.
  const duty = cleaningDuties.find(d => d.date === dutyDate);
  const dutyRoom = duty?.roomNumber || '';
  const crew = occupants.filter(o => o.roomNumber === dutyRoom);

  // Reload the form whenever the day (or its crew) changes, so reopening a day
  // already checked shows what was recorded rather than a blank slate.
  useEffect(() => {
    if (!duty) {
      setHelped({});
      setRating(5);
      setGarbageDisposed(true);
      setRemarks('');
      return;
    }
    const restored: Record<string, boolean> = {};
    duty.helpers.forEach(h => { restored[h.studentId] = h.helped; });
    setHelped(restored);
    setRating(duty.rating);
    setGarbageDisposed(duty.garbageDisposed);
    setRemarks(duty.remarks || '');
  }, [duty?.id, duty?.roomNumber, duty?.status]);

  useEffect(() => {
    if (!roomDraft && roomNumbers.length) setRoomDraft(roomNumbers[0]);
  }, [roomNumbers, roomDraft]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const helpedFor = (studentId: string) => helped[studentId] ?? true;

  const setDutyRoom = (roomNumber: string) => {
    if (!canEdit || !roomNumber) return;
    assignCleaningDuty(dutyDate, roomNumber);
    flash(`Room ${roomNumber} is the cleaning crew for ${formatFullDate(dutyDate)}.`);
  };

  const submitDuty = () => {
    if (!canEdit || !duty || crew.length === 0) return;
    const helpers: CleaningHelperCheck[] = crew.map(student => ({
      studentId: student.id,
      studentName: student.name,
      helped: helpedFor(student.id),
    }));
    saveCleaningDuty({
      date: dutyDate,
      roomNumber: duty.roomNumber,
      helpers,
      rating,
      garbageDisposed,
      remarks: remarks || undefined,
    });
    const skipped = helpers.filter(h => !h.helped).length;
    flash(
      `Saved Room ${duty.roomNumber} cleaning duty — ${helpers.length - skipped} helped` +
      `${skipped ? `, ${skipped} flagged` : ''}.`
    );
  };

  const helpedCount = crew.filter(o => helpedFor(o.id)).length;
  const recentRotation = [...cleaningDuties].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Daily Cleaning Duty</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              Room Rotation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            One room cleans the dorm each day. Set the day's room, check who actually helped, then rate the work —
            garbage disposal included.
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

      {/* Today's crew */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Brush className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white text-sm">Cleaning Crew of the Day</h3>
        </div>

        <div className="p-3 sm:p-4 border-b border-slate-800/70 flex flex-col sm:flex-row gap-3">
          <div className="sm:max-w-[220px] w-full">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Duty date
            </label>
            <input
              type="date"
              value={dutyDate}
              onChange={e => setDutyDate(e.target.value)}
              className={FIELD}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Room on cleaning duty
            </label>
            <div className="flex gap-2">
              <select
                value={duty ? dutyRoom : roomDraft}
                onChange={e => {
                  setRoomDraft(e.target.value);
                  // Once the day has a crew, picking another room re-rosters it.
                  if (duty) setDutyRoom(e.target.value);
                }}
                disabled={!canEdit}
                className={`${FIELD} disabled:opacity-40`}
              >
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
              {canEdit && !duty && roomNumbers.length > 0 && (
                <button
                  onClick={() => setDutyRoom(roomDraft)}
                  className="shrink-0 min-h-touch px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
                >
                  Set crew
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            {duty ? (
              <>
                <span className="font-semibold text-white">Room {duty.roomNumber}</span> · {crew.length} residents ·{' '}
                {formatFullDate(dutyDate)}
              </>
            ) : (
              <>No crew set for {formatFullDate(dutyDate)}.</>
            )}
          </p>
          {duty && (
            <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
              duty.status === 'completed' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {duty.status === 'completed' ? 'Checked' : 'Pending check'}
            </span>
          )}
        </div>

        {/* Per-resident helped check */}
        <div className="divide-y divide-slate-800/70">
          {!duty && (
            <p className="p-6 text-center text-xs text-slate-500">
              Pick the room that cleans on this date to start checking who helped.
            </p>
          )}
          {duty && crew.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">Room {duty.roomNumber} has no residents assigned.</p>
          )}
          {duty && crew.map(student => {
            const didHelp = helpedFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                </div>

                {canEdit ? (
                  <div className="flex gap-1.5 sm:justify-end">
                    <button
                      type="button"
                      aria-pressed={didHelp}
                      onClick={() => setHelped(prev => ({ ...prev, [student.id]: true }))}
                      className={`min-h-touch px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                        didHelp ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Helped
                    </button>
                    <button
                      type="button"
                      aria-pressed={!didHelp}
                      onClick={() => setHelped(prev => ({ ...prev, [student.id]: false }))}
                      className={`min-h-touch px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                        !didHelp ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Did not help
                    </button>
                  </div>
                ) : (
                  <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                    didHelp ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {didHelp ? 'Helped' : 'Did not help'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Room-level rating */}
        {duty && crew.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Room {duty.roomNumber} cleanliness rating
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    type="button"
                    disabled={!canEdit}
                    aria-label={`${value} of 5 — ${RATING_LABELS[value]}`}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className={`min-h-touch flex-1 rounded-xl border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${
                      value <= rating
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-600'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${value <= rating ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                ))}
                <span className={`shrink-0 ml-1 px-2 py-1 rounded-md text-[11px] font-bold ${ratingChip(rating)}`}>
                  {rating}/5 · {RATING_LABELS[rating]}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canEdit}
              aria-pressed={garbageDisposed}
              onClick={() => setGarbageDisposed(v => !v)}
              className={`w-full min-h-touch px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                garbageDisposed
                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-700/50 text-rose-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span className="text-left">
                  <span className="block">Garbage collected and disposed</span>
                  <span className="block text-[10px] font-normal text-slate-400">Bins emptied, segregated, taken out</span>
                </span>
              </span>
              {garbageDisposed ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            </button>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Inspector remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Corridor mopped, stairwell dust left behind"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                disabled={!canEdit}
                className={`${FIELD} disabled:opacity-40`}
              />
            </div>

            {(rating <= 2 || !garbageDisposed) && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-300 text-[11px] flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Saving will log a 1 pt violation for each resident who did the cleaning at this standard.</span>
              </div>
            )}

            {canEdit && (
              <button
                onClick={submitDuty}
                className="w-full min-h-touch bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                <Save className="w-4 h-4" />
                <span>Save Room {duty.roomNumber} Cleaning Check ({helpedCount}/{crew.length} helped)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rotation history */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Cleaning Rotation
          </h3>
          <span className="text-xs text-slate-400">{cleaningDuties.length} days recorded</span>
        </div>
        {recentRotation.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No cleaning days recorded yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {recentRotation.map(record => {
            const skipped = record.helpers.filter(h => !h.helped);
            return (
              <button
                key={record.id}
                onClick={() => setDutyDate(record.date)}
                className="w-full text-left p-3 sm:p-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">Room {record.roomNumber}</p>
                    {record.status === 'completed' ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${ratingChip(record.rating)}`}>
                        {record.rating}/5
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 bg-slate-800 text-slate-400">
                        PENDING
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 text-right">{formatFullDate(record.date)}</span>
                </div>
                {record.status === 'completed' && (
                  <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {record.helpers.filter(h => h.helped).length}/{record.helpers.length} helped
                    </span>
                    <span className={record.garbageDisposed ? 'text-emerald-400' : 'text-rose-400 font-medium'}>
                      Garbage {record.garbageDisposed ? 'disposed' : 'not disposed'}
                    </span>
                  </p>
                )}
                {skipped.length > 0 && (
                  <p className="text-[11px] text-rose-300 mt-0.5 truncate">
                    Skipped: {skipped.map(h => h.studentName).join(', ')}
                  </p>
                )}
                {record.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{record.remarks}</p>}
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set by {record.assignedBy}
                  {record.recordedBy ? ` · Checked by ${record.recordedBy}` : ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
