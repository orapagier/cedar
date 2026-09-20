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
  /** Demerits still owed — one for every violation not yet redeemed. */
  demerits: number;
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

/**
 * Stamped on any check record the Super Admin has changed after it was filed,
 * so a corrected record still says who corrected it and when.
 */
export interface OverrideStamp {
  overriddenBy?: string;
  overriddenAt?: string; // ISO timestamp
}

export interface OccupantInspectionCheck {
  studentId: string;
  studentName: string;
  bedsOk: boolean;
  lockersOk: boolean;
  personalThingsOk: boolean;
}

export interface RoomInspection extends OverrideStamp {
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

/**
 * One resident's own rating for a day's room inspection — bed, locker and
 * personal things scored on his own, filed separately from the room's record.
 * A dean can save a single resident as he checks him, and the whole room keeps
 * its own walk as well. The room's record is what raises the 1-demerit
 * cleanliness violations on a failed day; these are his per-person log.
 */
export interface IndividualInspectionRecord extends OverrideStamp {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  roomNumber: string;
  bedsOk: boolean;
  lockersOk: boolean;
  personalThingsOk: boolean;
  score: number; // 0 to 100, from the resident's three items alone
  status: 'pass' | 'warning' | 'fail';
  recordedBy: string;
  timestamp: string;
}

/** Admin-tunable dormitory schedules (times are 24-hour "HH:MM"). */
export interface DormSettings {
  worshipMorning: string;    // e.g. "05:30"
  worshipEvening: string;    // e.g. "18:30"
  worshipMidweek: string;    // e.g. "18:00"
  worshipVespers: string;    // Friday evening vespers, e.g. "19:00"
  sabbathMorning: string;    // e.g. "09:00"
  sabbathAfternoon: string;  // e.g. "14:00"
  studyStart: string;        // evening study period start, e.g. "19:30"
  studyEnd: string;          // evening study period end, e.g. "21:30"
  curfewTime: string;        // e.g. "21:00"
  lightsOutTime: string;     // e.g. "22:00"
  /** Morning school exit window, e.g. "07:00" - "07:35". */
  departureStart: string;
  departureEnd: string;
  /** Afternoon school exit window, e.g. "13:00" - "13:35". */
  departureAfternoonStart: string;
  departureAfternoonEnd: string;
  /**
   * The weekly phone vault cycle. Phones are due in the vault on
   * `phoneDepositDay` at `phoneDepositTime` and handed back on
   * `phoneReleaseDay` at `phoneReleaseTime`; days are 0 (Sunday) to 6.
   */
  phoneDepositDay: number;
  phoneDepositTime: string;  // e.g. "20:00"
  phoneReleaseDay: number;
  phoneReleaseTime: string;  // e.g. "12:00"
}

/** The two daily school departures; each has its own window in DormSettings. */
export type DepartureSession = 'morning' | 'afternoon';

export type WorshipType =
  | 'morning_worship'
  | 'evening_worship'
  | 'midweek_worship'
  | 'vesper_worship'
  | 'sabbath_morning'
  | 'sabbath_afternoon';

export interface AttendanceRecord extends OverrideStamp {
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

export interface CurfewRecord extends OverrideStamp {
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

export interface SchoolUniformLog extends OverrideStamp {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  /** Which of the day's two departures this covers. Optional: records saved
   *  before the afternoon departure existed are all morning departures. */
  session?: DepartureSession;
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

export interface StudyHoursLog extends OverrideStamp {
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

/** One resident of the room on cleaning duty, and whether they turned up. */
export interface CleaningHelperCheck {
  studentId: string;
  studentName: string;
  helped: boolean;
}

/**
 * One day of the cleaning rotation: a single room is the day's cleaning crew.
 * Each of its residents is checked individually for helping, and the room is
 * rated as a whole for how clean the dorm was left, garbage included.
 */
export interface CleaningDutyRecord extends OverrideStamp {
  id: string;
  date: string;       // YYYY-MM-DD — one duty room per day
  roomNumber: string; // the room rostered to clean that day
  helpers: CleaningHelperCheck[];
  /** 1 (poor) to 5 (excellent) rating of the cleaning work. */
  rating: number;
  garbageDisposed: boolean;
  status: 'assigned' | 'completed';
  remarks?: string;
  assignedBy: string;
  recordedBy?: string;
  timestamp: string;
}

export interface LightsOutLog extends OverrideStamp {
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

/** Weekly per-resident phone deposit roll call, checked room by room. */
export interface PhoneDepositLog extends OverrideStamp {
  id: string;
  date: string;
  /** Deadline date of the vault cycle this check belongs to, so a cycle's
   *  records are found whichever day they were taken. Optional: records saved
   *  before the cycle existed are keyed by their own date. */
  cycleDate?: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  /** 'excused' covers residents off-campus, on medical rest, or without a phone. */
  status: 'deposited' | 'late' | 'not_deposited' | 'excused';
  depositTime: string; // e.g. "18:30"
  /** Set when the deadline swept the resident up rather than a dean logging it. */
  autoLogged?: boolean;
  remarks?: string;
  recordedBy: string;
}

/**
 * A phone signed back out to its owner mid-cycle — a call home, a school
 * requirement — and its return to the vault.
 */
export interface PhoneBorrowLog {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  reason: string;
  borrowedDate: string;       // YYYY-MM-DD
  borrowedTime: string;       // e.g. "16:20"
  expectedReturnTime: string; // e.g. "17:00"
  returnedDate?: string;
  returnedTime?: string;
  status: 'out' | 'returned';
  approvedBy: string;
  remarks?: string;
}

export interface CellphoneCustody {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  /** The phone the vault expects from this resident, e.g. "Smartphone". */
  deviceModel: string;
  turnedOverSunday: boolean;
  turnOverTime?: string;
  returnedFriday: boolean;
  returnTime?: string;
  custodyStatus: 'in_vault' | 'with_student' | 'borrowed' | 'confiscated' | 'exempted';
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
  | 'unauthorized_campus_exit'
  | 'foul_language'
  | 'study_hour_skipping'
  | 'chore_neglect'
  | 'lights_out_violation'
  | 'cellphone_policy_breach'
  | 'unauthorized_room_visit'
  | 'other';

/** The work details a resident can be given to redeem one violation. */
export type ServiceType =
  | 'Grounds Beautification'
  | 'Library Duty'
  | 'Dorm Maintenance & Sanitizing'
  | 'Dining/Kitchen Help';

/**
 * How one violation was paid off. Every violation carries its own redemption,
 * so a resident settles them one at a time rather than in a lump: either work
 * rendered ('service') or a reflection they wrote ('reflection').
 */
export interface ViolationRedemption {
  kind: 'service' | 'reflection';
  /** Service redemptions: what work was done and for how long. */
  serviceType?: ServiceType;
  hoursRendered?: number;
  /** Reflection redemptions: what it was about and what the resident wrote. */
  reflectionTopic?: string;
  reflectionText?: string;
  /** The staff member who supervised the work or read the reflection. */
  supervisorName: string;
  completedDate: string; // YYYY-MM-DD
  remarks?: string;
  /** Who signed the violation off, and when. */
  clearedBy: string;
  clearedAt: string;
}

export interface Violation {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  category: ViolationCategory;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  /** Demerits this violation puts on the resident until it is redeemed. */
  demerits: number;
  reportedBy: string;
  status: 'pending_settlement' | 'appealed' | 'cleared_service' | 'confirmed';
  /**
   * What the Dean has decided this resident must do to redeem this one
   * violation — a work detail or a written reflection. It is his to set and
   * nobody else's: a check that raises a violation never prescribes its own
   * redemption. Blank until he says.
   */
  assignedRedemption?: string;
  /** Id of the record that auto-logged this violation, so re-saving that
   *  record can replace its own violations instead of stacking new ones. */
  sourceId?: string;
  /** Set once this one violation has been redeemed and cleared. */
  redemption?: ViolationRedemption;
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
  passType: 'weekend_home' | 'church_event' | 'medical_visit' | 'family_emergency' | 'academic' | 'personal_matters';
  destination: string;
  departureDate: string;
  expectedReturnDate: string;
  /** Time of day the resident is due back, e.g. "17:30". Optional: passes
   *  issued before return times existed only carry the date. */
  expectedReturnTime?: string;
  actualReturnDate?: string;
  parentConsentVerified: boolean;
  parentPhone: string;
  approvedByDean: string;
  status: 'approved' | 'departed' | 'returned_on_time' | 'overdue';
  remarks?: string;
  issuedAt: string;
}

/**
 * A resident found off campus with no gate pass covering the day — the record
 * the dormitory keeps when someone simply walked out. It is filed against the
 * resident, not the gate, and carries a demerit unless a pass or leave turns up
 * afterwards and the Dean excuses it.
 */
export interface UnauthorizedExitLog extends OverrideStamp {
  id: string;
  date: string; // YYYY-MM-DD — the day the resident was off campus
  studentId: string;
  studentName: string;
  roomNumber: string;
  /** When the exit was noticed, e.g. "14:20". */
  noticedTime: string;
  /** Where the resident went, as far as anyone knows. */
  destination?: string;
  /** How the exit came to light. */
  discoveredVia: 'gate_guard' | 'roll_call' | 'staff_sighting' | 'reported' | 'self_admitted';
  /** Filled in once the resident is back in the dormitory. */
  returnedTime?: string;
  /** 'confirmed' — left with no pass; 'excused' — a pass or leave accounted for it. */
  status: 'confirmed' | 'excused';
  /** Why an excused exit was cleared, e.g. "Pass was issued on paper". */
  excuseReason?: string;
  parentNotified: boolean;
  remarks?: string;
  loggedBy: string;
}

/**
 * The kind of language a resident was heard using. Cedar Hall is a Christian
 * dormitory, so the register separates a cuss word said in temper from God's
 * name taken in vain, and both from words aimed at another person.
 */
export type BadLanguageKind =
  | 'cursing'      // swearing, cuss words
  | 'vulgar_talk'  // obscene or crude talk and jokes
  | 'blasphemy'    // God's name taken in vain
  | 'name_calling' // insults and mockery aimed at a person
  | 'abusive';     // threatening or degrading language

/** Where in dormitory life the words were heard. */
export type BadLanguageSetting =
  | 'dorm_room'
  | 'hallway_grounds'
  | 'worship'
  | 'study_hours'
  | 'dining_kitchen'
  | 'school_run'
  | 'online_chat'
  | 'other';

/**
 * A resident heard cursing, swearing or otherwise speaking foul language — the
 * record the dormitory keeps of how residents speak to one another. It is filed
 * against the resident who spoke, carries a demerit unless the Dean later excuses
 * it, and keeps room for the words themselves so a dean inquiry is not working
 * from memory.
 */
export interface BadLanguageLog extends OverrideStamp {
  id: string;
  date: string; // YYYY-MM-DD — the day the words were heard
  studentId: string;
  studentName: string;
  roomNumber: string;
  /** When it was heard, e.g. "19:40". */
  heardTime: string;
  kind: BadLanguageKind;
  setting: BadLanguageSetting;
  /** What was said, as near as it was heard. Kept verbatim, or left blank. */
  quote?: string;
  /** Who the words were aimed at, when they were aimed at anyone. */
  directedAt?: string;
  /** How the incident came to light. */
  discoveredVia: 'staff_heard' | 'reported' | 'self_admitted' | 'written';
  /** Whether the resident has since apologized to whoever it was said to. */
  apologyMade: boolean;
  parentNotified: boolean;
  /** 'confirmed' — the words were said; 'excused' — it was not as reported. */
  status: 'confirmed' | 'excused';
  /** Why an excused report was cleared, e.g. "Misheard — another resident". */
  excuseReason?: string;
  remarks?: string;
  loggedBy: string;
}

/**
 * A resident found in a room that is not their own — in another resident's
 * room, which the dormitory does not allow without explicit permission. The
 * record is kept against the visitor so a lost or stolen item can be traced
 * back through who was in the room and when.
 */
export interface NeighborRoomLog extends OverrideStamp {
  id: string;
  date: string; // YYYY-MM-DD — the day the resident was seen
  studentId: string;
  studentName: string;
  roomNumber: string; // the resident's own room
  /** The room they were found in, e.g. "203". */
  visitedRoomNumber: string;
  /** Who lives in the room they were found in, captured at filing time. */
  visitedRoomOccupants?: string;
  /** When they were seen, e.g. "16:20". */
  seenTime: string;
  /** Why they said they were there — helps a later inquiry trace what happened. */
  purpose?: string;
  /** How the visit came to light. */
  discoveredVia: 'staff_rounds' | 'room_owner' | 'reported' | 'self_admitted';
  /** Whether the resident had explicit permission to be in the room. */
  hasPermission: boolean;
  /** 'confirmed' — there without permission; 'excused' — permission or leave cleared it. */
  status: 'confirmed' | 'excused';
  /** Why an excused visit was cleared, e.g. "Roommate had invited him". */
  excuseReason?: string;
  remarks?: string;
  loggedBy: string;
}

export interface DemeritClearanceLog {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  /** 'Written Reflection' covers a redemption paid off on paper, not in work. */
  serviceType: ServiceType | 'Written Reflection';
  hoursRendered: number;
  demeritsDeducted: number;
  supervisorName: string;
  completionDate: string;
  remarks?: string;
  /** The single violation this clearance redeemed, when it settled just one. */
  violationId?: string;
  violationCategory?: ViolationCategory;
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

