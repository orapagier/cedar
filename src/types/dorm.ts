export type UserRole = 'superadmin' | 'admin' | 'occupant' | 'parent' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roomNumber?: string;
  avatar?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  /** Optional Gmail used to auto-link a parent account to this student. */
  parentEmail?: string;
  /** For parent sessions: id of the linked student they may view. */
  relatedStudentId?: string;
  demeritPoints: number;
  status: 'active' | 'probation' | 'excused_leave';
}

export interface Room {
  id: string;
  roomNumber: string;
  wing: 'North Wing' | 'South Wing' | 'East Wing' | 'West Wing';
  floor: number;
  capacity: number;
  captainName: string;
  occupantIds: string[];
}

export interface OccupantInspectionCheck {
  studentId: string;
  studentName: string;
  bedsOk: boolean;
  lockersOk: boolean;
  personalThingsOk: boolean;
}

export interface RoomInspection {
  id: string;
  date: string; // YYYY-MM-DD
  roomNumber: string;
  inspectorName: string;
  inspectorId: string;
  bedsOk: boolean;
  lockersOk: boolean;
  personalThingsOk: boolean;
  crCleanlinessOk: boolean;
  overallFloorOk: boolean;
  score: number; // 0 to 100
  status: 'pass' | 'warning' | 'fail';
  remarks?: string;
  timestamp: string;
  /** Per-occupant ratings for the first three criteria (introduced later). */
  occupantChecks?: OccupantInspectionCheck[];
}

/** Admin-tunable dormitory schedules (times are 24-hour "HH:MM"). */
export interface DormSettings {
  worshipMorning: string;    // e.g. "05:30"
  worshipEvening: string;    // e.g. "18:30"
  worshipMidweek: string;    // e.g. "18:00"
  sabbathMorning: string;    // e.g. "09:00"
  sabbathAfternoon: string;  // e.g. "14:00"
  studyStart: string;        // evening study period start, e.g. "19:30"
  studyEnd: string;          // evening study period end, e.g. "21:30"
  curfewTime: string;        // e.g. "21:00"
  lightsOutTime: string;     // e.g. "22:00"
  departureStart: string;    // school exit window start, e.g. "07:00"
  departureEnd: string;      // school exit window end, e.g. "07:35"
}

export type WorshipType =
  | 'morning_worship'
  | 'evening_worship'
  | 'midweek_worship'
  | 'sabbath_morning'
  | 'sabbath_afternoon';

export interface AttendanceRecord {
  id: string;
  date: string;
  type: WorshipType;
  studentId: string;
  studentName: string;
  roomNumber: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  broughtBible: boolean;
  /** Worship attire check — optional so records saved before it existed still load. */
  properAttire?: boolean;
  notes?: string;
  recordedBy: string;
  timestamp: string;
}

export interface CurfewRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  curfewTime: string; // e.g. "21:00"
  actualCheckInTime?: string; // e.g. "20:55"
  status: 'in_dorm' | 'late' | 'missing' | 'official_pass';
  remarks?: string;
  loggedBy: string;
}

export interface SchoolUniformLog {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  departureTime: string; // e.g. "07:15"
  uniformCompliant: boolean;
  hairGroomingCompliant: boolean;
  idBadgeCompliant: boolean;
  shoesCompliant: boolean;
  isDepartureOnSchedule: boolean; // e.g., must leave between 07:00 - 07:35
  status: 'cleared' | 'flagged';
  remarks?: string;
  inspectedBy: string;
}

export interface StudyHoursLog {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  location: 'study_hall' | 'library' | 'approved_room';
  checkTime: string;         // when the roll call was taken, e.g. "19:45"
  status: 'present' | 'absent';
  quietness: 'quiet' | 'noisy';
  remarks?: string;
  recordedBy: string;
}

export interface ChoreAssignment {
  id: string;
  weekRange: string;
  dutyArea: 'Corridor & Stairs' | 'CR & Bathroom Sanitation' | 'Waste Management & Segregation' | 'Dorm Grounds & Yard' | 'Common Lounge & Study Hall' | 'Water Refill & Sink Area';
  studentId: string;
  studentName: string;
  roomNumber: string;
  daySchedule: string;
  status: 'pending' | 'completed' | 'inspected_approved' | 'failed';
  inspectorRemarks?: string;
  verifiedBy?: string;
}

export interface LightsOutLog {
  id: string;
  date: string;
  roomNumber: string;
  checkTime: string; // e.g. "22:05"
  allLightsOff: boolean;
  noiseCompliant: boolean; // quiet / no loud talking
  noUnauthorizedGadgets: boolean;
  status: 'compliant' | 'violation';
  violatorRemarks?: string;
  inspectedBy: string;
}

export interface CellphoneCustody {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  deviceModel: string;
  lockerVaultNumber: string;
  turnedOverSunday: boolean;
  turnOverTime?: string;
  returnedFriday: boolean;
  returnTime?: string;
  custodyStatus: 'in_vault' | 'with_student' | 'confiscated' | 'exempted';
  remarks?: string;
}

export type ViolationCategory = 
  | 'cleanliness'
  | 'worship_absence'
  | 'worship_late'
  | 'no_bible'
  | 'improper_worship_attire'
  | 'curfew_breach'
  | 'uniform_violation'
  | 'church_absence'
  | 'irregular_school_departure'
  | 'study_hour_skipping'
  | 'chore_neglect'
  | 'lights_out_violation'
  | 'cellphone_policy_breach'
  | 'other';

export interface Violation {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  category: ViolationCategory;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  demeritPoints: number;
  reportedBy: string;
  status: 'pending_settlement' | 'appealed' | 'cleared_service' | 'confirmed';
  actionRequired?: string;
  createdAt: string;
}

export interface DeanStatSummary {
  totalOccupants: number;
  activeViolationsCount: number;
  todayCleanlinessAvg: number;
  morningWorshipAttendancePct: number;
  eveningWorshipAttendancePct: number;
  cellphonesInVaultPct: number;
  curfewStatusOk: number;
  curfewStatusLate: number;
}

export interface MedicalExcuseSlip {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  diagnosis: string;
  startDate: string;
  endDate: string;
  bedRestRequired: boolean;
  clinicStaffOrDoctor: string;
  excusedFrom: string[]; // e.g. ['Morning Worship', 'Evening Worship', 'Classes', 'Chores']
  status: 'active_bedrest' | 'recovered_cleared';
  notes?: string;
  issuedAt: string;
}

export interface GatePassRecord {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  passType: 'weekend_home' | 'church_event' | 'medical_visit' | 'family_emergency' | 'academic';
  destination: string;
  departureDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  parentConsentVerified: boolean;
  parentPhone: string;
  approvedByDean: string;
  status: 'approved' | 'departed' | 'returned_on_time' | 'overdue';
  remarks?: string;
  issuedAt: string;
}

export interface DemeritClearanceLog {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  serviceType: 'Grounds Beautification' | 'Library Duty' | 'Dorm Maintenance & Sanitizing' | 'Dining/Kitchen Help';
  hoursRendered: number;
  demeritsDeducted: number;
  supervisorName: string;
  completionDate: string;
  remarks?: string;
}

export interface ConfiscatedItemRecord {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  itemName: string;
  category: 'banned_cooking' | 'fire_hazard_wiring' | 'unauthorized_appliance' | 'substance';
  confiscatedDate: string;
  confiscatedBy: string;
  vaultLockerSlot: string;
  status: 'in_safe_custody' | 'claimed_by_parent' | 'released_end_semester';
  remarks?: string;
}

export interface StudentMedicalRecord {
  studentId: string;
  studentName: string;
  roomNumber: string;
  bloodType: string;
  allergies: string;
  asthmaInhalerRequired: boolean;
  dailyMedications?: string;
  emergencyHospitalPreference?: string;
  parentEmergencyPhone: string;
  notes?: string;
}

