import React, { useState } from 'react';
import { DormProvider, useDorm } from './context/DormContext';
import { Navbar } from './components/Navbar';
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
import { GatePassView } from './components/GatePassView';
import { GuestView } from './components/GuestView';
import { ParentView } from './components/ParentView';
import { OccupantRecordsView } from './components/OccupantRecordsView';
import { ScheduleSettingsView } from './components/ScheduleSettingsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { isAuthenticated, isGuest, isParent } = useDorm();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 lg:py-6">
        {isGuest && <GuestView />}
        {isParent && <ParentView />}
        {!isGuest && !isParent && activeTab === 'overview' && (
          <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {!isGuest && !isParent && activeTab === 'inspections' && <RoomInspectionsView />}
        {!isGuest && !isParent && activeTab === 'worship' && <WorshipAttendanceView />}
        {!isGuest && !isParent && activeTab === 'study' && <StudyHoursLibraryView />}
        {!isGuest && !isParent && activeTab === 'curfew' && <CurfewLightsOutView />}
        {!isGuest && !isParent && activeTab === 'uniform' && <SchoolDepartureUniformView />}
        {!isGuest && !isParent && activeTab === 'chores' && <WeeklyChoresView />}
        {!isGuest && !isParent && activeTab === 'cellphones' && <CellphoneCustodyView />}
        {!isGuest && !isParent && activeTab === 'performance' && <ResidentPerformanceView />}
        {!isGuest && !isParent && activeTab === 'gatepass' && <GatePassView />}
        {!isGuest && !isParent && activeTab === 'roster' && <OccupantsDirectoryView />}
        {!isGuest && !isParent && activeTab === 'rbac' && <AdminManagementView />}
        {!isGuest && !isParent && activeTab === 'occupant-records' && <OccupantRecordsView />}
        {!isGuest && !isParent && activeTab === 'settings' && <ScheduleSettingsView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 pb-safe">
        Cedar Hall · Boys Dormitory
      </footer>
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