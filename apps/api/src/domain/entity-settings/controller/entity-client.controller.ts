import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityClientService } from '../service/entity-client.service';
import { resolveEntityId } from '../util/resolve-entity-id';

@ApiTags('Entity Settings - Clients')
@Controller('entity-settings')
export class EntityClientController {
  constructor(private readonly clientService: EntityClientService) {}

  @Get('clients')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity 소속 고객사 목록' })
  async getClients(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.findClients(entityId);
    return { success: true, data };
  }

  @Get('clients/:cliId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '고객사 상세' })
  async getClientDetail(
    @Param('cliId', ParseUUIDPipe) cliId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.findClientDetail(entityId, cliId);
    return { success: true, data };
  }

  @Post('clients')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '고객사 등록' })
  async createClient(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: { company_name: string; code: string; type?: string; country?: string; industry?: string; note?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.createClient(entityId, dto);
    return { success: true, data };
  }

  @Patch('clients/:cliId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '고객사 수정' })
  async updateClient(
    @Param('cliId', ParseUUIDPipe) cliId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: { company_name?: string; type?: string; country?: string; industry?: string; status?: string; note?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.updateClient(entityId, cliId, dto);
    return { success: true, data };
  }

  @Delete('clients/:cliId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '고객사 삭제' })
  async deleteClient(
    @Param('cliId', ParseUUIDPipe) cliId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.deleteClient(entityId, cliId);
    return { success: true, data };
  }

  @Post('clients/:cliId/invite')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '고객 담당자 초대' })
  async inviteClient(
    @Param('cliId', ParseUUIDPipe) cliId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: { email: string; name?: string; role?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.inviteClient(entityId, cliId, dto, user.userId);
    return { success: true, data };
  }

  @Post('clients/:cliId/invitations/:civId/resend')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '초대 재발송' })
  async resendInvitation(
    @Param('cliId', ParseUUIDPipe) cliId: string,
    @Param('civId', ParseUUIDPipe) civId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.resendInvitation(entityId, cliId, civId);
    return { success: true, data };
  }

  @Delete('clients/:cliId/invitations/:civId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '초대 취소' })
  async cancelInvitation(
    @Param('cliId', ParseUUIDPipe) cliId: string,
    @Param('civId', ParseUUIDPipe) civId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.clientService.cancelInvitation(entityId, cliId, civId);
    return { success: true, data };
  }
}
