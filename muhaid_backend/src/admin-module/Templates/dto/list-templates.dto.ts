import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../core-module/Validation/index.js';

export class ListTemplatesDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
