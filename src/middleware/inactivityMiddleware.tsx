import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

/** How many milliseconds of inactivity before auto-logout (default: 30 minutes) */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/** How many milliseconds before the timeout to show a warning toast (default: 2 minutes) */
const WARNING_BEFORE_MS = 2 * 60 * 1000;

/** DOM events that count as "activity" */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

/**
 * useInactivityMiddleware
 *
 * Listens for user activity (mouse, keyboard, touch, scroll).
 * If the user is idle for INACTIVITY_TIMEOUT_MS:
 *  - Shows a warning toast at WARNING_BEFORE_MS before the deadline
 *  - Logs the user out with a "session expired due to inactivity" toast
 *
 * Mount this hook ONCE inside the authenticated layout (AppLayout).
 */
export function useInactivityMiddleware() {
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningToastIdRef = useRef<string | number | null>(null);
  const scheduleLogoutRef = useRef<() => void>(() => {});

  const clearAllTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    logoutTimerRef.current = null;
    warningTimerRef.current = null;
  }, []);

  const dismissWarningToast = useCallback(() => {
    if (warningToastIdRef.current !== null) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
  }, []);

  const scheduleLogout = useCallback(() => {
    clearAllTimers();
    dismissWarningToast();

    warningTimerRef.current = setTimeout(() => {
      const remainingSecs = Math.round(WARNING_BEFORE_MS / 1000);
      const remainingMins = Math.floor(remainingSecs / 60);
      const id = toast.warning('Session expiring soon', {
        description: `You've been inactive. You'll be logged out in ${remainingMins} minute${remainingMins !== 1 ? 's' : ''} unless you do something.`,
        duration: WARNING_BEFORE_MS,
        action: {
          label: 'Stay logged in',
          onClick: () => {
            scheduleLogoutRef.current();
          },
        },
      });
      warningToastIdRef.current = id;
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    logoutTimerRef.current = setTimeout(async () => {
      dismissWarningToast();
      toast.error('You have been logged out', {
        description: 'Your session ended due to inactivity.',
        duration: 5000,
      });
      await authService.logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearAllTimers, dismissWarningToast]);

  useEffect(() => {
    scheduleLogoutRef.current = scheduleLogout;
  }, [scheduleLogout]);

  const handleActivity = useCallback(() => {
    dismissWarningToast();
    scheduleLogoutRef.current();
  }, [dismissWarningToast]);

  useEffect(() => {
    // Only run if the user is authenticated
    if (!authService.isAuthenticated()) return;

    // Start the initial idle clock
    scheduleLogout();

    // Throttle: only reset the timer at most once per 30 seconds to avoid constant churn
    let throttleHandle: ReturnType<typeof setTimeout> | null = null;
    const throttledActivity = () => {
      if (throttleHandle) return;
      throttleHandle = setTimeout(() => {
        handleActivity();
        throttleHandle = null;
      }, 30_000);
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, throttledActivity, { passive: true })
    );

    return () => {
      clearAllTimers();
      dismissWarningToast();
      if (throttleHandle) clearTimeout(throttleHandle);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, throttledActivity)
      );
    };
  }, [scheduleLogout, handleActivity, clearAllTimers, dismissWarningToast]);
}
