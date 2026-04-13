import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreatePolarCheckoutRequest {
  @ApiProperty({ example: 'TALK' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  service: string;

  @ApiProperty({ example: 'PRO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  plan_tier: string;

  @ApiProperty({ enum: ['MONTHLY', 'ANNUAL'], example: 'MONTHLY' })
  @IsString()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billing_cycle: string;

  @ApiProperty({ example: 'https://www.amoeba.site/billing/success' })
  @IsString()
  @IsUrl()
  success_url: string;

  @ApiProperty({ example: 'https://www.amoeba.site/billing/cancel', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  cancel_url?: string;
}
