import React, { useState } from 'react';
import { Shield, Lock, CheckCircle2, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { useDorm } from '../context/DormContext';

interface LoginScreenProps {
  openGoogleModal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ openGoogleModal }) => {
  const { users, loginGoogleOAuthMock, loginWithRole } = useDorm();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      loginGoogleOAuthMock(customEmail.trim(), customName.trim() || customEmail.split('@')[0]);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 pb-safe selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-xl space-y-8">
        {/* Crest & Dorm Identity Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 shadow-xl shadow-amber-950/20">
            <Shield className="w-11 h-11" />
          </div>
          <div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider mb-2">
              Boys Dormitory Administration
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Cedar Hall</h1>
            <p className="text-sm text-slate-400 mt-1">
              Official Automated Compliance, Discipline & Safety System
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Sign In with Google OAuth</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your registered Google Account or enter your institutional Google credentials to enter Cedar Hall.
            </p>
          </div>

          {/* Direct Verified One-Click Profiles */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quick Verified Accounts
            </p>

            {/* Dean Jelmar Orapa */}
            <button
              id="login-as-dean-orapa"
              onClick={() => loginWithRole('superadmin', 'user-dean')}
              className="w-full min-h-touch text-left p-4 rounded-2xl bg-purple-950/30 hover:bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-purple-200 font-bold text-lg shadow-sm">
                  JO
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-purple-200">
                    Dean Jelmar Orapa
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">orapajelmar@gmail.com</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>

            {/* User-Encoded Additional Profiles (Admins or Residents) */}
            {users.filter(u => u.id !== 'user-dean' && u.email !== 'orapajelmar@gmail.com').map(user => {
              const initials = user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              const isAdmin = user.role === 'admin';

              return (
                <button
                  key={user.id}
                  id={`login-as-${user.id}`}
                  onClick={() => loginWithRole(user.role, user.id)}
                  className={`w-full min-h-touch text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                    isAdmin 
                      ? 'bg-blue-950/30 hover:bg-blue-950/60 border-blue-500/40 hover:border-blue-400' 
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isAdmin 
                        ? 'bg-blue-900/60 border border-blue-400/40 text-blue-200' 
                        : 'bg-slate-700 border border-slate-600 text-slate-200'
                    }`}>
                      {initials || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {user.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isAdmin 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {user.roomNumber ? `Room ${user.roomNumber} • ` : ''}{user.email || 'Registered User'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform ml-2 ${
                    isAdmin ? 'text-blue-400' : 'text-slate-400'
                  }`} />
                </button>
              );
            })}
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Or Enter Any Google Account</span>
            </div>
          </div>

          {/* Custom Google OAuth input */}
          <form onSubmit={handleCustomGoogleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Google Account Email
              </label>
              <input
                id="custom-google-email-input"
                type="email"
                required
                placeholder="your.email@gmail.com"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dean Assistant / Dorm Officer"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !customEmail.trim()}
              className="w-full min-h-touch bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSubmitting ? 'Authenticating...' : 'Sign in with Google OAuth'}</span>
            </button>
          </form>

          {/* Interactive Modal Option */}
          <div className="pt-2 text-center">
            <button
              onClick={openGoogleModal}
              className="min-h-touch px-2 text-xs text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Open Interactive Google Account Selector Modal
            </button>
          </div>
        </div>

        {/* Security & Dormitory Notice */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-slate-300">Protected Institutional Registry:</strong> Access to room inspections, curfew records, demerit clearance, and medical notes is restricted based on institutional role privileges configured by Dean Jelmar Orapa.
          </div>
        </div>
      </div>
    </div>
  );
};
