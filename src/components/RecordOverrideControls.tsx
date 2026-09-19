import React, { useState } from 'react';
import { PenLine, Trash2, ShieldCheck, X, CheckCircle2, XCircle } from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { CheckKind, CHECK_LABELS } from '../utils/checkViolations';
import { OccupantInspectionCheck, CleaningHelperCheck } from '../types/dorm';
import { formatFullDate } from '../utils/date';
import { Modal } from './ui/Modal';

/** Anything on file that carries a verdict, seen loosely so one form fits all. */
type CheckRow = Record<string, any> & { id: string };

type Field =
  | { key: string; label: string; kind: 'toggle'; fallback?: boolean }
  | { key: string; label: string; kind: 'select'; options: [string, string][]; fallback?: string }
  | { key: string; label: string; kind: 'text'; placeholder?: string }
  | { key: string; label: string; kind: 'date' | 'time'; fallback?: string }
  | { key: string; label: string; kind: 'rating' }
  | { key: string; label: string; kind: 'occupantChecks' | 'helpers' };

const ITEM_LABELS: Record<string, string> = {
  bedsOk: 'Bed & bedding',
  lockersOk: 'Locker & closet',
  personalThingsOk: 'Things & desk',
};

/** What the Dean may change on each kind of check, in the order it reads best. */
const FIELDS: Record<CheckKind, Field[]> = {
  inspection: [
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'occupantChecks', label: 'Per-resident rating', kind: 'occupantChecks' },
    { key: 'crCleanlinessOk', label: 'CR / bathroom', kind: 'toggle' },
    { key: 'overallFloorOk', label: 'Floor & dust', kind: 'toggle' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'Inspector remarks' },
  ],
  attendance: [
    { key: 'date', label: 'Date', kind: 'date' },
    {
      key: 'status',
      label: 'Attendance',
      kind: 'select',
      options: [['present', 'Present'], ['late', 'Late'], ['absent', 'Absent'], ['excused', 'Excused']],
    },
    { key: 'broughtBible', label: 'Bible in hand', kind: 'toggle' },
    { key: 'properAttire', label: 'Proper worship attire', kind: 'toggle', fallback: true },
    { key: 'notes', label: 'Notes', kind: 'text', placeholder: 'Session notes' },
  ],
  curfew: [
    { key: 'date', label: 'Date', kind: 'date' },
    {
      key: 'status',
      label: 'Curfew status',
      kind: 'select',
      options: [['in_dorm', 'In dorm'], ['late', 'Late arrival'], ['missing', 'Missing / AWOL'], ['official_pass', 'Official pass']],
    },
    { key: 'actualCheckInTime', label: 'Check-in time', kind: 'time', fallback: '' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'Reason / note' },
  ],
  uniform: [
    { key: 'date', label: 'Date', kind: 'date' },
    {
      key: 'session',
      label: 'Departure run',
      kind: 'select',
      options: [['morning', 'Morning'], ['afternoon', 'Afternoon']],
      fallback: 'morning',
    },
    { key: 'departureTime', label: 'Departure time', kind: 'time' },
    { key: 'isDepartureOnSchedule', label: 'Left within the window', kind: 'toggle' },
    { key: 'uniformCompliant', label: 'Uniform', kind: 'toggle' },
    { key: 'hairGroomingCompliant', label: 'Haircut & grooming', kind: 'toggle' },
    { key: 'idBadgeCompliant', label: 'ID badge', kind: 'toggle' },
    { key: 'shoesCompliant', label: 'Shoes', kind: 'toggle' },
    { key: 'remarks', label: 'Gate remarks', kind: 'text', placeholder: 'Gate remarks' },
  ],
  study: [
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'status', label: 'Attendance', kind: 'select', options: [['present', 'Present'], ['absent', 'Absent']] },
    { key: 'quietness', label: 'Conduct', kind: 'select', options: [['quiet', 'Quiet'], ['noisy', 'Noisy']] },
    {
      key: 'location',
      label: 'Location',
      kind: 'select',
      options: [['library', 'Campus library'], ['study_hall', 'Dorm study hall'], ['approved_room', 'Approved quiet room']],
    },
    { key: 'checkTime', label: 'Check time', kind: 'time' },
    { key: 'remarks', label: 'Notes', kind: 'text', placeholder: 'Session notes' },
  ],
  cleaning: [
    { key: 'helpers', label: 'Crew', kind: 'helpers' },
    { key: 'rating', label: 'Cleaning rating', kind: 'rating' },
    { key: 'garbageDisposed', label: 'Garbage disposed', kind: 'toggle' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'Remarks' },
  ],
  lightsOut: [
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'checkTime', label: 'Round time', kind: 'time' },
    { key: 'allLightsOff', label: 'Main lights out', kind: 'toggle' },
    { key: 'noiseCompliant', label: 'Silence observed', kind: 'toggle' },
    { key: 'noUnauthorizedGadgets', label: 'No hidden devices', kind: 'toggle' },
    { key: 'violatorRemarks', label: 'Violation notes', kind: 'text', placeholder: 'What was found' },
  ],
  unauthorizedExit: [
    { key: 'date', label: 'Date off campus', kind: 'date' },
    {
      key: 'status',
      label: 'Verdict',
      kind: 'select',
      options: [['confirmed', 'Left without a pass'], ['excused', 'Excused — leave was on file']],
    },
    { key: 'noticedTime', label: 'Noticed at', kind: 'time' },
    { key: 'destination', label: 'Where they went', kind: 'text', placeholder: 'e.g. Town market' },
    {
      key: 'discoveredVia',
      label: 'How it came to light',
      kind: 'select',
      options: [
        ['gate_guard', 'Gate guard'],
        ['roll_call', 'Roll call'],
        ['staff_sighting', 'Staff sighting'],
        ['reported', 'Reported'],
        ['self_admitted', 'Resident admitted it'],
      ],
    },
    { key: 'returnedTime', label: 'Back in the dorm at', kind: 'time', fallback: '' },
    { key: 'parentNotified', label: 'Parents notified', kind: 'toggle' },
    { key: 'excuseReason', label: 'Reason it was excused', kind: 'text', placeholder: 'e.g. Pass was issued on paper' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'What happened' },
  ],
  badLanguage: [
    { key: 'date', label: 'Date heard', kind: 'date' },
    {
      key: 'status',
      label: 'Verdict',
      kind: 'select',
      options: [['confirmed', 'Confirmed — the words were said'], ['excused', 'Excused — not as reported']],
    },
    { key: 'heardTime', label: 'Heard at', kind: 'time' },
    {
      key: 'kind',
      label: 'Kind of language',
      kind: 'select',
      options: [
        ['cursing', 'Cursing / swearing'],
        ['vulgar_talk', 'Vulgar or crude talk'],
        ['blasphemy', "God's name taken in vain"],
        ['name_calling', 'Name-calling / mockery'],
        ['abusive', 'Abusive or threatening speech'],
      ],
    },
    {
      key: 'setting',
      label: 'Where it happened',
      kind: 'select',
      options: [
        ['dorm_room', 'In a dorm room'],
        ['hallway_grounds', 'Hallway or grounds'],
        ['worship', 'During worship'],
        ['study_hours', 'During study hours'],
        ['dining_kitchen', 'Dining hall or kitchen'],
        ['school_run', 'On the school run'],
        ['online_chat', 'In a chat or group message'],
        ['other', 'Elsewhere in the dormitory'],
      ],
    },
    { key: 'quote', label: 'What was said', kind: 'text', placeholder: 'The words, as near as they were heard' },
    { key: 'directedAt', label: 'Who it was said to', kind: 'text', placeholder: 'Blank if aimed at no one' },
    {
      key: 'discoveredVia',
      label: 'How it came to light',
      kind: 'select',
      options: [
        ['staff_heard', 'Heard by staff'],
        ['reported', 'Reported by someone else'],
        ['self_admitted', 'Resident admitted it'],
        ['written', 'Written down or posted'],
      ],
    },
    { key: 'apologyMade', label: 'Apology made', kind: 'toggle' },
    { key: 'parentNotified', label: 'Parents notified', kind: 'toggle' },
    { key: 'excuseReason', label: 'Reason it was excused', kind: 'text', placeholder: 'e.g. Misheard — another resident' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'What happened' },
  ],
  neighborRoom: [
    { key: 'date', label: 'Date seen', kind: 'date' },
    {
      key: 'status',
      label: 'Verdict',
      kind: 'select',
      options: [
        ['confirmed', 'Confirmed — there without permission'],
        ['excused', 'Excused — permission or leave cleared it'],
      ],
    },
    { key: 'seenTime', label: 'Seen at', kind: 'time' },
    { key: 'visitedRoomNumber', label: 'Room they were in', kind: 'text', placeholder: 'e.g. 204' },
    { key: 'purpose', label: 'Why they were there', kind: 'text', placeholder: 'What they said' },
    {
      key: 'discoveredVia',
      label: 'How it came to light',
      kind: 'select',
      options: [
        ['staff_rounds', 'Found on staff rounds'],
        ['room_owner', 'Reported by the room occupant'],
        ['reported', 'Reported by someone else'],
        ['self_admitted', 'Resident admitted it'],
      ],
    },
    { key: 'hasPermission', label: 'Had explicit permission', kind: 'toggle' },
    { key: 'excuseReason', label: 'Reason it was excused', kind: 'text', placeholder: 'e.g. Roommate had invited him' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'What happened' },
  ],
  phoneDeposit: [
    {
      key: 'status',
      label: 'Deposit',
      kind: 'select',
      options: [['deposited', 'Deposited'], ['late', 'Late'], ['not_deposited', 'Not deposited'], ['excused', 'Excused']],
    },
    { key: 'depositTime', label: 'Deposit time', kind: 'time' },
    { key: 'remarks', label: 'Remarks', kind: 'text', placeholder: 'Remarks' },
  ],
};

/** Optional text left blank clears the field rather than storing an empty one. */
const OPTIONAL_TEXT = new Set([
  'remarks', 'notes', 'violatorRemarks', 'actualCheckInTime', 'destination', 'excuseReason', 'returnedTime',
  'quote', 'directedAt',
]);

/** Whoever filed the check, under whichever name its kind gives the signer. */
const filedBy = (record: CheckRow) =>
  record.inspectorName || record.recordedBy || record.loggedBy || record.inspectedBy || record.assignedBy || 'unknown';

const headingFor = (record: CheckRow) =>
  record.studentName || (record.roomNumber ? `Room ${record.roomNumber}` : 'Record');

const FIELD_CLASS =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40';

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <button
    type="button"
    aria-pressed={value}
    onClick={() => onChange(!value)}
    className={`w-full min-h-touch flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-colors ${
      value ? 'border-emerald-700/50 bg-emerald-950/50 text-emerald-300' : 'border-rose-700/50 bg-rose-950/30 text-rose-300'
    }`}
  >
    <span className="text-xs font-semibold">{label}</span>
    {value ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
  </button>
);

/**
 * The Dean's correction of one check already on file — the pencil and bin that
 * sit beside a record in every register. Administrators file checks; only the
 * Super Admin can change or strike one afterwards, whoever took it, and the
 * record keeps a note of the correction either way.
 */
export const RecordOverrideControls: React.FC<{ kind: CheckKind; record: CheckRow }> = ({ kind, record }) => {
  const { isSuperAdmin, overrideCheckRecord, deleteCheckRecord } = useDorm();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});

  if (!isSuperAdmin) return null;

  const fields = FIELDS[kind];

  const seed = () => {
    const next: Record<string, any> = {};
    fields.forEach(f => {
      if (f.kind === 'occupantChecks') {
        next.occupantChecks = (record.occupantChecks as OccupantInspectionCheck[] | undefined)?.map(c => ({ ...c }));
        // Inspections filed before per-resident ratings existed carry the three
        // checks at room level, so those are what there is to correct.
        next.bedsOk = record.bedsOk;
        next.lockersOk = record.lockersOk;
        next.personalThingsOk = record.personalThingsOk;
        return;
      }
      if (f.kind === 'helpers') {
        next.helpers = (record.helpers as CleaningHelperCheck[] | undefined)?.map(h => ({ ...h })) ?? [];
        return;
      }
      const value = record[f.key];
      next[f.key] = value === undefined || value === null ? ('fallback' in f ? f.fallback : '') : value;
    });
    return next;
  };

  const openForm = () => {
    setDraft(seed());
    setOpen(true);
  };

  const set = (key: string, value: any) => setDraft(prev => ({ ...prev, [key]: value }));
  // Row edits fold into whatever the draft already holds rather than into the
  // copy this render closed over, so a run of quick taps down a resident list
  // keeps every one of them.
  const edit = <T,>(key: string, fn: (current: T) => T) =>
    setDraft(prev => ({ ...prev, [key]: fn(prev[key]) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Record<string, unknown> = { ...draft };
    OPTIONAL_TEXT.forEach(key => {
      if (updates[key] === '') updates[key] = undefined;
    });
    if (updates.occupantChecks === undefined) delete updates.occupantChecks;
    overrideCheckRecord(kind, record.id, updates);
    setOpen(false);
  };

  const remove = () => {
    const ok = window.confirm(
      `Delete this ${CHECK_LABELS[kind].toLowerCase()} for ${headingFor(record)}?\n\n` +
      'Any demerits it put on a resident are removed with it. This cannot be undone.'
    );
    if (ok) deleteCheckRecord(kind, record.id);
  };

  const occupantChecks: OccupantInspectionCheck[] | undefined = draft.occupantChecks;
  const helpers: CleaningHelperCheck[] = draft.helpers ?? [];

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={openForm}
          title={`Override this ${CHECK_LABELS[kind].toLowerCase()}`}
          aria-label={`Override this ${CHECK_LABELS[kind].toLowerCase()}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 text-amber-300 hover:bg-slate-700 active:scale-95 transition"
        >
          <PenLine className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={remove}
          title={`Delete this ${CHECK_LABELS[kind].toLowerCase()}`}
          aria-label={`Delete this ${CHECK_LABELS[kind].toLowerCase()}`}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 text-rose-300 hover:bg-rose-950/60 active:scale-95 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} label={`Override ${CHECK_LABELS[kind]}`}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  Override — {headingFor(record)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CHECK_LABELS[kind]}
                  {record.date ? ` · ${formatFullDate(record.date)}` : ''} · filed by {filedBy(record)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="p-4 sm:p-5 space-y-3">
              {record.overriddenBy && (
                <p className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
                  Already corrected by {record.overriddenBy}.
                </p>
              )}

              {fields.map(field => {
                if (field.kind === 'occupantChecks') {
                  return (
                    <div key={field.key}>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        {field.label}
                      </label>
                      {occupantChecks?.length ? (
                        <div className="space-y-2">
                          {occupantChecks.map((c, idx) => (
                            <div key={c.studentId} className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 space-y-1">
                              <p className="px-1 text-xs font-semibold text-white truncate">{c.studentName}</p>
                              {(['bedsOk', 'lockersOk', 'personalThingsOk'] as const).map(item => (
                                <Toggle
                                  key={item}
                                  label={ITEM_LABELS[item]}
                                  value={c[item]}
                                  onChange={v =>
                                    edit<OccupantInspectionCheck[]>('occupantChecks', rows =>
                                      rows.map((row, i) => (i === idx ? { ...row, [item]: v } : row))
                                    )
                                  }
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(['bedsOk', 'lockersOk', 'personalThingsOk'] as const).map(item => (
                            <Toggle
                              key={item}
                              label={ITEM_LABELS[item]}
                              value={!!draft[item]}
                              onChange={v => set(item, v)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (field.kind === 'helpers') {
                  return (
                    <div key={field.key}>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        {field.label}
                      </label>
                      {helpers.length === 0 ? (
                        <p className="text-xs text-slate-500 bg-slate-950/60 border border-dashed border-slate-700 rounded-xl p-3 text-center">
                          No crew was recorded for this day.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {helpers.map((h, idx) => (
                            <Toggle
                              key={h.studentId}
                              label={`${h.studentName} helped`}
                              value={h.helped}
                              onChange={v =>
                                edit<CleaningHelperCheck[]>('helpers', rows =>
                                  rows.map((row, i) => (i === idx ? { ...row, helped: v } : row))
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (field.kind === 'toggle') {
                  return <Toggle key={field.key} label={field.label} value={!!draft[field.key]} onChange={v => set(field.key, v)} />;
                }

                if (field.kind === 'rating') {
                  return (
                    <div key={field.key}>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        {field.label}
                      </label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={draft[field.key] === n}
                            onClick={() => set(field.key, n)}
                            className={`flex-1 min-h-touch rounded-xl text-xs font-bold border transition-colors ${
                              draft[field.key] === n
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      {field.label}
                    </label>
                    {field.kind === 'select' ? (
                      <select value={draft[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} className={FIELD_CLASS}>
                        {field.options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.kind === 'text' ? 'text' : field.kind}
                        value={draft[field.key] ?? ''}
                        placeholder={field.kind === 'text' ? field.placeholder : undefined}
                        onChange={e => set(field.key, e.target.value)}
                        className={FIELD_CLASS}
                      />
                    )}
                  </div>
                );
              })}

              <p className="text-[11px] text-slate-500">
                Saving re-scores the record and re-files the demerits it raised. A demerit the resident has
                already redeemed keeps its redemption.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
};
