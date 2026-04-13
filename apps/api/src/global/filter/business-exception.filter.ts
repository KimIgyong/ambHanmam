import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Inject, Optional } from '@nestjs/common';
import { Response, Request } from 'express';
import { BaseSingleResponse } from '@amb/types';
import { BusinessException } from './business.exception';
import { SiteErrorService } from '../../domain/admin/service/site-error.service';

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() @Inject(SiteErrorService) private readonly siteErrorService?: SiteErrorService,
  ) {}

  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body: BaseSingleResponse<null> = {
      success: false,
      data: null,
      error: {
        code: exception.errorCode,
        message: exception.message,
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = exception.statusCode || HttpStatus.BAD_REQUEST;
    response.status(statusCode).json(body);

    // 5xx 에러는 DB에 자동 기록
    if (statusCode >= 500 && this.siteErrorService) {
      const user = (request as any).user;
      this.siteErrorService.create({
        source: 'BACKEND',
        app: 'API',
        userId: user?.userId || null,
        userEmail: user?.email || null,
        userLevel: user?.level || null,
        entityId: user?.entityId || null,
        pageUrl: null,
        apiEndpoint: request.originalUrl,
        httpMethod: request.method,
        httpStatus: statusCode,
        errorCode: exception.errorCode,
        errorMessage: exception.message,
        stackTrace: exception.stack || null,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip || null,
      }).catch(() => { /* silent fail */ });
    }
  }
}
