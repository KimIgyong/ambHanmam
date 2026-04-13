import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDriveSettingsRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  impersonate_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  billing_root_folder_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  billing_root_folder_name?: string;
}
