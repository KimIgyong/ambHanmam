import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class CreatePolarAddonCheckoutRequest {
  @ApiProperty({ example: 'TALK' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  service: string;

  @ApiProperty({ example: 'EXTRA_SEATS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  addon_type: string;

  @ApiProperty({ example: 5, required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: 'https://talk.amoeba.site/settings/team' })
  @IsString()
  @IsUrl()
  success_url: string;

  @ApiProperty({ example: 'https://talk.amoeba.site/settings/team', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  cancel_url?: string;
}
