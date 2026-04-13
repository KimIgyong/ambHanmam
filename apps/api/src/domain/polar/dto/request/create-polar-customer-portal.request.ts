import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePolarCustomerPortalRequest {
  @ApiProperty({ required: false, example: 'https://www.amoeba.site/billing' })
  @IsOptional()
  @IsString()
  @IsUrl()
  return_url?: string;
}
