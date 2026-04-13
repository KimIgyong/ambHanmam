import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TokenWalletService } from '../service/token-wallet.service';

@Injectable()
export class TokenBalanceGuard implements CanActivate {
  constructor(private readonly tokenWalletService: TokenWalletService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const entId: string | undefined =
      req.user?.entityId ?? req.headers?.['x-entity-id'];

    if (!entId) return true;

    const balance = await this.tokenWalletService.getTotalBalance(entId);

    if (balance <= 0) {
      throw new ForbiddenException({
        code: 'E29001',
        message: 'AI service suspended. Token balance is zero. Please recharge.',
        data: { balance: 0 },
      });
    }

    req['tokenBalance'] = balance;
    return true;
  }
}
