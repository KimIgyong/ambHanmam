import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpsertEmailTemplateRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}
