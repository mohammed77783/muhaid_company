import { isAxiosError } from 'axios';

/**
 * One shape for the API's four error bodies (Nest standard, validation, extra-field
 * errors without statusCode, and auth). Always read `status` from here, never from the
 * body: extra-field errors have no statusCode.
 */
export class ApiError extends Error {
  /** HTTP status; 0 when the request never reached the server. */
  readonly status: number;
  /** Always a list: validation returns several messages, other errors one. */
  readonly messages: string[];
  /** The raw body, for the extra fields (missing, unknown, invalidUserIds). */
  readonly body: Record<string, unknown>;

  constructor(
    status: number,
    messages: string[],
    body: Record<string, unknown> = {},
  ) {
    super(messages.join('\n'));
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
    this.body = body;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** Worth retrying later: offline or a server failure. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  /** True when any message matches exactly, e.g. 'photo is required'. */
  hasMessage(message: string): boolean {
    return this.messages.includes(message);
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (isAxiosError(err)) {
    if (!err.response) return new ApiError(0, ['No connection to the server']);
    const data: unknown = err.response.data;
    const body =
      data && typeof data === 'object' && !(data instanceof Blob)
        ? (data as Record<string, unknown>)
        : {};
    const raw = body.message;
    const messages = Array.isArray(raw)
      ? raw.map(String)
      : [typeof raw === 'string' ? raw : err.message];
    return new ApiError(err.response.status, messages, body);
  }
  return new ApiError(0, [err instanceof Error ? err.message : String(err)]);
}

/**
 * Groups validation messages by top-level field: { email: [...], password: [...] }.
 * Messages start with the field path ("answers.2.note is required…"); array rules start
 * with "each value in <field>".
 */
export function fieldErrors(error: ApiError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const msg of error.messages) {
    const field = msg.replace(/^each value in /, '').split(/[ .]/, 1)[0];
    (out[field] ??= []).push(msg);
  }
  return out;
}
