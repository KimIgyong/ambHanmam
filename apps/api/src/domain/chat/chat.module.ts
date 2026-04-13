import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './entity/conversation.entity';
import { MessageEntity } from './entity/message.entity';
import { WorkItemEntity } from '../acl/entity/work-item.entity';
import { ChatService } from './service/chat.service';
import { ChatController } from './controller/chat.controller';
import { AgentModule } from '../agent/agent.module';
import { HrModule } from '../hr/hr.module';
import { KmsModule } from '../kms/kms.module';
import { IssuesModule } from '../issues/issues.module';
import { MeetingNotesModule } from '../meeting-notes/meeting-notes.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, MessageEntity, WorkItemEntity]),
    AgentModule,
    HrModule,
    KmsModule,
    IssuesModule,
    MeetingNotesModule,
    SubscriptionModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
