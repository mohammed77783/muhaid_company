const KEY = 'muhaid.token';

// localStorage, not a cookie: the inspector app must survive a reload with no network,
// and the API takes a bearer header. Storage can throw in locked-down browsers, so a
// failure reads as "signed out" instead of crashing the app.

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // Nothing to do: the session lasts until reload.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Already unreadable, so already signed out.
  }
}

/**
 * When the stored token expires, in ms since the epoch, for the "session ends soon"
 * warning only. Never for authorization: the server decides, and the role comes from
 * GET /auth/me.
 */
export function getTokenExpiry(): number | null {
  const payload = getToken()?.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
