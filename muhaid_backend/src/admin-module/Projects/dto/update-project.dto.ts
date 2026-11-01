import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Trim } from '../../../core-module/Validation/index.js';
import { PROJECT_CODE, PROJECT_CODE_MESSAGE } from './create-project.dto.js';

export class UpdateProjectDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 50)
  @Matches(PROJECT_CODE, { message: PROJECT_CODE_MESSAGE })
  code?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 200)
  name?: string;
}
