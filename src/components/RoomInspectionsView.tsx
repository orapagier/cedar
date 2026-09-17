import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ClipboardList, 
  Sparkles, 
  Lock, 
  PlusCircle,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { RoomInspection } from '../types/dorm';

export const RoomInspectionsView: React.FC = () => {
  const { inspections, rooms, addInspection, canEdit, currentUser } = useDorm();
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.roomNumber || '101');
  const [bedsOk, setBedsOk] = useState(true);
  const [lockersOk, setLockersOk] = useState(true);
  const [personalThingsOk, setPersonalThingsOk] = useState(true);
  const [crCleanlinessOk, setCrCleanlinessOk] = useState(true);
  const [overallFloorOk, setOverallFloorOk] = useState(true);
  const [remarks, setRemarks] = useState('');

  React.useEffect(() => {
    if ((!selectedRoom || !rooms.some(r => r.roomNumber === selectedRoom)) && rooms.length > 0) {
      setSelectedRoom(rooms[0].roomNumber);
    }
  }, [rooms, selectedRoom]);

  // Calculate live score: each checklist is 20%
  const calculateScore = () => {
    let count = 0;
    if (bedsOk) count += 20;
    if (lockersOk) count += 20;
    if (personalThingsOk) count += 20;
    if (crCleanlinessOk) count += 20;
    if (overallFloorOk) count += 20;
    return count;
  };

  const currentScore = calculateScore();
  const currentStatus: 'pass' | 'warning' | 'fail' = 
    currentScore >= 90 ? 'pass' : currentScore >= 70 ? 'warning' : 'fail';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    addInspection({
      date: new Date().toISOString().split('T')[0],
      roomNumber: selectedRoom,
      inspectorName: currentUser.name,
      inspectorId: currentUser.id,
      bedsOk,
      lockersOk,
      personalThingsOk,
      crCleanlinessOk,
      overallFloorOk,
      score: currentScore,
      status: currentStatus,
      remarks: remarks || undefined,
    });

    setShowModal(false);
    setRemarks('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white">1 & 10. Room Cleanliness & Daily Inspections</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              Merged Policy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking individual beds, lockers, personal belongings, and overall cleanliness of room and CR (bathroom).
          </p>
        </div>

        {canEdit ? (
          <button
            onClick={() => setShowModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Score Room Inspection</span>
          </button>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {/* Room Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => {
          const latestInsp = inspections.find(i => i.roomNumber === room.roomNumber);
          return (
            <div 
              key={room.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-slate-400 font-mono">{room.wing} • Floor {room.floor}</span>
                  <h3 className="text-lg font-bold text-white">Room {room.roomNumber}</h3>
                </div>
                {latestInsp ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    latestInsp.status === 'pass' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' :
                    latestInsp.status === 'warning' ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' :
                    'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}>
                    {latestInsp.score}/100 • {latestInsp.status.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">No inspection</span>
                )}
              </div>

              <div className="text-xs text-slate-400 mb-3">
                <span className="text-slate-500">Room Captain: </span>
                <span className="text-slate-200 font-medium">{room.captainName}</span>
              </div>

              {latestInsp && (
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      {latestInsp.bedsOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      <span className={latestInsp.bedsOk ? 'text-slate-300' : 'text-rose-300 font-medium'}>Individual Beds</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {latestInsp.lockersOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      <span className={latestInsp.lockersOk ? 'text-slate-300' : 'text-rose-300 font-medium'}>Lockers Locked</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {latestInsp.personalThingsOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      <span className={latestInsp.personalThingsOk ? 'text-slate-300' : 'text-rose-300 font-medium'}>Things Arranged</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {latestInsp.crCleanlinessOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      <span className={latestInsp.crCleanlinessOk ? 'text-slate-300' : 'text-rose-300 font-medium'}>CR / Bathroom</span>
                    </div>
                  </div>

                  {latestInsp.remarks && (
                    <p className="text-[11px] text-slate-300 italic border-t border-slate-800 pt-1.5">
                      "{latestInsp.remarks}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Inspected by {latestInsp.inspectorName}</span>
                    <span>{latestInsp.timestamp}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Historical Inspection Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Official Inspection Logbook</h3>
          <span className="text-xs text-slate-400">{inspections.length} recorded inspections</span>
        </div>

        <div className="lg:hidden divide-y divide-slate-800/70">
          {inspections.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No inspections recorded yet.</p>
          )}
          {inspections.map(insp => (
            <div key={insp.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">Room {insp.roomNumber}</p>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    insp.status === 'pass' ? 'bg-emerald-950 text-emerald-300' :
                    insp.status === 'warning' ? 'bg-amber-950 text-amber-300' :
                    'bg-rose-950 text-rose-300'
                  }`}>
                    {insp.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono text-right">{insp.date}<br />{insp.timestamp}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: 'Beds', ok: insp.bedsOk },
                  { label: 'Lockers', ok: insp.lockersOk },
                  { label: 'Items', ok: insp.personalThingsOk },
                  { label: 'CR', ok: insp.crCleanlinessOk },
                  { label: 'Floor', ok: insp.overallFloorOk },
                ].map(c => (
                  <span key={c.label} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    c.ok ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                  }`}>
                    {c.label}
                  </span>
                ))}
              </div>
              {insp.remarks && <p className="text-[11px] text-slate-400 mt-1.5">{insp.remarks}</p>}
              <p className="text-[11px] text-slate-500 mt-1">Inspected by {insp.inspectorName}</p>
            </div>
          ))}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Beds</th>
                <th className="p-3.5">Lockers</th>
                <th className="p-3.5">Personal Items</th>
                <th className="p-3.5">CR & Toilet</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Remarks</th>
                <th className="p-3.5">Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {inspections.map(insp => (
                <tr key={insp.id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 whitespace-nowrap font-mono text-slate-400">
                    {insp.date} {insp.timestamp}
                  </td>
                  <td className="p-3.5 font-bold text-white">Room {insp.roomNumber}</td>
                  <td className="p-3.5">
                    {insp.bedsOk ? <span className="text-emerald-400">Pass</span> : <span className="text-rose-400 font-bold">Fail</span>}
                  </td>
                  <td className="p-3.5">
                    {insp.lockersOk ? <span className="text-emerald-400">Pass</span> : <span className="text-rose-400 font-bold">Fail</span>}
                  </td>
                  <td className="p-3.5">
                    {insp.personalThingsOk ? <span className="text-emerald-400">Pass</span> : <span className="text-rose-400 font-bold">Fail</span>}
                  </td>
                  <td className="p-3.5">
                    {insp.crCleanlinessOk ? <span className="text-emerald-400">Pass</span> : <span className="text-rose-400 font-bold">Fail</span>}
                  </td>
                  <td className="p-3.5">
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      insp.status === 'pass' ? 'bg-emerald-950 text-emerald-300' :
                      insp.status === 'warning' ? 'bg-amber-950 text-amber-300' :
                      'bg-rose-950 text-rose-300'
                    }`}>
                      {insp.score}%
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 max-w-xs truncate">{insp.remarks || '-'}</td>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">{insp.inspectorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Conduct Daily Room & CR Inspection</h3>
                <p className="text-xs text-slate-400">Dean / Admin Inspection Scoring Protocol</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Room select */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Room to Inspect</label>
                <select
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} ({r.wing} - Captain: {r.captainName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                  Hygiene & Organization Criteria (20 pts each)
                </span>

                <label className="flex items-center justify-between p-3 min-h-touch rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-200">1. Individual Beds & Beddings</div>
                    <div className="text-[10px] text-slate-400">Hospital corners, pillows straight, no dirty clothes on mattresses</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bedsOk}
                    onChange={e => setBedsOk(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 min-h-touch rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-200">2. Lockers & Closets</div>
                    <div className="text-[10px] text-slate-400">Doors shut and padlocked, no laundry hanging outside lockers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lockersOk}
                    onChange={e => setLockersOk(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 min-h-touch rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-200">3. Personal Things & Study Desks</div>
                    <div className="text-[10px] text-slate-400">Shoes in rack, books organized, desk surfaces free of crumbs</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={personalThingsOk}
                    onChange={e => setPersonalThingsOk(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 min-h-touch rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-200">4. Comfort Room (CR) & Toilet Sanitation</div>
                    <div className="text-[10px] text-slate-400">Toilet bowl clean, floor dry, trash bin empty, no soap scum</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={crCleanlinessOk}
                    onChange={e => setCrCleanlinessOk(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 min-h-touch rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-200">5. Overall Room Floor & Dust</div>
                    <div className="text-[10px] text-slate-400">Swept and mopped, main walkway clear, windows/curtains arranged</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={overallFloorOk}
                    onChange={e => setOverallFloorOk(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>
              </div>

              {/* Live score preview */}
              <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-300 font-medium">Calculated Inspection Score:</span>
                <span className={`font-bold text-sm px-2.5 py-0.5 rounded ${
                  currentStatus === 'pass' ? 'bg-emerald-900 text-emerald-300' :
                  currentStatus === 'warning' ? 'bg-amber-950 text-amber-300' :
                  'bg-rose-950 text-rose-300'
                }`}>
                  {currentScore} / 100 ({currentStatus.toUpperCase()})
                </span>
              </div>

              {currentStatus === 'fail' && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-300 text-[11px] flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Warning: Submitting a Fail score will automatically create a demerit violation for room occupants.</span>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Dean / Inspector Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g., Hospital corners neat, but CR sink needs descaling..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-touch rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  Save Inspection Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
