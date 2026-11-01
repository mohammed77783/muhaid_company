import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { authApi, authKeys } from '../api/authApi';
import type { ApiError } from '../lib/apiError';
import { setToken } from '../lib/authToken';
import type { CurrentUser, LoginBody, LoginResponse } from '../types/auth';

export function useLogin(): UseMutationResult<
  LoginResponse,
  ApiError,
  LoginBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ accessToken, user }) => {
      // An expired session keeps its cache for the same person's return. Anyone else on
      // this device must not see the previous account's forms or inspections.
      const previous = queryClient.getQueryData<CurrentUser>(authKeys.me);
      if (previous?.id !== user.id) queryClient.clear();

      setToken(accessToken);
      // Already known, so the app doesn't need an extra /auth/me call.
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}
