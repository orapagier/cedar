import React, { useEffect, useState } from 'react';
import {
  Moon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Volume2,
  VolumeX,
  ShieldAlert,
  DoorOpen,
  Save,
  Check,
  Lock,
  CalendarDays,
  ChevronDown,
  Lightbulb,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { RecordOverrideControls } from './RecordOverrideControls';
import { Segmented } from './ui/Segmented';
import { manilaToday, formatFullDate, formatTime12h } from '../utils/date';

type CurfewStatus = 'in_dorm' | 'late' | 'missing' | 'official_pass';

const CURFEW_STATUS_META: Record<
  CurfewStatus,
  { label: string; short: string; icon: React.ComponentType<{ className?: string }>; active: string; chip: string }
> = {
  in_dorm: { label: 'In Dorm', short: 'In', icon: CheckCircle2, active: 'bg-emerald-600 text-white', chip: 'bg-emerald-950 text-emerald-300' },
  late: { label: 'Late Arrival', short: 'Late', icon: Clock, active: 'bg-amber-600 text-white', chip: 'bg-amber-950 text-amber-300' },
  missing: { label: 'Missing / AWOL', short: 'Missing', icon: XCircle, active: 'bg-rose-600 text-white', chip: 'bg-rose-950 text-rose-300' },
  official_pass: { label: 'Official Pass', short: 'Pass', icon: ShieldAlert, active: 'bg-blue-600 text-white', chip: 'bg-blue-950 text-blue-300' },
};

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40';

export const CurfewLightsOutView: React.FC = () => {
  const {
    curfewRecords,
    lightsOutLogs,
    rooms,
    users,
    saveCurfewRecord,
    saveLightsOutLog,
    canEdit,
    currentUser,
    settings,
  } = useDorm();

  const occupants = users.filter(u => u.role === 'occupant');
  const occupiedRooms = rooms.filter(r => occupants.some(o => o.roomNumber === r.roomNumber));
  const curfewRoomOptions = occupiedRooms.length ? occupiedRooms : rooms;

  const [activeSection, setActiveSection] = useState<'curfew' | 'lights_out'>('curfew');

  // Curfew
  const [selectedRoom, setSelectedRoom] = useState(curfewRoomOptions[0]?.roomNumber || '');
  const [checkInTime, setCheckInTime] = useState(settings.curfewTime || '20:50');
  const [curfewRemarks, setCurfewRemarks] = useState('');
  const [roomStatuses, setRoomStatuses] = useState<Record<string, CurfewStatus>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showLedger, setShowLedger] = useState(false);

  // Lights out
  const [lightsOutRoom, setLightsOutRoom] = useState(rooms[0]?.roomNumber || '');
  const [lightsOff, setLightsOff] = useState(true);
  const [noiseQuiet, setNoiseQuiet] = useState(true);
  const [gadgetsCompliant, setGadgetsCompliant] = useState(true);
  const [lightsOutRemarks, setLightsOutRemarks] = useState('');
  const [showLightsOutHistory, setShowLightsOutHistory] = useState(false);

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);
  const selectedRoomMeta = rooms.find(r => r.roomNumber === selectedRoom);

  useEffect(() => {
    if ((!selectedRoom || !curfewRoomOptions.some(r => r.roomNumber === selectedRoom)) && curfewRoomOptions.length) {
      setSelectedRoom(curfewRoomOptions[0].roomNumber);
    }
  }, [curfewRoomOptions, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const statusFor = (id: string): CurfewStatus => roomStatuses[id] ?? 'in_dorm';

  const setStudentStatus = (id: string, status: CurfewStatus) => {
    setRoomStatuses(prev => ({ ...prev, [id]: status }));
  };

  const markRoomInDorm = () => {
    setRoomStatuses(prev => {
      const next = { ...prev };
      roomOccupants.forEach(o => {
        next[o.id] = 'in_dorm';
      });
      return next;
    });
  };

  const buildRecord = (student: (typeof occupants)[number], status: CurfewStatus) => ({
    date: manilaToday(),
    studentId: student.id,
    studentName: student.name,
    roomNumber: student.roomNumber || '—',
    curfewTime: settings.curfewTime || '21:00',
    actualCheckInTime: status === 'missing' ? undefined : checkInTime,
    status,
    remarks: curfewRemarks || undefined,
    loggedBy: currentUser.name,
  });

  const handleRoomSubmit = () => {
    if (!canEdit || !roomOccupants.length) return;
    roomOccupants.forEach(student => {
      saveCurfewRecord(buildRecord(student, statusFor(student.id)));
    });
    setCurfewRemarks('');
    flash(`Checked in ${roomOccupants.length} residents in Room ${selectedRoom}.`);
  };

  const handleLightsOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const isCompliant = lightsOff && noiseQuiet && gadgetsCompliant;

    saveLightsOutLog({
      date: manilaToday(),
      roomNumber: lightsOutRoom,
      checkTime: settings.lightsOutTime || '22:10',
      allLightsOff: lightsOff,
      noiseCompliant: noiseQuiet,
      noUnauthorizedGadgets: gadgetsCompliant,
      status: isCompliant ? 'compliant' : 'violation',
      violatorRemarks: lightsOutRemarks || undefined,
      inspectedBy: currentUser.name,
    });

    setLightsOutRemarks('');
    flash(`Lights-out round for Room ${lightsOutRoom} logged as ${isCompliant ? 'compliant' : 'a violation'}.`);
  };

  const complianceItems = [
    { key: 'lights', label: 'Main Lights Out', desc: 'All overhead & desk lights extinguished', value: lightsOff, set: setLightsOff, icon: Lightbulb },
    { key: 'noise', label: 'Silence Observed', desc: 'No loud talking, music, or hallway loitering', value: noiseQuiet, set: setNoiseQuiet, icon: VolumeX },
    { key: 'gadgets', label: 'No Secret Devices', desc: 'No hidden phones under blankets', value: gadgetsCompliant, set: setGadgetsCompliant, icon: Volume2 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Curfew & Mandatory Lights-Out</h2>
              <span className="text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                Night Routine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              The {formatTime12h(settings.curfewTime || '21:00')} curfew check-in and{' '}
              {formatTime12h(settings.lightsOutTime || '22:00')} lights-out silence and gadget restriction.
            </p>
          </div>

          {!canEdit && (
            <div className="bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 self-start">
              <Lock className="w-3.5 h-3.5" />
              <span>View-only access</span>
            </div>
          )}
        </div>

        <Segmented<'curfew' | 'lights_out'>
          ariaLabel="Night routine section"
          value={activeSection}
          onChange={setActiveSection}
          options={[
            {
              value: 'curfew',
              label: `Curfew · ${formatTime12h(settings.curfewTime || '21:00')}`,
              icon: Clock,
              activeClass: 'bg-purple-600 text-white shadow-sm',
            },
            {
              value: 'lights_out',
              label: `Lights-Out · ${formatTime12h(settings.lightsOutTime || '22:00')}`,
              icon: Moon,
              activeClass: 'bg-purple-600 text-white shadow-sm',
            },
          ]}
        />
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-600 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* CURFEW */}
      {activeSection === 'curfew' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Room Curfew Roll Call</h3>
                </div>
                <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className={`${FIELD} sm:max-w-[220px]`}>
                  {curfewRoomOptions.length === 0 ? (
                    <option value="">No rooms on file</option>
                  ) : (
                    curfewRoomOptions.map(r => (
                      <option key={r.id} value={r.roomNumber}>
                        Room {r.roomNumber} · {r.wing}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="p-4 border-b border-slate-800/70 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Check-in time
                    </label>
                    <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className={FIELD} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Room notes / reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Back from evening lab"
                      value={curfewRemarks}
                      onChange={e => setCurfewRemarks(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-white">Room {selectedRoom || '—'}</span>
                    {selectedRoomMeta ? ` · ${selectedRoomMeta.wing}` : ''} · {roomOccupants.length} residents
                  </p>
                  {canEdit && roomOccupants.length > 0 && (
                    <button
                      onClick={markRoomInDorm}
                      className="min-h-touch px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      All in dorm
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-800/70">
                {roomOccupants.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-500">No residents assigned to this room.</p>
                )}
                {roomOccupants.map(student => {
                  const status = statusFor(student.id);
                  return (
                    <div key={student.id} className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                      </div>

                      {canEdit ? (
                        <div className="flex gap-1.5">
                          {(Object.keys(CURFEW_STATUS_META) as CurfewStatus[]).map(s => {
                            const meta = CURFEW_STATUS_META[s];
                            const Icon = meta.icon;
                            const selected = status === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                title={meta.label}
                                aria-label={`${student.name}: ${meta.label}`}
                                aria-pressed={selected}
                                onClick={() => setStudentStatus(student.id, s)}
                                className={`min-w-touch min-h-touch flex-1 sm:flex-none rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                                  selected ? meta.active : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${CURFEW_STATUS_META[status].chip}`}>
                          {CURFEW_STATUS_META[status].label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {canEdit && roomOccupants.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
                  <button
                    onClick={handleRoomSubmit}
                    className="w-full min-h-touch bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Room {selectedRoom} Curfew</span>
                  </button>
                </div>
              )}
            </div>

          {/* Curfew Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button onClick={() => setShowLedger(v => !v)} className="w-full min-h-touch p-4 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Curfew Observance Registry</h3>
              <span className="flex items-center gap-2 text-xs text-slate-400">
                {curfewRecords.length} records
                <ChevronDown className={`w-4 h-4 transition-transform ${showLedger ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {showLedger && (
              <div className="border-t border-slate-800 divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
                {curfewRecords.length === 0 && <p className="p-6 text-center text-xs text-slate-500">No curfew records yet.</p>}
                {curfewRecords.map(cr => {
                  const meta = CURFEW_STATUS_META[cr.status as CurfewStatus] ?? CURFEW_STATUS_META.in_dorm;
                  const late = cr.actualCheckInTime && cr.actualCheckInTime > (settings.curfewTime || '21:00');
                  return (
                    <div key={cr.id} className="p-3 sm:p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm truncate">{cr.studentName}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.chip}`}>{meta.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Room {cr.roomNumber} · {formatFullDate(cr.date)} · limit {formatTime12h(cr.curfewTime)} · by {cr.loggedBy}
                          {cr.overriddenBy && (
                            <span className="text-amber-300/90"> · overridden by {cr.overriddenBy}</span>
                          )}
                        </p>
                        {cr.remarks && <p className="text-[11px] text-slate-400 mt-0.5">{cr.remarks}</p>}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`font-mono text-xs ${late ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                          {formatTime12h(cr.actualCheckInTime)}
                        </span>
                        <RecordOverrideControls kind="curfew" record={cr} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* LIGHTS OUT */}
      {activeSection === 'lights_out' && (
        <>
          {canEdit && (
            <form onSubmit={handleLightsOutSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">{formatTime12h(settings.lightsOutTime || '22:10')} Lights-Out Inspection</h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Room checked</label>
                  <select value={lightsOutRoom} onChange={e => setLightsOutRoom(e.target.value)} className={FIELD}>
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>
                        Room {r.roomNumber} · {r.wing}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {complianceItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => item.set(!item.value)}
                        className={`w-full min-h-touch rounded-xl border p-3 flex items-center gap-3 text-left transition-colors ${
                          item.value ? 'bg-emerald-950/40 border-emerald-700/50' : 'bg-rose-950/30 border-rose-700/50'
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.value ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/50 text-rose-300'}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">{item.label}</span>
                          <span className="block text-[11px] text-slate-400">{item.desc}</span>
                        </span>
                        <span className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg ${item.value ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                          {item.value ? 'OK' : 'FAIL'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Violation notes (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. Flashlight on, whispering, unauthorized smartphone..."
                    value={lightsOutRemarks}
                    onChange={e => setLightsOutRemarks(e.target.value)}
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="p-3 sm:p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 backdrop-blur">
                <button
                  type="submit"
                  className="w-full min-h-touch bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log Lights-Out Round</span>
                </button>
              </div>
            </form>
          )}

          {/* Lights Out History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button onClick={() => setShowLightsOutHistory(v => !v)} className="w-full min-h-touch p-4 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Lights-Out Rounds History</h3>
              <span className="flex items-center gap-2 text-xs text-slate-400">
                {lightsOutLogs.length} inspections
                <ChevronDown className={`w-4 h-4 transition-transform ${showLightsOutHistory ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {showLightsOutHistory && (
              <div className="border-t border-slate-800 divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
                {lightsOutLogs.length === 0 && <p className="p-6 text-center text-xs text-slate-500">No lights-out rounds logged yet.</p>}
                {lightsOutLogs.map(log => (
                  <div key={log.id} className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">Room {log.roomNumber}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'compliant' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 text-right">{formatFullDate(log.date)} · {formatTime12h(log.checkTime)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {[
                        { label: 'Lights', ok: log.allLightsOff },
                        { label: 'Silence', ok: log.noiseCompliant },
                        { label: 'No devices', ok: log.noUnauthorizedGadgets },
                      ].map(chip => (
                        <span
                          key={chip.label}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                            chip.ok ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'
                          }`}
                        >
                          {chip.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {chip.label}
                        </span>
                      ))}
                    </div>
                    {log.violatorRemarks && <p className="text-[11px] text-slate-400 mt-1.5">{log.violatorRemarks}</p>}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[11px] text-slate-500 truncate">
                        Logged by {log.inspectedBy}
                        {log.overriddenBy && <span className="text-amber-300/90"> · overridden by {log.overriddenBy}</span>}
                      </p>
                      <RecordOverrideControls kind="lightsOut" record={log} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
