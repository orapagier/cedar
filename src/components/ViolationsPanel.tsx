import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  HandHeart,
  PenLine,
  Undo2,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { ServiceType, Violation } from '../types/dorm';
import { formatFullDate, manilaToday } from '../utils/date';
import { demeritLabel, violationShortLabel } from '../utils/checkViolations';
import { ViolationActions } from './ViolationActions';

const SERVICE_TYPES: ServiceType[] = [
  'Grounds Beautification',
  'Library Duty',
  'Dorm Maintenance & Sanitizing',
  'Dining/Kitchen Help',
];

const FIELD = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white';

/**
 * One resident's violations, handled the way the Resident Performance page
 * handles them: each open violation carries a severity tag, its description and
 * assigned redemption, and the Dean's controls to edit, clear, or delete it. The
 * staff buttons sit under the card — set (or change) what the resident must do
 * to work it off, or mark it redeemed. Redeemed violations stay listed with the
 * work or reflection that settled them, undoable while the Dean changes his mind.
 */
export const ViolationsPanel: React.FC<{ studentId: string }> = ({ studentId }) => {
  const {
    violations,
    canEdit,
    currentUser,
    assignRedemption,
    redeemViolation,
    undoViolationRedemption,
  } = useDorm();

  const [assigning, setAssigning] = useState<Violation | null>(null);
  const [assignment, setAssignment] = useState('');

  const [redeeming, setRedeeming] = useState<Violation | null>(null);
  const [redeemKind, setRedeemKind] = useState<'service' | 'reflection'>('service');
  const [serviceType, setServiceType] = useState<ServiceType>('Dorm Maintenance & Sanitizing');
  const [hoursRendered, setHoursRendered] = useState('1');
  const [reflectionTopic, setReflectionTopic] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [completedDate, setCompletedDate] = useState(() => manilaToday());
  const [redeemRemarks, setRedeemRemarks] = useState('');

  const activeVs = violations.filter(v => v.studentId === studentId && v.status !== 'cleared_service');
  const redeemedVs = violations.filter(v => v.studentId === studentId && v.status === 'cleared_service');

  const openAssign = (violation: Violation) => {
    setAssigning(violation);
    setAssignment(violation.assignedRedemption ?? '');
  };

  const submitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !assigning) return;
    assignRedemption(assigning.id, assignment);
    setAssigning(null);
  };

  const openRedeem = (violation: Violation) => {
    setRedeeming(violation);
    setRedeemKind('service');
    setServiceType('Dorm Maintenance & Sanitizing');
    setHoursRendered('1');
    setReflectionTopic(violation.category.replace(/_/g, ' '));
    setReflectionText('');
    setSupervisorName(currentUser.name);
    setCompletedDate(manilaToday());
    setRedeemRemarks('');
  };

  const submitRedemption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !redeeming) return;
    redeemViolation(redeeming.id, {
      kind: redeemKind,
      serviceType: redeemKind === 'service' ? serviceType : undefined,
      hoursRendered: redeemKind === 'service' ? Number(hoursRendered) || 0 : undefined,
      reflectionTopic: redeemKind === 'reflection' ? reflectionTopic.trim() || undefined : undefined,
      reflectionText: redeemKind === 'reflection' ? reflectionText.trim() : undefined,
      supervisorName: supervisorName.trim() || currentUser.name,
      completedDate,
      remarks: redeemRemarks.trim() || undefined,
    });
    setRedeeming(null);
  };

  /** "2 hrs · Library Duty" or "Reflection on curfew breach" — one line for the record. */
  const redemptionLabel = (v: Violation) => {
    const r = v.redemption;
    if (!r) return 'Cleared';
    if (r.kind === 'reflection') {
      return `Reflection${r.reflectionTopic ? ` on ${r.reflectionTopic}` : ''}`;
    }
    const hours = r.hoursRendered ?? 0;
    return `${hours} hr${hours === 1 ? '' : 's'} · ${r.serviceType ?? 'Work service'}`;
  };

  return (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Violations ({activeVs.length} active)
        </p>
        {activeVs.length === 0 && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No active violations.
          </p>
        )}
        <div className="space-y-1.5">
          {activeVs.map(v => (
            <div key={v.id} className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      v.severity === 'major' ? 'bg-rose-950 text-rose-300' :
                      v.severity === 'moderate' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                    }`}>
                      +{demeritLabel(v.demerits)}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">{violationShortLabel(v.category)}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{v.description}</p>
                  {v.assignedRedemption ? (
                    <p className="text-[10px] text-amber-300/90 mt-0.5">To redeem: {v.assignedRedemption}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-0.5">Redemption not set yet.</p>
                  )}
                </div>
                <ViolationActions violation={v} />
              </div>
              {canEdit && (
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => openAssign(v)}
                    className="min-h-touch bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    {v.assignedRedemption ? 'Change redemption' : 'Set redemption'}
                  </button>
                  <button
                    onClick={() => openRedeem(v)}
                    className="min-h-touch bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <HandHeart className="w-3.5 h-3.5" />
                    Mark redeemed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {redeemedVs.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Redeemed ({redeemedVs.length})
          </p>
          <div className="space-y-1.5">
            {redeemedVs.map(v => (
              <div key={v.id} className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                      {v.redemption?.kind === 'reflection'
                        ? <PenLine className="w-3 h-3 shrink-0" />
                        : <HandHeart className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{redemptionLabel(v)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {violationShortLabel(v.category)} · {formatFullDate(v.date)}
                    </p>
                    {v.redemption && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Signed off by {v.redemption.supervisorName} on {formatFullDate(v.redemption.completedDate)}
                      </p>
                    )}
                    {v.redemption?.reflectionText && (
                      <p className="text-[11px] text-slate-300 mt-1 italic line-clamp-3">
                        "{v.redemption.reflectionText}"
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => undoViolationRedemption(v.id)}
                        title="Put this violation back on the record"
                        className="shrink-0 min-h-touch px-2 text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-semibold"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Undo
                      </button>
                      <ViolationActions violation={v} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canEdit && assigning && (
        <Modal onClose={() => setAssigning(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">Set redemption — {assigning.studentName}</h3>
                <p className="text-xs text-slate-400">
                  {violationShortLabel(assigning.category)} · {formatFullDate(assigning.date)} · {demeritLabel(assigning.demerits)}
                </p>
              </div>
              <button onClick={() => setAssigning(null)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitAssignment} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
                <p className="text-[11px] text-slate-300">{assigning.description}</p>
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">What must he do to work this off?</label>
                <textarea
                  rows={3}
                  autoFocus
                  placeholder="e.g. 2 hours grounds beautification, or a one-page reflection on reverence in worship..."
                  value={assignment}
                  onChange={e => setAssignment(e.target.value)}
                  className={FIELD}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Work or a written reflection — your call, boy by boy. Leave it empty to take the assignment back off.
                </p>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setAssigning(null)} className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">Save</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {canEdit && redeeming && (
        <Modal onClose={() => setRedeeming(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">Redeem — {redeeming.studentName}</h3>
                <p className="text-xs text-slate-400">
                  {violationShortLabel(redeeming.category)} · {formatFullDate(redeeming.date)} · {demeritLabel(redeeming.demerits)}
                </p>
              </div>
              <button onClick={() => setRedeeming(null)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitRedemption} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
                <p className="text-[11px] text-slate-300">{redeeming.description}</p>
                {redeeming.assignedRedemption && (
                  <p className="text-[10px] text-amber-300/90 mt-1">You set: {redeeming.assignedRedemption}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">How was it redeemed?</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { kind: 'service' as const, label: 'Work Service', icon: HandHeart },
                    { kind: 'reflection' as const, label: 'Written Reflection', icon: PenLine },
                  ]).map(({ kind, label, icon: Icon }) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={redeemKind === kind}
                      onClick={() => setRedeemKind(kind)}
                      className={`min-h-touch px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        redeemKind === kind
                          ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {redeemKind === 'service' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Work detail</label>
                    <select value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)} className={FIELD}>
                      {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Hours rendered</label>
                    <input
                      type="number" min="0" step="0.5" required
                      value={hoursRendered}
                      onChange={e => setHoursRendered(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Reflection topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Why curfew protects the dorm"
                      value={reflectionTopic}
                      onChange={e => setReflectionTopic(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">What the resident wrote</label>
                    <textarea
                      rows={5} required
                      placeholder="Type or paste the reflection so it stays on the record…"
                      value={reflectionText}
                      onChange={e => setReflectionText(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    {redeemKind === 'service' ? 'Supervised by' : 'Read & approved by'}
                  </label>
                  <input type="text" required value={supervisorName} onChange={e => setSupervisorName(e.target.value)} className={FIELD} />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Completed on</label>
                  <input type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} className={FIELD} />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional note for the record"
                  value={redeemRemarks}
                  onChange={e => setRedeemRemarks(e.target.value)}
                  className={FIELD}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setRedeeming(null)} className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 min-h-touch rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Clear this violation
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
};