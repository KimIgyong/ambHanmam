import { IsString, IsIn } from 'class-validator';

export class AddProjectMemberRequest {
  @IsString()
  user_id: string;

  @IsString()
  @IsIn(['PM', 'LEAD', 'MEMBER', 'REVIEWER', 'OBSERVER'])
  role: string;
}
