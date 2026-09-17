import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Shirt,
  Scissors,
  IdCard,
  Footprints,
  Save,
  Lock,
  Users,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40';

export const SchoolDepartureUniformView: React.FC = () => {
  const { uniformLogs, users, rooms, saveUniformLog, canEdit, currentUser, settings } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [departureTime, setDepartureTime] = useState('07:20');
  const [remarks, setRemarks] = useState('');
  const [compliance, setCompliance] = useState<Record<string, { uniform: boolean; hair: boolean; idBadge: boolean; shoes: boolean }>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const start = settings.departureStart || '07:00';
  const end = settings.departureEnd || '07:35';
  const isTimeOnSchedule = departureTime >= start && departureTime <= end;

  const setFlag = (id: string, key: keyof (typeof compliance)[string], value: boolean) => {
    setCompliance(prev => ({
      ...prev,
      [id]: { uniform: true, hair: true, idBadge: true, shoes: true, ...prev[id], [key]: value },
    }));
  };

  const flagsFor = (id: string) => ({
    uniform: true,
    hair: true,
    idBadge: true,
    shoes: true,
    ...compliance[id],
  });

  const submitRoom = () => {
    if (!canEdit || !roomOccupants.length) return;
    roomOccupants.forEach(student => {
      const flags = flagsFor(student.id);
      const fullyCompliant = flags.uniform && flags.hair && flags.idBadge && flags.shoes && isTimeOnSchedule;
      saveUniformLog({
        date: new Date().toISOString().split('T')[0],
        studentId: student.id,
        studentName: student.name,
        roomNumber: student.roomNumber || '—',
        departureTime,
        uniformCompliant: flags.uniform,
        hairGroomingCompliant: flags.hair,
        idBadgeCompliant: flags.idBadge,
        shoesCompliant: flags.shoes,
        isDepartureOnSchedule: isTimeOnSchedule,
        status: fullyCompliant ? 'cleared' : 'flagged',
        remarks: remarks || (!isTimeOnSchedule ? `Departed outside standard ${start}-${end} window (${departureTime})` : undefined),
        inspectedBy: currentUser.name,
      });
    });
    setRemarks('');
    flash(`Saved gate clearance for ${roomOccupants.length} residents in Room ${selectedRoom}.`);
  };

  const checklist = [
    { key: 'uniform' as const, label: 'Uniform', desc: 'Ironed & tucked in', icon: Shirt },
    { key: 'hair' as const, label: 'Haircut', desc: 'Above collar', icon: Scissors },
    { key: 'idBadge' as const, label: 'ID Badge', desc: 'Worn & visible', icon: IdCard },
    { key: 'shoes' as const, label: 'Shoes', desc: 'Black leather', icon: Footprints },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Departure & Uniform Check</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              Morning Gate Check
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            School exit window ({start} - {end}) and daily uniform, ID badge, haircut, and shoe compliance.
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

      {/* By-room gate check */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Departure Roll Call</h3>
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
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Departure time</span>
            </label>
            <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} disabled={!canEdit} className={`${FIELD} sm:max-w-[200px] disabled:opacity-40`} />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Gate remarks</label>
            <input
              type="text"
              placeholder="e.g. Untucked shirt, long hair"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              disabled={!canEdit}
              className={`${FIELD} disabled:opacity-40`}
            />
          </div>
        </div>

        {!isTimeOnSchedule && (
          <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Warning: Outside designated {start}-{end} school departure window.
          </div>
        )}

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
            const flags = flagsFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                </div>

                {canEdit ? (
                  <div className="flex flex-wrap gap-1.5">
                    {checklist.map(item => {
                      const Icon = item.icon;
                      const ok = flags[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          title={`${item.label} — ${item.desc}`}
                          aria-pressed={ok}
                          onClick={() => setFlag(student.id, item.key, !ok)}
                          className={`min-h-touch rounded-xl px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border transition-all active:scale-95 ${
                            ok
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.label}
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {checklist.map(item => (
                      <span key={item.key} className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        flags[item.key] ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                      }`}>
                        {flags[item.key] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canEdit && roomOccupants.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
            <button
              onClick={submitRoom}
              className="w-full min-h-touch bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>Save Room {selectedRoom} Departure</span>
            </button>
          </div>
        )}
      </div>

      {/* Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Gate Departure Register
          </h3>
          <span className="text-xs text-slate-400">{uniformLogs.length} logged departures</span>
        </div>
        {uniformLogs.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No departure logs recorded yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {uniformLogs.map(log => (
            <div key={log.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{log.studentName}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.status === 'cleared' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
                <span className={`shrink-0 font-mono font-bold text-xs ${log.isDepartureOnSchedule ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {log.departureTime}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Room {log.roomNumber} · {log.date} · by {log.inspectedBy}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: 'Uniform', ok: log.uniformCompliant },
                  { label: 'Haircut', ok: log.hairGroomingCompliant },
                  { label: 'ID Badge', ok: log.idBadgeCompliant },
                  { label: 'Shoes', ok: log.shoesCompliant },
                ].map(c => (
                  <span key={c.label} className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                    c.ok ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                  }`}>
                    {c.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {c.label}
                  </span>
                ))}
              </div>
              {log.remarks && <p className="text-[11px] text-slate-400 mt-1.5">{log.remarks}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};