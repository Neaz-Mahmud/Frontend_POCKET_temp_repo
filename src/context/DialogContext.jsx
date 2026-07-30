import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleHelp, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import '../styles/Dialog.css';

/**
 * App-wide replacement for window.confirm / window.alert / window.prompt.
 *
 *   const { confirm, prompt, toast } = useDialog();
 *
 *   if (!(await confirm({ title: 'Delete this file?', tone: 'danger',
 *                         confirmLabel: 'Delete' }))) return;
 *   const reason = await prompt({ title: 'Reason for rejection', multiline: true });
 *   toast.error('Could not delete the file');
 *
 * `confirm` resolves true/false and `prompt` resolves the string or null, so
 * existing call sites keep their shape — they only gain an `await`. `alert`
 * is the same card with a single acknowledging button, for the rare message
 * that must be read before the user carries on.
 *
 * Requests queue: if something asks while a dialog is already open, it waits
 * its turn instead of stealing the answer of the one on screen.
 */

const DialogContext = createContext(null);

const DIALOG_ICON = { danger: TriangleAlert, success: CircleCheck, info: Info, default: CircleHelp };
const TOAST_ICON = { error: CircleX, success: CircleCheck, info: Info };

const TOAST_MS = 5000;
// Matches the exit animations in Dialog.css (--dur-fast) so the element is
// removed only once it has finished animating out.
const EXIT_MS = 130;

let uid = 0;
const nextId = () => ++uid;

export const DialogProvider = ({ children }) => {
  const [queue, setQueue] = useState([]); // queue[0] is the dialog on screen
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState(''); // prompt input value
  const [toasts, setToasts] = useState([]);

  const active = queue[0] || null;
  const cardRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);
  const inputRef = useRef(null);
  const openerRef = useRef(null); // element to hand focus back to on close
  const closingRef = useRef(false);

  // ── Toasts ──────────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const pushToast = useCallback((type, text, title) => {
    if (!text && !title) return;
    const id = nextId();
    setToasts((list) => [...list, { id, type, text, title }]);
    window.setTimeout(() => dismissToast(id), TOAST_MS);
  }, [dismissToast]);

  // Callable directly — toast('Saved') — or by tone: toast.error('…').
  const toast = useMemo(() => Object.assign(
    (text, type = 'info') => pushToast(type, text),
    {
      error: (text, title) => pushToast('error', text, title),
      success: (text, title) => pushToast('success', text, title),
      info: (text, title) => pushToast('info', text, title),
    },
  ), [pushToast]);

  // ── Dialogs ─────────────────────────────────────────────
  const ask = useCallback((request) => new Promise((resolve) => {
    openerRef.current = document.activeElement;
    setQueue((list) => [...list, { ...request, id: nextId(), resolve }]);
  }), []);

  const confirm = useCallback((options) => ask({ kind: 'confirm', ...options }), [ask]);
  const prompt = useCallback((options) => ask({ kind: 'prompt', ...options }), [ask]);
  const alert = useCallback((options) => ask({ kind: 'alert', ...options }), [ask]);

  // Answer the dialog on screen, then let it animate out before dropping it
  // from the queue (which reveals the next request, if any).
  const settle = useCallback((result) => {
    if (!active || closingRef.current) return;
    closingRef.current = true;
    active.resolve(result);
    setClosing(true);
    window.setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      setQueue((list) => list.slice(1));
    }, EXIT_MS);
  }, [active]);

  const cancelValue = active?.kind === 'prompt' ? null : false;

  // Reset the draft for each new prompt, and move focus into the dialog.
  useEffect(() => {
    if (!active) {
      openerRef.current?.focus?.();
      return;
    }
    setDraft(active.kind === 'prompt' ? (active.defaultValue ?? '') : '');
    const frame = window.requestAnimationFrame(() => {
      if (active.kind === 'prompt') inputRef.current?.focus();
      // On a destructive dialog the safe action takes focus, so a stray
      // Return keypress cancels instead of deleting something.
      else if (active.tone === 'danger') (cancelRef.current || confirmRef.current)?.focus();
      else confirmRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  // Escape closes, Tab stays inside the card, and the page behind stops
  // scrolling while a dialog is up.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        settle(active.kind === 'prompt' ? null : false);
        return;
      }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const focusable = cardRef.current.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, settle]);

  const api = useMemo(() => ({ confirm, prompt, alert, toast }), [confirm, prompt, alert, toast]);

  const Icon = active ? (DIALOG_ICON[active.tone] || DIALOG_ICON.default) : null;
  const submitDisabled = active?.kind === 'prompt' && active.required !== false && !draft.trim();

  const submit = (e) => {
    e?.preventDefault();
    if (submitDisabled) return;
    settle(active.kind === 'prompt' ? draft.trim() : true);
  };

  return (
    <DialogContext.Provider value={api}>
      {children}

      {active && (
        <div
          className={`dialog-backdrop${closing ? ' is-closing' : ''}`}
          onMouseDown={(e) => { if (e.target === e.currentTarget) settle(cancelValue); }}
        >
          <div
            className="dialog-card"
            ref={cardRef}
            role={active.kind === 'confirm' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby={`dialog-title-${active.id}`}
            aria-describedby={active.message ? `dialog-message-${active.id}` : undefined}
          >
            <div className={`dialog-icon${active.tone ? ` dialog-icon-${active.tone}` : ''}`}>
              <Icon size={21} />
            </div>

            <h3 className="dialog-title" id={`dialog-title-${active.id}`}>{active.title}</h3>
            {active.message && (
              <p className="dialog-message" id={`dialog-message-${active.id}`}>{active.message}</p>
            )}

            <form onSubmit={submit}>
              {active.kind === 'prompt' && (
                <div className="dialog-field">
                  <label htmlFor={`dialog-input-${active.id}`}>{active.label || 'Your answer'}</label>
                  {active.multiline ? (
                    <textarea
                      id={`dialog-input-${active.id}`}
                      ref={inputRef}
                      value={draft}
                      placeholder={active.placeholder}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e); }}
                    />
                  ) : (
                    <input
                      id={`dialog-input-${active.id}`}
                      ref={inputRef}
                      value={draft}
                      placeholder={active.placeholder}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  )}
                </div>
              )}

              <div className="dialog-actions">
                {active.kind !== 'alert' && (
                  <button type="button" ref={cancelRef} className="btn btn-secondary" onClick={() => settle(cancelValue)}>
                    {active.cancelLabel || 'Cancel'}
                  </button>
                )}
                <button
                  type="submit"
                  ref={confirmRef}
                  className={`btn ${active.tone === 'danger' ? 'btn-danger-solid' : 'btn-primary'}`}
                  disabled={submitDisabled}
                >
                  {active.confirmLabel || (active.kind === 'alert' ? 'Got it' : 'Confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const ToastIcon = TOAST_ICON[t.type] || Info;
          return (
            <div key={t.id} className={`toast toast-${t.type}${t.closing ? ' is-closing' : ''}`}>
              <span className="toast-icon"><ToastIcon size={18} /></span>
              <div className="toast-body">
                <div className="toast-title">{t.title || t.text}</div>
                {t.title && t.text && <div className="toast-text">{t.text}</div>}
              </div>
              <button type="button" className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
              <span className="toast-timer" style={{ animationDuration: `${TOAST_MS}ms` }} />
            </div>
          );
        })}
      </div>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside a DialogProvider');
  return ctx;
};
