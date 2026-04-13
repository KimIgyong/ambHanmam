import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from '../service/search.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('통합 검색')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '통합 검색' })
  async search(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Query('q') q?: string,
    @Query('modules') modules?: string,
    @Query('tags') tags?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const data = await this.searchService.search({
      entityId: req.entityId,
      userId: user.userId,
      q,
      modules: modules ? modules.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tags')
  @ApiOperation({ summary: '태그 자동완성 검색' })
  async searchTags(
    @Req() req: any,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.searchService.searchTags(req.entityId, q, limit ? parseInt(limit, 10) : 10);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
