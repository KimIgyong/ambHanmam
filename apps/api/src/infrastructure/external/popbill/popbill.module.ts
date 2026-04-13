import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { POPBILL_SERVICE } from './popbill.interface';
import { PopbillMockService } from './popbill-mock.service';
import { PopbillRealService } from './popbill-real.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: POPBILL_SERVICE,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('POPBILL_PROVIDER', 'mock');
        if (provider === 'real') {
          return new PopbillRealService(configService);
        }
        return new PopbillMockService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [POPBILL_SERVICE],
})
export class PopbillModule {}
