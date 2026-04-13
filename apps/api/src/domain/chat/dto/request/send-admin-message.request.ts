import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendAdminMessageRequest {
  @ApiProperty({ example: '확인 중입니다. 재현 경로와 화면 캡처를 추가로 남겨주세요.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}