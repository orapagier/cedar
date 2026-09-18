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
  HelpCircle,
  BedDouble,
  Boxes,
  Shirt,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { Modal } from './ui/Modal';
import { RecordOverrideControls } from './RecordOverrideControls';
import { RoomInspection, OccupantInspectionCheck } from '../types/dorm';
import { formatFullDate } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';

const INDIVIDUAL_ITEMS: { key: 'bedsOk' | 'lockersOk' | 'personalThingsOk'; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'bedsOk', label: 'Bed & Bedding', sub: 'Hospital corners, no dirty clothes', icon: BedDouble },
  { key: 'lockersOk', label: 'Locker & Closet', sub: 'Shut and padlocked', icon: Boxes },
  { key: 'personalThingsOk', label: 'Things & Desk', sub: 'Shoes racked, desk tidy', icon: Shirt },
];

export const RoomInspectionsView: React.FC = () => {
  const { inspections, rooms, users, addInspection, canEdit, isSuperAdmin, currentUser } = useDorm();
  const [showModal, setShowModal] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const today = useManilaToday();

  /** A room is walked once a day; this is that walk, if it has happened. */
  const inspectedToday = (roomNumber: string) =>
    inspections.find(i => i.roomNumber === roomNumber && i.date === today);

  const occupantsIn = (roomNumber: string) =>
    users.filter(
      u => u.role === 'occupant' && rooms.find(r => r.roomNumber === roomNumber)?.occupantIds?.includes(u.id)
    );

  // Form states
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.roomNumber || '101');
  const [occupantState, setOccupantState] = useState<Record<string, { bedsOk: boolean; lockersOk: boolean; personalThingsOk: boolean }>>({});
  const [crCleanlinessOk, setCrCleanlinessOk] = useState(true);
  const [overallFloorOk, setOverallFloorOk] = useState(true);
  const [remarks, setRemarks] = useState('');

  const openInspect = (roomNumber: string) => {
    const init: Record<string, { bedsOk: boolean; lockersOk: boolean; personalThingsOk: boolean }> = {};
    occupantsIn(roomNumber).forEach(o => {
      init[o.id] = { bedsOk: true, lockersOk: true, personalThingsOk: true };
    });
    setOccupantState(init);
    setCrCleanlinessOk(true);
    setOverallFloorOk(true);
    setRemarks('');
    setSelectedRoom(roomNumber);
    setShowModal(true);
  };

  const roomOccupants = occupantsIn(selectedRoom);
  const setOccupant = (id: string, key: 'bedsOk' | 'lockersOk' | 'personalThingsOk', value: boolean) =>
    setOccupantState(prev => ({ ...prev, [id]: { ...(prev[id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true }), [key]: value } }));

  React.useEffect(() => {
    if ((!selectedRoom || !rooms.some(r => r.roomNumber === selectedRoom)) && rooms.length > 0) {
      setSelectedRoom(rooms[0].roomNumber);
    }
  }, [rooms, selectedRoom]);

  // Live score: every passed criterion counts equally. The first three items
  // are rated per resident; the last two are room-level checks.
  const calculateScore = () => {
    const totalChecks = roomOccupants.length * 3 + 2;
    if (totalChecks === 0) return 100;
    let passed = 0;
    roomOccupants.forEach(o => {
      const c = occupantState[o.id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true };
      if (c.bedsOk) passed += 1;
      if (c.lockersOk) passed += 1;
      if (c.personalThingsOk) passed += 1;
    });
    if (crCleanlinessOk) passed += 1;
    if (overallFloorOk) passed += 1;
    return Math.round((passed / totalChecks) * 100);
  };

  const currentScore = calculateScore();
  const currentStatus: 'pass' | 'warning' | 'fail' = 
    currentScore >= 90 ? 'pass' : currentScore >= 70 ? 'warning' : 'fail';

  const aggregateOk = (key: 'bedsOk' | 'lockersOk' | 'personalThingsOk') =>
    roomOccupants.every(o => (occupantState[o.id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true })[key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const occupantChecks: OccupantInspectionCheck[] = roomOccupants.map(o => ({
      studentId: o.id,
      studentName: o.name,
      bedsOk: (occupantState[o.id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true }).bedsOk,
      lockersOk: (occupantState[o.id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true }).lockersOk,
      personalThingsOk: (occupantState[o.id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true }).personalThingsOk,
    }));

    const { filed } = addInspection({
      date: today,
      roomNumber: selectedRoom,
      inspectorName: currentUser.name,
      inspectorId: currentUser.id,
      bedsOk: roomOccupants.length === 0 || aggregateOk('bedsOk'),
      lockersOk: roomOccupants.length === 0 || aggregateOk('lockersOk'),
      personalThingsOk: roomOccupants.length === 0 || aggregateOk('personalThingsOk'),
      crCleanlinessOk,
      overallFloorOk,
      score: currentScore,
      status: currentStatus,
      remarks: remarks || undefined,
      occupantChecks,
    });

    setShowModal(false);
    setRemarks('');
    setSavedMessage(
      filed
        ? `Room ${selectedRoom} scored ${currentScore}/100 — ${currentStatus.toUpperCase()}.`
        : `Room ${selectedRoom} was already inspected today — that score stands.${
            isSuperAdmin ? ' Correct it with the pencil on the record below.' : ' Ask the Dean to correct it.'
          }`
    );
    setTimeout(() => setSavedMessage(null), 5000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">Room Check & Cleanliness</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap">
              Daily Inspection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scoring each resident's bed, locker, and personal belongings individually, plus overall room and CR (bathroom) cleanliness.
          </p>
        </div>

        {canEdit ? (
          <button
            onClick={() => openInspect(selectedRoom)}
            disabled={!!inspectedToday(selectedRoom)}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold px-4 py-2 min-h-touch rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{inspectedToday(selectedRoom) ? `Room ${selectedRoom} Done Today` : 'Score Room Inspection'}</span>
          </button>
        ) : (
          <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Occupant View-Only</span>
          </div>
        )}
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

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

              <div className="text-xs text-slate-400 mb-3 flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="text-slate-500">Room Captain: </span>
                  <span className="text-slate-200 font-medium">{room.captainName}</span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => openInspect(room.roomNumber)}
                    disabled={!!inspectedToday(room.roomNumber)}
                    className="shrink-0 min-h-touch px-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-amber-300 border border-slate-700 rounded-lg text-[11px] font-semibold"
                  >
                    {inspectedToday(room.roomNumber) ? 'Done today' : 'Inspect'}
                  </button>
                )}
              </div>

              {latestInsp && (
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                  {latestInsp.occupantChecks && latestInsp.occupantChecks.length > 0 ? (
                    <>
                      <div className="space-y-1">
                        {latestInsp.occupantChecks.map(c => {
                          const passed = [c.bedsOk, c.lockersOk, c.personalThingsOk].filter(Boolean).length;
                          return (
                            <div key={c.studentId} className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-300 truncate">{c.studentName}</span>
                              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                passed === 3 ? 'bg-emerald-950 text-emerald-300' :
                                passed === 0 ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'
                              }`}>
                                {passed}/3
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-800/70">
                        <div className="flex items-center space-x-1.5">
                          {latestInsp.crCleanlinessOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          <span className={latestInsp.crCleanlinessOk ? 'text-slate-300' : 'text-rose-300 font-medium'}>CR / Bathroom</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {latestInsp.overallFloorOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          <span className={latestInsp.overallFloorOk ? 'text-slate-300' : 'text-rose-300 font-medium'}>Floor / Dust</span>
                        </div>
                      </div>
                    </>
                  ) : (
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
                  )}

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
                <span className="text-[11px] text-slate-400 text-right">{formatFullDate(insp.date)}<br />{insp.timestamp}</span>
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
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-[11px] text-slate-500 truncate">
                  Inspected by {insp.inspectorName}
                  {insp.overriddenBy && <span className="text-amber-300/90"> · overridden by {insp.overriddenBy}</span>}
                </p>
                <RecordOverrideControls kind="inspection" record={insp} />
              </div>
            </div>
          ))}
        </div>

        {/* The logbook holds its own width: the five checks share one column of
            chips (the same ones the phone cards use) and every cell wraps, so
            nothing is pushed off the right edge. */}
        <div className="hidden lg:block">
          <table className="w-full table-fixed text-left text-xs text-slate-300">
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[9%]" />
              <col className="w-[24%]" />
              <col className="w-[8%]" />
              <col />
              <col className="w-[14%]" />
              {isSuperAdmin && <col className="w-[9%]" />}
            </colgroup>
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-3">Date & Time</th>
                <th className="px-3 py-3">Room</th>
                <th className="px-3 py-3">Checks</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Remarks</th>
                <th className="px-3 py-3">Inspector</th>
                {isSuperAdmin && <th className="px-3 py-3 text-right">Override</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {inspections.map(insp => (
                <tr key={insp.id} className="hover:bg-slate-800/40 align-top">
                  <td className="px-3 py-3 text-slate-400">
                    {formatFullDate(insp.date)}
                    <span className="block font-mono text-[11px] text-slate-500">{insp.timestamp}</span>
                  </td>
                  <td className="px-3 py-3 font-bold text-white">Room {insp.roomNumber}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Beds', ok: insp.bedsOk },
                        { label: 'Lockers', ok: insp.lockersOk },
                        { label: 'Items', ok: insp.personalThingsOk },
                        { label: 'CR', ok: insp.crCleanlinessOk },
                        { label: 'Floor', ok: insp.overallFloorOk },
                      ].map(c => (
                        <span
                          key={c.label}
                          title={`${c.label}: ${c.ok ? 'Pass' : 'Fail'}`}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            c.ok ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                          }`}
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      insp.status === 'pass' ? 'bg-emerald-950 text-emerald-300' :
                      insp.status === 'warning' ? 'bg-amber-950 text-amber-300' :
                      'bg-rose-950 text-rose-300'
                    }`}>
                      {insp.score}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 truncate" title={insp.remarks || undefined}>
                    {insp.remarks || '-'}
                  </td>
                  <td className="px-3 py-3 text-slate-400 break-words">
                    {insp.inspectorName}
                    {insp.overriddenBy && (
                      <span className="block text-[10px] text-amber-300/90">overridden by {insp.overriddenBy}</span>
                    )}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-3 py-3">
                      <div className="flex justify-end">
                        <RecordOverrideControls kind="inspection" record={insp} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
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
                  onChange={e => openInspect(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} ({r.wing} - Captain: {r.captainName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Individual checklist: per resident */}
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px] mb-2">
                  Individual Rating — per resident (bed, locker, personal things)
                </span>
                {roomOccupants.length === 0 && (
                  <div className="bg-slate-950/60 border border-dashed border-slate-700 rounded-xl p-4 text-center text-[11px] text-slate-500">
                    No residents assigned to this room — only the room-level checks will be scored.
                  </div>
                )}
                {roomOccupants.map(o => {
                  const c = occupantState[o.id] ?? { bedsOk: true, lockersOk: true, personalThingsOk: true };
                  return (
                    <div key={o.id} className="mb-2 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-800/70">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300">
                          {o.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white truncate">{o.name}</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {INDIVIDUAL_ITEMS.map(item => {
                          const Icon = item.icon;
                          const value = c[item.key];
                          return (
                            <button
                              type="button"
                              key={item.key}
                              onClick={() => setOccupant(o.id, item.key, !value)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border min-h-touch transition-colors text-left ${
                                value
                                  ? 'border-emerald-700/50 bg-emerald-950/50 text-emerald-300'
                                  : 'border-slate-700 bg-slate-900/60 text-slate-300'
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-4 h-4 shrink-0 ${value ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span className="min-w-0">
                                  <span className="block text-[11px] font-semibold leading-tight">{item.label}</span>
                                  <span className="block text-[10px] text-slate-500 leading-tight">{item.sub}</span>
                                </span>
                              </span>
                              {value
                                ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Room-level checklist */}
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                  Room-Level Check — general to the whole room
                </span>

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
                  <span>Warning: Submitting a Fail score will automatically log a 1-demerit violation for each room occupant.</span>
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
        </Modal>
      )}
    </div>
  );
};
