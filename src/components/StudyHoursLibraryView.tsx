import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Library, 
  VolumeX, 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

export const StudyHoursLibraryView: React.FC = () => {
  const { studyLogs, users, saveStudyLog, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [selectedStudent, setSelectedStudent] = useState(occupants[0]?.id || '');
  const [location, setLocation] = useState<'study_hall' | 'library' | 'approved_room'>('library');
  const [status, setStatus] = useState<'present' | 'late' | 'absent' | 'excused'>('present');
  const [focusRating, setFocusRating] = useState<'focused' | 'distracted' | 'noise_violation'>('focused');
  const [remarks, setRemarks] = useState('');

  React.useEffect(() => {
    if ((!selectedStudent || !occupants.some(o => o.id === selectedStudent)) && occupants.length > 0) {
      setSelectedStudent(occupants[0].id);
    }
  }, [occupants, selectedStudent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === selectedStudent);
    if (!student) return;

    saveStudyLog({
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '101',
      location,
      status,
      focusRating,
      remarks: remarks || undefined,
      recordedBy: currentUser.name,
    });

    setRemarks('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">8. Scheduled Study Hours & Mandatory Library Time</h2>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
              Academic Focus
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory evening study period (07:30 PM - 09:30 PM) in the dormitory study hall or campus library.
          </p>
        </div>

        {canEdit ? (
          <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 self-start sm:self-auto">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Study Monitor Active</span>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {/* Log Form */}
      {canEdit && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <Library className="w-4 h-4 text-indigo-400" />
            <span>Log Resident Study & Library Attendance</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 min-h-touch text-white"
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
              <label className="block text-slate-400 mb-1">Study Location</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 min-h-touch text-white"
              >
                <option value="library">Campus Library</option>
                <option value="study_hall">Dorm Study Hall</option>
                <option value="approved_room">Approved Quiet Room</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Attendance Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 min-h-touch text-white"
              >
                <option value="present">Present (On-Time)</option>
                <option value="late">Late Arrival</option>
                <option value="absent">Absent / Skipping</option>
                <option value="excused">Excused (Medical/Lab)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Focus & Noise Behavior</label>
              <select
                value={focusRating}
                onChange={e => setFocusRating(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 min-h-touch text-white"
              >
                <option value="focused">Focused & Silent</option>
                <option value="distracted">Distracted / Loitering</option>
                <option value="noise_violation">Noise Disturbance (-2 pts)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <input
                type="text"
                placeholder="Study session notes (e.g. Working on Thesis draft, or chatting loudly)..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-touch text-white"
              />
            </div>

            <div className="flex justify-end items-center">
              <button
                type="submit"
                className="w-full min-h-touch bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Study Record</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Evening Study & Library Logs</h3>
          <span className="text-xs text-slate-400">{studyLogs.length} entries</span>
        </div>

        <div className="lg:hidden divide-y divide-slate-800/70">
          {studyLogs.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No study logs recorded yet.</p>
          )}
          {studyLogs.map(log => (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{log.studentName}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
                    log.status === 'late' ? 'bg-amber-950 text-amber-300' :
                    log.status === 'absent' ? 'bg-rose-950 text-rose-300' :
                    'bg-sky-950 text-sky-300'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">{log.date}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room {log.roomNumber} · <span className="capitalize text-indigo-300 font-medium">{log.location.replace('_', ' ')}</span>
              </p>
              <p className={`text-[11px] mt-1 font-medium ${
                log.focusRating === 'focused' ? 'text-emerald-400' :
                log.focusRating === 'distracted' ? 'text-amber-400' : 'text-rose-400 font-bold'
              }`}>
                {log.focusRating.replace('_', ' ')}
              </p>
              {log.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{log.remarks}</p>}
              <p className="text-[11px] text-slate-500 mt-1">Proctor: {log.recordedBy}</p>
            </div>
          ))}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Resident</th>
                <th className="p-3">Room</th>
                <th className="p-3">Location</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Behavior & Noise</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Study Proctor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {studyLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-400">{log.date}</td>
                  <td className="p-3 font-semibold text-white">{log.studentName}</td>
                  <td className="p-3">Room {log.roomNumber}</td>
                  <td className="p-3 capitalize text-indigo-300 font-medium">
                    {log.location.replace('_', ' ')}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      log.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
                      log.status === 'late' ? 'bg-amber-950 text-amber-300' :
                      log.status === 'absent' ? 'bg-rose-950 text-rose-300' :
                      'bg-sky-950 text-sky-300'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[11px] font-medium ${
                      log.focusRating === 'focused' ? 'text-emerald-400' :
                      log.focusRating === 'distracted' ? 'text-amber-400' : 'text-rose-400 font-bold'
                    }`}>
                      {log.focusRating.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{log.remarks || '-'}</td>
                  <td className="p-3 text-slate-400">{log.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
