import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateWorkItemRequest {
  @IsIn(['DOC', 'REPORT', 'TODO', 'NOTE', 'EMAIL', 'ANALYSIS'])
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED', 'DEPARTMENT', 'ENTITY', 'PUBLIC'])
  visibility?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsUUID()
  ref_id?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
