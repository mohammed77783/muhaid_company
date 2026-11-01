import { useEffect, useState } from 'react';

import { getTokenExpiry } from '../lib/authToken';

const WARN_BEFORE_MS = 5 * 60_000;
const CHECK_EVERY_MS = 15_000;

function minutesLeft(): number | null {
  const expiry = getTokenExpiry();
  if (expiry === null) return null;
  const left = expiry - Date.now();
  return left > 0 && left <= WARN_BEFORE_MS ? Math.floor(left / 60_000) : null;
}

/** Whole minutes until the session ends, once it is close; otherwise null. */
export function useSessionExpiry(): number | null {
  const [minutes, setMinutes] = useState(minutesLeft);
  useEffect(() => {
    const timer = setInterval(() => setMinutes(minutesLeft()), CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
  return minutes;
}
