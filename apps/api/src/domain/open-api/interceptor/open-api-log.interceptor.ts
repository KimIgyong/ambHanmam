import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { OAuthService } from '../../oauth/service/oauth.service';
import { OAuthTokenContext } from '../../oauth/interface/oauth-context.interface';

@Injectable()
export class OpenApiLogInterceptor implements NestInterceptor {
  constructor(private readonly oauthService: OAuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.log(request, response.statusCode, start);
        },
        error: (err) => {
          this.log(request, err.status || 500, start);
        },
      }),
    );
  }

  private log(request: any, statusCode: number, start: number): void {
    const ctx: OAuthTokenContext | undefined = request.oauthContext;
    if (!ctx) return;

    const durationMs = Date.now() - start;
    this.oauthService.logApiCall({
      appId: ctx.appId,
      userId: ctx.userId,
      entityId: ctx.entityId,
      method: request.method,
      path: request.url,
      statusCode,
      ip: request.ip || request.connection?.remoteAddress || '',
      userAgent: request.headers['user-agent'],
      durationMs,
    }).catch(() => {
      // 로그 실패해도 API 응답에 영향 없음
    });
  }
}
