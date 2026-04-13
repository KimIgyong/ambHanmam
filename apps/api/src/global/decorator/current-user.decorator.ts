import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  /** 사용자 레벨: ADMIN_LEVEL | USER_LEVEL */
  level?: string;
  /** 사용자 상태: PENDING | ACTIVE | INACTIVE | SUSPENDED | WITHDRAWN */
  status?: string;
  /** 소속 조직 ID */
  companyId?: string;
  /** HQ 소속 여부 */
  isHq?: boolean;
  /** 비밀번호 변경 필요 여부 */
  mustChangePw?: boolean;
  departmentId?: string;
  departmentRole?: string;
  entityId?: string;
  /** CLIENT_LEVEL 사용자의 소속 고객사 ID */
  cliId?: string;
  /** PARTNER_LEVEL 사용자의 소속 파트너사 ID */
  partnerId?: string;
  /** 사용자 타임존 (IANA, e.g. Asia/Ho_Chi_Minh) */
  timezone?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload;
    return data ? user[data] : user;
  },
);
