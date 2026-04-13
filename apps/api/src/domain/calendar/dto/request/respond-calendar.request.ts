import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class RespondCalendarRequest {
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED', 'TENTATIVE'] })
  @IsString()
  @IsIn(['ACCEPTED', 'DECLINED', 'TENTATIVE'])
  clp_response_status: string;
}
