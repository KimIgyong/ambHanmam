import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationRequest {
  @ApiProperty({ example: 'Hong Gildong' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '010-1234-5678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'IT', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  department?: string;

  @ApiProperty({ example: 'Developer', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  position?: string;
}
