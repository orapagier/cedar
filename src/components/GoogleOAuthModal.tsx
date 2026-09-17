import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, User, KeyRound } from 'lucide-react';
import { useDorm } from '../context/DormContext';

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({ isOpen, onClose }) => {
  const { loginGoogleOAuthMock, currentUser, users } = useDorm();
  const [selectedEmail, setSelectedEmail] = useState('orapajelmar@gmail.com');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleSignIn = (email: string, name: string) => {
    loginGoogleOAuthMock(email, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Google Identity Services</h3>
              <p className="text-xs text-slate-400">Authenticate for Dormitory Access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300">
            Select an authorized account to sign into the Cedar Hall Dormitory portal:
          </p>

          <div className="space-y-2.5">
            {/* Dean Jelmar Orapa */}
            <div
              onClick={() => handleSignIn('orapajelmar@gmail.com', 'Dean Jelmar Orapa')}
              className="h-16 p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40 cursor-pointer flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-500/50 flex-shrink-0">
                  JO
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    Dean Jelmar Orapa
                  </div>
                  <div className="text-xs text-slate-400 truncate">orapajelmar@gmail.com</div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 ml-2" />
            </div>

            {/* User-Encoded Additional Accounts */}
            {users.filter(u => u.id !== 'user-dean' && u.email !== 'orapajelmar@gmail.com').map(user => {
              const initials = user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const isAdmin = user.role === 'admin';

              return (
                <div
                  key={user.id}
                  onClick={() => handleSignIn(user.email || `${user.id}@dorm.edu`, user.name)}
                  className={`h-16 p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    isAdmin 
                      ? 'border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40' 
                      : 'border-slate-700 bg-slate-800/20 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border flex-shrink-0 ${
                      isAdmin 
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                        : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                    }`}>
                      {initials || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white flex items-center space-x-1.5 truncate">
                        <span className="truncate">{user.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 ${
                          isAdmin ? 'bg-blue-500/30 text-blue-300' : 'bg-emerald-500/30 text-emerald-300'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{user.email || `Room ${user.roomNumber}`}</div>
                    </div>
                  </div>
                  {isAdmin ? (
                    <KeyRound className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2" />
                  ) : (
                    <User className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Google Email Form */}
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-2">Or enter another Google email address:</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Full Name"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="email"
                placeholder="user@gmail.com"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                disabled={!customEmail}
                onClick={() => handleSignIn(customEmail, customName || 'Dorm User')}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold py-2 rounded-lg text-xs transition-colors"
              >
                Sign In with this Google Account
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 256-bit OAuth Token Handshake</span>
          </div>
          <button onClick={onClose} className="hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};
