import React, { useState } from 'react';
import {
  Users,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Brush,
  Smartphone,
  Lock,
  PlusCircle,
  HandHeart,
  PenLine,
  Undo2,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { ServiceType, Violation, ViolationCategory } from '../types/dorm';
import { formatFullDate, manilaToday } from '../utils/date';

const SERVICE_TYPES: ServiceType[] = [
  'Grounds Beautification',
  'Library Duty',
  'Dorm Maintenance & Sanitizing',
  'Dining/Kitchen Help',
];

const FIELD = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white';

const standingFor = (points: number) =>
  points === 0
    ? { label: 'Good Standing', classes: 'bg-emerald-950 text-emerald-300 border-emerald-700' }
    : points < 8
      ? { label: 'Under Notice', classes: 'bg-amber-950 text-amber-300 border-amber-700' }
      : { label: 'Probation', classes: 'bg-rose-950 text-rose-300 border-rose-700' };

export const ResidentPerformanceView: React.FC = () => {
  const {
    users, rooms, violations, attendance, cleaningDuties, cellphones,
    saveViolation, redeemViolation, undoViolationRedemption, canEdit, currentUser,
  } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<ViolationCategory>('curfew_breach');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
  const [description, setDescription] = useState('');
  const [actionRequired, setActionRequired] = useState('');

  // Redemption form — one violation at a time, never a whole resident at once.
  const [redeeming, setRedeeming] = useState<Violation | null>(null);
  const [redeemKind, setRedeemKind] = useState<'service' | 'reflection'>('service');
  const [serviceType, setServiceType] = useState<ServiceType>('Dorm Maintenance & Sanitizing');
  const [hoursRendered, setHoursRendered] = useState('1');
  const [reflectionTopic, setReflectionTopic] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [completedDate, setCompletedDate] = useState(() => manilaToday());
  const [redeemRemarks, setRedeemRemarks] = useState('');

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

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitViolation = (e: React.FormEvent) => {
    e.preventDefault();
    const student = occupants.find(o => o.id === studentId);
    if (!canEdit || !student) return;
    saveViolation({
      date: manilaToday(),
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      category,
      severity,
      description,
      demeritPoints: 1,
      reportedBy: currentUser.name,
      status: 'pending_settlement',
      actionRequired: actionRequired || undefined,
    });
    setShowAddModal(false);
    setDescription('');
    setActionRequired('');
  };

  const openLog = () => {
    setStudentId(occupants[0]?.id || '');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Resident Performance & Standing</h2>
            <p className="text-xs text-slate-400 mt-1">
              Points standing and compliance status for every occupant. Every violation is worth 1 pt.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={openLog}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 min-h-touch rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              Log Violation
            </button>
          )}
        </div>
      </div>

      {occupants.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">No Residents in Roster</h3>
          <p className="text-xs text-slate-400 mt-1">Register residents under Manage Roster.</p>
        </div>
      )}

      {roomNumbers.map(roomNumber => {
        const roomMeta = rooms.find(r => r.roomNumber === roomNumber);
        const residents = occupants.filter(o => o.roomNumber === roomNumber);
        return (
          <div key={roomNumber} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Room {roomNumber}</p>
                <p className="text-[11px] text-slate-400">
                  {roomMeta ? `${roomMeta.wing} · ` : ''}{residents.length} resident{residents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800/70">
              {residents.map(occ => {
                const isOpen = expanded.has(occ.id);
                const pts = occ.demeritPoints || 0;
                const standing = standingFor(pts);
                const activeVs = violations.filter(v => v.studentId === occ.id && v.status !== 'cleared_service');
                const redeemedVs = violations.filter(v => v.studentId === occ.id && v.status === 'cleared_service');
                const totalVs = violations.filter(v => v.studentId === occ.id);
                const worshipAll = attendance.filter(a => a.studentId === occ.id);
                const worshipOk = worshipAll.filter(a => a.status === 'present' || a.status === 'late').length;
                const worshipPct = worshipAll.length ? Math.round((worshipOk / worshipAll.length) * 100) : null;
                const biblePct = worshipAll.length
                  ? Math.round((worshipAll.filter(a => a.broughtBible).length / worshipAll.length) * 100)
                  : null;
                // Most recent cleaning day this resident's room was the crew.
                const cleaningDays = cleaningDuties
                  .filter(d => d.status === 'completed' && d.helpers.some(h => h.studentId === occ.id))
                  .sort((a, b) => b.date.localeCompare(a.date));
                const lastCleaning = cleaningDays[0];
                const lastHelped = lastCleaning?.helpers.find(h => h.studentId === occ.id)?.helped;
                const skippedCount = cleaningDays.filter(
                  d => d.helpers.find(h => h.studentId === occ.id)?.helped === false
                ).length;
                const phone = cellphones.find(c => c.studentId === occ.id);

                return (
                  <div key={occ.id}>
                    <button onClick={() => toggle(occ.id)} className="w-full min-h-touch px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-800/50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-amber-300 font-bold border border-slate-600 shrink-0">
                        {occ.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{occ.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {pts} pts · {totalVs.length} violations
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${standing.classes}`}>
                        {standing.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Worship on time</p>
                            <p className="text-sm font-bold text-white">{worshipPct !== null ? `${worshipPct}%` : '—'}</p>
                          </div>
                          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Bible brought</p>
                            <p className="text-sm font-bold text-white">{biblePct !== null ? `${biblePct}%` : '—'}</p>
                          </div>
                          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Brush className="w-3 h-3" /> Cleaning duty</p>
                            <p className={`text-sm font-bold truncate ${
                              lastCleaning ? (lastHelped ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'
                            }`}>
                              {lastCleaning ? (lastHelped ? 'Helped' : 'Skipped') : 'None'}
                            </p>
                            {skippedCount > 0 && (
                              <p className="text-[10px] text-rose-400/80">{skippedCount} missed</p>
                            )}
                          </div>
                          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Smartphone className="w-3 h-3" /> Phone</p>
                            <p className="text-sm font-bold truncate text-white">
                              {phone ? phone.custodyStatus.replace('_', ' ') : 'Not logged'}
                            </p>
                          </div>
                        </div>

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
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        v.severity === 'major' ? 'bg-rose-950 text-rose-300' :
                                        v.severity === 'moderate' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                                      }`}>
                                        +{v.demeritPoints} pts
                                      </span>
                                      <span className="text-[11px] text-slate-400 capitalize">{v.category.replace(/_/g, ' ')}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{v.description}</p>
                                    {v.actionRequired && (
                                      <p className="text-[10px] text-amber-300/90 mt-0.5">Action: {v.actionRequired}</p>
                                    )}
                                  </div>
                                  <span className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                    v.status === 'confirmed' ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50' :
                                    'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                                  }`}>
                                    {v.status.replace('_', ' ')}
                                  </span>
                                </div>
                                {canEdit && (
                                  <button
                                    onClick={() => openRedeem(v)}
                                    className="mt-1.5 w-full min-h-touch bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5"
                                  >
                                    <HandHeart className="w-3.5 h-3.5" />
                                    Redeem this violation
                                  </button>
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
                                      <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                                        {v.category.replace(/_/g, ' ')} · {formatFullDate(v.date)}
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
                                      <button
                                        onClick={() => undoViolationRedemption(v.id)}
                                        title="Put this violation back on the record"
                                        className="shrink-0 min-h-touch px-2 text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-semibold"
                                      >
                                        <Undo2 className="w-3.5 h-3.5" /> Undo
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {canEdit && showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Log Rule Violation (1 pt)</h3>
                <p className="text-xs text-slate-400">Dean / Admin Incident Form</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitViolation} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Resident</label>
                  <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white">
                    {occupants.map(o => (
                      <option key={o.id} value={o.id}>{o.name} (Room {o.roomNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as ViolationCategory)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white">
                    <option value="cleanliness">Room & CR Cleanliness</option>
                    <option value="worship_absence">Worship Absence</option>
                    <option value="worship_late">Worship Tardiness</option>
                    <option value="no_bible">No Bible in Worship</option>
                    <option value="improper_worship_attire">Improper Worship Attire</option>
                    <option value="curfew_breach">Curfew Breach</option>
                    <option value="uniform_violation">Uniform / Grooming</option>
                    <option value="irregular_school_departure">Departure Off-Schedule</option>
                    <option value="unauthorized_campus_exit">Off-Campus Without Pass</option>
                    <option value="foul_language">Foul Language</option>
                    <option value="church_absence">Church Absence</option>
                    <option value="study_hour_skipping">Study Hours Skipping</option>
                    <option value="chore_neglect">Chore Neglect</option>
                    <option value="lights_out_violation">Lights-Out Violation</option>
                    <option value="cellphone_policy_breach">Cellphone Breach</option>
                    <option value="other">Other Dorm Rule</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as 'minor' | 'moderate' | 'major')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Points</label>
                  <div className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-300">
                    1 pt <span className="text-slate-500">· fixed for every violation</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea rows={3} required placeholder="Specific details of the infraction..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Prescribed Action</label>
                <input type="text" placeholder="e.g. 2 hours grounds cleaning..." value={actionRequired} onChange={e => setActionRequired(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 min-h-touch rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500">Record Violation</button>
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
                <p className="text-xs text-slate-400 capitalize">
                  {redeeming.category.replace(/_/g, ' ')} · {formatFullDate(redeeming.date)} · {redeeming.demeritPoints} pt
                </p>
              </div>
              <button onClick={() => setRedeeming(null)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitRedemption} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
                <p className="text-[11px] text-slate-300">{redeeming.description}</p>
                {redeeming.actionRequired && (
                  <p className="text-[10px] text-amber-300/90 mt-1">Prescribed action: {redeeming.actionRequired}</p>
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

      {!canEdit && (
        <div className="bg-slate-800/60 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 w-fit">
          <Lock className="w-3.5 h-3.5" />
          <span>View-only access</span>
        </div>
      )}
    </div>
  );
};