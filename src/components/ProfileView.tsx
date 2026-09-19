import React, { useMemo } from 'react';
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Brush,
  Church,
  HandHeart,
  HeartPulse,
  Home,
  Luggage,
  Mail,
  MessageSquareWarning,
  Moon,
  Phone,
  ShieldAlert,
  Siren,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { User } from '../types/dorm';
import { buildOccupantTimeline, EventKind, EventMark, EventTone } from '../utils/occupantTimeline';
import { formatFullDate, formatTime12h } from '../utils/date';
import { demeritLabel, demeritStanding, violationTitle } from '../utils/checkViolations';
import { OccupantRecordsPanel } from './OccupantRecordsPanel';
import { ViolationActions } from './ViolationActions';

const roleLabel = (role: string) =>
  role === 'superadmin' ? 'Dean (Super Admin)'
  : role === 'admin' ? 'Administrator'
  : role === 'parent' ? 'Parent'
  : role === 'guest' ? 'Guest'
  : 'Resident';

const USER_ROLE: Record<User['role'], string> = {
  superadmin: 'purple',
  admin: 'blue',
  occupant: 'emerald',
  parent: 'sky',
  guest: 'slate',
};

const ROLE_CHIP: Record<string, string> = {
  purple: 'bg-purple-900/60 text-purple-300 border-purple-600/40',
  blue: 'bg-blue-900/60 text-blue-300 border-blue-600/40',
  emerald: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40',
  sky: 'bg-sky-900/60 text-sky-300 border-sky-600/40',
  slate: 'bg-slate-800 text-slate-300 border-slate-600/40',
};

const WING_CLASSES: Record<string, string> = {
  North: 'bg-sky-950 text-sky-300 border-sky-800/60',
  South: 'bg-rose-950 text-rose-300 border-rose-800/60',
  East: 'bg-amber-950 text-amber-300 border-amber-800/60',
  West: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
};

const EVENT_ICONS: Record<EventKind, React.ComponentType<{ className?: string }>> = {
  worship: Church,
  study: BookOpen,
  curfew: Moon,
  departure: UserCheck,
  cleaning: Brush,
  phone: Smartphone,
  gatepass: Luggage,
  offcampus: Siren,
  language: MessageSquareWarning,
  medical: HeartPulse,
  violation: ShieldAlert,
  redemption: HandHeart,
};

const TONE_CLASSES: Record<EventTone, string> = {
  good: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
  warn: 'bg-amber-950 text-amber-300 border-amber-800/60',
  bad: 'bg-rose-950 text-rose-300 border-rose-800/60',
  info: 'bg-sky-950 text-sky-300 border-sky-800/60',
};

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

/**
 * How much of a resident's file the viewer may read:
 *  - `full`  — the Dean, a parent of the child, or the resident themselves.
 *  - `staff` — administrators: parent contact details are withheld.
 *  - `public` — a resident looking at a dormitorian: contact and medical
 *    details are withheld, keeping only what a dormitory mate knows.
 */
type Visibility = 'full' | 'staff' | 'public';

/**
 * The logged-in profile: whoever the current user is, everything about them.
 *
 * A resident's profile is their whole dormitory file — standing, contacts,
 * room, medical notes and every check that names them. A parent's is their own
 * header over their child's file. Everyone else (the Dean, staff, a guest) gets
 * the account page. It lives behind the avatar menu so it is always one tap away.
 *
 * `studentId` lets the Dean and administrators open another resident's file
 * here directly (from the homepage search). What the open profile shows follows
 * the viewer's role: the Dean sees everything, staff see it minus a resident's
 * home contacts, and a resident looking at a dormitorian sees only what the
 * dormitory is expected to know — no phone, email, parent or medical details.
 */
export const ProfileView: React.FC<{ studentId?: string | null }> = ({ studentId = null }) => {
  const dorm = useDorm();
  const { currentUser } = dorm;

  const subjectId =
    studentId ??
    (currentUser.role === 'occupant'
      ? currentUser.id
      : currentUser.role === 'parent'
        ? currentUser.relatedStudentId
        : undefined);
  const subject = subjectId ? dorm.users.find(u => u.id === subjectId) : undefined;

  // What the viewer may see on this resident's file. A parent viewing their own
  // child and a resident viewing themselves are the people the record belongs
  // to, so they read it whole.
  const visibility: Visibility =
    !subject ? 'public'
    : currentUser.role === 'superadmin' ? 'full'
    : subject.id === currentUser.id ? 'full'
    : currentUser.role === 'parent' ? 'full'
    : currentUser.role === 'admin' ? 'staff'
    : 'public';

  if (subject && (subject.role === 'occupant' || subject.role === 'parent')) {
    const viewingOther = subject.id !== currentUser.id && currentUser.role !== 'parent';
    return (
      <div className="space-y-4 sm:space-y-6">
        {viewingOther && (
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            Viewing <span className="text-slate-300 font-semibold">{subject.name}</span>'s record · signed
            in as {currentUser.name}.
            {visibility !== 'full' && ' Some personal information is hidden from your access level.'}
          </p>
        )}
        {currentUser.role === 'parent' && subject.role === 'occupant' && (
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            Parent account — signed in as {currentUser.name}, viewing
            <span className="text-slate-300 font-semibold">{subject.name}</span>'s record.
          </p>
        )}
        {subject.role === 'occupant' ? (
          <ResidentProfile user={subject} visibility={visibility} />
        ) : (
          <AccountProfile user={subject} />
        )}
      </div>
    );
  }

  if (subject) {
    return <AccountProfile user={subject} />;
  }

  return <AccountProfile user={currentUser} />;
};

/** A shared avatar-plus-name header carrying role, standing and loose chips. */
const ProfileHeader: React.FC<{
  name: string;
  subtitle: string;
  role: User['role'];
  badges?: React.ReactNode;
}> = ({ name, subtitle, role, badges }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 font-bold text-lg">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">{name}</h1>
          <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">{subtitle}</p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold w-fit border ${ROLE_CHIP[USER_ROLE[role]]}`}>
          {roleLabel(role)}
        </span>
      </div>
      {badges && <div className="flex flex-wrap gap-1.5 mt-3">{badges}</div>}
    </div>
  );
};

/** The account page: what the dormitory knows about the person signed in. */
const AccountProfile: React.FC<{ user: User }> = ({ user }) => {
  const { users } = useDorm();
  const linked = user.role === 'parent' ? users.find(u => u.id === user.relatedStudentId) : undefined;
  const details = [
    { icon: Mail, label: 'Email', value: user.email || 'Not on file' },
    { icon: Phone, label: 'Phone', value: user.phone || 'Not on file' },
    { icon: ShieldAlert, label: 'Access level', value: roleLabel(user.role) },
  ];
  if (linked) {
    details.push({
      icon: Users,
      label: 'Linked student',
      value: `${linked.name}${linked.roomNumber ? ` · Room ${linked.roomNumber}` : ''}`,
    });
  }

  return (
    <div className="space-y-4">
      <ProfileHeader
        name={user.name}
        subtitle={user.email || 'Account'}
        role={user.role}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/70">
        {details.map(d => (
          <Fact key={d.label} icon={d.icon} label={d.label} value={d.value} />
        ))}
      </div>
    </div>
  );
};

/** A resident's whole dormitory file, laid out for reading top to bottom. */
const ResidentProfile: React.FC<{ user: User; visibility?: Visibility }> = ({ user, visibility = 'full' }) => {
  const dorm = useDorm();
  const {
    users,
    rooms,
    inspections,
    violations,
    attendance,
    cellphones,
    studentMedicals,
  } = dorm;

  const room = rooms.find(r => r.roomNumber === user.roomNumber);
  const wingKey = room?.wing.split(' ')[0] ?? '';
  const activeViolations = violations.filter(v => v.studentId === user.id && v.status !== 'cleared_service');
  const studentViolations = violations.filter(v => v.studentId === user.id);
  const demerits = activeViolations.reduce((s, v) => s + v.demerits, 0);
  const roomInspections = inspections.filter(i => i.roomNumber === user.roomNumber);
  const cleanliness = roomInspections.length
    ? Math.round(roomInspections.reduce((s, i) => s + i.score, 0) / roomInspections.length)
    : null;
  const myWorship = attendance.filter(a => a.studentId === user.id);
  const worshipRate = myWorship.length
    ? Math.round((myWorship.filter(a => a.status === 'present').length / myWorship.length) * 100)
    : null;
  const phone = cellphones.find(c => c.studentId === user.id);
  const roommates = users.filter(
    u => u.role === 'occupant' && u.roomNumber === user.roomNumber && u.id !== user.id
  );
  const medical = studentMedicals.find(m => m.studentId === user.id);
  const standing = demeritStanding(demerits);
  const timeline = useMemo(() => buildOccupantTimeline(user.id, dorm), [user.id, dorm]);

  // What this viewer may see of the file's personal details.
  const showEmail = visibility !== 'public';
  const showPhone = visibility !== 'public';
  const showParent = visibility === 'full';
  const showMedical = visibility !== 'public';

  const stats: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Demerits', value: String(demerits), tone: standing.tone },
    { label: 'Open Violations', value: String(activeViolations.length) },
    { label: 'Worship Kept', value: worshipRate === null ? '—' : `${worshipRate}%` },
    { label: 'Room Cleanliness', value: cleanliness === null ? '—' : String(cleanliness) },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProfileHeader
        name={user.name}
        subtitle={
          `Room ${user.roomNumber || '—'}${room ? ` · ${room.wing} · Floor ${room.floor}` : ''}`
        }
        role="occupant"
        badges={
          <>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${standing.classes}`}>
              {standing.label}
            </span>
            {demerits > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {demeritLabel(demerits)}
              </span>
            )}
            {room && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${WING_CLASSES[wingKey] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {room.wing}
              </span>
            )}
            {user.status === 'excused_leave' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-950 text-sky-300 border border-sky-700/60">
                Excused Leave
              </span>
            )}
            {showParent && user.parentEmail && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-950 text-sky-300 border border-sky-700/60 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Parent Linked
              </span>
            )}
            {phone && phone.custodyStatus !== 'exempted' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> {phone.custodyStatus.replace(/_/g, ' ')}
              </span>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-center">
        {stats.map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.tone || 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {dorm.currentUser.role === 'superadmin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Violations
              <span className="text-[10px] font-semibold uppercase text-slate-400">
                {activeViolations.length} open · {studentViolations.length - activeViolations.length} settled
              </span>
            </h3>
            <span className="hidden sm:inline text-[10px] text-slate-500">Edit · clear · delete</span>
          </div>
          {studentViolations.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-500">
              Nothing on file yet — great standing!
            </p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {studentViolations.map(v => (
                <div key={v.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{violationTitle(v)}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{v.description}</p>
                    {v.assignedRedemption && (
                      <p className="text-[10px] text-amber-300/90 mt-0.5">To redeem: {v.assignedRedemption}</p>
                    )}
                    {v.status === 'cleared_service' && (
                      <p className="text-[10px] text-emerald-400/90 mt-0.5">
                        {v.redemption
                          ? `Settled — ${v.redemption.kind === 'reflection'
                              ? v.redemption.reflectionTopic ?? 'reflection'
                              : `${v.redemption.hoursRendered ?? 0} hr · ${v.redemption.serviceType ?? 'work service'}`}`
                          : 'Cleared'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      v.status === 'cleared_service'
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-rose-950 text-rose-300'
                    }`}>
                      {v.status === 'cleared_service' ? '−' : '+'}{demeritLabel(v.demerits)}
                    </span>
                    <ViolationActions violation={v} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/70 text-xs">
        {showEmail ? (
          <Fact icon={Mail} label="Email" value={user.email || 'Not on file'} />
        ) : (
          <Fact icon={Mail} label="Email" value="Hidden" />
        )}
        {showPhone ? (
          <Fact icon={Phone} label="Resident phone" value={user.phone || 'Not on file'} />
        ) : (
          <Fact icon={Phone} label="Resident phone" value="Hidden" />
        )}
        {showParent ? (
          <Fact
            icon={Users}
            label="Parent / guardian"
            value={
              user.parentName
                ? `${user.parentName}${user.parentPhone ? ` · ${user.parentPhone}` : ''}`
                : 'Not on file'
            }
          />
        ) : (
          <Fact icon={Users} label="Parent / guardian" value="Hidden" />
        )}
        <Fact
          icon={Home}
          label="Roommates"
          value={roommates.length ? roommates.map(r => r.name).join(', ') : 'Rooming alone'}
        />
        {room?.captainName && <Fact icon={BadgeCheck} label="Room captain" value={room.captainName} />}
      </div>

      {medical && showMedical && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/70 text-xs">
          <div className="px-4 py-2.5 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Medical Profile</h3>
          </div>
          <Fact icon={ShieldAlert} label="Blood type" value={medical.bloodType || 'Not on file'} />
          <Fact icon={ShieldAlert} label="Allergies" value={medical.allergies || 'None on file'} />
          {medical.dailyMedications && (
            <Fact icon={ShieldAlert} label="Daily medications" value={medical.dailyMedications} />
          )}
          {medical.asthmaInhalerRequired && <Fact icon={ShieldAlert} label="Asthma" value="Inhaler required" />}
          <Fact icon={Phone} label="Emergency contact" value={medical.parentEmergencyPhone || 'Not on file'} />
          {medical.emergencyHospitalPreference && (
            <Fact icon={Home} label="Hospital preference" value={medical.emergencyHospitalPreference} />
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white text-sm">Recent Activity</h3>
        </div>
        {timeline.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500">
            Nothing on file yet — records appear here as staff log them.
          </p>
        ) : (
          <ol className="divide-y divide-slate-800/70">
            {timeline.slice(0, 12).map(event => {
              const Icon = EVENT_ICONS[event.kind];
              return (
                <li key={event.id} className="flex items-start gap-2.5 px-4 py-3">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center ${TONE_CLASSES[event.tone]}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">{event.title}</p>
                    {event.detail && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">{event.detail}</p>
                    )}
                    {event.marks && event.marks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.marks.map((mark, i) => (
                          <Mark key={i} mark={mark} />
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatFullDate(event.date)}
                      {event.time ? ` · ${formatTime12h(event.time)}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {timeline.length > 12 && (
          <p className="text-[11px] text-slate-500 text-center pb-3">
            Showing the 12 most recent of {timeline.length} entries — the full history is below.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-white mb-2">Full History</h3>
        <OccupantRecordsPanel studentId={user.id} group="all" limit={8} showStats={false} />
      </div>
    </div>
  );
};

/**
 * What one entry cost the resident, shown on the entry that cost it.
 */
function Mark({ mark }: { mark: EventMark }) {
  const owed = `+${demeritLabel(mark.demerits)}`;
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
        mark.redeemed
          ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
          : 'bg-rose-950 text-rose-300 border-rose-800/60'
      }`}
    >
      {mark.label ? `${mark.label} · ` : ''}
      {owed}
      {mark.redeemed ? ' · redeemed' : ''}
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
      <span className="text-slate-500 shrink-0 w-28">{label}</span>
      <span className="text-slate-200 min-w-0 flex-1 break-words">{value}</span>
    </div>
  );
}