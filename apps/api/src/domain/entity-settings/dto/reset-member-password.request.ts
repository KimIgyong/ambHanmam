import { IsOptional, IsIn } from 'class-validator';

export class ResetMemberPasswordRequest {
  @IsOptional()
  @IsIn(['email', 'generate'])
  mode?: 'email' | 'generate';
}
