import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  UserRole,
  Room,
  RoomInspection,
  IndividualInspectionRecord,
  AttendanceRecord,
  WorshipType,
  CurfewRecord,
  SchoolUniformLog,
  StudyHoursLog,
  CleaningDutyRecord,
  CleaningHelperCheck,
  LightsOutLog,
  CellphoneCustody,
  PhoneDepositLog,
  PhoneBorrowLog,
  Violation,
  ViolationRedemption,
  MedicalExcuseSlip,
  GatePassRecord,
  UnauthorizedExitLog,
  BadLanguageLog,
  NeighborRoomLog,
  DemeritClearanceLog,
  ConfiscatedItemRecord,
  StudentMedicalRecord,
  DormSettings,
  OverrideStamp,
} from '../types/dorm';
import {
  INITIAL_USERS,
  INITIAL_ROOMS,
  INITIAL_INSPECTIONS,
  INITIAL_ATTENDANCE,
  INITIAL_CURFEW,
  INITIAL_UNIFORM_LOGS,
  INITIAL_STUDY_LOGS,
  INITIAL_CLEANING_DUTIES,
  INITIAL_LIGHTS_OUT,
  INITIAL_CELLPHONES,
  INITIAL_PHONE_DEPOSITS,
  INITIAL_PHONE_BORROWS,
  INITIAL_VIOLATIONS,
  INITIAL_MEDICAL_SLIPS,
  INITIAL_GATE_PASSES,
  INITIAL_UNAUTHORIZED_EXITS,
  INITIAL_BAD_LANGUAGE,
  INITIAL_NEIGHBOR_ROOM_LOGS,
  INITIAL_DEMERIT_CLEARANCES,
  INITIAL_CONFISCATED_ITEMS,
  INITIAL_STUDENT_MEDICALS,
  INITIAL_SETTINGS,
} from '../data/dormSeed';
import { manilaToday, manilaTime, manilaTimeValue } from '../utils/date';
import { splitAtCutoff } from '../utils/records';
import {
  vaultCycle,
  isLateDeposit,
  describeCyclePoint,
  vaultExemptionReason,
  WEEKDAY_NAMES,
} from '../utils/phoneVault';
import {
  CheckKind,
  RoomMember,
  ViolationDraft,
  VIOLATION_DEMERITS,
  attendanceDrafts,
  badLanguageDrafts,
  cleaningDrafts,
  curfewDrafts,
  individualInspectionDrafts,
  inspectionDrafts,
  lightsOutDrafts,
  neighborRoomDrafts,
  normalizeViolations,
  phoneDepositDrafts,
  recomputeIndividualInspection,
  recomputeInspection,
  recomputeLightsOut,
  recomputeUniform,
  studyDrafts,
  unauthorizedExitDrafts,
  uniformDrafts,
  violationSourceId,
} from '../utils/checkViolations';

interface DormContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  isAuthenticated: boolean;
  loginUser: (user: User) => void;
  logout: () => void;
  users: User[];
  rooms: Room[];
  inspections: RoomInspection[];
  /** Per-resident ratings, filed one resident at a time (see saveIndividualInspection). */
  individualInspections: IndividualInspectionRecord[];
  attendance: AttendanceRecord[];
  curfewRecords: CurfewRecord[];
  uniformLogs: SchoolUniformLog[];
  studyLogs: StudyHoursLog[];
  cleaningDuties: CleaningDutyRecord[];
  lightsOutLogs: LightsOutLog[];
  cellphones: CellphoneCustody[];
  phoneDeposits: PhoneDepositLog[];
  phoneBorrows: PhoneBorrowLog[];
  violations: Violation[];
  settings: DormSettings;
  updateSettings: (updates: Partial<DormSettings>) => void;
  
  // Operational Checklist Modules
  medicalSlips: MedicalExcuseSlip[];
  saveMedicalSlip: (slip: Omit<MedicalExcuseSlip, 'id' | 'issuedAt'>) => void;
  updateMedicalSlipStatus: (id: string, status: MedicalExcuseSlip['status']) => void;

  gatePasses: GatePassRecord[];
  saveGatePass: (pass: Omit<GatePassRecord, 'id' | 'issuedAt'>) => void;
  updateGatePassStatus: (id: string, status: GatePassRecord['status'], actualReturnDate?: string) => void;

  /** Residents caught off campus with no gate pass covering the day. */
  unauthorizedExits: UnauthorizedExitLog[];
  saveUnauthorizedExit: (log: Omit<UnauthorizedExitLog, 'id'>) => void;
  /** Log a return, excuse the exit, or put a note on it after the fact. */
  updateUnauthorizedExit: (id: string, updates: Partial<Omit<UnauthorizedExitLog, 'id'>>) => void;

  /** Residents heard cursing, swearing or otherwise speaking foul language. */
  badLanguageLogs: BadLanguageLog[];
  saveBadLanguageLog: (log: Omit<BadLanguageLog, 'id'>) => void;
  /** Note an apology, excuse the report, or add to it after the fact. */
  updateBadLanguageLog: (id: string, updates: Partial<Omit<BadLanguageLog, 'id'>>) => void;

  /** Residents found in another resident's room without explicit permission. */
  neighborRoomLogs: NeighborRoomLog[];
  saveNeighborRoomLog: (log: Omit<NeighborRoomLog, 'id'>) => void;
  /** Excuse the visit, flag it again, or add to it after the fact. */
  updateNeighborRoomLog: (id: string, updates: Partial<Omit<NeighborRoomLog, 'id'>>) => void;

  /** The paper trail of redemptions, one entry per violation settled. */
  demeritClearances: DemeritClearanceLog[];

  confiscatedItems: ConfiscatedItemRecord[];
  saveConfiscatedItem: (item: Omit<ConfiscatedItemRecord, 'id'>) => void;
  updateConfiscatedItemStatus: (id: string, status: ConfiscatedItemRecord['status']) => void;

  studentMedicals: StudentMedicalRecord[];
  saveStudentMedical: (rec: StudentMedicalRecord) => void;

  // Permissions helpers
  canEdit: boolean;
  isSuperAdmin: boolean;
  isOccupant: boolean;
  isParent: boolean;
  isGuest: boolean;

  // Student & Room Management Actions
  addOccupant: (data: {
    name: string;
    email?: string;
    roomNumber: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    deviceModel?: string;
    hasPhone?: boolean;
  }) => User;
  updateOccupant: (id: string, updates: Partial<User> & { deviceModel?: string; hasPhone?: boolean }) => void;
  deleteOccupant: (id: string) => void;
  bulkImportOccupants: (list: Array<{
    name: string;
    email?: string;
    roomNumber: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    deviceModel?: string;
    hasPhone?: boolean;
  }>) => { count: number };
  addRoom: (room: {
    roomNumber: string;
    wing: 'North Wing' | 'South Wing' | 'East Wing' | 'West Wing';
    floor: number;
    capacity: number;
    captainName?: string;
  }) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  addAdminUser: (data: { name: string; email: string; phone?: string }) => { success: boolean; message: string; user?: User };
  removeAdminUser: (id: string) => { success: boolean; message: string };
  clearDemoStudents: () => void;
  restoreDemoData: () => void;

  // Actions
  loginWithGoogle: (session: { email: string; name: string; avatar?: string }) => void;
  updateUserRole: (userId: string, newRole: UserRole) => { success: boolean; message: string };
  addInspection: (insp: Omit<RoomInspection, 'id' | 'timestamp'>) => CheckSaveResult;
  /** File one resident's own inspection rating on its own (one per resident per day). */
  saveIndividualInspection: (rec: Omit<IndividualInspectionRecord, 'id' | 'timestamp'>) => CheckSaveResult;
  saveAttendanceBatch: (records: Omit<AttendanceRecord, 'id' | 'timestamp'>[]) => CheckSaveResult;
  saveCurfewRecord: (rec: Omit<CurfewRecord, 'id'>) => CheckSaveResult;
  saveUniformLog: (log: Omit<SchoolUniformLog, 'id'>) => CheckSaveResult;
  saveStudyLog: (log: Omit<StudyHoursLog, 'id'>) => CheckSaveResult;
  /** Roster a room as the day's cleaning crew (one room per day). */
  assignCleaningDuty: (date: string, roomNumber: string) => void;
  /** Record who helped and how clean the work was; logs the day's violations. */
  saveCleaningDuty: (entry: {
    date: string;
    roomNumber: string;
    helpers: CleaningHelperCheck[];
    rating: number;
    garbageDisposed: boolean;
    remarks?: string;
  }) => CheckSaveResult;
  saveLightsOutLog: (log: Omit<LightsOutLog, 'id'>) => CheckSaveResult;
  updateCellphoneStatus: (id: string, updates: Partial<CellphoneCustody>) => void;
  /** Mark a resident as keeping no phone in the dorm, or undo that. */
  setPhoneExemption: (studentId: string, exempt: boolean) => void;
  savePhoneDepositBatch: (records: Omit<PhoneDepositLog, 'id'>[], options?: { replace?: boolean }) => CheckSaveResult;
  /** Sign a deposited phone back out to its owner for a while. */
  savePhoneBorrow: (entry: Omit<PhoneBorrowLog, 'id' | 'status' | 'returnedDate' | 'returnedTime'>) => void;
  /** Take a borrowed phone back into the vault. */
  returnPhoneBorrow: (id: string, remarks?: string) => void;
  /** Hand every vaulted phone back at the end of the cycle. */
  releaseAllPhones: () => void;
  saveViolation: (viol: Omit<Violation, 'id' | 'createdAt'>) => void;
  updateViolationStatus: (id: string, status: Violation['status'], assignedRedemption?: string) => void;
  assignRedemption: (violationId: string, assignment: string) => void;
  /** Settle one violation on its own — work rendered, or a reflection written. */
  redeemViolation: (violationId: string, redemption: Omit<ViolationRedemption, 'clearedBy' | 'clearedAt'>) => void;
  /** Put a redeemed violation back on a resident's record. */
  undoViolationRedemption: (violationId: string) => void;

  /**
   * Super Admin only: change a check already on file, whoever filed it. The
   * record is re-scored and the violations it raised are filed again from the
   * corrected version; a violation already redeemed keeps its redemption.
   */
  overrideCheckRecord: (kind: CheckKind, id: string, updates: Record<string, unknown>) => void;
  /** Super Admin only: strike a check off, and everything it put on a standing. */
  deleteCheckRecord: (kind: CheckKind, id: string) => void;
  /** Super Admin only: change one violation on a resident's standing. */
  overrideViolation: (id: string, updates: Partial<Omit<Violation, 'id' | 'createdAt'>>) => void;
  /** Super Admin only: strike one violation, and the clearance that settled it, off the record. */
  deleteViolation: (id: string) => void;

  // Shared-store housekeeping
  /** Everything the devices share, for the size meter and for backups. */
  sharedStateSnapshot: () => Record<string, unknown>;
  /** Lift every dated log before `cutoff` out of the live store. */
  archiveRecordsBefore: (cutoff: string) => { archive: Record<string, unknown[]>; archivedCount: number };
  resetAllData: () => void;
}

/**
 * What a scheduled check's save actually did. A check belongs to a point in the
 * schedule — 5 AM worship on a given day, tonight's curfew, this vault cycle —
 * and that point holds one record. Saving it again leaves the record that is
 * already there alone, so `kept` counts the checks that were not overwritten.
 * Correcting a filed check is the Dean's edit, never a second save.
 */
export interface CheckSaveResult {
  /** Records newly written by this save. */
  filed: number;
  /** Checks left as they were, because the schedule already held a record. */
  kept: number;
}

const NOTHING_SAVED: CheckSaveResult = { filed: 0, kept: 0 };

const DormContext = createContext<DormContextType | null>(null);

const STORAGE_KEY_PREFIX = 'dorm_dean_v1_';

// What the vault records against a resident who keeps no phone in the dorm.
const NO_PHONE_REMARK = 'No phone in the dorm — exempt from the vault run.';

// Shared sync server (see server/index.mjs). Reports are pushed here so every
// device — laptop, phone, tablet — reads and writes the same records.
const SERVER_STATE_URL = '/api/state';
const SERVER_POLL_MS = 30000;

const TEST_USER_IDS = new Set([
  'occ-1', 'occ-2', 'occ-3', 'occ-4', 'occ-5', 'occ-6',
  'occ-7', 'occ-8', 'occ-9', 'occ-10', 'occ-11', 'occ-12', 'occ-13', 'occ-14',
  'user-admin-1', 'user-admin-2'
]);

const TEST_NAMES = new Set([
  'Joshua Santos', 'David Lim', 'Marcus Vance', 'Elijah Cruz', 'Nathaniel Reyes',
  'Christian Bautista', 'Gabriel Torrez', 'Daniel Padilla Jr.', 'Lucas Ramos',
  'Angelo Villanueva', 'Samuel Mercado', 'Benjamin Tan', 'Bro. Carlos Mendez', 'RA Mark Alvarez',
  'Daniel Kim', 'Gabriel Bautista', 'Elijah Ramos', 'Samuel Dela Cruz', 'Timothy Mercado',
  'Micah Reyes', 'Luke Garcia', 'Aaron Cruz', 'Matthew Navarro', 'David Lee', 'Dean Jelmar Orap'
]);

const TEST_LOG_IDS = new Set([
  'insp-1', 'insp-2', 'insp-3', 'insp-4', 'insp-5', 'insp-6',
  'att-1', 'att-2', 'att-3', 'att-4', 'att-5',
  'cur-1', 'cur-2', 'cur-3', 'cur-4',
  'uni-1', 'uni-2', 'uni-3',
  'std-1', 'std-2', 'std-3',
  'chr-1', 'chr-2', 'chr-3', 'chr-4', 'chr-5', 'chr-6',
  'lo-1', 'lo-2', 'lo-3',
  'ph-1', 'ph-2', 'ph-3', 'ph-4', 'ph-5', 'ph-6',
  'vio-1', 'vio-2', 'vio-3', 'vio-4',
  'med-1', 'pass-1', 'clr-1', 'conf-1'
]);

const DEAN_USER: User = {
  id: 'user-dean',
  name: 'Dean Jelmar Orapa',
  email: 'orapajelmar@gmail.com',
  role: 'superadmin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone: '+63 917 555 0101',
  demerits: 0,
  status: 'active',
};

// The single implicit super admin. Not stored in `users` — any Google account
// with this email signs in as the Dean automatically.
const SUPERADMIN_EMAIL = 'orapajelmar@gmail.com';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading key ' + key, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('Error saving key ' + key, err);
  }
}

export const DormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No preset accounts. Dean and admins are resolved only by the Google email
  // they sign in with (orapajelmar@gmail.com is the implicit super admin).
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadFromStorage<User[]>('users', INITIAL_USERS);
    // Filter out test names and IDs, safely keeping every user encoded by the user!
    return loaded.filter(
      u => !TEST_USER_IDS.has(u.id) && u.id !== 'user-dean' && u.email !== SUPERADMIN_EMAIL
    );
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const wasAuthed = loadFromStorage<boolean>('isAuthenticated', false);
    if (!wasAuthed) return DEAN_USER;
    // Preferred: restore the full persisted session (covers dean/parent/guest).
    const savedUser = loadFromStorage<User | null>('currentUser', null);
    if (savedUser && typeof savedUser.id === 'string' && !TEST_USER_IDS.has(savedUser.id)) {
      return savedUser;
    }
    // Legacy: restore from saved id.
    const savedId = loadFromStorage('currentUser_id', '');
    if (savedId && !TEST_USER_IDS.has(savedId)) {
      if (savedId === 'user-dean') return DEAN_USER;
      const loadedUsers = loadFromStorage<User[]>('users', INITIAL_USERS);
      const found = loadedUsers.find(u => u.id === savedId && !TEST_USER_IDS.has(u.id));
      if (found) return found;
    }
    return DEAN_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => loadFromStorage('isAuthenticated', false));

  const [rooms, setRooms] = useState<Room[]>(() => {
    const loaded = loadFromStorage<Room[]>('rooms', INITIAL_ROOMS);
    return loaded.map(r => ({
      ...r,
      occupantIds: (r.occupantIds || []).filter(id => !TEST_USER_IDS.has(id)),
    }));
  });

  const [inspections, setInspections] = useState<RoomInspection[]>(() => {
    const loaded = loadFromStorage<RoomInspection[]>('inspections', INITIAL_INSPECTIONS);
    return loaded.filter(i => !TEST_LOG_IDS.has(i.id) && !TEST_NAMES.has(i.inspectorName) && i.inspectorId !== 'user-admin-1');
  });

  const [individualInspections, setIndividualInspections] = useState<IndividualInspectionRecord[]>(() => {
    const loaded = loadFromStorage<IndividualInspectionRecord[]>('individualInspections', []);
    return loaded.filter(i => !TEST_LOG_IDS.has(i.id) && !TEST_USER_IDS.has(i.studentId) && !TEST_NAMES.has(i.studentName));
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const loaded = loadFromStorage<AttendanceRecord[]>('attendance', INITIAL_ATTENDANCE);
    return loaded.filter(a => !TEST_LOG_IDS.has(a.id) && !TEST_USER_IDS.has(a.studentId) && !TEST_NAMES.has(a.studentName));
  });

  const [curfewRecords, setCurfewRecords] = useState<CurfewRecord[]>(() => {
    const loaded = loadFromStorage<CurfewRecord[]>('curfew', INITIAL_CURFEW);
    return loaded.filter(c => !TEST_LOG_IDS.has(c.id) && !TEST_USER_IDS.has(c.studentId) && !TEST_NAMES.has(c.studentName));
  });

  const [uniformLogs, setUniformLogs] = useState<SchoolUniformLog[]>(() => {
    const loaded = loadFromStorage<SchoolUniformLog[]>('uniform', INITIAL_UNIFORM_LOGS);
    return loaded.filter(u => !TEST_LOG_IDS.has(u.id) && !TEST_USER_IDS.has(u.studentId) && !TEST_NAMES.has(u.studentName));
  });

  const [studyLogs, setStudyLogs] = useState<StudyHoursLog[]>(() => {
    const loaded = loadFromStorage<StudyHoursLog[]>('study', INITIAL_STUDY_LOGS);
    return loaded.filter(s => !TEST_LOG_IDS.has(s.id) && !TEST_USER_IDS.has(s.studentId) && !TEST_NAMES.has(s.studentName));
  });

  const [cleaningDuties, setCleaningDuties] = useState<CleaningDutyRecord[]>(() =>
    loadFromStorage<CleaningDutyRecord[]>('cleaning_duties', INITIAL_CLEANING_DUTIES)
  );

  const [lightsOutLogs, setLightsOutLogs] = useState<LightsOutLog[]>(() => {
    const loaded = loadFromStorage<LightsOutLog[]>('lights_out', INITIAL_LIGHTS_OUT);
    return loaded.filter(l => !TEST_LOG_IDS.has(l.id));
  });

  const [cellphones, setCellphones] = useState<CellphoneCustody[]>(() => {
    const loaded = loadFromStorage<CellphoneCustody[]>('cellphones', INITIAL_CELLPHONES);
    return loaded.filter(c => !TEST_LOG_IDS.has(c.id) && !TEST_USER_IDS.has(c.studentId) && !TEST_NAMES.has(c.studentName));
  });

  const [phoneDeposits, setPhoneDeposits] = useState<PhoneDepositLog[]>(() => {
    const loaded = loadFromStorage<PhoneDepositLog[]>('phone_deposits', INITIAL_PHONE_DEPOSITS);
    return loaded.filter(d => !TEST_USER_IDS.has(d.studentId) && !TEST_NAMES.has(d.studentName));
  });

  const [phoneBorrows, setPhoneBorrows] = useState<PhoneBorrowLog[]>(() => {
    const loaded = loadFromStorage<PhoneBorrowLog[]>('phone_borrows', INITIAL_PHONE_BORROWS);
    return loaded.filter(b => !TEST_USER_IDS.has(b.studentId) && !TEST_NAMES.has(b.studentName));
  });

  const [violations, setViolations] = useState<Violation[]>(() => {
    const loaded = normalizeViolations(loadFromStorage<Violation[]>('violations', INITIAL_VIOLATIONS));
    return loaded.filter(v => !TEST_LOG_IDS.has(v.id) && !TEST_USER_IDS.has(v.studentId) && !TEST_NAMES.has(v.studentName));
  });

  const [settings, setSettings] = useState<DormSettings>(() => ({
    ...INITIAL_SETTINGS,
    ...loadFromStorage<Partial<DormSettings>>('settings', {}),
  }));

  // Violations the Dean struck off a resident's record. Once struck, no record
  // is allowed to file that violation again — correcting the check behind it or
  // the hourly vault sweep re-files what a check implies, and a struck violation
  // has to stay off every page, not come back the next time that record is saved.
  const [struckViolationIds, setStruckViolationIds] = useState<string[]>(() =>
    loadFromStorage<string[]>('struck_violations', [])
  );

  const updateSettings = (updates: Partial<DormSettings>) => setSettings(prev => ({ ...prev, ...updates }));

  // Operational Checklist Modules
  const [medicalSlips, setMedicalSlips] = useState<MedicalExcuseSlip[]>(() => {
    const loaded = loadFromStorage<MedicalExcuseSlip[]>('medical_slips', INITIAL_MEDICAL_SLIPS);
    return loaded.filter(m => !TEST_LOG_IDS.has(m.id) && !TEST_USER_IDS.has(m.studentId) && !TEST_NAMES.has(m.studentName));
  });

  const [gatePasses, setGatePasses] = useState<GatePassRecord[]>(() => {
    const loaded = loadFromStorage<GatePassRecord[]>('gate_passes', INITIAL_GATE_PASSES);
    return loaded.filter(g => !TEST_LOG_IDS.has(g.id) && !TEST_USER_IDS.has(g.studentId) && !TEST_NAMES.has(g.studentName));
  });

  const [unauthorizedExits, setUnauthorizedExits] = useState<UnauthorizedExitLog[]>(() => {
    const loaded = loadFromStorage<UnauthorizedExitLog[]>('unauthorized_exits', INITIAL_UNAUTHORIZED_EXITS);
    return loaded.filter(e => !TEST_LOG_IDS.has(e.id) && !TEST_USER_IDS.has(e.studentId) && !TEST_NAMES.has(e.studentName));
  });

  const [badLanguageLogs, setBadLanguageLogs] = useState<BadLanguageLog[]>(() => {
    const loaded = loadFromStorage<BadLanguageLog[]>('bad_language', INITIAL_BAD_LANGUAGE);
    return loaded.filter(l => !TEST_LOG_IDS.has(l.id) && !TEST_USER_IDS.has(l.studentId) && !TEST_NAMES.has(l.studentName));
  });

  const [neighborRoomLogs, setNeighborRoomLogs] = useState<NeighborRoomLog[]>(() => {
    const loaded = loadFromStorage<NeighborRoomLog[]>('neighbor_room_logs', INITIAL_NEIGHBOR_ROOM_LOGS);
    return loaded.filter(l => !TEST_LOG_IDS.has(l.id) && !TEST_USER_IDS.has(l.studentId) && !TEST_NAMES.has(l.studentName));
  });

  const [demeritClearances, setDemeritClearances] = useState<DemeritClearanceLog[]>(() => {
    const loaded = loadFromStorage<DemeritClearanceLog[]>('demerit_clearances', INITIAL_DEMERIT_CLEARANCES);
    return loaded.filter(d => !TEST_LOG_IDS.has(d.id) && !TEST_USER_IDS.has(d.studentId) && !TEST_NAMES.has(d.studentName));
  });

  const [confiscatedItems, setConfiscatedItems] = useState<ConfiscatedItemRecord[]>(() => {
    const loaded = loadFromStorage<ConfiscatedItemRecord[]>('confiscated_items', INITIAL_CONFISCATED_ITEMS);
    return loaded.filter(c => !TEST_LOG_IDS.has(c.id) && !TEST_USER_IDS.has(c.studentId) && !TEST_NAMES.has(c.studentName));
  });

  const [studentMedicals, setStudentMedicals] = useState<StudentMedicalRecord[]>(() => {
    const loaded = loadFromStorage<StudentMedicalRecord[]>('student_medicals', INITIAL_STUDENT_MEDICALS);
    return loaded.filter(s => !TEST_USER_IDS.has(s.studentId) && !TEST_NAMES.has(s.studentName));
  });

  // Sync to local storage
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('rooms', rooms), [rooms]);
  useEffect(() => {
    saveToStorage('currentUser', currentUser);
    saveToStorage('currentUser_id', currentUser.id);
  }, [currentUser]);
  useEffect(() => saveToStorage('isAuthenticated', isAuthenticated), [isAuthenticated]);
  useEffect(() => saveToStorage('inspections', inspections), [inspections]);
  useEffect(() => saveToStorage('individual_inspections', individualInspections), [individualInspections]);
  useEffect(() => saveToStorage('attendance', attendance), [attendance]);
  useEffect(() => saveToStorage('curfew', curfewRecords), [curfewRecords]);
  useEffect(() => saveToStorage('uniform', uniformLogs), [uniformLogs]);
  useEffect(() => saveToStorage('study', studyLogs), [studyLogs]);
  useEffect(() => saveToStorage('cleaning_duties', cleaningDuties), [cleaningDuties]);
  useEffect(() => saveToStorage('lights_out', lightsOutLogs), [lightsOutLogs]);
  useEffect(() => saveToStorage('cellphones', cellphones), [cellphones]);
  useEffect(() => saveToStorage('phone_deposits', phoneDeposits), [phoneDeposits]);
  useEffect(() => saveToStorage('phone_borrows', phoneBorrows), [phoneBorrows]);
  useEffect(() => saveToStorage('violations', violations), [violations]);
  useEffect(() => saveToStorage('struck_violations', struckViolationIds), [struckViolationIds]);
  useEffect(() => saveToStorage('medical_slips', medicalSlips), [medicalSlips]);
  useEffect(() => saveToStorage('gate_passes', gatePasses), [gatePasses]);
  useEffect(() => saveToStorage('unauthorized_exits', unauthorizedExits), [unauthorizedExits]);
  useEffect(() => saveToStorage('bad_language', badLanguageLogs), [badLanguageLogs]);
  useEffect(() => saveToStorage('neighbor_room_logs', neighborRoomLogs), [neighborRoomLogs]);
  useEffect(() => saveToStorage('demerit_clearances', demeritClearances), [demeritClearances]);
  useEffect(() => saveToStorage('confiscated_items', confiscatedItems), [confiscatedItems]);
  useEffect(() => saveToStorage('student_medicals', studentMedicals), [studentMedicals]);
  useEffect(() => saveToStorage('settings', settings), [settings]);

  // ---- Cross-device sync (shared server is the source of truth) ----
  const initialPullDone = useRef(false);
  const debounceTimer = useRef<number | undefined>(undefined);
  const pushStateRef = useRef<(() => Promise<void>) | null>(null);
  // The records exactly as the server last saw them. A push that would send
  // the same bytes back is skipped — which covers the echo every device would
  // otherwise fire the moment it pulls someone else's change.
  const lastSyncedJson = useRef<string | null>(null);

  // Everything the devices share, in one object: what gets pushed to the
  // server, what the size meter measures, and what an archive is cut from.
  const sharedState = (): Record<string, unknown> => ({
    users,
    rooms,
    inspections,
    individualInspections,
    attendance,
    curfewRecords,
    uniformLogs,
    studyLogs,
    cleaningDuties,
    lightsOutLogs,
    cellphones,
    phoneDeposits,
    phoneBorrows,
    violations,
    struckViolationIds,
    medicalSlips,
    gatePasses,
    unauthorizedExits,
    badLanguageLogs,
    neighborRoomLogs,
    demeritClearances,
    confiscatedItems,
    studentMedicals,
    settings,
  });

  const pushState = async () => {
    const data = sharedState();
    const json = JSON.stringify(data);
    if (json === lastSyncedJson.current) return; // nothing actually changed
    const payload = { updatedAt: Date.now(), data };
    try {
      const res = await fetch(SERVER_STATE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const body = (await res.json()) as { updatedAt?: number };
        saveToStorage('lastPushedAt', body.updatedAt ?? Date.now());
        lastSyncedJson.current = json;
      }
    } catch {
      // Server offline — local storage still works until it comes back.
    }
  };
  pushStateRef.current = pushState;

  // Debounced push whenever the shared records change.
  useEffect(() => {
    if (!initialPullDone.current) return;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      pushStateRef.current?.();
    }, 700);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [users, rooms, inspections, individualInspections, attendance, curfewRecords, uniformLogs, studyLogs, cleaningDuties, lightsOutLogs,
        cellphones, phoneDeposits, phoneBorrows, violations, struckViolationIds, settings,
        medicalSlips, gatePasses, unauthorizedExits, badLanguageLogs, neighborRoomLogs, demeritClearances, confiscatedItems, studentMedicals]);

  // Pull the shared state on load, then poll for updates from other devices.
  // The poll itself only asks for the last-saved timestamp; the records are
  // fetched when — and only when — that timestamp moves. A store holding a
  // school year of checks is megabytes, and nobody's phone should re-download
  // it every thirty seconds to find out nothing happened.
  useEffect(() => {
    let alive = true;
    const pull = async (force = false) => {
      try {
        if (!force && initialPullDone.current) {
          const metaRes = await fetch(`${SERVER_STATE_URL}?meta=1`);
          if (metaRes.ok) {
            const meta = (await metaRes.json()) as { updatedAt?: number };
            const seen = Number(loadFromStorage('lastPushedAt', 0)) || 0;
            if ((meta.updatedAt ?? 0) <= seen) return; // nothing new to fetch
          } else if (metaRes.status !== 404) {
            return;
          }
        }

        const res = await fetch(SERVER_STATE_URL);
        if (res.status === 404) {
          // No shared data yet — seed the server with this device's records.
          if (alive) {
            initialPullDone.current = true;
            pushStateRef.current?.();
          }
          return;
        }
        if (!res.ok) {
          if (alive) initialPullDone.current = true;
          return;
        }
        const body = (await res.json()) as { updatedAt?: number; data?: Record<string, unknown> };
        if (!body?.data) {
          if (alive) initialPullDone.current = true;
          return;
        }
        const localPushed = Number(loadFromStorage('lastPushedAt', 0)) || 0;
        if ((body.updatedAt ?? 0) > localPushed && alive) {
          const d = body.data;
          saveToStorage('lastPushedAt', body.updatedAt ?? 0);
          // These are the records the server already holds, so the state
          // changes below must not bounce straight back to it.
          lastSyncedJson.current = JSON.stringify(d);
          if (d.users) setUsers(d.users as User[]);
          if (d.rooms) setRooms(d.rooms as Room[]);
          if (d.inspections) setInspections(d.inspections as RoomInspection[]);
          if (d.individualInspections) setIndividualInspections(d.individualInspections as IndividualInspectionRecord[]);
          if (d.attendance) setAttendance(d.attendance as AttendanceRecord[]);
          if (d.curfewRecords) setCurfewRecords(d.curfewRecords as CurfewRecord[]);
          if (d.uniformLogs) setUniformLogs(d.uniformLogs as SchoolUniformLog[]);
          if (d.studyLogs) setStudyLogs(d.studyLogs as StudyHoursLog[]);
          if (d.cleaningDuties) setCleaningDuties(d.cleaningDuties as CleaningDutyRecord[]);
          if (d.lightsOutLogs) setLightsOutLogs(d.lightsOutLogs as LightsOutLog[]);
          if (d.cellphones) setCellphones(d.cellphones as CellphoneCustody[]);
          if (d.phoneDeposits) setPhoneDeposits(d.phoneDeposits as PhoneDepositLog[]);
          if (d.phoneBorrows) setPhoneBorrows(d.phoneBorrows as PhoneBorrowLog[]);
          if (d.violations) setViolations(normalizeViolations(d.violations as Violation[]));
          if (Array.isArray(d.struckViolationIds)) setStruckViolationIds(d.struckViolationIds as string[]);
          if (d.medicalSlips) setMedicalSlips(d.medicalSlips as MedicalExcuseSlip[]);
          if (d.gatePasses) setGatePasses(d.gatePasses as GatePassRecord[]);
          if (d.unauthorizedExits) setUnauthorizedExits(d.unauthorizedExits as UnauthorizedExitLog[]);
          if (d.badLanguageLogs) setBadLanguageLogs(d.badLanguageLogs as BadLanguageLog[]);
          if (d.neighborRoomLogs) setNeighborRoomLogs(d.neighborRoomLogs as NeighborRoomLog[]);
          if (d.demeritClearances) setDemeritClearances(d.demeritClearances as DemeritClearanceLog[]);
          if (d.confiscatedItems) setConfiscatedItems(d.confiscatedItems as ConfiscatedItemRecord[]);
          if (d.studentMedicals) setStudentMedicals(d.studentMedicals as StudentMedicalRecord[]);
          if (d.settings) setSettings({ ...INITIAL_SETTINGS, ...(d.settings as Partial<DormSettings>) });
        }
        if (alive) initialPullDone.current = true;
      } catch {
        if (alive) initialPullDone.current = true;
      }
    };
    pull(true);
    // A backgrounded tab — a phone in a pocket between roll calls — polls
    // nothing at all, and catches up the moment it is looked at again.
    const tick = () => {
      if (!document.hidden) pull();
    };
    const id = window.setInterval(tick, SERVER_POLL_MS);
    const onVisible = () => {
      if (!document.hidden) pull();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // What a resident owes is never stored twice: it is the sum of the violations
  // he has not yet redeemed, re-totalled whenever that list moves. Probation
  // follows from the total — but a boy signed out on excused leave is away, and
  // his demerits do not change that, so that standing is left alone.
  useEffect(() => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        const userViolations = violations.filter(
          v => v.studentId === user.id && v.status !== 'cleared_service'
        );
        const totalDemerits = userViolations.reduce((sum, v) => sum + v.demerits, 0);
        const onRoll = user.role === 'occupant' && user.status !== 'excused_leave';
        return {
          ...user,
          demerits: totalDemerits,
          status: onRoll ? (totalDemerits >= 11 ? 'probation' : 'active') : user.status,
        };
      })
    );
  }, [violations]);

  const canEdit = currentUser.role === 'superadmin' || currentUser.role === 'admin';
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isOccupant = currentUser.role === 'occupant';
  const isParent = currentUser.role === 'parent';
  const isGuest = currentUser.role === 'guest';

  const logout = () => {
    setIsAuthenticated(false);
  };

  const loginUser = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Google sign-in resolves the role purely from the verified Google email:
  //   - orapajelmar@gmail.com  -> Super Admin (Dean), always
  //   - a student's record email  -> that occupant (view-only)
  //   - an admin's registered email -> that admin (write access)
  //   - a student's parentEmail  -> a read-only parent scoped to that child
  //   - anything else -> guest (bare app, no dormitory records)
  const loginWithGoogle = (session: { email: string; name: string; avatar?: string }) => {
    const email = session.email.trim().toLowerCase();
    const avatar = session.avatar;

    if (!email) return;

    if (email === SUPERADMIN_EMAIL) {
      setCurrentUser({ ...DEAN_USER, name: session.name || DEAN_USER.name, avatar: avatar || DEAN_USER.avatar });
      setIsAuthenticated(true);
      return;
    }

    const existing = users.find(u => u.email.toLowerCase() === email);
    if (existing) {
      setCurrentUser({ ...existing, avatar: avatar || existing.avatar });
      setIsAuthenticated(true);
      return;
    }

    const linkedChild = users.find(
      u => u.role === 'occupant' && u.parentEmail && u.parentEmail.toLowerCase() === email
    );
    if (linkedChild) {
      setCurrentUser({
        id: `parent-${linkedChild.id}`,
        name: session.name || `Parent of ${linkedChild.name}`,
        email,
        role: 'parent',
        relatedStudentId: linkedChild.id,
        avatar,
        phone: linkedChild.parentPhone,
        demerits: 0,
        status: 'active',
      });
      setIsAuthenticated(true);
      return;
    }

    setCurrentUser({
      id: 'guest-' + Date.now(),
      name: session.name || 'Guest',
      email,
      role: 'guest',
      avatar,
      demerits: 0,
      status: 'active',
    });
    setIsAuthenticated(true);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      return { success: false, message: 'Permission denied. Only the Super Admin (Dean) can assign roles.' };
    }
    if (userId === currentUser.id && newRole !== 'superadmin') {
      return { success: false, message: 'You cannot remove your own Super Admin access.' };
    }
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    return { success: true, message: `Role updated to ${newRole.toUpperCase()} successfully.` };
  };

  /** The residents a room-wide check falls on. */
  const roomMembers = (roomNumber: string): RoomMember[] => {
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (!room) return [];
    return room.occupantIds
      .map(id => users.find(u => u.id === id))
      .filter((u): u is User => !!u && u.role === 'occupant')
      .map(u => ({ id: u.id, name: u.name }));
  };

  /**
   * File the violations one check record implies, replacing whatever that same
   * record filed before. Ids are derived from the record, the resident and the
   * category, so the same check saved on two devices lands on one violation
   * rather than two. A violation already redeemed keeps its id, its cleared
   * status and the redemption — correcting the check behind it never asks a
   * resident to work the same demerit off twice — and one the correction removes
   * takes its clearance log with it. The redemption the Dean assigned is his
   * word, not the record's, so a correction leaves it standing too.
   */
  const syncViolationsFor = (sourceId: string, drafts: ViolationDraft[]) => {
    const stamp = manilaTime();
    const key = (v: { studentId: string; category: Violation['category'] }) => `${v.studentId}|${v.category}`;
    // A violation the Dean struck stays struck: no record may file it again. The
    // ids are derived here, so the struck id a deletion records matches the one
    // a re-saved check would file — it is skipped before it ever lands.
    const struck = new Set(struckViolationIds);
    const toFile = drafts.filter(
      d => !struck.has(`viol-${sourceId}-${d.studentId}-${d.category}`)
    );
    const surviving = new Set(toFile.map(key));
    const droppedIds = violations
      .filter(v => v.sourceId === sourceId && !surviving.has(key(v)))
      .map(v => v.id);

    setViolations(prev => {
      const priorByKey = new Map<string, Violation>(prev.filter(v => v.sourceId === sourceId).map(v => [key(v), v]));
      const filed = toFile.map<Violation>(draft => {
        const prior = priorByKey.get(key(draft));
        const redeemed = prior?.status === 'cleared_service' ? prior : undefined;
        return {
          ...draft,
          sourceId,
          id: prior?.id ?? `viol-${sourceId}-${draft.studentId}-${draft.category}`,
          status: redeemed ? 'cleared_service' : draft.status,
          redemption: redeemed?.redemption,
          assignedRedemption: prior?.assignedRedemption,
          createdAt: prior?.createdAt ?? stamp,
        };
      });
      return [...filed, ...prev.filter(v => v.sourceId !== sourceId)];
    });

    if (droppedIds.length) {
      setDemeritClearances(prev => prev.filter(c => !c.violationId || !droppedIds.includes(c.violationId)));
    }
  };

  /** Drop everything one record put on a resident's standing. */
  const clearViolationsFrom = (sourceId: string) => syncViolationsFor(sourceId, []);

  // One inspection per room per day. A room walked twice keeps the verdict from
  // the first walk; changing it is the Dean's edit, not a second inspection.
  const addInspection = (insp: Omit<RoomInspection, 'id' | 'timestamp'>): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    if (inspections.some(i => i.roomNumber === insp.roomNumber && i.date === insp.date)) {
      return { filed: 0, kept: 1 };
    }
    const record: RoomInspection = {
      ...insp,
      id: `insp-${insp.date}-${insp.roomNumber}`,
      timestamp: manilaTime(),
    };
    setInspections(prev => [record, ...prev]);
    syncViolationsFor(record.id, inspectionDrafts(record, roomMembers(record.roomNumber)));
    return { filed: 1, kept: 0 };
  };

  // One individual rating per resident per day, held separately from the room's
  // record so a dean can score a single resident on his own, as he checks him.
  // The room's walk stays the daily authoritative record for demerits; this log
  // is per-person, and a resident already rated today keeps the rating he got.
  // A resident short of a perfect 3/3 picks up his own cleanliness violation —
  // minor for a single failed item, moderate for failing all three.
  const saveIndividualInspection = (rec: Omit<IndividualInspectionRecord, 'id' | 'timestamp'>): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    if (individualInspections.some(i => i.studentId === rec.studentId && i.date === rec.date)) {
      return { filed: 0, kept: 1 };
    }
    const rating: IndividualInspectionRecord = {
      ...rec,
      id: `iinsp-${rec.date}-${rec.studentId}`,
      timestamp: manilaTime(),
    };
    setIndividualInspections(prev => [rating, ...prev]);
    syncViolationsFor(rating.id, individualInspectionDrafts(rating));
    return { filed: 1, kept: 0 };
  };

  // One roll call per resident per service per date: 5 AM worship on a given
  // morning is one check, however many times it is saved. A resident already
  // logged for that service keeps the record he has — a boy marked present as
  // he left is not made absent by a later sweep of his room — and the ids are
  // derived from the service itself, so the same roll call taken on two devices
  // lands on one record rather than two.
  const saveAttendanceBatch = (records: Omit<AttendanceRecord, 'id' | 'timestamp'>[]): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    const timeStr = manilaTime();
    const onFile = new Set(attendance.map(a => `${a.date}|${a.type}|${a.studentId}`));
    const formatted: AttendanceRecord[] = [];
    let kept = 0;
    records.forEach(r => {
      const key = `${r.date}|${r.type}|${r.studentId}`;
      if (onFile.has(key)) {
        kept += 1;
        return;
      }
      onFile.add(key);
      formatted.push({ ...r, id: `att-${r.date}-${r.type}-${r.studentId}`, timestamp: timeStr });
    });
    if (!formatted.length) return { filed: 0, kept };
    setAttendance(prev => [...formatted, ...prev]);
    // Unexcused absences, missing Bibles and improper attire are each 1 demerit.
    formatted.forEach(r => syncViolationsFor(r.id, attendanceDrafts(r)));
    return { filed: formatted.length, kept };
  };

  // One check-in per resident per night. Residents drift back in ones and twos
  // and each is logged as he arrives; the time he actually came in is the one
  // that stands, whatever a later sweep of his room says.
  const saveCurfewRecord = (rec: Omit<CurfewRecord, 'id'>): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    if (curfewRecords.some(c => c.studentId === rec.studentId && c.date === rec.date)) {
      return { filed: 0, kept: 1 };
    }
    const record: CurfewRecord = { ...rec, id: `cur-${rec.date}-${rec.studentId}` };
    setCurfewRecords(prev => [record, ...prev]);
    syncViolationsFor(record.id, curfewDrafts(record));
    return { filed: 1, kept: 0 };
  };

  // One gate clearance per resident per run, morning and afternoon each being
  // their own check. How he was turned out as he actually went through the gate
  // is what stands; a second pass over his room does not re-clear him.
  const saveUniformLog = (log: Omit<SchoolUniformLog, 'id'>): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    const session = log.session ?? 'morning';
    const filed = uniformLogs.some(
      u => u.studentId === log.studentId && u.date === log.date && (u.session ?? 'morning') === session
    );
    if (filed) return { filed: 0, kept: 1 };
    const record: SchoolUniformLog = { ...log, id: `uni-${log.date}-${session}-${log.studentId}` };
    setUniformLogs(prev => [record, ...prev]);
    syncViolationsFor(record.id, uniformDrafts(record));
    return { filed: 1, kept: 0 };
  };

  // One study check per resident per evening. A hall filling over the first half
  // hour is taken name by name, and the check taken when he arrived is the one
  // that stands.
  const saveStudyLog = (log: Omit<StudyHoursLog, 'id'>): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    if (studyLogs.some(l => l.studentId === log.studentId && l.date === log.date)) {
      return { filed: 0, kept: 1 };
    }
    const record: StudyHoursLog = { ...log, id: `sty-${log.date}-${log.studentId}` };
    setStudyLogs(prev => [record, ...prev]);
    syncViolationsFor(record.id, studyDrafts(record));
    return { filed: 1, kept: 0 };
  };

  // The cleaning rotation runs one crew per day, so rostering a room takes over
  // that date: re-rostering a day that was already checked starts it fresh.
  const assignCleaningDuty = (date: string, roomNumber: string) => {
    if (!canEdit) return;
    const existing = cleaningDuties.find(d => d.date === date);
    if (existing?.roomNumber === roomNumber) return;

    if (existing) {
      // A different room now owns the day, so the old crew's marks go with it.
      clearViolationsFrom(existing.id);
      setCleaningDuties(prev =>
        prev.map(d =>
          d.id === existing.id
            ? {
                ...d,
                roomNumber,
                helpers: [],
                rating: 5,
                garbageDisposed: true,
                status: 'assigned' as const,
                remarks: undefined,
                recordedBy: undefined,
                assignedBy: currentUser.name,
                timestamp: manilaTime(),
              }
            : d
        )
      );
      return;
    }

    const record: CleaningDutyRecord = {
      id: 'clean-' + Date.now(),
      date,
      roomNumber,
      helpers: [],
      rating: 5,
      garbageDisposed: true,
      status: 'assigned',
      assignedBy: currentUser.name,
      timestamp: manilaTime(),
    };
    setCleaningDuties(prev => [record, ...prev]);
  };

  const saveCleaningDuty = (entry: {
    date: string;
    roomNumber: string;
    helpers: CleaningHelperCheck[];
    rating: number;
    garbageDisposed: boolean;
    remarks?: string;
  }): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    const existing = cleaningDuties.find(d => d.date === entry.date);
    // Rostering the day and checking the work are two halves of one record, so
    // an assigned day is still waiting to be checked. A day already checked
    // keeps the verdict it was given.
    if (existing?.status === 'completed') return { filed: 0, kept: 1 };
    const dutyId = existing?.id ?? `clean-${entry.date}`;

    const completed: CleaningDutyRecord = {
      id: dutyId,
      date: entry.date,
      roomNumber: entry.roomNumber,
      helpers: entry.helpers,
      rating: entry.rating,
      garbageDisposed: entry.garbageDisposed,
      status: 'completed',
      remarks: entry.remarks,
      assignedBy: existing?.assignedBy ?? currentUser.name,
      recordedBy: currentUser.name,
      timestamp: manilaTime(),
    };
    setCleaningDuties(prev =>
      prev.some(d => d.id === dutyId) ? prev.map(d => (d.id === dutyId ? completed : d)) : [completed, ...prev]
    );

    syncViolationsFor(dutyId, cleaningDrafts(completed));
    return { filed: 1, kept: 0 };
  };

  // One lights-out round per room per night. Walking a corridor twice keeps
  // what the first round found.
  const saveLightsOutLog = (log: Omit<LightsOutLog, 'id'>): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;
    if (lightsOutLogs.some(l => l.roomNumber === log.roomNumber && l.date === log.date)) {
      return { filed: 0, kept: 1 };
    }
    const record: LightsOutLog = { ...log, id: `lo-${log.date}-${log.roomNumber}` };
    setLightsOutLogs(prev => [record, ...prev]);
    syncViolationsFor(record.id, lightsOutDrafts(record, roomMembers(record.roomNumber)));
    return { filed: 1, kept: 0 };
  };

  const updateCellphoneStatus = (id: string, updates: Partial<CellphoneCustody>) => {
    if (!canEdit) return;
    setCellphones(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  /** Move each resident's device to where their deposit check says it is. */
  const applyDepositsToCustody = (resolved: PhoneDepositLog[]) => {
    setCellphones(prev => {
      const updated = prev.map(c => {
        const rec = resolved.find(r => r.studentId === c.studentId);
        // Confiscated, exempted and excused devices are not part of the vault run.
        if (!rec || rec.status === 'excused') return c;
        if (c.custodyStatus === 'confiscated' || c.custodyStatus === 'exempted') return c;
        const inVault = rec.status !== 'not_deposited';
        return {
          ...c,
          turnedOverSunday: inVault,
          turnOverTime: inVault ? rec.depositTime : c.turnOverTime,
          returnedFriday: inVault ? false : c.returnedFriday,
          custodyStatus: inVault ? 'in_vault' as const : 'with_student' as const,
        };
      });
      // First deposit for a resident whose device was never registered: the
      // roll call itself puts them on the vault roster.
      const fresh = resolved
        .filter(r => r.status !== 'excused' && !prev.some(c => c.studentId === r.studentId))
        .map<CellphoneCustody>(r => ({
          id: `phone-${r.studentId}`,
          studentId: r.studentId,
          studentName: r.studentName,
          roomNumber: r.roomNumber,
          deviceModel: 'Smartphone',
          turnedOverSunday: r.status !== 'not_deposited',
          turnOverTime: r.status !== 'not_deposited' ? r.depositTime : undefined,
          returnedFriday: false,
          custodyStatus: r.status === 'not_deposited' ? 'with_student' : 'in_vault',
        }));
      return fresh.length ? [...fresh, ...updated] : updated;
    });
  };

  /**
   * A room's deposit roll call. Every check is filed against the vault cycle it
   * falls in — one record per resident per cycle — and the hand-over already on
   * file stands, so re-running a room does not re-time anybody's deposit.
   *
   * Two things still write over a record. `replace` is the deliberate act, the
   * Dean excusing a resident from the cycle. And a record the deadline logged
   * on its own yields to a real check: the sweep only ever guessed that a
   * silent resident had not handed his phone in, and a phone turning up late
   * is what actually happened.
   */
  const savePhoneDepositBatch = (
    records: Omit<PhoneDepositLog, 'id'>[],
    options?: { replace?: boolean }
  ): CheckSaveResult => {
    if (!canEdit) return NOTHING_SAVED;

    // Anything handed in past the deadline is late, whatever the dean tapped.
    const all: PhoneDepositLog[] = records.map(r => {
      const cycleDate = r.cycleDate ?? vaultCycle(r.date, r.depositTime, settings).deadlineDate;
      const late = r.status === 'deposited' && isLateDeposit(r.date, r.depositTime, settings);
      return { ...r, cycleDate, status: late ? 'late' : r.status, id: `dep-${r.studentId}-${cycleDate}` };
    });

    const heldByAPerson = (r: PhoneDepositLog) =>
      phoneDeposits.some(
        d => d.studentId === r.studentId && (d.cycleDate ?? d.date) === r.cycleDate && !d.autoLogged
      );
    const resolved = options?.replace ? all : all.filter(r => !heldByAPerson(r));
    const kept = all.length - resolved.length;
    if (!resolved.length) return { filed: 0, kept };

    const supersedes = (d: PhoneDepositLog) =>
      resolved.some(r => r.studentId === d.studentId && (d.cycleDate ?? d.date) === r.cycleDate);
    setPhoneDeposits(prev => [...resolved, ...prev.filter(d => !supersedes(d))]);
    applyDepositsToCustody(resolved);

    const dueLabel = describeCyclePoint(settings.phoneDepositDay, settings.phoneDepositTime);
    resolved.forEach(r =>
      syncViolationsFor(violationSourceId('phoneDeposit', r), phoneDepositDrafts(r, dueLabel))
    );
    return { filed: resolved.length, kept };
  };

  /**
   * Once the deadline has passed, a resident with no deposit record on file has
   * not handed their phone in, so the cycle flags them on its own. Residents
   * with no phone, an exempted or confiscated device, or an excused absence
   * over the deadline are left alone. Ids are derived from the resident and the
   * cycle, so the sweep can run on every device and still write one record.
   */
  const sweepMissingDeposits = () => {
    if (!canEdit) return;
    const cycle = vaultCycle(manilaToday(), manilaTimeValue(), settings);
    if (!cycle.deadlinePassed) return;

    const missing = users.filter(u =>
      u.role === 'occupant' &&
      !vaultExemptionReason(u, cycle.deadlineDate, { cellphones, medicalSlips, gatePasses }) &&
      !phoneDeposits.some(d => d.studentId === u.id && (d.cycleDate ?? d.date) === cycle.deadlineDate)
    );
    if (!missing.length) return;

    const dueLabel = describeCyclePoint(settings.phoneDepositDay, settings.phoneDepositTime);
    const swept: PhoneDepositLog[] = missing.map(u => ({
      id: `dep-${u.id}-${cycle.deadlineDate}`,
      date: cycle.deadlineDate,
      cycleDate: cycle.deadlineDate,
      studentId: u.id,
      studentName: u.name,
      roomNumber: u.roomNumber || '—',
      status: 'not_deposited',
      depositTime: settings.phoneDepositTime,
      autoLogged: true,
      remarks: `No deposit recorded by ${dueLabel}.`,
      recordedBy: 'Vault deadline',
    }));
    const sweptIds = new Set(swept.map(d => d.id));

    setPhoneDeposits(prev => [...swept, ...prev.filter(d => !sweptIds.has(d.id))]);
    swept.forEach(d =>
      syncViolationsFor(violationSourceId('phoneDeposit', d), [{
        date: d.date,
        studentId: d.studentId,
        studentName: d.studentName,
        roomNumber: d.roomNumber,
        category: 'cellphone_policy_breach',
        severity: 'moderate',
        description: `No phone deposit recorded for the cycle due ${dueLabel}.`,
        demerits: VIOLATION_DEMERITS,
        reportedBy: 'Vault deadline',
        status: 'pending_settlement',
      }])
    );
    setCellphones(prev =>
      prev.map(c =>
        sweptIds.has(`dep-${c.studentId}-${cycle.deadlineDate}`) && c.custodyStatus === 'in_vault'
          ? { ...c, custodyStatus: 'with_student', turnedOverSunday: false }
          : c
      )
    );
  };

  // The sweep only ever writes what the deadline implies, so it is safe to
  // re-run: on load once the shared records are in, and hourly after that.
  useEffect(() => {
    if (!canEdit) return;
    const run = () => {
      if (initialPullDone.current) sweepMissingDeposits();
    };
    const first = window.setTimeout(run, 2500);
    const hourly = window.setInterval(run, 3_600_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(hourly);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, settings, users, cellphones, phoneDeposits, medicalSlips, gatePasses]);

  /**
   * Mark a resident as keeping no phone in the dorm, or put them back into the
   * vault run. Residents whose device was never registered get a placeholder
   * entry so the exemption has somewhere to live.
   */
  const setPhoneExemption = (studentId: string, exempt: boolean) => {
    if (!canEdit) return;
    const student = users.find(u => u.id === studentId);
    setCellphones(prev => {
      const existing = prev.find(c => c.studentId === studentId);
      if (existing) {
        return prev.map(c => (c.id === existing.id
          ? {
              ...c,
              custodyStatus: exempt ? 'exempted' : 'with_student',
              remarks: exempt ? NO_PHONE_REMARK : undefined,
            }
          : c));
      }
      if (!exempt || !student) return prev;
      return [{
        id: `phone-${studentId}`,
        studentId,
        studentName: student.name,
        roomNumber: student.roomNumber || '—',
        deviceModel: 'None declared',
        turnedOverSunday: false,
        returnedFriday: false,
        custodyStatus: 'exempted',
        remarks: NO_PHONE_REMARK,
      }, ...prev];
    });
  };

  /** Sign a deposited phone back out to its owner for a while. */
  const savePhoneBorrow = (entry: Omit<PhoneBorrowLog, 'id' | 'status' | 'returnedDate' | 'returnedTime'>) => {
    if (!canEdit) return;
    const record: PhoneBorrowLog = {
      ...entry,
      id: `brw-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'out',
    };
    setPhoneBorrows(prev => [record, ...prev]);
    setCellphones(prev => {
      const existing = prev.find(c => c.studentId === entry.studentId);
      // A resident whose device was never registered: the borrow slip itself
      // puts them on the vault roster, the way the roll call does.
      if (!existing) {
        return [{
          id: `phone-${entry.studentId}`,
          studentId: entry.studentId,
          studentName: entry.studentName,
          roomNumber: entry.roomNumber,
          deviceModel: 'Smartphone',
          turnedOverSunday: false,
          returnedFriday: false,
          custodyStatus: 'borrowed',
        }, ...prev];
      }
      return prev.map(c => (c.studentId === entry.studentId
        && c.custodyStatus !== 'confiscated'
        && c.custodyStatus !== 'exempted'
        ? { ...c, custodyStatus: 'borrowed' }
        : c));
    });
  };

  /** Take a borrowed phone back into the vault. */
  const returnPhoneBorrow = (id: string, remarks?: string) => {
    if (!canEdit) return;
    const borrow = phoneBorrows.find(b => b.id === id);
    if (!borrow || borrow.status === 'returned') return;
    setPhoneBorrows(prev =>
      prev.map(b => (b.id === id
        ? { ...b, status: 'returned', returnedDate: manilaToday(), returnedTime: manilaTimeValue(), remarks: remarks || b.remarks }
        : b))
    );
    setCellphones(prev =>
      prev.map(c => (c.studentId === borrow.studentId && c.custodyStatus === 'borrowed'
        ? { ...c, custodyStatus: 'in_vault' }
        : c))
    );
  };

  /** Hand every vaulted phone back at the end of the cycle. */
  const releaseAllPhones = () => {
    if (!canEdit) return;
    const stamp = `${(WEEKDAY_NAMES[settings.phoneReleaseDay] || '').slice(0, 3)} ${manilaTime()}`;
    setCellphones(prev =>
      prev.map(c => (c.custodyStatus === 'in_vault' || c.custodyStatus === 'borrowed'
        ? { ...c, custodyStatus: 'with_student', returnedFriday: true, returnTime: stamp }
        : c))
    );
    setPhoneBorrows(prev =>
      prev.map(b => (b.status === 'out'
        ? { ...b, status: 'returned', returnedDate: manilaToday(), returnedTime: manilaTimeValue() }
        : b))
    );
  };

  /**
   * A violation written by hand rather than raised by a check. Violations a
   * check raises go through `syncViolationsFor`, which ties them to the record
   * they came from so correcting that record corrects them too.
   */
  const saveViolation = (viol: Omit<Violation, 'id' | 'createdAt'>) => {
    if (!canEdit) return;
    const newRecord: Violation = {
      ...viol,
      id: 'viol-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: manilaTime(),
    };
    setViolations(prev => [newRecord, ...prev]);
  };

  const updateViolationStatus = (id: string, status: Violation['status'], assignedRedemption?: string) => {
    if (!canEdit) return;
    setViolations(prev =>
      prev.map(v => (v.id === id ? { ...v, status, assignedRedemption: assignedRedemption || v.assignedRedemption } : v))
    );
  };

  /**
   * Set what one resident must do to work off one violation. No check decides
   * this for him: the Dean reads the violation and says whether it is work or a
   * reflection, and clearing the box takes the assignment back off.
   */
  const assignRedemption = (violationId: string, assignment: string) => {
    if (!canEdit) return;
    const text = assignment.trim();
    setViolations(prev =>
      prev.map(v => (v.id === violationId ? { ...v, assignedRedemption: text || undefined } : v))
    );
  };

  // Each violation is redeemed on its own terms: the resident either renders
  // the work it carries or writes the reflection it asks for, and only that one
  // violation clears. The clearance log keeps the paper trail, tagged with the
  // violation it settled.
  const redeemViolation = (
    violationId: string,
    redemption: Omit<ViolationRedemption, 'clearedBy' | 'clearedAt'>,
  ) => {
    if (!canEdit) return;
    const violation = violations.find(v => v.id === violationId);
    if (!violation || violation.status === 'cleared_service') return;

    const record: ViolationRedemption = {
      ...redemption,
      clearedBy: currentUser.name,
      clearedAt: new Date().toISOString(),
    };

    setViolations(prev =>
      prev.map(v => (v.id === violationId ? { ...v, status: 'cleared_service', redemption: record } : v))
    );

    const newLog: DemeritClearanceLog = {
      id: 'clr-' + Date.now(),
      studentId: violation.studentId,
      studentName: violation.studentName,
      roomNumber: violation.roomNumber,
      serviceType: record.kind === 'reflection'
        ? 'Written Reflection'
        : record.serviceType ?? 'Dorm Maintenance & Sanitizing',
      hoursRendered: record.hoursRendered ?? 0,
      demeritsDeducted: violation.demerits,
      supervisorName: record.supervisorName,
      completionDate: record.completedDate,
      remarks: record.remarks,
      violationId,
      violationCategory: violation.category,
    };
    setDemeritClearances(prev => [newLog, ...prev]);
  };

  const undoViolationRedemption = (violationId: string) => {
    if (!canEdit) return;
    setViolations(prev =>
      prev.map(v =>
        v.id === violationId ? { ...v, status: 'pending_settlement', redemption: undefined } : v
      )
    );
    setDemeritClearances(prev => prev.filter(c => c.violationId !== violationId));
  };

  // ---------------------------------------------------------------------
  // Super Admin override of a check already on file
  //
  // Administrators file checks; the Dean is the one who can go back and change
  // one afterwards, whoever took it. A corrected record keeps its place in the
  // register and carries a note of who changed it and when. Anything it worked
  // out for itself — an inspection score, a gate clearance, a lights-out
  // verdict — is recomputed, and the violations it raised are filed again from
  // the corrected record, so a resident's standing follows the correction.
  // ---------------------------------------------------------------------

  const overrideStamp = (): OverrideStamp => ({
    overriddenBy: currentUser.name,
    overriddenAt: new Date().toISOString(),
  });

  const depositDueLabel = () => describeCyclePoint(settings.phoneDepositDay, settings.phoneDepositTime);

  const overrideCheckRecord = (kind: CheckKind, id: string, updates: Record<string, unknown>) => {
    if (!isSuperAdmin) return;
    const stamp = overrideStamp();

    switch (kind) {
      case 'inspection': {
        const current = inspections.find(r => r.id === id);
        if (!current) return;
        const next = recomputeInspection({ ...current, ...updates, ...stamp } as RoomInspection);
        setInspections(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, inspectionDrafts(next, roomMembers(next.roomNumber)));
        return;
      }
      case 'individualInspection': {
        const current = individualInspections.find(r => r.id === id);
        if (!current) return;
        const next = recomputeIndividualInspection({ ...current, ...updates, ...stamp } as IndividualInspectionRecord);
        setIndividualInspections(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, individualInspectionDrafts(next));
        return;
      }
      case 'attendance': {
        const current = attendance.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as AttendanceRecord;
        setAttendance(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, attendanceDrafts(next));
        return;
      }
      case 'curfew': {
        const current = curfewRecords.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as CurfewRecord;
        setCurfewRecords(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, curfewDrafts(next));
        return;
      }
      case 'uniform': {
        const current = uniformLogs.find(r => r.id === id);
        if (!current) return;
        const next = recomputeUniform({ ...current, ...updates, ...stamp } as SchoolUniformLog);
        setUniformLogs(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, uniformDrafts(next));
        return;
      }
      case 'study': {
        const current = studyLogs.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as StudyHoursLog;
        setStudyLogs(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, studyDrafts(next));
        return;
      }
      case 'cleaning': {
        const current = cleaningDuties.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as CleaningDutyRecord;
        setCleaningDuties(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, cleaningDrafts(next));
        return;
      }
      case 'lightsOut': {
        const current = lightsOutLogs.find(r => r.id === id);
        if (!current) return;
        const next = recomputeLightsOut({ ...current, ...updates, ...stamp } as LightsOutLog);
        setLightsOutLogs(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, lightsOutDrafts(next, roomMembers(next.roomNumber)));
        return;
      }
      case 'unauthorizedExit': {
        const current = unauthorizedExits.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as UnauthorizedExitLog;
        setUnauthorizedExits(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, unauthorizedExitDrafts(next));
        return;
      }
      case 'badLanguage': {
        const current = badLanguageLogs.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as BadLanguageLog;
        setBadLanguageLogs(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, badLanguageDrafts(next));
        return;
      }
      case 'neighborRoom': {
        const current = neighborRoomLogs.find(r => r.id === id);
        if (!current) return;
        const next = { ...current, ...updates, ...stamp } as NeighborRoomLog;
        setNeighborRoomLogs(prev => prev.map(r => (r.id === id ? next : r)));
        syncViolationsFor(next.id, neighborRoomDrafts(next));
        return;
      }
      case 'phoneDeposit': {
        const current = phoneDeposits.find(r => r.id === id);
        if (!current) return;
        // The Dean's word settles it, so the deadline's automatic late/missing
        // verdict is not re-applied over the top of the correction.
        const next = { ...current, ...updates, ...stamp, autoLogged: false } as PhoneDepositLog;
        setPhoneDeposits(prev => prev.map(r => (r.id === id ? next : r)));
        applyDepositsToCustody([next]);
        syncViolationsFor(violationSourceId('phoneDeposit', next), phoneDepositDrafts(next, depositDueLabel()));
        return;
      }
    }
  };

  /** Strike a check off the register, and everything it put on a standing. */
  const deleteCheckRecord = (kind: CheckKind, id: string) => {
    if (!isSuperAdmin) return;
    const drop = <T extends { id: string }>(list: T[]) => list.filter(r => r.id !== id);

    switch (kind) {
      case 'inspection': setInspections(drop); break;
      case 'individualInspection': setIndividualInspections(drop); break;
      case 'attendance': setAttendance(drop); break;
      case 'curfew': setCurfewRecords(drop); break;
      case 'uniform': setUniformLogs(drop); break;
      case 'study': setStudyLogs(drop); break;
      case 'cleaning': setCleaningDuties(drop); break;
      case 'lightsOut': setLightsOutLogs(drop); break;
      case 'unauthorizedExit': setUnauthorizedExits(drop); break;
      case 'badLanguage': setBadLanguageLogs(drop); break;
      case 'neighborRoom': setNeighborRoomLogs(drop); break;
      case 'phoneDeposit': {
        const current = phoneDeposits.find(r => r.id === id);
        setPhoneDeposits(drop);
        if (current) clearViolationsFrom(violationSourceId('phoneDeposit', current));
        return;
      }
    }
    clearViolationsFrom(id);
  };

  /**
   * Super Admin only: change one violation on a resident's standing — its
   * wording, its weight, even what it was for. The resident's total re-totals
   * from the corrected list, so changing the demerits changes what he owes.
   */
  const overrideViolation = (id: string, updates: Partial<Omit<Violation, 'id' | 'createdAt'>>) => {
    if (!isSuperAdmin) return;
    setViolations(prev => prev.map(v => (v.id === id ? { ...v, ...updates } : v)));
  };

  /**
   * Super Admin only: strike one violation off a resident's record entirely.
   * Whatever it owed leaves the standing, and the clearance that settled it
   * goes with it. The strike is remembered, so no check behind the violation
   * can re-file it when it is next saved.
   */
  const deleteViolation = (id: string) => {
    if (!isSuperAdmin) return;
    setStruckViolationIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setViolations(prev => prev.filter(v => v.id !== id));
    setDemeritClearances(prev => prev.filter(c => c.violationId !== id));
  };

  const sharedStateSnapshot = () => sharedState();

  // End-of-term housekeeping: the dated logs before the cutoff leave the live
  // store so every device keeps syncing a small payload. The roster, rooms,
  // phone register, medical sheets and schedules are what the dormitory is
  // today, so they always stay.
  const archiveRecordsBefore = (cutoff: string) => {
    if (!isSuperAdmin) return { archive: {}, archivedCount: 0 };
    const { archived, kept, archivedCount } = splitAtCutoff(sharedState(), cutoff);
    if (archivedCount === 0) return { archive: archived, archivedCount: 0 };

    setInspections(kept.inspections as RoomInspection[]);
    setIndividualInspections(kept.individualInspections as IndividualInspectionRecord[]);
    setAttendance(kept.attendance as AttendanceRecord[]);
    setCurfewRecords(kept.curfewRecords as CurfewRecord[]);
    setUniformLogs(kept.uniformLogs as SchoolUniformLog[]);
    setStudyLogs(kept.studyLogs as StudyHoursLog[]);
    setCleaningDuties(kept.cleaningDuties as CleaningDutyRecord[]);
    setLightsOutLogs(kept.lightsOutLogs as LightsOutLog[]);
    setPhoneDeposits(kept.phoneDeposits as PhoneDepositLog[]);
    setPhoneBorrows(kept.phoneBorrows as PhoneBorrowLog[]);
    setViolations(kept.violations as Violation[]);
    setMedicalSlips(kept.medicalSlips as MedicalExcuseSlip[]);
    setGatePasses(kept.gatePasses as GatePassRecord[]);
    setUnauthorizedExits(kept.unauthorizedExits as UnauthorizedExitLog[]);
    setBadLanguageLogs(kept.badLanguageLogs as BadLanguageLog[]);
    setNeighborRoomLogs(kept.neighborRoomLogs as NeighborRoomLog[]);
    setDemeritClearances(kept.demeritClearances as DemeritClearanceLog[]);
    setConfiscatedItems(kept.confiscatedItems as ConfiscatedItemRecord[]);

    return { archive: archived, archivedCount };
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setRooms(INITIAL_ROOMS);
    setInspections(INITIAL_INSPECTIONS);
    setIndividualInspections([]);
    setAttendance(INITIAL_ATTENDANCE);
    setCurfewRecords(INITIAL_CURFEW);
    setUniformLogs(INITIAL_UNIFORM_LOGS);
    setStudyLogs(INITIAL_STUDY_LOGS);
    setCleaningDuties(INITIAL_CLEANING_DUTIES);
    setLightsOutLogs(INITIAL_LIGHTS_OUT);
    setCellphones(INITIAL_CELLPHONES);
    setPhoneDeposits(INITIAL_PHONE_DEPOSITS);
    setPhoneBorrows(INITIAL_PHONE_BORROWS);
    setViolations(INITIAL_VIOLATIONS);
    setStruckViolationIds([]);
    localStorage.clear();
  };

  const addOccupant = (data: {
    name: string;
    email?: string;
    roomNumber: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    deviceModel?: string;
    hasPhone?: boolean;
  }): User => {
    const newId = 'occ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const email = data.email && data.email.trim().length > 0 
      ? data.email.trim().toLowerCase() 
      : `${data.name.toLowerCase().replace(/\s+/g, '.')}@dorm.edu`;
    const newStudent: User = {
      id: newId,
      name: data.name,
      email: email,
      role: 'occupant',
      roomNumber: data.roomNumber,
      phone: data.phone || '',
      parentName: data.parentName || '',
      parentPhone: data.parentPhone || '',
      parentEmail: data.parentEmail ? data.parentEmail.trim().toLowerCase() : undefined,
      demerits: 0,
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    };

    setUsers(prev => [...prev, newStudent]);

    // Add to room occupants
    setRooms(prevRooms =>
      prevRooms.map(r => {
        if (r.roomNumber === data.roomNumber) {
          return {
            ...r,
            occupantIds: r.occupantIds.includes(newId) ? r.occupantIds : [...r.occupantIds, newId],
          };
        }
        return r;
      })
    );

    // Vault roster entry: a resident either keeps a phone the vault expects
    // every cycle, or keeps none at all and sits out the vault run. A new
    // resident's phone is still with them until the first deposit check.
    const hasPhone = data.hasPhone !== false;
    const newPhoneEntry: CellphoneCustody = {
      id: `phone-${newId}`,
      studentId: newId,
      studentName: data.name,
      roomNumber: data.roomNumber,
      deviceModel: hasPhone ? (data.deviceModel?.trim() || 'Smartphone') : 'None declared',
      turnedOverSunday: false,
      returnedFriday: false,
      custodyStatus: hasPhone ? 'with_student' : 'exempted',
      remarks: hasPhone ? undefined : NO_PHONE_REMARK,
    };
    setCellphones(prev => [newPhoneEntry, ...prev]);

    return newStudent;
  };

  const updateOccupant = (id: string, updates: Partial<User> & { deviceModel?: string; hasPhone?: boolean }) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          return { ...u, ...updates };
        }
        return u;
      })
    );

    const phoneEdited = updates.deviceModel !== undefined || updates.hasPhone !== undefined;
    if (updates.name || updates.roomNumber || phoneEdited) {
      const student = users.find(u => u.id === id);
      const name = updates.name || student?.name || '';
      const room = updates.roomNumber || student?.roomNumber || '—';
      setCellphones(prev => {
        const existing = prev.find(c => c.studentId === id);
        // What the edit says about the resident's phone, falling back to what
        // the vault already has on record.
        const hasPhone = updates.hasPhone ?? (existing ? existing.custodyStatus !== 'exempted' : true);
        const model = !hasPhone
          ? 'None declared'
          : updates.deviceModel?.trim()
            || (existing && existing.custodyStatus !== 'exempted' ? existing.deviceModel : '')
            || 'Smartphone';

        if (!existing) {
          // A resident the vault never registered: only a phone edit is reason
          // enough to open a record for them.
          if (!phoneEdited) return prev;
          return [{
            id: `phone-${id}`,
            studentId: id,
            studentName: name,
            roomNumber: room,
            deviceModel: model,
            turnedOverSunday: false,
            returnedFriday: false,
            custodyStatus: hasPhone ? 'with_student' : 'exempted',
            remarks: hasPhone ? undefined : NO_PHONE_REMARK,
          }, ...prev];
        }

        return prev.map(c => {
          if (c.studentId !== id) return c;
          return {
            ...c,
            studentName: name,
            roomNumber: room,
            deviceModel: model,
            // Declaring "no phone" pulls the resident out of the vault run;
            // declaring one puts them back, without disturbing a phone the
            // vault is already holding.
            custodyStatus: !hasPhone
              ? 'exempted'
              : c.custodyStatus === 'exempted' ? 'with_student' : c.custodyStatus,
            remarks: !hasPhone ? NO_PHONE_REMARK : c.custodyStatus === 'exempted' ? undefined : c.remarks,
          };
        });
      });
    }

    if (updates.roomNumber) {
      setRooms(prevRooms =>
        prevRooms.map(r => {
          const hadStudent = r.occupantIds.includes(id);
          const shouldHaveStudent = r.roomNumber === updates.roomNumber;
          if (hadStudent && !shouldHaveStudent) {
            return { ...r, occupantIds: r.occupantIds.filter(x => x !== id) };
          }
          if (!hadStudent && shouldHaveStudent) {
            return { ...r, occupantIds: [...r.occupantIds, id] };
          }
          return r;
        })
      );
    }
  };

  const deleteOccupant = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setCellphones(prev => prev.filter(c => c.studentId !== id));
    setRooms(prevRooms =>
      prevRooms.map(r => ({
        ...r,
        occupantIds: r.occupantIds.filter(x => x !== id),
      }))
    );
  };

  const bulkImportOccupants = (list: Array<{
    name: string;
    email?: string;
    roomNumber: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    deviceModel?: string;
    hasPhone?: boolean;
  }>) => {
    let count = 0;
    list.forEach(item => {
      if (item.name && item.roomNumber) {
        addOccupant(item);
        count++;
      }
    });
    return { count };
  };

  const addRoom = (roomData: {
    roomNumber: string;
    wing: 'North Wing' | 'South Wing' | 'East Wing' | 'West Wing';
    floor: number;
    capacity: number;
    captainName?: string;
  }) => {
    const existing = rooms.find(r => r.roomNumber === roomData.roomNumber);
    if (existing) return;
    const newRoom: Room = {
      id: 'room-' + Date.now(),
      roomNumber: roomData.roomNumber,
      wing: roomData.wing,
      floor: roomData.floor,
      capacity: roomData.capacity,
      captainName: roomData.captainName || 'TBD',
      occupantIds: [],
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));
  };

  const deleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  // Operational Checklist Handlers
  const saveMedicalSlip = (slip: Omit<MedicalExcuseSlip, 'id' | 'issuedAt'>) => {
    const newSlip: MedicalExcuseSlip = {
      ...slip,
      id: 'med-' + Date.now(),
      issuedAt: new Date().toISOString(),
    };
    setMedicalSlips(prev => [newSlip, ...prev]);
  };

  const updateMedicalSlipStatus = (id: string, status: MedicalExcuseSlip['status']) => {
    setMedicalSlips(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const saveGatePass = (pass: Omit<GatePassRecord, 'id' | 'issuedAt'>) => {
    const newPass: GatePassRecord = {
      ...pass,
      id: 'gate-' + Date.now(),
      issuedAt: new Date().toISOString(),
    };
    setGatePasses(prev => [newPass, ...prev]);
  };

  const updateGatePassStatus = (id: string, status: GatePassRecord['status'], actualReturnDate?: string) => {
    setGatePasses(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          status,
          actualReturnDate: actualReturnDate || (status === 'returned_on_time' ? new Date().toISOString() : p.actualReturnDate),
        };
      })
    );
  };

  /**
   * File a resident who went off campus with no gate pass. The record is the
   * dormitory's own account of the exit, so it carries its demerit the moment it
   * is filed — and withdraws it again if the Dean later excuses it.
   */
  const saveUnauthorizedExit = (log: Omit<UnauthorizedExitLog, 'id'>) => {
    if (!canEdit) return;
    const record: UnauthorizedExitLog = { ...log, id: `exit-${Date.now()}-${log.studentId}` };
    setUnauthorizedExits(prev => [record, ...prev]);
    syncViolationsFor(record.id, unauthorizedExitDrafts(record));
  };

  /**
   * The follow-up on an exit already on file: the resident walked back in, or a
   * pass turned up and the exit is excused. Either way the demerit the record
   * carries is re-derived from what it now says.
   */
  const updateUnauthorizedExit = (id: string, updates: Partial<Omit<UnauthorizedExitLog, 'id'>>) => {
    if (!canEdit) return;
    const current = unauthorizedExits.find(e => e.id === id);
    if (!current) return;
    const next: UnauthorizedExitLog = { ...current, ...updates };
    setUnauthorizedExits(prev => prev.map(e => (e.id === id ? next : e)));
    syncViolationsFor(next.id, unauthorizedExitDrafts(next));
  };

  /**
   * File a resident heard cursing, swearing or otherwise speaking foul
   * language. Like every other check, the record carries its demerit the moment
   * it is filed, and withdraws it again if the Dean later excuses it.
   */
  const saveBadLanguageLog = (log: Omit<BadLanguageLog, 'id'>) => {
    if (!canEdit) return;
    const record: BadLanguageLog = { ...log, id: `lang-${Date.now()}-${log.studentId}` };
    setBadLanguageLogs(prev => [record, ...prev]);
    syncViolationsFor(record.id, badLanguageDrafts(record));
  };

  /**
   * The follow-up on a report already on file: the resident apologized, the
   * parents were told, or the words turn out not to have been theirs. The demerit
   * the record carries is re-derived from what it now says.
   */
  const updateBadLanguageLog = (id: string, updates: Partial<Omit<BadLanguageLog, 'id'>>) => {
    if (!canEdit) return;
    const current = badLanguageLogs.find(l => l.id === id);
    if (!current) return;
    const next: BadLanguageLog = { ...current, ...updates };
    setBadLanguageLogs(prev => prev.map(l => (l.id === id ? next : l)));
    syncViolationsFor(next.id, badLanguageDrafts(next));
  };

  /**
   * File a resident found in another resident's room without explicit
   * permission. The record carries its demerit the moment it is filed, and
   * withdraws it again if the Dean later excuses it — which is how the register
   * keeps every visit on file for tracing, permitted or not.
   */
  const saveNeighborRoomLog = (log: Omit<NeighborRoomLog, 'id'>) => {
    if (!canEdit) return;
    const record: NeighborRoomLog = { ...log, id: `nb-${Date.now()}-${log.studentId}` };
    setNeighborRoomLogs(prev => [record, ...prev]);
    syncViolationsFor(record.id, neighborRoomDrafts(record));
  };

  /**
   * The follow-up on a visit already on file: the room's occupant had invited
   * the resident over after all, or the visit is back to standing as
   * unauthorized. The demerit the record carries is re-derived from what it
   * now says.
   */
  const updateNeighborRoomLog = (id: string, updates: Partial<Omit<NeighborRoomLog, 'id'>>) => {
    if (!canEdit) return;
    const current = neighborRoomLogs.find(l => l.id === id);
    if (!current) return;
    const next: NeighborRoomLog = { ...current, ...updates };
    setNeighborRoomLogs(prev => prev.map(l => (l.id === id ? next : l)));
    syncViolationsFor(next.id, neighborRoomDrafts(next));
  };

  const saveConfiscatedItem = (item: Omit<ConfiscatedItemRecord, 'id'>) => {
    const newItem: ConfiscatedItemRecord = {
      ...item,
      id: 'conf-' + Date.now(),
    };
    setConfiscatedItems(prev => [newItem, ...prev]);
  };

  const updateConfiscatedItemStatus = (id: string, status: ConfiscatedItemRecord['status']) => {
    setConfiscatedItems(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const saveStudentMedical = (rec: StudentMedicalRecord) => {
    setStudentMedicals(prev => {
      const exists = prev.some(m => m.studentId === rec.studentId);
      if (exists) {
        return prev.map(m => m.studentId === rec.studentId ? rec : m);
      }
      return [...prev, rec];
    });
  };

  const addAdminUser = (data: { name: string; email: string; phone?: string }) => {
    if (!isSuperAdmin) {
      return { success: false, message: 'Only the Super Admin (Dean) can add new Admin staff.' };
    }
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.role === 'admin' || existing.role === 'superadmin') {
        return { success: false, message: `User ${cleanEmail} is already an ${existing.role.toUpperCase()}.` };
      }
      setUsers(prev => prev.map(u => u.id === existing.id ? { ...u, role: 'admin', name: data.name || u.name, phone: data.phone || u.phone } : u));
      return { success: true, message: `Existing user promoted to ADMIN successfully.` };
    }

    const newAdmin: User = {
      id: 'admin-' + Date.now(),
      name: data.name,
      email: cleanEmail,
      role: 'admin',
      phone: data.phone || '',
      demerits: 0,
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    };
    setUsers(prev => [newAdmin, ...prev]);
    return { success: true, message: `Admin ${cleanEmail} registered successfully. They can now log in via Google OAuth or Persona Switcher.`, user: newAdmin };
  };

  const removeAdminUser = (id: string) => {
    if (!isSuperAdmin) {
      return { success: false, message: 'Permission denied.' };
    }
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'User not found.' };
    if (target.role === 'superadmin' || target.email.toLowerCase() === 'orapajelmar@gmail.com') {
      return { success: false, message: 'Super Admin Dean cannot be removed.' };
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true, message: `Admin ${target.name} has been removed.` };
  };

  const clearDemoStudents = () => {
    setUsers(prev => prev.filter(u => u.role !== 'occupant'));
    setInspections([]);
    setIndividualInspections([]);
    setAttendance([]);
    setCurfewRecords([]);
    setUniformLogs([]);
    setStudyLogs([]);
    setCleaningDuties([]);
    setLightsOutLogs([]);
    setCellphones([]);
    setPhoneDeposits([]);
    setPhoneBorrows([]);
    setViolations([]);
    setStruckViolationIds([]);
    setMedicalSlips([]);
    setGatePasses([]);
    setUnauthorizedExits([]);
    setBadLanguageLogs([]);
    setNeighborRoomLogs([]);
    setDemeritClearances([]);
    setConfiscatedItems([]);
    setRooms(prev => prev.map(r => ({ ...r, occupantIds: [] })));
  };

  const restoreDemoData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setIsAuthenticated(true);
    setRooms(INITIAL_ROOMS);
    setInspections(INITIAL_INSPECTIONS);
    setIndividualInspections([]);
    setAttendance(INITIAL_ATTENDANCE);
    setCurfewRecords(INITIAL_CURFEW);
    setUniformLogs(INITIAL_UNIFORM_LOGS);
    setStudyLogs(INITIAL_STUDY_LOGS);
    setCleaningDuties(INITIAL_CLEANING_DUTIES);
    setLightsOutLogs(INITIAL_LIGHTS_OUT);
    setCellphones(INITIAL_CELLPHONES);
    setPhoneDeposits(INITIAL_PHONE_DEPOSITS);
    setPhoneBorrows(INITIAL_PHONE_BORROWS);
    setViolations(INITIAL_VIOLATIONS);
    setStruckViolationIds([]);
    setMedicalSlips(INITIAL_MEDICAL_SLIPS);
    setGatePasses(INITIAL_GATE_PASSES);
    setUnauthorizedExits(INITIAL_UNAUTHORIZED_EXITS);
    setBadLanguageLogs(INITIAL_BAD_LANGUAGE);
    setNeighborRoomLogs(INITIAL_NEIGHBOR_ROOM_LOGS);
    setDemeritClearances(INITIAL_DEMERIT_CLEARANCES);
    setConfiscatedItems(INITIAL_CONFISCATED_ITEMS);
    setStudentMedicals(INITIAL_STUDENT_MEDICALS);
  };

  return (
    <DormContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        loginUser,
        logout,
        users,
        rooms,
        inspections,
        individualInspections,
        attendance,
        curfewRecords,
        uniformLogs,
        studyLogs,
        cleaningDuties,
        lightsOutLogs,
        cellphones,
        phoneDeposits,
        phoneBorrows,
        violations,
        settings,
        updateSettings,
        medicalSlips,
        saveMedicalSlip,
        updateMedicalSlipStatus,
        gatePasses,
        saveGatePass,
        updateGatePassStatus,
        unauthorizedExits,
        saveUnauthorizedExit,
        updateUnauthorizedExit,
        badLanguageLogs,
        saveBadLanguageLog,
        updateBadLanguageLog,
        neighborRoomLogs,
        saveNeighborRoomLog,
        updateNeighborRoomLog,
        demeritClearances,
        confiscatedItems,
        saveConfiscatedItem,
        updateConfiscatedItemStatus,
        studentMedicals,
        saveStudentMedical,
        overrideCheckRecord,
        deleteCheckRecord,
        overrideViolation,
        deleteViolation,
        canEdit,
        isSuperAdmin,
        isOccupant,
        isParent,
        isGuest,
        loginWithGoogle,
        updateUserRole,
        addInspection,
        saveIndividualInspection,
        saveAttendanceBatch,
        saveCurfewRecord,
        saveUniformLog,
        saveStudyLog,
        assignCleaningDuty,
        saveCleaningDuty,
        saveLightsOutLog,
        updateCellphoneStatus,
        setPhoneExemption,
        savePhoneDepositBatch,
        savePhoneBorrow,
        returnPhoneBorrow,
        releaseAllPhones,
        saveViolation,
        updateViolationStatus,
        assignRedemption,
        redeemViolation,
        undoViolationRedemption,
        sharedStateSnapshot,
        archiveRecordsBefore,
        resetAllData,
        addOccupant,
        updateOccupant,
        deleteOccupant,
        bulkImportOccupants,
        addRoom,
        updateRoom,
        deleteRoom,
        addAdminUser,
        removeAdminUser,
        clearDemoStudents,
        restoreDemoData,
      }}
    >
      {children}
    </DormContext.Provider>
  );
};

export const useDorm = () => {
  const ctx = useContext(DormContext);
  if (!ctx) {
    throw new Error('useDorm must be used within a DormProvider');
  }
  return ctx;
};
