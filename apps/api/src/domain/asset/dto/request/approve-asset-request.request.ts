import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ApproveAssetRequestRequest {
  @ApiProperty({ example: 'APPROVE', enum: ['APPROVE', 'REJECT'] })
  @IsString()
  @IsIn(['APPROVE', 'REJECT'])
  action: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'CATEGORY_ONLY 신청 승인 시 배정할 자산 ID' })
  @IsOptional()
  @IsUUID()
  assign_asset_id?: string;

  @ApiPropertyOptional({ example: '승인합니다' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;

  @ApiPropertyOptional({ example: '중복 예약으로 반려', description: 'REJECT 시 필수' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reject_reason?: string;
}
