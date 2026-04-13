import { AsyncLocalStorage } from 'async_hooks';

export interface RequestStore {
  userId?: string;
  ip?: string;
}

/**
 * AsyncLocalStorage를 통해 현재 요청 컨텍스트를 전역에서 참조할 수 있게 합니다.
 * NestJS Middleware에서 초기화되며, TypeORM Subscriber 등에서 userId를 가져올 때 사용합니다.
 */
export const REQUEST_CONTEXT = new AsyncLocalStorage<RequestStore>();
