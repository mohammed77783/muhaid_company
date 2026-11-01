import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { userRole } from '../../../core-module/Database/schema/index.js';
import { ToLowerCase, Trim } from '../../../core-module/Validation/index.js';

export type UserRole = (typeof userRole.enumValues)[number];

export class CreateUserDto {
  @Trim()
  @IsString()
  @Length(1, 200)
  name: string;

  @Trim()
  @ToLowerCase()
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 200)
  password: string;

  @IsIn(userRole.enumValues)
  role: UserRole = 'inspector';
}
