import { IsString, IsNotEmpty, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterFolderRequest {
  @ApiProperty({ description: 'Google Drive folder ID' })
  @IsString()
  @IsNotEmpty()
  folder_id: string;

  @ApiProperty({ description: 'Display name for the folder' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  folder_name: string;

  @ApiProperty({ description: 'Drive type', enum: ['shared', 'personal'] })
  @IsString()
  @IsIn(['shared', 'personal'])
  drive_type: string;

  @ApiProperty({ description: 'Optional description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
