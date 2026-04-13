import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalkChannelEntity } from './entity/talk-channel.entity';
import { TalkChannelMemberEntity } from './entity/talk-channel-member.entity';
import { TalkMessageEntity } from './entity/talk-message.entity';
import { TalkReadStatusEntity } from './entity/talk-read-status.entity';
import { TalkReactionEntity } from './entity/talk-reaction.entity';
import { TalkAttachmentEntity } from './entity/talk-attachment.entity';
import { TalkMessageHideEntity } from './entity/talk-message-hide.entity';
import { ContentTranslationEntity } from '../translation/entity/content-translation.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { FileModule } from '../../infrastructure/file/file.module';
import { NotificationModule } from '../notification/notification.module';
import { ChannelService } from './service/channel.service';
import { MessageService } from './service/message.service';
import { MessageTranslateService } from './service/message-translate.service';
import { TalkSseService } from './service/talk-sse.service';
import { PresenceService } from './service/presence.service';
import { ChannelController } from './controller/channel.controller';
import { MessageController, TalkSseController } from './controller/message.controller';
import { PresenceController } from './controller/presence.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TalkChannelEntity,
      TalkChannelMemberEntity,
      TalkMessageEntity,
      TalkReadStatusEntity,
      TalkReactionEntity,
      TalkAttachmentEntity,
      TalkMessageHideEntity,
      ContentTranslationEntity,
      UserEntity,
      SvcClientEntity,
    ]),
    FileModule,
    NotificationModule,
  ],
  controllers: [ChannelController, MessageController, TalkSseController, PresenceController],
  providers: [ChannelService, MessageService, MessageTranslateService, TalkSseService, PresenceService],
  exports: [TalkSseService],
})
export class AmoebaTalkModule {}
