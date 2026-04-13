import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGatewayService } from './service/payment-gateway.service';
import { PaymentGatewayController } from './controller/payment-gateway.controller';
import { PortalPaymentEntity } from './entity/portal-payment.entity';
import { PortalCustomerEntity } from '../auth/entity/portal-customer.entity';
import { VnpayProvider } from './provider/vnpay.provider';
import { VnptepayProvider } from './provider/vnptepay.provider';
import { TossProvider } from './provider/toss.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalPaymentEntity, PortalCustomerEntity]),
  ],
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService, VnpayProvider, VnptepayProvider, TossProvider],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
