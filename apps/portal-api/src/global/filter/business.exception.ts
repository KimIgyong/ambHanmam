import { HttpStatus } from '@nestjs/common';

export class BusinessException extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = 'BusinessException';
  }
}
