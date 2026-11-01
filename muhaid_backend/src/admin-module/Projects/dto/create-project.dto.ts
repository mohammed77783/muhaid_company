import { IsString, Length, Matches } from 'class-validator';
import { Trim } from '../../../core-module/Validation/index.js';

export const PROJECT_CODE = /^[A-Za-z0-9_-]+$/;
export const PROJECT_CODE_MESSAGE = 'Use letters, digits, "-" or "_" only';

export class CreateProjectDto {
  // project number, e.g. PRJ-2026-001; also used in upload folder names
  @Trim()
  @IsString()
  @Length(1, 50)
  @Matches(PROJECT_CODE, { message: PROJECT_CODE_MESSAGE })
  code: string;

  @Trim()
  @IsString()
  @Length(1, 200)
  name: string;
}
