import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '../../lib/feedback';

const UPDATE_CHECK_MS = 30 * 60 * 1000;
const isQuizInProgress = (path: string) => /\/student\/quizzes\/[^/]+\/attempt/.test(path);

/**
 * Service-worker lifecycle. A new version never reloads the page by itself:
 * the user gets an "Update ready" toast — and never while sitting a quiz,
 * where a reload would interrupt them (answers are safe, but it's jarring).
 * Must render inside the Router.
 */
export function PwaManager() {
  const location = useLocation();
  const shownFor = useRef(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Phones keep the app open for days — look for new versions periodically
      if (registration) setInterval(() => registration.update().catch(() => {}), UPDATE_CHECK_MS);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('Ready to work offline', 'The app is installed on this device and opens even without a connection.');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh || shownFor.current || isQuizInProgress(location.pathname)) return;
    shownFor.current = true;
    toast.withAction(
      'info',
      'A new version is ready',
      'Update now to get the latest fixes. It only takes a second.',
      { label: 'Update now', onClick: () => void updateServiceWorker(true) },
      true,
    );
  }, [needRefresh, location.pathname, updateServiceWorker]);

  return null;
}
