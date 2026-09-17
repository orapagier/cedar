import React, { useState } from 'react';
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  Shirt, 
  Scissors, 
  IdCard, 
  Footprints,
  Lock
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

export const SchoolDepartureUniformView: React.FC = () => {
  const { uniformLogs, users, saveUniformLog, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const [selectedStudent, setSelectedStudent] = useState(occupants[0]?.id || '');
  const [departureTime, setDepartureTime] = useState('07:20');
  const [uniformCompliant, setUniformCompliant] = useState(true);
  const [hairCompliant, setHairCompliant] = useState(true);
  const [idBadgeCompliant, setIdBadgeCompliant] = useState(true);
  const [shoesCompliant, setShoesCompliant] = useState(true);
  const [remarks, setRemarks] = useState('');

  React.useEffect(() => {
    if ((!selectedStudent || !occupants.some(o => o.id === selectedStudent)) && occupants.length > 0) {
      setSelectedStudent(occupants[0].id);
    }
  }, [occupants, selectedStudent]);

  // Rule: Standard school departure window is 07:00 to 07:35 AM
  const isTimeOnSchedule = departureTime >= '07:00' && departureTime <= '07:35';
  const isFullyCompliant = uniformCompliant && hairCompliant && idBadgeCompliant && shoesCompliant && isTimeOnSchedule;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === selectedStudent);
    if (!student) return;

    saveUniformLog({
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '101',
      departureTime,
      uniformCompliant,
      hairGroomingCompliant: hairCompliant,
      idBadgeCompliant,
      shoesCompliant,
      isDepartureOnSchedule: isTimeOnSchedule,
      status: isFullyCompliant ? 'cleared' : 'flagged',
      remarks: remarks || (!isTimeOnSchedule ? `Departed outside standard 07:00-07:35 window (${departureTime})` : undefined),
      inspectedBy: currentUser.name,
    });

    setRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">5 & 7. School Departure Time & Uniform Standards</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              Morning Gate Check
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking exact school exit time (07:00 - 07:35 AM window) and strict daily uniform, ID badge, hair cut, and shoe compliance.
          </p>
        </div>

        {canEdit ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Gate Clearance Active</span>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {/* Interactive Gate Inspection Form for Dean / RA */}
      {canEdit && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Inspect Resident Departure & School Uniform</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Select Student Leaving Dorm</label>
                <select
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                <label className="block text-slate-400 mb-1">Departure Time (Target: 07:00 - 07:35 AM)</label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
                {!isTimeOnSchedule && (
                  <span className="text-[10px] text-amber-400 mt-1 block">
                    ⚠ Warning: Outside designated 7:00-7:35 AM school departure window.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dean / Gate Monitor Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Untucked shirt, long hair..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Checklist of 4 Uniform Standards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uniformCompliant}
                  onChange={e => setUniformCompliant(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-1">
                    <Shirt className="w-3.5 h-3.5 text-slate-400" />
                    <span>Proper School Uniform</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Ironed, tucked in, correct color</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hairCompliant}
                  onChange={e => setHairCompliant(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-1">
                    <Scissors className="w-3.5 h-3.5 text-slate-400" />
                    <span>Haircut & Grooming</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Above collar, clean shaved</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idBadgeCompliant}
                  onChange={e => setIdBadgeCompliant(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-1">
                    <IdCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>ID Badge Worn</span>
                  </div>
                  <div className="text-[10px] text-slate-400">School ID & dorm pass visible</div>
                </div>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shoesCompliant}
                  onChange={e => setShoesCompliant(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center space-x-1">
                    <Footprints className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prescribed Shoes</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Black leather shoes & socks</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Gate Clearance</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departure & Uniform Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Gate Departure & Uniform Inspection Register</h3>
          <span className="text-xs text-slate-400">{uniformLogs.length} logged departures</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Resident</th>
                <th className="p-3">Room</th>
                <th className="p-3">Departure Time</th>
                <th className="p-3">Uniform</th>
                <th className="p-3">Haircut</th>
                <th className="p-3">ID Badge</th>
                <th className="p-3">Shoes</th>
                <th className="p-3">Gate Status</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {uniformLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-400">{log.date}</td>
                  <td className="p-3 font-semibold text-white">{log.studentName}</td>
                  <td className="p-3">Room {log.roomNumber}</td>
                  <td className="p-3 font-mono font-bold">
                    <span className={log.isDepartureOnSchedule ? 'text-emerald-400' : 'text-amber-400'}>
                      {log.departureTime}
                    </span>
                  </td>
                  <td className="p-3">{log.uniformCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}</td>
                  <td className="p-3">{log.hairGroomingCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}</td>
                  <td className="p-3">{log.idBadgeCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}</td>
                  <td className="p-3">{log.shoesCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      log.status === 'cleared' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 max-w-xs truncate">{log.remarks || '-'}</td>
                  <td className="p-3 text-slate-400">{log.inspectedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
