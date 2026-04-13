import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../global/decorator/public.decorator';
import { SiteSettingsService } from '../service/site-settings.service';

@Controller('settings/site')
export class SiteIndexPageController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get('index-page')
  @Public()
  async getIndexPage() {
    const data = await this.siteSettingsService.getIndexPage();
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
