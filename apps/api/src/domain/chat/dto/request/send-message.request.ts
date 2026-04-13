import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageRequest {
  @ApiProperty({ example: '매출 분석 리포트를 작성해주세요.', description: '메시지 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
