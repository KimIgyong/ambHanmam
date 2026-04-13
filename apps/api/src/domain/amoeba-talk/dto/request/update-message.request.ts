import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageRequest {
  @ApiProperty({ example: 'Updated message content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
