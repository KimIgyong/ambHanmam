import { IsString, IsNotEmpty } from 'class-validator';

export class RejectLeaveRequestRequest {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
