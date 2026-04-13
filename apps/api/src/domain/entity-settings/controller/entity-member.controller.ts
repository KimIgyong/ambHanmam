import {
  Controller, Get, Post, Put, Delete, Patch, Query, Body, Param, UseGuards,
  ParseUUIDPipe, BadRequestException,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityMemberService } from '../service/entity-member.service';
import { InviteEntityMemberRequest } from '../dto/invite-entity-member.request';
import { UpdateEntityMemberRequest } from '../dto/update-entity-member.request';
import { ResetMemberPasswordRequest } from '../dto/reset-member-password.request';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings')
export class EntityMemberController {
  constructor(private readonly memberService: EntityMemberService) {}

  @Get('members')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMembers(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.findMembers(entityId, user);
    return { success: true, data };
  }

  @Post('members/invite')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async inviteMember(
    @Body() dto: InviteEntityMemberRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.memberService.inviteMember(dto, user);
    return { success: true, data };
  }

  @Patch('members/:userId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateMember(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: UpdateEntityMemberRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.updateMember(userId, entityId, dto, user);
    return { success: true, data };
  }

  @Get('invitations')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getInvitations(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.findInvitations(entityId, user);
    return { success: true, data };
  }

  @Patch('invitations/:id/cancel')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async cancelInvitation(
    @Param('id', ParseUUIDPipe) invId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.cancelInvitation(invId, entityId, user);
    return { success: true, data };
  }

  @Post('invitations/:id/resend')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async resendInvitation(
    @Param('id', ParseUUIDPipe) invId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.resendInvitation(invId, entityId, user);
    return { success: true, data };
  }

  @Put('members/:userId/unit')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async changeMemberUnit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() body: { unit_id: string },
    @CurrentUser() user: UserPayload,
  ) {
    if (!body.unit_id) throw new BadRequestException('unit_id is required');
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.changeMemberUnit(userId, entityId, body.unit_id, user);
    return { success: true, data };
  }

  @Post('members/:userId/cells')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async addMemberCell(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() body: { cell_id: string },
    @CurrentUser() user: UserPayload,
  ) {
    if (!body.cell_id) throw new BadRequestException('cell_id is required');
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.addMemberCell(userId, entityId, body.cell_id, user);
    return { success: true, data };
  }

  @Delete('members/:userId/cells/:cellId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async removeMemberCell(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('cellId', ParseUUIDPipe) cellId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.removeMemberCell(userId, entityId, cellId, user);
    return { success: true, data };
  }

  @Get('members/:userId/available-employees')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getAvailableEmployees(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.findAvailableEmployees(entityId, user);
    return { success: true, data };
  }

  @Patch('members/:userId/link-employee')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async linkEmployee(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() body: { employee_id: string },
    @CurrentUser() user: UserPayload,
  ) {
    if (!body.employee_id) throw new BadRequestException('employee_id is required');
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.linkEmployee(userId, entityId, body.employee_id, user);
    return { success: true, data };
  }

  @Patch('members/:userId/unlink-employee')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async unlinkEmployee(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.unlinkEmployee(userId, entityId, user);
    return { success: true, data };
  }

  @Post('members/:userId/reset-password')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async resetMemberPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() body: ResetMemberPasswordRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const mode = body?.mode || 'email';
    const data = await this.memberService.resetMemberPassword(userId, entityId, user, mode);
    return { success: true, data };
  }

  @Delete('members/:userId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async removeMember(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.removeMember(userId, entityId, user);
    return { success: true, data };
  }

  @Delete('invitations/:id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async deleteInvitation(
    @Param('id', ParseUUIDPipe) invId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.memberService.deleteInvitation(invId, entityId, user);
    return { success: true, data };
  }
}
