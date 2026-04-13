import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateAssetStatusRequest {
  @ApiProperty({ example: 'IN_USE', enum: ['IN_USE', 'STORED', 'REPAIRING', 'DISPOSAL_PENDING', 'DISPOSED', 'RESERVED'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['IN_USE', 'STORED', 'REPAIRING', 'DISPOSAL_PENDING', 'DISPOSED', 'RESERVED'])
  status: string;

  @ApiProperty({ example: '대여 승인으로 사용중 전환' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}
