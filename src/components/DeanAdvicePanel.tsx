import React, { useState } from 'react';
import { 
  HeartPulse, 
  FileCheck, 
  Flame, 
  ShieldCheck, 
  ClipboardList, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Lock, 
  X,
  Phone,
  Building,
  Calendar,
  Search,
  Sparkles,
  Check,
  PackageCheck
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { 
  MedicalExcuseSlip, 
  GatePassRecord, 
  DemeritClearanceLog, 
  ConfiscatedItemRecord, 
  StudentMedicalRecord 
} from '../types/dorm';

interface DeanAdvicePanelProps {
  onNavigate?: (tab: string) => void;
  activeModule?: OperationalTab;
}

type OperationalTab = 'medical' | 'gatepass' | 'clearance' | 'vault' | 'health';

export const DeanAdvicePanel: React.FC<DeanAdvicePanelProps> = ({ onNavigate, activeModule: propActiveModule }) => {
  const { 
    currentUser, 
    users, 
    rooms, 
    canEdit, 
    isSuperAdmin,
    medicalSlips,
    saveMedicalSlip,
    updateMedicalSlipStatus,
    gatePasses,
    saveGatePass,
    updateGatePassStatus,
    demeritClearances,
    saveDemeritClearance,
    confiscatedItems,
    saveConfiscatedItem,
    updateConfiscatedItemStatus,
    studentMedicals,
    saveStudentMedical
  } = useDorm();

  const [activeModule, setActiveModule] = useState<OperationalTab>(propActiveModule || 'medical');

  React.useEffect(() => {
    if (propActiveModule && propActiveModule !== activeModule) {
      setActiveModule(propActiveModule);
    }
  }, [propActiveModule]);

  // Modals
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const occupants = users.filter(u => u.role === 'occupant');

  // New Medical Slip Form
  const [medStudentId, setMedStudentId] = useState(occupants[0]?.id || '');
  const [medDiagnosis, setMedDiagnosis] = useState('');
  const [medBedrest, setMedBedrest] = useState(true);
  const [medExcuses, setMedExcuses] = useState<string[]>(['Morning Worship', 'School Classes']);
  const [medDoctor, setMedDoctor] = useState('Campus Clinic Nurse');
  const [medNotes, setMedNotes] = useState('');

  // New Gate Pass Form
  const [gateStudentId, setGateStudentId] = useState(occupants[0]?.id || '');
  const [gateType, setGateType] = useState<GatePassRecord['passType']>('weekend_home');
  const [gateDestination, setGateDestination] = useState('');
  const [gateDeparture, setGateDeparture] = useState(new Date().toISOString().split('T')[0] + ' 16:00');
  const [gateExpectedReturn, setGateExpectedReturn] = useState(new Date().toISOString().split('T')[0] + ' 18:00');
  const [gateParentConsent, setGateParentConsent] = useState(true);
  const [gateParentPhone, setGateParentPhone] = useState('+63 917 888 0000');
  const [gateRemarks, setGateRemarks] = useState('');

  // New Demerit Clearance Form
  const [clrStudentId, setClrStudentId] = useState(occupants[0]?.id || '');
  const [clrServiceType, setClrServiceType] = useState<DemeritClearanceLog['serviceType']>('Dorm Maintenance & Sanitizing');
  const [clrHours, setClrHours] = useState(2);
  const [clrSupervisor, setClrSupervisor] = useState(currentUser.name || 'Dean Jelmar Orapa');
  const [clrRemarks, setClrRemarks] = useState('');

  // New Confiscated Item Form
  const [confStudentId, setConfStudentId] = useState(occupants[0]?.id || '');
  const [confItemName, setConfItemName] = useState('');
  const [confCategory, setConfCategory] = useState<ConfiscatedItemRecord['category']>('banned_cooking');
  const [confVaultSlot, setConfVaultSlot] = useState('Vault-Shelf-A1');
  const [confRemarks, setConfRemarks] = useState('');

  // Health Edit Form
  const [hlthStudentId, setHlthStudentId] = useState(occupants[0]?.id || '');
  const [hlthBloodType, setHlthBloodType] = useState('O+');
  const [hlthAllergies, setHlthAllergies] = useState('');
  const [hlthAsthma, setHlthAsthma] = useState(false);
  const [hlthMedications, setHlthMedications] = useState('');
  const [hlthHospital, setHlthHospital] = useState('Adventist Hospital & Medical Center');
  const [hlthParentPhone, setHlthParentPhone] = useState('+63 917 000 0000');
  const [hlthNotes, setHlthNotes] = useState('');

  React.useEffect(() => {
    if (occupants.length > 0) {
      if (!medStudentId || !occupants.some(o => o.id === medStudentId)) setMedStudentId(occupants[0].id);
      if (!gateStudentId || !occupants.some(o => o.id === gateStudentId)) setGateStudentId(occupants[0].id);
      if (!clrStudentId || !occupants.some(o => o.id === clrStudentId)) setClrStudentId(occupants[0].id);
      if (!confStudentId || !occupants.some(o => o.id === confStudentId)) setConfStudentId(occupants[0].id);
      if (!hlthStudentId || !occupants.some(o => o.id === hlthStudentId)) setHlthStudentId(occupants[0].id);
    }
  }, [occupants, medStudentId, gateStudentId, clrStudentId, confStudentId, hlthStudentId]);

  // Handlers
  const handleCreateMedicalSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const st = users.find(u => u.id === medStudentId);
    if (!st || !medDiagnosis.trim()) return;

    saveMedicalSlip({
      studentId: st.id,
      studentName: st.name,
      roomNumber: st.roomNumber || 'TBD',
      diagnosis: medDiagnosis.trim(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      bedRestRequired: medBedrest,
      clinicStaffOrDoctor: medDoctor.trim() || 'Campus Clinic',
      excusedFrom: medExcuses,
      status: 'active_bedrest',
      notes: medNotes.trim() || undefined,
    });

    setIsMedicalModalOpen(false);
    setMedDiagnosis('');
    setMedNotes('');
  };

  const handleCreateGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    const st = users.find(u => u.id === gateStudentId);
    if (!st || !gateDestination.trim()) return;

    saveGatePass({
      studentId: st.id,
      studentName: st.name,
      roomNumber: st.roomNumber || 'TBD',
      passType: gateType,
      destination: gateDestination.trim(),
      departureDate: gateDeparture,
      expectedReturnDate: gateExpectedReturn,
      parentConsentVerified: gateParentConsent,
      parentPhone: gateParentPhone.trim(),
      approvedByDean: currentUser.name,
      status: 'departed',
      remarks: gateRemarks.trim() || undefined,
    });

    setIsGatePassModalOpen(false);
    setGateDestination('');
    setGateRemarks('');
  };

  const handleCreateClearance = (e: React.FormEvent) => {
    e.preventDefault();
    const st = users.find(u => u.id === clrStudentId);
    if (!st) return;

    saveDemeritClearance({
      studentId: st.id,
      studentName: st.name,
      roomNumber: st.roomNumber || 'TBD',
      serviceType: clrServiceType,
      hoursRendered: Number(clrHours),
      demeritsDeducted: Number(clrHours), // 1 hour = 1 demerit cleared
      supervisorName: clrSupervisor.trim() || currentUser.name,
      completionDate: new Date().toISOString().split('T')[0],
      remarks: clrRemarks.trim() || undefined,
    });

    setIsClearanceModalOpen(false);
    setClrRemarks('');
  };

  const handleCreateConfiscation = (e: React.FormEvent) => {
    e.preventDefault();
    const st = users.find(u => u.id === confStudentId);
    if (!st || !confItemName.trim()) return;

    saveConfiscatedItem({
      studentId: st.id,
      studentName: st.name,
      roomNumber: st.roomNumber || 'TBD',
      itemName: confItemName.trim(),
      category: confCategory,
      confiscatedDate: new Date().toISOString().split('T')[0],
      confiscatedBy: currentUser.name,
      vaultLockerSlot: confVaultSlot.trim() || 'Vault-Shelf-1',
      status: 'in_safe_custody',
      remarks: confRemarks.trim() || undefined,
    });

    setIsVaultModalOpen(false);
    setConfItemName('');
    setConfRemarks('');
  };

  const handleSaveHealthProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const st = users.find(u => u.id === hlthStudentId);
    if (!st) return;

    saveStudentMedical({
      studentId: st.id,
      studentName: st.name,
      roomNumber: st.roomNumber || 'TBD',
      bloodType: hlthBloodType,
      allergies: hlthAllergies.trim() || 'None known',
      asthmaInhalerRequired: hlthAsthma,
      dailyMedications: hlthMedications.trim() || 'None',
      emergencyHospitalPreference: hlthHospital.trim(),
      parentEmergencyPhone: hlthParentPhone.trim() || st.phone || '+63 917 000 0000',
      notes: hlthNotes.trim() || undefined,
    });

    setIsHealthModalOpen(false);
  };

  // Filtered lists
  const filteredMedical = medicalSlips.filter(m => 
    m.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.roomNumber.includes(searchQuery) ||
    m.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPasses = gatePasses.filter(g =>
    g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.roomNumber.includes(searchQuery)
  );

  const filteredClearances = demeritClearances.filter(c =>
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVault = confiscatedItems.filter(v =>
    v.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vaultLockerSlot.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHealth = studentMedicals.filter(h =>
    h.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.roomNumber.includes(searchQuery) ||
    h.allergies.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Dean's Operational Checklist & Specialized Registries
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fully Operational
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Live compliance registries addressing critical dormitory operations: Clinic Sick Bay Excuse Slips, Weekend Gate Passes, Community Service Demerit Clearance, Fire Hazard Locker, and Resident Emergency Health Indexes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search student, room, diagnosis, or item..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {activeModule === 'medical' && (
              <button
                onClick={() => setIsMedicalModalOpen(true)}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Medical Slip</span>
              </button>
            )}
            {activeModule === 'gatepass' && (
              <button
                onClick={() => setIsGatePassModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Gate Pass</span>
              </button>
            )}
            {activeModule === 'clearance' && (
              <button
                onClick={() => setIsClearanceModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Log Service Clearance</span>
              </button>
            )}
            {activeModule === 'vault' && (
              <button
                onClick={() => setIsVaultModalOpen(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Log Confiscated Item</span>
              </button>
            )}
            {activeModule === 'health' && (
              <button
                onClick={() => setIsHealthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Update Health Profile</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODULE 1: SICK BAY & MEDICAL SLIPS */}
      {activeModule === 'medical' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Currently on Bedrest</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {medicalSlips.filter(s => s.status === 'active_bedrest').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Excused from worship standing & chores</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Recovered & Cleared</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {medicalSlips.filter(s => s.status === 'recovered_cleared').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Returned to regular schedule</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Policy Safeguard</div>
              <div className="text-xs font-semibold text-slate-200 mt-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Auto-waives absence demerits</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Certified by Dean & Campus Clinic</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Resident & Room</th>
                    <th className="py-3 px-4">Diagnosis & Clinic Officer</th>
                    <th className="py-3 px-4">Excused Policies</th>
                    <th className="py-3 px-4">Bedrest & Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMedical.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No medical excuse slips recorded yet. Click "Issue Medical Slip" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredMedical.map(slip => (
                      <tr key={slip.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{slip.studentName}</div>
                          <div className="text-[11px] text-amber-400 font-medium">Room {slip.roomNumber}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{slip.diagnosis}</div>
                          <div className="text-[11px] text-slate-400">By: {slip.clinicStaffOrDoctor}</div>
                          {slip.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{slip.notes}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {slip.excusedFrom.map(ex => (
                              <span key={ex} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {ex}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${
                              slip.status === 'active_bedrest'
                                ? 'bg-rose-950/60 border-rose-600/40 text-rose-300'
                                : 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                            }`}>
                              <span>{slip.status === 'active_bedrest' ? 'Active Bedrest' : 'Recovered & Cleared'}</span>
                            </span>
                            <span className="text-[10px] text-slate-500">Issued: {slip.issuedAt}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canEdit && slip.status === 'active_bedrest' && (
                            <button
                              onClick={() => updateMedicalSlipStatus(slip.id, 'recovered_cleared')}
                              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-xs font-medium transition-all"
                            >
                              Mark Recovered
                            </button>
                          )}
                          {slip.status === 'recovered_cleared' && (
                            <span className="text-slate-500 text-[11px]">Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: WEEKEND GATE PASSES */}
      {activeModule === 'gatepass' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Currently Away on Leave</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {gatePasses.filter(g => g.status === 'departed').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Accounted for during curfew checks</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Returned on Schedule</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {gatePasses.filter(g => g.status === 'returned_on_time').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Checked in back at Cedar Hall</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Overdue / Late Return</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {gatePasses.filter(g => g.status === 'overdue').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Alerts assistant dean for guardian call</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student & Room</th>
                    <th className="py-3 px-4">Pass Type & Destination</th>
                    <th className="py-3 px-4">Schedule (Depart / Return)</th>
                    <th className="py-3 px-4">Parent Consent</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No weekend gate passes recorded. Click "Issue Gate Pass" to record an approved pass.
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map(pass => (
                      <tr key={pass.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{pass.studentName}</div>
                          <div className="text-[11px] text-amber-400 font-medium">Room {pass.roomNumber}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200 capitalize">{pass.passType.replace('_', ' ')}</div>
                          <div className="text-[11px] text-slate-400">{pass.destination}</div>
                          {pass.remarks && <div className="text-[10px] text-slate-500 mt-0.5 italic">{pass.remarks}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300">Out: {pass.departureDate}</div>
                          <div className="text-slate-400">Due: {pass.expectedReturnDate}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{pass.parentPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            pass.status === 'departed'
                              ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                              : pass.status === 'returned_on_time'
                              ? 'bg-blue-950/60 border-blue-600/40 text-blue-300'
                              : pass.status === 'overdue'
                              ? 'bg-rose-950/60 border-rose-600/40 text-rose-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}>
                            {pass.status === 'departed' ? 'Away on Leave' : pass.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canEdit && pass.status === 'departed' && (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => updateGatePassStatus(pass.id, 'returned_on_time')}
                                className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900 border border-blue-600/50 text-blue-300 rounded-lg text-xs font-medium transition-all"
                              >
                                Check In (Returned)
                              </button>
                              <button
                                onClick={() => updateGatePassStatus(pass.id, 'overdue')}
                                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-600/50 text-rose-300 rounded-lg text-xs font-medium transition-all"
                              >
                                Overdue
                              </button>
                            </div>
                          )}
                          {pass.status === 'returned_on_time' && (
                            <span className="text-slate-500 text-[11px]">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: DEMERIT CLEARANCE VIA COMMUNITY WORK */}
      {activeModule === 'clearance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total Demerits Cleared</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {demeritClearances.reduce((acc, c) => acc + c.demeritsDeducted, 0)} pts
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Restorative discipline applied</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Restorative Labor Rendered</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {demeritClearances.reduce((acc, c) => acc + c.hoursRendered, 0)} hrs
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Supervised campus work & dorm beautification</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Conversion Standard</div>
              <div className="text-xs font-bold text-slate-200 mt-2">
                1 Demerit = 1 Hour Approved Labor
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automatically resolves active violations</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Resident & Room</th>
                    <th className="py-3 px-4">Service Performed</th>
                    <th className="py-3 px-4">Labor Hours</th>
                    <th className="py-3 px-4">Demerits Cleared</th>
                    <th className="py-3 px-4">Supervisor & Date</th>
                    <th className="py-3 px-4 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredClearances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No community service clearances logged. Click "Log Service Clearance" to record work.
                      </td>
                    </tr>
                  ) : (
                    filteredClearances.map(clr => (
                      <tr key={clr.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{clr.studentName}</div>
                          <div className="text-[11px] text-amber-400 font-medium">Room {clr.roomNumber}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{clr.serviceType}</div>
                          {clr.remarks && <div className="text-[11px] text-slate-400 mt-0.5 italic">{clr.remarks}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-blue-300">{clr.hoursRendered} hrs</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-600/40 text-emerald-300">
                            <span>-{clr.demeritsDeducted} Demerits</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-medium">{clr.supervisorName}</div>
                          <div className="text-[10px] text-slate-500">{clr.completionDate}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Certified</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: FIRE SAFETY & CONFISCATED ELECTRICAL VAULT */}
      {activeModule === 'vault' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Items In Safe Custody</div>
              <div className="text-2xl font-bold text-orange-400 mt-1">
                {confiscatedItems.filter(c => c.status === 'in_safe_custody').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Locked in Dean's Vault to prevent dorm fires</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Claimed by Guardians</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {confiscatedItems.filter(c => c.status === 'claimed_by_parent').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Surrendered to parents during weekend pickup</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Fire Safety Protocol</div>
              <div className="text-xs font-semibold text-rose-300 mt-2 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Zero tolerance for electric cooking coils</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Protects all wooden furniture and residents</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item & Hazard Category</th>
                    <th className="py-3 px-4">Owner Student & Room</th>
                    <th className="py-3 px-4">Vault Locker Slot</th>
                    <th className="py-3 px-4">Confiscated By</th>
                    <th className="py-3 px-4">Custody Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredVault.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No confiscated items logged. Click "Log Confiscated Item" to record unauthorized appliances.
                      </td>
                    </tr>
                  ) : (
                    filteredVault.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                            <span>{item.itemName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 capitalize">{item.category.replace('_', ' ')}</div>
                          {item.remarks && <div className="text-[10px] text-slate-500 mt-0.5 italic">{item.remarks}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200">{item.studentName}</div>
                          <div className="text-[11px] text-amber-400 font-medium">Room {item.roomNumber}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                            {item.vaultLockerSlot}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300">{item.confiscatedBy}</div>
                          <div className="text-[10px] text-slate-500">{item.confiscatedDate}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'in_safe_custody'
                              ? 'bg-orange-950/60 border-orange-600/40 text-orange-300'
                              : item.status === 'claimed_by_parent'
                              ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
                              : 'bg-blue-950/60 border-blue-600/40 text-blue-300'
                          }`}>
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canEdit && item.status === 'in_safe_custody' && (
                            <button
                              onClick={() => updateConfiscatedItemStatus(item.id, 'claimed_by_parent')}
                              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-xs font-medium transition-all"
                            >
                              Release to Guardian
                            </button>
                          )}
                          {item.status !== 'in_safe_custody' && (
                            <span className="text-slate-500 text-[11px]">Released</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: EMERGENCY HEALTH & ALLERGY INDEX */}
      {activeModule === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Registered Medical Profiles</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {studentMedicals.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Quick lookup during late-night rounds</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Asthma Inhaler Flagged</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {studentMedicals.filter(m => m.asthmaInhalerRequired).length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Must keep inhalers accessible in rooms</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-medium">Emergency Protocol</div>
              <div className="text-xs font-semibold text-slate-200 mt-2 flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Immediate ambulance dispatch</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Emergency numbers stored for all rooms</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHealth.map(profile => (
              <div key={profile.studentId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base">{profile.studentName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Room {profile.roomNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Resident Student</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 font-extrabold text-xs flex items-center justify-center">
                      {profile.bloodType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Known Allergies:</div>
                    <div className="text-slate-200 font-medium mt-0.5">{profile.allergies || 'None'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Asthma Inhaler:</div>
                    <div className="mt-0.5">
                      {profile.asthmaInhalerRequired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/50 animate-pulse">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Not Required</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Daily Medications:</div>
                    <div className="text-slate-300 font-medium mt-0.5">{profile.dailyMedications || 'None'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Preferred Hospital:</div>
                    <div className="text-slate-300 font-medium mt-0.5">{profile.emergencyHospitalPreference || 'Adventist Hospital'}</div>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Guardian Phone:</span>
                    <strong className="text-white">{profile.parentEmergencyPhone}</strong>
                  </div>
                  {profile.notes && (
                    <span className="text-[11px] text-slate-400 italic truncate max-w-[150px]" title={profile.notes}>
                      {profile.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE MEDICAL SLIP */}
      {isMedicalModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <span>Issue Sick Bay / Medical Excuse Slip</span>
              </h2>
              <button onClick={() => setIsMedicalModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicalSlip} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Resident Student</label>
                <select
                  value={medStudentId}
                  onChange={e => setMedStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {occupants.length === 0 ? (
                    <option value="">No residents registered yet (Add in Residents tab)</option>
                  ) : (
                    occupants.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — Room {u.roomNumber || 'TBD'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medical Diagnosis / Symptoms</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Viral Pharyngitis, Flu (38.5°C), Sprained Ankle"
                  value={medDiagnosis}
                  onChange={e => setMedDiagnosis(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="medBedrest"
                  checked={medBedrest}
                  onChange={e => setMedBedrest(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                />
                <label htmlFor="medBedrest" className="text-slate-200 font-semibold cursor-pointer">
                  Confined to Dorm Bedrest (Cannot leave room)
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Excused Policies</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Morning Worship', 'Evening Worship', 'School Classes', 'Chores Duty', 'Mandatory Library'].map(item => {
                    const checked = medExcuses.includes(item);
                    return (
                      <label key={item} className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) setMedExcuses([...medExcuses, item]);
                            else setMedExcuses(medExcuses.filter(x => x !== item));
                          }}
                          className="rounded border-slate-700 text-amber-500 bg-slate-950"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attending Clinic Staff or Doctor</label>
                <input
                  type="text"
                  placeholder="e.g. Campus Clinic Nurse Joy / Dr. Perez"
                  value={medDoctor}
                  onChange={e => setMedDoctor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Care Notes & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prescribed hydration and paracetamol. Food tray to be brought by roommate."
                  value={medNotes}
                  onChange={e => setMedNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMedicalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold"
                >
                  Issue & Save Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE GATE PASS */}
      {isGatePassModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Issue Weekend Gate Pass / Leave Permit</span>
              </h2>
              <button onClick={() => setIsGatePassModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGatePass} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resident Student</label>
                <select
                  value={gateStudentId}
                  onChange={e => setGateStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {occupants.length === 0 ? (
                    <option value="">No residents registered yet (Add in Residents tab)</option>
                  ) : (
                    occupants.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — Room {u.roomNumber || 'TBD'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pass Category</label>
                  <select
                    value={gateType}
                    onChange={e => setGateType(e.target.value as GatePassRecord['passType'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="weekend_home">Weekend Home Visit</option>
                    <option value="church_event">Church Ministry / Outreach</option>
                    <option value="medical_visit">Off-Campus Medical Visit</option>
                    <option value="family_emergency">Family Emergency</option>
                    <option value="academic">Academic / School Contest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Family Residence, North Town"
                    value={gateDestination}
                    onChange={e => setGateDestination(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departure Time</label>
                  <input
                    type="text"
                    value={gateDeparture}
                    onChange={e => setGateDeparture(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Return Time</label>
                  <input
                    type="text"
                    value={gateExpectedReturn}
                    onChange={e => setGateExpectedReturn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gateConsent"
                    checked={gateParentConsent}
                    onChange={e => setGateParentConsent(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 bg-slate-950"
                  />
                  <label htmlFor="gateConsent" className="text-slate-200 font-semibold cursor-pointer">
                    Parent Consent Verified
                  </label>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-0.5">Parent Contact Phone</label>
                  <input
                    type="text"
                    value={gateParentPhone}
                    onChange={e => setGateParentPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks & Dean Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Return before 18:00 Sunday for cellphone turnover."
                  value={gateRemarks}
                  onChange={e => setGateRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGatePassModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Approve & Issue Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG DEMERIT CLEARANCE */}
      {isClearanceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span>Log Restorative Service Demerit Clearance</span>
              </h2>
              <button onClick={() => setIsClearanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClearance} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resident Student</label>
                <select
                  value={clrStudentId}
                  onChange={e => setClrStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {occupants.length === 0 ? (
                    <option value="">No residents registered yet (Add in Residents tab)</option>
                  ) : (
                    occupants.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — Room {u.roomNumber || 'TBD'} ({u.demeritPoints} Demerits)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Restorative Service Type</label>
                <select
                  value={clrServiceType}
                  onChange={e => setClrServiceType(e.target.value as DemeritClearanceLog['serviceType'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Dorm Maintenance & Sanitizing">Dorm Maintenance & Sanitizing</option>
                  <option value="Grounds Beautification">Grounds Beautification & Landscaping</option>
                  <option value="Library Duty">Library Assistance & Book Stacking</option>
                  <option value="Dining/Kitchen Help">Dining Hall & Dishwashing Help</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hours Rendered</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={clrHours}
                    onChange={e => setClrHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-amber-400 mt-1 block">Deducts {clrHours} demerit points</span>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervising Dean / Staff</label>
                  <input
                    type="text"
                    value={clrSupervisor}
                    onChange={e => setClrSupervisor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supervision Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Diligently cleaned east wing hallway and polished doors."
                  value={clrRemarks}
                  onChange={e => setClrRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClearanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Confirm & Deduct Demerits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LOG CONFISCATED ITEM */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span>Log Confiscated Banned Appliance</span>
              </h2>
              <button onClick={() => setIsVaultModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConfiscation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Student</label>
                <select
                  value={confStudentId}
                  onChange={e => setConfStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {occupants.length === 0 ? (
                    <option value="">No residents registered yet (Add in Residents tab)</option>
                  ) : (
                    occupants.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — Room {u.roomNumber || 'TBD'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Appliance / Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Immersion Water Heater Coil, Single Burner Hotplate"
                  value={confItemName}
                  onChange={e => setConfItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hazard Category</label>
                  <select
                    value={confCategory}
                    onChange={e => setConfCategory(e.target.value as ConfiscatedItemRecord['category'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="banned_cooking">Banned Cooking Appliance</option>
                    <option value="fire_hazard_wiring">Fire Hazard / Daisy-chained Wiring</option>
                    <option value="unauthorized_appliance">Unauthorized High-Wattage Gadget</option>
                    <option value="substance">Prohibited Dorm Substance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vault Locker Slot</label>
                  <input
                    type="text"
                    value={confVaultSlot}
                    onChange={e => setConfVaultSlot(e.target.value)}
                    placeholder="e.g. Vault-B2, Locker-09"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Discovery Location & Circumstances</label>
                <input
                  type="text"
                  placeholder="e.g. Found under bottom locker drawer during 06:15 inspection."
                  value={confRemarks}
                  onChange={e => setConfRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  Deposit in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: UPDATE HEALTH PROFILE */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>Update Emergency Health & Allergy Record</span>
              </h2>
              <button onClick={() => setIsHealthModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHealthProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resident Student</label>
                <select
                  value={hlthStudentId}
                  onChange={e => {
                    setHlthStudentId(e.target.value);
                    const existing = studentMedicals.find(m => m.studentId === e.target.value);
                    if (existing) {
                      setHlthBloodType(existing.bloodType);
                      setHlthAllergies(existing.allergies);
                      setHlthAsthma(existing.asthmaInhalerRequired);
                      setHlthMedications(existing.dailyMedications || '');
                      setHlthHospital(existing.emergencyHospitalPreference || '');
                      setHlthParentPhone(existing.parentEmergencyPhone);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {occupants.length === 0 ? (
                    <option value="">No residents registered yet (Add in Residents tab)</option>
                  ) : (
                    occupants.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — Room {u.roomNumber || 'TBD'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Blood Type</label>
                  <select
                    value={hlthBloodType}
                    onChange={e => setHlthBloodType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Guardian Emergency Phone</label>
                  <input
                    type="text"
                    required
                    value={hlthParentPhone}
                    onChange={e => setHlthParentPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Known Allergies (Food, Penicillin, etc.)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Seafood, Sulfa drugs"
                  value={hlthAllergies}
                  onChange={e => setHlthAllergies(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="hlthAsthma"
                  checked={hlthAsthma}
                  onChange={e => setHlthAsthma(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 bg-slate-950"
                />
                <label htmlFor="hlthAsthma" className="text-slate-200 font-semibold cursor-pointer">
                  Asthma Patient (Requires Inhaler in Room / Emergency Access)
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Daily Maintenance Medications</label>
                <input
                  type="text"
                  placeholder="e.g. Ventolin Inhaler, Antihistamines"
                  value={hlthMedications}
                  onChange={e => setHlthMedications(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Emergency Hospital Preference</label>
                <input
                  type="text"
                  value={hlthHospital}
                  onChange={e => setHlthHospital(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHealthModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Health Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
