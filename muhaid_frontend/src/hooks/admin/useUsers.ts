import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  type UseMutationResult,
} from '@tanstack/react-query';

import { useEffect, useMemo } from 'react';

import { usersApi, usersKeys } from '../../api/admin/usersApi';
import { authKeys } from '../../api/authApi';
import type { ApiError } from '../../lib/apiError';
import type {
  CreateUserBody,
  ListUsersParams,
  UpdateUserBody,
  User,
  UserDetail,
} from '../../types/admin/users';
import type { Paginated } from '../../types/api';

export function useUsers(params: ListUsersParams): Paginated<User> {
  const { data } = useSuspenseQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
  return data;
}

/**
 * Every inspector, for a picker. The server has no text search, so a picker can only
 * filter what it has loaded: this keeps fetching until it has them all.
 */
export function useAllInspectors({
  activeOnly,
}: {
  activeOnly: boolean;
}): User[] {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: usersKeys.inspectorsForPicker(activeOnly),
      queryFn: ({ pageParam }) =>
        usersApi.list({
          page: pageParam,
          limit: 50,
          role: 'inspector',
          ...(activeOnly ? { isActive: true } : {}),
        }),
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

export function useUser(id: string): UserDetail {
  const { data } = useSuspenseQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.get(id),
  });
  return data;
}

export function useCreateUser(): UseMutationResult<
  User,
  ApiError,
  CreateUserBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists });
    },
  });
}

export function useUpdateUser(
  id: string,
): UseMutationResult<User, ApiError, UpdateUserBody> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => usersApi.update(id, body),
    onSuccess: (user) => {
      // The response has no templates: merge, so the detail page keeps them.
      queryClient.setQueryData<UserDetail>(usersKeys.detail(id), (old) =>
        old ? { ...old, ...user } : old,
      );
      void queryClient.invalidateQueries({ queryKey: usersKeys.lists });
      // Templates list their assignees' names and active state.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
      // An admin can rename themselves.
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
