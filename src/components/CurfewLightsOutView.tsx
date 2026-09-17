import React, { useState } from 'react';
import { 
  Moon, 
  Clock, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

export const CurfewLightsOutView: React.FC = () => {
  const { 
    curfewRecords, 
    lightsOutLogs, 
    rooms, 
    users, 
    saveCurfewRecord, 
    saveLightsOutLog, 
    canEdit, 
    currentUser 
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const [activeSection, setActiveSection] = useState<'curfew' | 'lights_out'>('curfew');

  // Curfew Form
  const [selectedStudent, setSelectedStudent] = useState(occupants[0]?.id || '');
  const [checkInTime, setCheckInTime] = useState('20:50');
  const [curfewStatus, setCurfewStatus] = useState<'in_dorm' | 'late' | 'missing' | 'official_pass'>('in_dorm');
  const [curfewRemarks, setCurfewRemarks] = useState('');

  React.useEffect(() => {
    if ((!selectedStudent || !occupants.some(o => o.id === selectedStudent)) && occupants.length > 0) {
      setSelectedStudent(occupants[0].id);
    }
  }, [occupants, selectedStudent]);

  // Lights Out Form
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.roomNumber || '101');
  const [lightsOff, setLightsOff] = useState(true);
  const [noiseQuiet, setNoiseQuiet] = useState(true);
  const [gadgetsCompliant, setGadgetsCompliant] = useState(true);
  const [lightsOutRemarks, setLightsOutRemarks] = useState('');

  const handleCurfewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === selectedStudent);
    if (!student) return;

    saveCurfewRecord({
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '101',
      curfewTime: '21:00',
      actualCheckInTime: curfewStatus === 'missing' ? undefined : checkInTime,
      status: curfewStatus,
      remarks: curfewRemarks || undefined,
      loggedBy: currentUser.name,
    });

    setCurfewRemarks('');
  };

  const handleLightsOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const isCompliant = lightsOff && noiseQuiet && gadgetsCompliant;

    saveLightsOutLog({
      date: new Date().toISOString().split('T')[0],
      roomNumber: selectedRoom,
      checkTime: '22:10',
      allLightsOff: lightsOff,
      noiseCompliant: noiseQuiet,
      noUnauthorizedGadgets: gadgetsCompliant,
      status: isCompliant ? 'compliant' : 'violation',
      violatorRemarks: lightsOutRemarks || undefined,
      inspectedBy: currentUser.name,
    });

    setLightsOutRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">4 & 11. Curfew & Mandatory Lights-Out Policy</h2>
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
              Night Routine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforcing the 9:00 PM dormitory curfew check-in and 10:00 PM lights-out silence and gadget restriction.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSection('curfew')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'curfew' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. Curfew Observance (9 PM)
          </button>
          <button
            onClick={() => setActiveSection('lights_out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'lights_out' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            11. Lights-Out Rounds (10 PM)
          </button>
        </div>
      </div>

      {/* SECTION 1: CURFEW OBSERVANCE */}
      {activeSection === 'curfew' && (
        <div className="space-y-6">
          {/* Quick Curfew Entry Form */}
          {canEdit && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Log Resident Curfew Check-In (9:00 PM Threshold)</span>
              </h3>

              <form onSubmit={handleCurfewSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Student</label>
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
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={curfewStatus}
                    onChange={e => setCurfewStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                  >
                    <option value="in_dorm">In Dorm (On-Time)</option>
                    <option value="late">Late Arrival (Past 9:00 PM)</option>
                    <option value="missing">Missing / AWOL (Unaccounted)</option>
                    <option value="official_pass">Official Dean Leave Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Actual Check-In Time</label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                    disabled={curfewStatus === 'missing'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Notes / Reason</label>
                  <input
                    type="text"
                    placeholder="e.g., Late from lab work..."
                    value={curfewRemarks}
                    onChange={e => setCurfewRemarks(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Save Curfew Record</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Curfew Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Official Curfew Observance Registry</h3>
              <span className="text-xs text-slate-400">{curfewRecords.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Resident</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Curfew Limit</th>
                    <th className="p-3">Check-in Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {curfewRecords.map(cr => (
                    <tr key={cr.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-400">{cr.date}</td>
                      <td className="p-3 font-semibold text-white">{cr.studentName}</td>
                      <td className="p-3">Room {cr.roomNumber}</td>
                      <td className="p-3 font-mono text-purple-300">{cr.curfewTime}</td>
                      <td className="p-3 font-mono">
                        {cr.actualCheckInTime ? (
                          <span className={cr.actualCheckInTime > '21:00' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            {cr.actualCheckInTime}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cr.status === 'in_dorm' ? 'bg-emerald-950 text-emerald-300' :
                          cr.status === 'late' ? 'bg-amber-950 text-amber-300' :
                          cr.status === 'missing' ? 'bg-rose-950 text-rose-300' :
                          'bg-blue-950 text-blue-300'
                        }`}>
                          {cr.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{cr.remarks || '-'}</td>
                      <td className="p-3 text-slate-400">{cr.loggedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LIGHTS-OUT POLICY */}
      {activeSection === 'lights_out' && (
        <div className="space-y-6">
          {/* Lights Out Round Checker Form */}
          {canEdit && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <span>10:00 PM Mandatory Lights-Out Inspection</span>
              </h3>

              <form onSubmit={handleLightsOutSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Room Checked</label>
                    <select
                      value={selectedRoom}
                      onChange={e => setSelectedRoom(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.roomNumber}>
                          Room {r.roomNumber} ({r.wing})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Violation Notes (if any)</label>
                    <input
                      type="text"
                      placeholder="e.g. Flashlight on, whispering, unauthorized smartphone detected..."
                      value={lightsOutRemarks}
                      onChange={e => setLightsOutRemarks(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lightsOff}
                      onChange={e => setLightsOff(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 accent-purple-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-200">Main Lights Out</div>
                      <div className="text-[10px] text-slate-400">All overhead & desk lights extinguished</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noiseQuiet}
                      onChange={e => setNoiseQuiet(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 accent-purple-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-200">Silence Observed</div>
                      <div className="text-[10px] text-slate-400">No loud talking, music, or hallway loitering</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gadgetsCompliant}
                      onChange={e => setGadgetsCompliant(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 accent-purple-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-200">No Secret Devices</div>
                      <div className="text-[10px] text-slate-400">No hidden phones under blankets</div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Log Lights-Out Round</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lights Out Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Lights-Out Rounds History</h3>
              <span className="text-xs text-slate-400">{lightsOutLogs.length} inspections</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Lights Extinguished</th>
                    <th className="p-3">Silence</th>
                    <th className="p-3">No Secret Gadgets</th>
                    <th className="p-3">Round Status</th>
                    <th className="p-3">Violation Remarks</th>
                    <th className="p-3">Dean / Monitor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lightsOutLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-400">{log.date} {log.checkTime}</td>
                      <td className="p-3 font-bold text-white">Room {log.roomNumber}</td>
                      <td className="p-3">{log.allLightsOff ? <span className="text-emerald-400">Yes</span> : <span className="text-rose-400 font-bold">No</span>}</td>
                      <td className="p-3">{log.noiseCompliant ? <span className="text-emerald-400">Quiet</span> : <span className="text-rose-400 font-bold">Noisy</span>}</td>
                      <td className="p-3">{log.noUnauthorizedGadgets ? <span className="text-emerald-400">Clear</span> : <span className="text-rose-400 font-bold">Found</span>}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.status === 'compliant' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{log.violatorRemarks || '-'}</td>
                      <td className="p-3 text-slate-400">{log.inspectedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
