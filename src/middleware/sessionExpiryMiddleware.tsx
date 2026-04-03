import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { apiClient } from '@/services/apiClient';

/** Check the token expiry every this many ms */
const CHECK_INTERVAL_MS = 60 * 1000; // every 1 minute

/** Warn if the token expires within this many ms */
const WARN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

const decodeJwtExpiry = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as { exp: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

/**
 * useSessionExpiryMiddleware
 *
 * Polls the stored JWT every minute. When the token is within 5 minutes of
 * expiry it shows a persistent warning toast with a "Stay logged in" action
 * that triggers a token refresh. If no action is taken, the user is redirected
 * to login when the token finally expires.
 *
 * Mount this hook ONCE inside the authenticated layout (AppLayout).
 */
export function useSessionExpiryMiddleware() {
  const warnToastIdRef = useRef<string | number | null>(null);
  const hasWarnedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const dismissWarning = useCallback(() => {
    if (warnToastIdRef.current !== null) {
      toast.dismiss(warnToastIdRef.current);
      warnToastIdRef.current = null;
    }
    hasWarnedRef.current = false;
  }, []);

  const handleStayLoggedIn = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    dismissWarning();

    try {
      // Trigger a lightweight authenticated call; apiClient will proactively refresh
      // the token as part of checkAndRefreshToken(). We deliberately call a cheap
      // no-op-style endpoint — the profile endpoint is always available.
      await apiClient.get('/api/admin/profile');
      toast.success('Session extended', {
        description: 'Your session has been refreshed successfully.',
        duration: 3000,
      });
    } catch {
      toast.error('Could not extend session', {
        description: 'Please log in again.',
        duration: 4000,
      });
      await authService.logout();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [dismissWarning]);

  useEffect(() => {
    const check = () => {
      const token = authService.getToken();
      if (!token) return;

      const expiry = decodeJwtExpiry(token);
      if (!expiry) return;

      const msLeft = expiry - Date.now();

      if (msLeft <= 0) {
        // Token already expired — logout
        dismissWarning();
        toast.error('Your session has expired', {
          description: 'Please log in again to continue.',
          duration: 5000,
        });
        authService.logout();
        return;
      }

      if (msLeft <= WARN_THRESHOLD_MS && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        const minsLeft = Math.max(1, Math.floor(msLeft / 60_000));

        const id = toast.warning('Session expiring soon', {
          description: `Your session expires in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}. Click "Stay logged in" to extend it.`,
          duration: msLeft, // stay visible until expiry
          action: {
            label: 'Stay logged in',
            onClick: handleStayLoggedIn,
          },
        });
        warnToastIdRef.current = id;
      }

      // If there's plenty of time left, reset so we can warn again on future refetch
      if (msLeft > WARN_THRESHOLD_MS && hasWarnedRef.current) {
        dismissWarning();
      }
    };

    // Run immediately then on interval
    check();
    const intervalId = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      dismissWarning();
    };
  }, [handleStayLoggedIn, dismissWarning]);
}
