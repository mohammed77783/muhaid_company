import { IsEmail, IsString, Length } from 'class-validator';
import { ToLowerCase, Trim } from '../../Validation/index.js';

export class LoginDto {
  @Trim()
  @ToLowerCase()
  @IsEmail()
  email: string;

  @IsString()
  @Length(1, 200)
  password: string;
}
