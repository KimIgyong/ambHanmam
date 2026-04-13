import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { EpicService } from '../service/epic.service';
import { CreateEpicRequest } from '../dto/request/create-epic.request';
import { UpdateEpicRequest } from '../dto/request/update-epic.request';

@ApiTags('Project Epic Management')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('project/projects/:projectId/epics')
export class EpicController {
  constructor(private readonly epicService: EpicService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Create Epic' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEpicRequest,
    @Req() req: any,
  ) {
    const data = await this.epicService.create(projectId, dto, req.user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: 'List Epics' })
  async findAll(
    @Param('projectId') projectId: string,
    @Query('include_closed') includeClosed: string,
    @Req() req: any,
  ) {
    const data = await this.epicService.findAll(projectId, req.entityId, includeClosed === 'true');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':epicId')
  @ApiOperation({ summary: 'Get Epic detail' })
  async findById(
    @Param('epicId') epicId: string,
    @Req() req: any,
  ) {
    const data = await this.epicService.findById(epicId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':epicId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Update Epic' })
  async update(
    @Param('epicId') epicId: string,
    @Body() dto: UpdateEpicRequest,
    @Req() req: any,
  ) {
    const data = await this.epicService.update(epicId, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':epicId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Delete Epic (Soft)' })
  async remove(
    @Param('epicId') epicId: string,
    @Req() req: any,
  ) {
    await this.epicService.remove(epicId, req.entityId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
