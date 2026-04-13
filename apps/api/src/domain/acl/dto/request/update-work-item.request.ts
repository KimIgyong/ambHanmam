import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateWorkItemRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED', 'DEPARTMENT', 'ENTITY', 'PUBLIC'])
  visibility?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
