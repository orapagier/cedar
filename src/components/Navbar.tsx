import React, { useState } from 'react';
import { 
  Shield, 
  UserCheck, 
  LogIn, 
  LogOut,
  RefreshCw, 
  Lock, 
  Unlock, 
  Users, 
  Bell, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ClipboardList,
  HeartPulse,
  FileCheck,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { UserRole } from '../types/dorm';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openGoogleModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openGoogleModal }) => {
  const { 
    currentUser, 
    loginWithRole, 
    resetAllData, 
    isSuperAdmin, 
    canEdit, 
    isOccupant, 
    violations,
    isAuthenticated,
    logout,
    users
  } = useDorm();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pendingViolations = violations.filter(v => v.status === 'pending_settlement').length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      {/* Top Banner with Clock & Fast Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Crest */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Cedar Hall</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Boys Dormitory
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Compliance, Discipline & Safety System</p>
            </div>
          </div>

          {/* Quick RBAC Role Selector & Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Switcher Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="role-switch-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] text-amber-300 font-bold border border-slate-600">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-slate-100 font-medium text-xs leading-none">{currentUser.name}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active User Profile</p>
                      <p className="text-[11px] text-slate-300 font-medium truncate">{currentUser.name}</p>
                    </div>

                    <div className="p-1 space-y-1">
                      {/* Dean Jelmar Orapa */}
                      <button
                        onClick={() => loginWithRole('superadmin', 'user-dean')}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-800 rounded-lg flex items-center space-x-2.5 ${
                          currentUser.name.includes('Jelmar Orapa') ? 'bg-purple-950/40 text-purple-300' : 'text-slate-300'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0"></div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">Dean Jelmar Orapa</div>
                        </div>
                      </button>

                      {/* User-Encoded Additional Profiles */}
                      {users.filter(u => u.id !== 'user-dean' && u.email !== 'orapajelmar@gmail.com').map(user => {
                        const isAdmin = user.role === 'admin';
                        const isSelected = currentUser.id === user.id;
                        return (
                          <button
                            key={user.id}
                            onClick={() => loginWithRole(user.role, user.id)}
                            className={`w-full px-3 py-2 text-left hover:bg-slate-800 rounded-lg flex items-center space-x-2.5 ${
                              isSelected 
                                ? (isAdmin ? 'bg-blue-950/40 text-blue-300' : 'bg-emerald-950/40 text-emerald-300')
                                : 'text-slate-300'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAdmin ? 'bg-blue-400' : 'bg-emerald-400'}`}></div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{user.name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-800 mt-1 pt-1 px-2 space-y-1">
                      <button
                        onClick={openGoogleModal}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-amber-300 flex items-center space-x-2 font-medium"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Google Account Switcher</span>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/50 text-rose-300 flex items-center space-x-2 font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Log Out)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openGoogleModal}
                className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Log In</span>
              </button>
            )}

            {/* Google OAuth Login / Logout Controls */}
            {isAuthenticated ? (
              <button
                id="header-logout-button"
                onClick={logout}
                className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                title="Log out of Cedar Hall"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            ) : (
              <button
                id="google-oauth-login-trigger"
                onClick={openGoogleModal}
                className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-all"
                title="Google Sign-In Authentication"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {[
            { id: 'overview', label: 'Dashboard & Feed', icon: Sparkles },
            { id: 'inspections', label: '1. Room Cleanliness & Daily Checks', icon: Shield },
            { id: 'worship', label: '2. Worship & Bibles & Church', icon: Clock },
            { id: 'curfew', label: '3. Curfew & Lights Out', icon: Lock },
            { id: 'uniform', label: '4. School Departure & Uniform', icon: UserCheck },
            { id: 'study', label: '5. Study Hours & Library', icon: Clock },
            { id: 'chores', label: '6. Weekly Chores Roster', icon: Users },
            { id: 'cellphones', label: '7. Cellphone Vault Custody', icon: Lock },
            { id: 'medical', label: '8. Sick Bay & Medical Slips', icon: HeartPulse },
            { id: 'gatepass', label: '9. Weekend Gate Passes', icon: FileCheck },
            { id: 'clearance', label: '10. Demerit Clearance & Service', icon: ShieldCheck },
            { id: 'vault', label: '11. Confiscated Contraband & Hazards', icon: Flame },
            { id: 'health', label: '12. Student Medical & Allergy Index', icon: ClipboardList },
            { id: 'violations', label: `Violations (${pendingViolations})`, icon: Bell },
            { id: 'occupants', label: 'Residents Roster & Rooms', icon: Users },
            { id: 'rbac', label: 'Admin Staff & RBAC', icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
