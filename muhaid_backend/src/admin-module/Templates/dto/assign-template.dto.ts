import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AssignTemplateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID(undefined, { each: true })
  userIds: string[];
}
