import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  Search,
  ChevronDown,
  DoorClosed,
  ShieldAlert,
  X,
  ArrowDownUp,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { OccupantRecordModal } from './OccupantRecordModal';
import { User } from '../types/dorm';
import { demeritLabel } from '../utils/checkViolations';

type Grouping = 'room' | 'name';
type Filter = 'all' | 'flagged' | 'notice';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Everyone' },
  { id: 'flagged', label: 'With demerits' },
  { id: 'notice', label: 'On notice' },
];

const WING_CLASSES: Record<string, string> = {
  North: 'bg-sky-950 text-sky-300 border-sky-800/60',
  South: 'bg-rose-950 text-rose-300 border-rose-800/60',
  East: 'bg-amber-950 text-amber-300 border-amber-800/60',
  West: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
};

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const demeritClasses = (demerits: number) =>
  demerits >= 8
    ? 'bg-rose-950 text-rose-300 border-rose-800/60'
    : demerits > 0
      ? 'bg-amber-950 text-amber-300 border-amber-800/60'
      : 'bg-slate-800 text-slate-400 border-slate-700';

const byRoomThenName = (a: User, b: User) =>
  String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }) ||
  a.name.localeCompare(b.name);

/**
 * The resident file cabinet: every occupant, filed under the room they sleep
 * in, and one tap from their whole record.
 *
 * Grouping by room is the point. A dean walks the dormitory room by room, so
 * that is how the roster reads here — a card per room carrying its own wing,
 * captain and demerit total, with its residents inside it. Names open a popup
 * rather than a side panel, so the record gets the whole screen on a phone and
 * the roster is still there underneath when it closes.
 */
export const OccupantRecordsView: React.FC = () => {
  const { users, rooms, violations, canEdit } = useDorm();
  const [query, setQuery] = useState('');
  const [grouping, setGrouping] = useState<Grouping>('room');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const demeritsById = useMemo(() => {
    const totals = new Map<string, number>();
    violations.forEach(v => {
      if (v.status === 'cleared_service') return;
      totals.set(v.studentId, (totals.get(v.studentId) ?? 0) + v.demerits);
    });
    return totals;
  }, [violations]);

  const demeritsFor = (id: string) => demeritsById.get(id) ?? 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter(u => u.role === 'occupant')
      .filter(u => {
        if (filter === 'flagged') return demeritsFor(u.id) > 0;
        if (filter === 'notice') return demeritsFor(u.id) >= 8;
        return true;
      })
      .filter(u =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.roomNumber || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.parentName || '').toLowerCase().includes(q)
      )
      .sort(byRoomThenName);
  }, [users, query, filter, demeritsById]);

  /** The flat order the popup's arrows walk, whichever way the page is grouped. */
  const walkOrder = useMemo(
    () => (grouping === 'room' ? visible : [...visible].sort((a, b) => a.name.localeCompare(b.name))),
    [visible, grouping]
  );

  const grouped = useMemo(() => {
    const byRoom = new Map<string, User[]>();
    visible.forEach(u => {
      const key = u.roomNumber || 'Unassigned';
      byRoom.set(key, [...(byRoom.get(key) ?? []), u]);
    });
    return [...byRoom.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [visible]);

  const openIndex = walkOrder.findIndex(u => u.id === openId);

  const step = (direction: -1 | 1) => {
    const next = walkOrder[openIndex + direction];
    if (next) setOpenId(next.id);
  };

  const onNotice = visible.filter(u => demeritsFor(u.id) >= 8).length;
  const withDemerits = visible.filter(u => demeritsFor(u.id) > 0).length;
  // A search should not leave a matching name hidden inside a room the dean
  // happened to collapse earlier.
  const searching = query.trim().length > 0;

  if (!canEdit) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400 text-center">
        Only administrators can view occupant records.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400 shrink-0" />
              Occupant Records
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tap a name to open their full record.
            </p>
          </div>
          <div className="hidden sm:flex shrink-0 gap-2 text-center">
            <Tally label="Residents" value={visible.length} />
            <Tally label="With demerits" value={withDemerits} tone={withDemerits ? 'text-amber-300' : undefined} />
            <Tally label="On notice" value={onNotice} tone={onNotice ? 'text-rose-400' : undefined} />
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, room, email, or parent…"
            aria-label="Search residents"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-touch min-h-touch flex items-center justify-center text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                filter === f.id
                  ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setGrouping(g => (g === 'room' ? 'name' : 'room'))}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            {grouping === 'room' ? 'By room' : 'A–Z'}
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white mt-4">No residents match</p>
          <p className="text-xs text-slate-500 mt-1">Try a different name, room, or filter.</p>
        </div>
      ) : grouping === 'name' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/70 overflow-hidden">
          {walkOrder.map(o => (
            <ResidentRow key={o.id} occupant={o} demerits={demeritsFor(o.id)} onOpen={() => setOpenId(o.id)} showRoom />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([roomNumber, residents]) => {
            const room = rooms.find(r => r.roomNumber === roomNumber);
            const wingKey = room?.wing.split(' ')[0] ?? '';
            const roomDemerits = residents.reduce((sum, r) => sum + demeritsFor(r.id), 0);
            const isOpen = searching || !collapsed.has(roomNumber);

            return (
              <section key={roomNumber} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() =>
                    setCollapsed(prev => {
                      const next = new Set(prev);
                      if (next.has(roomNumber)) next.delete(roomNumber);
                      else next.add(roomNumber);
                      return next;
                    })
                  }
                  aria-expanded={isOpen}
                  className="w-full min-h-touch flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-300">
                    <DoorClosed className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">
                      Room {roomNumber}
                      <span className="text-slate-500 font-normal"> · {residents.length} resident{residents.length === 1 ? '' : 's'}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {room && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${WING_CLASSES[wingKey] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {room.wing}
                        </span>
                      )}
                      {room?.captainName && (
                        <span className="text-[10px] text-slate-500 truncate">Captain: {room.captainName}</span>
                      )}
                    </div>
                  </div>
                  {roomDemerits > 0 && (
                    <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${demeritClasses(roomDemerits)}`}>
                      <ShieldAlert className="w-3 h-3" /> {roomDemerits}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/70">
                    {residents.map(o => (
                      <ResidentRow key={o.id} occupant={o} demerits={demeritsFor(o.id)} onOpen={() => setOpenId(o.id)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {openId && (
        <OccupantRecordModal
          studentId={openId}
          onClose={() => setOpenId(null)}
          onStep={step}
          hasPrev={openIndex > 0}
          hasNext={openIndex >= 0 && openIndex < walkOrder.length - 1}
          position={openIndex >= 0 ? `${openIndex + 1}/${walkOrder.length}` : undefined}
        />
      )}
    </div>
  );
};

const Tally: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 min-w-[74px]">
      <p className={`text-lg font-bold leading-none ${tone || 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-1">{label}</p>
    </div>
  );
};

interface ResidentRowProps {
  occupant: User;
  demerits: number;
  onOpen: () => void;
  /** The A–Z list has no room header above it, so each row carries its room. */
  showRoom?: boolean;
}

const ResidentRow: React.FC<ResidentRowProps> = ({ occupant, demerits, onOpen, showRoom = false }) => {
  return (
    <button
      onClick={onOpen}
      className="w-full min-h-touch flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800/60 active:bg-slate-800 transition-colors"
    >
      <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
        {initials(occupant.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white truncate">{occupant.name}</span>
        <span className="block text-[11px] text-slate-500 truncate">
          {showRoom ? `Room ${occupant.roomNumber} · ` : ''}
          {occupant.status === 'excused_leave'
            ? 'On excused leave'
            : occupant.email || 'No email on file'}
        </span>
      </span>
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${demeritClasses(demerits)}`}>
        {demeritLabel(demerits)}
      </span>
    </button>
  );
};
