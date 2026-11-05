import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, ShieldAlert, Trash2, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { closeAlert, feedbackStore, toast as toastApi } from '../../lib/feedback';
import type { Toast, Tone } from '../../lib/feedback';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const TONES: Record<Tone, { icon: LucideIcon; chip: string; bar: string; ring: string; glow: string }> = {
  success: { icon: CheckCircle2, chip: 'bg-success/15 text-success', bar: 'bg-success', ring: 'ring-success/25', glow: 'from-success/10' },
  info: { icon: Info, chip: 'bg-info/15 text-info', bar: 'bg-info', ring: 'ring-info/25', glow: 'from-info/10' },
  warning: { icon: AlertTriangle, chip: 'bg-warning/15 text-warning', bar: 'bg-warning', ring: 'ring-warning/30', glow: 'from-warning/10' },
  error: { icon: XCircle, chip: 'bg-destructive/15 text-destructive', bar: 'bg-destructive', ring: 'ring-destructive/30', glow: 'from-destructive/10' },
  critical: { icon: OctagonAlert, chip: 'bg-destructive/15 text-destructive', bar: 'bg-destructive', ring: 'ring-destructive/40', glow: 'from-destructive/15' },
};

/** Renders toasts, the critical-alert dialog and the confirm dialog. Mount once. */
export function FeedbackHost() {
  const state = useSyncExternalStore(feedbackStore.subscribe, feedbackStore.get);

  // Connection drops are the most common "error" on phones — say so up front
  useEffect(() => {
    const offline = () => toastApi.warning('You’re offline', 'Changes won’t save until you reconnect. Quiz answers are kept on this device.');
    const online = () => toastApi.success('Back online');
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    };
  }, []);
  return (
    <>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {state.toasts.map((t) => (
            <ToastCard key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </div>
      <AlertDialogHost />
      <ConfirmDialogHost />
    </>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const tone = TONES[toast.tone];
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!toast.duration || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => toastApi.dismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.duration, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
      role={toast.tone === 'error' || toast.tone === 'critical' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 backdrop-blur',
        tone.ring,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent', tone.glow)} />
      <div className="relative flex gap-3 p-3.5 pr-10">
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', tone.chip)}>
          <tone.icon className="size-4" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold leading-snug">{toast.title}</p>
          {toast.message && <p className="mt-0.5 text-sm text-muted-foreground">{toast.message}</p>}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                toastApi.dismiss(toast.id);
              }}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => toastApi.dismiss(toast.id)}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      {toast.duration > 0 && (
        <div
          className={cn('toast-progress absolute bottom-0 left-0 h-0.5 w-full origin-left', tone.bar)}
          style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      )}
    </motion.div>
  );
}

function DialogShell({
  open,
  onClose,
  tone,
  icon: Icon,
  title,
  children,
  footer,
  labelId,
}: {
  open: boolean;
  onClose: () => void;
  tone: { chip: string; bar: string; glow: string };
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  labelId: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={labelId}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10"
          >
            <div className={cn('h-1 w-full', tone.bar)} />
            <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent', tone.glow)} />
            <div className="relative space-y-4 p-6">
              <motion.span
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.6, delay: 0.05 }}
                className={cn('flex size-12 items-center justify-center rounded-2xl', tone.chip)}
              >
                <Icon className="size-6" />
              </motion.span>
              <div>
                <h2 id={labelId} className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {children}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">{footer}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AlertDialogHost() {
  const { alert } = useSyncExternalStore(feedbackStore.subscribe, feedbackStore.get);
  const tone = TONES[alert?.tone ?? 'critical'];
  const icon = alert?.title.toLowerCase().includes('suspend') || alert?.title.toLowerCase().includes('session') ? ShieldAlert : tone.icon;
  return (
    <DialogShell
      open={!!alert}
      onClose={closeAlert}
      tone={tone}
      icon={icon}
      title={alert?.title ?? ''}
      labelId="feedback-alert-title"
      footer={
        alert?.primary ? (
          <>
            <Button variant="outline" size="lg" onClick={closeAlert}>
              Close
            </Button>
            <Button
              size="lg"
              onClick={() => {
                const action = alert.primary!.onClick;
                closeAlert();
                action();
              }}
            >
              {alert.primary.label}
            </Button>
          </>
        ) : (
          <Button size="lg" autoFocus onClick={closeAlert}>
            OK, got it
          </Button>
        )
      }
    >
      <p className="mt-1.5 text-sm text-muted-foreground">{alert?.message}</p>
    </DialogShell>
  );
}

const CONFIRM_TONES = {
  danger: { ...TONES.error, icon: Trash2, button: 'bg-destructive text-white hover:bg-destructive/90' },
  warning: { ...TONES.warning, icon: AlertTriangle, button: 'bg-warning text-white hover:bg-warning/90' },
  info: { ...TONES.info, icon: Info, button: '' },
};

function ConfirmDialogHost() {
  const { confirm } = useSyncExternalStore(feedbackStore.subscribe, feedbackStore.get);
  const tone = CONFIRM_TONES[confirm?.tone ?? 'danger'];
  return (
    <DialogShell
      open={!!confirm}
      onClose={() => confirm?.resolve(false)}
      tone={tone}
      icon={tone.icon}
      title={confirm?.title ?? ''}
      labelId="feedback-confirm-title"
      footer={
        <>
          <Button variant="outline" size="lg" autoFocus onClick={() => confirm?.resolve(false)}>
            {confirm?.cancelLabel}
          </Button>
          <Button size="lg" className={tone.button} onClick={() => confirm?.resolve(true)}>
            {confirm?.confirmLabel}
          </Button>
        </>
      }
    >
      {confirm?.description && <p className="mt-1.5 text-sm text-muted-foreground">{confirm.description}</p>}
    </DialogShell>
  );
}
