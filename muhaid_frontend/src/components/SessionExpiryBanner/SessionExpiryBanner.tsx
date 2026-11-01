import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { useLogout } from '../../hooks/useLogout';
import { useSessionExpiry } from '../../hooks/useSessionExpiry';
import { Alert } from '../Alert';
import { Button } from '../Button';

/**
 * Tokens can't be refreshed, so the way to stay signed in is to log in again. Says that
 * saved work survives: someone who thinks they will lose an hour's work does something rash.
 */
export function SessionExpiryBanner(): JSX.Element | null {
  const t = useT();
  const minutes = useSessionExpiry();
  const logout = useLogout();
  if (minutes === null) return null;
  return (
    <Alert
      variant="warning"
      action={
        <Button variant="secondary" onClick={logout}>
          {t.session.loginAgain}
        </Button>
      }
    >
      {t.session.expiring(minutes)}
    </Alert>
  );
}
