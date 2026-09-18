import React, { useEffect, useState } from 'react';
import { manilaToday, manilaTimeValue, formatFullDate, formatTime12h, nextWeekdayOnOrAfter } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';
import {
  Luggage,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BellRing,
  Save,
  Lock,
  Users,
  PlusCircle,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { GatePassRecord } from '../types/dorm';

const FIELD =
  'w-full min-h-touch bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40';

const PASS_TYPES: Record<GatePassRecord['passType'], string> = {
  weekend_home: 'Weekend Home Leave',
  church_event: 'Church Event',
  medical_visit: 'Medical Visit',
  family_emergency: 'Family Emergency',
  academic: 'Academic / School Task',
  personal_matters: 'Personal Matters / Errand',
};

/** Shown under the destination box so a short errand is easy to fill in. */
const DESTINATION_HINTS: Record<GatePassRecord['passType'], string> = {
  weekend_home: 'e.g. Home — Brgy. San Isidro',
  church_event: 'e.g. Central SDA Church',
  medical_visit: 'e.g. Provincial Hospital',
  family_emergency: 'e.g. Home — family matter',
  academic: 'e.g. School library, group work',
  personal_matters: 'e.g. Buy school supplies at the market',
};

// Home leave runs to the weekend: unless the dean says otherwise, a resident is
// due back the coming Sunday at 5:00 PM.
const RETURN_WEEKDAY = 0; // Sunday
const DEFAULT_RETURN_TIME = '17:00';
const defaultReturnDate = (departure: string) => nextWeekdayOnOrAfter(departure, RETURN_WEEKDAY);

const STATUS_META: Record<GatePassRecord['status'], { label: string; classes: string }> = {
  approved: { label: 'Approved', classes: 'bg-sky-950 text-sky-300 border border-sky-700/50' },
  departed: { label: 'Departed', classes: 'bg-blue-950 text-blue-300 border border-blue-700/50' },
  returned_on_time: { label: 'Returned On Time', classes: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' },
  overdue: { label: 'Overdue', classes: 'bg-rose-950 text-rose-300 border border-rose-700/50' },
};

export const GatePassView: React.FC = () => {
  const { gatePasses, users, rooms, saveGatePass, updateGatePassStatus, canEdit, currentUser } = useDorm();
  const occupants = users.filter(u => u.role === 'occupant');

  const roomNumbers = Array.from(new Set(occupants.map(o => o.roomNumber).filter(Boolean) as string[])).sort();
  const [selectedRoom, setSelectedRoom] = useState(roomNumbers[0] || '');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Issue form
  const [studentId, setStudentId] = useState(occupants[0]?.id || '');
  const [passType, setPassType] = useState<GatePassRecord['passType']>('weekend_home');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(() => manilaToday());
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => defaultReturnDate(manilaToday()));
  const [expectedReturnTime, setExpectedReturnTime] = useState(DEFAULT_RETURN_TIME);
  const [parentConsent, setParentConsent] = useState(true);
  const [parentPhone, setParentPhone] = useState('');
  const [remarks, setRemarks] = useState('');

  const roomOccupants = occupants.filter(o => o.roomNumber === selectedRoom);

  useEffect(() => {
    if (!selectedRoom && roomNumbers.length) setSelectedRoom(roomNumbers[0]);
  }, [roomNumbers, selectedRoom]);

  const flash = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  // Passes are always issued from a resident's own row, so the form opens with
  // that resident — and their parent's number — already filled in.
  const openIssueFor = (student: typeof occupants[number]) => {
    setStudentId(student.id);
    setPassType('weekend_home');
    setDestination('');
    setDepartureDate(manilaToday());
    setExpectedReturnDate(defaultReturnDate(manilaToday()));
    setExpectedReturnTime(DEFAULT_RETURN_TIME);
    setParentConsent(true);
    setParentPhone(student.parentPhone || '');
    setRemarks('');
    setShowIssueModal(true);
  };

  // Moving the departure past the return date pulls the return forward to the
  // Sunday after it, so a pass can never be due back before it starts.
  const changeDepartureDate = (value: string) => {
    setDepartureDate(value);
    if (value > expectedReturnDate) setExpectedReturnDate(defaultReturnDate(value));
  };

  const issuingStudent = occupants.find(o => o.id === studentId);

  const latestPassFor = (sid: string) =>
    gatePasses.filter(p => p.studentId === sid).sort((a, b) => b.departureDate.localeCompare(a.departureDate))[0];

  const submitPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const student = occupants.find(o => o.id === studentId);
    if (!student) return;
    saveGatePass({
      studentId: student.id,
      studentName: student.name,
      roomNumber: student.roomNumber || '—',
      passType,
      destination: destination || PASS_TYPES[passType],
      departureDate,
      expectedReturnDate,
      expectedReturnTime,
      parentConsentVerified: parentConsent,
      parentPhone: parentPhone || student.parentPhone || '—',
      approvedByDean: currentUser.name,
      status: 'approved',
      remarks: remarks || undefined,
    });
    setShowIssueModal(false);
    setRemarks('');
    setDestination('');
    flash(`Gate pass issued to ${student.name} (${PASS_TYPES[passType]}).`);
  };

  const today = useManilaToday();
  const activePasses = gatePasses.filter(p => p.status === 'approved' || p.status === 'departed');
  const nowTime = manilaTimeValue();
  // A pass due back today is only overdue once its return time has passed.
  const isPastDue = (p: GatePassRecord) =>
    p.expectedReturnDate < today ||
    (p.expectedReturnDate === today && !!p.expectedReturnTime && p.expectedReturnTime < nowTime);
  const overdueCount = activePasses.filter(p => p.status === 'departed' && isPastDue(p)).length;

  const returnLabel = (p: GatePassRecord) =>
    `${formatFullDate(p.expectedReturnDate)}${p.expectedReturnTime ? ` · ${formatTime12h(p.expectedReturnTime)}` : ''}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Gate Pass & Home Leave</h2>
            <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
              Campus Exit Record
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Room by room, issue a pass beside each resident's name — home leave, church, medical, academic, or a quick personal errand.
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

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Active Passes</p>
          <p className="text-2xl font-bold text-sky-400">{activePasses.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Recently Departed</p>
          <p className="text-2xl font-bold text-blue-400">{gatePasses.filter(p => p.status === 'departed').length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">Returned On Time</p>
          <p className="text-2xl font-bold text-emerald-400">{gatePasses.filter(p => p.status === 'returned_on_time').length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 flex items-center gap-1"><BellRing className="w-3 h-3" /> Overdue</p>
          <p className={`text-2xl font-bold ${overdueCount ? 'text-rose-400' : 'text-slate-500'}`}>{overdueCount}</p>
        </div>
      </div>

      {/* By-room passes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Luggage className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">Gate Passes by Room</h3>
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
            const pass = latestPassFor(student.id);
            return (
              <div key={student.id} className="p-3 sm:p-4 space-y-2.5">
                {/* Name on the left, its own Issue Pass button on the right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                    {pass ? (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[pass.status].classes}`}>
                          {STATUS_META[pass.status].label}
                        </span>
                        <span className="text-slate-400">{PASS_TYPES[pass.passType]}</span>
                      </div>
                    ) : (
                      <span className="mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500">
                        No pass on file
                      </span>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => openIssueFor(student)}
                      className="shrink-0 min-h-touch px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Issue Pass
                    </button>
                  )}
                </div>

                {pass && (
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-400 space-y-0.5">
                    <p><span className="text-slate-500 font-medium">Destination:</span> {pass.destination}</p>
                    <p>
                      <span className="text-slate-500 font-medium">Out:</span> {formatFullDate(pass.departureDate)}
                      <span className="mx-1.5 text-slate-600">→</span>
                      <span className="text-slate-500 font-medium">Back:</span> {returnLabel(pass)}
                    </p>
                    <p><span className="text-slate-500 font-medium">Parent:</span> {pass.parentConsentVerified ? `Consent ✓ (${pass.parentPhone})` : 'Not verified'}</p>
                    {pass.remarks && <p className="italic text-slate-500">"{pass.remarks}"</p>}
                  </div>
                )}

                {canEdit && pass && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => { updateGatePassStatus(pass.id, 'departed'); flash(`Marked ${student.name}'s pass as departed.`); }}
                      className="min-h-touch px-2.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Departed
                    </button>
                    <button
                      onClick={() => { updateGatePassStatus(pass.id, 'returned_on_time'); flash(`Logged ${student.name}'s return.`); }}
                      className="min-h-touch px-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Returned
                    </button>
                    <button
                      onClick={() => { updateGatePassStatus(pass.id, 'overdue'); flash(`${student.name} marked overdue.`); }}
                      className="min-h-touch px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pass registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            Gate Pass Registry
          </h3>
          <span className="text-xs text-slate-400">{gatePasses.length} passes</span>
        </div>
        {gatePasses.length === 0 && (
          <p className="p-6 text-center text-xs text-slate-500">No gate passes issued yet.</p>
        )}
        <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
          {gatePasses.map(p => (
            <div key={p.id} className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{p.studentName} <span className="text-slate-500 font-normal">· Room {p.roomNumber}</span></p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {PASS_TYPES[p.passType]} → {p.destination}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_META[p.status].classes}`}>
                  {STATUS_META[p.status].label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Out {formatFullDate(p.departureDate)} · Back {returnLabel(p)} · Approved by {p.approvedByDean}
              </p>
              {p.actualReturnDate && (
                <p className="text-[11px] text-emerald-400 mt-0.5">Actual return: {formatFullDate(p.actualReturnDate)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Issue modal */}
      {canEdit && showIssueModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">
                  Issue Gate Pass{issuingStudent ? ` — ${issuingStudent.name}` : ''}
                </h3>
                <p className="text-xs text-slate-400">
                  Room {issuingStudent?.roomNumber || '—'} · Dean-approved campus exit
                </p>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white min-w-touch min-h-touch flex items-center justify-center -mr-2 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitPass} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Pass Type</label>
                <select value={passType} onChange={e => setPassType(e.target.value as GatePassRecord['passType'])} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  {(Object.keys(PASS_TYPES) as GatePassRecord['passType'][]).map(t => (
                    <option key={t} value={t}>{PASS_TYPES[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Destination</label>
                <input type="text" required placeholder={DESTINATION_HINTS[passType]} value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Departure Date</label>
                  <input type="date" value={departureDate} onChange={e => changeDepartureDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Expected Return</label>
                  <input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Return Time</label>
                  <input type="time" value={expectedReturnTime} onChange={e => setExpectedReturnTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 -mt-1.5">
                Returns default to the coming Sunday, {formatTime12h(DEFAULT_RETURN_TIME)} — change either field for a shorter pass.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Same label-over-control shape and height as the fields around it */}
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Parent consent</label>
                  <button
                    type="button"
                    aria-pressed={parentConsent}
                    onClick={() => setParentConsent(v => !v)}
                    className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between gap-2 font-semibold transition-colors ${
                      parentConsent
                        ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{parentConsent ? 'Verified' : 'Not verified'}</span>
                    {parentConsent ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Parent contact</label>
                  <input type="text" placeholder="+63 917 555 0000" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks</label>
                <input type="text" placeholder="e.g. Must return before curfew" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-3 py-2 min-h-touch rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 min-h-touch rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 flex items-center gap-1.5">
                  <Save className="w-4 h-4" />
                  Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};