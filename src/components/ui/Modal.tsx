import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Close a popup when the pointer lands anywhere outside it, or on Escape.
 *
 * Attach the returned ref to the element that wraps *both* the trigger and the
 * panel: a tap on the trigger itself is the trigger's own business, and would
 * otherwise close and reopen the panel in one gesture.
 *
 * `pointerdown` covers mouse, touch and pen with a single listener and fires
 * before focus moves, so a tap outside dismisses on phones as well as desktop.
 */
export function useDismissOnOutside<T extends HTMLElement>(onDismiss: () => void, active = true) {
  const ref = useRef<T | null>(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    const onPointerDown = (e: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(e.target as Node)) dismiss.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss.current();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return ref;
}

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Overlay padding; the roster sheets sit flush to the screen edge on phones. */
  padding?: string;
  label?: string;
}

const OVERLAY =
  'fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center z-50';

/**
 * The one dialog shell: a dimmed backdrop that dismisses on a tap outside the
 * panel or on Escape, with the page held still behind it. Children are the
 * panel itself, so each form keeps its own width and chrome.
 *
 * Portalled to <body> so no blurred or transformed ancestor can trap it.
 */
export const Modal: React.FC<ModalProps> = ({ onClose, children, padding = 'p-4', label }) => {
  // A drag that starts inside the panel and lifts over the backdrop is not a
  // tap outside, so both ends of the gesture have to land on the backdrop.
  const pressedBackdrop = useRef(false);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [close]);

  return createPortal(
    <div
      className={`${OVERLAY} ${padding}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={e => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={e => {
        if (pressedBackdrop.current && e.target === e.currentTarget) close();
      }}
    >
      {children}
    </div>,
    document.body
  );
};
