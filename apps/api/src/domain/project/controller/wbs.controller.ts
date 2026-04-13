import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { WbsService } from '../service/wbs.service';
import { UpdateIssueGroupRequest } from '../dto/request/update-issue-group.request';

@ApiTags('Project WBS')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('project/projects/:projectId/wbs')
export class WbsController {
  constructor(private readonly wbsService: WbsService) {}

  @Get()
  @ApiOperation({ summary: 'Get WBS tree' })
  async getWbsTree(
    @Param('projectId') projectId: string,
    @Query('include_closed') includeClosed: string,
    @Req() req: any,
  ) {
    const data = await this.wbsService.getWbsTree(projectId, req.entityId, includeClosed === 'true');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('issues/:issueId/group')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Update issue group (Epic/Component/Unassigned)' })
  async updateIssueGroup(
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateIssueGroupRequest,
    @Req() req: any,
  ) {
    await this.wbsService.updateIssueGroup(projectId, issueId, dto, req.entityId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
