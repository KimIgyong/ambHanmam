import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BaseSingleResponse } from '@amb/types';
import { BusinessException } from './business.exception';

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const body: BaseSingleResponse<null> = {
      success: false,
      data: null,
      error: {
        code: exception.errorCode,
        message: exception.message,
      },
      timestamp: new Date().toISOString(),
    };

    response.status(exception.statusCode || HttpStatus.BAD_REQUEST).json(body);
  }
}
