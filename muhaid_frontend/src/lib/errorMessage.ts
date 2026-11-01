import type { ApiError } from './apiError';
import type { Messages } from './i18n/messages';

/** A failed write, for a message beside the form or in a snackbar. */
export function errorMessage(error: ApiError, t: Messages): string {
  if (error.isNetworkError) return t.errors.network;
  if (error.status >= 500) return t.errors.server;
  if (error.status === 403) return t.errors.forbidden;
  return error.messages.join(' · ') || t.errors.unexpected;
}
