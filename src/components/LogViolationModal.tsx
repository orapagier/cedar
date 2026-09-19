import React, { useEffect, useState } from 'react';
import { X, Siren } from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { ViolationCategory } from '../types/dorm';
import { manilaToday } from '../utils/date';
import { demeritLabel, demeritsForSeverity } from '../utils/checkViolations';

const CATEGORIES: Array<[ViolationCategory, string]> = [
  ['cleanliness', 'Room & CR Cleanliness'],
  ['worship_absence', 'Worship Absence'],
  ['worship_late', 'Worship Tardiness'],
  ['no_bible', 'No Bible in Worship'],
  ['improper_worship_attire', 'Improper Worship Attire'],
  ['curfew_breach', 'Curfew Breach'],
  ['uniform_violation', 'Uniform / Grooming'],
  ['irregular_school_departure', 'Departure Off-Schedule'],
  ['unauthorized_campus_exit', 'Off-Campus Without Pass'],
  ['foul_language', 'Foul Language'],
  ['church_absence', 'Church Absence'],
  ['study_hour_skipping', 'Study Hours Skipping'],
  ['chore_neglect', 'Chore Neglect'],
  ['lights_out_violation', 'Lights-Out Violation'],
  ['cellphone_policy_breach', 'Cellphone Breach'],
  ['unauthorized_room_visit', "In Another Resident's Room"],
  ['other', 'Other Dorm Rule'],
];

const FIELD =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500';

interface LogViolationModalProps {
  /** The resident the form opens on; any resident can still be picked. */
  studentId: string;
  onClose: () => void;
}

/**
 * The hand-written violation form, opened from a resident's file. The resident
 * is already in hand, so the Dean only names the offense, its weight and what
 * happened — the same form every other page uses, so a violation logged from
 * the popup lands on the record exactly the way one logged from the Resident
 * Performance page does.
 */
export const LogViolationModal: React.FC<LogViolationModalProps> = ({ studentId, onClose }) => {
  const { users, saveViolation, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [student, setStudent] = useState(studentId);
  const [category, setCategory] = useState<ViolationCategory>('curfew_breach');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
  const [description, setDescription] = useState('');
  const [redemption, setRedemption] = useState('');

  // The popup steps resident to resident, so an open form follows the file.
  useEffect(() => setStudent(studentId), [studentId]);

  const selected = occupants.find(o => o.id === student);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    saveViolation({
      date: manilaToday(),
      studentId: selected.id,
      studentName: selected.name,
      roomNumber: selected.roomNumber || '—',
      category,
      severity,
      description,
      demerits: demeritsForSeverity(severity),
      reportedBy: currentUser.name,
      status: 'pending_settlement',
      assignedRedemption: redemption.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} label="Log rule violation">
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-thin text-slate-100">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate flex items-center gap-2">
              <Siren className="w-4 h-4 text-rose-400 shrink-0" />
              Log Rule Violation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dean / Admin Incident Form</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Resident</label>
              <select value={student} onChange={e => setStudent(e.target.value)} className={FIELD}>
                {occupants.map(o => (
                  <option key={o.id} value={o.id}>{o.name} (Room {o.roomNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ViolationCategory)}
                className={FIELD}
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as 'minor' | 'moderate' | 'major')}
                className={FIELD}
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="major">Major</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Demerits</label>
              <div className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-300">
                {demeritLabel(demeritsForSeverity(severity))} <span className="text-slate-500">· graded by severity</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              autoFocus
              placeholder="Specific details of the infraction..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${FIELD} resize-y`}
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              To Redeem It <span className="text-slate-500">· optional, yours to set later</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 2 hours grounds cleaning, or a reflection on curfew..."
              value={redemption}
              onChange={e => setRedemption(e.target.value)}
              className={FIELD}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selected}
              className="px-4 py-2 min-h-touch rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600"
            >
              Record Violation
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};