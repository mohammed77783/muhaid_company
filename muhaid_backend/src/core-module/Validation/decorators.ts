import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsISO8601,
  Matches,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

// date-time with a required offset, e.g. 2026-10-31T10:00:00Z or ...+03:00
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const ToLowerCase = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  );

// ISO date-time string -> Date; anything else is left as-is and fails @IsDate.
export const IsoDateTime = () =>
  applyDecorators(
    Transform(({ value }) =>
      typeof value === 'string' &&
      ISO_DATE_TIME.test(value) &&
      !Number.isNaN(Date.parse(value))
        ? new Date(value)
        : value,
    ),
    IsDate({
      message: '$property must be an ISO date-time with a timezone offset',
    }),
  );

// calendar date kept as a string, e.g. 2026-10-31
export const IsoDate = () =>
  applyDecorators(
    Matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: '$property must be a date (YYYY-MM-DD)',
    }),
    IsISO8601(
      { strict: true },
      { message: '$property must be a date (YYYY-MM-DD)' },
    ),
  );

// Skipped when either value is missing, like a partial update.
export function IsOnOrAfter(property: string, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isOnOrAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: {
        message: `$property must be on or after ${property}`,
        ...options,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const other = (args.object as Record<string, unknown>)[property];
          return value == null || other == null || value >= other;
        },
      },
    });
}
