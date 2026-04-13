import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationRequest {
  @ApiProperty({ example: 'MANAGEMENT', description: '부서 코드' })
  @IsString()
  @IsNotEmpty()
  unit_code: string;

  @ApiProperty({ example: '경영 전략 상담', description: '대화 제목' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;
}
