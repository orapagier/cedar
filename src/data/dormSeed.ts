import { 
  User, 
  Room, 
  RoomInspection, 
  AttendanceRecord, 
  CurfewRecord, 
  SchoolUniformLog, 
  StudyHoursLog, 
  ChoreAssignment, 
  LightsOutLog, 
  CellphoneCustody, 
  Violation,
  MedicalExcuseSlip,
  GatePassRecord,
  DemeritClearanceLog,
  ConfiscatedItemRecord,
  StudentMedicalRecord
} from '../types/dorm';

/**
 * INITIAL SEED DATA FOR CEDAR HALL BOYS DORMITORY
 * Primary Administrator: Dean Jelmar Orapa (orapajelmar@gmail.com)
 * No mock/test student names - only clean institutional structure.
 */

export const INITIAL_USERS: User[] = [
  {
    id: 'user-dean',
    name: 'Dean Jelmar Orapa',
    email: 'orapajelmar@gmail.com',
    role: 'superadmin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+63 917 555 0101',
    demeritPoints: 0,
    status: 'active',
  },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-101',
    roomNumber: '101',
    wing: 'North Wing',
    floor: 1,
    capacity: 4,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-102',
    roomNumber: '102',
    wing: 'North Wing',
    floor: 1,
    capacity: 3,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-103',
    roomNumber: '103',
    wing: 'South Wing',
    floor: 1,
    capacity: 3,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-104',
    roomNumber: '104',
    wing: 'South Wing',
    floor: 1,
    capacity: 3,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-201',
    roomNumber: '201',
    wing: 'East Wing',
    floor: 2,
    capacity: 3,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-202',
    roomNumber: '202',
    wing: 'East Wing',
    floor: 2,
    capacity: 3,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-301',
    roomNumber: '301',
    wing: 'West Wing',
    floor: 3,
    capacity: 4,
    captainName: '',
    occupantIds: [],
  },
  {
    id: 'room-302',
    roomNumber: '302',
    wing: 'West Wing',
    floor: 3,
    capacity: 4,
    captainName: '',
    occupantIds: [],
  },
];

export const INITIAL_INSPECTIONS: RoomInspection[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_CURFEW: CurfewRecord[] = [];
export const INITIAL_UNIFORM_LOGS: SchoolUniformLog[] = [];
export const INITIAL_STUDY_LOGS: StudyHoursLog[] = [];
export const INITIAL_CHORES: ChoreAssignment[] = [];
export const INITIAL_LIGHTS_OUT: LightsOutLog[] = [];
export const INITIAL_CELLPHONES: CellphoneCustody[] = [];
export const INITIAL_VIOLATIONS: Violation[] = [];
export const INITIAL_MEDICAL_SLIPS: MedicalExcuseSlip[] = [];
export const INITIAL_GATE_PASSES: GatePassRecord[] = [];
export const INITIAL_DEMERIT_CLEARANCES: DemeritClearanceLog[] = [];
export const INITIAL_CONFISCATED_ITEMS: ConfiscatedItemRecord[] = [];
export const INITIAL_STUDENT_MEDICALS: StudentMedicalRecord[] = [];
