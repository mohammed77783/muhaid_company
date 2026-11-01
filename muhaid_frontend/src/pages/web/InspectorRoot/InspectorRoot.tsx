import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';

import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useOutboxSync } from '../../../hooks/web/useOutboxSync';

/** Above every inspector screen, with or without the bottom nav: the outbox keeps syncing. */
export function InspectorRoot(): JSX.Element {
  const user = useCurrentUser();
  useOutboxSync(user.id);
  return <Outlet />;
}
