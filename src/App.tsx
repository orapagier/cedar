import React, { useState } from 'react';
import { DormProvider, useDorm } from './context/DormContext';
import { Navbar } from './components/Navbar';
import { GoogleOAuthModal } from './components/GoogleOAuthModal';
import { LoginScreen } from './components/LoginScreen';
import { OverviewDashboard } from './components/OverviewDashboard';
import { RoomInspectionsView } from './components/RoomInspectionsView';
import { WorshipAttendanceView } from './components/WorshipAttendanceView';
import { CurfewLightsOutView } from './components/CurfewLightsOutView';
import { SchoolDepartureUniformView } from './components/SchoolDepartureUniformView';
import { StudyHoursLibraryView } from './components/StudyHoursLibraryView';
import { WeeklyChoresView } from './components/WeeklyChoresView';
import { CellphoneCustodyView } from './components/CellphoneCustodyView';
import { ViolationsDashboardView } from './components/ViolationsDashboardView';
import { OccupantsDirectoryView } from './components/OccupantsDirectoryView';
import { AdminManagementView } from './components/AdminManagementView';
import { DeanAdvicePanel } from './components/DeanAdvicePanel';
import { Shield } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const { currentUser, isAuthenticated } = useDorm();

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen openGoogleModal={() => setIsGoogleModalOpen(true)} />
        <GoogleOAuthModal 
          isOpen={isGoogleModalOpen} 
          onClose={() => setIsGoogleModalOpen(false)} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Bar with Role Switcher & Tabs */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openGoogleModal={() => setIsGoogleModalOpen(true)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 lg:py-6">
        {activeTab === 'overview' && (
          <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'inspections' && <RoomInspectionsView />}
        {activeTab === 'worship' && <WorshipAttendanceView />}
        {activeTab === 'curfew' && <CurfewLightsOutView />}
        {activeTab === 'uniform' && <SchoolDepartureUniformView />}
        {activeTab === 'study' && <StudyHoursLibraryView />}
        {activeTab === 'chores' && <WeeklyChoresView />}
        {activeTab === 'cellphones' && <CellphoneCustodyView />}
        {(activeTab === 'medical' || activeTab === 'gatepass' || activeTab === 'clearance' || activeTab === 'vault' || activeTab === 'health') && (
          <DeanAdvicePanel 
            activeModule={activeTab as any} 
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        )}
        {activeTab === 'violations' && <ViolationsDashboardView />}
        {activeTab === 'occupants' && <OccupantsDirectoryView />}
        {activeTab === 'rbac' && <AdminManagementView />}
      </main>

      {/* Institutional Footer */}
      <footer className="hidden lg:block border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 pb-safe">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-500/70" />
            <span className="font-semibold text-slate-400">Cedar Hall Boys Dormitory System</span>
            <span>•</span>
            <span>Role-Based Discipline & Safety Registry</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Current Session: <strong className="text-slate-300">{currentUser.name}</strong>
          </div>
        </div>
      </footer>

      {/* Google OAuth Simulation Modal */}
      <GoogleOAuthModal 
        isOpen={isGoogleModalOpen} 
        onClose={() => setIsGoogleModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <DormProvider>
      <AppContent />
    </DormProvider>
  );
}
