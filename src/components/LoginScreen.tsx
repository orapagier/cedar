import React, { useEffect, useRef, useState } from 'react';
import { TreePine, Lock } from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { useGoogleIdentity, GoogleSession } from '../hooks/useGoogleIdentity';

const GoogleLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle } = useDorm();
  const { clientId, ready, scriptError, renderButton } = useGoogleIdentity();
  const gisContainerRef = useRef<HTMLDivElement>(null);

  const [previewEmail, setPreviewEmail] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const resolveSession = (session: GoogleSession) => {
    loginWithGoogle({ email: session.email, name: session.name, avatar: session.avatar });
  };

  useEffect(() => {
    if (clientId && ready && gisContainerRef.current) {
      renderButton(gisContainerRef.current, resolveSession);
    }
    // renderButton reads current props via the closure; run once per ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, ready]);

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewEmail.trim()) return;
    resolveSession({ email: previewEmail.trim(), name: previewName.trim() || previewEmail.split('@')[0] });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 pb-safe selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-xl space-y-8">
        {/* Crest & Dorm Identity Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-950/20">
            <TreePine className="w-11 h-11" />
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
            <h2 className="text-lg font-bold text-white">Sign in to Cedar Hall</h2>
            <p className="text-xs text-slate-400 mt-1">
              Use the Google account linked to your dormitory record — Dean, staff, resident, or parent.
              Unregistered Google accounts sign in as a Guest with no record access.
            </p>
          </div>

          {clientId ? (
            ready ? (
              <div className="flex justify-center py-1">
                <div ref={gisContainerRef} className="min-h-[44px]" />
              </div>
            ) : scriptError ? (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-xl px-3 py-2">
                Google Sign-In failed to load. Please refresh or check your VITE_GOOGLE_CLIENT_ID.
              </p>
            ) : (
              <div className="flex justify-center py-2">
                <div className="w-80 h-11 rounded-full bg-slate-800 border border-slate-700 animate-pulse" />
              </div>
            )
          ) : previewMode ? (
            <form onSubmit={handlePreviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={previewEmail}
                  onChange={e => setPreviewEmail(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={previewName}
                  onChange={e => setPreviewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-touch bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all text-sm"
              >
                <GoogleLogo />
                <span>Continue with Google (preview)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
              >
                Back
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setPreviewMode(true)}
                className="w-full min-h-touch bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2.5 shadow-md transition-all text-sm"
              >
                <GoogleLogo />
                <span>Sign in with Google</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Dev preview mode — connect your Google OAuth Client ID
                (<code className="text-amber-400/90">VITE_GOOGLE_CLIENT_ID</code>) to enable the real
                Google sign-in button. Role detection is identical either way.
              </p>
            </div>
          )}

          <div className="pt-1 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-semibold">Dean:</span> orapajelmar@gmail.com (auto-detected)
              {' · '}
              <span className="text-slate-400 font-semibold">Everyone else:</span> sign in with the gmail listed on
              your residency, staff, or parent record.
            </p>
          </div>
        </div>

        {/* Security & Dormitory Notice */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            Record access follows your account role only. Guests can view the app shell but never any dormitory
            inspection, discipline, or attendance data.
          </div>
        </div>
      </div>
    </div>
  );
};