import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { UserEntity } from './entity/user.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { CellEntity } from '../members/entity/cell.entity';
import { PasswordResetEntity } from './entity/password-reset.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { LoginHistoryEntity } from '../entity-settings/entity/login-history.entity';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { UserController } from './controller/user.controller';
import { UserProfileController } from './controller/user-profile.controller';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { DataScopeInterceptor } from './interceptor/data-scope.interceptor';
import { InvitationModule } from '../invitation/invitation.module';
import { MailModule } from '../../infrastructure/external/mail/mail.module';
import { SettingsModule } from '../settings/settings.module';
import { PortalUserMappingEntity } from '../portal-bridge/entity/portal-user-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, UserCellEntity, CellEntity, PasswordResetEntity,
      UserUnitRoleEntity, UnitEntity, EntityUserRoleEntity, HrEntityEntity, LoginHistoryEntity,
      PortalUserMappingEntity,
    ]),
    InvitationModule,
    MailModule,
    SettingsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: { expiresIn: '4h' },
        };
      },
    }),
  ],
  controllers: [AuthController, UserController, UserProfileController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataScopeInterceptor,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
