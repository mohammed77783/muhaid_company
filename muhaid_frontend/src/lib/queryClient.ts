import { QueryCache, QueryClient } from '@tanstack/react-query';

import { authKeys } from '../api/authApi';
import { ApiError } from './apiError';

declare module '@tanstack/react-query' {
  interface Register {
    // apiClient rejects with ApiError only, so hooks see a typed error.
    defaultError: ApiError;
  }
}

/** How long the persisted cache stays usable with no connection. */
export const PERSIST_MAX_AGE = 7 * 24 * 60 * 60_000;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Roles change on the server immediately. A 403 on a role's own routes means this
    // account no longer has that role, so reload it and let RequireRole explain.
    onError: (error, query) => {
      const [root] = query.queryKey;
      if (error.status === 403 && (root === 'web' || root === 'admin')) {
        void queryClient.invalidateQueries({ queryKey: authKeys.me });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A restored cache is dropped by the collector unless it outlives the persisted age.
      gcTime: PERSIST_MAX_AGE,
      // Always try the request instead of pausing it. A paused read with no cached data
      // would leave a Suspense boundary waiting until the connection returns.
      networkMode: 'offlineFirst',
      // Retrying a 4xx never helps. Offline, a retry would pause, so fail straight away.
      retry: (count, error) =>
        error instanceof ApiError &&
        error.isRetryable &&
        navigator.onLine &&
        count < 2,
    },
    mutations: { retry: false, networkMode: 'offlineFirst' },
  },
});
