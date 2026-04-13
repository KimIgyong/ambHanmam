import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AiUsageService } from '../service/ai-usage.service';

@Injectable()
export class ApiQuotaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiQuotaInterceptor.name);

  constructor(private readonly aiUsageService: AiUsageService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.companyId) {
      return next.handle();
    }

    const result = await this.aiUsageService.checkQuota(user.companyId);

    if (!result.allowed && result.action === 'BLOCK') {
      const isDaily = result.dailyLimit && (result.dailyUsed ?? 0) >= result.dailyLimit;
      const errorCode = isDaily ? 'E4010' : 'E4011';
      throw new ForbiddenException({
        statusCode: 403,
        error: errorCode,
        message: isDaily
          ? 'Daily token quota exceeded'
          : 'Monthly token quota exceeded',
        purchaseUrl: '/ai-quota/products',
      });
    }

    if (result.action === 'WARN') {
      this.logger.warn(
        `Quota warning for entity ${user.companyId}: ` +
        `daily=${result.dailyPercent?.toFixed(1)}%, monthly=${result.monthlyPercent?.toFixed(1)}%`,
      );
    }

    return next.handle();
  }
}
