import { IsOptional, IsString } from 'class-validator';

export class AddClientCommentRequest {
  @IsString()
  @IsOptional()
  content: string;
}
