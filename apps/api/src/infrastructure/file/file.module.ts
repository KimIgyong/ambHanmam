import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { SubscriptionModule } from '../../domain/subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
