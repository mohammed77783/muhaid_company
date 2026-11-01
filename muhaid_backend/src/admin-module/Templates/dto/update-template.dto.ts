import { IsOptional, IsString, Length } from 'class-validator';
import {
  IsoDate,
  IsOnOrAfter,
  Trim,
} from '../../../core-module/Validation/index.js';
import { TemplateItems } from './create-template.dto.js';

export class UpdateTemplateDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsoDate()
  validFrom?: string;

  // null clears the end date
  @IsOptional()
  @IsoDate()
  @IsOnOrAfter('validFrom')
  validTo?: string | null;

  // replaces all items; only allowed before the first inspection
  @IsOptional()
  @TemplateItems()
  items?: string[];
}
