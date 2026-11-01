import { apiClient } from '../../lib/apiClient';
import type {
  CreateUserBody,
  ListUsersParams,
  UpdateUserBody,
  User,
  UserDetail,
} from '../../types/admin/users';
import type { Paginated } from '../../types/api';

export const usersApi = {
  create: async (body: CreateUserBody): Promise<User> =>
    (await apiClient.post<User>('/admin/users', body)).data,

  list: async ({
    isActive,
    ...rest
  }: ListUsersParams): Promise<Paginated<User>> =>
    (
      await apiClient.get<Paginated<User>>('/admin/users', {
        // The server accepts only the strings "true" and "false".
        params: {
          ...rest,
          ...(isActive === undefined ? {} : { isActive: String(isActive) }),
        },
      })
    ).data,

  get: async (id: string): Promise<UserDetail> =>
    (await apiClient.get<UserDetail>(`/admin/users/${id}`)).data,

  update: async (id: string, body: UpdateUserBody): Promise<User> =>
    (await apiClient.patch<User>(`/admin/users/${id}`, body)).data,
};

// Under "admin", so a 403 re-checks the role and the offline cache leaves them out.
export const usersKeys = {
  all: ['admin', 'users'] as const,
  lists: ['admin', 'users', 'list'] as const,
  list: (params: ListUsersParams) =>
    ['admin', 'users', 'list', params] as const,
  inspectorsForPicker: (activeOnly: boolean) =>
    ['admin', 'users', 'list', 'picker', { activeOnly }] as const,
  details: ['admin', 'users', 'detail'] as const,
  detail: (id: string) => ['admin', 'users', 'detail', id] as const,
};
