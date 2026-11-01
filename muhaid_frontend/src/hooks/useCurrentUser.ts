import { useSuspenseQuery } from '@tanstack/react-query';

import { authApi, authKeys } from '../api/authApi';
import type { CurrentUser } from '../types/auth';

/**
 * The signed-in user, freshly checked against the server. The role comes from here, never
 * from decoding the token: the server reads it from the database, so the token's copy can
 * be out of date. Offline, this answers from the persisted cache.
 */
export function useCurrentUser(): CurrentUser {
  const { data } = useSuspenseQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
  });
  return data;
}
