import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import {
  IsoDateTime,
  PaginationDto,
  Trim,
} from '../../../core-module/Validation/index.js';

export class ListInspectionsDto extends PaginationDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 50)
  workOrder?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  // range on filledAt
  @IsOptional()
  @IsoDateTime()
  from?: Date;

  @IsOptional()
  @IsoDateTime()
  to?: Date;
}
