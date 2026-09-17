import React from 'react';
import { UserX, Mail, LogOut, Shield } from 'lucide-react';
import { useDorm } from '../context/DormContext';

export const GuestView: React.FC = () => {
  const { currentUser, logout, users } = useDorm();
  const registeredEmails = users.filter(u => u.role !== 'guest').length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 mb-4">
          <UserX className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-white">Signed in as a Guest</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Your Google account <span className="font-mono text-amber-300">{currentUser.email}</span> is not linked to
          any dormitory record, so you can view this app but not any checks, inspections, or discipline data.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-400">
        <p className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <span>
            If you are staff, a resident, or a parent, ask the Dean to register your Google email. Students are
            registered with the gmail on their record; parents are auto-linked via the parent email saved on the
            student's file; staff are granted Admin access in{' '}
            <span className="text-amber-300 font-semibold">Staff & Access</span>.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <span>{registeredEmails} registered accounts are currently recognized on this dormitory.</span>
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={logout}
          className="min-h-touch bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/50 text-rose-300 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out and use another Google account
        </button>
      </div>
    </div>
  );
};