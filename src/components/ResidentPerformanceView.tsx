import React, { useState } from 'react';
import {
  Users,
  ChevronDown,
  BookOpen,
  Brush,
  Smartphone,
  Lock,
  PlusCircle,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { ResidentSearch } from './ui/ResidentSearch';
import { residentMatches } from '../utils/residentSearch';
import { Violation, ViolationCategory } from '../types/dorm';
import { manilaToday } from '../utils/date';
import { demeritsForSeverity, demeritLabel, demeritStanding } from '../utils/checkViolations';
import { ViolationsPanel } from './ViolationsPanel';

export const ResidentPerformanceView: React.FC = () => {
  const {
    users, rooms, violations, attendance, cleaningDuties, cellphones,
    saveViolation, canEdit, currentUser,
  } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<ViolationCategory>('curfew_breach');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
const [description, setDescription] = useState('');
  const [newRedemption, setNewRedemption] = useState('');

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();

  // A name search runs across the whole dormitory and steps in front of the
  // room groupings while it has something typed, the same way every check does.
  const searching = search.trim().length > 0;
  const matches = searching ? occupants.filter(o => residentMatches(o, search)).length : occupants.length;

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
      demerits: demeritsForSeverity(severity),
      reportedBy: currentUser.name,
      status: 'pending_settlement',
      assignedRedemption: newRedemption.trim() || undefined,
    });
    setShowAddModal(false);
    setDescription('');
    setNewRedemption('');
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
              Demerits owed and compliance status for every occupant. Every violation is worth 1 demerit.
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
        <div className="mt-3 pt-3 border-t border-slate-800">
          <ResidentSearch
            value={search}
            onChange={setSearch}
            matches={matches}
            placeholder="Search a name or room…"
          />
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

      {searching && matches === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <Users className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white mt-3">Nobody by that name</p>
          <p className="text-xs text-slate-400 mt-1">No resident in the dormitory matches "{search.trim()}".</p>
        </div>
      )}

      {roomNumbers.map(roomNumber => {
        const roomMeta = rooms.find(r => r.roomNumber === roomNumber);
        const residents = occupants.filter(
          o => o.roomNumber === roomNumber && (!searching || residentMatches(o, search))
        );
        if (searching && residents.length === 0) return null;
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
                const owed = occ.demerits || 0;
                const standing = demeritStanding(owed);
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${standing.classes}`}>
                            {standing.label}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {demeritLabel(owed)} · {totalVs.length} violations
                          </p>
                        </div>
                      </div>
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

                        <ViolationsPanel studentId={occ.id} />
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
                <h3 className="text-base font-bold text-white">Log Rule Violation (1 demerit)</h3>
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
                    <option value="unauthorized_room_visit">In Another Resident's Room</option>
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
                  <label className="block font-medium text-slate-300 mb-1">Demerits</label>
                  <div className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-300">
                    1 demerit <span className="text-slate-500">· fixed for every violation</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea rows={3} required placeholder="Specific details of the infraction..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  To Redeem It <span className="text-slate-500">· optional, yours to set later</span>
                </label>
                <input type="text" placeholder="e.g. 2 hours grounds cleaning, or a reflection on curfew..." value={newRedemption} onChange={e => setNewRedemption(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 min-h-touch rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500">Record Violation</button>
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