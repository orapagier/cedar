import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  UserRole,
  Room,
  RoomInspection,
  AttendanceRecord,
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
  MedicalExcuseSlip,
  GatePassRecord,
  DemeritClearanceLog,
  ConfiscatedItemRecord,
  StudentMedicalRecord,
  DormSettings,
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
  INITIAL_DEMERIT_CLEARANCES,
  INITIAL_CONFISCATED_ITEMS,
  INITIAL_STUDENT_MEDICALS,
  INITIAL_SETTINGS,
  worshipLabel,
} from '../data/dormSeed';
import { manilaToday, manilaTime, manilaTimeValue } from '../utils/date';
import {
  vaultCycle,
  isLateDeposit,
  describeCyclePoint,
  vaultExemptionReason,
  WEEKDAY_NAMES,
} from '../utils/phoneVault';

interface DormContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  isAuthenticated: boolean;
  loginUser: (user: User) => void;
  logout: () => void;
  users: User[];
  rooms: Room[];
  inspections: RoomInspection[];
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

  demeritClearances: DemeritClearanceLog[];
  saveDemeritClearance: (log: Omit<DemeritClearanceLog, 'id'>) => void;

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
  addInspection: (insp: Omit<RoomInspection, 'id' | 'timestamp'>) => void;
  saveAttendanceBatch: (records: Omit<AttendanceRecord, 'id' | 'timestamp'>[]) => void;
  saveCurfewRecord: (rec: Omit<CurfewRecord, 'id'>) => void;
  saveUniformLog: (log: Omit<SchoolUniformLog, 'id'>) => void;
  saveStudyLog: (log: Omit<StudyHoursLog, 'id'>) => void;
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
  }) => void;
  saveLightsOutLog: (log: Omit<LightsOutLog, 'id'>) => void;
  updateCellphoneStatus: (id: string, updates: Partial<CellphoneCustody>) => void;
  /** Mark a resident as keeping no phone in the dorm, or undo that. */
  setPhoneExemption: (studentId: string, exempt: boolean) => void;
  savePhoneDepositBatch: (records: Omit<PhoneDepositLog, 'id'>[]) => void;
  /** Sign a deposited phone back out to its owner for a while. */
  savePhoneBorrow: (entry: Omit<PhoneBorrowLog, 'id' | 'status' | 'returnedDate' | 'returnedTime'>) => void;
  /** Take a borrowed phone back into the vault. */
  returnPhoneBorrow: (id: string, remarks?: string) => void;
  /** Hand every vaulted phone back at the end of the cycle. */
  releaseAllPhones: () => void;
  saveViolation: (viol: Omit<Violation, 'id' | 'createdAt'>) => void;
  updateViolationStatus: (id: string, status: Violation['status'], actionRequired?: string) => void;
  resetAllData: () => void;
}

const DormContext = createContext<DormContextType | null>(null);

const STORAGE_KEY_PREFIX = 'dorm_dean_v1_';

// Every infraction is worth the same single point, whatever its severity, so a
// resident's total reads as "how many rules were broken" and nothing else.
const VIOLATION_POINTS = 1;

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
  demeritPoints: 0,
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
    const loaded = loadFromStorage<Violation[]>('violations', INITIAL_VIOLATIONS);
    return loaded.filter(v => !TEST_LOG_IDS.has(v.id) && !TEST_USER_IDS.has(v.studentId) && !TEST_NAMES.has(v.studentName));
  });

  const [settings, setSettings] = useState<DormSettings>(() => ({
    ...INITIAL_SETTINGS,
    ...loadFromStorage<Partial<DormSettings>>('settings', {}),
  }));

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
  useEffect(() => saveToStorage('medical_slips', medicalSlips), [medicalSlips]);
  useEffect(() => saveToStorage('gate_passes', gatePasses), [gatePasses]);
  useEffect(() => saveToStorage('demerit_clearances', demeritClearances), [demeritClearances]);
  useEffect(() => saveToStorage('confiscated_items', confiscatedItems), [confiscatedItems]);
  useEffect(() => saveToStorage('student_medicals', studentMedicals), [studentMedicals]);
  useEffect(() => saveToStorage('settings', settings), [settings]);

  // ---- Cross-device sync (shared server is the source of truth) ----
  const initialPullDone = useRef(false);
  const debounceTimer = useRef<number | undefined>(undefined);
  const pushStateRef = useRef<(() => Promise<void>) | null>(null);

  const pushState = async () => {
    const payload = {
      updatedAt: Date.now(),
      data: {
        users,
        rooms,
        inspections,
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
        medicalSlips,
        gatePasses,
        demeritClearances,
        confiscatedItems,
        studentMedicals,
        settings,
      },
    };
    try {
      const res = await fetch(SERVER_STATE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const body = (await res.json()) as { updatedAt?: number };
        saveToStorage('lastPushedAt', body.updatedAt ?? Date.now());
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
  }, [users, rooms, inspections, attendance, curfewRecords, uniformLogs, studyLogs, cleaningDuties, lightsOutLogs,
        cellphones, phoneDeposits, phoneBorrows, violations, settings,
        medicalSlips, gatePasses, demeritClearances, confiscatedItems, studentMedicals]);

  // Pull the shared state on load, then poll for updates from other devices.
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
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
          if (d.users) setUsers(d.users as User[]);
          if (d.rooms) setRooms(d.rooms as Room[]);
          if (d.inspections) setInspections(d.inspections as RoomInspection[]);
          if (d.attendance) setAttendance(d.attendance as AttendanceRecord[]);
          if (d.curfewRecords) setCurfewRecords(d.curfewRecords as CurfewRecord[]);
          if (d.uniformLogs) setUniformLogs(d.uniformLogs as SchoolUniformLog[]);
          if (d.studyLogs) setStudyLogs(d.studyLogs as StudyHoursLog[]);
          if (d.cleaningDuties) setCleaningDuties(d.cleaningDuties as CleaningDutyRecord[]);
          if (d.lightsOutLogs) setLightsOutLogs(d.lightsOutLogs as LightsOutLog[]);
          if (d.cellphones) setCellphones(d.cellphones as CellphoneCustody[]);
          if (d.phoneDeposits) setPhoneDeposits(d.phoneDeposits as PhoneDepositLog[]);
          if (d.phoneBorrows) setPhoneBorrows(d.phoneBorrows as PhoneBorrowLog[]);
          if (d.violations) setViolations(d.violations as Violation[]);
          if (d.medicalSlips) setMedicalSlips(d.medicalSlips as MedicalExcuseSlip[]);
          if (d.gatePasses) setGatePasses(d.gatePasses as GatePassRecord[]);
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
    pull();
    const id = window.setInterval(pull, SERVER_POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Recalculate user demerit points dynamically based on confirmed/active violations
  useEffect(() => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        const userViolations = violations.filter(
          v => v.studentId === user.id && v.status !== 'cleared_service'
        );
        const totalDemerits = userViolations.reduce((sum, v) => sum + v.demeritPoints, 0);
        const status = totalDemerits >= 8 ? 'probation' : 'active';
        return {
          ...user,
          demeritPoints: totalDemerits,
          status: user.role === 'occupant' ? status : user.status,
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
        demeritPoints: 0,
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
      demeritPoints: 0,
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

  const addInspection = (insp: Omit<RoomInspection, 'id' | 'timestamp'>) => {
    if (!canEdit) return;
    const timeStr = manilaTime();
    const newRecord: RoomInspection = {
      ...insp,
      id: 'insp-' + Date.now(),
      timestamp: timeStr,
    };
    setInspections(prev => [newRecord, ...prev]);

    // If fail, create automatic violation
    if (newRecord.status === 'fail') {
      const room = rooms.find(r => r.roomNumber === insp.roomNumber);
      if (room && room.occupantIds.length > 0) {
        room.occupantIds.forEach(occId => {
          const occ = users.find(u => u.id === occId);
          if (occ && occ.role === 'occupant') {
            saveViolation({
              date: insp.date,
              studentId: occ.id,
              studentName: occ.name,
              roomNumber: insp.roomNumber,
              category: 'cleanliness',
              severity: 'moderate',
              description: `Room ${insp.roomNumber} failed daily inspection score (${insp.score}/100): ${insp.remarks || 'Sanitation issues'}`,
              demeritPoints: VIOLATION_POINTS,
              reportedBy: currentUser.name,
              status: 'pending_settlement',
              actionRequired: 'Re-inspection by 5:00 PM required.',
            });
          }
        });
      }
    }
  };

  const saveAttendanceBatch = (records: Omit<AttendanceRecord, 'id' | 'timestamp'>[]) => {
    if (!canEdit) return;
    const timeStr = manilaTime();
    const formatted = records.map((r, idx) => ({
      ...r,
      id: `att-${Date.now()}-${idx}`,
      timestamp: timeStr,
    }));
    setAttendance(prev => [...formatted, ...prev]);

    // Automatically flag unexcused absences, missing Bibles and improper attire.
    records.forEach(r => {
      const session = worshipLabel(r.type);
      const attended = r.status === 'present' || r.status === 'late';

      if (r.status === 'absent') {
        saveViolation({
          date: r.date,
          studentId: r.studentId,
          studentName: r.studentName,
          roomNumber: r.roomNumber,
          category: 'worship_absence',
          severity: 'moderate',
          description: `Unexcused absence from ${session}.`,
          demeritPoints: VIOLATION_POINTS,
          reportedBy: currentUser.name,
          status: 'pending_settlement',
          actionRequired: 'Submit dean excuse slip or make-up devotional session.',
        });
        return;
      }

      if (!attended) return;

      if (!r.broughtBible) {
        saveViolation({
          date: r.date,
          studentId: r.studentId,
          studentName: r.studentName,
          roomNumber: r.roomNumber,
          category: 'no_bible',
          severity: 'minor',
          description: `Failed to bring personal physical Bible to ${session}.`,
          demeritPoints: VIOLATION_POINTS,
          reportedBy: currentUser.name,
          status: 'pending_settlement',
          actionRequired: 'Ensure Bible is in hand for next worship.',
        });
      }

      if (r.properAttire === false) {
        saveViolation({
          date: r.date,
          studentId: r.studentId,
          studentName: r.studentName,
          roomNumber: r.roomNumber,
          category: 'improper_worship_attire',
          severity: 'minor',
          description: `Improper worship attire at ${session}.`,
          demeritPoints: VIOLATION_POINTS,
          reportedBy: currentUser.name,
          status: 'pending_settlement',
          actionRequired: 'Come in proper worship attire for the next service.',
        });
      }
    });
  };

  const saveCurfewRecord = (rec: Omit<CurfewRecord, 'id'>) => {
    if (!canEdit) return;
    const newRecord: CurfewRecord = {
      ...rec,
      id: 'cur-' + Date.now(),
    };
    setCurfewRecords(prev => [newRecord, ...prev]);

    if (rec.status === 'late' || rec.status === 'missing') {
      saveViolation({
        date: rec.date,
        studentId: rec.studentId,
        studentName: rec.studentName,
        roomNumber: rec.roomNumber,
        category: 'curfew_breach',
        severity: rec.status === 'missing' ? 'major' : 'moderate',
        description: rec.status === 'missing' 
          ? `Missing from dormitory past curfew without authorization.`
          : `Late curfew arrival (${rec.actualCheckInTime || 'unrecorded'}). ${rec.remarks || ''}`,
        demeritPoints: VIOLATION_POINTS,
        reportedBy: currentUser.name,
        status: 'pending_settlement',
        actionRequired: 'Dean inquiry interview.',
      });
    }
  };

  const saveUniformLog = (log: Omit<SchoolUniformLog, 'id'>) => {
    if (!canEdit) return;
    const newRecord: SchoolUniformLog = {
      ...log,
      id: 'uni-' + Date.now(),
    };
    setUniformLogs(prev => [newRecord, ...prev]);

    if (log.status === 'flagged') {
      saveViolation({
        date: log.date,
        studentId: log.studentId,
        studentName: log.studentName,
        roomNumber: log.roomNumber,
        category: !log.isDepartureOnSchedule ? 'irregular_school_departure' : 'uniform_violation',
        severity: 'minor',
        description: `School departure gate inspection issue: ${log.remarks || 'Uniform/Grooming non-compliant or departed off-schedule'}.`,
        demeritPoints: VIOLATION_POINTS,
        reportedBy: currentUser.name,
        status: 'pending_settlement',
        actionRequired: 'Correction before school gate pass clearance.',
      });
    }
  };

  const saveStudyLog = (log: Omit<StudyHoursLog, 'id'>) => {
    if (!canEdit) return;
    const newRecord: StudyHoursLog = {
      ...log,
      id: 'sty-' + Date.now(),
    };
    setStudyLogs(prev => [newRecord, ...prev]);

    if (log.status === 'absent' || log.quietness === 'noisy') {
      saveViolation({
        date: log.date,
        studentId: log.studentId,
        studentName: log.studentName,
        roomNumber: log.roomNumber,
        category: 'study_hour_skipping',
        severity: 'minor',
        description: `Study hours infraction: ${log.status === 'absent' ? 'Absent from study period' : 'Noise during quiet study'}.`,
        demeritPoints: VIOLATION_POINTS,
        reportedBy: currentUser.name,
        status: 'pending_settlement',
        actionRequired: 'Silent study monitoring assigned.',
      });
    }
  };

  /** Drop the violations a given record auto-logged, before it logs them again. */
  const clearViolationsFrom = (sourceId: string) =>
    setViolations(prev => prev.filter(v => v.sourceId !== sourceId));

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
  }) => {
    if (!canEdit) return;
    const timeStr = manilaTime();
    const existing = cleaningDuties.find(d => d.date === entry.date);
    const dutyId = existing?.id ?? 'clean-' + Date.now();

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
      timestamp: timeStr,
    };
    setCleaningDuties(prev =>
      prev.some(d => d.id === dutyId) ? prev.map(d => (d.id === dutyId ? completed : d)) : [completed, ...prev]
    );

    // Correcting a day that was already checked replaces the violations that
    // check produced, so nobody is charged twice for the same cleaning day.
    clearViolationsFrom(dutyId);

    // Missing your room's cleaning day is the resident's own infraction.
    entry.helpers
      .filter(h => !h.helped)
      .forEach(h =>
        saveViolation({
          date: entry.date,
          studentId: h.studentId,
          studentName: h.studentName,
          roomNumber: entry.roomNumber,
          category: 'chore_neglect',
          severity: 'minor',
          description: `Did not help with Room ${entry.roomNumber}'s dorm cleaning duty.${entry.remarks ? ` ${entry.remarks}` : ''}`,
          demeritPoints: VIOLATION_POINTS,
          reportedBy: currentUser.name,
          status: 'pending_settlement',
          actionRequired: 'Serve the next cleaning rotation under monitor sign-off.',
          sourceId: dutyId,
        })
      );

    // Poor work falls on the crew that actually showed up; the residents who
    // skipped are already answering for the same day above.
    const poorWork = entry.rating <= 2 || !entry.garbageDisposed;
    if (poorWork) {
      const reason = !entry.garbageDisposed
        ? 'garbage not disposed'
        : `cleaning rated ${entry.rating}/5`;
      entry.helpers
        .filter(h => h.helped)
        .forEach(h =>
          saveViolation({
            date: entry.date,
            studentId: h.studentId,
            studentName: h.studentName,
            roomNumber: entry.roomNumber,
            category: 'cleanliness',
            severity: 'minor',
            description: `Dorm cleaning duty below standard (${reason}).${entry.remarks ? ` ${entry.remarks}` : ''}`,
            demeritPoints: VIOLATION_POINTS,
            reportedBy: currentUser.name,
            status: 'pending_settlement',
            actionRequired: 'Redo the assigned area before the next inspection.',
            sourceId: dutyId,
          })
        );
    }
  };

  const saveLightsOutLog = (log: Omit<LightsOutLog, 'id'>) => {
    if (!canEdit) return;
    const newRecord: LightsOutLog = {
      ...log,
      id: 'lo-' + Date.now(),
    };
    setLightsOutLogs(prev => [newRecord, ...prev]);

    if (log.status === 'violation') {
      const room = rooms.find(r => r.roomNumber === log.roomNumber);
      if (room) {
        room.occupantIds.forEach(occId => {
          const occ = users.find(u => u.id === occId);
          if (occ && occ.role === 'occupant') {
            saveViolation({
              date: log.date,
              studentId: occ.id,
              studentName: occ.name,
              roomNumber: log.roomNumber,
              category: 'lights_out_violation',
              severity: 'moderate',
              description: `Room ${log.roomNumber} lights-out violation at ${log.checkTime}: ${log.violatorRemarks || 'Lights on or noise disturbance'}`,
              demeritPoints: VIOLATION_POINTS,
              reportedBy: currentUser.name,
              status: 'pending_settlement',
            });
          }
        });
      }
    }
  };

  const updateCellphoneStatus = (id: string, updates: Partial<CellphoneCustody>) => {
    if (!canEdit) return;
    setCellphones(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // A room's deposit roll call. Every check is filed against the vault cycle it
  // falls in — one record per resident per cycle — so re-running a room
  // replaces its own records instead of stacking new ones.
  const savePhoneDepositBatch = (records: Omit<PhoneDepositLog, 'id'>[]) => {
    if (!canEdit) return;

    // Anything handed in past the deadline is late, whatever the dean tapped.
    const resolved: PhoneDepositLog[] = records.map(r => {
      const cycleDate = r.cycleDate ?? vaultCycle(r.date, r.depositTime, settings).deadlineDate;
      const late = r.status === 'deposited' && isLateDeposit(r.date, r.depositTime, settings);
      return { ...r, cycleDate, status: late ? 'late' : r.status, id: `dep-${r.studentId}-${cycleDate}` };
    });

    const supersedes = (d: PhoneDepositLog) =>
      resolved.some(r => r.studentId === d.studentId && (d.cycleDate ?? d.date) === r.cycleDate);
    setPhoneDeposits(prev => [...resolved, ...prev.filter(d => !supersedes(d))]);

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
          custodyStatus: inVault ? 'in_vault' : 'with_student',
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

    const dueLabel = describeCyclePoint(settings.phoneDepositDay, settings.phoneDepositTime);
    resolved.forEach(r => {
      const sourceId = `phone-${r.studentId}-${r.cycleDate}`;
      // A re-check replaces its own verdict rather than piling points on.
      clearViolationsFrom(sourceId);
      if (r.status === 'deposited' || r.status === 'excused') return;
      saveViolation({
        date: r.date,
        studentId: r.studentId,
        studentName: r.studentName,
        roomNumber: r.roomNumber,
        category: 'cellphone_policy_breach',
        severity: r.status === 'late' ? 'minor' : 'moderate',
        description: r.status === 'late'
          ? `Late phone deposit at ${r.depositTime} — due ${dueLabel}.${r.remarks ? ` ${r.remarks}` : ''}`
          : `Did not deposit phone for the cycle due ${dueLabel}.${r.remarks ? ` ${r.remarks}` : ''}`,
        demeritPoints: VIOLATION_POINTS,
        reportedBy: currentUser.name,
        status: 'pending_settlement',
        sourceId,
        actionRequired: r.status === 'late'
          ? 'Deposit on time at the next vault run.'
          : 'Surrender the device to the Dean immediately.',
      });
    });
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

    const flagged: Violation[] = missing.map(u => ({
      id: `viol-phone-${u.id}-${cycle.deadlineDate}`,
      date: cycle.deadlineDate,
      studentId: u.id,
      studentName: u.name,
      roomNumber: u.roomNumber || '—',
      category: 'cellphone_policy_breach',
      severity: 'moderate',
      description: `No phone deposit recorded for the cycle due ${dueLabel}.`,
      demeritPoints: VIOLATION_POINTS,
      reportedBy: 'Vault deadline',
      status: 'pending_settlement',
      sourceId: `phone-${u.id}-${cycle.deadlineDate}`,
      actionRequired: 'Surrender the device to the Dean, or have the absence excused.',
      createdAt: manilaTime(),
    }));
    const flaggedSources = new Set(flagged.map(v => v.sourceId));

    setPhoneDeposits(prev => [...swept, ...prev.filter(d => !sweptIds.has(d.id))]);
    setViolations(prev => [...flagged, ...prev.filter(v => !v.sourceId || !flaggedSources.has(v.sourceId))]);
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

  const saveViolation = (viol: Omit<Violation, 'id' | 'createdAt'>) => {
    if (!canEdit) return;
    const timeStr = manilaTime();
    const newRecord: Violation = {
      ...viol,
      id: 'viol-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: timeStr,
    };
    setViolations(prev => [newRecord, ...prev]);
  };

  const updateViolationStatus = (id: string, status: Violation['status'], actionRequired?: string) => {
    if (!canEdit) return;
    setViolations(prev =>
      prev.map(v => (v.id === id ? { ...v, status, actionRequired: actionRequired || v.actionRequired } : v))
    );
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setRooms(INITIAL_ROOMS);
    setInspections(INITIAL_INSPECTIONS);
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
      demeritPoints: 0,
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

  const saveDemeritClearance = (log: Omit<DemeritClearanceLog, 'id'>) => {
    const newLog: DemeritClearanceLog = {
      ...log,
      id: 'clr-' + Date.now(),
    };
    setDemeritClearances(prev => [newLog, ...prev]);

    // Automatically resolve or reduce violation points for this student
    if (log.demeritsDeducted > 0) {
      setViolations(prev => {
        let remainingPointsToClear = log.demeritsDeducted;
        return prev.map(v => {
          if (v.studentId === log.studentId && v.status !== 'cleared_service' && remainingPointsToClear > 0) {
            remainingPointsToClear -= v.demeritPoints;
            return {
              ...v,
              status: 'cleared_service',
              actionRequired: `Cleared through community service: ${log.serviceType} (${log.hoursRendered} hrs approved by ${log.supervisorName})`,
            };
          }
          return v;
        });
      });
    }
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
      demeritPoints: 0,
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
    setMedicalSlips([]);
    setGatePasses([]);
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
    setMedicalSlips(INITIAL_MEDICAL_SLIPS);
    setGatePasses(INITIAL_GATE_PASSES);
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
        demeritClearances,
        saveDemeritClearance,
        confiscatedItems,
        saveConfiscatedItem,
        updateConfiscatedItemStatus,
        studentMedicals,
        saveStudentMedical,
        canEdit,
        isSuperAdmin,
        isOccupant,
        isParent,
        isGuest,
        loginWithGoogle,
        updateUserRole,
        addInspection,
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
