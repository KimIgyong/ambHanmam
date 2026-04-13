import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkItemService } from '../service/work-item.service';
import { CreateWorkItemRequest } from '../dto/request/create-work-item.request';
import { UpdateWorkItemRequest } from '../dto/request/update-work-item.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@Controller('work-items')
@UseGuards(EntityGuard, AuthGuard('jwt'))
export class WorkItemController {
  constructor(private readonly workItemService: WorkItemService) {}

  @Get()
  async getMyWorkItems(
    @CurrentUser() user: UserPayload,
    @Query('type') type?: string,
    @Query('visibility') visibility?: string,
    @Query('scope') scope?: 'MY' | 'SHARED' | 'TEAM' | 'ALL',
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req?: any,
  ) {
    return {
      success: true,
      data: await this.workItemService.getMyWorkItems(
        user.userId,
        user.role,
        { type, visibility, scope, search },
        parseInt(page),
        parseInt(limit),
        req?.entityId,
      ),
    };
  }

  @Get(':id')
  async getWorkItem(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return {
      success: true,
      data: await this.workItemService.getWorkItem(id, user.userId, user.role),
    };
  }

  @Post()
  async createWorkItem(
    @Body() dto: CreateWorkItemRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const entityId = req.headers['x-entity-id'] || user.entityId || '';
    return {
      success: true,
      data: await this.workItemService.createWorkItem(dto, user.userId, entityId),
    };
  }

  @Put(':id')
  async updateWorkItem(
    @Param('id') id: string,
    @Body() dto: UpdateWorkItemRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return {
      success: true,
      data: await this.workItemService.updateWorkItem(id, dto, user.userId, user.role),
    };
  }

  @Delete(':id')
  async deleteWorkItem(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.workItemService.deleteWorkItem(id, user.userId, user.role);
    return { success: true };
  }
}
