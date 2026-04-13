import { Controller, Get, Query, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { CmsSubscriberService } from '../service/cms-subscriber.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

@Controller('cms/pages/:pageId/subscribers')
@UseGuards(JwtAuthGuard, ManagerGuard)
export class CmsSubscriberController {
  constructor(private readonly subscriberService: CmsSubscriberService) {}

  @Get()
  async getSubscribers(
    @Param('pageId') pageId: string,
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.subscriberService.getSubscribers(pageId, entId, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('export')
  async exportCsv(
    @Param('pageId') pageId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const csv = await this.subscriberService.exportCsv(pageId, entId);
    const filename = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }
}
