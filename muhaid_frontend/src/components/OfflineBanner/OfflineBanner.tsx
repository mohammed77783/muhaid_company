import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Alert } from '../Alert';

/** Present for as long as the connection is gone, and says where the work is kept. */
export function OfflineBanner(): JSX.Element | null {
  const t = useT();
  const online = useOnlineStatus();
  if (online) return null;
  return <Alert variant="offline">{t.offline.banner}</Alert>;
}
