import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { userRole } from '../../../core-module/Database/schema/index.js';
import { Trim } from '../../../core-module/Validation/index.js';
import type { UserRole } from './create-user.dto.js';

export class UpdateUserDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsIn(userRole.enumValues)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // admin password reset
  @IsOptional()
  @IsString()
  @Length(8, 200)
  password?: string;
}
