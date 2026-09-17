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

function occupant(roomNumber: string, index: number, name: string, email: string): User {
  return {
    id: `occ-r${roomNumber}-${index}`,
    name,
    email,
    role: 'occupant',
    roomNumber,
    demeritPoints: 0,
    status: 'active',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  };
}

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
  occupant('305', 1, 'Acuña, Cris Jeiden C.', 'cris.acuna@dorm.edu'),
  occupant('305', 2, 'Buo, James Ross C.', 'james.buo@dorm.edu'),
  occupant('305', 3, 'Pastera, Lester O. II', 'lester.pastera@dorm.edu'),
  occupant('305', 4, 'Cabilan, Joel Matthew C.', 'joel.cabilan@dorm.edu'),
  occupant('306', 1, 'Alocillo, Yahxian Seith E.', 'yahxian.alocillo@dorm.edu'),
  occupant('306', 2, 'Dimasacat, Nigel Carl Adrian S.', 'nigel.dimasacat@dorm.edu'),
  occupant('306', 3, 'Gerona, Jan Daniel B.', 'jan.gerona@dorm.edu'),
  occupant('306', 4, 'Mejorada, Kirt Clive T.', 'kirt.mejorada@dorm.edu'),
  occupant('306', 5, 'Suson, Allen Joel N.', 'allen.suson@dorm.edu'),
  occupant('307', 1, 'Dagum, Irlant Prince A.', 'irlant.dagum@dorm.edu'),
  occupant('307', 2, 'Dagum, Nepthalie Jr.', 'nepthalie.dagum@dorm.edu'),
  occupant('307', 3, 'Doquila, Samuel S.', 'samuel.doquila@dorm.edu'),
  occupant('307', 4, 'Guiritan, Voughn Alain A.', 'voughn.guiritan@dorm.edu'),
  occupant('307', 5, 'Coles, Jon Zatchel N.', 'jon.coles@dorm.edu'),
  occupant('307', 6, 'Mulato, Vince John D.', 'vince.mulato@dorm.edu'),
  occupant('308', 1, 'Dialde, Earl Adrian C.', 'earl.dialde@dorm.edu'),
  occupant('308', 2, 'Monsanto, Nerch Kharl D.', 'nerch.monsanto@dorm.edu'),
  occupant('309', 1, 'Beltran, Belsum Jade S.', 'belsum.beltran@dorm.edu'),
  occupant('309', 2, 'Beltran, Brever Jade S.', 'brever.beltran@dorm.edu'),
  occupant('309', 3, 'Morada, Chester C.', 'chester.morada@dorm.edu'),
  occupant('309', 4, 'Nequin, Klenthritcher', 'klenthritcher.nequin@dorm.edu'),
  occupant('309', 5, 'Perez, Archie M.', 'archie.perez@dorm.edu'),
  occupant('309', 6, 'Placedes, Renz', 'renz.placedes@dorm.edu'),
  occupant('309', 7, 'Torreon, Lemuel Enoch G.', 'lemuel.torreon@dorm.edu'),
  occupant('310', 1, 'Cabilan, Jazzer Mhar H.', 'jazzer.cabilan@dorm.edu'),
  occupant('310', 2, 'Cabiling, Jan Allen S.', 'jan.cabiling@dorm.edu'),
  occupant('310', 3, 'Budiongan, Erlou T.', 'erlou.budiongan@dorm.edu'),
  occupant('310', 4, 'Galeon, Grant Bryant R.', 'grant.galeon@dorm.edu'),
  occupant('310', 5, 'Salgado, Jeren', 'jeren.salgado@dorm.edu'),
  occupant('310', 6, 'Talaver, Rouge Arkin', 'rouge.talaver@dorm.edu'),
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-305',
    roomNumber: '305',
    wing: 'North Wing',
    floor: 1,
    capacity: 4,
    captainName: '',
    occupantIds: ['occ-r305-1', 'occ-r305-2', 'occ-r305-3', 'occ-r305-4'],
  },
  {
    id: 'room-306',
    roomNumber: '306',
    wing: 'North Wing',
    floor: 1,
    capacity: 5,
    captainName: '',
    occupantIds: ['occ-r306-1', 'occ-r306-2', 'occ-r306-3', 'occ-r306-4', 'occ-r306-5'],
  },
  {
    id: 'room-307',
    roomNumber: '307',
    wing: 'West Wing',
    floor: 1,
    capacity: 6,
    captainName: '',
    occupantIds: ['occ-r307-1', 'occ-r307-2', 'occ-r307-3', 'occ-r307-4', 'occ-r307-5', 'occ-r307-6'],
  },
  {
    id: 'room-308',
    roomNumber: '308',
    wing: 'West Wing',
    floor: 1,
    capacity: 2,
    captainName: '',
    occupantIds: ['occ-r308-1', 'occ-r308-2'],
  },
  {
    id: 'room-309',
    roomNumber: '309',
    wing: 'West Wing',
    floor: 1,
    capacity: 7,
    captainName: '',
    occupantIds: ['occ-r309-1', 'occ-r309-2', 'occ-r309-3', 'occ-r309-4', 'occ-r309-5', 'occ-r309-6', 'occ-r309-7'],
  },
  {
    id: 'room-310',
    roomNumber: '310',
    wing: 'South Wing',
    floor: 1,
    capacity: 6,
    captainName: '',
    occupantIds: ['occ-r310-1', 'occ-r310-2', 'occ-r310-3', 'occ-r310-4', 'occ-r310-5', 'occ-r310-6'],
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
