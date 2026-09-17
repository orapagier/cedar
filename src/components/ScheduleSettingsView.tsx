import React, { useState } from 'react';
import {
  Settings,
  Church,
  Moon,
  UserCheck,
  Clock,
  Save,
  CheckCircle2,
  BookOpen,
  CalendarDays,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { formatFullDate } from '../utils/date';
import { useManilaToday } from '../hooks/useManilaToday';

const TIME_FIELD =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500';

export const ScheduleSettingsView: React.FC = () => {
  const { settings, updateSettings, canEdit } = useDorm();
  const today = useManilaToday();
  const [draft, setDraft] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof draft, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateSettings(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  if (!canEdit) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400 text-center">
        Only administrators can edit schedules.
      </div>
    );
  }

  const sections: { title: string; icon: React.ComponentType<{ className?: string }>; desc: string; fields: { key: keyof typeof draft; label: string; hint: string }[] }[] = [
    {
      title: 'Worship Services',
      icon: Church,
      desc: 'Session times shown on the Worship Roll Call.',
      fields: [
        { key: 'worshipMorning', label: 'Morning Worship', hint: 'e.g. 05:30' },
        { key: 'worshipEvening', label: 'Evening Worship', hint: 'e.g. 18:30' },
        { key: 'worshipMidweek', label: 'Midweek Worship', hint: 'e.g. 18:00' },
        { key: 'sabbathMorning', label: 'Sabbath Morning', hint: 'e.g. 09:00' },
        { key: 'sabbathAfternoon', label: 'Sabbath Afternoon', hint: 'e.g. 14:00' },
      ],
    },
    {
      title: 'Study Hours',
      icon: BookOpen,
      desc: 'Mandatory evening study period used by Study Hours & Library.',
      fields: [
        { key: 'studyStart', label: 'Study Start', hint: 'e.g. 19:30' },
        { key: 'studyEnd', label: 'Study End', hint: 'e.g. 21:30' },
      ],
    },
    {
      title: 'Curfew & Lights Out',
      icon: Moon,
      desc: 'Check-in limit and lights-off time.',
      fields: [
        { key: 'curfewTime', label: 'Curfew Time', hint: 'Students must be inside by this time' },
        { key: 'lightsOutTime', label: 'Lights Out', hint: 'Lights off / silence' },
      ],
    },
    {
      title: 'School Departure Window',
      icon: UserCheck,
      desc: 'Morning exit window checked in Departure & Uniform.',
      fields: [
        { key: 'departureStart', label: 'Window Start', hint: 'e.g. 07:00' },
        { key: 'departureEnd', label: 'Window End', hint: 'e.g. 07:35' },
      ],
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">Schedule Settings</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Adjust dormitory hours. Changes apply immediately and sync across devices.
        </p>
        <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          {formatFullDate(today)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    {section.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">{section.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {section.fields.map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <label className="block min-w-0">
                      <span className="block text-[11px] font-medium text-slate-400 mb-1 truncate">{field.label}</span>
                      <input
                        type="time"
                        value={draft[field.key] || ''}
                        onChange={e => set(field.key, e.target.value)}
                        className={TIME_FIELD}
                      />
                      {field.hint && <span className="block text-[10px] text-slate-500 mt-1">{field.hint}</span>}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Current Schedule</h3>
              <p className="text-[11px] text-slate-500">Times now in effect.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Morning Worship</p>
              <p className="text-white font-semibold mt-0.5">{settings.worshipMorning || '—'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Evening Worship</p>
              <p className="text-white font-semibold mt-0.5">{settings.worshipEvening || '—'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Sabbath AM / PM</p>
              <p className="text-white font-semibold mt-0.5">{settings.sabbathMorning || '—'} / {settings.sabbathAfternoon || '—'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Study Hours</p>
              <p className="text-white font-semibold mt-0.5">{settings.studyStart || '—'} – {settings.studyEnd || '—'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Curfew</p>
              <p className="text-white font-semibold mt-0.5">{settings.curfewTime || '—'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Lights Out</p>
              <p className="text-white font-semibold mt-0.5">{settings.lightsOutTime || '—'}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Departure Window</p>
              <p className="text-white font-semibold mt-0.5">{settings.departureStart || '—'} – {settings.departureEnd || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Saved and synced
          </span>
        )}
        <button
          onClick={handleSave}
          className="min-h-touch px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          Save Schedule
        </button>
      </div>
    </div>
  );
};