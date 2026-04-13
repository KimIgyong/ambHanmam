import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class AddProjectFileRequest {
  @IsString()
  title: string;

  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  @IsIn(['PROPOSAL', 'REVIEW', 'EXECUTION', 'CLOSURE'])
  phase?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  @IsString()
  gdrive_file_id?: string;

  @IsOptional()
  @IsString()
  gdrive_url?: string;
}
