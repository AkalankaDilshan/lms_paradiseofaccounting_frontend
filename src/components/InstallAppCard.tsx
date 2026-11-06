import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { isIos, promptInstall, useInstallState } from '../lib/pwa';
import { toast } from '../lib/feedback';
import { Button } from './ui/button';

const DISMISS_KEY = 'lms-install-dismissed-at';
const REMIND_AFTER_DAYS = 14;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < REMIND_AFTER_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * "Install the app" invitation for the student dashboard. Android/Chrome: the
 * real install prompt. iPhone/iPad (no prompt API): Share → Add to Home Screen
 * steps. Hidden once installed, on desktop without a prompt, or for 14 days
 * after "Not now".
 */
export function InstallAppCard() {
  const { canPrompt, installed } = useInstallState();
  const [dismissed, setDismissed] = useState(recentlyDismissed);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const ios = isIos();

  const visible = !installed && !dismissed && (canPrompt || ios);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  };

  const install = async () => {
    if (ios) {
      setShowIosSteps((v) => !v);
      return;
    }
    if (await promptInstall()) toast.success('App installed', 'Open “Asela LMS” from your home screen any time.');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-4"
        >
          <button type="button" onClick={dismiss} aria-label="Not now" className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <img src="/apple-touch-icon.png" alt="" className="size-12 shrink-0 rounded-xl shadow-md ring-1 ring-border" />
            <div className="min-w-0">
              <p className="font-semibold leading-tight">Install the Asela LMS app</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Opens full-screen from your home screen, faster, and works on weak connections.</p>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {showIosSteps && (
              <motion.ol
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 space-y-2 overflow-hidden rounded-xl bg-background/60 p-3 text-sm"
              >
                <li className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">1</span>
                  Tap <Share className="size-4 text-info" /> <span className="font-medium">Share</span> in Safari’s toolbar
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">2</span>
                  Choose <SquarePlus className="size-4" /> <span className="font-medium">Add to Home Screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">3</span>
                  Tap <span className="font-medium">Add</span> — done!
                </li>
              </motion.ol>
            )}
          </AnimatePresence>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" onClick={install}>
              <Download /> {ios ? (showIosSteps ? 'Hide steps' : 'Show me how') : 'Install app'}
            </Button>
            <Button variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
