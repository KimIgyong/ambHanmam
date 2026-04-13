import { IsString, IsOptional, IsEnum, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChannelMappingDto {
  @IsString()
  swc_id: string;

  @IsString()
  slack_channel_id: string;

  @IsString()
  @IsOptional()
  slack_channel_name?: string;

  @IsString()
  @IsOptional()
  ama_channel_id?: string;

  @IsString()
  @IsOptional()
  ama_channel_name?: string;

  @IsEnum(['BIDIRECTIONAL', 'INBOUND_ONLY', 'OUTBOUND_ONLY'])
  @IsOptional()
  direction?: string;
}

export class ImportHistoryDto {
  @IsString()
  @IsOptional()
  oldest?: string;

  @IsString()
  @IsOptional()
  latest?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class UpdateChannelMappingDto {
  @IsEnum(['ACTIVE', 'PAUSED', 'DISCONNECTED'])
  @IsOptional()
  status?: string;

  @IsEnum(['BIDIRECTIONAL', 'INBOUND_ONLY', 'OUTBOUND_ONLY'])
  @IsOptional()
  direction?: string;
}
