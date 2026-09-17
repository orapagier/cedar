import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles, 
  Calendar, 
  Trash2,
  Lock,
  Brush
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { ChoreAssignment } from '../types/dorm';

export const WeeklyChoresView: React.FC = () => {
  const { chores, users, saveChore, updateChoreStatus, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [dutyArea, setDutyArea] = useState<ChoreAssignment['dutyArea']>('Corridor & Stairs');
  const [selectedStudent, setSelectedStudent] = useState(occupants[0]?.id || '');
  const [daySchedule, setDaySchedule] = useState('Mon / Wed / Fri 6:30 AM');
  const [weekRange, setWeekRange] = useState('Week of Sep 14 - Sep 20');

  React.useEffect(() => {
    if ((!selectedStudent || !occupants.some(o => o.id === selectedStudent)) && occupants.length > 0) {
      setSelectedStudent(occupants[0].id);
    }
  }, [occupants, selectedStudent]);

  const handleAssignChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === selectedStudent);
    if (!student) return;

    saveChore({
      weekRange,
      dutyArea,
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '101',
      daySchedule,
      status: 'pending',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">9. Weekly Chore Assignments & Dormitory Maintenance</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              Maintenance Duty
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rotating dorm maintenance roster for all residents to uphold sanitation, hygiene, and cleanliness.
          </p>
        </div>

        {canEdit ? (
          <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 self-start sm:self-auto">
            <Brush className="w-3.5 h-3.5" />
            <span>Chore Proctor Active</span>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {/* Chore Assignment Form for Deans */}
      {canEdit && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Assign Weekly Maintenance Chore</span>
          </h3>

          <form onSubmit={handleAssignChore} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Dorm Maintenance Area</label>
              <select
                value={dutyArea}
                onChange={e => setDutyArea(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
              >
                <option value="Corridor & Stairs">Corridor & Stairs</option>
                <option value="CR & Bathroom Sanitation">CR & Bathroom Sanitation</option>
                <option value="Waste Management & Segregation">Waste Management & Segregation</option>
                <option value="Dorm Grounds & Yard">Dorm Grounds & Yard</option>
                <option value="Common Lounge & Study Hall">Common Lounge & Study Hall</option>
                <option value="Water Refill & Sink Area">Water Refill & Sink Area</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Assigned Resident</label>
              <select
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
              >
                {occupants.length === 0 ? (
                  <option value="">No residents found (Enter students in Residents tab)</option>
                ) : (
                  occupants.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} (Room {o.roomNumber})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Duty Schedule</label>
              <input
                type="text"
                placeholder="e.g. Daily 7:00 PM, or Mon/Wed/Fri"
                value={daySchedule}
                onChange={e => setDaySchedule(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Week Period</label>
              <input
                type="text"
                value={weekRange}
                onChange={e => setWeekRange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Assign Chore to Resident</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chores Roster List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Active Maintenance Duty Roster</h3>
          <span className="text-xs text-slate-400">{chores.length} duty stations assigned</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Duty Area</th>
                <th className="p-3">Assigned Resident</th>
                <th className="p-3">Room</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">Status</th>
                <th className="p-3">Dean Inspection & Action</th>
                <th className="p-3">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {chores.map(chore => (
                <tr key={chore.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white">{chore.dutyArea}</td>
                  <td className="p-3 text-slate-200">{chore.studentName}</td>
                  <td className="p-3">Room {chore.roomNumber}</td>
                  <td className="p-3 font-mono text-slate-400">{chore.daySchedule}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      chore.status === 'inspected_approved' ? 'bg-emerald-950 text-emerald-300' :
                      chore.status === 'completed' ? 'bg-blue-950 text-blue-300' :
                      chore.status === 'failed' ? 'bg-rose-950 text-rose-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {chore.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    {canEdit ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => updateChoreStatus(chore.id, 'inspected_approved', 'Inspected: Spotless and properly sanitized.')}
                          className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded text-[11px] border border-emerald-700/50"
                          title="Approve completed chore"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateChoreStatus(chore.id, 'failed', 'Incomplete chore / missed duty')}
                          className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded text-[11px] border border-rose-700/50"
                          title="Fail and issue demerit"
                        >
                          Fail (-2 pts)
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">{chore.inspectorRemarks || 'Awaiting Dean review'}</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{chore.verifiedBy || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
