import { plainToInstance, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
  registerDecorator,
  ValidateNested,
} from 'class-validator';
import { IsoDateTime } from '../../../core-module/Validation/index.js';
import { AnswerDto } from './answer.dto.js';

// Allowed clock skew between the device and the server.
const MAX_FUTURE_MS = 5 * 60_000;

// multipart/form-data sends every field as a string, so `answers` arrives as JSON text.
function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// Non-dates are left to @IsDate.
function IsNotFuture() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isNotFuture',
      target: object.constructor,
      propertyName,
      options: { message: '$property is in the future' },
      validator: {
        validate: (value: unknown) =>
          !(value instanceof Date) ||
          value.getTime() <= Date.now() + MAX_FUTURE_MS,
      },
    });
}

export class SubmitInspectionDto {
  // generated on the device (crypto.randomUUID()); the idempotency key for offline sync
  @IsUUID()
  id: string;

  @IsUUID()
  templateId: string;

  // device time when the form was filled, possibly long before it synced
  @IsoDateTime()
  @IsNotFuture()
  filledAt: Date;

  // @Type runs before @Transform, so the parsed JSON is converted here
  @Transform(({ value }) => {
    const parsed = parseJson(value);
    return Array.isArray(parsed)
      ? parsed.map((a: unknown) =>
          a !== null && typeof a === 'object'
            ? plainToInstance(AnswerDto, a)
            : a,
        )
      : parsed;
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique((a: AnswerDto) => a?.itemId, {
    message: 'Each item can be answered only once',
  })
  @ValidateNested({ each: true })
  answers: AnswerDto[];
}
