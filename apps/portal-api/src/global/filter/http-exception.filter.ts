import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseSingleResponse } from '@amb/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
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
  }
}
