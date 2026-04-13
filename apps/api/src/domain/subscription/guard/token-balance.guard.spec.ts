/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenBalanceGuard } from './token-balance.guard';
import { TokenWalletService } from '../service/token-wallet.service';

describe('TokenBalanceGuard', () => {
  let guard: TokenBalanceGuard;
  let tokenWalletService: { getTotalBalance: jest.Mock };

  const createMockContext = (overrides?: {
    entityId?: string;
    headerEntityId?: string;
  }): ExecutionContext => {
    const req: any = {
      user: overrides?.entityId ? { entityId: overrides.entityId } : undefined,
      headers: overrides?.headerEntityId
        ? { 'x-entity-id': overrides.headerEntityId }
        : {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    tokenWalletService = { getTotalBalance: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBalanceGuard,
        { provide: TokenWalletService, useValue: tokenWalletService },
      ],
    }).compile();

    guard = module.get(TokenBalanceGuard);
  });

  afterEach(() => jest.clearAllMocks());

  it('should allow request when balance > 0', async () => {
    tokenWalletService.getTotalBalance.mockResolvedValue(50000);
    const ctx = createMockContext({ entityId: 'ent-001' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const req = ctx.switchToHttp().getRequest();
    expect(req['tokenBalance']).toBe(50000);
  });

  it('should throw ForbiddenException (E29001) when balance is 0', async () => {
    tokenWalletService.getTotalBalance.mockResolvedValue(0);
    const ctx = createMockContext({ entityId: 'ent-001' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should use x-entity-id header when user.entityId is not available', async () => {
    tokenWalletService.getTotalBalance.mockResolvedValue(100);
    const ctx = createMockContext({ headerEntityId: 'ent-from-header' });

    await guard.canActivate(ctx);

    expect(tokenWalletService.getTotalBalance).toHaveBeenCalledWith('ent-from-header');
  });

  it('should pass (return true) when no entity ID available', async () => {
    const ctx = createMockContext({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(tokenWalletService.getTotalBalance).not.toHaveBeenCalled();
  });

  it('should prefer user.entityId over x-entity-id header', async () => {
    tokenWalletService.getTotalBalance.mockResolvedValue(100);
    const ctx = createMockContext({
      entityId: 'ent-from-jwt',
      headerEntityId: 'ent-from-header',
    });

    await guard.canActivate(ctx);

    expect(tokenWalletService.getTotalBalance).toHaveBeenCalledWith('ent-from-jwt');
  });
});
