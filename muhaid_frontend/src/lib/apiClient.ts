import axios, { type AxiosInstance } from 'axios';

import { toApiError } from './apiError';
import { clearToken, getToken } from './authToken';

/** Fired when the server rejects the stored token. App.tsx sends the user to /login. */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

// No /api prefix: every path in API.md is appended to the base URL as is.
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    const apiError = toApiError(err);
    // 401 means the token expired, or the account was deactivated or deleted. There is
    // no refresh endpoint, so the only fix is to log in again. A failed login has no
    // stored token, so it doesn't fire a logout.
    if (apiError.status === 401 && getToken()) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
    return Promise.reject(apiError);
  },
);
