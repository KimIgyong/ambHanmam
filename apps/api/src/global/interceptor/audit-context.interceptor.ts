import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { REQUEST_CONTEXT } from '../constant/request-context';

/**
 * Guard 이후 실행되어 AsyncLocalStorage에 userId를 설정합니다.
 * DataAuditSubscriber에서 현재 요청의 userId를 참조할 수 있게 합니다.
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const store = REQUEST_CONTEXT.getStore();
    if (store && request.user?.userId) {
      store.userId = request.user.userId;
    }
    return next.handle();
  }
}
