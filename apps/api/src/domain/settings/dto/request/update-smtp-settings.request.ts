import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSmtpSettingsRequest {
  @ApiProperty({ example: 'smtp.gmail.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  host: string;

  @ApiProperty({ example: 587 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  user: string;

  @ApiProperty({ example: 'app_password', required: false })
  @IsString()
  @IsOptional()
  pass?: string;

  @ApiProperty({ example: 'AMB Management <noreply@amoeba.co.kr>' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  from: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  secure: boolean;
}
