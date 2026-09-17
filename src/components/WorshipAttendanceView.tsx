import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Save, 
  Users, 
  Lock,
  Church
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { WorshipType, AttendanceRecord } from '../types/dorm';

export const WorshipAttendanceView: React.FC = () => {
  const { users, attendance, saveAttendanceBatch, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [sessionType, setSessionType] = useState<WorshipType>('morning_worship');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Temporary local roster state for roll-call
  const [roster, setRoster] = useState<{ [studentId: string]: { status: AttendanceRecord['status']; broughtBible: boolean; notes: string } }>(() => {
    const init: any = {};
    occupants.forEach(occ => {
      init[occ.id] = { status: 'present', broughtBible: true, notes: '' };
    });
    return init;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateStudent = (id: string, field: 'status' | 'broughtBible' | 'notes', value: any) => {
    setRoster(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const markAllPresentWithBible = () => {
    const next: any = {};
    occupants.forEach(occ => {
      next[occ.id] = { status: 'present', broughtBible: true, notes: '' };
    });
    setRoster(next);
  };

  const handleSaveAttendance = () => {
    if (!canEdit) return;

    const records = occupants.map(occ => {
      const entry = roster[occ.id] || { status: 'present', broughtBible: true, notes: '' };
      return {
        date: selectedDate,
        type: sessionType,
        studentId: occ.id,
        studentName: occ.name,
        roomNumber: occ.roomNumber || '101',
        status: entry.status,
        broughtBible: entry.broughtBible,
        notes: entry.notes || undefined,
        recordedBy: currentUser.name,
      };
    });

    saveAttendanceBatch(records);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Filter history for current session
  const historyForSession = attendance.filter(a => a.type === sessionType);

  return (
    <div className="space-y-6">
      {/* Policy Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">2, 3 & 6. Worship & Church Services Attendance</h2>
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
              Devotional Policy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking morning/evening worship, physical Bibles in hand, and weekend church service attendance with lates & absences.
          </p>
        </div>

        {canEdit ? (
          <button
            onClick={handleSaveAttendance}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Attendance Roll</span>
          </button>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Attendance records saved successfully! Any unexcused absences or missing Bibles have been automatically logged into the Disciplinary Demerit Stream.</span>
        </div>
      )}

      {/* Session Selector & Date Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'morning_worship', label: 'Morning Worship (05:30 AM)', icon: Clock },
            { id: 'evening_worship', label: 'Evening Worship (06:30 PM)', icon: Clock },
            { id: 'church_midweek', label: 'Midweek Church Prayer', icon: Church },
            { id: 'church_sabbath', label: 'Weekend / Sabbath Church', icon: Church },
          ].map(s => {
            const Icon = s.icon;
            const isSelected = sessionType === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSessionType(s.id as WorshipType)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
          {canEdit && (
            <button
              onClick={markAllPresentWithBible}
              className="bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium"
            >
              Mark All Present + Bible
            </button>
          )}
        </div>
      </div>

      {/* Interactive Roll-Call Grid for Deans */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-sm">Roll-Call Register & Bible Physical Check</h3>
          </div>
          <span className="text-xs text-slate-400">{occupants.length} dormitory residents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Resident</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Attendance Status</th>
                <th className="p-3.5">Brought Bible? (Item 3)</th>
                <th className="p-3.5">Dean Notes / Excuse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {occupants.map(occ => {
                const currentEntry = roster[occ.id] || { status: 'present', broughtBible: true, notes: '' };
                return (
                  <tr key={occ.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{occ.name}</div>
                      <div className="text-[10px] text-slate-400">{occ.email}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-slate-300">
                      Room {occ.roomNumber || '101'}
                    </td>
                    <td className="p-3.5">
                      {canEdit ? (
                        <div className="flex items-center space-x-1">
                          {(['present', 'late', 'absent', 'excused'] as const).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => updateStudent(occ.id, 'status', st)}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                                currentEntry.status === st
                                  ? st === 'present' ? 'bg-emerald-600 text-white' :
                                    st === 'late' ? 'bg-amber-600 text-white' :
                                    st === 'absent' ? 'bg-rose-600 text-white' :
                                    'bg-sky-600 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${
                          currentEntry.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
                          currentEntry.status === 'late' ? 'bg-amber-950 text-amber-300' :
                          currentEntry.status === 'absent' ? 'bg-rose-950 text-rose-300' :
                          'bg-sky-950 text-sky-300'
                        }`}>
                          {currentEntry.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {canEdit ? (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentEntry.broughtBible}
                            onChange={e => updateStudent(occ.id, 'broughtBible', e.target.checked)}
                            className="w-4 h-4 rounded text-blue-500 accent-blue-500"
                          />
                          <span className={`text-xs ${currentEntry.broughtBible ? 'text-blue-300 font-medium' : 'text-rose-400 font-semibold'}`}>
                            {currentEntry.broughtBible ? 'Bible in hand' : 'No Bible (-1 pt)'}
                          </span>
                        </label>
                      ) : (
                        <span className={`text-xs ${currentEntry.broughtBible ? 'text-blue-300' : 'text-rose-400 font-semibold'}`}>
                          {currentEntry.broughtBible ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {canEdit ? (
                        <input
                          type="text"
                          placeholder="e.g. 10 mins late, or sick slip"
                          value={currentEntry.notes}
                          onChange={e => updateStudent(occ.id, 'notes', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-slate-400">{currentEntry.notes || '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Records Table for this Session */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Past Worship Attendance Logs</h3>
          <span className="text-xs text-slate-400">{historyForSession.length} recorded entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Session</th>
                <th className="p-3">Student</th>
                <th className="p-3">Room</th>
                <th className="p-3">Status</th>
                <th className="p-3">Bible Brought</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historyForSession.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="p-3 whitespace-nowrap font-mono text-slate-400">{item.date} {item.timestamp}</td>
                  <td className="p-3 capitalize text-blue-300 font-medium">{item.type.replace('_', ' ')}</td>
                  <td className="p-3 font-semibold text-white">{item.studentName}</td>
                  <td className="p-3">Room {item.roomNumber}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.status === 'present' ? 'bg-emerald-950 text-emerald-300' :
                      item.status === 'late' ? 'bg-amber-950 text-amber-300' :
                      item.status === 'absent' ? 'bg-rose-950 text-rose-300' :
                      'bg-sky-950 text-sky-300'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.broughtBible ? (
                      <span className="text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-rose-400 font-bold">No Bible</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{item.notes || '-'}</td>
                  <td className="p-3 text-slate-400">{item.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
