import React from 'react';
import {
  GraduationCap,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { OccupantRecordsPanel } from './OccupantRecordsPanel';

const WING = {
  North: 'bg-sky-950 text-sky-300 border border-sky-700/50',
  South: 'bg-rose-950 text-rose-300 border border-rose-700/50',
  East: 'bg-amber-950 text-amber-300 border border-amber-700/50',
  West: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50',
} as const;

export const ParentView: React.FC = () => {
  const {
    currentUser,
    users,
    rooms,
  } = useDorm();

  const child = users.find(u => u.id === currentUser.relatedStudentId);
  const room = rooms.find(r => r.roomNumber === child?.roomNumber);

  if (!child) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
        No linked student record found. Please contact the dormitory administrator.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 font-bold text-lg">
              {child.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-white">{child.name}</p>
              <p className="text-xs text-slate-400">
                {child.email} · Room {child.roomNumber}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {room && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${WING[room.wing.split(' ')[0] as keyof typeof WING] || ''}`}>
                {room.wing}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              child.status === 'probation' ? 'bg-rose-950 text-rose-300 border border-rose-700/50' :
              child.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' :
              'bg-sky-950 text-sky-300 border border-sky-700/50'
            }`}>
              {child.status === 'probation' ? 'On Notice' : child.status === 'active' ? 'Good Standing' : 'Excused Leave'}
            </span>
          </div>
        </div>
      </div>

      <OccupantRecordsPanel studentId={child.id} />
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <GraduationCap className="w-4 h-4" />
        Parent read-only access — entries made by the dormitory staff appear here automatically.
      </p>
    </div>
  );
};