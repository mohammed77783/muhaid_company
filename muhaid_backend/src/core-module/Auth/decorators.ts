import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { AuthedRequest, UserRole } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

// Every route needs a valid token unless marked @Public().
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
