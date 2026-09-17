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
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { ViolationCategory } from '../types/dorm';
import { manilaToday } from '../utils/date';

const standingFor = (points: number) =>
  points === 0
    ? { label: 'Good Standing', classes: 'bg-emerald-950 text-emerald-300 border-emerald-700' }
    : points < 8
      ? { label: 'Under Notice', classes: 'bg-amber-950 text-amber-300 border-amber-700' }
      : { label: 'Probation', classes: 'bg-rose-950 text-rose-300 border-rose-700' };

export const ResidentPerformanceView: React.FC = () => {
  const { users, rooms, violations, attendance, chores, cellphones, saveViolation, updateViolationStatus, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<ViolationCategory>('curfew_breach');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
  const [demerits, setDemerits] = useState(3);
  const [description, setDescription] = useState('');
  const [actionRequired, setActionRequired] = useState('');

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
      demeritPoints: Number(demerits),
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
              Demerit standing and compliance status for every occupant.
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
                const totalVs = violations.filter(v => v.studentId === occ.id);
                const worshipAll = attendance.filter(a => a.studentId === occ.id);
                const worshipOk = worshipAll.filter(a => a.status === 'present' || a.status === 'late').length;
                const worshipPct = worshipAll.length ? Math.round((worshipOk / worshipAll.length) * 100) : null;
                const biblePct = worshipAll.length
                  ? Math.round((worshipAll.filter(a => a.broughtBible).length / worshipAll.length) * 100)
                  : null;
                const chore = chores.filter(c => c.studentId === occ.id).sort((a, b) => b.weekRange.localeCompare(a.weekRange))[0];
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
                          {pts} demerits · {totalVs.length} violations
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
                            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Brush className="w-3 h-3" /> Chore duty</p>
                            <p className={`text-sm font-bold truncate ${chore ? (chore.status === 'failed' ? 'text-rose-400' : chore.status === 'inspected_approved' ? 'text-emerald-400' : 'text-white') : 'text-slate-500'}`}>
                              {chore ? chore.status.replace('_', ' ') : 'None'}
                            </p>
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
                                        +{v.demeritPoints}
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
                                    onClick={() => updateViolationStatus(v.id, 'cleared_service', 'Completed dorm maintenance service')}
                                    className="mt-1.5 w-full min-h-touch bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-[11px] font-medium"
                                  >
                                    Clear via Service
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Log Rule Violation & Demerit</h3>
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
                    <option value="curfew_breach">Curfew Breach</option>
                    <option value="uniform_violation">Uniform / Grooming</option>
                    <option value="irregular_school_departure">Departure Off-Schedule</option>
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
                    onChange={e => {
                      const sev = e.target.value as 'minor' | 'moderate' | 'major';
                      setSeverity(sev);
                      setDemerits(sev === 'minor' ? 1 : sev === 'moderate' ? 3 : 5);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="minor">Minor (1)</option>
                    <option value="moderate">Moderate (3)</option>
                    <option value="major">Major (5)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Demerit Points</label>
                  <input type="number" min={1} max={10} value={demerits} onChange={e => setDemerits(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
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
        </div>
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