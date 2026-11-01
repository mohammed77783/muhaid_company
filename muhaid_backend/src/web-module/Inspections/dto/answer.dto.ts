import { Transform } from 'class-transformer';
import {
  IsIn,
  IsUUID,
  registerDecorator,
  type ValidationArguments,
} from 'class-validator';
import { answerValue } from '../../../core-module/Database/schema/index.js';

const MAX_NOTE_LENGTH = 1000;

export type AnswerValue = (typeof answerValue.enumValues)[number];

// الملاحظة إلزامية عند اختيار «لا»
function IsAnswerNote() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isAnswerNote',
      target: object.constructor,
      propertyName,
      validator: {
        validate(note: unknown, args: ValidationArguments) {
          if (note === null) return (args.object as AnswerDto).answer !== 'no';
          return typeof note === 'string' && note.length <= MAX_NOTE_LENGTH;
        },
        defaultMessage(args: ValidationArguments) {
          return args.value === null
            ? '$property is required when the answer is "no"'
            : `$property must be a string of at most ${MAX_NOTE_LENGTH} characters`;
        },
      },
    });
}

export class AnswerDto {
  @IsUUID()
  itemId: string;

  @IsIn(answerValue.enumValues)
  answer: AnswerValue;

  // blank or missing notes are stored as null
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : (value ?? null),
  )
  @IsAnswerNote()
  note: string | null = null;
}
