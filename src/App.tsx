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
import { OccupantsDirectoryView } from './components/OccupantsDirectoryView';
import { AdminManagementView } from './components/AdminManagementView';
import { ResidentPerformanceView } from './components/ResidentPerformanceView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const { isAuthenticated } = useDorm();

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
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openGoogleModal={() => setIsGoogleModalOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 lg:py-6">
        {activeTab === 'overview' && (
          <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'inspections' && <RoomInspectionsView />}
        {activeTab === 'worship' && <WorshipAttendanceView />}
        {activeTab === 'study' && <StudyHoursLibraryView />}
        {activeTab === 'curfew' && <CurfewLightsOutView />}
        {activeTab === 'uniform' && <SchoolDepartureUniformView />}
        {activeTab === 'chores' && <WeeklyChoresView />}
        {activeTab === 'cellphones' && <CellphoneCustodyView />}
        {activeTab === 'performance' && <ResidentPerformanceView />}
        {activeTab === 'roster' && <OccupantsDirectoryView />}
        {activeTab === 'rbac' && <AdminManagementView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 pb-safe">
        Cedar Hall · Boys Dormitory
      </footer>

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