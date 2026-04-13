import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/** Accept-Language → 기본 타임존 매핑 */
const LOCALE_TIMEZONE_MAP: Record<string, string> = {
  vi: 'Asia/Ho_Chi_Minh',
  ko: 'Asia/Seoul',
  en: 'UTC',
};

/**
 * 요청 객체에 timezone 속성을 주입하는 인터셉터
 *
 * 우선순위:
 *  1. JWT 토큰의 사용자 timezone (로그인 사용자)
 *  2. X-Timezone 헤더 (명시적 지정)
 *  3. Accept-Language 기반 기본값
 *  4. UTC (최종 폴백)
 */
@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const timezone =
      user?.timezone ||
      request.headers['x-timezone'] ||
      this.getDefaultByLocale(request.headers['accept-language']) ||
      'UTC';

    request.timezone = timezone;

    return next.handle();
  }

  private getDefaultByLocale(acceptLanguage: string | undefined): string | undefined {
    if (!acceptLanguage) return undefined;
    const lang = acceptLanguage.split(',')[0].split('-')[0].trim();
    return LOCALE_TIMEZONE_MAP[lang];
  }
}
