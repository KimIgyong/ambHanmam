import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SmtpSettingsService } from '../service/smtp-settings.service';
import { UpdateSmtpSettingsRequest } from '../dto/request/update-smtp-settings.request';
import { AdminGuard } from '../guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@Controller('settings/smtp')
@UseGuards(AdminGuard)
export class SmtpSettingsController {
  constructor(private readonly smtpSettingsService: SmtpSettingsService) {}

  @Get()
  getSettings() {
    return this.smtpSettingsService.getSettings();
  }

  @Put()
  updateSettings(
    @Body() dto: UpdateSmtpSettingsRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.smtpSettingsService.updateSettings(dto, user.userId);
  }

  @Post('test')
  testConnection(@Body() dto: UpdateSmtpSettingsRequest) {
    return this.smtpSettingsService.testConnection(dto);
  }
}
