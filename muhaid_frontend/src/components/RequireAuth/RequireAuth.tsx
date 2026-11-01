import type { JSX } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { getToken } from '../../lib/authToken';

/** Layout route: with no stored token, no request is made and the user goes to log in. */
export function RequireAuth(): JSX.Element {
  const location = useLocation();
  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <Outlet />;
}
