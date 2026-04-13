import { Controller, Post, Delete, Get, Body, Headers, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { PushService } from '../service/push.service';

class SubscribeDto {
  @IsString()
  endpoint: string;

  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

class UnsubscribeDto {
  @IsString()
  endpoint: string;
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-key')
  getVapidKey() {
    return {
      success: true,
      data: { publicKey: this.pushService.getVapidPublicKey() },
    };
  }

  @Post('test')
  async testPush(@CurrentUser() user: UserPayload) {
    await this.pushService.sendPush(user.userId, {
      title: 'AMA Push Test',
      body: `Test notification at ${new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
      data: { url: '/' },
    });
    return { success: true };
  }

  @Post('subscribe')
  async subscribe(
    @CurrentUser() user: UserPayload,
    @Body() dto: SubscribeDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.pushService.subscribe(
      user.userId,
      user.entityId,
      dto.endpoint,
      dto.p256dh,
      dto.auth,
      userAgent,
    );
    return { success: true };
  }

  @Delete('subscribe')
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.pushService.unsubscribe(dto.endpoint);
    return { success: true };
  }
}
