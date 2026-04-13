import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OAuthAuthorizationCodeEntity } from './entity/oauth-authorization-code.entity';
import { OAuthTokenEntity } from './entity/oauth-token.entity';
import { OpenApiLogEntity } from './entity/open-api-log.entity';
import { PartnerAppEntity } from '../partner-app/entity/partner-app.entity';
import { PartnerAppInstallEntity } from '../partner-app/entity/partner-app-install.entity';
import { OAuthService } from './service/oauth.service';
import { OAuthClientService } from './service/oauth-client.service';
import { OAuthController } from './controller/oauth.controller';
import { OAuthTokenGuard } from './guard/oauth-token.guard';
import { RequireScopeGuard } from './guard/require-scope.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OAuthAuthorizationCodeEntity,
      OAuthTokenEntity,
      OpenApiLogEntity,
      PartnerAppEntity,
      PartnerAppInstallEntity,
    ]),
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
  controllers: [OAuthController],
  providers: [OAuthService, OAuthClientService, OAuthTokenGuard, RequireScopeGuard],
  exports: [OAuthService, OAuthClientService, OAuthTokenGuard, RequireScopeGuard],
})
export class OAuthModule {}
