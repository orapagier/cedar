import React, { useLayoutEffect, useState } from 'react';
import { DormProvider, useDorm } from './context/DormContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { OverviewDashboard } from './components/OverviewDashboard';
import { RoomInspectionsView } from './components/RoomInspectionsView';
import { WorshipAttendanceView } from './components/WorshipAttendanceView';
import { CurfewLightsOutView } from './components/CurfewLightsOutView';
import { SchoolDepartureUniformView } from './components/SchoolDepartureUniformView';
import { StudyHoursLibraryView } from './components/StudyHoursLibraryView';
import { CleaningDutyView } from './components/CleaningDutyView';
import { CellphoneCustodyView } from './components/CellphoneCustodyView';
import { OccupantsDirectoryView } from './components/OccupantsDirectoryView';
import { AdminManagementView } from './components/AdminManagementView';
import { ResidentPerformanceView } from './components/ResidentPerformanceView';
import { GatePassView } from './components/GatePassView';
import { UnauthorizedExitView } from './components/UnauthorizedExitView';
import { GuestView } from './components/GuestView';
import { ParentView } from './components/ParentView';
import { OccupantRecordsView } from './components/OccupantRecordsView';
import { ScheduleSettingsView } from './components/ScheduleSettingsView';
import { DataStorageView } from './components/DataStorageView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { isAuthenticated, isGuest, isParent } = useDorm();

  // Each tab is a page of its own, so it opens at the top rather than inheriting
  // however far down the tab before it was scrolled. Before paint, and instantly
  // — the smooth scrolling `html` asks for would otherwise animate the whole way up.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

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
        {!isGuest && !isParent && activeTab === 'cleaning' && <CleaningDutyView />}
        {!isGuest && !isParent && activeTab === 'cellphones' && <CellphoneCustodyView />}
        {!isGuest && !isParent && activeTab === 'performance' && <ResidentPerformanceView />}
        {!isGuest && !isParent && activeTab === 'gatepass' && <GatePassView />}
        {!isGuest && !isParent && activeTab === 'offcampus' && <UnauthorizedExitView />}
        {!isGuest && !isParent && activeTab === 'roster' && <OccupantsDirectoryView />}
        {!isGuest && !isParent && activeTab === 'rbac' && <AdminManagementView />}
        {!isGuest && !isParent && activeTab === 'occupant-records' && <OccupantRecordsView />}
        {!isGuest && !isParent && activeTab === 'settings' && <ScheduleSettingsView />}
        {!isGuest && !isParent && activeTab === 'storage' && <DataStorageView />}
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