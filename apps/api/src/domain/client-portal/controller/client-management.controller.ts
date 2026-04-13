import {
  Controller, Get, Post, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientAuthService } from '../service/client-auth.service';
import { ClientInviteRequest } from '../dto/client-invite.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { Roles } from '../../../global/decorator/roles.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';

@ApiTags('Client Management')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('client-management')
export class ClientManagementController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Post('invite')
  @Roles('MANAGER')
  @ApiOperation({ summary: '고객 담당자 초대' })
  async invite(@Body() dto: ClientInviteRequest, @CurrentUser() user: UserPayload) {
    const data = await this.clientAuthService.createInvitation(
      dto.email, dto.cli_id, user.userId, dto.name, dto.role,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('invitations')
  @Roles('MANAGER')
  @ApiOperation({ summary: '초대 목록 조회' })
  async getInvitations(@Query('cli_id') cliId?: string) {
    const data = await this.clientAuthService.getInvitations(cliId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
