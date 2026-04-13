import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelService } from '../service/channel.service';
import { TalkSseService } from '../service/talk-sse.service';
import { CreateChannelRequest } from '../dto/request/create-channel.request';
import { UpdateChannelRequest } from '../dto/request/update-channel.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Lobby Chat - Channels')
@ApiBearerAuth()
@Controller('talk/channels')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly sseService: TalkSseService,
  ) {}

  private resolveEntityId(user: UserPayload): string {
    return user.entityId || user.companyId || '';
  }

  private assertNotClient(user: UserPayload): void {
    if (user.level === 'CLIENT_LEVEL') {
      throw new ForbiddenException('Client users are not allowed to perform this action');
    }
  }

  @Get()
  @ApiOperation({ summary: '내 채널 목록 조회' })
  async getMyChannels(@CurrentUser() user: UserPayload) {
    const data = await this.channelService.getMyChannels(user.userId, this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('members')
  @ApiOperation({ summary: '같은 법인 사용자 목록 (DM 대상 선택용)' })
  async getEntityMembers(@CurrentUser() user: UserPayload) {
    const data = await this.channelService.getEntityMembers(this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('client-members')
  @ApiOperation({ summary: '같은 법인 클라이언트 사용자 목록 (채널 초대용)' })
  async getClientMembers(@CurrentUser() user: UserPayload) {
    this.assertNotClient(user);
    const data = await this.channelService.getClientMembers(this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('unread')
  @ApiOperation({ summary: '읽지 않은 메시지 수 조회' })
  async getUnreadCounts(@CurrentUser() user: UserPayload) {
    const data = await this.channelService.getUnreadCounts(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '채널 상세 조회' })
  async getChannelDetail(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.channelService.getChannelDetail(id, user.userId, this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('dm')
  @ApiOperation({ summary: 'DM 채널 찾기 또는 생성' })
  async findOrCreateDm(
    @Body('target_user_id') targetUserId: string,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertNotClient(user);
    const data = await this.channelService.findOrCreateDm(targetUserId, user.userId, this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '채널 생성' })
  async createChannel(
    @Body() dto: CreateChannelRequest,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertNotClient(user);
    const data = await this.channelService.createChannel(dto, user.userId, this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '채널 수정' })
  async updateChannel(
    @Param('id') id: string,
    @Body() dto: UpdateChannelRequest,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertNotClient(user);
    const data = await this.channelService.updateChannel(id, dto, user.userId, this.resolveEntityId(user));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '채널 삭제' })
  async deleteChannel(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertNotClient(user);
    await this.channelService.deleteChannel(id, user.userId, this.resolveEntityId(user));
  }

  @Post(':id/members')
  @ApiOperation({ summary: '채널 멤버 추가' })
  async addMember(
    @Param('id') id: string,
    @Body('user_id') targetUserId: string,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertNotClient(user);
    await this.channelService.addMember(id, targetUserId, user.userId, this.resolveEntityId(user));

    // 시스템 메시지 생성
    const targetUser = await this.channelService.getEntityMembers(this.resolveEntityId(user));
    const targetName = targetUser.find((u) => u.userId === targetUserId)?.name || 'Unknown';
    const sysMsg = await this.channelService.createSystemMessage(id, `${targetName} has joined the channel.`);
    this.sseService.emit({ channelId: id, type: 'message:new', data: { messageId: sysMsg.msgId, type: 'SYSTEM' } });

    this.sseService.emit({ channelId: id, type: 'member:join', data: { userId: targetUserId } });
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '채널 멤버 제거 / 나가기' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: UserPayload,
  ) {
    this.assertNotClient(user);

    // 시스템 메시지 생성 (멤버 제거 전에 이름 조회)
    const entityMembers = await this.channelService.getEntityMembers(this.resolveEntityId(user));
    const targetName = entityMembers.find((u) => u.userId === targetUserId)?.name || 'Unknown';
    const isSelf = targetUserId === user.userId;
    const systemContent = isSelf
      ? `${targetName} has left the channel.`
      : `${targetName} has been removed from the channel.`;

    await this.channelService.removeMember(id, targetUserId, user.userId, this.resolveEntityId(user));

    const sysMsg = await this.channelService.createSystemMessage(id, systemContent);
    this.sseService.emit({ channelId: id, type: 'message:new', data: { messageId: sysMsg.msgId, type: 'SYSTEM' } });

    this.sseService.emit({ channelId: id, type: 'member:leave', data: { userId: targetUserId } });
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: '채널 아카이브' })
  async archiveChannel(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.channelService.archiveChannel(id, user.userId, this.resolveEntityId(user));
    this.sseService.emit({ channelId: id, type: 'channel:archive', data: { userId: user.userId } });
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: '채널 아카이브 해제' })
  async unarchiveChannel(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.channelService.unarchiveChannel(id, user.userId, this.resolveEntityId(user));
    this.sseService.emit({ channelId: id, type: 'channel:unarchive', data: { userId: user.userId } });
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Delete(':id/dm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '빈 DM 채널 삭제' })
  async deleteDmChannel(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.channelService.deleteDmChannel(id, user.userId);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: '채널 고정/고정해제 토글' })
  async togglePin(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.channelService.togglePin(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/read')
  @ApiOperation({ summary: '채널 읽음 표시' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.channelService.markAsRead(id, user.userId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Patch(':id/mute')
  @ApiOperation({ summary: '채널 알림 뮤트/해제 토글' })
  async toggleMute(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.channelService.toggleMute(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
