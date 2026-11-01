import { apiClient } from '../lib/apiClient';
import type { CurrentUser, LoginBody, LoginResponse } from '../types/auth';

export const authApi = {
  login: async (body: LoginBody): Promise<LoginResponse> =>
    (await apiClient.post<LoginResponse>('/auth/login', body)).data,

  me: async (): Promise<CurrentUser> =>
    (await apiClient.get<CurrentUser>('/auth/me')).data,
};

export const authKeys = {
  me: ['auth', 'me'] as const,
};
