/**
 * Installing Cedar Hall on a phone, without shipping a phone app.
 *
 * Android fires `beforeinstallprompt` once, early — often before React has
 * mounted — and the event is the only handle on the install dialog. So the
 * listeners live at module scope and are attached the moment this file is
 * imported; components subscribe to what was already caught.
 */

/** The Chromium install event. Not in lib.dom, so it is described here. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;

const installListeners = new Set<Listener>();
const updateListeners = new Set<Listener>();

const notify = (listeners: Set<Listener>) => listeners.forEach(fn => fn());

const subscribe = (listeners: Set<Listener>) => (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    // Held back so the app can offer the install in its own words, in its own
    // place, rather than wherever the browser would have put a mini-infobar.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify(installListeners);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify(installListeners);
  });
}

export const subscribeToInstall = subscribe(installListeners);
export const subscribeToUpdate = subscribe(updateListeners);

export const canInstall = () => deferredPrompt !== null;
export const hasUpdate = () => waitingWorker !== null;

/** Open the browser's install dialog. Resolves once the user has answered. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const prompt = deferredPrompt;
  // The event is single-use: spent whether the user accepts or not.
  deferredPrompt = null;
  notify(installListeners);
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome;
}

/** Hand the waiting worker the page and reload onto the new build. */
export function applyUpdate() {
  const worker = waitingWorker;
  if (!worker) return;
  // One reload, once the new worker is actually in control.
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  });
  worker.postMessage({ type: 'SKIP_WAITING' });
}

/** Running from the home screen rather than inside a browser tab. */
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own flag, which predates display-mode.
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** iPhone and iPad, where installing means "Add to Home Screen" by hand. */
export const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac; the touch points give it away.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/**
 * Register the worker, and watch for a newer one arriving behind it.
 *
 * Dev is deliberately skipped: Vite serves modules straight off disk there, and
 * a worker caching them makes edits look like they did not happen.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        // A worker already parked and waiting from an earlier visit.
        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting;
          notify(updateListeners);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            // `controller` tells the first install apart from an update: on a
            // first visit there is nothing to replace, so nothing to announce.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorker = installing;
              notify(updateListeners);
            }
          });
        });
      })
      .catch(() => {
        // An unregistrable worker costs the app nothing but the offline shell.
      });
  });
}
