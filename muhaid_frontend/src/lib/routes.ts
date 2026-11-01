import type { Role } from '../types/api';

/** Where each role lands. Each role only has pages under its own prefix. */
export function homePath(role: Role): string {
  return role === 'admin' ? '/admin/inspections' : '/inspector/forms';
}

/** The last page someone tried to open, if this role can actually use it. */
export function returnPath(role: Role, from: string | undefined): string {
  const otherPrefix = role === 'admin' ? '/inspector' : '/admin';
  if (!from || from === '/' || from.startsWith(otherPrefix))
    return homePath(role);
  return from;
}
