import React, { useEffect, useState } from 'react';
import {
  Shield,
  LogOut,
  Users,
  ChevronDown,
  Menu,
  X,
  Home,
  DoorOpen,
  Church,
  BookOpen,
  Moon,
  UserCheck,
  Brush,
  Smartphone,
  UserCog,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { UserRole } from '../types/dorm';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openGoogleModal: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'main' | 'checks' | 'residents' | 'admin';
}

interface MenuGroup {
  id: MenuItem['group'];
  title: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: 'Home', icon: Home, group: 'main' },
  { id: 'inspections', label: 'Room Check', icon: DoorOpen, group: 'checks' },
  { id: 'worship', label: 'Worship Roll Call', icon: Church, group: 'checks' },
  { id: 'study', label: 'Study Time', icon: BookOpen, group: 'checks' },
  { id: 'curfew', label: 'Curfew & Lights Out', icon: Moon, group: 'checks' },
  { id: 'uniform', label: 'Departure & Uniform', icon: UserCheck, group: 'checks' },
  { id: 'chores', label: 'Weekly Chores', icon: Brush, group: 'checks' },
  { id: 'cellphones', label: 'Phone Vault', icon: Smartphone, group: 'checks' },
  { id: 'performance', label: 'Resident Performance', icon: Users, group: 'residents' },
  { id: 'roster', label: 'Manage Roster', icon: UserCog, group: 'residents' },
  { id: 'rbac', label: 'Staff & Access', icon: Shield, group: 'admin' },
];

const MENU_GROUPS: MenuGroup[] = [
  { id: 'main', title: '' },
  { id: 'checks', title: 'Daily Checks' },
  { id: 'residents', title: 'Residents' },
  { id: 'admin', title: 'Admin' },
];

const roleLabel = (role: string) =>
  role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Administrator' : 'Resident';

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openGoogleModal }) => {
  const { currentUser, loginWithRole, logout, users, canEdit } = useDorm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const staffProfiles: { id: string; name: string; role: UserRole; kind: 'dean' | 'admin' }[] = [
    { id: 'user-dean', name: 'Dean Jelmar Orapa', role: 'superadmin', kind: 'dean' },
    ...users
      .filter(u => u.id !== 'user-dean' && u.email !== 'orapajelmar@gmail.com' && u.role !== 'occupant')
      .map(u => ({ id: u.id, name: u.name, role: u.role, kind: (u.role === 'admin' ? 'admin' : 'dean') as 'admin' | 'dean' })),
  ];

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

  const goTo = (tab: string) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    setProfileOpen(false);
  };

  const switchRole = (role: UserRole, id: string) => {
    loginWithRole(role, id);
    setDrawerOpen(false);
    setProfileOpen(false);
  };

  const visibleItems = MENU_ITEMS.filter(item =>
    item.group === 'admin' ? canEdit : item.id === 'roster' ? canEdit : true
  );

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md pt-safe">
      <div className="flex items-center justify-between h-14 px-2 sm:px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 active:scale-95 transition"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button onClick={() => goTo('overview')} className="flex items-center space-x-2 min-h-touch">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Cedar Hall</span>
          <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Boys Dormitory
          </span>
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            aria-label="User menu"
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-1.5 sm:px-2.5 py-1.5 text-xs font-medium transition-all min-h-touch"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] text-amber-300 font-bold border border-slate-600">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden md:block font-medium text-xs max-w-[140px] truncate">{currentUser.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs"
            >
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                <p className="text-sm text-slate-200 font-medium truncate">{currentUser.name}</p>
                <p className="text-[11px] text-amber-300/90">{roleLabel(currentUser.role)}</p>
              </div>

              <div className="p-1 space-y-1">
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Switch profile
                </p>
                {staffProfiles.map(profile => {
                  const isSelected = currentUser.id === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => switchRole(profile.role, profile.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-800 rounded-lg flex items-center space-x-2.5 ${
                        isSelected
                          ? profile.kind === 'admin'
                            ? 'bg-blue-950/40 text-blue-300'
                            : 'bg-purple-950/40 text-purple-300'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${profile.kind === 'admin' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                      <span className="min-w-0 truncate font-medium">{profile.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800 mt-1 pt-1 px-2 space-y-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    openGoogleModal();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-amber-300 font-medium"
                >
                  Google Account Switcher
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/50 text-rose-300 flex items-center space-x-2 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-in drawer */}
      <div className={`fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
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

          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-5">
            {MENU_GROUPS.map(group => {
              const items = visibleItems.filter(i => i.group === group.id);
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
                        onClick={() => goTo(item.id)}
                        className={`w-full min-h-touch flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'text-slate-300 hover:bg-slate-800 active:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

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
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${profile.kind === 'admin' ? 'bg-blue-400' : 'bg-purple-400'}`} />
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
                Google Account Switcher
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