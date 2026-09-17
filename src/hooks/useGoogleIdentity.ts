import { useEffect, useState } from 'react';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: any;
  }
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

let scriptPromise: Promise<any> | null = null;

function loadGisScript(): Promise<any> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type GoogleSession = {
  email: string;
  name: string;
  avatar?: string;
};

/**
 * Wraps Google Identity Services (GIS).
 *
 * Set VITE_GOOGLE_CLIENT_ID (a Google Web OAuth Client ID) to enable the real
 * "Sign in with Google" button. Until it is set, `ready` stays false and the
 * login screen shows a labeled dev-preview fallback that resolves roles with
 * the exact same email logic.
 */
export function useGoogleIdentity() {
  const clientId = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '').trim();
  const [ready, setReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!clientId) return;
    loadGisScript()
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setScriptError(true);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  const renderButton = (container: HTMLElement, onCredential: (session: GoogleSession) => void) => {
    if (!clientId || !window.google?.accounts?.id) return;
    const callback = (response: { credential?: string }) => {
      const decoded = response?.credential ? decodeJwt(response.credential) : null;
      if (!decoded || typeof decoded.email !== 'string' || !decoded.email) return;
      onCredential({
        email: decoded.email,
        name: typeof decoded.name === 'string' ? decoded.name : decoded.email.split('@')[0],
        avatar: typeof decoded.picture === 'string' ? decoded.picture : undefined,
      });
    };
    window.google.accounts.id.initialize({ client_id: clientId, callback });
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 320,
    });
  };

  return { clientId, ready, scriptError, renderButton };
}