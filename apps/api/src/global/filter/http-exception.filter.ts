import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BaseSingleResponse } from '@amb/types';
import { SiteErrorService } from '../../domain/admin/service/site-error.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() @Inject(SiteErrorService) private readonly siteErrorService?: SiteErrorService,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorCode = 'E9001';
    let errorMessage = exception.message;
    let details: Record<string, string[]> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      if (resp.code) errorCode = resp.code as string;
      if (resp.message) {
        if (Array.isArray(resp.message)) {
          errorMessage = resp.message[0] as string;
          details = { validation: resp.message as string[] };
        } else {
          errorMessage = resp.message as string;
        }
      }
    }

    const body: BaseSingleResponse<null> = {
      success: false,
      data: null,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);

    // 5xx 에러는 DB에 자동 기록
    if (status >= 500 && this.siteErrorService) {
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
        httpStatus: status,
        errorCode: errorCode,
        errorMessage: errorMessage,
        stackTrace: exception.stack || null,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip || null,
      }).catch(() => { /* silent fail */ });
    }
  }
}
