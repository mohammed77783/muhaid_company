import type { JSX } from 'react';
import { Outlet } from 'react-router-dom';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { Role } from '../../types/api';
import { WrongRoleScreen } from '../WrongRoleScreen';

interface RequireRoleProps {
  role: Role;
}

/** Layout route: the other role's endpoints return 403, so explain instead of failing. */
export function RequireRole({ role }: RequireRoleProps): JSX.Element {
  const user = useCurrentUser();
  return user.role === role ? <Outlet /> : <WrongRoleScreen expected={role} />;
}
