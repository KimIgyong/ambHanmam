import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertAttendancePolicyRequest {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(31)
  remote_default_count?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(31)
  remote_extra_count?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  remote_block_on_exceed?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  leave_auto_deduct?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  half_leave_auto_deduct?: boolean;
}
