import React, { useState } from 'react';
import {
  PenLine,
  Trash2,
  CheckCircle2,
  Undo2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Violation } from '../types/dorm';
import {
  demeritsForSeverity,
  demeritLabel,
  violationTitle,
} from '../utils/checkViolations';
import { formatFullDate } from '../utils/date';
import { Modal } from './ui/Modal';

const CATEGORY_LABELS: Record<Violation['category'], string> = {
  cleanliness: 'Room cleanliness',
  worship_absence: 'Absent from worship',
  worship_late: 'Late to worship',
  no_bible: 'Worship without a Bible',
  improper_worship_attire: 'Worship without proper attire',
  curfew_breach: 'Curfew breach',
  uniform_violation: 'Uniform violation',
  church_absence: 'Absent from church',
  irregular_school_departure: 'Irregular school departure',
  unauthorized_campus_exit: 'Off-campus exit',
  foul_language: 'Foul language',
  study_hour_skipping: 'Skipped study hours',
  chore_neglect: 'Missed cleaning duty',
  lights_out_violation: 'Lights-out violation',
  cellphone_policy_breach: 'Phone policy breach',
  unauthorized_room_visit: "In another resident's room",
  other: 'Incident',
};

const SEVERITY_OPTIONS: Array<[Violation['severity'], string]> = [
  ['minor', 'Minor — half a demerit'],
  ['moderate', 'Moderate — one demerit'],
  ['major', 'Major — one demerit, referred'],
];

const FIELD_CLASS =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40';

const BTN_CLASS =
  'w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 active:scale-95 transition';

/**
 * The Dean's hand on one violation already on a resident's standing: change
 * what it says or what it weighs, settle it outright, or strike it off. Only
 * the Super Admin can do any of these, and everything re-totals the moment the
 * standing is touched, so a correction reads instantly on the resident's total.
 */
export const ViolationActions: React.FC<{ violation: Violation }> = ({ violation }) => {
  const {
    isSuperAdmin,
    overrideViolation,
    updateViolationStatus,
    undoViolationRedemption,
    deleteViolation,
  } = useDorm();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});

  if (!isSuperAdmin) return null;

  const cleared = violation.status === 'cleared_service';
  const title = violationTitle(violation);

  const seed = () => ({
    date: violation.date,
    category: violation.category,
    severity: violation.severity,
    demerits: violation.demerits,
    description: violation.description ?? '',
    reportedBy: violation.reportedBy ?? '',
    assignedRedemption: violation.assignedRedemption ?? '',
  });

  const openForm = () => {
    setDraft(seed());
    setOpen(true);
  };

  const set = (key: string, value: any) => setDraft(prev => ({ ...prev, [key]: value }));

  const setSeverity = (severity: Violation['severity']) => {
    set('severity', severity);
    set('demerits', demeritsForSeverity(severity));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    overrideViolation(violation.id, {
      date: draft.date,
      category: draft.category,
      severity: draft.severity,
      demerits: Math.max(0, Number(draft.demerits) || 0),
      description: (draft.description ?? '').trim() || title,
      reportedBy: (draft.reportedBy ?? '').trim() || violation.reportedBy,
      assignedRedemption: (draft.assignedRedemption ?? '').trim() || undefined,
    });
    setOpen(false);
  };

  const clear = () => {
    const ok = window.confirm(
      `Clear "${title}"?\n\n` +
      `It leaves ${violation.studentName}'s open standing — ${demeritLabel(violation.demerits)} comes off.`
    );
    if (ok) updateViolationStatus(violation.id, 'cleared_service');
  };

  const putBack = () => {
    const ok = window.confirm(
      `Put "${title}" back on the record?\n\n` +
      `Any clearance on it is undone and the demerit returns to ${violation.studentName}'s standing.`
    );
    if (ok) undoViolationRedemption(violation.id);
  };

  const remove = () => {
    const ok = window.confirm(
      `Delete "${title}"?\n\n` +
      `It comes off ${violation.studentName}'s record entirely — ${demeritLabel(violation.demerits)} leaves the standing. This cannot be undone.`
    );
    if (ok) deleteViolation(violation.id);
  };

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={openForm}
          title="Edit this violation"
          aria-label={`Edit ${title}`}
          className={`${BTN_CLASS} text-amber-300`}
        >
          <PenLine className="w-3.5 h-3.5" />
        </button>
        {cleared ? (
          <button
            type="button"
            onClick={putBack}
            title="Put back on the standing"
            aria-label={`Put ${title} back on the standing`}
            className={`${BTN_CLASS} text-sky-300`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={clear}
            title="Clear this violation"
            aria-label={`Clear ${title}`}
            className={`${BTN_CLASS} text-emerald-300`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          title="Delete this violation"
          aria-label={`Delete ${title}`}
          className={`${BTN_CLASS} text-rose-300 hover:bg-rose-950/60`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} label={`Edit ${title}`}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  Edit violation — {violation.studentName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {title}
                  {violation.date ? ` · ${formatFullDate(violation.date)}` : ''} · filed by {violation.reportedBy || 'unknown'}
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
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={draft.date ?? ''}
                  onChange={e => set('date', e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  What it was for
                </label>
                <select
                  value={draft.category ?? ''}
                  onChange={e => set('category', e.target.value)}
                  className={FIELD_CLASS}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Severity
                  </label>
                  <select
                    value={draft.severity ?? ''}
                    onChange={e => setSeverity(e.target.value as Violation['severity'])}
                    className={FIELD_CLASS}
                  >
                    {SEVERITY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Demerits
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={draft.demerits ?? ''}
                    onChange={e => set('demerits', e.target.value)}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={draft.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What happened"
                  className={`${FIELD_CLASS} min-h-0 resize-y`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Filed by
                </label>
                <input
                  type="text"
                  value={draft.reportedBy ?? ''}
                  onChange={e => set('reportedBy', e.target.value)}
                  placeholder="Who logged it"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Redemption assigned
                </label>
                <input
                  type="text"
                  value={draft.assignedRedemption ?? ''}
                  onChange={e => set('assignedRedemption', e.target.value)}
                  placeholder="e.g. Library duty Saturday, or blank to keep unassigned"
                  className={FIELD_CLASS}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Saving re-totals {violation.studentName}'s standing at once. A violation already
                redeemed keeps its redemption and its place on the record.
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
};