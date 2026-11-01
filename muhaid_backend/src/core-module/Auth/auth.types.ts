import type { Request } from 'express';
import type { userRole } from '../Database/schema/index.js';

export type UserRole = (typeof userRole.enumValues)[number];

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

// Set on the request by JwtAuthGuard, loaded fresh from the database.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type AuthedRequest = Request & { user?: AuthUser };
