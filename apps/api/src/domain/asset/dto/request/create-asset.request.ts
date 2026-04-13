import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAssetRequest {
  @ApiProperty({ example: '노트북 15인치' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  asset_name: string;

  @ApiProperty({ example: 'IT_EQUIPMENT', enum: ['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM', 'VEHICLE'] })
  @IsString()
  @IsIn(['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM', 'VEHICLE'])
  asset_category: string;

  @ApiProperty({ example: 'PURCHASE', enum: ['PURCHASE', 'LEASE', 'OTHER'] })
  @IsString()
  @IsIn(['PURCHASE', 'LEASE', 'OTHER'])
  ownership_type: string;

  @ApiPropertyOptional({ example: 'IT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  department?: string;

  @ApiPropertyOptional({ example: 'IT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiPropertyOptional({ example: '본사 3층 A구역' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'STORED', enum: ['IN_USE', 'STORED', 'REPAIRING', 'DISPOSAL_PENDING', 'RESERVED'] })
  @IsOptional()
  @IsString()
  @IsIn(['IN_USE', 'STORED', 'REPAIRING', 'DISPOSAL_PENDING', 'RESERVED'])
  status?: string;

  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'XPS 15' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model_name?: string;

  @ApiPropertyOptional({ example: 'SN-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serial_no?: string;

  @ApiPropertyOptional({ example: '2026-02-24' })
  @IsOptional()
  @IsString()
  purchase_date?: string;

  @ApiPropertyOptional({ example: 'Amoeba Vendor' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  vendor?: string;

  @ApiPropertyOptional({ example: 'USD', enum: ['USD', 'KRW', 'VND'] })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'KRW', 'VND'])
  currency?: string;

  @ApiPropertyOptional({ example: '1500000.00' })
  @IsOptional()
  @IsNumberString()
  purchase_amount?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  depreciation_years?: number;

  @ApiPropertyOptional({ example: '100000.00' })
  @IsOptional()
  @IsNumberString()
  residual_value?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  quantity?: number;

  @ApiPropertyOptional({ example: 'BCODE-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ example: 'RFID-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rfid_code?: string;

  @ApiPropertyOptional({ example: 12, description: '회의실 자산일 때 필수' })
  @IsOptional()
  @IsInt()
  room_capacity?: number;

  @ApiPropertyOptional({ type: [String], example: ['TV', 'PROJECTOR'] })
  @IsOptional()
  room_equipments?: string[];

  @ApiPropertyOptional({ example: '09:00', description: '회의실 자산일 때' })
  @IsOptional()
  @IsString()
  room_available_from?: string;

  @ApiPropertyOptional({ example: '18:00', description: '회의실 자산일 때' })
  @IsOptional()
  @IsString()
  room_available_to?: string;
}
