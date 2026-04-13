import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectEntityRequest {
  @ApiProperty({ description: '법인 선택용 임시 토큰' })
  @IsString()
  select_token: string;

  @ApiProperty({ description: '선택한 법인의 사용자 ID' })
  @IsUUID()
  user_id: string;
}
