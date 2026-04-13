import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { InvitationEntity } from '../invitation/entity/invitation.entity';
import { PartnerOrganizationEntity } from '../partner/entity/partner-organization.entity';
import { AuthModule } from '../auth/auth.module';
import { PartnerAuthService } from './service/partner-auth.service';
import { PartnerAuthController } from './controller/partner-auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      InvitationEntity,
      PartnerOrganizationEntity,
    ]),
    AuthModule,
  ],
  controllers: [PartnerAuthController],
  providers: [PartnerAuthService],
  exports: [PartnerAuthService],
})
export class PartnerPortalModule {}
