import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { AssetRequestService } from '../service/asset-request.service';
import { CreateAssetRequestRequest } from '../dto/request/create-asset-request.request';
import { UpdateAssetRequestRequest } from '../dto/request/update-asset-request.request';
import { ApproveAssetRequestRequest } from '../dto/request/approve-asset-request.request';

type EntityRequest = Request & { entityId: string };

@ApiTags('Asset Requests')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('asset-requests')
export class AssetRequestController {
  constructor(private readonly assetRequestService: AssetRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create draft asset request' })
  async createDraft(
    @Body() request: CreateAssetRequestRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
  ) {
    const data = await this.assetRequestService.createDraft(request, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update draft asset request' })
  async updateDraft(
    @Param('id') id: string,
    @Body() request: UpdateAssetRequestRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
  ) {
    const data = await this.assetRequestService.updateDraft(id, request, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit asset request for approval' })
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
  ) {
    const data = await this.assetRequestService.submit(id, user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel submitted request by requester' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
  ) {
    await this.assetRequestService.cancel(id, user.userId, req.entityId);
    return { success: true, data: true, timestamp: new Date().toISOString() };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my asset requests' })
  async getMyRequests(
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
    @Query('status') status?: string,
    @Query('request_type') requestType?: string,
  ) {
    const data = await this.assetRequestService.getMyRequests(user.userId, req.entityId, {
      status,
      request_type: requestType,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('approvals')
  @ApiOperation({ summary: 'Get approval queue for manager/admin' })
  async getApprovals(
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
    @Query('status') status?: string,
    @Query('request_type') requestType?: string,
  ) {
    const data = await this.assetRequestService.getApprovalRequests(
      user.userId,
      user.role,
      req.entityId,
      { status, request_type: requestType },
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset request detail' })
  async getDetail(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
  ) {
    const data = await this.assetRequestService.getRequestById(id, user.userId, user.role, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject request (manager/admin)' })
  async approveOrReject(
    @Param('id') id: string,
    @Body() request: ApproveAssetRequestRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: EntityRequest,
  ) {
    const data = await this.assetRequestService.approveOrReject(
      id,
      request,
      user.userId,
      user.role,
      req.entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
