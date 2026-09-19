import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  TreePine,
  LogOut,
  Users,
  ChevronDown,
  User,
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
  Luggage,
  Siren,
  MessageSquareWarning,
  Footprints,
  Settings,
  ClipboardList,
  Database,
  Download,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { useDismissOnOutside } from './ui/Modal';
import { useCanInstall } from './PwaPrompts';
import { promptInstall } from '../utils/pwa';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** Open the profile page; an id shows that resident's file, none shows the viewer's own. */
  onOpenProfile?: (id?: string | null) => void;
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
  { id: 'cleaning', label: 'Daily Cleaning', icon: Brush, group: 'checks' },
  { id: 'cellphones', label: 'Phone Vault', icon: Smartphone, group: 'checks' },
  { id: 'offcampus', label: 'Off-Campus Without Pass', icon: Siren, group: 'checks' },
  { id: 'language', label: 'Foul Language', icon: MessageSquareWarning, group: 'checks' },
  { id: 'neighbor', label: 'Neighboring Rooms', icon: Footprints, group: 'checks' },
  { id: 'performance', label: 'Resident Performance', icon: Users, group: 'residents' },
  { id: 'occupant-records', label: 'Occupant Records', icon: ClipboardList, group: 'residents' },
  { id: 'gatepass', label: 'Gate Pass & Home Leave', icon: Luggage, group: 'residents' },
  { id: 'roster', label: 'Manage Roster', icon: UserCog, group: 'residents' },
  { id: 'rbac', label: 'Staff & Access', icon: Shield, group: 'admin' },
  { id: 'settings', label: 'Schedule Settings', icon: Settings, group: 'admin' },
  { id: 'storage', label: 'Data & Storage', icon: Database, group: 'admin' },
];

const MENU_GROUPS: MenuGroup[] = [
  { id: 'main', title: '' },
  { id: 'checks', title: 'Daily Checks' },
  { id: 'residents', title: 'Residents' },
  { id: 'admin', title: 'Admin' },
];

const roleLabel = (role: string) =>
  role === 'superadmin' ? 'Super Admin'
  : role === 'admin' ? 'Administrator'
  : role === 'parent' ? 'Parent'
  : role === 'guest' ? 'Guest'
  : 'Resident';

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const { currentUser, logout, canEdit, isGuest, isParent } = useDorm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // The install banner is dismissible, so the menu keeps a way back to it.
  const canInstall = useCanInstall();
  // Wraps the avatar button as well as the panel, so tapping the button is its
  // own toggle rather than an outside tap that closes and reopens in one go.
  const profileRef = useDismissOnOutside<HTMLDivElement>(() => setProfileOpen(false), profileOpen);

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

  const isRestrictedView = isGuest || isParent;

  const visibleItems = isRestrictedView
    ? MENU_ITEMS.filter(item => item.id === 'overview')
    : MENU_ITEMS.filter(item =>
        item.group === 'admin' ? canEdit : item.id === 'roster' || item.id === 'occupant-records' ? canEdit : true
      );

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md pt-safe">
      <div className="flex items-center justify-between h-14 px-2 sm:px-4">
        <div className="flex items-center min-w-0">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            className="min-w-touch min-h-touch flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 active:scale-95 transition shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button onClick={() => goTo('overview')} className="flex items-center space-x-2 min-h-touch ml-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TreePine className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white truncate">Cedar Hall</span>
            <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Boys Dormitory
            </span>
          </button>
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={profileRef}>
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

                  <div className="border-t border-slate-800 mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        onOpenProfile?.(null);
                        goTo('profile');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 flex items-center space-x-2 font-semibold"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
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

      {/* Slide-in drawer — portalled to <body> because the header's backdrop-blur
          creates a containing block that would otherwise trap `fixed` children. */}
      {createPortal(
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
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TreePine className="w-5 h-5" />
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

            <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-3 py-4 space-y-6">
              {MENU_GROUPS.map(group => {
                const items = visibleItems.filter(i => i.group === group.id);
                if (!items.length) return null;
                return (
                  <div key={group.id}>
                    {group.title && (
                      <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {group.title}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {items.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => goTo(item.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`w-full min-h-touch flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                              isActive
                                ? 'bg-amber-500/15 text-amber-200'
                                : 'text-slate-200 hover:bg-slate-800 active:bg-slate-800'
                            }`}
                          >
                            <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 p-3 space-y-1 pb-safe">
              {canInstall && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    void promptInstall();
                  }}
                  className="w-full min-h-touch flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 transition-colors"
                >
                  <Download className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-sm font-semibold">Install app</span>
                </button>
              )}
              <div className="flex items-center justify-between px-2 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-300/80 font-medium">{roleLabel(currentUser.role)}</p>
                </div>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                  className="shrink-0 min-h-touch flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-slate-800/60 hover:bg-rose-950/50 border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </header>
  );
};