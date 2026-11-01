import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  type HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  PG_CHECK_VIOLATION,
  PG_FOREIGN_KEY_VIOLATION,
  PG_RESTRICT_VIOLATION,
  PG_UNIQUE_VIOLATION,
  pgError,
} from './pg-errors.js';

const UNIQUE_MESSAGES: Record<string, string> = {
  users_email_lower_uq: 'A user with this email already exists',
  projects_code_unique: 'A project with this code already exists',
};

// The database is the last line of defence: turn its constraint errors into
// 4xx responses instead of 500s. Everything else goes to Nest's default handler.
@Catch()
export class PgExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(toHttpException(exception) ?? exception, host);
  }
}

function toHttpException(exception: unknown): HttpException | undefined {
  const err = pgError(exception);
  switch (err?.code) {
    case PG_UNIQUE_VIOLATION:
      return new ConflictException(
        UNIQUE_MESSAGES[err.constraint ?? ''] ?? 'Duplicate value',
      );
    case PG_FOREIGN_KEY_VIOLATION:
      return new BadRequestException('Referenced record does not exist');
    case PG_CHECK_VIOLATION:
      return new BadRequestException(`Constraint failed: ${err.constraint}`);
    case PG_RESTRICT_VIOLATION:
      return new ConflictException('Submitted inspections cannot be changed');
    default:
      return undefined;
  }
}
