import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationDto, Trim } from '../../../core-module/Validation/index.js';

export class ListMyInspectionsDto extends PaginationDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 50)
  workOrder?: string;
}
