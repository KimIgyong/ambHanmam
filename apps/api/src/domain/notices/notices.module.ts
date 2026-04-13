import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeEntity } from './entity/notice.entity';
import { NoticeAttachmentEntity } from './entity/notice-attachment.entity';
import { NoticeReadEntity } from './entity/notice-read.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { NoticeService } from './service/notice.service';
import { NoticeController } from './controller/notice.controller';
import { FileModule } from '../../infrastructure/file/file.module';
import { HrModule } from '../hr/hr.module';
import { TranslationModule } from '../translation/translation.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoticeEntity, NoticeAttachmentEntity, NoticeReadEntity, UserEntity]),
    FileModule,
    HrModule,
    TranslationModule,
    MembersModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticesModule {}
