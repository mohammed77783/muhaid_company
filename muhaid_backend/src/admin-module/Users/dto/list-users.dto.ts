import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { userRole } from '../../../core-module/Database/schema/index.js';
import { PaginationDto } from '../../../core-module/Validation/index.js';
import type { UserRole } from './create-user.dto.js';

export class ListUsersDto extends PaginationDto {
  @IsOptional()
  @IsIn(userRole.enumValues)
  role?: UserRole;

  // query strings: only "true" / "false" are accepted
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
}
