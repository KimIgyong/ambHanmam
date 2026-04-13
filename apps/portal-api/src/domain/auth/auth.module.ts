import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PortalCustomerEntity } from './entity/portal-customer.entity';
import { SvcClientEntity } from '../../shared-entities/client.entity';
import { SmtpSettingsEntity } from '../../shared-entities/smtp-settings.entity';
import { PortalAuthService } from './service/portal-auth.service';
import { PortalAuthController } from './controller/portal-auth.controller';
import { PortalJwtStrategy } from './strategy/portal-jwt.strategy';
import { EmailVerifyStore } from './service/email-verify.store';
import { PortalMailService } from './service/portal-mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalCustomerEntity, SvcClientEntity, SmtpSettingsEntity]),
    PassportModule.register({ defaultStrategy: 'portal-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return { secret };
      },
    }),
  ],
  controllers: [PortalAuthController],
  providers: [PortalAuthService, PortalJwtStrategy, EmailVerifyStore, PortalMailService],
  exports: [PortalAuthService],
})
export class AuthModule {}
