import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export interface DataScopeInfo {
  /** 범위: 'ALL' (HQ) | 'OWN_ORG' (하위 법인) | 'PARTNER' (파트너사) | 'CLIENT' (고객사) */
  scope: 'ALL' | 'OWN_ORG' | 'PARTNER' | 'CLIENT';
  /** 필터할 조직 ID (HQ면 null) */
  companyId: string | null;
  /** 필터할 고객사 ID (CLIENT_LEVEL만) */
  cliId: string | null;
  /** 필터할 파트너사 ID (PARTNER_LEVEL만) */
  partnerId: string | null;
  /** HQ 소속 여부 */
  isHq: boolean;
}

/**
 * 데이터 조회 시 사용자 소속 조직 기반 자동 필터링
 *
 * - HQ(ADMIN_LEVEL) 소속: 필터 없음 → 전체 조직 데이터 반환
 * - 하위 법인(USER_LEVEL) 소속: 본인 company_id로 필터링
 */
@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return next.handle();

    if (user.level === 'ADMIN_LEVEL') {
      request.dataScope = {
        scope: 'ALL',
        companyId: null,
        cliId: null,
        partnerId: null,
        isHq: true,
      } satisfies DataScopeInfo;
    } else if (user.level === 'PARTNER_LEVEL') {
      request.dataScope = {
        scope: 'PARTNER',
        companyId: null,
        cliId: null,
        partnerId: user.partnerId || null,
        isHq: false,
      } satisfies DataScopeInfo;
    } else if (user.level === 'CLIENT_LEVEL') {
      request.dataScope = {
        scope: 'CLIENT',
        companyId: null,
        cliId: user.cliId || null,
        partnerId: null,
        isHq: false,
      } satisfies DataScopeInfo;
    } else {
      request.dataScope = {
        scope: 'OWN_ORG',
        companyId: user.companyId,
        cliId: null,
        partnerId: null,
        isHq: false,
      } satisfies DataScopeInfo;
    }

    return next.handle();
  }
}
