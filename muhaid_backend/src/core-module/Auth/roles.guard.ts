import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthedRequest, UserRole } from './auth.types.js';
import { ROLES_KEY } from './decorators.js';

// Runs after JwtAuthGuard. Routes without @Roles() accept any signed-in user.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!roles?.length) return true;

    const { user } = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}
