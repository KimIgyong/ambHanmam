import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionRequest {
  @ApiProperty({ description: '요금제 코드', enum: ['FREE', 'BASIC', 'PREMIUM'] })
  @IsIn(['FREE', 'BASIC', 'PREMIUM'])
  plan_code: string;

  @ApiProperty({ description: '사용자 수' })
  @IsInt()
  @Min(1)
  user_count: number;

  @ApiPropertyOptional({ description: '결제 주기', enum: ['MONTHLY', 'ANNUAL'] })
  @IsOptional()
  @IsIn(['MONTHLY', 'ANNUAL'])
  billing_cycle?: 'MONTHLY' | 'ANNUAL';

  @ApiPropertyOptional({ description: '결제 성공 후 리다이렉트 URL' })
  @IsOptional()
  @IsString()
  success_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entity_id?: string;
}

export class PurchaseTokenRequest {
  @ApiProperty({ description: '구매 토큰 수 (10000 단위)' })
  @IsInt()
  @Min(10000)
  token_amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entity_id?: string;
}

export class AddStorageRequest {
  @ApiProperty({ description: '추가 스토리지 GB (5 단위)' })
  @IsInt()
  @Min(5)
  storage_gb: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  entity_id?: string;
}
