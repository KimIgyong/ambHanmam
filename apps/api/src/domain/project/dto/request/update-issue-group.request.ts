import { IsString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIssueGroupRequest {
  @ApiProperty({ description: 'Group type', enum: ['epic', 'component', 'unassigned'] })
  @IsString()
  @IsIn(['epic', 'component', 'unassigned'])
  group_type: string;

  @ApiPropertyOptional({ description: 'Epic or Component UUID (null for unassigned)' })
  @IsUUID()
  @IsOptional()
  group_id?: string;
}
