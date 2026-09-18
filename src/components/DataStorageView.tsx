import React, { useState } from 'react';
import {
  Database,
  Download,
  Archive,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  TrendingUp,
} from 'lucide-react';
import { useDorm } from '../context/DormContext';
import { useManilaToday } from '../hooks/useManilaToday';
import { formatFullDate } from '../utils/date';
import { shiftDate } from '../utils/phoneVault';
import { formatBytes, measureStore, downloadJson } from '../utils/records';

const FIELD = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm';

/** How far back the dean can choose to keep records before archiving the rest. */
const KEEP_PRESETS = [
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last school year', days: 365 },
];

export const DataStorageView: React.FC = () => {
  const { sharedStateSnapshot, archiveRecordsBefore, isSuperAdmin } = useDorm();
  const today = useManilaToday();

  const [cutoff, setCutoff] = useState(() => shiftDate(today, -180));
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Measured every render off the live store, so the meter drops the moment an
  // archive trims it.
  const usage = measureStore(sharedStateSnapshot(), today, cutoff);

  const usedPct = Math.min(100, Math.round((usage.totalBytes / usage.budgetBytes) * 100));
  const archivable = usage.collections.reduce((sum, c) => sum + c.archivableCount, 0);

  // How long the store has before it outgrows one comfortable sync payload.
  const daysLeft =
    usage.bytesPerDay && usage.bytesPerDay > 0
      ? Math.max(0, Math.round((usage.budgetBytes - usage.totalBytes) / usage.bytesPerDay))
      : null;
  const schoolYearBytes = usage.bytesPerDay ? usage.totalBytes + usage.bytesPerDay * 300 : null;

  const flash = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 6000);
  };

  const handleBackup = () => {
    downloadJson(`cedar-hall-backup-${today}.json`, {
      exportedAt: new Date().toISOString(),
      kind: 'full-backup',
      data: sharedStateSnapshot(),
    });
    flash('success', 'Full backup downloaded. Keep it somewhere safe — Drive, or the school server.');
  };

  const handleArchive = () => {
    if (archivable === 0) {
      flash('error', 'Nothing is dated before that cutoff — no records to archive.');
      return;
    }
    const ok = window.confirm(
      `Archive ${archivable} record${archivable === 1 ? '' : 's'} dated before ${formatFullDate(cutoff)}?\n\n` +
        'The archive file downloads first, then those records leave the live app. ' +
        'Demerits from archived violations come off resident standings. This cannot be undone from inside the app.',
    );
    if (!ok) return;

    const { archive, archivedCount } = archiveRecordsBefore(cutoff);
    if (archivedCount === 0) {
      flash('error', 'Nothing was archived.');
      return;
    }
    downloadJson(`cedar-hall-archive-before-${cutoff}.json`, {
      exportedAt: new Date().toISOString(),
      kind: 'archive',
      cutoff,
      recordCount: archivedCount,
      data: archive,
    });
    flash('success', `Archived ${archivedCount} records and downloaded the file. The live store is now lighter.`);
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400 text-center">
        Only the Dean can manage stored records.
      </div>
    );
  }

  const barColour = usedPct >= 90 ? 'bg-rose-500' : usedPct >= 65 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">Data & Storage</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Every device shares one store of records, and every save sends the whole thing at once. The
          free database holds far more than a dormitory writes in a year — what it will not accept is a
          single save bigger than about 1 MB. So the number to watch is the bar below, not the disk.
          Back the records up, archive each term once it is signed off, and the app stays fast all year.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
              : 'bg-rose-950/70 border-rose-600 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Size meter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-slate-400" /> Current sync payload
          </h3>
          <span className={`text-xs font-bold ${usedPct >= 90 ? 'text-rose-400' : usedPct >= 65 ? 'text-amber-300' : 'text-emerald-400'}`}>
            {formatBytes(usage.totalBytes)} of {formatBytes(usage.budgetBytes)}
          </span>
        </div>

        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div className={`h-full ${barColour} transition-all`} style={{ width: `${Math.max(2, usedPct)}%` }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-400">Records stored</p>
            <p className="text-lg font-bold text-white">{usage.totalRecords.toLocaleString()}</p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-400">Oldest record</p>
            <p className="text-sm font-bold text-white mt-1">
              {usage.oldestDate ? formatFullDate(usage.oldestDate) : '—'}
            </p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Growth
            </p>
            <p className="text-sm font-bold text-white mt-1">
              {usage.bytesPerDay ? `${formatBytes(usage.bytesPerDay)}/day` : 'Too new to tell'}
            </p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <p className="text-[10px] text-slate-400">Room left</p>
            <p className="text-sm font-bold text-white mt-1">
              {daysLeft === null ? '—' : daysLeft > 365 ? 'Over a year' : `~${daysLeft} days`}
            </p>
          </div>
        </div>

        {schoolYearBytes !== null && (
          <p className="text-[11px] text-slate-500">
            At this rate a full 10-month school year lands around{' '}
            <span className="text-slate-300 font-semibold">{formatBytes(schoolYearBytes)}</span>
            {schoolYearBytes > usage.budgetBytes
              ? ' — over the payload budget, so plan to archive at the end of each term.'
              : ' — comfortably inside the budget.'}
          </p>
        )}
      </div>

      {/* Backup */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
          <Download className="w-4 h-4 text-sky-400" /> Backup
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Downloads every record — roster, checks, violations, redemptions — as one JSON file. Do this
          before archiving, and at the end of every term.
        </p>
        <button
          onClick={handleBackup}
          className="mt-3 min-h-touch px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download full backup
        </button>
      </div>

      {/* Archive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            <Archive className="w-4 h-4 text-amber-400" /> Archive closed-out records
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Keeps the roster, rooms, phone register, medical sheets and schedules untouched. Only the
            dated daily logs before your cutoff move out — into a file you keep, out of the live app.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {KEEP_PRESETS.map(preset => {
            const presetCutoff = shiftDate(today, -preset.days);
            const active = presetCutoff === cutoff;
            return (
              <button
                key={preset.days}
                onClick={() => setCutoff(presetCutoff)}
                className={`min-h-touch px-3 rounded-xl text-[11px] font-semibold border transition-colors ${
                  active
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Keep {preset.label.toLowerCase()}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Archive everything before</label>
            <input type="date" value={cutoff} max={today} onChange={e => setCutoff(e.target.value)} className={FIELD} />
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
            <p className="text-[10px] text-slate-400">Records this would move out</p>
            <p className={`text-lg font-bold ${archivable ? 'text-amber-300' : 'text-slate-500'}`}>
              {archivable.toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleArchive}
          disabled={archivable === 0}
          className="min-h-touch px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Archive className="w-4 h-4" /> Download archive & trim the live store
        </button>

        <p className="text-[11px] text-rose-300/80 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Archived violations stop counting toward a resident's demerits, and archived records disappear
          from their Occupant Records page. Only archive terms that are settled and signed off.
        </p>
      </div>

      {/* Per-collection breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h3 className="font-bold text-white text-sm">What is taking up the space</h3>
          <span className="text-[11px] text-slate-400 shrink-0">roster & settings: {formatBytes(usage.rosterBytes)}</span>
        </div>
        <div className="divide-y divide-slate-800/70">
          {[...usage.collections]
            .sort((a, b) => b.bytes - a.bytes)
            .map(c => (
              <div key={c.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {c.count.toLocaleString()} record{c.count === 1 ? '' : 's'}
                    {c.oldestDate ? ` · since ${formatFullDate(c.oldestDate)}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-slate-200">{formatBytes(c.bytes)}</p>
                  {c.archivableCount > 0 && (
                    <p className="text-[10px] text-amber-400/80">{c.archivableCount} archivable</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
