import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  Search,
  ChevronRight,
  Users,
  ShieldAlert,
  BadgeCheck,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { OccupantRecordsPanel } from './OccupantRecordsPanel';

export const OccupantRecordsView: React.FC = () => {
  const { users, rooms, violations, canEdit } = useDorm();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const occupants = users.filter(u => u.role === 'occupant' && u.status !== 'excused_leave');

  const demeritsFor = (id: string) =>
    violations
      .filter(v => v.studentId === id && v.status !== 'cleared_service')
      .reduce((s, v) => s + v.demeritPoints, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? occupants.filter(o =>
          o.name.toLowerCase().includes(q) ||
          o.roomNumber?.toLowerCase().includes(q) ||
          (o.email || '').toLowerCase().includes(q)
        )
      : occupants;
    return [...list].sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }));
  }, [occupants, query]);

  const selected = users.find(u => u.id === selectedId && u.role === 'occupant');

  if (!canEdit) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400 text-center">
        Only administrators can view occupant records.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">Occupant Records</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Select a resident to view their complete records — worship, study, curfew, uniform, chores, phone vault, gate passes, medical, and standing.
        </p>
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, room, or email…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" /> Residents
            </h3>
            <span className="text-[11px] text-slate-400">{filtered.length} shown</span>
          </div>
          <div className="divide-y divide-slate-800/70 max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-500">No residents match your search.</p>
            )}
            {filtered.map(o => {
              const d = demeritsFor(o.id);
              const room = rooms.find(r => r.roomNumber === o.roomNumber);
              const isSelected = selectedId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={`w-full min-h-touch flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 border ${
                    isSelected ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {o.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{o.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Room {o.roomNumber}{room ? ` · ${room.wing}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d >= 8 ? 'bg-rose-950 text-rose-300' : d > 0 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {d} pts
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-500 mt-1 ml-auto ${isSelected ? 'text-amber-300' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 font-bold text-lg">
                      {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">{selected.name}</p>
                      <p className="text-xs text-slate-400">
                        {selected.email || 'no email on file'} · Room {selected.roomNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      demeritsFor(selected.id) >= 8 ? 'bg-rose-950 text-rose-300 border border-rose-700/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    }`}>
                      {demeritsFor(selected.id) >= 8 ? 'On Notice' : 'Good Standing'}
                    </span>
                    {selected.parentEmail && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-950 text-sky-300 border border-sky-700/50 flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> Parent Linked
                      </span>
                    )}
                    {selected.demeritPoints > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-700/50 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {selected.demeritPoints} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <OccupantRecordsPanel studentId={selected.id} limit={10} />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <ClipboardList className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white mt-4">Select a resident</p>
              <p className="text-xs text-slate-500 mt-1">Choose a name from the list to view their full records.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};