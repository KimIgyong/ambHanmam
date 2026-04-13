import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoCommentRequest {
  @ApiProperty({ example: '마감일 앞두고 진행 상황 공유 부탁합니다' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
