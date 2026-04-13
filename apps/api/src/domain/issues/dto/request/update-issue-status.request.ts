import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIssueStatusRequest {
  @ApiProperty({ enum: ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'])
  status: string;

  @ApiPropertyOptional({ example: 'Approved for AI processing' })
  @IsString()
  @IsOptional()
  note?: string;
}
