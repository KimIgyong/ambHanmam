import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { DataScopeInfo } from '../interceptor/data-scope.interceptor';

/**
 * 컨트롤러에서 현재 사용자의 데이터 접근 범위를 주입
 *
 * @example
 * @Get()
 * findAll(@DataScope() scope: DataScopeInfo) {
 *   return this.service.findAll(scope);
 * }
 */
export const DataScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DataScopeInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request.dataScope ?? { scope: 'OWN_ORG', companyId: null, isHq: false };
  },
);

export type { DataScopeInfo };
