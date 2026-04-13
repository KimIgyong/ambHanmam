import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SiteSettingsService } from '../service/site-settings.service';
import { UpdateSiteSettingsRequest } from '../dto/request/update-site-settings.request';
import { AdminGuard } from '../guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@Controller('settings/site')
@UseGuards(AdminGuard)
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: UserPayload) {
    return this.siteSettingsService.getSettings(user.entityId);
  }

  @Put()
  updateSettings(
    @Body() dto: UpdateSiteSettingsRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.siteSettingsService.updateSettings(user.entityId, dto, user.userId);
  }
}
