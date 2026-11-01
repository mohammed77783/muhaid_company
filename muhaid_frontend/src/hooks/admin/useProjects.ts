import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { projectsApi, projectsKeys } from '../../api/admin/projectsApi';
import { usersKeys } from '../../api/admin/usersApi';
import type { ApiError } from '../../lib/apiError';
import type {
  ListProjectsParams,
  Project,
  ProjectBody,
  ProjectDetail,
} from '../../types/admin/projects';
import type { Paginated } from '../../types/api';

const PICKER_PAGE_SIZE = 50;

export function useProjects(params: ListProjectsParams): Paginated<Project> {
  const { data } = useSuspenseQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => projectsApi.list(params),
  });
  return data;
}

/**
 * Every project, for a picker. The server has no text search, so a picker can only filter
 * what it has loaded: this keeps fetching until it has them all.
 */
export function useAllProjects(): Project[] {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: projectsKeys.allForPicker,
      queryFn: ({ pageParam }) =>
        projectsApi.list({ page: pageParam, limit: PICKER_PAGE_SIZE }),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.page * last.limit < last.total ? last.page + 1 : undefined,
    });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage)
      void fetchNextPage({ cancelRefetch: false });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return useMemo(() => data.pages.flatMap((page) => page.items), [data]);
}

export function useProject(id: string): ProjectDetail {
  const { data } = useSuspenseQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => projectsApi.get(id),
  });
  return data;
}

export function useCreateProject(): UseMutationResult<
  Project,
  ApiError,
  ProjectBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsKeys.lists });
    },
  });
}

export function useUpdateProject(
  id: string,
): UseMutationResult<Project, ApiError, Partial<ProjectBody>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => projectsApi.update(id, body),
    onSuccess: (project) => {
      queryClient.setQueryData<ProjectDetail>(projectsKeys.detail(id), (old) =>
        old ? { ...old, ...project } : old,
      );
      void queryClient.invalidateQueries({ queryKey: projectsKeys.lists });
      // Templates, inspections and users embed the project's code and name.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'inspections'],
      });
      void queryClient.invalidateQueries({ queryKey: usersKeys.details });
    },
  });
}
