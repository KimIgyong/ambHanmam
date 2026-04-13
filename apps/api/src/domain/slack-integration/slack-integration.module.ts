import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SlackWorkspaceConfigEntity } from './entity/slack-workspace-config.entity';
import { SlackChannelMappingEntity } from './entity/slack-channel-mapping.entity';
import { SlackMessageMappingEntity } from './entity/slack-message-mapping.entity';
import { TalkMessageEntity } from '../amoeba-talk/entity/talk-message.entity';
import { TalkChannelEntity } from '../amoeba-talk/entity/talk-channel.entity';
import { TalkChannelMemberEntity } from '../amoeba-talk/entity/talk-channel-member.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { SlackOAuthController } from './controller/slack-oauth.controller';
import { SlackWebhookController } from './controller/slack-webhook.controller';
import { SlackAdminController } from './controller/slack-admin.controller';
import { SlackApiService } from './service/slack-api.service';
import { SlackOAuthService } from './service/slack-oauth.service';
import { SlackEventService } from './service/slack-event.service';
import { SlackOutboundService } from './service/slack-outbound.service';
import { SlackWorkspaceService } from './service/slack-workspace.service';
import { SettingsModule } from '../settings/settings.module';
import { AmoebaTalkModule } from '../amoeba-talk/amoeba-talk.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SlackWorkspaceConfigEntity,
      SlackChannelMappingEntity,
      SlackMessageMappingEntity,
      TalkMessageEntity,
      TalkChannelEntity,
      TalkChannelMemberEntity,
      UserEntity,
    ]),
    SettingsModule,     // CryptoService
    AmoebaTalkModule,   // TalkSseService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '10m' },
      }),
    }),
  ],
  controllers: [
    SlackOAuthController,
    SlackWebhookController,
    SlackAdminController,
  ],
  providers: [
    SlackApiService,
    SlackOAuthService,
    SlackEventService,
    SlackOutboundService,
    SlackWorkspaceService,
  ],
})
export class SlackIntegrationModule {}
