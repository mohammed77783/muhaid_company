import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import {
  IsoDate,
  IsOnOrAfter,
  Trim,
} from '../../../core-module/Validation/index.js';

// بنود النموذج, in display order
export const TemplateItems = () =>
  applyDecorators(
    Transform(({ value }) =>
      Array.isArray(value)
        ? value.map((v) => (typeof v === 'string' ? v.trim() : v))
        : value,
    ),
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(50),
    IsString({ each: true }),
    Length(1, 500, { each: true }),
  );

export class CreateTemplateDto {
  @IsUUID()
  projectId: string;

  @Trim()
  @IsString()
  @Length(1, 200)
  name: string;

  @IsoDate()
  validFrom: string;

  // null or missing = no end date
  @IsOptional()
  @IsoDate()
  @IsOnOrAfter('validFrom')
  validTo?: string | null;

  @TemplateItems()
  items: string[];
}
