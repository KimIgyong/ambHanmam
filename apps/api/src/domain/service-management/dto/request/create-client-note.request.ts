import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateClientNoteRequest {
  @IsOptional() @IsUUID()
  subscription_id?: string;

  @IsString()
  @IsIn(['GENERAL', 'MEETING', 'ISSUE', 'FEEDBACK', 'CALL'])
  type: string;

  @IsOptional() @IsString()
  title?: string;

  @IsString()
  content: string;
}
