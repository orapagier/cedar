import React, { useEffect, useState } from 'react';
import {
  Shield,
  UserCheck,
  LogIn,
  LogOut,
  Users,
  Bell,
  Clock,
  Sparkles,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  FileCheck,
  ShieldCheck,
  Flame,
  Menu,
  X,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { UserRole } from '../types/dorm';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openGoogleModal: () => void;
}

export interface NavItem {
  id: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'main' | 'ops' | 'records' | 'people';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard & Feed', short: 'Dashboard', icon: Sparkles, group: 'main' },
  { id: 'inspections', label: '1. Room Cleanliness & Daily Checks', short: 'Room Checks', icon: Shield, group: 'ops' },
  { id: 'worship', label: '2. Worship & Bibles & Church', short: 'Worship', icon: Clock, group: 'ops' },
  { id: 'curfew', label: '3. Curfew & Lights Out', short: 'Curfew', icon: Clock, group: 'ops' },
  { id: 'uniform', label: '4. School Departure & Uniform', short: 'Departure', icon: UserCheck, group: 'ops' },
  { id: 'study', label: '5. Study Hours & Library', short: 'Study Hours', icon: Clock, group: 'ops' },
  { id: 'chores', label: '6. Weekly Chores Roster', short: 'Chores', icon: Users, group: 'ops' },
  { id: 'cellphones', label: '7. Cellphone Vault Custody', short: 'Phone Vault', icon: Shield, group: 'ops' },
  { id: 'medical', label: '8. Sick Bay & Medical Slips', short: 'Sick Bay', icon: HeartPulse, group: 'records' },
  { id: 'gatepass', label: '9. Weekend Gate Passes', short: 'Gate Passes', icon: FileCheck, group: 'records' },
  { id: 'clearance', label: '10. Demerit Clearance & Service', short: 'Clearance', icon: ShieldCheck, group: 'records' },
  { id: 'vault', label: '11. Confiscated Contraband & Hazards', short: 'Contraband', icon: Flame, group: 'records' },
  { id: 'health', label: '12. Student Medical & Allergy Index', short: 'Health Index', icon: ClipboardList, group: 'records' },
  { id: 'violations', label: 'Violations', short: 'Violations', icon: Bell, group: 'people' },
  { id: 'occupants', label: 'Residents Roster & Rooms', short: 'Residents', icon: Users, group: 'people' },
  { id: 'rbac', label: 'Admin Staff & RBAC', short: 'Admin & Staff', icon: Shield, group: 'people' },
];

const NAV_GROUPS: { id: NavItem['group']; title: string }[] = [
  { id: 'main', title: '' },
  { id: 'ops', title: 'Daily Operations' },
  { id: 'records', title: 'Records & Safety' },
  { id: 'people', title: 'People & Admin' },
];

const roleLabel = (role: string) =>
  role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Administrator' : 'Resident';

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openGoogleModal }) => {
  const {
    currentUser,
    loginWithRole,
    isAuthenticated,
    logout,
    users,
    violations,
  } = useDorm();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pendingViolations = violations.filter(v => v.status === 'pending_settlement').length;

  const staffProfiles: { id: string; name: string; role: UserRole; kind: 'dean' | 'admin' }[] = [
    { id: 'user-dean', name: 'Dean Jelmar Orapa', role: 'superadmin', kind: 'dean' },
    ...users
      .filter(u => u.id !== 'user-dean' && u.email !== 'orapajelmar@gmail.com' && u.role !== 'occupant')
      .map(u => ({ id: u.id, name: u.name, role: u.role, kind: (u.role === 'admin' ? 'admin' : 'dean') as 'admin' | 'dean' })),
  ];

  const switchRole = (role: UserRole, id: string) => {
    loginWithRole(role, id);
    setDropdownOpen(false);
    setDrawerOpen(false);
  };

  const navLabel = (item: NavItem) =>
    item.id === 'violations' ? `Violations (${pendingViolations})` : item.label;

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md pt-safe">
      {/* Mobile app bar */}
      <div className="lg:hidden flex items-center justify-between h-14 px-2">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 active:scale-95 transition"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button onClick={() => setActiveTab('overview')} className="flex items-center space-x-2 min-h-touch">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Cedar Hall</span>
        </button>

        <button
          onClick={() => setActiveTab('violations')}
          aria-label={`Violations (${pendingViolations})`}
          className="relative min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 active:scale-95 transition"
        >
          <Bell className="w-5 h-5" />
          {pendingViolations > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              {pendingViolations}
            </span>
          )}
        </button>
      </div>

      {/* Desktop bar */}
      <div className="hidden lg:block max-w-7xl mx-auto px-8">
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
              <p className="text-xs text-slate-400">Automated Compliance, Discipline & Safety System</p>
            </div>
          </div>

          {/* Quick RBAC Role Selector & Profile */}
          <div className="flex items-center space-x-2.5">
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
                  <div className="text-left">
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
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Staff Profile</p>
                      <p className="text-[11px] text-slate-300 font-medium truncate">{currentUser.name}</p>
                    </div>

                    <div className="p-1 space-y-1">
                      {staffProfiles.map(profile => {
                        const isSelected = currentUser.id === profile.id;
                        const accent =
                          profile.kind === 'admin'
                            ? 'bg-blue-950/40 text-blue-300'
                            : 'bg-purple-950/40 text-purple-300';
                        return (
                          <button
                            key={profile.id}
                            onClick={() => switchRole(profile.role, profile.id)}
                            className={`w-full px-3 py-2 text-left hover:bg-slate-800 rounded-lg flex items-center space-x-2.5 ${
                              isSelected ? accent : 'text-slate-300'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                profile.kind === 'admin' ? 'bg-blue-400' : 'bg-purple-400'
                              }`}
                            ></div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{profile.name}</div>
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

            {isAuthenticated ? (
              <button
                id="header-logout-button"
                onClick={logout}
                className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                title="Log out of Cedar Hall"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
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
          {NAV_ITEMS.map(tab => {
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
                <span>{navLabel(tab)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile slide-in drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 pt-safe">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">Cedar Hall</span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 active:scale-95 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable nav */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-5">
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-amber-300 font-bold border border-slate-600 shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-amber-300/90">{roleLabel(currentUser.role)}</p>
              </div>
            </div>

            {NAV_GROUPS.map(group => {
              const items = NAV_ITEMS.filter(i => i.group === group.id);
              if (!items.length) return null;
              return (
                <div key={group.id} className="space-y-1">
                  {group.title && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {group.title}
                    </p>
                  )}
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setDrawerOpen(false);
                        }}
                        className={`w-full min-h-touch flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'text-slate-300 hover:bg-slate-800 active:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left truncate">{item.short}</span>
                        {item.id === 'violations' && pendingViolations > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-[11px] font-bold text-white flex items-center justify-center">
                            {pendingViolations}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Drawer footer: staff switcher + auth */}
          <div className="border-t border-slate-800 p-3 space-y-1 pb-safe">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Switch Staff Profile
            </p>
            {staffProfiles.map(profile => {
              const isSelected = currentUser.id === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => switchRole(profile.role, profile.id)}
                  className={`w-full min-h-touch flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                    isSelected
                      ? profile.kind === 'admin'
                        ? 'bg-blue-950/40 text-blue-300'
                        : 'bg-purple-950/40 text-purple-300'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      profile.kind === 'admin' ? 'bg-blue-400' : 'bg-purple-400'
                    }`}
                  />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block font-medium truncate">{profile.name}</span>
                    <span className="block text-[11px] text-slate-500">{roleLabel(profile.role)}</span>
                  </span>
                </button>
              );
            })}

            <div className="pt-1 space-y-1">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  openGoogleModal();
                }}
                className="w-full min-h-touch flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-amber-300 hover:bg-slate-800"
              >
                <LogIn className="w-5 h-5" />
                <span>Google Account Switcher</span>
              </button>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="w-full min-h-touch flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-950/50"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
};
