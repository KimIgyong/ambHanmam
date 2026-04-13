import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { ComponentService } from '../service/component.service';
import { CreateComponentRequest } from '../dto/request/create-component.request';
import { UpdateComponentRequest } from '../dto/request/update-component.request';

@ApiTags('Project Component Management')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('project/projects/:projectId/components')
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Create Component' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateComponentRequest,
    @Req() req: any,
  ) {
    const data = await this.componentService.create(projectId, dto, req.user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: 'List Components' })
  async findAll(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    const data = await this.componentService.findAll(projectId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':componentId')
  @ApiOperation({ summary: 'Get Component detail' })
  async findById(
    @Param('componentId') componentId: string,
    @Req() req: any,
  ) {
    const data = await this.componentService.findById(componentId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':componentId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Update Component' })
  async update(
    @Param('componentId') componentId: string,
    @Body() dto: UpdateComponentRequest,
    @Req() req: any,
  ) {
    const data = await this.componentService.update(componentId, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':componentId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Delete Component (Soft)' })
  async remove(
    @Param('componentId') componentId: string,
    @Req() req: any,
  ) {
    await this.componentService.remove(componentId, req.entityId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
