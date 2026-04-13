import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishPageRequest {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
