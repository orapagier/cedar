import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, RefreshCw, Share, X, TreePine } from 'lucide-react';
import {
  applyUpdate,
  canInstall,
  hasUpdate,
  isIos,
  isStandalone,
  promptInstall,
  subscribeToInstall,
  subscribeToUpdate,
} from '../utils/pwa';

/** A dismissed banner stays down for a week, then asks once more. */
const DISMISS_KEY = 'cedar-hall-install-dismissed';
const DISMISS_DAYS = 7;

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
};

/** Subscribe to whether the browser is currently offering an install. */
export const useCanInstall = () => useSyncExternalStore(subscribeToInstall, canInstall, () => false);

/**
 * The two things a web app has to say for itself on a phone: "you can keep me
 * on your home screen", and "there is a newer me — reload".
 *
 * Both sit at the bottom of the screen, above the gesture bar, and neither
 * blocks the app behind it. The install banner is dismissible and remembers
 * that for a week; the update bar is not, because a dean running last week's
 * build against this week's records is the thing worth interrupting for.
 */
export const PwaPrompts: React.FC = () => {
  const installable = useCanInstall();
  const updateReady = useSyncExternalStore(subscribeToUpdate, hasUpdate, () => false);
  const [dismissed, setDismissed] = useState(() => recentlyDismissed());
  const [showIosHint, setShowIosHint] = useState(false);

  // iOS has no install event at all — Safari only offers "Add to Home Screen"
  // from its share sheet, so the app has to say so itself.
  useEffect(() => {
    setShowIosHint(isIos() && !isStandalone());
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private browsing: the banner simply asks again next launch.
    }
  };

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'accepted') dismiss();
  };

  if (updateReady) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 p-3 px-safe pb-safe pointer-events-none">
        <div className="mx-auto max-w-md pointer-events-auto flex items-center gap-3 bg-slate-900 border border-emerald-700/50 rounded-2xl shadow-2xl p-3">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white">A new version is ready</p>
            <p className="text-[11px] text-slate-400">Reload to pick up the latest Cedar Hall.</p>
          </div>
          <button
            onClick={applyUpdate}
            className="shrink-0 min-h-touch px-3 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (dismissed || isStandalone()) return null;
  if (!installable && !showIosHint) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 px-safe pb-safe pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto flex items-start gap-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <TreePine className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">Install Cedar Hall</p>
          {installable ? (
            <p className="text-[11px] text-slate-400">
              Add it to your home screen — opens full screen, no browser bar.
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 flex items-center gap-1 flex-wrap">
              Tap <Share className="w-3 h-3 inline" /> Share, then{' '}
              <span className="text-slate-300 font-semibold">Add to Home Screen</span>.
            </p>
          )}
        </div>
        {installable && (
          <button
            onClick={install}
            className="shrink-0 min-h-touch px-3 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 min-w-touch min-h-touch -mr-2 -mt-1 flex items-center justify-center text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
