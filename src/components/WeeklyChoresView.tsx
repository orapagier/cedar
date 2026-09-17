import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  PlusCircle,
  Save,
  Calendar,
  Lock,
  Brush,
  Users,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { ChoreAssignment } from '../types/dorm';

const DUTY_AREAS: ChoreAssignment['dutyArea'][] = [
  'Corridor & Stairs',
  'CR & Bathroom Sanitation',
  'Waste Management & Segregation',
  'Dorm Grounds & Yard',
  'Common Lounge & Study Hall',
  'Water Refill & Sink Area',
];

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40';

const statusChip = (status: ChoreAssignment['status']) =>
  status === 'inspected_approved' ? 'bg-emerald-950 text-emerald-300' :
  status === 'completed' ? 'bg-blue-950 text-blue-300' :
  status === 'failed' ? 'bg-rose-950 text-rose-300' :
  'bg-slate-800 text-slate-400';

export const WeeklyChoresView: React.FC = () => {
  const { chores, users, rooms, saveChore, updateChoreStatus, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [weekRange, setWeekRange] = useState('Week of Sep 14 - Sep 20');
  const [daySchedule, setDaySchedule] = useState('Mon / Wed / Fri 6:30 AM');
  const [dutyAreas, setDutyAreas] = useState<Record<string, ChoreAssignment['dutyArea']>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const currentChoreFor = (studentId: string) =>
    chores.find(c => c.studentId === studentId && c.weekRange === weekRange);

  const areaFor = (studentId: string) =>
    dutyAreas[studentId] ?? currentChoreFor(studentId)?.dutyArea ?? 'Corridor & Stairs';

  const assignChore = (studentId: string) => {
    if (!canEdit) return;
    const student = occupants.find(o => o.id === studentId);
    if (!student) return;
    saveChore({
      weekRange,
      dutyArea: areaFor(studentId),
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      daySchedule,
      status: 'pending',
    });
    flash(`Assigned ${student.name} to ${areaFor(studentId)}.`);
  };

  const recordDuty = (id: string, status: 'inspected_approved' | 'failed', remarks: string) => {
    updateChoreStatus(id, status, remarks);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Weekly Chores & Maintenance</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              Maintenance Duty
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rotating dorm maintenance roster to uphold sanitation, hygiene, and cleanliness.
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

      {/* Duty period + room */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brush className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Chore Duty Roster</h3>
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

        <div className="p-3 sm:p-4 border-b border-slate-800/70 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Week period</span>
            </label>
            <input type="text" value={weekRange} onChange={e => setWeekRange(e.target.value)} disabled={!canEdit} className={`${FIELD} disabled:opacity-40`} />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Duty schedule</label>
            <input type="text" value={daySchedule} onChange={e => setDaySchedule(e.target.value)} disabled={!canEdit} className={`${FIELD} disabled:opacity-40`} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">Room {selectedRoom || '—'}</span> · {roomOccupants.length} residents
          </p>
        </div>

        <div className="divide-y divide-slate-800/70">
          {roomOccupants.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
          )}
          {roomOccupants.map(student => {
            const current = currentChoreFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                  {current ? (
                    <span className={`mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${statusChip(current.status)}`}>
                      {current.dutyArea} · {current.status.replace('_', ' ').toUpperCase()}
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                      No duty assigned this week
                    </span>
                  )}
                </div>

                {canEdit ? (
                  <div className="flex flex-col sm:flex-row gap-2 md:items-center">
                    {!current || current.status === 'pending' ? (
                      <select
                        value={areaFor(student.id)}
                        onChange={e => setDutyAreas(prev => ({ ...prev, [student.id]: e.target.value as ChoreAssignment['dutyArea'] }))}
                        className={`${FIELD} sm:max-w-[280px]`}
                      >
                        {DUTY_AREAS.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-slate-500">{areaFor(student.id)}</span>
                    )}
                    <div className="flex gap-1.5">
                      {current && current.status === 'pending' && (
                        <>
                          <button
                            onClick={() => recordDuty(current.id, 'inspected_approved', 'Inspected: Spotless and properly sanitized.')}
                            className="min-h-touch px-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] border border-emerald-700/50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => recordDuty(current.id, 'failed', 'Incomplete chore / missed duty')}
                            className="min-h-touch px-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px] border border-rose-700/50 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Fail (-2 pts)
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => assignChore(student.id)}
                        className="min-h-touch px-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        {current ? <Save className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                        {current ? 'Update' : 'Assign'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    {current?.daySchedule || daySchedule}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Duty Assignments
          </h3>
          <span className="text-xs text-slate-400">{chores.length} stations assigned</span>
        </div>
        {chores.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No chores assigned yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {chores.map(chore => (
            <div key={chore.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white text-sm min-w-0 truncate">{chore.dutyArea}</p>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${statusChip(chore.status)}`}>
                  {chore.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {chore.studentName} · Room {chore.roomNumber} · {chore.weekRange}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{chore.daySchedule}</p>
              <p className="text-[11px] text-slate-500 mt-1">{chore.inspectorRemarks || 'Awaiting Dean review'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};