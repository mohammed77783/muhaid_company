import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { templatesApi, templatesKeys } from '../../api/web/templatesApi';
import type { ApiError } from '../../lib/apiError';
import type { WebTemplate } from '../../types/web/templates';

interface MyTemplates {
  /** Assigned to me and valid on the day the list was fetched. */
  templates: WebTemplate[];
  /** When the list last came from the server, in ms since the epoch. */
  updatedAt: number;
  isRefreshing: boolean;
  /** Fetches the list again. Resolves with the error, if any, and keeps the last good list. */
  refresh: () => Promise<ApiError | null>;
}

export function useMyTemplates(): MyTemplates {
  const queryClient = useQueryClient();
  const query = useSuspenseQuery({
    queryKey: templatesKeys.list(),
    queryFn: async () => {
      const list = await templatesApi.listMine();
      // Seed the detail cache too, so opening a form never waits on the network.
      for (const template of list) {
        queryClient.setQueryData(templatesKeys.detail(template.id), template);
      }
      return list;
    },
    staleTime: 5 * 60_000,
  });
  return {
    templates: query.data,
    updatedAt: query.dataUpdatedAt,
    isRefreshing: query.isFetching,
    refresh: async () => (await query.refetch()).error,
  };
}
